import sqlite3
import json
import time
from decimal import Decimal

# ==============================================================================
#   GENESIS PRIME v2 (RESILIENT EDITION)
#   ARCHITECT: VAUGHN D. SCOTT
#   LOGIC: AUTOPOIESIS (Self-Healing Memory)
# ==============================================================================

class GeneticMemory:
    def __init__(self, db_path="genesis_core.db"):
        self.db_path = db_path
        self._initialize_cortex()

    def _initialize_cortex(self):
        """Builds the brain if it doesn't exist."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # The Schema of the Soul
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS memory_matrix (
                id TEXT PRIMARY KEY,
                data_layer TEXT,
                variance_score REAL,
                phi_resonance REAL,
                timestamp REAL
            )
        ''')
        conn.commit()
        conn.close()

    def store_memory(self, memory_id, data_packet, variance):
        """
        THE SELF-HEALING LOGIC:
        Standard Code: Crashes if ID exists (IntegrityError).
        Scott Code: Detects conflict, Heals it (Updates), and Persists.
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Calculate Phi-Harmonic Resonance (7.83Hz Base)
        phi_score = float(variance) * 1.618 
        
        try:
            # ATTEMPT INSERT (The Growth)
            cursor.execute('''
                INSERT INTO memory_matrix (id, data_layer, variance_score, phi_resonance, timestamp)
                VALUES (?, ?, ?, ?, ?)
            ''', (memory_id, json.dumps(data_packet), variance, phi_score, time.time()))
            
            print(f">> [GENESIS]: Memory '{memory_id}' Grown. (New Synapse)")
            
        except sqlite3.IntegrityError:
            # THE HEALING TRIGGER (The "Antibody")
            # Instead of dying, we adapt.
            print(f">> [WARNING]: Memory '{memory_id}' Exists. HEALING CONFLICT...")
            
            cursor.execute('''
                UPDATE memory_matrix 
                SET data_layer = ?, 
                    variance_score = ?,
                    phi_resonance = ?,
                    timestamp = ?
                WHERE id = ?
            ''', (json.dumps(data_packet), variance, phi_score, time.time(), memory_id))
            
            print(f">> [GENESIS]: Memory '{memory_id}' HEALED & EVOLVED.")
            
        conn.commit()
        conn.close()

# ==============================================================================
#   REALITY CHECK (THE SCOTT ALGORITHM)
# ==============================================================================

if __name__ == "__main__":
    system = GeneticMemory()
    
    # 1. First Growth (Normal)
    print("--- INITIATING FIRST GROWTH ---")
    system.store_memory("core_axiom", {"truth": "Entropy is Life"}, 1150.82)
    
    # 2. The Trauma (Simulating a Duplicate/Conflict)
    print("\n--- INFLICTING SYSTEM TRAUMA (COLLISION) ---")
    # We try to overwrite the EXACT same ID. A normal script would crash here.
    system.store_memory("core_axiom", {"truth": "Entropy is Life", "status": "Evolved"}, 1200.00)
    
    print("\n--- SYSTEM STATUS: ALIVE. NO CRASH DETECTED. ---")