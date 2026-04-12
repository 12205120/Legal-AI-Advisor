import os
import time
import logging
from knowledge_vault import vault

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("NyayaAI_CoreIndexer")

DATA_DIR = "data"

# These are the priority acts requested by the user for "Complete Knowledge"
CORE_FILES = [
    "BNS2023.pdf", # Bharatiya Nyaya Sanhita 2023
    "bnss.pdf",    # Bharatiya Nagarik Suraksha Sanhita
    "bsa.pdf",     # Bharatiya Sakshya Adhiniyam
    "ipc pdf.pdf", # Indian Penal Code (Legacy context)
    "the_code_of_criminal_procedure,_1973.pdf", # CrPC
    "BNSS_Handbook_English.pdf",
    "Legal AI Prediction Model.pdf",
    "Department of legal affairs at a glance.pdf"
]

def index_priority():
    if not os.path.exists(DATA_DIR):
        logger.error(f"Data directory {DATA_DIR} not found.")
        return

    logger.info(f"Starting PRIORITY indexing for {len(CORE_FILES)} core acts...")
    
    total_indexed = 0
    start_time = time.time()

    for i, filename in enumerate(CORE_FILES):
        file_path = os.path.join(DATA_DIR, filename)
        if not os.path.exists(file_path):
            logger.warning(f"File {filename} not found in {DATA_DIR}. Skipping.")
            continue
            
        logger.info(f"[{i+1}/{len(CORE_FILES)}] Analyzing CORE ACT: {filename}...")
        
        try:
            # Add to vault (now has chunk-level retries and 180s timeout)
            chunk_count = vault.add_pdf(file_path)
            total_indexed += chunk_count
            logger.info(f"Successfully memorized {chunk_count} paragraphs from {filename}.")
            
            # Save after every core act
            vault.save()
            logger.info(f"Vault synchronized with {filename}.")
            
            # Brief cooldown to keep hardware stable
            time.sleep(2)
            
        except Exception as e:
            logger.error(f"Failed to analyze {filename}: {e}")

    end_time = time.time()
    logger.info(f"PRIORITY INDEXING COMPLETE! {total_indexed} chunks added.")
    logger.info(f"Time taken: {end_time - start_time:.2f}s")
    logger.info("The AI Brain is now knowledgeable of the core Indian Legal Acts.")

if __name__ == "__main__":
    index_priority()
