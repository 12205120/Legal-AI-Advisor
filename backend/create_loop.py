import os
import subprocess
import edge_tts
import asyncio

async def generate():
    os.makedirs('temp', exist_ok=True)
    audio_path = 'temp/loop_audio.mp3'
    # Put it directly into the Next.js public directory
    video_out = '../public/sara-talking.mp4'
    face_img = '../public/sara-human.jpg'
    
    if not os.path.exists(face_img):
        print('Skipping: sara-human.jpg not found')
        return

    print("Generating audio for loop...")
    comm = edge_tts.Communicate("Milord, I am Sara, your virtual humanoid assistant. I am preparing the arguments for this case. My system is ready for the virtual court.", "en-IN-NeerjaNeural")
    await comm.save(audio_path)
    
    print("Running Wav2Lip GAN. This might take 30-60 seconds...")
    cmd = [
        '.\\venv\\Scripts\\python.exe', 'Wav2Lip/inference.py',
        '--checkpoint_path', 'checkpoints/wav2lip_gan.pth',
        '--face', face_img,
        '--audio', audio_path,
        '--outfile', video_out,
        '--nosmooth'
    ]
    subprocess.run(cmd)
    
    if os.path.exists(video_out):
        print(f"SUCCESS: Generated {video_out}")
    else:
        print("FAILED to generate Wav2Lip output.")

if __name__ == "__main__":
    asyncio.run(generate())
