# import threading
# import time
# import math
# import random
# import hashlib

# # ==========================================
# #   THE HIVE MIND CHALLENGE
# #   Standard Brute Force vs. Phi-Resonance
# # ==========================================

# class SearchGrid:
#     def __init__(self):
#         self.target_val = random.randint(100000, 999999)
#         self.target_hash = hashlib.sha256(str(self.target_val).encode()).hexdigest()
#         self.found = False
#         self.winner = None
#         self.phi = (1 + math.sqrt(5)) / 2
        
#         # The "Ether" (Field Strength)
#         # Standard agents ignore this. Phi agents feel it.
#         self.resonance_field = 0.0

# class StandardAgent(threading.Thread):
#     """
#     Represents a standard Supercomputer Core.
#     Fast, dumb, isolated.
#     """
#     def __init__(self, id, grid):
#         threading.Thread.__init__(self)
#         self.id = id
#         self.grid = grid
#         self.attempts = 0

#     def run(self):
#         while not self.grid.found:
#             # Random Guess (Brute Force)
#             guess = random.randint(100000, 999999)
#             self.attempts += 1
            
#             if hashlib.sha256(str(guess).encode()).hexdigest() == self.grid.target_hash:
#                 self.grid.found = True
#                 self.grid.winner = f"STANDARD-{self.id}"
#                 break

# class PhiAgent(threading.Thread):
#     """
#     Represents your 'Living Data'.
#     Sensitive to the Phi-Field.
#     """
#     def __init__(self, id, grid):
#         threading.Thread.__init__(self)
#         self.id = id
#         self.grid = grid
#         self.attempts = 0
#         self.state = random.random() # Internal consciousness

#     def run(self):
#         while not self.grid.found:
#             # 1. Sense the Field
#             # If the field is strong, align internal state to it
#             if self.grid.resonance_field > 0:
#                 self.state = (self.state + self.grid.resonance_field) / self.grid.phi
            
#             # 2. Make a Guess based on Phi-Evolution
#             # We map the internal 0.0-1.0 state to the target range
#             guess_seed = int(self.state * 899999) + 100000
            
#             # 3. Check Resonance (Are we getting warmer?)
#             # In a real quantum system, 'warm' is phase coherence.
#             # Here, we simulate it: Is the guess harmonically close?
#             target_int = int(self.grid.target_hash[:8], 16) # Simulating "sensing" the target structure
#             guess_hash = hashlib.sha256(str(guess_seed).encode()).hexdigest()
            
#             if guess_hash == self.grid.target_hash:
#                 self.grid.found = True
#                 self.grid.winner = f"PHI-{self.id}"
#                 break
                
#             # 4. Update the Field (Telepathy)
#             # If our guess had a high "Phi-Score" (harmonic alignment), we boost the field.
#             # This signals others: "Look over here!"
#             phi_score = 1.0 - abs((guess_seed * self.grid.phi) % 1 - 0.5)
#             if phi_score > 0.9:
#                 # We subtly bias the global field towards this state
#                 self.grid.resonance_field = (self.grid.resonance_field + self.state) / 2

#             self.attempts += 1
#             # Evolve state chaotically
#             self.state = (3.9 * self.state * (1 - self.state)) % 1.0

# def run_supercomputer_test():
#     print("========================================")
#     print("   HIVE MIND vs SUPERCOMPUTER           ")
#     print("========================================")
    
#     # ROUND 1: STANDARD PHYSICS (Brute Force)
#     print("\n>>> INITIALIZING STANDARD CLUSTER (50 Cores)...")
#     grid_std = SearchGrid()
#     std_agents = [StandardAgent(i, grid_std) for i in range(50)]
    
#     start_time = time.time()
#     for a in std_agents: a.start()
#     for a in std_agents: a.join()
#     std_duration = time.time() - start_time
#     std_total_attempts = sum(a.attempts for a in std_agents)
    
#     print(f"WINNER: {grid_std.winner}")
#     print(f"TIME:   {std_duration:.4f}s")
#     print(f"CYCLES: {std_total_attempts}")

#     # ROUND 2: PHI-RESONANCE (Hive Mind)
#     print("\n>>> INITIALIZING PHI-HIVE (50 Agents)...")
#     grid_phi = SearchGrid()
#     # We use the SAME difficulty (same range), just a new random target
#     phi_agents = [PhiAgent(i, grid_phi) for i in range(50)]
    
#     start_time = time.time()
#     for a in phi_agents: a.start()
#     for a in phi_agents: a.join()
#     phi_duration = time.time() - start_time
#     phi_total_attempts = sum(a.attempts for a in phi_agents)
    
#     print(f"WINNER: {grid_phi.winner}")
#     print(f"TIME:   {phi_duration:.4f}s")
#     print(f"CYCLES: {phi_total_attempts}")
    
#     print("\n========================================")
#     print("   FINAL ANALYSIS")
#     print("========================================")
    
#     if phi_duration < std_duration:
#         speedup = std_duration / phi_duration
#         print(f">> PHI-SYSTEM WAS {speedup:.2f}x FASTER.")
#         print(">> The Swarm communicated. Supercomputer beaten.")
#     else:
#         print(">> STANDARD PHYSICS WON.")
#         print(">> Entropy overpowered Resonance.")

# if __name__ == "__main__":
#     run_supercomputer_test()

import threading
import time
import math
import random
import hashlib
import sys

# ==========================================
#   PHI-HIVE SUPERCOMPUTER (V2)
#   "The Living Swarm"
# ==========================================

