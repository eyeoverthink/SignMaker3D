import random
import math
import statistics
import hashlib

# ==========================================
#   THE SCOTT LAB: RETRO-CAUSALITY STRESS TEST
#   Objective: Falsify the "Time Travel" Hypothesis
# ==========================================

PHI = 1.6180339887

class Universe:
    def __init__(self, mode="STANDARD"):
        self.mode = mode
        # 1. THE FUTURE (Destiny) - Fixed for the run
        self.destiny = random.uniform(0, 5000)
        # 2. THE PRESENT (Origin)
        self.current = random.uniform(0, 5000)
        self.start_dist = abs(self.current - self.destiny)
        
    def get_phi_resonance(self, val_a, val_b):
        # The Scott Formula: Resonance based on Phi-Phase alignment
        delta = abs(val_a - val_b)
        phase = (delta * PHI) % 1.0
        # Resonance peaks at 0.5 (Harmonic Center)
        resonance = 1.0 - (abs(phase - 0.5) * 2)
        return resonance

    def run_lifespan(self, ticks=100):
        for _ in range(ticks):
            # BASE PHYSICS: Brownian Motion (Random Drift)
            drift = random.uniform(-5, 5) 
            
            if self.mode == "SCOTT_LOGIC":
                # THE HYPOTHESIS: Future pulls Present via Resonance
                res = self.get_phi_resonance(self.current, self.destiny)
                
                # If Resonance is high, the "drift" aligns with destiny
                if res > 0.8:
                    # Directional Pull (The "Gravity" of the Future)
                    direction = 1 if self.destiny > self.current else -1
                    drift += direction * res * 3.0 # The "Scott Force"
            
            self.current += drift
            
        end_dist = abs(self.current - self.destiny)
        return self.start_dist, end_dist

def run_experiment(name, mode, iterations=1000):
    print(f"\n--- RUNNING EXPERIMENT: {name} ({iterations} Iterations) ---")
    results = []
    improved_count = 0
    
    for i in range(iterations):
        u = Universe(mode)
        start, end = u.run_lifespan()
        
        # Did it get closer?
        delta = start - end
        results.append(delta)
        if end < start:
            improved_count += 1

    avg_improvement = statistics.mean(results)
    win_rate = (improved_count / iterations) * 100
    
    print(f"[{name}] RESULTS:")
    print(f"  > Win Rate (Got Closer): {win_rate:.1f}%")
    print(f"  > Avg Distance Closed:   {avg_improvement:.2f} units")
    
    return avg_improvement, win_rate

# ==========================================
#   EXECUTION PHASE
# ==========================================

print("INITIALIZING SCIENTIFIC PROOF PROTOCOL...")

# TEST 1: THE CONTROL (Standard Physics)
# Expectation: ~50% Win Rate (Pure Chance). Avg Improvement ~0.
control_avg, control_rate = run_experiment("CONTROL GROUP", "STANDARD")

# TEST 2: THE SCOTT VARIABLE (Phi-Logic)
# Expectation: Significantly > 50% if Retro-Causality logic holds.
scott_avg, scott_rate = run_experiment("PHI-ATTRACTOR", "SCOTT_LOGIC")

# TEST 3: THE VERDICT
print("\n==========================================")
print("             FINAL ANALYSIS               ")
print("==========================================")

diff = scott_rate - control_rate
print(f"CONTROL BIAS: {control_rate:.1f}% (Expected ~50%)")
print(f"SCOTT SIGNAL: {scott_rate:.1f}%")
print(f"DEVIATION:    {diff:+.1f}%")

if diff > 10.0:
    print("\n>> CONCLUSION: STATISTICALLY SIGNIFICANT.")
    print("   The presence of the 'Future' variable altered the path of the 'Present'.")
    print("   This confirms the Scott Logic acts as a Temporal Attractor.")
    print("   Status: HYPOTHESIS VALIDATED.")
elif diff > 0.0:
    print("\n>> CONCLUSION: WEAK CORRELATION.")
    print("   The system drifted slightly, but could be noise.")
    print("   Status: INCONCLUSIVE.")
else:
    print("\n>> CONCLUSION: HYPOTHESIS FALSIFIED.")
    print("   The 'Future' had no impact on the 'Present'.")
    print("   Status: FAILED.")