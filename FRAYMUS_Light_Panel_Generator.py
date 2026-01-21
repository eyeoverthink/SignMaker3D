import math
import numpy as np
from typing import List, Tuple

# ==============================================================================
#   FRAYMUS LIGHT PANEL GENERATOR v1.0
#   Decorative Light Panels with Phi-Based Geometric Patterns
#   Architecture: FRAYMUS (Fractal Resonance Architecture)
#   Brand: Eyeoverthink Productions LLC
# ==============================================================================

class FRAYMUSLightPanelGenerator:
    def __init__(self, filename="FRAYMUS_Light_Panel.stl"):
        self.filename = filename
        self.facets = []
        self.PHI = 1.6180339887
        self.GOLDEN_ANGLE = 2.39996323  # 137.507764 degrees in radians
        
    def add_triangle(self, p1, p2, p3):
        """Add a triangle facet with automatic normal calculation"""
        v1 = np.array([p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]])
        v2 = np.array([p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]])
        normal = np.cross(v1, v2)
        length = np.linalg.norm(normal)
        if length > 0:
            normal = normal / length
        else:
            normal = np.array([0, 0, 1])
        
        self.facets.append((tuple(normal), p1, p2, p3))
    
    def phi_spiral_pattern(self, x, y, iterations=8):
        """Generate phi-based spiral pattern (Fibonacci/Golden Spiral)"""
        r = math.sqrt(x*x + y*y)
        theta = math.atan2(y, x)
        
        # Logarithmic spiral with phi growth rate
        spiral_value = 0
        for i in range(iterations):
            angle = theta + i * self.GOLDEN_ANGLE
            radius = r / (self.PHI ** i)
            spiral_value += math.sin(angle * self.PHI + radius * 0.1)
        
        return spiral_value / iterations
    
    def phi_vortex_pattern(self, x, y, iterations=8):
        """Generate phi-vortex lattice structure"""
        r = math.sqrt(x*x + y*y)
        theta = math.atan2(y, x)
        
        vortex = 0
        for i in range(iterations):
            angle_offset = i * self.GOLDEN_ANGLE
            vortex += math.sin(theta * (i + 1) + angle_offset) * math.cos(r * 0.05 * self.PHI ** i)
        
        return vortex / iterations
    
    def tree_of_life_pattern(self, x, y, iterations=8):
        """Generate tree-like branching pattern using L-system inspired by phi"""
        r = math.sqrt(x*x + y*y)
        theta = math.atan2(y, x)
        
        # Branching at golden angle intervals
        branches = 0
        for i in range(iterations):
            branch_angle = theta + i * self.GOLDEN_ANGLE
            branch_radius = r - i * 10
            if branch_radius > 0:
                branches += math.exp(-abs(math.sin(branch_angle * 3)) * 0.5)
        
        return branches / iterations
    
    def sacred_geometry_pattern(self, x, y, symmetry=6):
        """Generate sacred geometry (Flower of Life, Metatron's Cube)"""
        r = math.sqrt(x*x + y*y)
        theta = math.atan2(y, x)
        
        # Create overlapping circles at phi-scaled radii
        pattern = 0
        for i in range(symmetry):
            angle = i * 2 * math.pi / symmetry
            cx = 30 * math.cos(angle)
            cy = 30 * math.sin(angle)
            dist = math.sqrt((x - cx)**2 + (y - cy)**2)
            pattern += math.sin(dist * 0.2 * self.PHI)
        
        return pattern / symmetry
    
    def fibonacci_flower_pattern(self, x, y, iterations=8):
        """Generate sunflower/daisy pattern using Fibonacci phyllotaxis"""
        r = math.sqrt(x*x + y*y)
        theta = math.atan2(y, x)
        
        # Vogel's model for optimal packing
        pattern = 0
        for i in range(iterations * 10):
            angle = i * self.GOLDEN_ANGLE
            radius = math.sqrt(i) * 3
            px = radius * math.cos(angle)
            py = radius * math.sin(angle)
            dist = math.sqrt((x - px)**2 + (y - py)**2)
            pattern += math.exp(-dist * 0.1)
        
        return min(pattern, 1.0)
    
    def golden_mandala_pattern(self, x, y, symmetry=8, iterations=5):
        """Generate mandala with golden ratio proportions"""
        r = math.sqrt(x*x + y*y)
        theta = math.atan2(y, x)
        
        pattern = 0
        for i in range(iterations):
            radius_ring = 20 * (self.PHI ** i)
            ring_value = math.sin((r - radius_ring) * 0.5)
            angular_value = math.sin(theta * symmetry + i * self.GOLDEN_ANGLE)
            pattern += ring_value * angular_value
        
        return pattern / iterations
    
    def voronoi_organic_pattern(self, x, y, seed_count=20):
        """Generate organic Voronoi-like pattern with phi-distributed seeds"""
        # Generate seed points using golden angle
        min_dist = float('inf')
        for i in range(seed_count):
            angle = i * self.GOLDEN_ANGLE
            radius = math.sqrt(i) * 15
            sx = radius * math.cos(angle)
            sy = radius * math.sin(angle)
            dist = math.sqrt((x - sx)**2 + (y - sy)**2)
            min_dist = min(min_dist, dist)
        
        return math.sin(min_dist * 0.3)
    
    def islamic_geometric_pattern(self, x, y, symmetry=8):
        """Generate Islamic geometric tessellation"""
        r = math.sqrt(x*x + y*y)
        theta = math.atan2(y, x)
        
        # Star pattern with phi-based scaling
        pattern = 0
        for i in range(symmetry):
            angle = theta + i * 2 * math.pi / symmetry
            star_value = abs(math.cos(angle * symmetry / 2))
            radius_modulation = math.sin(r * 0.1 * self.PHI)
            pattern += star_value * radius_modulation
        
        return pattern / symmetry
    
    def celtic_knot_pattern(self, x, y):
        """Generate Celtic knot-inspired interlacing pattern"""
        # Interlacing curves with phi-based wave functions
        wave1 = math.sin(x * 0.1 * self.PHI + y * 0.1)
        wave2 = math.sin(x * 0.1 - y * 0.1 * self.PHI)
        wave3 = math.sin((x + y) * 0.08 * self.PHI)
        
        return (wave1 + wave2 + wave3) / 3
    
    def nature_leaves_pattern(self, x, y, iterations=8):
        """Generate natural leaf venation pattern"""
        r = math.sqrt(x*x + y*y)
        theta = math.atan2(y, x)
        
        # Main vein with branching
        main_vein = abs(math.sin(theta * 2))
        branches = 0
        for i in range(iterations):
            branch_angle = theta + i * self.GOLDEN_ANGLE / 2
            branch_value = math.exp(-abs(math.sin(branch_angle * 4)) * r * 0.01)
            branches += branch_value
        
        return (main_vein + branches / iterations) / 2
    
    def dna_helix_pattern(self, x, y, z=0):
        """Generate DNA double helix pattern"""
        r = math.sqrt(x*x + y*y)
        theta = math.atan2(y, x)
        
        # Two helices with phi-based twist
        helix1 = math.sin(theta * 2 + z * 0.1 * self.PHI) * math.exp(-abs(r - 30) * 0.05)
        helix2 = math.sin(theta * 2 - z * 0.1 * self.PHI + math.pi) * math.exp(-abs(r - 30) * 0.05)
        
        return helix1 + helix2
    
    def fractal_branches_pattern(self, x, y, iterations=6):
        """Generate fractal tree branching pattern"""
        r = math.sqrt(x*x + y*y)
        theta = math.atan2(y, x)
        
        # Recursive branching with phi angle
        pattern = 0
        for i in range(iterations):
            scale = self.PHI ** (-i)
            angle1 = theta + i * self.GOLDEN_ANGLE
            angle2 = theta - i * self.GOLDEN_ANGLE
            branch1 = math.exp(-abs(math.sin(angle1 * 3)) * r * scale * 0.01)
            branch2 = math.exp(-abs(math.sin(angle2 * 3)) * r * scale * 0.01)
            pattern += branch1 + branch2
        
        return pattern / (iterations * 2)
    
    def get_pattern_value(self, x, y, pattern_type, iterations=8, symmetry=6):
        """Get pattern value for given coordinates"""
        if pattern_type == "phi_spiral":
            return self.phi_spiral_pattern(x, y, iterations)
        elif pattern_type == "phi_vortex":
            return self.phi_vortex_pattern(x, y, iterations)
        elif pattern_type == "tree_of_life":
            return self.tree_of_life_pattern(x, y, iterations)
        elif pattern_type == "sacred_geometry":
            return self.sacred_geometry_pattern(x, y, symmetry)
        elif pattern_type == "fibonacci_flower":
            return self.fibonacci_flower_pattern(x, y, iterations)
        elif pattern_type == "golden_mandala":
            return self.golden_mandala_pattern(x, y, symmetry, iterations)
        elif pattern_type == "voronoi_organic":
            return self.voronoi_organic_pattern(x, y, 20)
        elif pattern_type == "islamic_geometric":
            return self.islamic_geometric_pattern(x, y, symmetry)
        elif pattern_type == "celtic_knot":
            return self.celtic_knot_pattern(x, y)
        elif pattern_type == "nature_leaves":
            return self.nature_leaves_pattern(x, y, iterations)
        elif pattern_type == "dna_helix":
            return self.dna_helix_pattern(x, y)
        elif pattern_type == "fractal_branches":
            return self.fractal_branches_pattern(x, y, iterations)
        else:
            return 0
    
    def generate_light_panel(self,
                            pattern_type="phi_spiral",
                            width=300,
                            height=400,
                            depth=6,
                            frame_thickness=20,
                            pattern_density=50,
                            cutout_depth=6,
                            phi_iterations=8,
                            symmetry=6,
                            resolution=2):
        """
        Generate decorative light panel with FRAYMUS patterns
        
        Parameters:
        - pattern_type: Type of phi-based pattern
        - width, height: Panel dimensions in mm
        - depth: Panel thickness in mm
        - frame_thickness: Border frame width in mm
        - pattern_density: 0-100, controls cutout threshold
        - cutout_depth: Depth of pattern cutouts (0 to depth)
        - phi_iterations: Number of phi recursions
        - symmetry: Rotational symmetry order
        - resolution: Grid resolution in mm (smaller = more detail, larger file)
        """
        
        print(f"   [FRAYMUS] Generating Light Panel...")
        print(f"   [PATTERN] {pattern_type}")
        print(f"   [SIZE] {width}x{height}x{depth}mm")
        print(f"   [PHI ITERATIONS] φ^{phi_iterations} = {self.PHI**phi_iterations:.2f}")
        
        # Calculate pattern threshold based on density
        threshold = (100 - pattern_density) / 100.0
        
        # Generate base panel
        x_steps = int(width / resolution)
        y_steps = int(height / resolution)
        
        # Create base plate
        for i in range(x_steps - 1):
            for j in range(y_steps - 1):
                x1 = (i - x_steps/2) * resolution
                y1 = (j - y_steps/2) * resolution
                x2 = x1 + resolution
                y2 = y1 + resolution
                
                # Check if in frame border
                in_frame = (abs(x1) > width/2 - frame_thickness or 
                           abs(y1) > height/2 - frame_thickness)
                
                if not in_frame:
                    # Get pattern value
                    cx = (x1 + x2) / 2
                    cy = (y1 + y2) / 2
                    pattern_val = self.get_pattern_value(cx, cy, pattern_type, 
                                                        phi_iterations, symmetry)
                    
                    # Determine if this area should be cut out
                    is_cutout = pattern_val > threshold
                    
                    if is_cutout:
                        # Create raised or recessed area
                        z_offset = depth - cutout_depth
                    else:
                        z_offset = 0
                else:
                    # Frame is always solid
                    z_offset = 0
                
                # Bottom face
                p1 = (x1, y1, z_offset)
                p2 = (x2, y1, z_offset)
                p3 = (x2, y2, z_offset)
                p4 = (x1, y2, z_offset)
                self.add_triangle(p1, p2, p3)
                self.add_triangle(p1, p3, p4)
                
                # Top face
                p1_top = (x1, y1, depth)
                p2_top = (x2, y1, depth)
                p3_top = (x2, y2, depth)
                p4_top = (x1, y2, depth)
                self.add_triangle(p4_top, p3_top, p2_top)
                self.add_triangle(p4_top, p2_top, p1_top)
                
                # Side walls
                if z_offset > 0:
                    # Left wall
                    self.add_triangle(p1, p1_top, p4_top)
                    self.add_triangle(p1, p4_top, p4)
                    # Right wall
                    self.add_triangle(p2, p3, p3_top)
                    self.add_triangle(p2, p3_top, p2_top)
                    # Front wall
                    self.add_triangle(p1, p2, p2_top)
                    self.add_triangle(p1, p2_top, p1_top)
                    # Back wall
                    self.add_triangle(p4, p4_top, p3_top)
                    self.add_triangle(p4, p3_top, p3)
        
        print(f"   [FRAYMUS] Total Facets: {len(self.facets)}")
        print(f"   [PHI RESONANCE] Golden Angle: {math.degrees(self.GOLDEN_ANGLE):.3f}°")
    
    def save(self):
        """Save the STL file"""
        print(f"   [FRAYMUS] Writing {len(self.facets)} facets to '{self.filename}'...")
        with open(self.filename, 'w') as f:
            f.write(f"solid FRAYMUS_Light_Panel\n")
            for normal, p1, p2, p3 in self.facets:
                f.write(f"  facet normal {normal[0]:.6f} {normal[1]:.6f} {normal[2]:.6f}\n")
                f.write(f"    outer loop\n")
                f.write(f"      vertex {p1[0]:.6f} {p1[1]:.6f} {p1[2]:.6f}\n")
                f.write(f"      vertex {p2[0]:.6f} {p2[1]:.6f} {p2[2]:.6f}\n")
                f.write(f"      vertex {p3[0]:.6f} {p3[1]:.6f} {p3[2]:.6f}\n")
                f.write(f"    endloop\n")
                f.write(f"  endfacet\n")
            f.write(f"endsolid FRAYMUS_Light_Panel\n")
        print(f"   [SUCCESS] '{self.filename}' created!")


