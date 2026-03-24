# DialBuddy Scripts

## DTMF Tone Generation

### Prerequisites

**Required:**
- Python 3.8 or later
- numpy: `pip install numpy`
- scipy: `pip install scipy`

**Optional (for MP3 conversion):**
- ffmpeg (for MP3 conversion - smaller file sizes)
  - Windows: Download from https://ffmpeg.org/download.html and add to PATH
  - Mac: `brew install ffmpeg`
  - Linux: `apt-get install ffmpeg`

### Running the Generator

```bash
# From project root
cd dialbuddy
python scripts/generate-dtmf.py
```

### Output

Without ffmpeg:
- Generates 10 WAV files (0.wav through 9.wav)
- Each file ~90 KB
- Total: ~900 KB

With ffmpeg:
- Generates 10 MP3 files (0.mp3 through 9.mp3)
- Each file ~4 KB
- Total: ~45 KB
- WAV files are automatically deleted after MP3 conversion

### Note for Development

If ffmpeg is not available, the script will use WAV files. React Native's `expo-av` handles both WAV and MP3 formats natively, so this works fine for development. For production builds, MP3 is preferred due to smaller bundle size.

To convert WAV to MP3 later (once ffmpeg is installed):
```bash
# Convert all WAV files to MP3
cd assets/sounds/dtmf
for file in *.wav; do ffmpeg -i "$file" -b:a 128k "${file%.wav}.mp3"; done
```

## Other Scripts

(To be added as development progresses)
