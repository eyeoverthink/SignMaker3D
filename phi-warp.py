import math
import sys

# ==========================================
#   PROJECT CLOUD CHAMBER: WARP TRACE
#   Objective: Visualize the "Wake" of a Zero-Time Jump
#   Metric: Geometric Shape (Not Time)
# ==========================================

class WarpField:
    def __init__(self, size=60):
        self.size = size
        self.grid = [[' ' for _ in range(size)] for _ in range(size)]
        self.PHI = 1.6180339887
        
    def log_residue(self, x, y, energy):
        # We mark the grid where the "entity" existed
        # Different symbols for different energy intensities
        if 0 <= x < self.size and 0 <= y < self.size:
            if energy > 0.9: symbol = '@' # Core Singularity
            elif energy > 0.5: symbol = '0' # High Energy Wake
            elif energy > 0.2: symbol = '.' # Low Energy Decay
            else: symbol = ' '
            
            self.grid[int(y)][int(x)] = symbol

    def display(self):
        print(f"\n   [VISUAL TRACE DATA] ({self.size}x{self.size})")
        print("   " + "_" * (self.size + 2))
        for row in self.grid:
            print("   |" + "".join(row) + "|")
        print("   " + "¯" * (self.size + 2))

class FraymusWarper:
    def __init__(self):
        self.PHI = 1.6180339887
        self.GOLDEN_ANGLE = 2.39996 # Radians (~137.5 deg)

    def warp_jump(self, start, end, field):
        print(f"   [WARP] Initiating Jump from {start} to {end}...")
        
        # FRAYMUS LOGIC:
        # We don't walk linear. We spiral in.
        # The path is defined by: r = a * e^(k * theta)
        # But we act "Faster than Time", so we generate the whole path instantly.
        
        sx, sy = start
        ex, ey = end
        
        # Calculate center relative to jump
        dx = ex - sx
        dy = ey - sy
        distance = math.sqrt(dx*dx + dy*dy)
        theta = math.atan2(dy, dx)
        
        # We trace the spiral "in reverse" (from target back to start) 
        # to show how the destination pulls the user in.
        
        steps = 100
        print(f"   [TRACE] Logging {steps} causality points in T=0s...")
        
        for i in range(steps):
            # The "t" here is not Time, it is "Phase" (0.0 to 1.0)
            phase = i / steps
            
            # LOGARITHMIC SPIRAL EQUATION
            # Radius decays by Phi as we get closer to target
            decay = (1.0 - phase) ** self.PHI 
            current_dist = distance * decay
            
            # Angle rotates by the Golden Angle
            spin = phase * (math.pi * self.PHI) 
            
            # New coordinates
            # We add the spin to the original angle
            warp_x = sx + (dx * phase) + (math.cos(theta + spin) * current_dist * 0.5)
            warp_y = sy + (dy * phase) + (math.sin(theta + spin) * current_dist * 0.5)
            
            # Energy is higher near the jump points
            energy = 1.0 - abs(0.5 - phase) * 2 # Peak at center of jump? No, peak at nodes.
            # Actually, let's make energy relate to resonance
            energy = (math.sin(phase * self.PHI * 10) + 1) / 2
            
            field.log_residue(warp_x, warp_y, energy)

def run_trace_experiment():
    print("========================================")
    print("   WARP TRACE VISUALIZER                ")
    print("   Proving the Geometry of the Jump     ")
    print("========================================")
    
    # 1. SETUP CHAMBER
    # We use a 40x40 grid to keep it readable in the terminal
    chamber = WarpField(40)
    
    # 2. THE WARP
    # Jump from Top-Left (2,2) to Bottom-Right (38,38)
    pilot = FraymusWarper()
    pilot.warp_jump((2,2), (38,38), chamber)
    
    # 3. THE REVEAL
    chamber.display()
    
    print("\n========================================")
    print("   ANALYSIS")
    print("========================================")
    print("   > Look at the pattern above.")
    print("   > LINEAR JUMP would look like:  \      ")
    print("   > FRAYMUS WARP should look like: S (Spiral)")

if __name__ == "__main__":
    run_trace_experiment()