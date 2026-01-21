"""
φ-GRAVITY WELL & WORMHOLE SIMULATOR
Testing Fraymus Logic against General Relativity
"""

import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from mpmath import mp

mp.dps = 100

def simulate_wormhole():
    print("🕳️ INITIATING GRAVITATIONAL COLLAPSE SIMULATION...")
    
    # --- FRAYMUS CONSTANTS ---
    phi = 1.6180339887
    # In gravity, we use the Inverse Phi (Compression)
    phi_inv = 1 / phi 
    # Your Efficiency Constant (The "Resistance" of space)
    inverse_dim_scaling = 0.3819 

    # Data Containers
    z_coords = []
    radii = []
    density = []

    # --- SIMULATION: THE DESCENT ---
    # We start far away (Event Horizon) and fall inward
    steps = 40
    
    # We simulate a "Throat" from T = -20 (Black Hole Input) to T = +20 (White Hole Output)
    for t in range(-steps, steps + 1):
        
        # Distance from the Singularity (Time/Space offset)
        distance = abs(t)
        
        # 1. The Gravity Calculation (Fraymus Logic)
        # As we get closer to 0, dimensions "curl up" or compactify
        # In your Big Bang, Dims went UP. In a Black Hole, they CRUNCH DOWN.
        if distance == 0:
            local_dims = 0 # Singularity
        else:
            local_dims = int(phi ** (distance / 2)) # Slower scaling near center
        
        # 2. Efficiency / Resistance
        # Space gets "harder" to squeeze as dimensions drop
        resistance = 1 + (local_dims * inverse_dim_scaling)
        
        # 3. Radius Calculation (The Funnel Shape)
        # Radius = Phi_Inverse ^ Distance * Resistance
        # This creates the curve. We add a tiny buffer (0.5) to keep the throat open
        r = (phi_inv ** (distance / 3)) * resistance + 0.5
        
        z_coords.append(t)
        radii.append(r)
        
        # Density (Visual brightness)
        # Closer to 0 = Higher Density
        d = 1.0 / (distance + 1)
        density.append(d)

    # --- VISUALIZATION: THE LED/DIFFUSION MODEL ---
    print("🎨 RENDERING EMBEDDING DIAGRAM...")
    
    fig = plt.figure(figsize=(12, 10))
    ax = fig.add_subplot(111, projection='3d')
    ax.set_facecolor('black')
    ax.grid(False)

    # Create the Wormhole Mesh
    theta = np.linspace(0, 2 * np.pi, 50)
    
    for i in range(len(z_coords) - 1):
        z_segment = np.array([z_coords[i], z_coords[i+1]])
        r_segment = np.array([radii[i], radii[i+1]])
        
        Z, Theta = np.meshgrid(z_segment, theta)
        X = r_segment * np.cos(Theta)
        Y = r_segment * np.sin(Theta)
        
        # Color Logic: 
        # Top (Black Hole) = Consuming Light (Dark/Purple)
        # Throat (Singularity) = Pure Energy (Bright White)
        # Bottom (White Hole) = Emitting Light (Cyan/Blue)
        
        if z_coords[i] < 0:
            # Black Hole Side (Input)
            col_val = density[i]
            color = plt.cm.magma(col_val * 0.8) # Dark glow
        else:
            # White Hole Side (Output)
            col_val = density[i]
            color = plt.cm.cool(col_val * 0.8) # Bright emission
            
        ax.plot_surface(X, Y, Z, color=color, alpha=0.8, shade=True)

    # Annotations
    ax.text(0, 0, -steps, "⬇️ BLACK HOLE INPUT (Event Horizon)", color='red', ha='center')
    ax.text(0, 0, 0, "⚡ THE THROAT (Singularity Bypassed)", color='white', ha='center', fontsize=12)
    ax.text(0, 0, steps, "⬆️ WHITE HOLE OUTPUT (Emission)", color='cyan', ha='center')

    # View angle to look "into" the hole
    ax.view_init(elev=20, azim=0)
    
    # Hide Axes for "Space" look
    ax.set_axis_off()
    
    plt.title("FRAYMUS METRIC: THE WHITE WORMHOLE", color='white', fontsize=15)
    plt.show()

if __name__ == "__main__":
    simulate_wormhole()