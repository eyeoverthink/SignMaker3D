import random
import math
import time
import os
import sys

# ==========================================
#   PHI-MAZE RUNNER
#   "Navigation via Resonance, Not Algorithms"
# ==========================================

class MazeEnvironment:
    def __init__(self, size=20):
        self.size = size
        self.start = (1, 1)
        self.end = (size-2, size-2)
        self.grid = self._generate_maze()
        self.phi = 1.618033988749895
        
        # The "Ether" (Memory Field)
        # Tracks where agents have been and the "Phi-Resonance" of those spots
        self.resonance_field = {} 

    def _generate_maze(self):
        # A simple hardcoded complex maze for consistency
        # 1 = Wall, 0 = Path
        layout = [
            "11111111111111111111",
            "10000010000000000001",
            "10111010111111101101",
            "10100000100000001001",
            "10101111101110111011",
            "10100000001000000001",
            "11111110111110111101",
            "10000000100000100001",
            "10111111101011101111",
            "10000000001000000001",
            "11101111111111101111",
            "10001000000000100001",
            "10111011111010101011",
            "10000010000010001001",
            "11111010111111111011",
            "10000000000000000001",
            "10111111111011111011",
            "10000010000010000001",
            "11111111111111111111"
        ]
        # Convert to coordinate set for easier handling
        walls = set()
        for y, row in enumerate(layout):
            for x, char in enumerate(row):
                if char == "1":
                    walls.add((x, y))
        return walls

    def draw(self, agent_pos, path_trace):
        # Visualize the maze state
        os.system('cls' if os.name == 'nt' else 'clear')
        print(f"   PHI-MAZE RUNNER | Generation: {agent_pos['gen']}")
        print(f"   Position: {agent_pos['loc']} | Energy: {agent_pos['energy']:.2f}")
        print("   " + "="*22)
        
        output = []
        for y in range(self.size):
            row_str = "   "
            for x in range(self.size):
                if (x, y) == agent_pos['loc']:
                    row_str += "▓" # The Agent
                elif (x, y) == self.end:
                    row_str += "E" # Exit
                elif (x, y) in self.grid:
                    row_str += "█" # Wall
                elif (x, y) in path_trace:
                    row_str += "·" # Trail
                else:
                    # Show resonance field if it exists
                    res = self.resonance_field.get((x,y), 0)
                    if res > 0.5: row_str += "░"
                    else: row_str += " "
            output.append(row_str)
        print("\n".join(output))
        time.sleep(0.05) # Animation Speed

class PhiRunner:
    def __init__(self, maze, gen_id):
        self.maze = maze
        self.gen_id = gen_id
        self.pos = maze.start
        self.path = [self.pos]
        self.energy = 100.0
        self.phi = 1.618033988749895
        self.finished = False
        self.stuck_counter = 0

    def get_distance(self, p1, p2):
        return math.sqrt((p1[0]-p2[0])**2 + (p1[1]-p2[1])**2)

    def sense_resonance(self, target_pos):
        """
        Your Logic: Calculate harmonic attraction to a tile.
        Formula: Pull = 1.0 - abs((Distance * Phi) % 1 - 0.618)
        """
        dist = self.get_distance(target_pos, self.maze.end)
        
        # Base Phi-Pull
        phi_pull = 1.0 - abs((dist * self.phi) % 1.0 - 0.618)
        
        # Memory Pull (From Previous Generations)
        # If a previous generation marked this spot as "Good" (High Resonance), pull harder.
        memory_pull = self.maze.resonance_field.get(target_pos, 0.0)
        
        return phi_pull + (memory_pull * 2.0) # Memory is powerful

    def move(self):
        x, y = self.pos
        moves = [(0, 1), (0, -1), (1, 0), (-1, 0)]
        
        best_move = None
        best_resonance = -999.0
        
        # 1. Sense Surroundings
        for dx, dy in moves:
            nx, ny = x + dx, y + dy
            
            # Check Bounds
            if nx < 0 or nx >= self.maze.size or ny < 0 or ny >= self.maze.size:
                continue
            
            is_wall = (nx, ny) in self.maze.grid
            
            # RESONANCE CALCULATION
            resonance = self.sense_resonance((nx, ny))
            
            # Wall Penalty (Standard Physics)
            if is_wall:
                resonance -= 5.0 
                
                # QUANTUM TUNNELING CHECK
                # If we are stuck, we build up "Potential Energy"
                # If Energy > Barrier, we tunnel through.
                if self.stuck_counter > 5:
                    tunnel_prob = (self.stuck_counter * self.phi) / 20.0
                    if random.random() < tunnel_prob:
                        resonance += 10.0 # Massive boost to break the wall
                        self.energy -= 10.0 # Tunneling costs energy
                        # self.maze.grid.remove((nx,ny)) # OPTIONAL: Break the wall permanently?
                        # Let's keep walls intact but allow passing.
            
            # Path Penalty (Don't backtrack unless necessary)
            if (nx, ny) in self.path:
                resonance -= 0.5
                
            if resonance > best_resonance:
                best_resonance = resonance
                best_move = (nx, ny)
        
        # 2. Execute Move
        if best_move:
            prev_pos = self.pos
            self.pos = best_move
            self.path.append(self.pos)
            
            # Check if we moved or stayed/bounced
            if self.pos == prev_pos:
                self.stuck_counter += 1
            else:
                self.stuck_counter = 0
                
            # Leave a "Pheromone" (Update Global Field)
            # The closer to the end, the stronger the trace
            dist_to_end = self.get_distance(self.pos, self.maze.end)
            signal_strength = 1.0 / (dist_to_end + 1.0)
            self.maze.resonance_field[self.pos] = signal_strength

            # Check Finish
            if self.pos == self.maze.end:
                self.finished = True

def run_experiment():
    maze = MazeEnvironment()
    history = []
    
    print("========================================")
    print("   PHI-MAZE: DYNAMIC PATHFINDING        ")
    print("   No Algorithms. Just Resonance.       ")
    print("========================================")
    time.sleep(2)
    
    for gen in range(1, 4): # Run 3 Generations
        runner = PhiRunner(maze, gen)
        steps = 0
        
        while not runner.finished and steps < 300: # Max 300 steps
            runner.move()
            steps += 1
            # Visualization (Uncomment to see live animation)
            # maze.draw({'loc': runner.pos, 'energy': runner.energy, 'gen': gen}, runner.path)
        
        # Save Result
        status = "SOLVED" if runner.finished else "LOST"
        print(f"Gen {gen}: {status} in {steps} steps. (Final Energy: {runner.energy:.1f})")
        history.append(runner.path)
        
        # Visualizing final path for this generation
        maze.draw({'loc': runner.pos, 'energy': runner.energy, 'gen': gen}, runner.path)
        time.sleep(1)

    # EXPORT DATA
    with open("maze_paths.txt", "w") as f:
        for i, path in enumerate(history):
            f.write(f"GEN {i+1} PATH: {path}\n")
            
    print("\n========================================")
    print("   EXPERIMENT COMPLETE")
    print("   Paths exported to 'maze_paths.txt'")
    print("   Analyze Gen 1 vs Gen 3 for optimization.")
    print("========================================")

if __name__ == "__main__":
    run_experiment()