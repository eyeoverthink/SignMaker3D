import json
import os
import matplotlib.pyplot as plt
import numpy as np

def analyze_universe():
    # 1. Load Data
    data_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'discovered_elements.json')
    
    if not os.path.exists(data_path):
        print("No data found! Run collision.py first.")
        return

    with open(data_path, 'r') as f:
        universe = json.load(f)

    # 2. Extract Data Points
    masses = []
    stabilities = []
    names = []
    colors = []
    sizes = []

    base_elements = ['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca']

    print(f"Analyzing {len(universe)} elements...")

    for name, data in universe.items():
        m = data.get('mass', 0)
        s = data.get('stability', 0)
        
        if m > 0: # Filter out glitches
            masses.append(m)
            stabilities.append(s)
            names.append(name)
            
            # Color logic: Base elements are Blue, New discoveries are Gradient Red
            if name in base_elements:
                colors.append('#00ccff') # Cyan for base
                sizes.append(100)
            else:
                # Red intensity based on instability (Darker = Less Stable)
                colors.append(plt.cm.magma(s)) 
                sizes.append(30)

    # 3. Create the "Valley of Stability" Plot
    plt.style.use('dark_background')
    plt.figure(figsize=(12, 8))

    # Scatter plot
    scatter = plt.scatter(masses, stabilities, c=colors, s=sizes, alpha=0.7, edgecolors='none')

    # 4. Add Physics Trend Lines
    # Real physics says stability generally drops as mass increases (unless you hit a "magic number")
    z = np.polyfit(masses, stabilities, 2)
    p = np.poly1d(z)
    plt.plot(sorted(masses), p(sorted(masses)), "w--", alpha=0.3, label="General Trend")

    # 5. Label the "Monsters" (Heaviest Elements)
    # Find the top 5 heaviest elements
    sorted_indices = np.argsort(masses)
    for i in range(1, 6):
        idx = sorted_indices[-i]
        plt.annotate(f"{names[idx]}\n({masses[idx]:.0f}u)", 
                     (masses[idx], stabilities[idx]),
                     xytext=(0, 10), textcoords='offset points',
                     ha='center', fontsize=8, color='yellow')

    # Formatting
    plt.title(f"The Quantum Valley of Stability\n(Total Elements: {len(universe)})", fontsize=15, color='white')
    plt.xlabel("Atomic Mass (u)", fontsize=12)
    plt.ylabel("Stability Coefficient (0.0 - 1.0)", fontsize=12)
    plt.grid(True, alpha=0.1)
    
    # Highlight the "Floor"
    plt.axhline(y=0.5, color='r', linestyle=':', alpha=0.5, label="Critical Instability Limit")
    plt.legend()

    print("Rendering graph...")
    plt.show()

if __name__ == "__main__":
    analyze_universe()