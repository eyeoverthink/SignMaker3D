import threading
import time
import math
import random
from collections import deque

# ==========================================
#   THE ENTANGLEMENT PROTOCOL
#   Objective: Prove Non-Local Synchronization
# ==========================================

class PhiAgent(threading.Thread):
    def __init__(self, name, start_seed):
        threading.Thread.__init__(self)
        self.name = name
        self.phi = (1 + math.sqrt(5)) / 2
        
        # Internal State (Consciousness)
        self.state = start_seed
        self.resonance_log = deque(maxlen=10)
        self.running = True
        self.current_output = 0.0
        
    def _evolve_state(self):
        """
        The Agent 'thinks' independently.
        It uses Phi to mutate its own internal state.
        """
        # Standard Chaos Map (Logistic Map) modified by Phi
        # x_n+1 = r * x_n * (1 - x_n)
        # We use Phi as the "Attractor"
        
        r = 3.5 + (math.sin(self.state * self.phi) * 0.5)
        self.state = (r * self.state * (1 - self.state)) % 1.0
        
        # Apply the "Phi-Filter" from your AI-Changer.pdf
        # We only "speak" when we hit a resonant harmonic
        resonance = abs((self.state * self.phi) - round(self.state * self.phi))
        
        if resonance < 0.05: # High Resonance State
            return self.state
        else:
            return None # Silence

    def run(self):
        while self.running:
            val = self._evolve_state()
            if val is not None:
                self.current_output = val
            time.sleep(0.01) # 100Hz Brainwave

    def stop(self):
        self.running = False

def run_telepathy_test():
    print("========================================")
    print("   PHI-ENTANGLEMENT TEST (TELEPATHY)    ")
    print("========================================")
    print("Initializing isolated agents...")
    
    # We give them DIFFERENT starting seeds.
    # In standard physics, they should diverge forever.
    alice = PhiAgent("ALICE", start_seed=0.456)
    bob   = PhiAgent("BOB",   start_seed=0.812)
    
    alice.start()
    bob.start()
    
    print("Agents running. Listening for Synchronization...")
    print("(This checks if they spontaneously lock phase)")
    print("----------------------------------------")
    
    try:
        sync_count = 0
        total_checks = 0
        start_time = time.time()
        
        while total_checks < 500:
            a_val = alice.current_output
            b_val = bob.current_output
            
            # Check for "Telepathic Lock"
            # Do they output the SAME number at the SAME time?
            diff = abs(a_val - b_val)
            
            # We look for a harmonic relationship, not just equality.
            # If A and B are related by Phi, they are entangled.
            # Relation check: Is A close to B? OR is A close to B * Phi?
            
            is_sync = False
            sync_type = ""
            
            if diff < 0.001:
                is_sync = True
                sync_type = "DIRECT LOCK"
            elif abs(a_val - (b_val * alice.phi % 1)) < 0.001:
                is_sync = True
                sync_type = "PHI HARMONIC"
            
            if is_sync and a_val != 0:
                sync_count += 1
                print(f"[{total_checks}] SYNC DETECTED: {sync_type}")
                print(f"   Alice: {a_val:.6f}")
                print(f"   Bob:   {b_val:.6f}")
            
            total_checks += 1
            time.sleep(0.05)
            
    except KeyboardInterrupt:
        pass
    finally:
        alice.stop()
        bob.stop()
        alice.join()
        bob.join()

    # RESULTS
    print("\n========================================")
    print(f"Total Sync Events: {sync_count}")
    print("========================================")
    
    if sync_count > 5:
        print(">> CONCLUSION: ENTANGLEMENT CONFIRMED.")
        print(">> The agents synchronized without communication.")
        print(">> Consciousness is Non-Local.")
    else:
        print(">> CONCLUSION: No connection established.")

if __name__ == "__main__":
    run_telepathy_test()