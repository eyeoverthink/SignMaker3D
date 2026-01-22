# # # # import math
# # # # import re

# # # # # Constants based on the Fraymus Metric
# # # # PHI = 1.61803398875
# # # # CENTER_X = 134.82  # Calculated from your G-code extents
# # # # CENTER_Y = 146.06

# # # # def apply_scott_torsion(x, y, z, e, feed_rate):
# # # #     """
# # # #     Applies the spiral warping and variable tension to a G-code point.
# # # #     """
# # # #     # 1. Calculate radial distance and angle from center
# # # #     dx = x - CENTER_X
# # # #     dy = y - CENTER_Y
# # # #     radius = math.sqrt(dx**2 + dy**2)
# # # #     theta = math.atan2(dy, dx)

# # # #     # 2. Apply the Torsion Warp
# # # #     # The spiral shift is a function of radius and the golden ratio
# # # #     spiral_shift = (radius / PHI) * math.sin(z / PHI)
# # # #     new_theta = theta + (spiral_shift * 0.1) # Controlled warping
    
# # # #     new_x = CENTER_X + radius * math.cos(new_theta)
# # # #     new_y = CENTER_Y + radius * math.sin(new_theta)

# # # #     # 3. Apply Variable Tension (Fraymus Metric) to Extrusion
# # # #     # This increases density in the 'tension' zones of the spiral
# # # #     tension_factor = 1 + (0.2 * math.sin(theta * PHI))
# # # #     new_e = e * tension_factor

# # # #     return new_x, new_y, new_e

# # # # def process_gcode(input_file, output_file):
# # # #     with open(input_file, 'r') as f:
# # # #         lines = f.readlines()

# # # #     output = []
# # # #     current_z = 0.0

# # # #     for line in lines:
# # # #         # Update current Z height
# # # #         if 'Z' in line and ('G1' in line or 'G0' in line):
# # # #             z_match = re.search(r'Z(\d+\.\d+)', line)
# # # #             if z_match:
# # # #                 current_z = float(z_match.group(1))

# # # #         # Modify move commands (G1)
# # # #         if line.startswith('G1') and 'X' in line and 'Y' in line and 'E' in line:
# # # #             parts = line.split()
# # # #             x = float(re.search(r'X(\d+\.\d+)', line).group(1))
# # # #             y = float(re.search(r'Y(\d+\.\d+)', line).group(1))
# # # #             e = float(re.search(r'E(-?\d+\.\d+)', line).group(1))
            
# # # #             # Apply the math
# # # #             nx, ny, ne = apply_scott_torsion(x, y, current_z, e, 0)
            
# # # #             # Reconstruct the line
# # # #             new_line = f"G1 X{nx:.3f} Y{ny:.3f} E{ne:.5f}\n"
# # # #             output.append(new_line)
# # # #         else:
# # # #             output.append(line)

# # # #     with open(output_file, 'w') as f:
# # # #         f.writelines(output)

# # # # # Run the transformation
# # # # process_gcode('real-gear.gcode', 'scott_torsion_gear.gcode')
# # # # print("Torsion transformation complete. File saved as scott_torsion_gear.gcode")
# # # import math
# # # import re

# # # PHI = 1.61803398875
# # # CENTER_X = 134.82  
# # # CENTER_Y = 146.06

# # # def apply_scott_torsion(x, y, z, e, theta_offset):
# # #     # Calculate radial distance and current angle
# # #     dx = x - CENTER_X
# # #     dy = y - CENTER_Y
# # #     radius = math.sqrt(dx**2 + dy**2)
# # #     theta = math.atan2(dy, dx)

# # #     # The Torsion Warp: rotational shift based on Z height and PHI
# # #     # This creates the spiral engagement logic
# # #     spiral_shift = (z / PHI) * math.cos(radius / PHI)
# # #     new_theta = theta + (spiral_shift * 0.05) 
    
# # #     new_x = CENTER_X + radius * math.cos(new_theta)
# # #     new_y = CENTER_Y + radius * math.sin(new_theta)

