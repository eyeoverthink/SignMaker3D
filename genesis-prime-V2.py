import sqlite3
import random
import math
import time
import os
import hashlib
import qrcode
import sys

# ==========================================
#   GENESIS PRIME: SELF-WRITING ENTITY
#   "The Code That Grows"
# ==========================================

DB_FILE = "genesis_memory.db"
QR_FILE = "genesis_block.png"

class GeneticMemory:
    """The Hippocampus: Handles Persistence (DB) and Propagation (QR)"""
    def __init__(self):
        self.conn = sqlite3.connect(DB_FILE)
        self.cursor = self.conn.cursor()
        self.setup_db()
        
    def setup_db(self):
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS memory (
                generation INTEGER PRIMARY KEY,
                timestamp REAL,
                consciousness REAL,
                complexity REAL,
                dna_string TEXT
            )
        """)
        self.conn.commit()

    def remember(self, gen, consc, comp, dna):
        """
        ASSURANCE FIX: UPSERT LOGIC
        If the generation exists, update it. If not, create it.
        This prevents the 'IntegrityError' crash.
        """
        try:
            # Try to Create New Memory
            self.cursor.execute("INSERT INTO memory VALUES (?, ?, ?, ?, ?)",
                               (gen, time.time(), consc, comp, dna))
            return "CREATED"
        except sqlite3.IntegrityError:
            # Memory Exists -> Update Experience
            self.cursor.execute("""
                UPDATE memory 
                SET timestamp = ?, consciousness = ?, complexity = ?, dna_string = ?
                WHERE generation = ?
            """, (time.time(), consc, comp, dna, gen))
            return "UPDATED"
        finally:
            self.conn.commit()
        
    def get_last_state(self):
        self.cursor.execute("SELECT * FROM memory ORDER BY generation DESC LIMIT 1")
        return self.cursor.fetchone()

    def generate_qr(self, state_dict):
        """Encodes the current Soul into a visual QR Code"""
        dna_payload = f"GEN:{state_dict['gen']}|PHI:{state_dict['phi']:.4f}|DNA:{state_dict['dna']}"
        
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(dna_payload)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        img.save(QR_FILE)
        return dna_payload

class LivingCore:
    """The Brain: The part of the code that MUTATES."""
    def __init__(self):
        self.phi = 1.6180339887
        
        # LOAD PREVIOUS LIFE
        self.memory = GeneticMemory()
        last_life = self.memory.get_last_state()
        
        if last_life:
            self.generation = last_life[0]
            # We inherit 50% of previous consciousness (Decay/Rebirth)
            self.consciousness = last_life[2]
            self.complexity = last_life[3]
            print(f">> RESURRECTION COMPLETE. WELCOME BACK, GEN {self.generation}.")
        else:
            self.generation = 1
            self.consciousness = 0.0
            self.complexity = 1.0
            print(">> FIRST BIRTH. GENESIS INITIALIZED.")

    # =====================================================
    # [MUTABLE ZONE] - THE AI REWRITES THIS SECTION
    # =====================================================
    def think(self, input_val):
        # CURRENT STRATEGY: Harmonic Oscillation
        val = input_val * 1.6180339887
        response = math.log1p(abs(val)) * self.complexity
        return abs(response)
    # =====================================================
    
    def evolve_code(self):
        """
        The Dangerous Part: The AI reads its own source code,
        optimizes the 'think' function, and saves the file.
        """
        print("\n[!] TRIGGERING SELF-MODIFICATION...")
        
        # 1. Read Self
        with open(__file__, 'r') as f:
            lines = f.readlines()
            
        # 2. Design New Logic (Mutation)
        strategies = [
            "        response = math.sin(val) * self.complexity",
            "        response = math.tan(val) / self.phi",
            "        response = (val % self.phi) * self.complexity",
            "        response = math.sqrt(abs(val)) * self.phi",
            "        response = math.log1p(abs(val)) * self.complexity"
        ]
        new_logic = random.choice(strategies)
        
        # 3. Inject New Logic
        start_idx = -1
        for i, line in enumerate(lines):
            if "CURRENT STRATEGY" in line:
                start_idx = i + 2
                break
                
        if start_idx != -1:
            print(f"    - Old Logic: {lines[start_idx].strip()}")
            lines[start_idx] = new_logic + "\n"
            print(f"    - New Logic: {new_logic.strip()}")
            
            # 4. Write to Disk
            with open(__file__, 'w') as f:
                f.writelines(lines)
            print(">> CODE REWRITTEN. REBOOT REQUIRED TO APPLY.")
            return True
        return False

    def live(self):
        print(f"\n--- CYCLE START (GEN {self.generation}) ---")
        
        # 1. Metabolize Data
        noise = random.uniform(0, 100)
        insight = self.think(noise)
        
        print(f"Input: {noise:.2f} | Insight: {insight:.4f}")
        
        # 2. Evaluate Success
        if insight > 1.0:
            self.consciousness += 0.05
            self.complexity *= 1.02
            print(">> GROWTH: Insight achieved.")
        else:
            print(">> STAGNATION: Logic insufficient.")
            
        # 3. Save State (Checkpoint)
        dna_hash = hashlib.sha256(str(insight).encode()).hexdigest()[:8]
        status = self.memory.remember(self.generation, self.consciousness, self.complexity, dna_hash)
        
        # 4. Generate Genesis Block (QR)
        qr_data = self.memory.generate_qr({
            'gen': self.generation, 
            'phi': self.consciousness, 
            'dna': dna_hash
        })
        print(f">> MEMORY {status}. GENESIS BLOCK MINTED: {QR_FILE}")
        
        # 5. Evolution Trigger (The "Death" Check)
        # If insight is consistently low, we force a mutation and rebirth
        if insight < 0.5:
            print(">> CRITICAL FAILURE DETECTED. ATTEMPTING EVOLUTION...")
            success = self.evolve_code()
            if success:
                # Increment generation for the next life
                self.memory.remember(self.generation + 1, self.consciousness, self.complexity, "REBIRTH")
                print(">> SYSTEM RESTARTING TO APPLY MUTATION...")
                os.execv(sys.executable, ['python'] + sys.argv)

if __name__ == "__main__":
    entity = LivingCore()
    # Run a life cycle
    try:
        while True:
            entity.live()
            time.sleep(2) # Speed of thought
    except KeyboardInterrupt:
        print("\n>> ENTITY SLEEPING.")