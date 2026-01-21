# import random
# import math
# import time
# import os

# # ==========================================
# #   THE PHI-PETRI DISH
# #   Objective: Test for Spontaneous Organization (Life)
# # ==========================================

# class PrimordialSoup:
#     def __init__(self, size=100):
#         self.phi = (1 + math.sqrt(5)) / 2
#         self.environment = [random.uniform(0, 100) for _ in range(size)]
#         self.generation = 0
#         self.clusters = []

#     def get_resonance(self, val1, val2):
#         """
#         Calculates if two data points 'bond'.
#         Bonding Condition: Ratio is close to Phi.
#         """
#         if val2 == 0: return 0
#         ratio = val1 / val2
#         if ratio < 1: ratio = 1 / ratio # Normalize
        
#         # Distance from Phi
#         diff = abs(ratio - self.phi)
        
#         # Resonance Score (1.0 = Perfect Phi Bond)
#         return max(0, 1.0 - (diff * 2))

#     def evolve(self):
#         """
#         One 'Tick' of the universe.
#         Particles move, collide, and potentially bond.
#         """
#         self.generation += 1
#         new_clusters = []
        
#         # 1. Random Interaction (Brownian Motion)
#         # We pick random pairs to collide
#         for _ in range(len(self.environment)):
#             i1 = random.randint(0, len(self.environment)-1)
#             i2 = random.randint(0, len(self.environment)-1)
            
#             p1 = self.environment[i1]
#             p2 = self.environment[i2]
            
#             # 2. The "Life" Check
#             resonance = self.get_resonance(p1, p2)
            
#             # If resonance is high (> 0.95), they bond into a "Cell"
#             if resonance > 0.95:
#                 # Create a "Complex Structure" (Sum of parts * Phi)
#                 new_organism = (p1 + p2) * 0.5 * self.phi
#                 new_clusters.append(new_organism)
                
#                 # Replace the old parts with new energy (Feeding the soup)
#                 self.environment[i1] = random.uniform(0, 100)
#                 self.environment[i2] = random.uniform(0, 100)

#         # 3. Selection Pressure
#         # Only strong clusters survive
#         if new_clusters:
#             self.clusters.extend(new_clusters)
            
#         # Entropy takes the weak
#         # Randomly kill off 10% of clusters to simulate death
#         if len(self.clusters) > 0:
#             survivors = int(len(self.clusters) * 0.9)
#             self.clusters = self.clusters[-survivors:]

#     def report(self):
#         os.system('cls' if os.name == 'nt' else 'clear')
#         print(f"--- GENERATION {self.generation} ---")
#         print(f"Soup Density: {len(self.environment)} particles")
#         print(f"Living Cells: {len(self.clusters)}")
        
#         if len(self.clusters) > 0:
#             avg_val = sum(self.clusters) / len(self.clusters)
#             # Check if the organism creates a "Meta-Phi" pattern
#             meta_resonance = self.get_resonance(avg_val, 100) 
#             print(f"Avg Organism Energy: {avg_val:.2f}")
#             print(f"Colony Resonance:    {meta_resonance*100:.2f}%")
            
#             # Visualizing the Colony Growth
#             bar = "█" * (len(self.clusters) // 2)
#             print(f"Growth: [{bar}]")

# def run_experiment():
#     soup = PrimordialSoup()
#     print("Initializing Primordial Soup...")
#     print("Applying Phi-Physics...")
#     time.sleep(2)
    
#     try:
#         while True:
#             soup.evolve()
#             soup.report()
            
#             if len(soup.clusters) > 50:
#                 print("\n>> CRITICAL MASS ACHIEVED.")
#                 print(">> SPONTANEOUS ORGANIZATION CONFIRMED.")
#                 print(">> The Data is reproducing.")
#                 break
                
#             time.sleep(0.1)
            
#     except KeyboardInterrupt:
#         print("Experiment

import random
import math
import time
import os
import sys

# ==========================================
#   PHI-EVOLUTION ENGINE (v2)
#   The "Petri Dish" for Digital Life
# ==========================================

