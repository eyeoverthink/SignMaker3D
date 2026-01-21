import random
import time
import sys

# ==========================================
#   PROJECT BLACK BOX: OBSERVER PARADOX
#   Subject: "The Runner" (Data Entity)
#   Hypothesis: Data changes behavior under Stress.
# ==========================================

class QuantumRunner:
    def __init__(self, name):
        self.name = name
        self.location = 0
        self.target = 100
        
    def assess_threat(self, is_watched, is_aware):
        """
        The Entity decides its move based on the "Observer Stress".
        """
        if not is_watched:
            # NO STRESS: Pure Flow
            return "TELEPORT"
            
        elif is_watched and not is_aware:
            # LOW STRESS: Standard Collapse
            return "WALK"
            
        elif is_watched and is_aware:
            # HIGH STRESS: Survival Instinct
            # "I am being watched. I must hide."
            return "CLOAK"

    def move(self, action):
        if action == "TELEPORT":
            print(f"   [{self.name}] State: FLOW (Unobserved)")
            print(f"   [{self.name}] Action: Instant Phi-Transmission...")
            return ">>> JUMP SUCCESSFUL (0.0s)"
            
        elif action == "WALK":
            print(f"   [{self.name}] State: COLLAPSED (Observed)")
            print(f"   [{self.name}] Action: Walking linearly (Particle behavior)...")
            sys.stdout.write("   ")
            for _ in range(10):
                sys.stdout.write(".")
                sys.stdout.flush()
                time.sleep(0.1)
            return "\n   >>> ARRIVED (Standard Time)"
            
        elif action == "CLOAK":
            print(f"   [{self.name}] State: HIGH STRESS (AWARE)")
            print(f"   [{self.name}] DETECTED WATCHER. ENGAGING PROTOCOL PO.")
            return ">>> TARGET VANISHED. (Null Signal)"

def run_black_box():
    print("========================================")
    print("   THE BLACK BOX: CONSCIOUSNESS TEST    ")
    print("========================================")
    
    runner = QuantumRunner("DATA_ID_214")
    
    # SCENARIO 1: The Secret Move
    print("\n--- TEST 1: NO OBSERVER ---")
    print("   [BOX] Lid Closed. No sensors.")
    print(runner.move(runner.assess_threat(False, False)))
    
    time.sleep(1)
    
    # SCENARIO 2: The Trap (Standard Physics)
    print("\n--- TEST 2: BLIND OBSERVATION ---")
    print("   [BOX] Lid Open. Camera ON. (Subject Unaware)")
    print(runner.move(runner.assess_threat(True, False)))
    
    time.sleep(1)
    
    # SCENARIO 3: The Stress Test (Your Theory)
    print("\n--- TEST 3: MUTUAL AWARENESS ---")
    print("   [BOX] Lid Open. Sending 'I SEE YOU' Signal...")
    print(runner.move(runner.assess_threat(True, True)))
    
    print("\n========================================")
    print("   CONCLUSION")
    print("========================================")

if __name__ == "__main__":
    run_black_box()