if __name__ == "__main__":
    print("=" * 70)
    print("   FRAYMUS LIGHT PANEL GENERATOR v1.0")
    print("   Decorative Light Panels with Phi-Based Patterns")
    print("   Eyeoverthink Productions LLC")
    print("=" * 70)
    
    # Example 1: Phi Spiral Panel
    print("\n[EXAMPLE 1] Phi Spiral Panel")
    panel1 = FRAYMUSLightPanelGenerator("FRAYMUS_PhiSpiral_Panel.stl")
    panel1.generate_light_panel(
        pattern_type="phi_spiral",
        width=300,
        height=400,
        depth=6,
        pattern_density=60,
        phi_iterations=10,
        resolution=3
    )
    panel1.save()
    
    # Example 2: Tree of Life Panel
    print("\n[EXAMPLE 2] Tree of Life Panel")
    panel2 = FRAYMUSLightPanelGenerator("FRAYMUS_TreeOfLife_Panel.stl")
    panel2.generate_light_panel(
        pattern_type="tree_of_life",
        width=300,
        height=400,
        depth=6,
        pattern_density=55,
        phi_iterations=8,
        resolution=3
    )
    panel2.save()
    
    # Example 3: Fibonacci Flower Panel
    print("\n[EXAMPLE 3] Fibonacci Flower Panel")
    panel3 = FRAYMUSLightPanelGenerator("FRAYMUS_FibonacciFlower_Panel.stl")
    panel3.generate_light_panel(
        pattern_type="fibonacci_flower",
        width=300,
        height=400,
        depth=6,
        pattern_density=50,
        phi_iterations=8,
        resolution=3
    )
    panel3.save()
    
    print("\n" + "=" * 70)
    print("   GENERATION COMPLETE")
    print("=" * 70)
    print("\n   All FRAYMUS Light Panels ready for 3D printing!")
    print("   Recommended settings:")
    print("   - Material: PLA, PETG, or Wood-filled filament")
    print("   - Layer Height: 0.2mm")
    print("   - Infill: 20% (for rigidity)")
    print("   - Supports: May be needed for complex cutouts")
    print("   - Post-processing: Sand and finish for smooth edges")
    print("=" * 70)
