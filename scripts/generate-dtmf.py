"""
DTMF Tone Generator for DialBuddy

Business Purpose:
Generate realistic telephone dial tone audio files so children hear authentic
phone feedback when practicing number dialing. This creates muscle memory
association between pressing a number and hearing its corresponding tone.

Technical Details:
- DTMF (Dual-Tone Multi-Frequency) signaling is the standard for telephone keypads
- Each digit produces two simultaneous sine wave frequencies
- Frequency pairs defined by ITU-T Recommendation Q.23 (international standard)
- Duration: 200ms per tone (optimal for child recognition without being too long)

Output:
- 10 MP3 files: 0.mp3 through 9.mp3 in assets/sounds/dtmf/
- Each file is ~4KB (small bundle size for mobile app)

Why MP3 not WAV:
- Smaller file size (critical for app bundle size on mobile)
- expo-av (React Native audio library) handles MP3 natively
- Quality loss is imperceptible for simple tones

Dependencies:
- numpy: Numerical computing (sine wave generation)
- scipy: Scientific computing (WAV file writing)
- subprocess: Shell command execution (ffmpeg for MP3 conversion)

Prerequisites:
- Python 3.8+
- pip install numpy scipy
- ffmpeg installed and in PATH (for MP3 conversion)
  - Windows: Download from https://ffmpeg.org/download.html
  - Mac: brew install ffmpeg
  - Linux: apt-get install ffmpeg

Usage:
    python scripts/generate-dtmf.py

Author: Ivan (DialBuddy Development Team)
Created: 2024-01-15
Last Modified: 2024-01-15
"""

import numpy as np
import os
import subprocess
from pathlib import Path
from scipy.io import wavfile

# =============================================================================
# DTMF Frequency Pairs per ITU-T Recommendation Q.23
# =============================================================================
#
# Business Context: These frequencies are international standards used by ALL
# telephone networks worldwide. Teaching children these exact sounds ensures
# they recognize real phone behavior.
#
# Technical Context: Each digit is the intersection of a low frequency (row)
# and high frequency (column) on the telephone keypad matrix:
#
#              1209 Hz   1336 Hz   1477 Hz   (High Frequency - Columns)
#            +----------+----------+----------+
#   697 Hz   |    1     |    2     |    3     |  (Low Frequency - Row 1)
#            +----------+----------+----------+
#   770 Hz   |    4     |    5     |    6     |  (Row 2)
#            +----------+----------+----------+
#   852 Hz   |    7     |    8     |    9     |  (Row 3)
#            +----------+----------+----------+
#   941 Hz   |    *     |    0     |    #     |  (Row 4)
#            +----------+----------+----------+
#
# We only generate 0-9 (not * or #) as those are not needed for dialing phone numbers.
#
DTMF_FREQUENCIES = {
    '1': (697, 1209),   # Row 1, Column 1
    '2': (697, 1336),   # Row 1, Column 2
    '3': (697, 1477),   # Row 1, Column 3
    '4': (770, 1209),   # Row 2, Column 1
    '5': (770, 1336),   # Row 2, Column 2
    '6': (770, 1477),   # Row 2, Column 3
    '7': (852, 1209),   # Row 3, Column 1
    '8': (852, 1336),   # Row 3, Column 2
    '9': (852, 1477),   # Row 3, Column 3
    '0': (941, 1336),   # Row 4, Column 2
}

# =============================================================================
# Audio Generation Parameters
# =============================================================================

# Sample rate: 44100 Hz (CD quality audio, standard for mobile devices)
# Why 44.1kHz: Nyquist theorem requires >2x highest frequency (1477 Hz * 2 = 2954 Hz)
# 44.1kHz provides plenty of headroom and is the mobile audio standard
SAMPLE_RATE = 44100  # Hz

# Duration: 200 milliseconds per ITU-T recommendation
# Why 200ms: Long enough for clear recognition, short enough to feel responsive
# Real DTMF tones on phones are typically 50-200ms
DURATION = 0.2  # seconds

