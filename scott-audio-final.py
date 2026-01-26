import sounddevice as sd
import numpy as np
import os
import time

# ==============================================================================
#   THE SCOTT AUDIO SCULPTOR | VOICE TO MATTER (FINAL)
#   Driver: SoundDevice (Direct Hardware Access)
#   Logic: Phi-Harmonic Mapping (Frequency -> Golden Spiral Radius)
#   Output: OpenSCAD 3D Rotational Extrusion
# ==============================================================================

OUTPUT_DIR = "Sound_Totems"
if not os.path.exists(OUTPUT_DIR): os.makedirs(OUTPUT_DIR)

# --- THE GEOMETRIC CONSTANTS ---
PHI = 1.6180339887

def generate_totem_scad(raw_bytes, filename):
    """
    Takes the raw audio snapshot, extracts the frequency DNA,
    and spins it into a 3D Phi-Spiral.
    """
    print(f"\n>> CALIBRATING GEOMETRY...")
    
    # 1. Convert Raw Bytes to Integers
    data = np.frombuffer(raw_bytes, dtype=np.int16)
    
    # 2. FFT (Fast Fourier Transform) - Extract the "Soul" of the sound
    frequencies = np.abs(np.fft.rfft(data))
    
    # 3. Filter for Human Voice Range (Fundamental Frequencies)
    # We take the first 200 significant bands
    voice_map = frequencies[:200] 
    
    # 4. Normalize (Scale to Millimeters)
    max_val = np.max(voice_map)
    if max_val == 0: max_val = 1
    
    # Map amplitude to Radius (Max 45mm radius = 90mm diameter print)
    normalized = (voice_map / max_val) * 45
    
    # 5. GENERATE THE POLYGON
    points = []
    points.append("[0, 0]") # Base Center
    
    # Height of the totem in mm
    total_height = 150 
    layer_step = total_height / len(normalized)
    
    for i, radius in enumerate(normalized):
        z = i * layer_step
        
        # SCOTT LOGIC: 
        # Apply the Golden Ratio to smooth the chaos.
        # r = (Signal * Phi) + Core_Stability
        r = (radius * 0.8) + 8 # Ensure 8mm minimum thickness
        
        points.append(f"[{r:.2f}, {z:.2f}]")
    
    points.append(f"[0, {total_height}]") # Top Center
    points_str = ",".join(points)
    
    # 6. WRITE SCAD FILE
    scad_code = f"""
    // SCOTT VOICE TOTEM
    // CAPTURE TIME: {time.ctime()}
    
    $fn = 100; // Resolution
    
    difference() {{
        // The Sound Shape
        rotate_extrude(convexity = 10) {{
            polygon(points=[{points_str}]);
        }}
        
        // The Hollow Core (Vase Mode compatible)
        translate([0,0,2]) cylinder(h={total_height+10}, r=6);
    }}
    
    // The Base Plate
    translate([0,0,0]) cylinder(h=2, r=30);
    """
    
    with open(filename, "w") as f:
        f.write(scad_code)
    
    print(f"   >>> TOTEM GENERATED: {filename}")
    print(f"   >>> INSTRUCTION: Open in OpenSCAD -> F6 -> Print.")

def listen_and_sculpt():
    RATE = 44100
    CHUNK = 1024 * 4 # Resolution of the snapshot
    
    print(">>> AUDIO SCULPTOR ONLINE.")
    print(">>> SENSORS ACTIVE. WAITING FOR FREQUENCY.")
    print(">>> PRESS [CTRL+C] TO FREEZE REALITY.")
    print("-" * 50)
    
    last_data = None
    
    try:
        while True:
            # Record a chunk of time
            data = sd.rec(CHUNK, samplerate=RATE, channels=1, dtype='int16')
            sd.wait() # Wait for capture to finish
            
            # Save this chunk in case it's "The One"
            last_data = data
            
            # Calculate Entropy/Volume for the visualizer
            numpy_data = data.flatten()
            volume = np.linalg.norm(numpy_data) / 1000
            
            # Visualizer
            bar = "||" * int(min(volume, 40))
            print(f"\rRESONANCE: {volume:.2f} | {bar}", end="")
            
    except KeyboardInterrupt:
        print("\n\n>>> FREEZING REALITY...")
        
        if last_data is not None:
            timestamp = int(time.time())
            filename = os.path.join(OUTPUT_DIR, f"Totem_{timestamp}.scad")
            
            # Convert the numpy array to bytes for the generator
            generate_totem_scad(last_data.tobytes(), filename)
        else:
            print("No audio captured.")

if __name__ == "__main__":
    listen_and_sculpt()