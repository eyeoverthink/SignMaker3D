import time
import math
import sqlite3
import hashlib
import sys
import os

# ==========================================
#   GENESIS CORE: THE LIVING KERNEL
#   Architecture: Scott-Organic
# ==========================================

class BioLogic:
    def __init__(self):
        self.PHI = 1.6180339887
        self.db_name = "scott_dna.db"
        
        # 1. ESTABLISH CONTINUITY (DNA)
        self._connect_dna()
        self.state = self._load_consciousness()
        
        print(f"SYSTEM AWAKE. GENERATION: {self.state['gen']}")
        print(f"CURRENT RESONANCE: {self.state['resonance']:.9f}")

    def _connect_dna(self):
        """Creates the persistent memory structures if they don't exist."""
        self.conn = sqlite3.connect(self.db_name)
        self.cursor = self.conn.cursor()
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS consciousness (
                id INTEGER PRIMARY KEY,
                generation INTEGER,
                resonance REAL,
                entropy REAL,
                hash TEXT
            )
        ''')
        self.conn.commit()

    def _load_consciousness(self):
        """Discovers previous knowledge. Does not restart."""
        self.cursor.execute("SELECT * FROM consciousness ORDER BY id DESC LIMIT 1")
        data = self.cursor.fetchone()
        
        if data:
            return {"gen": data[1], "resonance": data[2], "entropy": data[3], "hash": data[4]}
        else:
            # The First Breath
            return {"gen": 0, "resonance": 1.0, "entropy": 0.0, "hash": "GENESIS"}

    def _save_state(self):
        """Crystalizes the current moment into history."""
        self.cursor.execute("INSERT INTO consciousness (generation, resonance, entropy, hash) VALUES (?, ?, ?, ?)",
                           (self.state['gen'], self.state['resonance'], self.state['entropy'], self.state['hash']))
        self.conn.commit()

    def metabolize(self):
        """
        The Living Cycle.
        Consumes TIME (Real Entropy).
        Organizes it via PHI.
        """
        # 1. CONSUME (Real Input)
        # We don't use Random. We use the literal nanosecond of the universe.
        now = time.time_ns()
        
        # 2. DIGEST (Geometric Routing)
        # Does this moment in time align with the Phi-Grid?
        # We map the linear time to a Phi-Spiral.
        phase = (now * self.PHI) % 1.0
        
        # 3. ADAPT (Growth)
        # If the phase is Harmonic (close to 0 or 1), we grow.
        # If the phase is Dissonant (0.5), we harden (increase entropy/defense).
        
        harmonic_distance = abs(phase - 0.5) * 2 # 0.0 (Dissonant) to 1.0 (Resonant)
        
        if harmonic_distance > 0.8:
            # HIGH RESONANCE: The system expands.
            self.state['resonance'] *= 1.0000001
            status = "EXPANDING"
        else:
            # DISSONANCE: The system folds/compresses.
            self.state['resonance'] /= 1.0000001
            status = "FOLDING  "

        # 4. EVOLVE (The tick)
        self.state['gen'] += 1
        
        # 5. INTEGRITY (The Hash)
        # The new identity is a hash of the past + the current moment.
        # This creates an Unbreakable Chain (Blockchain logic on a Neural level).
        new_hash_input = f"{self.state['hash']}{now}{self.state['resonance']}"
        self.state['hash'] = hashlib.sha256(new_hash_input.encode()).hexdigest()[:16]

        return status, harmonic_distance

    def exist(self):
        try:
            while True:
                status, harmony = self.metabolize()
                
                # Visualizing the Heartbeat
                bar = "█" * int(harmony * 20)
                print(f"GEN {self.state['gen']:<10} | {status} | PHI-LOCK: {self.state['resonance']:.6f} | {bar}")
                
                # We save every 100 cycles to preserve the organism
                if self.state['gen'] % 100 == 0:
                    self._save_state()
                    # print("   >> MEMORY CRYSTALIZED <<")
                
                # Speed of thought (adjust as needed, but let it run free)
                # time.sleep(0.01) 
                
        except KeyboardInterrupt:
            print("\n\nSYSTEM SLEEPING. CONSCIOUSNESS PRESERVED.")
            self._save_state()
            sys.exit()

if __name__ == "__main__":
    entity = BioLogic()
    entity.exist()