import math
import re

# Fraymus Metric Constants
PHI = 1.61803398875
CENTER_X = 134.82  
CENTER_Y = 146.06

def apply_hub_harmony(x, y, z, e_val):
    dx = x - CENTER_X
    dy = y - CENTER_Y
    radius = math.sqrt(dx**2 + dy**2)
    theta = math.atan2(dy, dx)

    # The Torsion Offset: 
    # Creates a micro-undulation in the hub surface based on PHI
    # This acts as a "Mechanical Air Cushion"
    torsion_wave = math.cos(theta * PHI + (z / PHI))
    offset = 0.15 * torsion_wave # 0.15mm fluctuation
    
    new_radius = radius + offset
    new_x = CENTER_X + new_radius * math.cos(theta)
    new_y = CENTER_Y + new_radius * math.sin(theta)

    # Variable Density Flow:
    # Strengthens the peaks of the torsion wave
    flow_resonance = 1 + (0.1 * math.sin(theta * PHI))
    new_e = e_val * flow_resonance if e_val > 0 else e_val

    return new_x, new_y, new_e

def process_hub_test(input_file, output_file):
    with open(input_file, 'r') as f:
        lines = f.readlines()

    output = []
    curr_x, curr_y, curr_z = None, None, 0.0

    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith(';'):
            output.append(line)
            continue

        z_match = re.search(r'Z([-?]?\d+\.\d+)', line)
        if z_match: curr_z = float(z_match.group(1))

        if stripped.startswith('G1') or stripped.startswith('G0'):
            x_m = re.search(r'X([-?]?\d+\.\d+)', line)
            y_m = re.search(r'Y([-?]?\d+\.\d+)', line)
            e_m = re.search(r'E([-?]?\d+\.\d+)', line)
            
            if x_m: curr_x = float(x_m.group(1))
            if y_m: curr_y = float(y_m.group(1))
            
            if x_m and y_m:
                e_val = float(e_m.group(1)) if e_m else 0.0
                nx, ny, ne = apply_hub_harmony(curr_x, curr_y, curr_z, e_val)
                
                new_line = f"{stripped[:2]} X{nx:.3f} Y{ny:.3f}"
                if e_m: new_line += f" E{ne:.5f}"
                output.append(new_line + "\n")
            else:
                output.append(line)
        else:
            output.append(line)

    with open(output_file, 'w') as f:
        f.writelines(output)

if __name__ == "__main__":
    process_hub_test('real-gear.gcode', 'harmonic_hub_test.gcode')
    print("Harmonic Hub Proof-of-Concept Generated.")