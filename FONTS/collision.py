"""
QUANTUM RANDOM COLLIDER V7 (STANDALONE EDITION)
Continuous Learning System with Passive Pattern Recognition
Merged V6 Engine + V7 Intelligence
"""

import os
import sys
import random
import json
import numpy as np
from datetime import datetime
from collections import defaultdict

class QuantumJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, set):
            return list(obj)
        if isinstance(obj, (np.int64, np.int32, np.float64, np.float32)):
            return float(obj)
        return json.JSONEncoder.default(self, obj)

class QuantumRandomColliderV7:
    def __init__(self):
        # 1. SETUP STORAGE
        # Uses the folder where this script is running
        self.data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
        os.makedirs(self.data_dir, exist_ok=True)
        self.json_encoder = QuantumJSONEncoder
        
        # 2. DEFINE BASE REALITY (The Standard Model)
        self.base_pool = {
            'H':  {'mass': 1.008,  'name': 'H',  'stability': 1.0},
            'He': {'mass': 4.003,  'name': 'He', 'stability': 1.0},
            'Li': {'mass': 6.941,  'name': 'Li', 'stability': 0.95},
            'Be': {'mass': 9.012,  'name': 'Be', 'stability': 0.90},
            'B':  {'mass': 10.811, 'name': 'B',  'stability': 0.85},
            'C':  {'mass': 12.011, 'name': 'C',  'stability': 1.0},
            'N':  {'mass': 14.007, 'name': 'N',  'stability': 1.0},
            'O':  {'mass': 15.999, 'name': 'O',  'stability': 1.0},
            'F':  {'mass': 18.998, 'name': 'F',  'stability': 0.92},
            'Ne': {'mass': 20.180, 'name': 'Ne', 'stability': 1.0},
            'Na': {'mass': 22.990, 'name': 'Na', 'stability': 0.88},
            'Mg': {'mass': 24.305, 'name': 'Mg', 'stability': 0.91},
            'Al': {'mass': 26.982, 'name': 'Al', 'stability': 0.95},
            'Si': {'mass': 28.086, 'name': 'Si', 'stability': 0.98},
            'P':  {'mass': 30.974, 'name': 'P',  'stability': 0.94},
            'S':  {'mass': 32.065, 'name': 'S',  'stability': 0.96},
            'Cl': {'mass': 35.453, 'name': 'Cl', 'stability': 0.93},
            'Ar': {'mass': 39.948, 'name': 'Ar', 'stability': 1.0},
            'K':  {'mass': 39.098, 'name': 'K',  'stability': 0.85},
            'Ca': {'mass': 40.078, 'name': 'Ca', 'stability': 0.92}
        }
        
        # 3. INITIALIZE MEMORY
        self.discovered_pool = {}
        self.collision_history = defaultdict(set)
        self.pattern_memory = {}
        
        # Load any previous runs if they exist
        self.load_data()

    # ==========================================
    # DATA MANAGEMENT
    # ==========================================
    def load_data(self):
        """Loads previous discoveries so you don't lose progress"""
        try:
            p_file = os.path.join(self.data_dir, 'pattern_memory.json')
            if os.path.exists(p_file):
                with open(p_file, 'r') as f: self.pattern_memory = json.load(f)
                
            d_file = os.path.join(self.data_dir, 'discovered_elements.json')
            if os.path.exists(d_file):
                # We only load discoveries that aren't in the base pool
                data = json.load(f)
                for k, v in data.items():
                    if k not in self.base_pool:
                        self.discovered_pool[k] = v
        except Exception as e:
            print(f"Note: Starting fresh (No save data found). {e}")

    def save_data(self):
        """Saves current state"""
        # Save Patterns
        with open(os.path.join(self.data_dir, 'pattern_memory.json'), 'w') as f:
            json.dump(self.pattern_memory, f, cls=self.json_encoder)
            
        # Save Elements (Base + Discovered)
        all_elements = {**self.base_pool, **self.discovered_pool}
        with open(os.path.join(self.data_dir, 'discovered_elements.json'), 'w') as f:
            json.dump(all_elements, f, cls=self.json_encoder)

    # ==========================================
    # PHYSICS ENGINE (The Logic from V6)
    # ==========================================
    def get_element_data(self, name):
        """Finds element data whether it is Base or Discovered"""
        if name in self.base_pool: return self.base_pool[name]
        if name in self.discovered_pool: return self.discovered_pool[name]
        return None

    def attempt_collision(self, e1_name, e2_name):
        """The Physics Calculation: Can these two fuse?"""
        p1 = self.get_element_data(e1_name)
        p2 = self.get_element_data(e2_name)
        
        if not p1 or not p2: return False

        # 1. Calculate Mass Ratio (Golden Ratio Preference)
        total_mass = p1['mass'] + p2['mass']
        ratio = p1['mass'] / p2['mass'] if p2['mass'] > p1['mass'] else p2['mass'] / p1['mass']
        
        # 2. Stability Calculation
        # Base stability is average of parents
        base_stability = (p1['stability'] + p2['stability']) / 2
        
        # Random Chaos Factor (Quantum Uncertainty)
        chaos = random.uniform(0.85, 1.05)
        
        # Final Success Probability
        success_prob = base_stability * chaos * 0.8 # 0.8 makes it harder to discover things
        
        # 3. ROLL THE DICE
        roll = random.random()
        is_success = roll < success_prob
        
        if is_success:
            # Create the New Element
            new_name = self._generate_name(e1_name, e2_name)
            new_element = {
                'name': new_name,
                'mass': total_mass * 0.99, # Tiny mass loss to binding energy
                'stability': success_prob,
                'parents': [e1_name, e2_name],
                'generation': datetime.now().strftime("%H:%M:%S")
            }
            
            # Register Discovery
            if new_name not in self.discovered_pool:
                self.discovered_pool[new_name] = new_element
                
                # MEMORIZE PATTERN (The V7 Brain)
                self.pattern_memory[new_name] = {
                    'parents': [e1_name, e2_name],
                    'mass_ratio': ratio,
                    'stability': success_prob
                }
            return True
        return False

    def _generate_name(self, n1, n2):
        """Simple naming algorithm: First half of A + Last half of B"""
        len1 = len(n1)//2 + 1
        len2 = len(n2)//2 + 1
        return (n1[:len1] + n2[-len2:]).capitalize()

    # ==========================================
    # AI CONTROLLER (The V7 Brain)
    # ==========================================
    def select_collision_candidates(self):
        """Intelligently picks two atoms to smash"""
        # Combine lists
        available = list(self.base_pool.keys()) + list(self.discovered_pool.keys())
        
        # V7 LOGIC: Look at pattern memory to find good parents
        # 30% chance to try a "Proven Strategy"
        if len(self.pattern_memory) > 5 and random.random() < 0.3:
            # Pick a successful past element
            past_success = random.choice(list(self.pattern_memory.values()))
            # Try to reuse one of its parents
            p1 = past_success['parents'][0]
            # Pick a random second
            p2 = random.choice(available)
            return p1, p2
            
        # Otherwise, Random Collision
        return random.choice(available), random.choice(available)

    # ==========================================
    # MAIN LOOP & VISUALIZER
    # ==========================================
    def render_table(self):
        """Draws the ASCII table"""
        # Get only new discoveries
        new_items = sorted(self.discovered_pool.values(), key=lambda x: x['mass'])
        
        print("\n" + "="*85)
        print(f"||  QUANTUM DISCOVERY LOG | Total Elements: {len(self.base_pool) + len(new_items)}")
        print("="*85)
        print(f"| {'NAME':<25} | {'MASS (u)':<12} | {'STABILITY':<10} | {'PARENTS'}")
        print("-" * 85)
        
        # Show last 8 for brevity
        for d in new_items[-8:]:
            parents = f"{d['parents'][0]} + {d['parents'][1]}"
            print(f"| {d['name']:<25} | {d['mass']:>12.3f} | {d['stability']:>10.3f} | {parents}")
        print("="*85 + "\n")

    def run(self, cycles=100):
        print("INITIALIZING QUANTUM RANDOM COLLIDER V7 (STANDALONE)...")
        print(f"Base Reality: {len(self.base_pool)} elements loaded.")
        
        for i in range(cycles):
            # 1. Pick Particles
            e1, e2 = self.select_collision_candidates()
            
            # 2. Smash
            success = self.attempt_collision(e1, e2)
            
            # 3. Visualization Update (Every 10 cycles)
            if i % 10 == 0:
                os.system('cls' if os.name == 'nt' else 'clear') # Clear screen
                self.render_table()
                print(f"Collision {i}/{cycles} | Attempting: {e1} + {e2} ... {'SUCCESS' if success else 'FIZZLE'}")
                self.save_data()

if __name__ == "__main__":
    collider = QuantumRandomColliderV7()
    # Run for 500 collisions
    collider.run(cycles=500)