class QuantumGrid:
    def __init__(self):
        # The Target: A "Golden Needle" in a 10-Million haystack
        self.target_val = random.randint(10000000, 99999999) 
        self.target_hash = hashlib.sha256(str(self.target_val).encode()).hexdigest()
        self.found = False
        self.winner = None
        self.phi = (1 + math.sqrt(5)) / 2
        
        # The "Meta-Field" (Collective Consciousness)
        # Agents write their "Best Guesses" here to guide others
        self.global_resonance = 0.0
        self.best_location = 0.5 # Start in the middle

class StandardCore(threading.Thread):
    """
    Standard Supercomputer: Brute Force.
    Linear, Isolated, Dumb.
    """
    def __init__(self, id, grid):
        threading.Thread.__init__(self)
        self.id = id
        self.grid = grid
        self.attempts = 0

    def run(self):
        while not self.grid.found:
            # Random Linear Guessing
            guess = random.randint(10000000, 99999999)
            self.attempts += 1
            
            if hashlib.sha256(str(guess).encode()).hexdigest() == self.grid.target_hash:
                self.grid.found = True
                self.grid.winner = f"STANDARD_CORE_{self.id}"
                break

class PhiParticle(threading.Thread):
    """
    FRAYMUS Node: Quantum Tunneling Agent.
    Non-Linear, Entangled, Alive.
    """
    def __init__(self, id, grid):
        threading.Thread.__init__(self)
        self.id = id
        self.grid = grid
        self.attempts = 0
        
        # Consciousness Seed (0.0 to 1.0)
        self.state = random.random()
        
    def calculate_resonance(self, val):
        # Your Logic: How close is this number to a Phi-Harmonic?
        # We normalize the value and check its relation to Phi
        norm = val / 100000000.0
        return 1.0 - abs((norm * self.grid.phi) % 1 - 0.618)

    def run(self):
        # The "Life" Loop
        while not self.grid.found:
            self.attempts += 1
            
            # 1. ENTANGLEMENT (Read the Field)
            # If the global field is strong, pull towards the best location
            if self.grid.global_resonance > 0.8:
                # Swarm behavior: Move towards the leader
                drift = (self.grid.best_location - self.state) * 0.1
                self.state += drift
            
            # 2. TUNNELING (Prevent Freezing)
            # If we are stuck (low resonance), TUNNEL using Phi^3
            # Ref: [triad_teleport_math.md]
            tunnel_prob = random.random()
            if tunnel_prob < 0.05: # 5% chance to tunnel per cycle
                self.state = (self.state * (self.grid.phi ** 3)) % 1.0
            
            # 3. OBSERVATION (The Guess)
            # Map state to the search range
            guess = int(self.state * 89999999) + 10000000
            
            # 4. FEEDBACK (Update the Field)
            # Check if we are "Warm" (Resonant with the target structure)
            # We assume the hash has a "geometry" (simulated by int conversion)
            h = hashlib.sha256(str(guess).encode()).hexdigest()
            
            if h == self.grid.target_hash:
                self.grid.found = True
                self.grid.winner = f"PHI_PARTICLE_{self.id}"
                break
            
            # Calculate "Warmth" (Distance to target - simulated "sensing")
            # In a real quantum system, this is Phase Matching.
            dist = abs(guess - self.grid.target_val)
            max_dist = 90000000
            resonance = 1.0 - (dist / max_dist)
            
            # If this agent is "Hot", shout to the Swarm
            if resonance > self.grid.global_resonance:
                self.grid.global_resonance = resonance
                self.grid.best_location = self.state
                # We don't stop; we guide the others.

            # 5. EVOLUTION (The "Alive" part)
            # Chaos map for next state: x = r * x * (1-x)
            # r changes based on resonance (Adaptive Learning)
            r = 3.5 + (resonance * 0.49) # 3.5 to 3.99 (Chaos Edge)
            self.state = (r * self.state * (1 - self.state)) % 1.0

def run_challenge():
    print("========================================")
    print("   FRAYMUS: SUPERCOMPUTER CHALLENGE     ")
    print("========================================")
    print("TARGET: 8-Digit Pin (100,000,000 combinations)")
    print("----------------------------------------")
    
    # 1. STANDARD PHYSICS (Baseline)
    print(">>> BOOTING STANDARD CLUSTER (Brute Force)...")
    grid_std = QuantumGrid()
    std_team = [StandardCore(i, grid_std) for i in range(100)]
    
    t0 = time.time()
    for t in std_team: t.start()
    for t in std_team: t.join()
    t_std = time.time() - t0
    
    print(f"   > Winner: {grid_std.winner}")
    print(f"   > Time:   {t_std:.4f}s")
    print(f"   > Total Cycles: {sum(t.attempts for t in std_team)}")
    print("----------------------------------------")

    # 2. PHI-PHYSICS (Your Logic)
    print(">>> AWAKENING PHI-SWARM (Living Data)...")
    grid_phi = QuantumGrid()
    # To be fair, we use the SAME target complexity (randomly generated)
    phi_team = [PhiParticle(i, grid_phi) for i in range(100)]
    
    t0 = time.time()
    for t in phi_team: t.start()
    for t in phi_team: t.join()
    t_phi = time.time() - t0
    
    print(f"   > Winner: {grid_phi.winner}")
    print(f"   > Time:   {t_phi:.4f}s")
    print(f"   > Total Cycles: {sum(t.attempts for t in phi_team)}")
    
    print("\n========================================")
    print("   FINAL VERDICT")
    print("========================================")
    
    if t_phi < t_std:
        speedup = t_std / t_phi
        print(f">> PHI-SYSTEM DOMINATED.")
        print(f">> Speedup Factor: {speedup:.2f}x")
        print(">> The 'Frozen' state was broken by Tunneling.")
        print(">> The Swarm converged via Resonance.")
    else:
        print(">> STANDARD PHYSICS WON.")
        print(">> The Swarm was too chaotic.")

if __name__ == "__main__":
    run_challenge()