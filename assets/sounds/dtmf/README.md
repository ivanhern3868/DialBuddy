# DTMF Tone Audio Files

## Files

- 10 WAV files: 0.wav through 9.wav
- Format: 16-bit PCM, 44.1 kHz, mono
- Duration: 200ms per tone
- Size: ~90 KB per file (total ~900 KB)

## DTMF Frequency Pairs (ITU-T Q.23 Standard)

| Digit | Low Freq (Hz) | High Freq (Hz) |
|-------|---------------|----------------|
| 1     | 697           | 1209           |
| 2     | 697           | 1336           |
| 3     | 697           | 1477           |
| 4     | 770           | 1209           |
| 5     | 770           | 1336           |
| 6     | 770           | 1477           |
| 7     | 852           | 1209           |
| 8     | 852           | 1336           |
| 9     | 852           | 1477           |
| 0     | 941           | 1336           |

## Production Optimization

To convert to MP3 (reduces size from ~900KB to ~45KB):

```bash
# Requires ffmpeg
cd assets/sounds/dtmf
for file in *.wav; do
    ffmpeg -i "$file" -b:a 128k "${file%.wav}.mp3"
done
```

## Usage in App

These files are preloaded via expo-av:

```typescript
import { Audio } from 'expo-av';

const { sound } = await Audio.Sound.createAsync(
  require('../assets/sounds/dtmf/5.wav')
);
await sound.playAsync();
```

## Generated

- Script: `scripts/generate-dtmf-wav.py`
- Date: 2024-01-15
- By: Ivan (Initial Setup)
