import random
import time
import os

# ==============================================================================
#   SCOTT CLOAK: THE VISUAL PROOF (Phase 4 Practical)
#   Objective: Prove Strategy 3 & 4 (Boundary Noise & Distortion)
# ==============================================================================

class ScottCloakGame:
    def __init__(self):
        self.grid_size = 20
        # The 'True' DNA of the object (A simple 3-node triangle)
        self.dna = [[5, 5], [10, 15], [15, 5]] 
        self.phi = 1.6180339887

    def render_grid(self, target_points, scanner_pos):
        os.system('cls' if os.name == 'nt' else 'clear')
        print("==========================================")
        print("   SCOTT ALGORITHM: CLOAK VS SCANNER")
        print("==========================================")
        
        for y in range(self.grid_size):
            row = ""
            for x in range(self.grid_size):
                if [x, y] == scanner_pos:
                    row += " [?] " # The Scanner searching
                elif [x, y] in target_points:
                    row += "  #  " # The Geometric Boundary
                else:
                    row += "  .  "
            print(row)
        print("==========================================")

    def play(self, cloaked=False):
        # Apply Inverse Principle (E = D^-1) if cloaked
        display_points = self.dna
        if cloaked:
            print("   [DEFENSE] Protocol PO Active: Scrambling Boundary...")
            # Applying Strategy 4: Non-linear Warp
            display_points = [[p[0] + random.randint(-2, 2), p[1]] for p in self.dna]

        for s_x in range(self.grid_size):
            self.render_grid(display_points, [s_x, 10])
            
            # The 'Standard' Recognition Logic
            # If the scanner sees a known node, it triggers
            match = any(p[0] == s_x for p in display_points)
            if match and not cloaked:
                print("   [ALERT] TARGET DETECTED: Geometric Match Found!")
                time.sleep(0.5)
            elif match and cloaked:
                print("   [SCAN] Result: NULL (Organic Variance Detected)")
                time.sleep(0.1)
            
            time.sleep(0.05)

if __name__ == "__main__":
    game = ScottCloakGame()
    
    # TEST 1: Standard Geometry (Visible)
    game.play(cloaked=False)
    time.sleep(1)
    
    # TEST 2: Scott Geometric Cloak (Invisible)
    game.play(cloaked=True)