import os
import wave
import struct
import math

def write_wav(filename, samples, sample_rate=44100):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with wave.open(filename, 'wb') as wav_file:
        # Mono, 2 bytes per sample (16-bit), sample_rate
        wav_file.setparams((1, 2, sample_rate, len(samples), 'NONE', 'not compressed'))
        for sample in samples:
            # Scale to 16-bit range (-32768 to 32767)
            val = int(max(-32768, min(32767, sample * 32767)))
            wav_file.writeframes(struct.pack('<h', val))

def generate_chime(sample_rate=44100):
    # Double high-pitched chime
    duration = 1.0  # seconds
    total_samples = int(sample_rate * duration)
    samples = []
    
    # Pulse 1: 0.0 to 0.5s (880Hz)
    # Pulse 2: 0.2 to 0.8s (1109Hz - C#6)
    for i in range(total_samples):
        t = i / sample_rate
        val1 = 0.0
        val2 = 0.0
        
        # Pulse 1
        if t < 0.5:
            envelope1 = math.exp(-10 * t)
            val1 = 0.5 * math.sin(2 * math.pi * 880 * t) * envelope1
            
        # Pulse 2
        if t > 0.2:
            envelope2 = math.exp(-8 * (t - 0.2))
            val2 = 0.5 * math.sin(2 * math.pi * 1109 * (t - 0.2)) * envelope2
            
        samples.append(val1 + val2)
        
    return samples

def generate_wave(sample_rate=44100):
    # Smooth rising sweep (harmony)
    duration = 1.2
    total_samples = int(sample_rate * duration)
    samples = []
    
    for i in range(total_samples):
        t = i / sample_rate
        envelope = math.sin(math.pi * t / duration)  # Fade in and out
        if t > 1.0:
            envelope *= math.exp(-10 * (t - 1.0))
            
        # Chirp sweep from 330Hz to 660Hz
        freq = 330 + 330 * (t / duration)
        # Harmony sweep from 550Hz to 1100Hz
        freq2 = 550 + 550 * (t / duration)
        
        val = 0.4 * math.sin(2 * math.pi * freq * t) + 0.2 * math.sin(2 * math.pi * freq2 * t)
        samples.append(val * envelope)
        
    return samples

def generate_tap(sample_rate=44100):
    # Two rapid clicks (woodblock/tap style)
    duration = 0.4
    total_samples = int(sample_rate * duration)
    samples = []
    
    for i in range(total_samples):
        t = i / sample_rate
        val1 = 0.0
        val2 = 0.0
        
        # First tap
        if t < 0.15:
            envelope1 = math.exp(-50 * t)
            val1 = 0.8 * math.sin(2 * math.pi * 400 * t) * envelope1
            
        # Second tap
        if t > 0.12:
            envelope2 = math.exp(-50 * (t - 0.12))
            val2 = 0.8 * math.sin(2 * math.pi * 350 * (t - 0.12)) * envelope2
            
        samples.append(val1 + val2)
        
    return samples

if __name__ == "__main__":
    sounds_dir = "/Users/wavesiddhartha/Developer/echo/assets/sounds"
    
    print("Generating chime.wav...")
    write_wav(os.path.join(sounds_dir, "chime.wav"), generate_chime())
    
    print("Generating wave.wav...")
    write_wav(os.path.join(sounds_dir, "wave.wav"), generate_wave())
    
    print("Generating tap.wav...")
    write_wav(os.path.join(sounds_dir, "tap.wav"), generate_tap())
    
    print("Sounds generated successfully!")
