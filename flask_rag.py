import os
import pickle
from flask import Flask, request, jsonify
from pypdf import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain.chat_models import ChatOpenAI
from langchain.embeddings import HuggingFaceEmbeddings
from pdf2image import convert_from_path
import pytesseract
from flask_cors import CORS  # Add this import

# Set OpenRouter API credentials
os.environ["OPENAI_API_KEY"] = "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"
os.environ["OPENAI_API_BASE"] = "https://openrouter.ai/api/v1"

FOLDER_PATH = r"E:\chest_xray\03. LLM medical diagnosis report generation Eric Topol"
PKL_PATH = os.path.join(FOLDER_PATH, "faiss_vector_store.pkl")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

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

def get_pipeline():
    if not os.path.exists(PKL_PATH):
        raise RuntimeError("Vector store not trained. Please POST to /train first.")
    vector_store = load_vector_store(PKL_PATH)
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
    return pipeline

@app.route('/train', methods=['POST'])
def train():
    try:
        build_and_save_vector_store(FOLDER_PATH, PKL_PATH)
        return jsonify({"status": "success", "message": "Training complete and vector store saved."})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/llmanswers', methods=['POST'])
def llm_answers():
    data = request.get_json()
    query = data.get("query", "")
    if not query:
        return jsonify({"status": "error", "message": "No query provided."}), 400
    try:
        pipeline = get_pipeline()
        response = pipeline.invoke({"query": query})
        answer = response["result"]
        sources = [
            {"source": doc.metadata["source"], "page": doc.metadata.get("page", "N/A")}
            for doc in response["source_documents"]
        ]
        return jsonify({
            "status": "success",
            "answer": answer,
            "sources": sources
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5005)