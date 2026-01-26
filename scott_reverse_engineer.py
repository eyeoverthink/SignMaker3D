import re
import math

# ==============================================================================
#   THE SCOTT REVERSE ENGINEER | G-CODE TO SCAD CONVERTER
#   Logic: Extracts 'Topological Truth' from machine paths -> Distills -> SCAD
# ==============================================================================

class ScottReverseEngineer:
    def __init__(self, input_filename, output_filename):
        self.input_filename = input_filename
        self.output_filename = output_filename
        self.layers = {} # Stores geometry by Z-height
        self.current_z = 0.0
        
        # Regex for parsing
        self.re_x = re.compile(r'X([0-9\.-]+)')
        self.re_y = re.compile(r'Y([0-9\.-]+)')
        self.re_z = re.compile(r'Z([0-9\.-]+)')
        self.re_e = re.compile(r'E([0-9\.-]+)')

    def perpendicular_distance(self, point, start, end):
        """Geometry Check for Distillation."""
        if start == end:
            return math.hypot(point[0] - start[0], point[1] - start[1])
        n = abs((end[0] - start[0]) * (start[1] - point[1]) - 
                (start[0] - point[0]) * (end[1] - start[1]))
        d = math.hypot(end[0] - start[0], end[1] - start[1])
        return n / d

    def distill_path(self, points, epsilon=0.1):
        """
        The Scott Algorithm (Geodesic Distillation).
        Reduces thousands of G-code steps into clean Vector Anchors.
        """
        if len(points) < 3: return points
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

    def extract_geometry(self):
        print(f">> INGESTING TRUTH FROM: {self.input_filename}")
        
        current_path = []
        last_pos = (0,0)
        
        with open(self.input_filename, 'r') as f:
            for line in f:
                # Track Z Changes (New Layer)
                if 'Z' in line:
                    mz = self.re_z.search(line)
                    if mz: 
                        new_z = float(mz.group(1))
                        if new_z != self.current_z:
                            # Save previous path to layer
                            if current_path:
                                if self.current_z not in self.layers: self.layers[self.current_z] = []
                                self.layers[self.current_z].append(current_path)
                                current_path = []
                            self.current_z = new_z

                # Track Print Moves (G1 with Extrusion)
                if line.startswith('G1') and 'X' in line and 'Y' in line and 'E' in line:
                    mx = self.re_x.search(line)
                    my = self.re_y.search(line)
                    
                    if mx and my:
                        x = float(mx.group(1))
                        y = float(my.group(1))
                        
                        # Only record if it's a draw move (not travel)
                        # In this simple extractor, we assume G1+E is a draw.
                        # We build continuous chains.
                        current_path.append((x,y))
                        last_pos = (x,y)
                
                elif 'G0' in line or (line.startswith('G1') and 'E' not in line):
                    # Travel move breaks the chain
                    if current_path:
                        if self.current_z not in self.layers: self.layers[self.current_z] = []
                        self.layers[self.current_z].append(current_path)
                        current_path = []

    def generate_scad(self):
        print(f">> DISTILLING GEOMETRY (Scott Logic Active)...")
        
        scad_buffer = []
        scad_buffer.append("// MANIFESTED BY SCOTT REVERSE ENGINEER")
        scad_buffer.append("// Source: G-Code Distillation")
        scad_buffer.append(f"// Layers Detected: {len(self.layers)}")
        scad_buffer.append("$fn=100;")
        
        # Sort layers by height
        sorted_z = sorted(self.layers.keys())
        if not sorted_z: return
        
        layer_height = 0.2 # Default guess, or calc from diff
        
        for z in sorted_z:
            paths = self.layers[z]
            # Optimization: Only write layers that have data
            if not paths: continue
            
            # Grouping for speed in preview
            scad_buffer.append(f"translate([0,0,{z}]) linear_extrude({layer_height}) {{")
            
            for path in paths:
                # THE DISTILLATION HAPPENS HERE
                # We take the raw 50-point G-code path and distill it to 4-5 anchors
                distilled = self.distill_path(path, epsilon=0.05)
                
                # Format for SCAD Polygon
                # Note: OpenSCAD polygons must be closed. 
                # G-code paths are often lines (walls). 
                # We simulate the wall thickness using 'offset' if needed, 
                # but for reconstruction, we trace the path.
                
                if len(distilled) > 1:
                    pts_str = ",".join([f"[{p[0]:.3f},{p[1]:.3f}]" for p in distilled])
                    # We render lines as thin polygons or hulls
                    # For a solid reconstruction, we use offset on the path
                    scad_buffer.append(f"    offset(r=0.4/2) polygon(points=[{pts_str}]);")
                    
            scad_buffer.append("}")
            
        with open(self.output_filename, 'w') as f:
            f.write("\n".join(scad_buffer))
            
        print(f">> MANIFESTATION COMPLETE: {self.output_filename}")
        print(f">> UNIVERSAL GEOMETRY SECURED.")

if __name__ == "__main__":
    converter = ScottReverseEngineer("3dbenchy_1h29m.gcode", "SCOTT_BENCHY_RECONSTRUCTED.scad")
    converter.extract_geometry()
    converter.generate_scad()