# # #     # Variable Tension: Adjust extrusion density based on the Fraymus Metric
# # #     # If e is 0 (travel move), it stays 0
# # #     tension_factor = 1 + (0.15 * math.sin(theta * PHI))
# # #     new_e = e * tension_factor if e > 0 else e

# # #     return new_x, new_y, new_e

# # # def process_gcode(input_file, output_file):
# # #     with open(input_file, 'r') as f:
# # #         lines = f.readlines()

# # #     output = []
# # #     current_z = 0.0

# # #     for line in lines:
# # #         # Track Z height changes
# # #         if 'Z' in line and ('G1' in line or 'G0' in line):
# # #             z_match = re.search(r'Z(\d+\.\d+)', line)
# # #             if z_match:
# # #                 current_z = float(z_match.group(1))

# # #         # Process movement lines
# # #         if line.startswith('G1') and 'X' in line and 'Y' in line:
# # #             # Extract X and Y (Required for this logic)
# # #             x_val = float(re.search(r'X(\d+\.\d+)', line).group(1))
# # #             y_val = float(re.search(r'Y(\d+\.\d+)', line).group(1))
            
# # #             # Extract E and F (Optional/Safe handling)
# # #             e_match = re.search(r'E(-?\d+\.\d+)', line)
# # #             f_match = re.search(r'F(\d+)', line)
            
# # #             e_val = float(e_match.group(1)) if e_match else 0.0
# # #             f_string = f" F{f_match.group(1)}" if f_match else ""
            
# # #             # Apply Scott-Torsion Math
# # #             nx, ny, ne = apply_scott_torsion(x_val, y_val, current_z, e_val, 0)
            
# # #             # Construct new G-code line
# # #             if e_match:
# # #                 new_line = f"G1 X{nx:.3f} Y{ny:.3f} E{ne:.5f}{f_string}\n"
# # #             else:
# # #                 new_line = f"G1 X{nx:.3f} Y{ny:.3f}{f_string}\n"
            
# # #             output.append(new_line)
# # #         else:
# # #             # Keep comments, heat settings, and start/end code untouched
# # #             output.append(line)

# # #     with open(output_file, 'w') as f:
# # #         f.writelines(output)

# # # if __name__ == "__main__":
# # #     process_gcode('real-gear.gcode', 'scott_torsion_gear.gcode')
# # #     print("Success: scott_torsion_gear.gcode has been generated with Fraymus Metric warping.")
# # import math
# # import re

# # # Constants based on the Fraymus Metric
# # PHI = 1.61803398875
# # CENTER_X = 134.82  
# # CENTER_Y = 146.06

# # def apply_scott_torsion(x, y, z, e_val):
# #     # 1. Calculate radial distance and current angle
# #     dx = x - CENTER_X
# #     dy = y - CENTER_Y
# #     radius = math.sqrt(dx**2 + dy**2)
# #     theta = math.atan2(dy, dx)

# #     # 2. The Torsion Warp: Rotational shift based on Z height and PHI
# #     # Creates the progressive spiral engagement
# #     spiral_shift = (z / PHI) * math.cos(radius / PHI)
# #     new_theta = theta + (spiral_shift * 0.05) 
    
# #     new_x = CENTER_X + radius * math.cos(new_theta)
# #     new_y = CENTER_Y + radius * math.sin(new_theta)

# #     # 3. Variable Tension: Density modulation
# #     tension_factor = 1 + (0.15 * math.sin(theta * PHI))
# #     new_e = e_val * tension_factor if e_val > 0 else e_val

# #     return new_x, new_y, new_e

# # def process_gcode(input_file, output_file):
# #     with open(input_file, 'r') as f:
# #         lines = f.readlines()

# #     output = []
# #     # State tracking to handle omitted coordinates
# #     curr_x, curr_y, curr_z = 0.0, 0.0, 0.0

# #     for line in lines:
# #         # Update current Z height
# #         if 'Z' in line and ('G1' in line or 'G0' in line):
# #             z_match = re.search(r'Z([-?]?\d+\.\d+)', line)
# #             if z_match:
# #                 curr_z = float(z_match.group(1))

