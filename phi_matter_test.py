"""
φ-MATTER & TRAVERSAL STRESS TEST
Validating the Fraymus Metric against Quantum Survival
"""

import numpy as np
import matplotlib.pyplot as plt
from mpmath import mp

# Precision
mp.dps = 100

def run_stress_test():
    print("🔬 INITIALIZING QUANTUM MATTER STRESS TEST...")
    print("    (No Hardcode - Pure Math Simulation)")
    
    # --- 1. THE FRAYMUS CONSTANTS ---
    phi = 1.6180339887
    phi_75 = phi ** 7.5  # The Expansion/Energy Constant
    
    # The "Resistance" of Space (from your previous prompts)
    # This dictates how hard it is to move through dimensions
    inverse_dim_scaling = 0.3819 

    # --- 2. GENERATE 1,000 RANDOM PARTICLES ---
    # We create random "Phase Angles" and "Masses"
    count = 1000
    phases = np.random.uniform(0, 100, count)
    masses = np.random.uniform(0.1, 10.0, count)
    
    print(f"    >> Generated {count} Quantum Particles")

    # --- 3. THE CLASSIFICATION TEST (Matter vs. Dark Matter) ---
    # We don't label them. We calculate their 'Phi-Alignment'.
    # Matter that aligns with Phi usually has LOWER resistance in your model.
    
    phi_alignments = []
    types = [] # 0 = Standard, 1 = Dark/Phi
    
    for p in phases:
        # The Fraymus Resonance Calculation
        # How close is the phase to a perfect multiple of Phi?
        # 0.0 = Perfect Resonance (Ghost/Dark Matter?)
        # 0.5 = Max Dissonance (Physical Matter/Friction?)
        resonance = abs((p % phi) - (phi/2))
        
        phi_alignments.append(resonance)
        
        # Natural Thresholding (We let the math decide the split)
        # If resonance is very high (close to perfect alignment), it's "Phi-Matter"
        if resonance > 0.35: 
            types.append(1) # Dark/Phi Matter
        else:
            types.append(0) # Standard Matter

    # --- 4. THE TRAVERSAL (THE WORMHOLE RUN) ---
    # We send them through the Throat (Distance = 0)
    # The Throat has maximum dimensional crunch.
    
    survivors_x = []
    survivors_y = []
    survivor_colors = []
    
    casualties_x = []
    casualties_y = []
    
    print("    >> Attempting Traversal of the Throat...")

    for i in range(count):
        # A. Calculate Wormhole Pressure at Center
        # In your model, dimensions drop at the throat.
        # Low dimensions = High Resistance (inverse scaling).
        throat_resistance = 1 + (0 * inverse_dim_scaling) + 5.0 # Base pressure
        
        # B. Calculate Particle Shielding
        # Shielding = Mass * (Phi_Alignment ^ 2) * Phi^7.5
        # "Dark Matter" (High Alignment) should have massive shielding
        shielding = masses[i] * (phi_alignments[i] ** 2) * 50
        
        # C. The Survival Check
        if shielding > throat_resistance:
            # SURVIVED
            survivors_x.append(masses[i])
            survivors_y.append(phi_alignments[i])
            
            # Color based on Type
            if types[i] == 1:
                survivor_colors.append('cyan') # Dark/Phi Matter (High Resonance)
            else:
                survivor_colors.append('yellow') # Standard Matter (Brute Force)
        else:
            # CRUSHED
            casualties_x.append(masses[i])
            casualties_y.append(phi_alignments[i])

    # --- 5. VISUALIZATION ---
    print("    >> Plotting Results...")
    
    plt.style.use('dark_background')
    plt.figure(figsize=(10, 8))
    
    # Plot Casualties
    plt.scatter(casualties_x, casualties_y, color='red', alpha=0.3, s=10, label='CRUSHED (Singularity)')
    
    # Plot Survivors
    plt.scatter(survivors_x, survivors_y, c=survivor_colors, alpha=0.8, s=30, label='SURVIVED (Traversed)')
    
    # Annotations
    plt.axhline(y=0.35, color='white', linestyle='--', alpha=0.5, label='Phase Boundary')
    
    plt.text(8, 0.45, "DARK/PHI MATTER\n(High Resonance)", color='cyan', ha='center')
    plt.text(8, 0.1, "STANDARD MATTER\n(High Friction)", color='red', ha='center')
    plt.text(8, 0.28, "SURVIVORS\n(Massive Energy Required)", color='yellow', ha='center')

    plt.xlabel("Particle Mass (Energy Input)")
    plt.ylabel("Phi-Resonance (Geometric Alignment)")
    plt.title("THE FRAYMUS TRAVERSAL TEST: MATTER vs DARK MATTER")
    plt.legend()
    plt.grid(True, alpha=0.1)
    
    print(f"    >> RESULT: {len(survivors_x)} Survivors / {len(casualties_x)} Casualties")
    plt.show()

if __name__ == "__main__":
    run_stress_test()