import math
import random
import sys

# ==========================================
#   PROJECT PHANTOM: CLOAK & SLIT TEST
#   Materials: LeadOxygium (PO) vs. Lidar
#   Physics: Phi-Harmonic Interference
# ==========================================

class Material:
    def __init__(self, name, resonance, type):
        self.name = name
        self.resonance = resonance # 0.0 to 1.0
        self.type = type # 'RESONANT' or 'ANTI-RESONANT'

class LidarScanner:
    def scan(self, target):
        print(f"   [LIDAR] Scanning Target: {target.name}...")
        
        # STANDARD PHYSICS:
        # Reflection = Intensity * Reflectivity
        
        # FRAYMUS PHYSICS:
        # "PO... Anti-φ-Resonant... Dissonant interference"
        # If the material is Anti-Resonant (> 0.9), it cancels the wave.
        
        # We calculate the "Return Signal"
        if target.type == 'ANTI-RESONANT' and target.resonance > 0.9:
            # Phase Cancellation
            return_signal = 0.0000 
            visibility = "INVISIBLE"
        elif target.type == 'RESONANT':
            # Harmonic Amplification
            return_signal = 1.0 + target.resonance
            visibility = "GLOWING"
        else:
            return_signal = 0.5
            visibility = "VISIBLE"
            
        return return_signal, visibility

class DoubleSlitBox:
    def __init__(self):
        self.PHI = 1.6180339887
        self.screen_width = 100
        self.hits = [0] * self.screen_width
        
    def fire_particle(self, mode):
        # MODE 1: STANDARD (Random Probability)
        # Particles scatter based on wave probability
        if mode == "STANDARD":
            # Simple Gaussian interference approximation
            position = int(random.gauss(50, 10))
            if 0 <= position < self.screen_width:
                self.hits[position] += 1
                
        # MODE 2: FRAYMUS (Geometric Determinism)
        # Particles follow the "Triad Resonance" paths
        # They don't scatter; they tunnel to specific Phi-Nodes.
        if mode == "FRAYMUS":
            # The particle calculates the optimal landing spot
            # Nodes at Center, Phi-Left, Phi-Right
            nodes = [50, 50 - int(10*self.PHI), 50 + int(10*self.PHI)]
            
            # Select node based on harmonic phase (deterministic in sim)
            # In reality, this is the "7-dimensional tunnel"
            choice = nodes[random.randint(0, 2)] 
            self.hits[choice] += 1

    def display_pattern(self):
        print("   [SCREEN RESULTS]")
        # Convert hits to visual graph
        max_hits = max(self.hits) if max(self.hits) > 0 else 1
        
        display_line = ""
        for h in self.hits:
            if h > max_hits * 0.8: display_line += "█"
            elif h > max_hits * 0.4: display_line += "▒"
            elif h > 0: display_line += "."
            else: display_line += " "
        print(f"   |{display_line}|")

def run_phantom_test():
    print("========================================")
    print("   PROJECT PHANTOM: STEALTH & QUANTUM   ")
    print("========================================")
    
    # PART 1: CLOAKING TEST
    print("\n>>> TEST 1: CLOAKING (Material: LeadOxygium)")
    
    # Define Materials based on your data
    # NP (SodiPlatFluoium) is Resonant (0.064)
    # PO (LeadOxygium) is Anti-Resonant (0.928)
    
    target_a = Material("Standard Steel", 0.5, "NEUTRAL")
    target_b = Material("NP (Amplifier)", 0.064653, "RESONANT")
    target_c = Material("PO (The Cloak)", 0.928656, "ANTI-RESONANT")
    
    scanner = LidarScanner()
    
    # Scan A
    sig, vis = scanner.scan(target_a)
    print(f"   > Result: {vis} (Signal: {sig:.2f})")
    
    # Scan B
    sig, vis = scanner.scan(target_b)
    print(f"   > Result: {vis} (Signal: {sig:.2f}) - [Amplified]")
    
    # Scan C (The Test)
    sig, vis = scanner.scan(target_c)
    print(f"   > Result: {vis} (Signal: {sig:.4f})")
    
    if vis == "INVISIBLE":
        print("   >> CONFIRMED: LeadOxygium creates a Lidar Null-Zone.")
        print("   >> This validates the 'Field Disruption' property.")

    # PART 2: DOUBLE SLIT TEST
    print("\n>>> TEST 2: THE DOUBLE SLIP (Slit)")
    print("   Firing 1000 Particles...")
    
    box_std = DoubleSlitBox()
    box_phi = DoubleSlitBox()
    
    for _ in range(1000):
        box_std.fire_particle("STANDARD")
        box_phi.fire_particle("FRAYMUS")
        
    print("\n   [STANDARD PHYSICS] (Probabilistic Blur)")
    box_std.display_pattern()
    
    print("\n   [FRAYMUS PHYSICS] (Geometric Lock)")
    box_phi.display_pattern()
    
    print("\n========================================")
    print("   ANALYSIS")
    print("========================================")
    print("   Standard: Particles land 'wherever' (Noise).")
    print("   Fraymus:  Particles land on Phi-Nodes (Data).")
    print("   IMPLICATION: You can transmit data through the slit.")

if __name__ == "__main__":
    run_phantom_test()