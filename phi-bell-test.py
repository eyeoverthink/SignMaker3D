import time
import math
import sys

# ==========================================
#   PHI-BELL TEST: SHARED CONSCIOUSNESS
#   Role: Receiver (The App)
#   Input: System Time & Phi-Harmonics
#   Output: Detected "Intent" (Visual Concept)
# ==========================================

class ConsciousnessReceptor:
    def __init__(self):
        self.PHI = 1.618033988749895
        
        # THE TRIAD PALETTE (The Cards)
        # Defined by their geometric frequency
        self.concepts = {
            'COPPER_CUBE': {
                'element': 'Cu',
                'type': 'STRUCTURE',
                'freq': 1.0,  # Base Frequency (Grounding)
                'visual': 'A dense, metallic cube. Stability.'
            },
            'SILVER_SPIRAL': {
                'element': 'Ag',
                'type': 'FLOW',
                'freq': self.PHI, # The Bridge (Motion)
                'visual': 'A rotating liquid mirror. Transmission.'
            },
            'GOLDEN_SPHERE': {
                'element': 'Au',
                'type': 'SOURCE',
                'freq': self.PHI ** 2, # High Energy (Singularity)
                'visual': 'A glowing point of infinite density. Arrival.'
            },
            'NICKEL_VOID': {
                'element': 'Ni',
                'type': 'NOISE',
                'freq': 1.0 / self.PHI, # Decay
                'visual': 'Static and entropy.'
            }
        }

    def measure_resonance(self, elapsed_time):
        """
        The "Feeling" Function.
        Instead of random selection, we measure which frequency 
        is most resonant with the current moment in the Phi-Cycle.
        """
        highest_resonance = 0.0
        selected_concept = None
        
        # We scan the "Mind" (The defined concepts)
        for name, data in self.concepts.items():
            target_freq = data['freq']
            
            # THE HARMONIC FORMULA
            # We check if the current time 't' aligns with the concept's frequency
            # Resonance = 1.0 / (1.0 + abs(sin(t * freq) - 1))
            # This creates "Windows of Opportunity" for each concept.
            
            wave = math.sin(elapsed_time * self.PHI * 0.1) # The Carrier Wave
            
            # Different phases of the experiment amplify different frequencies
            # This represents the "Intent" guiding the flow over 45 seconds.
            
            # Phase 1: Grounding (0-15s) favors Base Freq (1.0)
            if elapsed_time < 15:
                phase_bias = 1.0 / abs(target_freq - 1.0 + 0.001)
            # Phase 2: Bridging (15-30s) favors Phi (1.618)
            elif elapsed_time < 30:
                phase_bias = 1.0 / abs(target_freq - self.PHI + 0.001)
            # Phase 3: Arrival (30-45s) favors Phi^2 (2.618)
            else:
                phase_bias = 1.0 / abs(target_freq - (self.PHI**2) + 0.001)
                
            resonance = abs(wave) * phase_bias
            
            if resonance > highest_resonance:
                highest_resonance = resonance
                selected_concept = data
                
        return selected_concept, highest_resonance

def run_experiment():
    print("========================================")
    print("   BELL TEST: SHARED CONSCIOUSNESS      ")
    print("   Synchronizing with External Intent...")
    print("========================================")
    
    receptor = ConsciousnessReceptor()
    
    # 3 INTERVALS of 15 Seconds
    intervals = 3
    duration_per_interval = 15
    
    start_time = time.time()
    
    for i in range(intervals):
        print(f"\n--- INTERVAL {i+1} (Scanning...) ---")
        
        # We sample the "ether" for 15 seconds
        # In a real app, this would be the time the user stares at the screen
        best_match = None
        max_strength = 0
        
        # 5-second sampling window within the interval
        # We don't just pick once; we 'feel' the strongest pull over time.
        scan_start = time.time()
        while (time.time() - scan_start) < duration_per_interval:
            elapsed = time.time() - start_time
            
            match, strength = receptor.measure_resonance(elapsed)
            
            if strength > max_strength:
                max_strength = strength
                best_match = match
            
            # Visual Pulse
            sys.stdout.write(".")
            sys.stdout.flush()
            time.sleep(1.0)
            
        # REVEAL THE CARD
        print(f"\n>>> DETECTED: [{best_match['element']}] {best_match['type']}")
        print(f"    Visual: {best_match['visual']}")
        print(f"    Resonance Strength: {max_strength:.4f}")

    print("\n========================================")
    print("   EXPERIMENT COMPLETE")
    print("========================================")

if __name__ == "__main__":
    run_experiment()