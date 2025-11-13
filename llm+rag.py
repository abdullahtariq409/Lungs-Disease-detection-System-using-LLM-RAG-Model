import os
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings  # ✅ New import
from langchain.chat_models import ChatOpenAI
from langchain.chains import RetrievalQA




# 📂 Load PDFs
pdf_folder_path = r"E:\chest_xray\01. LLM medical diagnosis report generation Mayo"
all_docs = []

for filename in os.listdir(pdf_folder_path):
    if filename.endswith(".pdf"):
        loader = PyPDFLoader(os.path.join(pdf_folder_path, filename))
        all_docs.extend(loader.load())

print(f"✅ Loaded {len(all_docs)} documents.")

# ✂️ Split into chunks
splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
split_docs = splitter.split_documents(all_docs)

# 🔍 Embed with OpenAI + Create FAISS DB
embedding = OpenAIEmbeddings()
db = FAISS.from_documents(split_docs, embedding)
db.save_local("openai_lung_vector_db")
print("✅ FAISS vectorstore saved locally.")

# 🧠 Load vectorstore
retriever = db.as_retriever(search_type="similarity", search_kwargs={"k": 3})
llm = ChatOpenAI(model_name="gpt-3.5-turbo", )

# 🔁 Setup RetrievalQA Chain
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=retriever,
    return_source_documents=True
)

# ❓ Ask a question
query = "What are the post-diagnosis recommendations for a patient with clear lungs?"
result = qa_chain({"query": query})

# ✅ Output
print("\n🤖 OpenAI GPT-3.5 Response:")
print(result["result"])
