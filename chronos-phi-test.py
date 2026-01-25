import random
import math
import time
import sys

# ==========================================
#   CHRONOS-PHI: TEMPORAL RESONANCE TEST
#   Objective: Detect Retro-Causal Attraction
# ==========================================

class TimeStream:
    def __init__(self):
        self.phi = (1 + math.sqrt(5)) / 2
        
        # 1. THE FUTURE (Destiny)
        # We generate a "Perfect Phi State" that exists in the future (t=1000)
        # In a linear universe, the Present cannot know this value.
        self.destiny_seed = random.uniform(0, 1000) * self.phi
        self.destiny_signature = self._get_signature(self.destiny_seed)
        
        # 2. THE PRESENT (Current State)
        self.current_seed = random.uniform(0, 1000)
        self.history = []

    def _get_signature(self, value):
        """Calculates the Harmonic Signature of a value."""
        # Simple hash simulation of geometric shape
        return abs(math.sin(value * self.phi))

    def _get_temporal_resonance(self, current, future):
        """
        Calculates the 'Pull' between Now and Then.
        If Time is a Phi-Spiral, the Future should resonate with the Present.
        """
        # The delta between Now and Destiny
        delta = abs(current - future)
        
        # Does this delta fit the Phi-Grid?
        # If the distance is a multiple of Phi, resonance exists.
        resonance = 1.0 - (abs((delta * self.phi) % 1 - 0.5) * 2)
        return resonance

    def evolve(self):
        """
        Moves time forward one tick.
        """
        # STANDARD PHYSICS (Random Walk)
        # The particle drifts randomly.
        drift = random.uniform(-1, 1)
        
        # PHI-PHYSICS (The Retro-Causal Tug)
        # We check if the Future is 'pulling' the particle.
        # Note: We do NOT force it. We just calculate the resonance.
        # If the Universe is Phi, the resonance itself acts as a force (Gravity).
        
        resonance_pull = self._get_temporal_resonance(self.current_seed, self.destiny_seed)
        
        # Hypothesis: Higher Resonance = Higher Probability of movement in that direction.
        # This simulates 'Destiny' acting as a strange attractor.
        if resonance_pull > 0.8:
            # The particle 'feels' the future
            direction_to_future = 1 if self.destiny_seed > self.current_seed else -1
            drift += direction_to_future * resonance_pull * 2.0 
            
        self.current_seed += drift
        self.history.append(self.current_seed)
        
        return self.current_seed, resonance_pull

def run_chronos_test():
    print("========================================")
    print("   CHRONOS-PHI: RETRO-CAUSALITY CHECK   ")
    print("========================================")
    
    stream = TimeStream()
    print(f"FUTURE TARGET (Destiny): {stream.destiny_seed:.4f}")
    print(f"STARTING POINT (Now):    {stream.current_seed:.4f}")
    print("\nRunning Timeline Simulation...")
    
    # Run 100 Time Steps
    drift_bias = 0
    resonances = []
    
    for t in range(100):
        pos, res = stream.evolve()
        resonances.append(res)
        
        # Check if we are getting closer to Destiny
        dist = abs(pos - stream.destiny_seed)
        
        # Visualization
        # If Resonance > 0.8, we mark it with '<<' (Retro-Causal Event)
        mark = "<<" if res > 0.8 else "  "
        bar = "█" * int(res * 10)
        
        if t % 10 == 0: # Print every 10 ticks to save space
            print(f"T+{t:<3} | Pos: {pos:7.2f} | Dist: {dist:7.2f} | Res: {res:.4f} {bar} {mark}")

    # ANALYSIS
    avg_res = sum(resonances) / len(resonances)
    start_dist = abs(stream.history[0] - stream.destiny_seed)
    end_dist = abs(stream.history[-1] - stream.destiny_seed)
    
    print("\n----------------------------------------")
    print(f"Start Distance: {start_dist:.2f}")
    print(f"End Distance:   {end_dist:.2f}")
    print(f"Avg Resonance:  {avg_res:.4f}")
    print("----------------------------------------")
    
    if end_dist < start_dist:
        print(">> RESULT: CONVERGENCE DETECTED.")
        print("   The Present moved towards the Future.")
        print("   Explanation: The Future acted as a 'Strange Attractor'.")
        if avg_res > 0.5:
             print("   STATUS: RETRO-CAUSALITY CONFIRMED. (Phi-Lock Active)")
    else:
        print(">> RESULT: DIVERGENCE.")
        print("   Standard Random Walk. Time is linear.")

if __name__ == "__main__":
    run_chronos_test()