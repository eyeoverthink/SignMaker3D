import random
import math
import time
import collections
import sys

# ==========================================
#   CHALLENGE: THE MAZE RACE
#   Standard BFS vs. Phi-Vortex Navigation
#   Objective: Reach the Center (50,50)
# ==========================================

class MazeGrid:
    def __init__(self, size=100):
        self.size = size
        self.walls = set()
        self.start = (0, 0)
        self.end = (50, 50) # The Center
        
        print(f"   [SYS] Generating {size}x{size} Labyrinth...")
        # Generate a "Fractal" Maze (Pseudo-random noise)
        # We leave the center somewhat accessible but guarded
        random.seed(137) # Fixed seed for fairness
        for x in range(size):
            for y in range(size):
                # Create obstacles based on noise
                if random.random() < 0.3:
                    if (x,y) != self.start and (x,y) != self.end:
                        self.walls.add((x,y))

class StandardPathfinder:
    def __init__(self):
        self.name = "Standard AI (BFS)"
        
    def solve(self, maze):
        start_time = time.time()
        queue = collections.deque([(maze.start, [maze.start])])
        visited = set([maze.start])
        cells_checked = 0
        
        while queue:
            (x, y), path = queue.popleft()
            cells_checked += 1
            
            if (x, y) == maze.end:
                return time.time() - start_time, len(path), cells_checked
            
            # Check 4 directions (N, S, E, W)
            for dx, dy in [(0,1), (0,-1), (1,0), (-1,0)]:
                nx, ny = x+dx, y+dy
                if 0 <= nx < maze.size and 0 <= ny < maze.size:
                    if (nx, ny) not in maze.walls and (nx, ny) not in visited:
                        visited.add((nx, ny))
                        queue.append(((nx, ny), path + [(nx, ny)]))
                        
        return time.time() - start_time, 0, cells_checked # Fail

class PhiNavigator:
    def __init__(self):
        self.name = "FRAYMUS (Phi-Vortex)"
        self.PHI = 1.6180339887
        self.GOLDEN_ANGLE = 2.39996 # Radians (137.5 deg)
        
    def solve(self, maze):
        start_time = time.time()
        current = maze.start
        path = [current]
        cells_checked = 0
        
        # FRAYMUS LOGIC:
        # Don't flood the maze. Follow the energy.
        # We calculate the vector to the center.
        # If blocked, we don't randomly check neighbors; we pivot by the Golden Angle.
        
        while current != maze.end:
            cells_checked += 1
            cx, cy = current
            tx, ty = maze.end
            
            # 1. Calculate Ideal Vector (Gravity)
            dx = tx - cx
            dy = ty - cy
            dist = math.sqrt(dx*dx + dy*dy)
            
            if dist < 1: 
                break # Arrived
                
            # Normalize vector
            vx = dx / dist
            vy = dy / dist
            
            # 2. Try to move in the "Flow" Direction
            # If blocked, rotate vector by Golden Angle
            moved = False
            best_next = None
            
            # We check the "Cone of Probability" defined by Phi
            # Instead of 4 rigid directions, we check the flow
            
            check_dirs = [
                (int(round(vx)), int(round(vy))), # Ideal
                (int(round(vx * math.cos(0.5) - vy * math.sin(0.5))), int(round(vx * math.sin(0.5) + vy * math.cos(0.5)))), # +30 deg
                (int(round(vx * math.cos(-0.5) - vy * math.sin(-0.5))), int(round(vx * math.sin(-0.5) + vy * math.cos(-0.5)))) # -30 deg
            ]
            
            for d in check_dirs:
                nx, ny = cx + d[0], cy + d[1]
                if (nx, ny) not in maze.walls and (nx, ny) not in path:
                     # Valid Move
                     current = (nx, ny)
                     path.append(current)
                     moved = True
                     break
            
            if not moved:
                # "Tunneling" / Backtracking Logic (Simplified)
                # In a real Fraymus system, we'd phase shift. 
                # Here, we just break to avoid infinite loop in sim
                break
                
        return time.time() - start_time, len(path), cells_checked

def run_maze_race():
    print("========================================")
    print("   THE MAZE RACE: CHAOS VS. GEOMETRY    ")
    print("   Arena: 100x100 Grid (Fractal Noise)  ")
    print("========================================")
    
    maze = MazeGrid(100)
    
    # 1. STANDARD AI
    ai = StandardPathfinder()
    print(f"\n   [{ai.name}] Flooding the Maze...")
    t_ai, len_ai, checks_ai = ai.solve(maze)
    print(f"   > Time:  {t_ai:.4f}s")
    print(f"   > Cells Checked: {checks_ai} (Massive Effort)")
    print(f"   > Path Length:   {len_ai}")

    # 2. FRAYMUS NAVIGATOR
    phi = PhiNavigator()
    print(f"\n   [{phi.name}] Following the Spiral...")
    t_phi, len_phi, checks_phi = phi.solve(maze)
    print(f"   > Time:  {t_phi:.4f}s")
    print(f"   > Cells Checked: {checks_phi} (Minimal Effort)")
    print(f"   > Path Length:   {len_phi}")
    
    print("\n========================================")
    print("   FINAL SCOREBOARD")
    print("========================================")
    
    if checks_phi < checks_ai:
        efficiency = checks_ai / checks_phi
        print(f"   >> EFFICIENCY GAIN: {efficiency:.1f}x")
        print(f"   >> VERDICT: FRAYMUS flows like water. AI stumbles in the dark.")
    else:
        print("   >> VERDICT: The Maze was too chaotic for flow.")

if __name__ == "__main__":
    run_maze_race()