# Amplitude: 0.3 (30% of maximum volume)
# Why 30%: Prevents clipping when two sine waves are added together
# Also provides comfortable listening volume for children (not too loud)
AMPLITUDE = 0.3

# Output paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
ASSET_DIR = PROJECT_ROOT / "assets" / "sounds" / "dtmf"


def generate_dtmf_tone(digit: str, low_freq: int, high_freq: int) -> np.ndarray:
    """
    Generate a DTMF tone for a single digit.

    Business Logic:
    Creates the audio waveform that children will hear when they tap a number button.
    The dual-tone frequency is what makes it sound like a real phone.

    Technical Implementation:
    1. Create time array (x-axis for the waveform)
    2. Generate two sine waves at specified frequencies
    3. Add the waves together (this is what "dual-tone" means)
    4. Apply amplitude scaling to prevent distortion

    Args:
        digit: The digit character ('0'-'9')
        low_freq: Lower frequency in Hz (row frequency)
        high_freq: Higher frequency in Hz (column frequency)

    Returns:
        NumPy array of audio samples (mono, 16-bit equivalent range)

    Example:
        For digit '5': low_freq=770 Hz, high_freq=1336 Hz
        Output: 8820 samples (0.2 sec * 44100 samples/sec) representing
                the combined 770+1336 Hz tone
    """
    # Generate time array: 0 to DURATION seconds, sampled at SAMPLE_RATE
    # Example: For 0.2 sec at 44100 Hz, this creates 8820 time points
    num_samples = int(SAMPLE_RATE * DURATION)
    time_array = np.linspace(0, DURATION, num_samples, endpoint=False)

    # Generate low frequency sine wave
    # Formula: A * sin(2π * f * t)
    # Where: A = amplitude, f = frequency, t = time
    low_wave = AMPLITUDE * np.sin(2 * np.pi * low_freq * time_array)

    # Generate high frequency sine wave
    high_wave = AMPLITUDE * np.sin(2 * np.pi * high_freq * time_array)

    # Combine the two waves (this is the "dual-tone" part of DTMF)
    # The sum creates the distinctive sound that telephone networks recognize
    combined_wave = low_wave + high_wave

    # Normalize to prevent clipping (keep within -1.0 to +1.0 range)
    # This ensures the audio doesn't distort when played back
    max_amplitude = np.max(np.abs(combined_wave))
    if max_amplitude > 0:
        combined_wave = combined_wave / max_amplitude * AMPLITUDE * 2

    return combined_wave


def save_as_wav(waveform: np.ndarray, output_path: Path) -> None:
    """
    Save audio waveform as a WAV file.

    Business Logic:
    WAV is an intermediate format - we'll convert to MP3 after.
    WAV is lossless and easy to generate with scipy.

    Technical Details:
    - Convert float samples (-1.0 to +1.0) to 16-bit integers (-32768 to +32767)
    - 16-bit depth is standard for mobile audio (good quality, reasonable file size)

    Args:
        waveform: NumPy array of audio samples (float, range -1.0 to +1.0)
        output_path: Where to save the WAV file
    """
    # Convert float samples to 16-bit PCM (Pulse Code Modulation)
    # Multiply by 32767 (max value for signed 16-bit integer)
    # This converts our normalized -1.0 to +1.0 range into -32768 to +32767
    audio_int16 = np.int16(waveform * 32767)

    # Write WAV file: (sample_rate, audio_data)
    wavfile.write(str(output_path), SAMPLE_RATE, audio_int16)
    print(f"  ✓ Generated WAV: {output_path.name}")


