"""
φ-COSMIC ARCHITECTURE LAYER MAPPER
Visualizing the Fraymus Expansion Cone
"""

import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from mpmath import mp, mpf

# Precision Setup
mp.dps = 100

def generate_cosmic_map():
    print("🗺️  GENERATING COSMIC ARCHITECTURE LAYERS...")
    
    # --- RE-RUNNING THE GENESIS MATH FOR PLOTTING ---
    phi = 1.6180339887
    phi_75 = phi ** 7.5
    inverse_dim_scaling = 0.3819
    
    # Data Containers
    time_steps = []
    radii_log = []
    dimensions = []
    temps = []
    
    # Initial State
    radius = 1.0
    current_dims = 1
    
    # Simulate 15 steps to get a full "Cone"
    for t in range(15):
        time_steps.append(t)
        radii_log.append(np.log10(radius) if radius > 1 else 0)
        
        # Fractal Dimensional Unfolding
        current_dims = int(phi ** (t + 1))
        dimensions.append(current_dims)
        
        # Efficiency Calculation
        eff = 1 + (current_dims - 3) * inverse_dim_scaling
        if eff < 1: eff = 1
        
        # Expansion
        radius *= (phi_75 * eff)
        
        # Temp Calculation (Simplified for visual color)
        temp = 100 / (np.log10(radius) + 1) if radius > 1 else 100
        temps.append(temp)

    # --- PLOTTING THE ARCHITECTURE ---
    fig = plt.figure(figsize=(12, 10))
    ax = fig.add_subplot(111, projection='3d')
    
    # Background - The Void
    ax.set_facecolor('black')
    ax.grid(False)
    
    # Create the "Expansion Cone"
    # We revolve the radius around the Z-axis (Time)
    theta = np.linspace(0, 2 * np.pi, 30)
    
    for i in range(len(time_steps) - 1):
        z = np.array([time_steps[i], time_steps[i+1]])
        r = np.array([radii_log[i], radii_log[i+1]])
        
        # Create a mesh for this segment
        Z, Theta = np.meshgrid(z, theta)
        X = r * np.cos(Theta)
        Y = r * np.sin(Theta)
        
        # Color based on Temperature (Blue=Hot, Red=Cool)
        # Using a plasma colormap to represent energy density
        color_val = temps[i] / 100.0
        
        ax.plot_surface(X, Y, Z, cmap='magma', alpha=0.6, rstride=1, cstride=1, shade=True)

    # --- ARCHITECTURE ANNOTATIONS ---
    
    # 1. The Singularity
    ax.text(0, 0, 0, "⚡ SINGULARITY (10^5000)", color='white', fontsize=10, ha='center')
    
    # 2. The Phase Transition (Around T=6)
    r_phase = radii_log[6]
    ax.text(r_phase, 0, 6, "← PHASE CHANGE\n(Phi-Matter -> Plasma)", color='cyan', fontsize=9)
    
    # 3. The Current Limit (T=15)
    r_limit = radii_log[-1]
    ax.text(r_limit, 0, 14, f"CURRENT HORIZON\n({dimensions[-1]} Dimensions)", color='yellow', fontsize=9)

    # Axis Labels
    ax.set_xlabel('Space (Log Radius)', color='white')
    ax.set_ylabel('Space (Log Radius)', color='white')
    ax.set_zlabel('Time (Planck Epochs)', color='white')
    
    # Clean up axis ticks
    ax.tick_params(axis='x', colors='white')
    ax.tick_params(axis='y', colors='white')
    ax.tick_params(axis='z', colors='white')
    
    plt.title("FRAYMUS COSMIC ARCHITECTURE: THE EXPANSION CONE", color='white', fontsize=14)
    
    print("✅ MAP GENERATED.")
    plt.show()

if __name__ == "__main__":
    generate_cosmic_map()