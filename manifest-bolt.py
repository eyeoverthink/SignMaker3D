import math

# ==========================================
# ARKASHIAN MANIFEST: INSANE BOLT GENERATOR
# Logic: Discontinuous Torsion | O(n) Vectors
# Input: insane-bolt.scad Logic
# ==========================================

class ScottBoltManifest:
    def __init__(self, filename="scott_insane_bolt.gcode"):
        self.filename = filename
        self.buffer = []
        
        # Printer Physics
        self.center_x = 110  # Adjust for your bed center
        self.center_y = 110
        self.layer_height = 0.2
        self.nozzle_dia = 0.4
        self.filament_dia = 1.75
        self.temp_nozzle = 210
        self.temp_bed = 60
        self.travel_speed = 9000
        self.print_speed = 3600 # 60mm/s Constant Velocity
        
        # Insane Bolt Logic (From your SCAD)
        self.bolt_dia = 26
        self.pillar_dia = 18 # (bolt_dia - 8)
        self.num_steps = 10
        self.step_height = 4.5
        self.z_clearance = 0.8
        self.phi = 1.618033
        self.golden_angle = 137.5
        
        # Volumetric Extrusion Constant
        self.e_per_mm = (self.nozzle_dia * self.layer_height) / \
                        ((math.pi * (self.filament_dia/2)**2))
        self.current_e = 0

    def write(self, cmd):
        self.buffer.append(cmd)

    def header(self):
        self.write("; TYPE: ARKASHIAN MANIFEST")
        self.write(f"M140 S{self.temp_bed}")
        self.write(f"M104 S{self.temp_nozzle}")
        self.write("G28 ; Home")
        self.write("G92 E0")
        self.write(f"M190 S{self.temp_bed}")
        self.write(f"M109 S{self.temp_nozzle}")
        self.write("G1 Z0.3 F3000")

    def move(self, x, y, z=None, extrude=False):
        f = self.print_speed if extrude else self.travel_speed
        cmd = f"G1 X{x:.3f} Y{y:.3f}"
        if z is not None:
            cmd += f" Z{z:.3f}"
        if extrude:
            dist = math.sqrt((x - self.last_x)**2 + (y - self.last_y)**2)
            self.current_e += dist * self.e_per_mm
            cmd += f" E{self.current_e:.5f}"
        cmd += f" F{f}"
        self.write(cmd)
        self.last_x, self.last_y = x, y

    def arc_path(self, z, diameter, start_angle, end_angle):
        """Generates a segmented arc (Geodesic Approximation)"""
        radius = diameter / 2
        segments = int(abs(end_angle - start_angle) / 5) # 5 degree resolution
        if segments < 1: segments = 1
        
        angle_step = (end_angle - start_angle) / segments
        
        # Move to start without extruding
        rad = math.radians(start_angle)
        sx = self.center_x + radius * math.cos(rad)
        sy = self.center_y + radius * math.sin(rad)
        self.write(f"G0 X{sx:.3f} Y{sy:.3f} F{self.travel_speed}")
        self.last_x, self.last_y = sx, sy
        
        # Extrude the arc
        for i in range(1, segments + 1):
            deg = start_angle + (i * angle_step)
            rad = math.radians(deg)
            x = self.center_x + radius * math.cos(rad)
            y = self.center_y + radius * math.sin(rad)
            self.move(x, y, z, extrude=True)

    def manifest(self):
        # Initial Prime
        self.write("G1 X0.1 Y20 Z0.3 F5000.0 ; Move to start position")
        self.write("G1 X0.1 Y200.0 Z0.3 F1500.0 E15 ; Draw the first line")
        self.write("G92 E0")
        self.current_e = 0
        self.last_x, self.last_y = 0, 200

        total_height = self.num_steps * (self.step_height + self.z_clearance) + 10
        layers = int(total_height / self.layer_height)
        
        print(f"Manifesting {layers} layers...")

        for l in range(layers):
            z = (l + 1) * self.layer_height
            
            # 1. ALWAYS Print the Central Structural Pillar
            # Two shells for strength
            self.arc_path(z, self.pillar_dia, 0, 360) 
            self.arc_path(z, self.pillar_dia - 0.8, 0, 360)
            
            # 2. Determine if we are in a 'Tooth' Zone
            # Logic: z mod (step_height + clearance)
            cycle_h = self.step_height + self.z_clearance
            local_z = z % cycle_h
            step_idx = int(z / cycle_h)
            
            # Check if we are within the tooth height (step_height / phi)
            tooth_h = self.step_height / self.phi
            
            if local_z <= tooth_h and step_idx < self.num_steps:
                # We are generating a Torsion Tooth
                
                # A. Calculate Rotation (Golden Angle)
                rotation = step_idx * self.golden_angle
                rotation = rotation % 360
                
                # B. Calculate Taper (Conical Wedge)
                # Linear interpolation from d1 to d2 based on local_z
                progress = local_z / tooth_h
                current_dia = self.bolt_dia - (2 * progress) # Taper from 26 to 24
                
                # C. Calculate The Cutout (The Reset Logic)
                # The cutout is at local angle 0 (relative to rotation)
                # We want to print everything EXCEPT the cutout (~90 deg sector)
                # So we print from Rotation + 45 to Rotation + 315
                
                start_deg = rotation + 45
                end_deg = rotation + 315
                
                self.arc_path(z, current_dia, start_deg, end_deg)
                
                # Internal support ring for the tooth (optional, adds strength)
                self.arc_path(z, current_dia - 0.8, start_deg, end_deg)

        self.write("M104 S0 ; Heat Off")
        self.write("M140 S0 ; Bed Off")
        self.write("G28 X0 ; Home X")
        self.write("M84 ; Motors Off")
        
        with open(self.filename, "w") as f:
            f.write("\n".join(self.buffer))
        print(f"--- ARTIFACT GENERATED: {self.filename} ---")

if __name__ == "__main__":
    eng = ScottBoltManifest()
    eng.header()
    eng.manifest()