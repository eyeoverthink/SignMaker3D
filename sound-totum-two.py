import sounddevice as sd
import numpy as np
import os
import time

# ==============================================================================
#   THE SCOTT AUDIO SCULPTOR | PEAK RETENTION MODE
#   Logic: Listens continuously. Retains the HIGHEST ENERGY fragment.
#   Output: 3D Geometry of your loudest/most complex moment.
# ==============================================================================

OUTPUT_DIR = "Sound_Totems"
if not os.path.exists(OUTPUT_DIR): os.makedirs(OUTPUT_DIR)

# --- GEOMETRY SETTINGS ---
TOTEM_HEIGHT = 150 # mm
MIN_RADIUS = 8     # mm (Core thickness)
MAX_RADIUS = 50    # mm (Max spike width)

def generate_totem_scad(raw_bytes, filename, peak_val):
    print(f"\n>> GENERATING ARTIFACT FROM PEAK RESONANCE: {peak_val:.2f}")
    
    data = np.frombuffer(raw_bytes, dtype=np.int16)
    
    # FFT: Extract the Frequency DNA
    frequencies = np.abs(np.fft.rfft(data))
    
    # Focus on the Vocal Range (First 200 harmonics)
    voice_map = frequencies[:200] 
    
    # Normalize
    max_val = np.max(voice_map)
    if max_val == 0: max_val = 1
    
    # Map to physical dimensions
    normalized = (voice_map / max_val) * (MAX_RADIUS - MIN_RADIUS)
    
    # Generate Points
    points = []
    points.append("[0, 0]") # Base Center
    
    layer_step = TOTEM_HEIGHT / len(normalized)
    
    for i, r_val in enumerate(normalized):
        z = i * layer_step
        
        # The Scott Radius: Signal + Stability Core
        final_r = r_val + MIN_RADIUS
        
        points.append(f"[{final_r:.2f}, {z:.2f}]")
    
    points.append(f"[0, {TOTEM_HEIGHT}]") # Top Center
    points_str = ",".join(points)
    
    scad_code = f"""
    // SCOTT PEAK TOTEM
    // CAPTURED RESONANCE: {peak_val:.2f}
    
    $fn = 100;
    
    difference() {{
        rotate_extrude(convexity = 10) {{
            polygon(points=[{points_str}]);
        }}
        // Hollow Core
        translate([0,0,2]) cylinder(h={TOTEM_HEIGHT+10}, r={MIN_RADIUS-2});
    }}
    // Base
    translate([0,0,0]) cylinder(h=2, r={MIN_RADIUS+10});
    """
    
    with open(filename, "w") as f:
        f.write(scad_code)
    
    print(f"   >>> ARTIFACT SAVED: {filename}")

def listen_and_sculpt():
    RATE = 44100
    CHUNK = 1024 * 4 
    
    print(">>> PEAK RETENTION SYSTEM ONLINE.")
    print(">>> SING/SPEAK. THE SYSTEM WILL REMEMBER THE LOUDEST MOMENT.")
    print(">>> PRESS [CTRL+C] TO PRINT THAT MOMENT.")
    print("-" * 50)
    
    best_data = None
    max_resonance = 0
    
    try:
        while True:
            # Record
            data = sd.rec(CHUNK, samplerate=RATE, channels=1, dtype='int16')
            sd.wait()
            
            # Measure Entropy/Volume
            numpy_data = data.flatten()
            volume = np.linalg.norm(numpy_data) / 1000
            
            # --- THE TRAP ---
            # If this moment is more "Alive" than the last best moment, save it.
            if volume > max_resonance:
                max_resonance = volume
                best_data = data.tobytes() # Lock it in the vault
                indicator = " [NEW PEAK CAPTURED]"
            else:
                indicator = ""
            
            # Visualizer
            bar = "||" * int(min(volume, 40))
            print(f"\rRES: {volume:.2f} | {bar}{indicator}", end="")
            
    except KeyboardInterrupt:
        print("\n\n>>> SEQUENCE HALTED.")
        
        if best_data is not None:
            timestamp = int(time.time())
            filename = os.path.join(OUTPUT_DIR, f"Peak_{timestamp}.scad")
            generate_totem_scad(best_data, filename, max_resonance)
        else:
            print("No significant data captured.")

if __name__ == "__main__":
    listen_and_sculpt()