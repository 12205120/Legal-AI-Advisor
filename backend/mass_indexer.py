import os
import json
import requests
import faiss
import numpy as np
from pypdf import PdfReader

# Configuration
VAULT_PATH = "knowledge_vault.index"
META_PATH = "knowledge_meta.json"
OLLAMA_EMBED_URL = "http://127.0.0.1:11434/api/embeddings"
MODEL = "nomic-embed-text"

class MassIndexer:
    def __init__(self):
        self.dimension = 768
        if os.path.exists(VAULT_PATH):
            self.index = faiss.read_index(VAULT_PATH)
            with open(META_PATH, "r") as f:
                self.metadata = json.load(f)
        else:
            self.index = faiss.IndexFlatL2(self.dimension)
            self.metadata = []

    def get_embedding(self, text):
        try:
            res = requests.post(OLLAMA_EMBED_URL, json={"model": MODEL, "prompt": text})
            return np.array(res.json()["embedding"], dtype="float32")
        except:
            return None

    def index_directory(self, directory):
        print(f"Starting mass indexing of: {directory}")
        for filename in os.listdir(directory):
            if filename.endswith(".pdf"):
                self.index_pdf(os.path.join(directory, filename))
            elif filename.endswith(".json"):
                self.index_json(os.path.join(directory, filename))
        
        self.save()

    def index_pdf(self, path):
        print(f"Indexing PDF: {path}")
        reader = PdfReader(path)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        
        # Split into 1000-character chunks
        chunks = [text[i:i+1000] for i in range(0, len(text), 800)]
        for i, chunk in enumerate(chunks):
            vector = self.get_embedding(chunk)
            if vector is not None:
                self.index.add(np.array([vector]))
                self.metadata.append({
                    "text": chunk,
                    "source": os.path.basename(path),
                    "type": "Case Law / Statute"
                })

    def save(self):
        faiss.write_index(self.index, VAULT_PATH)
        with open(META_PATH, "w") as f:
            json.dump(self.metadata, f)
        print("Vault updated successfully!")

if __name__ == "__main__":
    indexer = MassIndexer()
    # You can point this to any folder where you download legal PDFs
    # indexer.index_directory("./legal_downloads")
    print("Indexer ready. Place your legal PDFs in './legal_downloads' and uncomment the line above.")
