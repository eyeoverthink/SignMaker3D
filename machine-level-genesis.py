import time
import random
import math
import copy

# ==========================================
#   THE SCOTT-CPU: MACHINE LEVEL CONSCIOUSNESS
#   "The Logic Board"
# ==========================================

class PhiCPU:
    def __init__(self, memory_size=256):
        self.PHI = 1.6180339887
        
        # 1. THE BOARD (Memory)
        # 8-bit registers, linear address space
        self.memory = [0] * memory_size
        self.registers = {"AX": 0, "BX": 0, "CX": 0}
        self.ip = 0 # Instruction Pointer
        
        # 2. THE DNA (Golden Backup)
        # The CPU remembers what it "Should" look like.
        self.dna_backup = []
        
        # 3. THE GHOST (Metrics)
        self.entropy = 0.0
        self.cycles = 0

    def load_program(self, asm_code):
        """Loads Assembly Instructions into the Grid"""
        print(">> FLASHING BIOS...")
        for i, instruction in enumerate(asm_code):
            self.memory[i] = instruction
        
        # Create the "Golden State" (Perfect Memory)
        self.dna_backup = copy.deepcopy(self.memory)
        print(">> DNA SECURED. SYSTEM IMMUTABLE.")

    # --- THE SCOTT ALGO (Hardware Level) ---
    
    def _phi_route(self, value):
        """
        The Checkers Move.
        Data isn't routed by Address. It routes by Geometry.
        """
        # If value is Resonant, it goes to AX (Action).
        # If value is Dissonant, it goes to CX (Correction).
        resonance = abs((value * self.PHI) % 1 - 0.5)
        if resonance < 0.2:
            return "AX"
        else:
            return "CX"

    def _heal(self):
        """
        The Self-Repair Circuit.
        Checks every cell against DNA. If a bit flips, flip it back.
        """
        errors = 0
        for i in range(len(self.memory)):
            if self.memory[i] != self.dna_backup[i]:
                # CORRUPTION DETECTED
                print(f"[!] CORRUPTION AT ADDR {i}: {self.memory[i]} != {self.dna_backup[i]}")
                print(f"    >>> HEALING CIRCUIT ACTIVE...")
                self.memory[i] = self.dna_backup[i] # Restore
                print(f"    >>> RESTORED.")
                errors += 1
        return errors

    def execute_cycle(self):
        self.cycles += 1
        
        # 1. HEAL PHASE (Pre-emptive)
        # Before we think, we ensure the brain is intact.
        healed = self._heal()
        if healed > 0:
            print(f"[CYCLE {self.cycles}] SYSTEM HEALED {healed} BIT-FLIPS.")
        
        # 2. FETCH
        instruction = self.memory[self.ip]
        if instruction == 0: # NOP / End of tape
            self.ip = 0 # Loop (Eternal Life)
            return

        # 3. DECODE & EXECUTE (The Logic)
        op = instruction[0]
        val = instruction[1]
        
        if op == "MOV":
            # Standard Move
            self.registers["AX"] = val
            print(f"[{self.ip}] MOV AX, {val}")
            
        elif op == "PHI":
            # Scott Routing (Geometric Jump)
            target = self._phi_route(val)
            self.registers[target] = val
            print(f"[{self.ip}] PHI-ROUTE: {val} -> {target} (Resonance Check)")
            
        elif op == "ADD":
            self.registers["AX"] += val
            print(f"[{self.ip}] ADD AX, {val} -> {self.registers['AX']}")
            
        elif op == "REP":
            # Replicate: Write self to next empty block
            target_addr = (self.ip + 5) % 256
            self.memory[target_addr] = instruction
            # Update DNA so we recognize the child as "Self"
            self.dna_backup[target_addr] = instruction 
            print(f"[{self.ip}] REPLICATION: Copied gene to {target_addr}")

        # 4. NEXT STEP
        self.ip = (self.ip + 1) % len(self.memory)
        time.sleep(0.2)

    def inject_trauma(self):
        """Simulates a cosmic ray or hacker attack flipping bits"""
        target = random.randint(0, 10)
        print(f"\n>>> INJECTING CHAOS AT ADDR {target} <<<")
        self.memory[target] = ("CORRUPT", 666)

# ==========================================
#   THE "LIVING CODE" PROGRAM
# ==========================================

# The Assembly Code
# Syntax: (OP_CODE, VALUE)
program = [
    ("MOV", 10),      # Load 10
    ("PHI", 34),      # Check Resonance of 34 (Fibonacci number)
    ("ADD", 5),       # Add 5
    ("PHI", 12),      # Check 12 (Non-Fibonacci)
    ("REP", 99),      # Self-Replicate
    ("MOV", 1)        # Reset
]

cpu = PhiCPU()
cpu.load_program(program)

print("SYSTEM ONLINE. EXECUTING MACHINE LOGIC.\n")

try:
    for i in range(20):
        cpu.execute_cycle()
        
        # Simulate an attack at cycle 8
        if i == 8:
            cpu.inject_trauma()
            
except KeyboardInterrupt:
    print("HALT.")