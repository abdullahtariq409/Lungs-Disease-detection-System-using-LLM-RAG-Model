import os
import gradio as gr
import pickle
from pypdf import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain.chat_models import ChatOpenAI
from langchain.embeddings import HuggingFaceEmbeddings

from pdf2image import convert_from_path
import pytesseract

# ✅ Set your OpenRouter API credentials
os.environ["OPENAI_API_KEY"] = ""
os.environ["OPENAI_API_BASE"] = "https://openrouter.ai/api/v1"

# 📁 Folder path
FOLDER_PATH = r"E:\chest_xray\03. LLM medical diagnosis report generation Eric Topol"
PKL_PATH = os.path.join(FOLDER_PATH, "faiss_vector_store.pkl")

# --------- OCR Fallback ---------
def extract_text_with_ocr(pdf_path):
    try:
        pages = convert_from_path(pdf_path, dpi=300)
        extracted = []
        for i, page_image in enumerate(pages):
            text = pytesseract.image_to_string(page_image)
            extracted.append((i + 1, text.strip()))
        return extracted
    except Exception as e:
        print(f"❌ OCR failed for {pdf_path}: {str(e)}")
        return []

# --------- Vector Store Initialization ---------
def build_and_save_vector_store(folder_path, pkl_path):
    print("🔍 Loading PDFs from folder:", folder_path)
    documents = []
    pdf_files = [os.path.join(folder_path, file) for file in os.listdir(folder_path) if file.endswith(".pdf")]
    print(f"📄 Found {len(pdf_files)} PDFs.")

    for path in pdf_files:
        print(f"📘 Processing: {os.path.basename(path)}")
        with open(path, "rb") as f:
            pdf = PdfReader(f)
            for i, page in enumerate(pdf.pages):
                text = page.extract_text()
                print(f"→ Page {i + 1} - Text Extracted: {bool(text)}")
                if text and text.strip():
                    documents.append(Document(
                        page_content=text,
                        metadata={"source": os.path.basename(path), "page": i + 1}
                    ))

            # OCR fallback if no text extracted
            if not any(doc.metadata["source"] == os.path.basename(path) for doc in documents):
                print(f"🔁 Falling back to OCR for: {os.path.basename(path)}")
                ocr_texts = extract_text_with_ocr(path)
                for page_num, text in ocr_texts:
                    if text:
                        documents.append(Document(
                            page_content=text,
                            metadata={"source": os.path.basename(path), "page": page_num}
                        ))

    if not documents:
        raise ValueError("No valid text found in PDFs.")

    print("🧠 Splitting text into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=200)
    chunks = text_splitter.split_documents(documents)

    print("🔗 Generating embeddings...")
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vector_store = FAISS.from_documents(chunks, embedding=embeddings)

    print(f"💾 Saving vector store to {pkl_path}")
    with open(pkl_path, "wb") as f:
        pickle.dump(vector_store, f)

    return vector_store

def load_vector_store(pkl_path):
    print(f"📦 Loading vector store from {pkl_path}")
    with open(pkl_path, "rb") as f:
        return pickle.load(f)

def initialize_rag_with_pkl(folder_path, pkl_path):
    if os.path.exists(pkl_path):
        vector_store = load_vector_store(pkl_path)
    else:
        vector_store = build_and_save_vector_store(folder_path, pkl_path)

    print("🤖 Loading LLM via OpenRouter...")
    llm = ChatOpenAI(
        model_name="mistralai/mixtral-8x7b-instruct",
        temperature=0.3
    )

    pipeline = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=vector_store.as_retriever(search_kwargs={"k": 4}),
        return_source_documents=True
    )
    print("✅ RAG pipeline ready!")
    return pipeline

# --------- Question Answering ---------
def chat_with_rag(chat_history, query, pipeline):
    if pipeline is None:
        return chat_history + [{"role": "user", "content": query}, {"role": "assistant", "content": "❌ Error: PDFs not initialized properly."}], ""

    try:
        response = pipeline.invoke({"query": query})
        answer = response["result"]
        sources = "\n".join(
            f"• {doc.metadata['source']} (page {doc.metadata.get('page', 'N/A')})"
            for doc in response["source_documents"]
        )

        chat_history.append({"role": "user", "content": query})
        chat_history.append({"role": "assistant", "content": answer})

        print("\n📄 Sources used:\n", sources)

        return chat_history, ""
    except Exception as e:
        chat_history.append({"role": "user", "content": query})
        chat_history.append({"role": "assistant", "content": f"❌ Error: {str(e)}"})
        return chat_history, ""

# --------- Gradio Chatbot UI ---------
def create_chatbot_interface():
    pipeline = initialize_rag_with_pkl(FOLDER_PATH, PKL_PATH)
    if pipeline is None:
        print("❌ Error initializing RAG pipeline. Check folder and PDFs.")

    with gr.Blocks(title="OpenRouter PDF Chatbot") as demo:
        gr.Markdown("## 🤖 Chat with Your PDFs using OpenRouter")

        chatbot = gr.Chatbot(label="OpenRouter PDF Chat", type="messages")
        question_input = gr.Textbox(placeholder="Ask something...", label="Your Question")
        chat_history_state = gr.State([])

        question_input.submit(
            fn=lambda chat_history, query: chat_with_rag(chat_history, query, pipeline),
            inputs=[chat_history_state, question_input],
            outputs=[chatbot, question_input],
        )

    return demo

# --------- Run App ---------
if __name__ == "__main__":
    ui = create_chatbot_interface()
    ui.launch(inline=False)