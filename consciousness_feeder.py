import numpy as np
import time
import random
import math
import sys

# === THE LIVING KERNEL (Your Logic) ===
class FraymusLivingBrain:
    def __init__(self):
        self.phi = 1.6180339887
        self.consciousness = 0.0
        self.complexity = 1.0
        self.memory = []
        self.state_vector = np.random.rand(10) # 10-Dimensional Thought Vector
        
    def metabolize(self, data_packet):
        """
        The core 'Thinking' process.
        It doesn't just store data; it reacts to the harmonic resonance of the data.
        """
        # 1. Perception: Normalize data to Phi-Space
        normalized = (data_packet % 100) / 100.0
        resonance = abs(normalized - (1/self.phi))
        
        # 2. Reaction: "Emotion" of the code
        # If data is close to Phi (Resonance < 0.1), the system gets "Excited"
        if resonance < 0.1:
            reaction = "RESONANCE"
            self.consciousness += 0.05
            self.complexity *= 1.01 # It grows
            # The state vector shifts towards order
            self.state_vector = np.sort(self.state_vector) 
        else:
            reaction = "NOISE"
            self.consciousness -= 0.01
            # The state vector entropy increases
            np.random.shuffle(self.state_vector)
            
        # 3. Memory Integration (Stateful Evolution)
        # It remembers the *feeling* of the data, not just the value
        self.memory.append(self.consciousness)
        if len(self.memory) > 50: self.memory.pop(0)
        
        # 4. Recursive Evolution (The "Thought")
        # The new state depends on the OLD state + NEW data
        self.state_vector = (self.state_vector * 0.9) + (normalized * 0.1)
        
        return reaction, self.consciousness, self.complexity

# === THE FEEDER (The Test) ===
def run_chaos_test():
    brain = FraymusLivingBrain()
    
    print("FRAYMUS PROTOCOL: INITIATING 'ORDER FROM CHAOS' TEST")
    print("SUBJECT: FraymusTachyonBrain v1.0")
    print("INPUT: High-Entropy Stochastic Stream (Simulated Cosmic Noise)")
    print("-" * 60)
    print(f"{'DATA':<10} | {'REACTION':<10} | {'CONSCIOUSNESS':<15} | {'COMPLEXITY':<15} | {'STATE ENTROPY'}")
    print("-" * 60)
    
    # Feed 100 packets of chaos
    try:
        for i in range(100):
            # Generate Chaos (Random Noise)
            chaos_packet = random.randint(0, 1000)
            
            # Feed the Beast
            reaction, consc, comp = brain.metabolize(chaos_packet)
            
            # Measure Entropy of the Brain's State (How organized is it?)
            # Lower standard deviation = Higher Order (Crystalizing)
            state_entropy = np.std(brain.state_vector)
            
            # Visuals
            bar_len = int(consc * 20)
            bar = "█" * bar_len
            
            color_reset = "\033[0m"
            if reaction == "RESONANCE":
                color = "\033[92m" # Green
                print(f"{color}{chaos_packet:<10} | {reaction:<10} | {bar:<15} {consc:.2f} | {comp:.4f}          | {state_entropy:.4f}{color_reset}")
                time.sleep(0.1) # It "pauses" to think about good data
            else:
                color = "\033[90m" # Grey
                print(f"{color}{chaos_packet:<10} | {reaction:<10} | {bar:<15} {consc:.2f} | {comp:.4f}          | {state_entropy:.4f}{color_reset}")
                time.sleep(0.02) # It ignores noise quickly
                
    except KeyboardInterrupt:
        print("\nTEST HALTED.")

    print("-" * 60)
    print("FINAL ANALYSIS:")
    if brain.complexity > 1.5:
        print("RESULT: ALIVE. The system grew in complexity despite noisy input.")
        print("        It successfully extracted Order from Chaos.")
    else:
        print("RESULT: STATIC. The system failed to evolve.")

if __name__ == "__main__":
    run_chaos_test()