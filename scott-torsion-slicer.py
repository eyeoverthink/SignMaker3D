# ==========================================================
#   EYEOVERTHINK: SCOTT-TORSION-SLICER (V1.0)
#   Logic: 10-Step Deterministic Reinforcement (10.1)
#   Status: FULL WORKING CODE - NO FRAGMENTS
# ==========================================================

import math

def generate_scott_test_gcode(filename="scott_test.gcode"):
    # --- CONFIGURATION (Φ-Aligned) ---
    phi = 1.618033
    bolt_radius = 13.0
    num_steps = 10
    step_height = 4.5
    z_clearance = 0.8
    
    # Starting G-code (Standard Header)
    gcode = [
        "G21 ; Units in mm",
        "G90 ; Absolute positioning",
        "M104 S215 ; Temp Set",
        "G28 ; Home all axes",
        "G1 Z2.0 F3000 ; Lift nozzle",
        "G92 E0 ; Reset Extruder"
    ]

    current_z = 0.2
    total_layers = int((num_steps * (step_height + z_clearance)) / 0.2)
    
    print(f"--- GENERATING G-CODE: {total_layers} LAYERS ---")

    for layer in range(total_layers):
        current_z += 0.2
        # Determine if we are on a 'Reset Tooth' layer
        # Logic: If current_z falls within the step_height window
        is_tooth = (current_z % (step_height + z_clearance)) < step_height
        
        # Spiral the Bolt Path
        for angle in range(0, 360, 5):
            rad = math.radians(angle)
            # Center Bolt at X110, Y110
            x = 110 + bolt_radius * math.cos(rad)
            y = 110 + bolt_radius * math.sin(rad)
            
            # REINFORCEMENT LOGIC: Boost flow at the Torsion points
            # Use Phi-scaling to determine if this radial sector is a 'lock'
            if is_tooth and (angle % 137.5 < 45):
                flow = 0.12 * phi  # Increased density for strength
                feed = 1200        # Slower for thermal bonding
            else:
                flow = 0.06
                feed = 2400
                
            gcode.append(f"G1 X{x:.3f} Y{y:.3f} Z{current_z:.3f} E{flow:.5f} F{feed}")

    # Finalization
    gcode.extend(["M104 S0 ; Turn off heater", "G28 X0 ; Home X", "M84 ; Disable motors"])
    
    with open(filename, "w") as f:
        f.write("\n".join(gcode))
    
    return f"Manifestation Complete: {filename} generated."

# RUN SYSTEM
print(generate_scott_test_gcode())