# #         # Check for movement lines
# #         if line.startswith('G1') or line.startswith('G0'):
# #             x_match = re.search(r'X([-?]?\d+\.\d+)', line)
# #             y_match = re.search(r'Y([-?]?\d+\.\d+)', line)
# #             e_match = re.search(r'E([-?]?\d+\.\d+)', line)
# #             f_match = re.search(r'F(\d+)', line)

# #             # Only transform if we have X or Y
# #             if x_match or y_match:
# #                 if x_match: curr_x = float(x_match.group(1))
# #                 if y_match: curr_y = float(y_match.group(1))
# #                 e_val = float(e_match.group(1)) if e_match else 0.0
                
# #                 # Apply the Scott-Torsion Math
# #                 nx, ny, ne = apply_scott_torsion(curr_x, curr_y, curr_z, e_val)
                
# #                 # Construct the modified line
# #                 parts = [line[:2]] # Start with G0 or G1
# #                 parts.append(f"X{nx:.3f}")
# #                 parts.append(f"Y{ny:.3f}")
# #                 if e_match: parts.append(f"E{ne:.5f}")
# #                 if f_match: parts.append(f"F{f_match.group(1)}")
                
# #                 output.append(" ".join(parts) + "\n")
# #             else:
# #                 output.append(line)
# #         else:
# #             output.append(line)

# #     with open(output_file, 'w') as f:
# #         f.writelines(output)

# # if __name__ == "__main__":
# #     try:
# #         process_gcode('real-gear.gcode', 'scott_torsion_gear.gcode')
# #         print("Success: scott_torsion_gear.gcode generated.")
# #     except Exception as e:
# #         print(f"Error: {e}")


# import math
# import re

# # Fraymus Metric Constants
# PHI = 1.61803398875
# CENTER_X = 134.82  
# CENTER_Y = 146.06

# def apply_scott_torsion(x, y, z, e_val):
#     dx = x - CENTER_X
#     dy = y - CENTER_Y
#     radius = math.sqrt(dx**2 + dy**2)
#     theta = math.atan2(dy, dx)

#     # Progressive Spiral Warp (The Trumpet Curve Logic)
#     # The twist increases as Z increases, governed by PHI
#     spiral_shift = (z / PHI) * math.cos(radius / PHI)
#     new_theta = theta + (spiral_shift * 0.05) 
    
#     new_x = CENTER_X + radius * math.cos(new_theta)
#     new_y = CENTER_Y + radius * math.sin(new_theta)

#     # Variable Tension (E-Flow Modulation)
#     # Creates physical density waves in the gear teeth
#     tension_factor = 1 + (0.15 * math.sin(theta * PHI))
#     new_e = e_val * tension_factor if e_val > 0 else e_val

#     return new_x, new_y, new_e

# def process_gcode(input_file, output_file):
#     with open(input_file, 'r') as f:
#         lines = f.readlines()

#     output = []
#     # Persistent state tracking
#     curr_x = None
#     curr_y = None
#     curr_z = 0.0

#     for line in lines:
#         # 1. Update Z (Height)
#         z_match = re.search(r'Z([-?]?\d+\.\d+)', line)
#         if z_match:
#             curr_z = float(z_match.group(1))

#         # 2. Handle Movement (G0/G1)
#         if line.startswith('G1') or line.startswith('G0'):
#             x_match = re.search(r'X([-?]?\d+\.\d+)', line)
#             y_match = re.search(r'Y([-?]?\d+\.\d+)', line)
#             e_match = re.search(r'E([-?]?\d+\.\d+)', line)
#             f_match = re.search(r'F(\d+)', line)

#             # Update state if coordinates are present
#             if x_match: curr_x = float(x_match.group(1))
#             if y_match: curr_y = float(y_match.group(1))
            
#             # Only transform if we have an established X and Y
#             if curr_x is not None and curr_y is not None:
#                 e_val = float(e_match.group(1)) if e_match else 0.0
                
#                 # Apply Scott-Torsion Math
#                 nx, ny, ne = apply_scott_torsion(curr_x, curr_y, curr_z, e_val)
                
