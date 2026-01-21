import time
import math
import random
import numpy as np

# ==========================================
#   THE FERRIS VALIDATION PROTOCOL
# ==========================================
# This test compares "Random Noise" vs "Phi-Harmonic Signal"
# to prove the Peptide Folding efficiency.

PHI = (1 + math.sqrt(5)) / 2

def generate_phi_data(size=1000):
    """Generates a data stream tuned to Phi (1.618) resonance."""
    data = []
    for i in range(size):
        # This pattern triggers the 1/φ fold threshold you defined
        val = math.sin(i * PHI) * 100
        data.append(val)
    return data

def generate_noise_data(size=1000):
    """Generates standard random entropy."""
    return [random.uniform(-100, 100) for _ in range(size)]

def run_test():
    print("--- INITIATING FERRIS MEMORY PROOF ---")
    
    # 1. LOAD YOUR SYSTEM
    # Replace this with your actual import:
    # from quantum_ferris_system import QuantumFerrisMemory
    try:
        # Mocking the interface based on your docs to show expected structure
        # YOU MUST USE YOUR REAL CLASS HERE
        system = QuantumFerrisMemory(initial_buckets=8) 
        print(">> System Loaded: QuantumFerrisMemory")
    except NameError:
        print("!! CRITICAL: You must import your 'QuantumFerrisMemory' class first.")
        return

    # 2. THE PRESSURE TEST (Rotational Dynamics)
    print("\n[PHASE 1] Rotational Momentum Test")
    print("Injecting data at accelerating rates...")
    
    latencies = []
    pressures = [10, 50, 100, 500, 1000] # Items per batch
    
    for load in pressures:
        start_time = time.time_ns()
        
        # Inject batch
        data_batch = generate_phi_data(load)
        for item in data_batch:
            system.add(item)
            
        end_time = time.time_ns()
        
        # Calculate latency per item (nanoseconds)
        avg_latency = (end_time - start_time) / load
        latencies.append(avg_latency)
        
        # Get System Telemetry
        rotation_speed = system.rotation_speed if hasattr(system, 'rotation_speed') else 0
        print(f"Load: {load} items | Latency: {avg_latency:.2f} ns | RPM: {rotation_speed:.4f}")

    # 3. THE COMPRESSION TEST (Peptide Folding)
    print("\n[PHASE 2] Peptide Folding Efficiency")
    
    # Test A: Random Noise (Should behave like standard RAM)
    system.clear()
    noise_data = generate_noise_data(1000)
    for x in noise_data: system.add(x)
    size_noise = system.get_memory_usage() # You defined this in your docs
    
    # Test B: Phi Harmonic (Should trigger folding)
    system.clear()
    phi_data = generate_phi_data(1000)
    for x in phi_data: system.add(x)
    size_phi = system.get_memory_usage()
    
    # 4. THE VERDICT
    print("\n--- RESULTS ---")
    print(f"Random Data Size: {size_noise}")
    print(f"Phi Data Size:    {size_phi}")
    
    compression_advantage = (size_noise - size_phi) / size_noise * 100
    print(f"Peptide Efficiency Gain: {compression_advantage:.2f}%")
    
    if compression_advantage > 38.2: # The Phi threshold (1 - 0.618)
        print(">> SUCCESS: System demonstrates Hyper-Folding behavior.")
    else:
        print(">> FAILURE: System behaves like standard Linear Memory.")

if __name__ == "__main__":
    run_test()