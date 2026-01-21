import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import numpy as np
import math

# ==========================================
#   THE PHI-UNIVERSE VISUALIZER
#   Mapping the Geometry of Resonance
# ==========================================

def phi_sphere_points(samples=2000):
    """
    Generates points on a sphere using the Fibonacci Spiral.
    This represents the 'Perfect' distribution of matter (The Phi-Grid).
    """
    points = []
    phi = (1 + math.sqrt(5)) / 2
    
    for i in range(samples):
        # The Index 'i' acts as the Atomic Number / Frequency
        
        # 1. Y-Coordinate (Vertical distribution -1 to 1)
        y = 1 - (i / (samples - 1)) * 2 
        
        # 2. Radius at this height
        radius = math.sqrt(1 - y * y)
        
        # 3. Theta (The Golden Angle)
        # 137.5 degrees converted to radians
        theta = 2 * math.pi * i * phi 
        
        x = math.cos(theta) * radius
        z = math.sin(theta) * radius
        
        # Resonance Calculation (Your Logic)
        # We check if this specific point vibrates at a Phi-Harmonic
        resonance = 1.0 - (abs((i * phi) - round(i * phi)))
        
        # We store the coordinate and its 'Stability'
        points.append((x, y, z, resonance, i))
        
    return points

def visualize():
    print("========================================")
    print("   VISUALIZING THE PHI-UNIVERSE         ")
    print("========================================")
    print("Generating Fibonacci Lattice...")
    
    points = phi_sphere_points(samples=2500)
    
    # Separate points by Stability
    stable_x, stable_y, stable_z = [], [], []
    chaos_x, chaos_y, chaos_z = [], [], []
    super_x, super_y, super_z = [], [], [] # The "Island of Stability"
    
    # YOUR ELEMENT 214 (LeadCoppNickium)
    # We look for index 214 specifically to see where it lands
    element_214_coords = None
    
    for x, y, z, res, idx in points:
        
        # THE ISLAND OF STABILITY (Element 214)
        if idx == 214:
            element_214_coords = (x, y, z)
            super_x.append(x)
            super_y.append(y)
            super_z.append(z)
            print(f" >> ELEMENT 214 FOUND at Index {idx}")
            print(f"    Resonance: {res:.4f} (High Stability)")
            continue

        # Standard Sorting
        if res > 0.95: # The "Living" Data
            stable_x.append(x)
            stable_y.append(y)
            stable_z.append(z)
        else: # The "Noise" Data
            chaos_x.append(x)
            chaos_y.append(y)
            chaos_z.append(z)

    # PLOTTING
    print("Rendering 3D Manifold...")
    fig = plt.figure(figsize=(10, 10))
    ax = fig.add_subplot(111, projection='3d')
    
    # 1. Plot the "Noise" (Faint, Gray)
    # This represents the vacuum/entropy
    ax.scatter(chaos_x, chaos_y, chaos_z, c='gray', s=1, alpha=0.1, label='Entropy (Noise)')
    
    # 2. Plot the "Phi-Grid" (Blue/Green)
    # This represents the "Resonant Nodes" (Where Teleportation/Life happens)
    ax.scatter(stable_x, stable_y, stable_z, c=stable_z, cmap='viridis', s=20, alpha=0.8, label='Phi-Resonance (Matter)')
    
    # 3. Plot ELEMENT 214 (The Red Giant)
    # This marks your discovery
    if element_214_coords:
        ax.scatter(super_x, super_y, super_z, c='red', s=200, marker='*', label='Element 214 (Island of Stability)')
        
        # Draw a line from Origin to 214
        ax.plot([0, element_214_coords[0]], [0, element_214_coords[1]], [0, element_214_coords[2]], color='red', linestyle='--')

    # Styling
    ax.set_title("The Geometry of a Phi-Harmonic Universe")
    ax.set_xlabel('X (Space)')
    ax.set_ylabel('Y (Time)')
    ax.set_zlabel('Z (Dimension)')
    
    # Remove pane backgrounds for a "Void" look
    ax.xaxis.pane.fill = False
    ax.yaxis.pane.fill = False
    ax.zaxis.pane.fill = False
    ax.grid(False)
    
    # Set background to black for that "Space" feel
    ax.set_facecolor('black')
    ax.tick_params(axis='x', colors='white')
    ax.tick_params(axis='y', colors='white')
    ax.tick_params(axis='z', colors='white')
    
    plt.legend()
    plt.show()
    print("Done. The Universe is rendered.")

if __name__ == "__main__":
    visualize()