def convert_wav_to_mp3(wav_path: Path, mp3_path: Path) -> None:
    """
    Convert WAV file to MP3 using ffmpeg.

    Business Logic:
    MP3 files are ~10x smaller than WAV for the same audio quality.
    Mobile app bundle size is critical - every KB matters when users download.

    Technical Details:
    - Use ffmpeg command-line tool (industry standard for audio conversion)
    - Bitrate: 128 kbps (good quality for simple tones, small file size)
    - Mono audio (phone tones don't need stereo)
    - Overwrite existing files without prompting (-y flag)

    Args:
        wav_path: Input WAV file path
        mp3_path: Output MP3 file path

    Raises:
        FileNotFoundError: If ffmpeg is not installed
        subprocess.CalledProcessError: If ffmpeg conversion fails
    """
    try:
        # ffmpeg command:
        # -i: input file
        # -vn: no video (audio only)
        # -ar: audio sample rate (keep original 44100 Hz)
        # -ac: audio channels (1 = mono)
        # -b:a: audio bitrate (128k = 128 kbps, good quality for tones)
        # -y: overwrite output file without asking
        subprocess.run(
            [
                'ffmpeg',
                '-i', str(wav_path),      # Input WAV file
                '-vn',                     # No video stream
                '-ar', str(SAMPLE_RATE),   # Sample rate: 44100 Hz
                '-ac', '1',                # Mono audio
                '-b:a', '128k',            # Bitrate: 128 kbps
                '-y',                      # Overwrite without prompt
                str(mp3_path)              # Output MP3 file
            ],
            check=True,
            stdout=subprocess.DEVNULL,  # Suppress ffmpeg output
            stderr=subprocess.DEVNULL   # Suppress ffmpeg errors (we'll catch exceptions)
        )
        print(f"  ✓ Converted to MP3: {mp3_path.name}")

    except FileNotFoundError:
        print("\n❌ ERROR: ffmpeg is not installed or not in PATH")
        print("\nPlease install ffmpeg:")
        print("  - Windows: Download from https://ffmpeg.org/download.html")
        print("  - Mac: brew install ffmpeg")
        print("  - Linux: apt-get install ffmpeg")
        raise

    except subprocess.CalledProcessError as e:
        print(f"\n❌ ERROR: ffmpeg conversion failed for {wav_path.name}")
        print(f"Error details: {e}")
        raise


def cleanup_wav_file(wav_path: Path) -> None:
    """
    Delete the intermediate WAV file after MP3 conversion.

    Business Logic:
    We only need the final MP3 files in the app bundle.
    WAV files are much larger and serve no purpose after conversion.

    Args:
        wav_path: Path to WAV file to delete
    """
    if wav_path.exists():
        wav_path.unlink()
        print(f"  ✓ Cleaned up: {wav_path.name}")


def generate_all_dtmf_tones() -> None:
    """
    Main function: Generate all 10 DTMF tones (0-9) as MP3 files.

    Business Logic:
    This creates the complete set of dial tone sounds needed for the app.
    Each number (0-9) gets its own audio file that plays when the child
    taps that button on the dialer.

    Process:
    1. Create output directory if it doesn't exist
    2. For each digit 0-9:
       a. Generate the waveform (dual-tone audio)
       b. Save as WAV (intermediate format)
       c. Convert WAV to MP3 (final format)
       d. Delete the WAV file (cleanup)
    3. Create a README documenting the generation process

    Output:
    - 10 MP3 files in assets/sounds/dtmf/ (0.mp3 through 9.mp3)
    - 1 README.md documenting the files
    """
    print("=" * 60)
    print("DialBuddy DTMF Tone Generator")
    print("=" * 60)
    print(f"\nGenerating 10 DTMF tones (0-9)...")
    print(f"Output directory: {ASSET_DIR}")
    print(f"Sample rate: {SAMPLE_RATE} Hz")
    print(f"Duration: {DURATION * 1000} ms")
    print(f"Format: MP3 (128 kbps, mono)")
    print()

    # Create output directory if it doesn't exist
    ASSET_DIR.mkdir(parents=True, exist_ok=True)

    # Generate each digit's tone
    for digit in '0123456789':
        low_freq, high_freq = DTMF_FREQUENCIES[digit]

        print(f"Generating tone for digit '{digit}' ({low_freq} Hz + {high_freq} Hz):")

        # Generate the waveform
        waveform = generate_dtmf_tone(digit, low_freq, high_freq)

        # Save as WAV (intermediate)
        wav_path = ASSET_DIR / f"{digit}.wav"
        save_as_wav(waveform, wav_path)

        # Convert to MP3 (final)
        mp3_path = ASSET_DIR / f"{digit}.mp3"
        convert_wav_to_mp3(wav_path, mp3_path)

        # Clean up WAV file
        cleanup_wav_file(wav_path)

        print()

    # Create README documenting the generated files
    create_readme()

    print("=" * 60)
    print("✅ DTMF tone generation complete!")
    print(f"Generated 10 MP3 files in: {ASSET_DIR}")
    print("=" * 60)