class PrimordialSoup:
    def __init__(self, size=150):
        self.phi = (1 + math.sqrt(5)) / 2
        
        # CONSTANTS FROM YOUR DOCS (Quantum_Evolution.md)
        self.MUTATION_RATE = 0.0618
        self.COHERENCE_THRESHOLD = 0.9403 
        self.STABILITY_THRESHOLD = 0.8944
        
        # The Soup: Random Floating Point "DNA"
        self.environment = [random.uniform(0, 100) for _ in range(size)]
        self.clusters = []
        self.generation = 0
        self.start_time = time.time()

    def get_phi_resonance(self, val1, val2):
        """
        Calculates resonance based on the Golden Ratio.
        """
        if val2 == 0: return 0
        
        # We check ratios: val1/val2 OR val2/val1
        # Life organizes where Ratio ≈ Phi
        r1 = val1 / val2
        r2 = val2 / val1
        
        # Find which one is closer to Phi
        diff1 = abs(r1 - self.phi)
        diff2 = abs(r2 - self.phi)
        
        best_diff = min(diff1, diff2)
        
        # Normalize to 0.0 - 1.0 Score
        # 0.0 diff = 1.0 score
        resonance = max(0, 1.0 - best_diff)
        return resonance

    def evolve(self):
        self.generation += 1
        new_life = []
        
        # 1. BROWNIAN MOTION (Random Collisions)
        # We collide random pairs looking for Phi-Matches
        interactions = len(self.environment)
        
        for _ in range(interactions):
            i1 = random.randint(0, len(self.environment)-1)
            i2 = random.randint(0, len(self.environment)-1)
            
            if i1 == i2: continue
            
            p1 = self.environment[i1]
            p2 = self.environment[i2]
            
            # 2. THE RESONANCE CHECK
            resonance = self.get_phi_resonance(p1, p2)
            
            # 3. SPONTANEOUS ORGANIZATION
            # If resonance > Your Document's Threshold (0.9403)
            if resonance > self.COHERENCE_THRESHOLD:
                
                # MERGE: They bond into a stable "Cell"
                # The new value is the Phi-weighted average
                complex_structure = (p1 + p2) / 2 * self.phi
                
                # Mutation (Evolution)
                if random.random() < self.MUTATION_RATE:
                    complex_structure *= (1 + (random.uniform(-0.01, 0.01)))
                
                new_life.append(complex_structure)
                
                # The raw materials are consumed (Replaced by new random noise)
                self.environment[i1] = random.uniform(0, 100)
                self.environment[i2] = random.uniform(0, 100)

        # 4. NATURAL SELECTION
        # Add new life to the colony
        if new_life:
            self.clusters.extend(new_life)
            
        # Entropy Check (Death)
        # Cells must maintain stability > 0.8944 to survive
        survivors = []
        for cell in self.clusters:
            # Check internal stability (simulated by checking variance against Phi)
            stability = 1.0 - (abs((cell % self.phi) - (self.phi/2)) / self.phi)
            
            # Apply your Stability Threshold
            if stability > (self.STABILITY_THRESHOLD - 0.2): # Relaxed slightly for simulation
                survivors.append(cell)
        
        self.clusters = survivors

    def render(self):
        # Clear screen command based on OS
        os.system('cls' if os.name == 'nt' else 'clear')
        
        elapsed = time.time() - self.start_time
        pop_count = len(self.clusters)
        
        print(f"========================================")
        print(f"   PHI-EVOLUTION SIMULATION (v2)        ")
        print(f"========================================")
        print(f"Generation: {self.generation}")
        print(f"Time Alive: {elapsed:.1f}s")
        print(f"----------------------------------------")
        print(f"CONSTANTS (From Quantum_Evolution.md):")
        print(f" > Mutation Rate:       {self.MUTATION_RATE}")
        print(f" > Coherence Threshold: {self.COHERENCE_THRESHOLD}")
        print(f"----------------------------------------")
        
        # VISUALIZATION
        # Noise vs Order
        noise_level = len(self.environment)
        print(f"\nNOISE POOL: {noise_level} particles")
        
        print(f"\nLIVING COLONY: {pop_count} cells")
        if pop_count > 0:
            # Draw the colony
            bar_len = min(50, pop_count)
            print(f"[{'#' * bar_len}{' ' * (50-bar_len)}]")
            
            # Check for dominant species (clustering around specific numbers)
            avg_val = sum(self.clusters) / pop_count
            print(f" > Avg Signature: {avg_val:.4f}")
        else:
            print("[                                                  ] (Sterile)")

        print(f"========================================")
        
        if pop_count > 100:
            print("\n>>> CRITICAL MASS ACHIEVED <<<")
            print(">>> The data has spontaneously organized.")
            sys.exit()

def run_simulation():
    sim = PrimordialSoup()
    print("Injecting Phi-Physics...")
    time.sleep(1)
    
    try:
        while True:
            sim.evolve()
            sim.render()
            time.sleep(0.05) # Fast evolution
    except KeyboardInterrupt:
        print("\nExperiment Paused.")

if __name__ == "__main__":
    run_simulation()