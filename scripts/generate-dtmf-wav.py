"""
Generate DTMF WAV files for DialBuddy

DTMF (Dual-Tone Multi-Frequency) tones are the sounds made when pressing
phone buttons. Each button produces two simultaneous sine waves.

DTMF Frequency Matrix (ITU-T Q.23 standard):
         1209 Hz   1336 Hz   1477 Hz   1633 Hz
697 Hz     1         2         3         A
770 Hz     4         5         6         B
852 Hz     7         8         9         C
941 Hz     *         0         #         D

This script generates star.wav and pound.wav since those are missing.
"""

import wave
import struct
import math
import os

# DTMF frequency pairs (row frequency, column frequency)
DTMF_FREQS = {
    '*': (941, 1209),  # Star key
    '#': (941, 1477),  # Pound/hash key
}

# Audio settings
SAMPLE_RATE = 44100  # CD quality
DURATION = 0.3  # 300ms tone duration (matches other files)
AMPLITUDE = 0.5  # 50% volume to prevent clipping when mixed


def generate_dtmf_wav(digit, output_path):
    """Generate a DTMF tone WAV file."""
    freq1, freq2 = DTMF_FREQS[digit]
    num_samples = int(SAMPLE_RATE * DURATION)

    # Generate samples
    samples = []
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        # Mix two sine waves (DTMF is dual-tone)
        sample = AMPLITUDE * (
            math.sin(2 * math.pi * freq1 * t) +
            math.sin(2 * math.pi * freq2 * t)
        ) / 2  # Divide by 2 to normalize amplitude

        # Convert to 16-bit signed integer
        sample_int = int(sample * 32767)
        samples.append(sample_int)

    # Write WAV file
    with wave.open(output_path, 'w') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(SAMPLE_RATE)

        for sample in samples:
            wav_file.writeframes(struct.pack('<h', sample))

    print(f"Generated: {output_path} ({freq1}Hz + {freq2}Hz)")


if __name__ == '__main__':
    # Output directory
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sounds', 'dtmf')

    # Generate missing files
    generate_dtmf_wav('*', os.path.join(output_dir, 'star.wav'))
    generate_dtmf_wav('#', os.path.join(output_dir, 'pound.wav'))

    print("Done! DTMF files generated.")