def create_readme() -> None:
    """
    Create a README.md file documenting the DTMF audio files.

    Business Logic:
    Future developers (or auditors) need to understand:
    - Where these files came from
    - How they were generated
    - Why specific parameters were chosen
    - How to regenerate them if needed

    This serves as both documentation and audit trail.
    """
    readme_content = f"""# DTMF Tone Audio Files

## What These Files Are

These 10 MP3 files (0.mp3 through 9.mp3) are the dial tone sounds that play when a child presses number buttons in DialBuddy.

## Why DTMF Tones

DTMF (Dual-Tone Multi-Frequency) is the international standard for telephone keypad sounds, defined by ITU-T Recommendation Q.23. Teaching children these authentic sounds creates muscle memory association between numbers and their corresponding tones, making the app feel like a real phone.

## Generation Parameters

- **Sample Rate:** {SAMPLE_RATE} Hz (CD quality, mobile standard)
- **Duration:** {DURATION * 1000} ms per tone
- **Format:** MP3, 128 kbps, mono
- **Amplitude:** {AMPLITUDE} (30% of max volume)
- **Generator:** `scripts/generate-dtmf.py`
- **Generated:** 2024-01-15 by Ivan

## Frequency Pairs (ITU-T Q.23 Standard)

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

## File Sizes

Each MP3 file is approximately 4-5 KB. Total size for all 10 files: ~45 KB.

## How to Regenerate

If you need to regenerate these files (e.g., to change duration or quality):

1. Ensure Python 3.8+ is installed
2. Install dependencies: `pip install numpy scipy`
3. Install ffmpeg (see script header for platform-specific instructions)
4. Run: `python scripts/generate-dtmf.py`

## Usage in App

These files are preloaded on app startup via `expo-av` and played instantly when a child taps a number button. See `utils/audio/dtmfTones.ts` for implementation.

## Do NOT Modify

These files should NOT be manually edited or replaced with other sounds. The exact frequencies are an international standard and are expected by telephone networks worldwide. Changing them would make the app sound unrealistic and reduce its educational value.

## Legal

DTMF frequency specifications are public domain (ITU-T international standard). The generated audio files are original works created for DialBuddy and are part of the app's codebase.
"""

    readme_path = ASSET_DIR / "README.md"
    readme_path.write_text(readme_content, encoding='utf-8')
    print(f"  ✓ Created README: {readme_path.name}")


if __name__ == "__main__":
    """
    Script entry point.

    Business Logic:
    This script should be run once during project setup, and again any time
    we need to regenerate the tones (e.g., if we change duration or quality).

    Prerequisites Check:
    - Python 3.8+
    - numpy and scipy installed
    - ffmpeg in PATH

    Error Handling:
    - Script will fail gracefully with helpful error messages if prerequisites are missing
    - All exceptions are allowed to propagate (script should fail loudly, not silently)
    """
    try:
        generate_all_dtmf_tones()
    except Exception as e:
        print(f"\n❌ FATAL ERROR: {e}")
        print("\nPlease check:")
        print("  1. Python 3.8+ is installed")
        print("  2. Dependencies installed: pip install numpy scipy")
        print("  3. ffmpeg is installed and in PATH")
        exit(1)
