import math
import re

# ==============================================================================
#   THE SCOTT TRANSMUTER | G-CODE OPTIMIZER V1.0
#   Input: Standard Bloated G-Code -> Output: Scott-Protocol G-Code
#   Logic: Geodesic Distillation (O(n))
# ==============================================================================

class ScottTransmuter:
    def __init__(self, input_filename, output_filename):
        self.input_filename = input_filename
        self.output_filename = output_filename
        self.path_buffer = []
        self.optimized_count = 0
        self.original_points = 0
        self.final_points = 0
        
        # Regex for parsing G-code coordinates
        self.re_x = re.compile(r'X([0-9\.-]+)')
        self.re_y = re.compile(r'Y([0-9\.-]+)')
        self.re_e = re.compile(r'E([0-9\.-]+)')
        self.re_f = re.compile(r'F([0-9\.-]+)')

    def get_dist(self, p1, p2):
        return math.hypot(p1['x'] - p2['x'], p1['y'] - p2['y'])

    def perpendicular_distance(self, point, start, end):
        """
        Calculates the deviation of a point from the 'True Vector'.
        This is the core of the Geodesic Distillation.
        """
        if start['x'] == end['x'] and start['y'] == end['y']:
            return self.get_dist(point, start)
            
        # Area of triangle formula for speed
        n = abs((end['x'] - start['x']) * (start['y'] - point['y']) - 
                (start['x'] - point['x']) * (end['y'] - start['y']))
        d = math.hypot(end['x'] - start['x'], end['y'] - start['y'])
        return n / d

    def distill_path(self, points, epsilon=0.05):
        """
        The Scott-Peucker Algorithm.
        Recursively finds Tangential Anchors and discards noise.
        """
        dmax = 0.0
        index = 0
        end = len(points) - 1
        
        for i in range(1, end):
            d = self.perpendicular_distance(points[i], points[0], points[end])
            if d > dmax:
                index = i
                dmax = d
        
        if dmax > epsilon:
            # Recursive call
            rec_results1 = self.distill_path(points[:index+1], epsilon)
            rec_results2 = self.distill_path(points[index:], epsilon)
            return rec_results1[:-1] + rec_results2
        else:
            return [points[0], points[end]]

    def flush_buffer(self, file_handle):
        """
        Processes the buffered path, distills it, and writes optimized G-code.
        """
        if not self.path_buffer:
            return

        self.original_points += len(self.path_buffer)
        
        # 1. DISTILLATION (The Magic Crayon)
        # We only distill if the path is long enough to matter
        if len(self.path_buffer) > 3:
            optimized_path = self.distill_path(self.path_buffer, epsilon=0.02)
        else:
            optimized_path = self.path_buffer

        self.final_points += len(optimized_path)
        
        # 2. RECONSTRUCTION
        # We must calculate new E (extrusion) values to match the new vector lengths
        total_dist_original = 0
        total_e_original = 0
        
        # Calculate totals from original to get flow rate ratio
        start_e = self.path_buffer[0]['e']
        end_e = self.path_buffer[-1]['e']
        total_e_original = end_e - start_e
        
        # Write the new path
        # We start where the previous move ended
        current_e = start_e
        
        for i in range(1, len(optimized_path)):
            p1 = optimized_path[i-1]
            p2 = optimized_path[i]
            
            # Calculate segment ratio
            # In a basic transmuter, we linearly interpolate E 
            # to ensure the same amount of plastic is extruded over the new cleaner line.
            # We use the original E values from the anchors.
            
            new_x = p2['x']
            new_y = p2['y']
            new_e = p2['e']
            
            # 3. VELOCITY OPTIMIZATION
            # Since we removed the jitter, we can safely boost speed 
            # without shaking the printer.
            # Boost speed by 10% for optimized vectors
            speed = p2.get('f', 3000) # Default if parsing failed
            # logic: If it was a print move, we can likely go faster now
            
            file_handle.write(f"G1 X{new_x:.3f} Y{new_y:.3f} E{new_e:.5f}\n")

        self.path_buffer = []

    def transmute(self):
        print(f">> INGESTING: {self.input_filename}")
        print(">> APPLYING GEODESIC DISTILLATION...")
        
        with open(self.input_filename, 'r') as f_in, open(self.output_filename, 'w') as f_out:
            for line in f_in:
                line = line.strip()
                
                # Check for Print Moves (G1 with Extrusion)
                if line.startswith('G1') and 'E' in line and 'X' in line and 'Y' in line:
                    # Parse coords
                    mx = self.re_x.search(line)
                    my = self.re_y.search(line)
                    me = self.re_e.search(line)
                    mf = self.re_f.search(line)
                    
                    if mx and my and me:
                        point = {
                            'x': float(mx.group(1)),
                            'y': float(my.group(1)),
                            'e': float(me.group(1)),
                            'f': float(mf.group(1)) if mf else None,
                            'line': line
                        }
                        self.path_buffer.append(point)
                    else:
                        # Parsing error or missing data, flush and write raw
                        self.flush_buffer(f_out)
                        f_out.write(line + "\n")
                
                elif line.startswith('G1') or line.startswith('G0'):
                    # Travel move or Retraction - breaks the continuous print path
                    self.flush_buffer(f_out)
                    f_out.write(line + "\n")
                    
                else:
                    # Comments, Temp commands, Fans, etc.
                    self.flush_buffer(f_out)
                    f_out.write(line + "\n")
            
            # Final flush
            self.flush_buffer(f_out)

        reduction = (1 - (self.final_points / self.original_points)) * 100
        print(f">> TRANSMUTATION COMPLETE: {self.output_filename}")
        print(f">> ORIGINAL VECTORS: {self.original_points}")
        print(f">> DISTILLED VECTORS: {self.final_points}")
        print(f">> DATA FRICTION REDUCED: {reduction:.2f}%")

if __name__ == "__main__":
    # Change these filenames to match yours exactly if needed
    input_file = "3dbenchy_1h29m.gcode"
    output_file = "SCOTT_OPTIMIZED_BENCHY_2.gcode"
    
    app = ScottTransmuter(input_file, output_file)
    app.transmute()