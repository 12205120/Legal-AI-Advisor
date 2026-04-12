import os
import json
import numpy as np
import faiss
import urllib.request
from pypdf import PdfReader
import logging

logger = logging.getLogger("NyayaAI_Vault")

class KnowledgeVault:
    def __init__(self, index_path="knowledge_vault.index", meta_path="knowledge_meta.json"):
        self.index_path = index_path
        self.meta_path = meta_path
        self.ollama_url = "http://127.0.0.1:11434/api/embeddings"
        self.ollama_model = "nomic-embed-text" 
        self.dimension = 768 # nomic-embed-text dimension
        
        # Initialize FAISS index
        if os.path.exists(self.index_path):
            try:
                self.index = faiss.read_index(self.index_path)
                with open(self.meta_path, "r") as f:
                    self.metadata = json.load(f)
                logger.info(f"Loaded existing vault with {len(self.metadata)} chunks.")
            except:
                logger.warning("Could not load existing index, initializing new.")
                self.index = faiss.IndexFlatL2(self.dimension)
                self.metadata = []
        else:
            self.index = faiss.IndexFlatL2(self.dimension)
            self.metadata = []
            logger.info("Initialized new empty Knowledge Vault.")

    def reload(self):
        """Reload the index and metadata from disk to sync with indexer."""
        if os.path.exists(self.index_path):
            try:
                self.index = faiss.read_index(self.index_path)
                with open(self.meta_path, "r") as f:
                    self.metadata = json.load(f)
                logger.info(f"Vault reloaded: {len(self.metadata)} chunks.")
                return True
            except Exception as e:
                logger.error(f"Reload error: {e}")
        return False

    def get_embedding(self, text):
        """Get vector embedding from local Ollama."""
        payload = {
            "model": self.ollama_model,
            "prompt": text
        }
        try:
            req = urllib.request.Request(
                self.ollama_url,
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            with urllib.request.urlopen(req, timeout=180) as response:
                result = json.loads(response.read().decode('utf-8'))
                return np.array(result["embedding"], dtype="float32")
        except Exception as e:
            logger.error(f"Embedding error: {e}")
            return None

    def add_pdf(self, pdf_path):
        """Parse PDF, chunk it smarter, and add to index."""
        reader = PdfReader(pdf_path)
        text_content = ""
        for page in reader.pages:
            text_content += page.extract_text() + "\n"
        
        # Smarter chunking for legal text: Split by sections if possible, or use smaller chunks
        # We look for "Section" or "SEC." or numerical headers
        import re
        sections = re.split(r'(\n(?:Section|SEC\.|Article)\s+\d+)', text_content)
        
        chunks = []
        if len(sections) > 1:
            # Re-combine headers with their following content
            for i in range(1, len(sections), 2):
                header = sections[i].strip()
                body = sections[i+1][:2000] # Limit chunk size
                chunks.append(f"{header}\n{body}")
        else:
            # Fallback to fixed-size chunking if no section markers found
            chunk_size = 700
            overlap = 150
            for i in range(0, len(text_content), chunk_size - overlap):
                chunks.append(text_content[i : i + chunk_size])
            
        new_embeddings = []
        new_meta = []
        
        for i, chunk in enumerate(chunks):
            # Clean text for embedding
            clean_chunk = chunk.strip()
            if len(clean_chunk) < 50: continue # Skip tiny fragments
            
            # Robust Chunk-Level Retry (AI system resilience)
            embedding = None
            for attempt in range(3):
                try:
                    embedding = self.get_embedding(clean_chunk)
                    if embedding is not None: break
                except Exception as e:
                    logger.warning(f"Embedding retry {attempt+1} for chunk in {pdf_path}: {e}")
                    import time
                    time.sleep(2)
            
            if embedding is not None:
                new_embeddings.append(embedding)
                new_meta.append({
                    "text": clean_chunk,
                    "source": os.path.basename(pdf_path),
                    "chunk_id": i
                })
        
        if new_embeddings:
            self.index.add(np.array(new_embeddings))
            self.metadata.extend(new_meta)
            self.save()
            return len(new_meta)
        return 0

    def query(self, text, top_k=5):
        """Search vault with increased diversity for deep context."""
        if not self.metadata:
            return ""
            
        query_embedding = self.get_embedding(text)
        if query_embedding is None:
            return ""
            
        distances, indices = self.index.search(np.array([query_embedding]), top_k)
        
        context = "\n--- RELEVANT LEGAL CONTEXT ---\n"
        for idx in indices[0]:
            if idx < len(self.metadata):
                item = self.metadata[idx]
                context += f"[Source: {item['source']}]\n{item['text']}\n\n"
        
        return context

    def save(self):
        faiss.write_index(self.index, self.index_path)
        with open(self.meta_path, "w") as f:
            json.dump(self.metadata, f)

vault = KnowledgeVault()
