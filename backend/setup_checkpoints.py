import os
import requests
from tqdm import tqdm


def download_file(url, destination):
    # Overwrite if file is small (like a 29-byte Git LFS pointer)
    if os.path.exists(destination) and os.path.getsize(destination) > 1_000_000:
        print(f"--- [EXISTS] {destination} ({os.path.getsize(destination):,} bytes) ---")
        return
    
    print(f"--- [DOWNLOADING] {destination} ---")
    response = requests.get(url, stream=True)
    total_size = int(response.headers.get('content-length', 0))

    with open(destination, 'wb') as file, tqdm(
        total=total_size, unit='B', unit_scale=True, desc=destination
    ) as bar:
        for data in response.iter_content(chunk_size=8192):
            file.write(data)
            bar.update(len(data))

    final_size = os.path.getsize(destination)
    print(f"--- [DONE] {destination} ({final_size:,} bytes) ---")


# 1. CREATE DIRECTORY STRUCTURE
for path in ["checkpoints", "temp", "Wav2Lip/face_detection/detection/sfd"]:
    os.makedirs(path, exist_ok=True)

# 2. DEFINE MODEL URLS
models = {
    "checkpoints/wav2lip_gan.pth": (
        "https://huggingface.co/justinjohn0306/Wav2Lip/resolve/main/wav2lip_gan.pth"
    ),
    "Wav2Lip/face_detection/detection/sfd/s3fd.pth": (
        "https://www.adrianbulat.com/downloads/python-fan/s3fd-619a316812.pth"
    ),
}

if __name__ == "__main__":
    print("NYAYAAI NEURAL INITIALIZER: Downloading Wav2Lip model weights...")
    for local_path, url in models.items():
        try:
            download_file(url, local_path)
        except Exception as e:
            print(f"Error downloading {local_path}: {e}")

    print("\n--- DOWNLOAD COMPLETE ---")
    for p in models:
        size = os.path.getsize(p) if os.path.exists(p) else 0
        status = "OK" if size > 1_000_000 else "MISSING/INCOMPLETE"
        print(f"  {p}: {size:,} bytes [{status}]")