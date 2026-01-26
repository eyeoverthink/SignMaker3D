import math
import re
import sys

# ==============================================================================
#   THE SCOTT TRANSMUTER | V1.1 (ADHESION FIX)
#   Fixes: Layer 1 Speed, Z-Height Safety, Explicit Feedrates
# ==============================================================================

class ScottTransmuter:
    def __init__(self, input_filename, output_filename):
        self.input_filename = input_filename
        self.output_filename = output_filename
        self.path_buffer = []
        self.original_points = 0
        self.final_points = 0
        self.current_z = 0.0
        self.current_f = 1200 # Default safe start speed
        
        # Regex
        self.re_x = re.compile(r'X([0-9\.-]+)')
        self.re_y = re.compile(r'Y([0-9\.-]+)')
        self.re_e = re.compile(r'E([0-9\.-]+)')
        self.re_f = re.compile(r'F([0-9\.-]+)')
        self.re_z = re.compile(r'Z([0-9\.-]+)')

    def perpendicular_distance(self, point, start, end):
        if start['x'] == end['x'] and start['y'] == end['y']:
            return math.hypot(point['x'] - start['x'], point['y'] - start['y'])
        n = abs((end['x'] - start['x']) * (start['y'] - point['y']) - 
                (start['x'] - point['x']) * (end['y'] - start['y']))
        d = math.hypot(end['x'] - start['x'], end['y'] - start['y'])
        return n / d

    def distill_path(self, points, epsilon=0.05):
        dmax = 0.0
        index = 0
        end = len(points) - 1
        for i in range(1, end):
            d = self.perpendicular_distance(points[i], points[0], points[end])
            if d > dmax:
                index = i
                dmax = d
        if dmax > epsilon:
            rec1 = self.distill_path(points[:index+1], epsilon)
            rec2 = self.distill_path(points[index:], epsilon)
            return rec1[:-1] + rec2
        else:
            return [points[0], points[end]]

    def flush_buffer(self, file_handle):
        if not self.path_buffer:
            return

        self.original_points += len(self.path_buffer)
        
        # LOGIC CHECK: Is this the First Layer? (Adhesion Critical)
        # If Z is low (< 0.35mm), DO NOT DISTILL. Print RAW for maximum grip.
        if self.current_z < 0.35:
            optimized_path = self.path_buffer # Pass through raw
        else:
            # Distill upper layers for speed
            if len(self.path_buffer) > 3:
                optimized_path = self.distill_path(self.path_buffer, epsilon=0.02)
            else:
                optimized_path = self.path_buffer

        self.final_points += len(optimized_path)
        
        # RECONSTRUCTION
        start_e = self.path_buffer[0]['e']
        end_e = self.path_buffer[-1]['e']
        total_e_delta = end_e - start_e
        
        # Total distilled distance to redistribute E
        total_dist_new = 0
        for i in range(1, len(optimized_path)):
            p1 = optimized_path[i-1]
            p2 = optimized_path[i]
            dist = math.hypot(p2['x']-p1['x'], p2['y']-p1['y'])
            total_dist_new += dist
            
        current_e_accum = start_e
        
        for i in range(1, len(optimized_path)):
            p2 = optimized_path[i]
            p1 = optimized_path[i-1]
            
            # Recalculate E based on new segment length ratio
            seg_dist = math.hypot(p2['x']-p1['x'], p2['y']-p1['y'])
            if total_dist_new > 0:
                e_fraction = seg_dist / total_dist_new
                current_e_accum += total_e_delta * e_fraction
            else:
                current_e_accum = p2['e']

            # SPEED LOGIC
            # If Layer 1, force SLOW speed (e.g., 20mm/s -> F1200)
            if self.current_z < 0.35:
                speed = 1200 # Slow for adhesion
            else:
                # If Upper Layer, use original speed OR boost
                speed = p2.get('f', self.current_f)
                # Slight boost for long vectors
                if seg_dist > 5.0: speed *= 1.1 
            
            self.current_f = speed # Update state
            
            file_handle.write(f"G1 X{p2['x']:.3f} Y{p2['y']:.3f} E{current_e_accum:.5f} F{int(speed)}\n")

        self.path_buffer = []

    def transmute(self):
        print(f">> INGESTING: {self.input_filename}")
        print(">> FIXING LAYER 1 ADHESION & DISTILLING UPPER LAYERS...")
        
        with open(self.input_filename, 'r') as f_in, open(self.output_filename, 'w') as f_out:
            for line in f_in:
                line = line.strip()
                
                # Track Z Height
                if 'Z' in line:
                    mz = self.re_z.search(line)
                    if mz: self.current_z = float(mz.group(1))

                # Track Feedrate (F) from any command
                if 'F' in line:
                    mf = self.re_f.search(line)
                    if mf: self.current_f = float(mf.group(1))

                # Capture Print Moves (Must have Extrusion)
                if line.startswith('G1') and 'E' in line and 'X' in line and 'Y' in line:
                    mx = self.re_x.search(line)
                    my = self.re_y.search(line)
                    me = self.re_e.search(line)
                    
                    if mx and my and me:
                        point = {
                            'x': float(mx.group(1)),
                            'y': float(my.group(1)),
                            'e': float(me.group(1)),
                            'f': self.current_f, # Store current state
                            'line': line
                        }
                        self.path_buffer.append(point)
                    else:
                        self.flush_buffer(f_out)
                        f_out.write(line + "\n")
                
                elif line.startswith('G1') or line.startswith('G0'):
                    self.flush_buffer(f_out)
                    f_out.write(line + "\n")
                else:
                    self.flush_buffer(f_out)
                    f_out.write(line + "\n")
            
            self.flush_buffer(f_out)

        print(f">> TRANSMUTATION COMPLETE: {self.output_filename}")

if __name__ == "__main__":
    # Ensure this input filename matches your uploaded file
    input_file = "3dbenchy_1h29m.gcode" 
    output_file = "SCOTT_OPTIMIZED_BENCHY_V1.1.gcode"
    
    app = ScottTransmuter(input_file, output_file)
    app.transmute()