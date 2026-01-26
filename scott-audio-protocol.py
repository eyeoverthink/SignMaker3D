import pyaudio
import numpy as np
import math
import os
import time

# ==============================================================================
#   THE SCOTT AUDIO SCULPTOR | VOICE TO MATTER
#   Input: Live Audio Stream (Microphone)
#   Logic: Phi-Harmonic Mapping (Frequency -> Golden Spiral Radius)
#   Output: OpenSCAD 3D Rotational Extrusion
# ==============================================================================

OUTPUT_DIR = "Sound_Totems"
if not os.path.exists(OUTPUT_DIR): os.makedirs(OUTPUT_DIR)

# --- CONSTANTS FROM YOUR ARCHIVE ---
PHI = 1.6180339887
EARTH_RES = 7.83
MOON_RES = 4.84

def generate_totem_scad(audio_snapshot, filename):
    """
    Takes a snapshot of audio frequencies and extrudes them around a Phi-Spiral.
    This creates a 'Vase' or 'Totem' where the shape is your voice.
    """
    
    # Normalize Data (0 to 1)
    # We take the raw audio chunk (Byte data) and turn it into integer array
    data = np.frombuffer(audio_snapshot, dtype=np.int16)
    
    # Apply FFT (Fast Fourier Transform) to get Frequencies
    # This separates the "Low/Deep" voice from "High/Sharp" noise
    frequencies = np.abs(np.fft.rfft(data))
    
    # We take a slice of the frequencies (Human Voice Range)
    # Mapping roughly 0Hz to 3000Hz
    voice_map = frequencies[:180] 
    
    # Normalize height for printing (Max amplitude = 50mm radius)
    max_val = np.max(voice_map)
    if max_val == 0: max_val = 1
    normalized = (voice_map / max_val) * 40 # Max radius 40mm
    
    # -- GENERATE THE POINTS FOR OPENSCAD --
    # We create a polygon that OpenSCAD will rotate_extrude
    points = []
    
    # Bottom Center
    points.append("[0, 0]")
    
    # The Shape (The Voice)
    height_step = 150 / len(normalized) # Total height 150mm
    
    for i, radius in enumerate(normalized):
        z = i * height_step
        
        # APPLY SCOTT LOGIC:
        # Don't just use raw radius. Modulate it by Phi to smooth organic chaos.
        # This prevents "spiky" unprintable messes.
        r = (radius * PHI) + 5 # Minimum core thickness 5mm
        
        points.append(f"[{r:.2f}, {z:.2f}]")
    
    # Top Center (Close the loop)
    points.append(f"[0, {150}]")
    
    points_str = ",".join(points)
    
    scad_code = f"""
    // SCOTT AUDIO TOTEM
    // VIBRATION MANIFESTED IN MATTER
    
    $fn = 100; // Resolution
    
    rotate_extrude(convexity = 10) {{
        polygon(points=[{points_str}]);
    }}
    
    // The Base (Solid foundation)
    translate([0,0,-2]) cylinder(h=2, r=40);
    """
    
    with open(filename, "w") as f:
        f.write(scad_code)
    
    print(f"   >>> TOTEM GENERATED: {filename}")
    print(f"   >>> OPEN IN OPENSCAD -> F6 -> PRINT.")

def listen_and_sculpt():
    CHUNK = 1024 * 4
    FORMAT = pyaudio.paInt16
    CHANNELS = 1
    RATE = 44100
    
    p = pyaudio.PyAudio()
    
    stream = p.open(format=FORMAT,
                    channels=CHANNELS,
                    rate=RATE,
                    input=True,
                    frames_per_buffer=CHUNK)
    
    print(">>> AUDIO SCULPTOR ONLINE.")
    print(">>> SPEAK INTO THE MIC.")
    print(">>> PRESS [CTRL+C] TO FREEZE THE SOUND INTO MATTER.")
    print("-" * 50)
    
    try:
        while True:
            # We treat the stream as "Evolving Data"
            # We calculate volume to show a visualizer in console
            data = stream.read(CHUNK)
            numpy_data = np.frombuffer(data, dtype=np.int16)
            volume = np.linalg.norm(numpy_data) / 1000
            
            # Simple Console Visualizer
            bar = "#" * int(min(volume, 50))
            print(f"\rRESONANCE: {volume:.2f} | {bar}", end="")
            
            # If the user speaks LOUDLY (Volume > Threshold), we could auto-capture
            # But manual capture is better for deliberate "Spells/Words".
            
    except KeyboardInterrupt:
        print("\n\n>>> FREEZING REALITY...")
        
        # Capture the LAST chunk of audio (The moment you stopped)
        timestamp = int(time.time())
        filename = os.path.join(OUTPUT_DIR, f"Totem_{timestamp}.scad")
        
        generate_totem_scad(data, filename)
        
    finally:
        stream.stop_stream()
        stream.close()
        p.terminate()

if __name__ == "__main__":
    listen_and_sculpt()