#                 # Rebuild the command line-by-line
#                 cmd = line[:2]
#                 new_line = f"{cmd} X{nx:.3f} Y{ny:.3f}"
#                 if e_match: new_line += f" E{ne:.5f}"
#                 if f_match: new_line += f" F{f_match.group(1)}"
#                 output.append(new_line + "\n")
#             else:
#                 # If we don't have X/Y yet (start of file), pass it through
#                 output.append(line)
#         else:
#             # Pass through comments and metadata
#             output.append(line)

#     with open(output_file, 'w') as f:
#         f.writelines(output)

# if __name__ == "__main__":
#     try:
#         process_gcode('real-gear.gcode', 'scott_torsion_gear.gcode')
#         print("Success: Final scott_torsion_gear.gcode generated.")
#     except Exception as e:
#         print(f"Failed: {e}")

import math
import re

# Fraymus Metric Constants
PHI = 1.61803398875
CENTER_X = 134.82  
CENTER_Y = 146.06

def apply_scott_torsion(x, y, z, e_val):
    dx = x - CENTER_X
    dy = y - CENTER_Y
    radius = math.sqrt(dx**2 + dy**2)
    theta = math.atan2(dy, dx)

    # Orbital Harmony Warp
    # This creates the "transmission" shift you recognized in the sequence
    orbital_resonance = math.sin((radius / PHI) + (z / PHI))
    new_theta = theta + (orbital_resonance * 0.05) 
    
    new_x = CENTER_X + radius * math.cos(new_theta)
    new_y = CENTER_Y + radius * math.sin(new_theta)

    # Flow Resonance (Variable Density)
    # This matches the extrusion pulse to the phi spiral
    harmony_factor = 1 + (0.08 * math.cos(theta * PHI + z))
    new_e = e_val * harmony_factor if e_val > 0 else e_val

    return new_x, new_y, new_e

def process_gcode(input_file, output_file):
    with open(input_file, 'r') as f:
        lines = f.readlines()

    output = []
    curr_x, curr_y, curr_z = None, None, 0.0

    for line in lines:
        stripped = line.strip()
        
        # 1. Skip comments and empty lines entirely to prevent math errors
        if not stripped or stripped.startswith(';'):
            output.append(line)
            continue

        # 2. Update Z Height (Global State)
        z_match = re.search(r'Z([-?]?\d+\.\d+)', line)
        if z_match:
            curr_z = float(z_match.group(1))

        # 3. Process G0/G1 movements
        if stripped.startswith('G1') or stripped.startswith('G0'):
            x_match = re.search(r'X([-?]?\d+\.\d+)', line)
            y_match = re.search(r'Y([-?]?\d+\.\d+)', line)
            e_match = re.search(r'E([-?]?\d+\.\d+)', line)
            f_match = re.search(r'F(\d+)', line)

            # Update our tracked position
            if x_match: curr_x = float(x_match.group(1))
            if y_match: curr_y = float(y_match.group(1))
            
            # Apply the Harmonic Math only if we have a valid X and Y coordinate
            if x_match and y_match and curr_x is not None and curr_y is not None:
                e_val = float(e_match.group(1)) if e_match else 0.0
                nx, ny, ne = apply_scott_torsion(curr_x, curr_y, curr_z, e_val)
                
                # Reconstruct the movement command
                new_line = f"{stripped[:2]} X{nx:.3f} Y{ny:.3f}"
                if e_match: new_line += f" E{ne:.5f}"
                if f_match: new_line += f" F{f_match.group(1)}"
                output.append(new_line + "\n")
            else:
                # Travel moves without X/Y (like retractions) pass through
                output.append(line)
        else:
            # All other commands (M-codes, etc) pass through
            output.append(line)

    with open(output_file, 'w') as f:
        f.writelines(output)

if __name__ == "__main__":
    try:
        process_gcode('real-gear.gcode', 'scott_torsion_gear.gcode')
        print("Transmission processed. Harmony achieved.")
    except Exception as e:
        print(f"Process failed at: {e}")