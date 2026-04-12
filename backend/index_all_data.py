import os
import time
import logging
from knowledge_vault import vault

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("NyayaAI_Indexer")

DATA_DIR = "data"
# Core files to prioritize or ensure are included
CORE_FILES = [
    "BNS2023.pdf",
    "bnss.pdf",
    "bsa.pdf",
    "ipc pdf.pdf",
    "the_code_of_criminal_procedure,_1973.pdf",
    "BNSS_Handbook_English.pdf",
    "Legal AI Prediction Model.pdf",
    "Department of legal affairs at a glance.pdf"
]

def index_all():
    if not os.path.exists(DATA_DIR):
        logger.error(f"Data directory {DATA_DIR} not found.")
        return

    # 1. Get all PDFs
    all_files = [f for f in os.listdir(DATA_DIR) if f.lower().endswith(".pdf")]
    
    # 2. Reorder to put core files first
    priority_files = [f for f in all_files if f in CORE_FILES]
    other_files = [f for f in all_files if f not in CORE_FILES]
    files_to_index = priority_files + other_files

    logger.info(f"Found {len(files_to_index)} PDFs to index.")
    
    total_indexed = 0
    start_time = time.time()

    for i, filename in enumerate(files_to_index):
        file_path = os.path.join(DATA_DIR, filename)
        logger.info(f"[{i+1}/{len(files_to_index)}] Indexing {filename}...")
        
        # Check if already indexed (simple check: if filename in metadata)
        # Avoid re-indexing what we just did
        if any(item["source"] == filename for item in vault.metadata):
             logger.info(f"Skipping {filename} - already indexed.")
             continue

        retry_count = 0
        while retry_count < 3:
            try:
                chunk_count = vault.add_pdf(file_path)
                total_indexed += chunk_count
                logger.info(f"Added {chunk_count} chunks from {filename}. Total: {total_indexed}")
                # Polite Delay: Allow Ollama to breathe/handle web requests
                time.sleep(5) 
                break
            except Exception as e:
                retry_count += 1
                logger.warning(f"Retry {retry_count} for {filename} due to: {e}")
                time.sleep(10) # Longer wait on error
        
        # Save every 5 files
        if (i + 1) % 5 == 0:
            vault.save()
            logger.info("Intermediate vault save successful. Taking longer cooldown...")
            time.sleep(10) # 10s cooldown every 5 files

    vault.save()
    end_time = time.time()
    logger.info(f"Indexing complete! Total chunks: {total_indexed}. Time taken: {end_time - start_time:.2f}s")

if __name__ == "__main__":
    index_all()
