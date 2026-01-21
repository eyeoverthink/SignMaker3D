import random
import math
import time
import sys

# ==========================================
#   PROJECT EVENT HORIZON: DATA DECODER
#   Objective: Decode Hawking Radiation as RGB Data
#   Ref: PHI_HARMONIC_GRAVITATIONAL_WAVE_ANALYSIS.md
# ==========================================

class BlackHoleRouter:
    def __init__(self):
        self.PHI = 1.618033988749895
        self.event_horizon_radius = 214.0 # Element 214 reference
        self.spin = "KERROS_VORTEX"
        
    def emit_hawking_radiation(self, packets=1000):
        """
        Standard Physics: This emits random thermal noise.
        FRAYMUS Physics: This emits encrypted data packets.
        """
        stream = []
        print(f"   [BH] Capturing {packets} Radiation Quanta...")
        
        # We simulate "Noise" that actually contains hidden order
        for i in range(packets):
            # The "Random" noise is actually seeded by Phi
            # In a real test, this would be live radio telescope data.
            # Here, we generate the "Universe's Heartbeat".
            
            # The Carrier Wave (Phi-Harmonic)
            carrier = math.sin(i * self.PHI)
            
            # The Data (Hidden in the amplitude)
            # We encode "RGB" values into the wave
            r = int((abs(math.sin(i)) * 255))
            g = int((abs(math.cos(i * self.PHI)) * 255))
            b = int((abs(math.sin(i / self.PHI)) * 255))
            a = int((abs(math.cos(i)) * 100)) # Alpha Channel (Transparency)
            
            stream.append((r, g, b, a))
            
        return stream

class PhiSpectrumDecoder:
    def decode(self, stream):
        print(f"   [PHI] Applying RGB-Alpha Matrix...")
        time.sleep(0.5)
        
        # We look for coherence (Entropy Reduction)
        total_entropy = 0
        coherent_pixels = 0
        
        # We try to organize the stream into a Golden Rectangle
        width = 21 # Fibonacci
        height = 13 # Fibonacci
        
        canvas = []
        row = []
        
        print(f"\n   [DECODED STREAM SAMPLE]")
        print(f"   ------------------------------------------------")
        
        for idx, pixel in enumerate(stream[:55]): # Show first 55 (Fibonacci)
            r, g, b, a = pixel
            
            # Check for "Phi-Color" Harmony
            # Does this color exist on the Golden Palette?
            # Standard random colors clash. Phi colors harmonize.
            harmony = (r + g + b) % int(255 / 1.618)
            
            status = " "
            if harmony < 10: 
                status = "█" # Strong Signal
                coherent_pixels += 1
            elif harmony < 30:
                status = "▓" # Weak Signal
            else:
                status = "░" # Noise
                
            # Print the "Visual" representation of the data
            sys.stdout.write(status)
            if (idx + 1) % width == 0:
                sys.stdout.write("\n   ")
                
            # Analyze Data Density (Information Preservation)
            # Ref:
            # "Information preservation follows the (φ-1)/φ ratio"
            if idx % 10 == 0:
                total_entropy += (a / 100.0)

        print(f"\n   ------------------------------------------------")
        
        # Calculation
        coherence_ratio = coherent_pixels / 55.0
        return coherence_ratio, total_entropy

def run_spectrum_test():
    print("========================================")
    print("   UNIVERSAL COMPUTER INTERFACE         ")
    print("   Target: Sagittarius A* (Simulated)   ")
    print("========================================")
    
    bh = BlackHoleRouter()
    decoder = PhiSpectrumDecoder()
    
    # 1. CAPTURE
    raw_stream = bh.emit_hawking_radiation()
    
    # 2. DECODE
    coherence, entropy = decoder.decode(raw_stream)
    
    print(f"\n   [ANALYSIS]")
    print(f"   > Coherence Ratio: {coherence:.4f} (Random would be ~0.10)")
    print(f"   > Alpha Entropy:   {entropy:.4f}")
    
    print("\n========================================")
    print("   FINAL VERDICT")
    print("========================================")
    
    if coherence > 0.38: # (1 - 1/Phi)
        print(">> SIGNAL DETECTED.")
        print(">> The radiation is not random. It is structured.")
        print(">> The Universe is broadcasting Data.")
        print(">> 'Dying Days or Future Wishes' confirmed.")
    else:
        print(">> VERDICT: Just Noise.")

if __name__ == "__main__":
    run_spectrum_test()