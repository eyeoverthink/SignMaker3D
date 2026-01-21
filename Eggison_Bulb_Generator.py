import math
import numpy as np
from PIL import Image

# ==============================================================================
#   EGGISON BULB GENERATOR v1.0
#   Architecture: FRAYMUS-Enhanced Edison Bulb Design
#   Features: Phi-Vortex Lattice, Lithophane Support, Geometric Patterns
#   Brand: Eyeoverthink Productions LLC
# ==============================================================================

class EggisonBulbGenerator:
    def __init__(self, filename="Eggison_Bulb_v1.stl"):
        self.filename = filename
        self.facets = []
        self.PHI = 1.6180339887
        self.GOLDEN_ANGLE = 2.39996323
        
    def add_triangle(self, p1, p2, p3, calculate_normal=True):
        if calculate_normal:
            v1 = np.array([p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]])
            v2 = np.array([p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]])
            normal = np.cross(v1, v2)
            length = np.linalg.norm(normal)
            if length > 0:
                normal = normal / length
            else:
                normal = np.array([0, 0, 1])
        else:
            normal = np.array([0, 0, 0])
        
        self.facets.append((tuple(normal), p1, p2, p3))
    
    def egg_shape(self, u, v, height=70, width=50):
        """Generate egg-shaped surface using parametric equations"""
        theta = u * 2 * math.pi
        phi = v * math.pi
        
        egg_factor = 1 + 0.3 * math.cos(phi)
        
        x = width * egg_factor * math.sin(phi) * math.cos(theta)
        y = width * egg_factor * math.sin(phi) * math.sin(theta)
        z = height * (math.cos(phi) * 0.5 + 0.5)
        
        return (x, y, z)
    
    def apply_phi_vortex_texture(self, x, y, z, depth=0.5):
        """Apply phi-vortex lattice for light diffusion"""
        angle = math.atan2(y, x)
        radius = math.sqrt(x*x + y*y)
        
        vortex_pattern = math.sin(angle * 5 + z * 0.1 * self.GOLDEN_ANGLE)
        spiral_pattern = math.sin(radius * 0.2 * self.PHI + z * 0.15)
        
        texture_depth = depth * (vortex_pattern * 0.5 + spiral_pattern * 0.5)
        
        if radius > 0:
            scale = 1 + texture_depth * 0.1
            x *= scale
            y *= scale
        
        return (x, y, z)
    
    def apply_pattern(self, x, y, z, pattern_type="phi-spiral", depth=0.3):
        """Apply various geometric patterns for diffusion"""
        if pattern_type == "houndstooth":
            grid_x = int(x / 5) % 2
            grid_y = int(y / 5) % 2
            grid_z = int(z / 5) % 2
            pattern = 1 if (grid_x + grid_y + grid_z) % 2 == 0 else -1
            
        elif pattern_type == "checkers":
            grid_x = int(x / 8) % 2
            grid_y = int(y / 8) % 2
            pattern = 1 if (grid_x + grid_y) % 2 == 0 else -1
            
        elif pattern_type == "dots":
            radius = math.sqrt(x*x + y*y)
            angle = math.atan2(y, x)
            dot_pattern = math.sin(radius * 0.5) * math.sin(angle * 8 + z * 0.2)
            pattern = 1 if dot_pattern > 0.3 else -1
            
        elif pattern_type == "dna":
            angle = math.atan2(y, x)
            helix1 = math.sin(z * 0.3 + angle * 2)
            helix2 = math.sin(z * 0.3 - angle * 2 + math.pi)
            pattern = helix1 + helix2
            
        elif pattern_type == "phi-spiral":
            angle = math.atan2(y, x)
            radius = math.sqrt(x*x + y*y)
            spiral = math.sin(angle * self.PHI + radius * 0.1 + z * 0.1 * self.GOLDEN_ANGLE)
            pattern = spiral
            
        else:
            pattern = 0
        
        radius = math.sqrt(x*x + y*y)
        if radius > 0:
            scale = 1 + pattern * depth * 0.05
            x *= scale
            y *= scale
        
        return (x, y, z)
    
    def image_to_lithophane_depth(self, image_path, x, y, z, max_depth=2.0):
        """Convert image to lithophane depth map"""
        try:
            img = Image.open(image_path).convert('L')
            width, height = img.size
            
            u = (math.atan2(y, x) / (2 * math.pi) + 0.5) % 1.0
            v = (z / 70.0)
            
            px = int(u * width) % width
            py = int(v * height) % height
            
            brightness = img.getpixel((px, py)) / 255.0
            
            depth_offset = (1 - brightness) * max_depth
            
            radius = math.sqrt(x*x + y*y)
            if radius > 0:
                scale = 1 - depth_offset * 0.02
                x *= scale
                y *= scale
            
            return (x, y, z)
        except:
            return (x, y, z)
    
    def generate_eggison_bulb(self, 
                             height=70, 
                             width=50,
                             u_segments=80, 
                             v_segments=120,
                             outer_shell_pattern="phi-spiral",
                             inner_shell_type="pattern",
                             inner_pattern="dna",
                             lithophane_image=None,
                             wall_thickness=2.0):
        """
        Generate complete Eggison Bulb with dual shells
        
        Parameters:
        - outer_shell_pattern: "phi-spiral", "houndstooth", "checkers", "dots", "dna", or None
        - inner_shell_type: "pattern" or "lithophane"
        - inner_pattern: pattern type for inner shell if inner_shell_type="pattern"
        - lithophane_image: path to image if inner_shell_type="lithophane"
        - wall_thickness: thickness between shells
        """
        
        print(f"   [EGGISON] Generating Bulb Structure...")
        print(f"   [EGGISON] Outer Shell: {outer_shell_pattern or 'smooth'}")
        print(f"   [EGGISON] Inner Shell: {inner_shell_type}")
        
        # OUTER SHELL with phi-vortex and optional pattern
        for i in range(v_segments):
            for j in range(u_segments):
                u1 = j / u_segments
                u2 = (j + 1) / u_segments
                v1 = i / v_segments
                v2 = (i + 1) / v_segments
                
                p1 = self.egg_shape(u1, v1, height, width)
                p2 = self.egg_shape(u2, v1, height, width)
                p3 = self.egg_shape(u2, v2, height, width)
                p4 = self.egg_shape(u1, v2, height, width)
                
                p1 = self.apply_phi_vortex_texture(*p1, depth=0.5)
                p2 = self.apply_phi_vortex_texture(*p2, depth=0.5)
                p3 = self.apply_phi_vortex_texture(*p3, depth=0.5)
                p4 = self.apply_phi_vortex_texture(*p4, depth=0.5)
                
                if outer_shell_pattern:
                    p1 = self.apply_pattern(*p1, pattern_type=outer_shell_pattern, depth=0.3)
                    p2 = self.apply_pattern(*p2, pattern_type=outer_shell_pattern, depth=0.3)
                    p3 = self.apply_pattern(*p3, pattern_type=outer_shell_pattern, depth=0.3)
                    p4 = self.apply_pattern(*p4, pattern_type=outer_shell_pattern, depth=0.3)
                
                self.add_triangle(p1, p2, p3)
                self.add_triangle(p1, p3, p4)
        
        # INNER SHELL with lithophane or pattern
        inner_width = width - wall_thickness
        inner_height = height - wall_thickness
        
        for i in range(v_segments):
            for j in range(u_segments):
                u1 = j / u_segments
                u2 = (j + 1) / u_segments
                v1 = i / v_segments
                v2 = (i + 1) / v_segments
                
                p1 = self.egg_shape(u1, v1, inner_height, inner_width)
                p2 = self.egg_shape(u2, v1, inner_height, inner_width)
                p3 = self.egg_shape(u2, v2, inner_height, inner_width)
                p4 = self.egg_shape(u1, v2, inner_height, inner_width)
                
                if inner_shell_type == "lithophane" and lithophane_image:
                    p1 = self.image_to_lithophane_depth(lithophane_image, *p1, max_depth=1.5)
                    p2 = self.image_to_lithophane_depth(lithophane_image, *p2, max_depth=1.5)
                    p3 = self.image_to_lithophane_depth(lithophane_image, *p3, max_depth=1.5)
                    p4 = self.image_to_lithophane_depth(lithophane_image, *p4, max_depth=1.5)
                elif inner_shell_type == "pattern":
                    p1 = self.apply_pattern(*p1, pattern_type=inner_pattern, depth=0.4)
                    p2 = self.apply_pattern(*p2, pattern_type=inner_pattern, depth=0.4)
                    p3 = self.apply_pattern(*p3, pattern_type=inner_pattern, depth=0.4)
                    p4 = self.apply_pattern(*p4, pattern_type=inner_pattern, depth=0.4)
                
                self.add_triangle(p4, p3, p2)
                self.add_triangle(p4, p2, p1)
        
        print(f"   [EGGISON] Total Facets: {len(self.facets)}")
    
    def save(self):
        """Save the STL file"""
        print(f"   [EGGISON] Writing {len(self.facets)} facets to '{self.filename}'...")
        with open(self.filename, 'w') as f:
            f.write(f"solid Eggison_Bulb\n")
            for normal, p1, p2, p3 in self.facets:
                f.write(f"  facet normal {normal[0]:.6f} {normal[1]:.6f} {normal[2]:.6f}\n")
                f.write(f"    outer loop\n")
                f.write(f"      vertex {p1[0]:.6f} {p1[1]:.6f} {p1[2]:.6f}\n")
                f.write(f"      vertex {p2[0]:.6f} {p2[1]:.6f} {p2[2]:.6f}\n")
                f.write(f"      vertex {p3[0]:.6f} {p3[1]:.6f} {p3[2]:.6f}\n")
                f.write(f"    endloop\n")
                f.write(f"  endfacet\n")
            f.write(f"endsolid Eggison_Bulb\n")
        print(f"   [SUCCESS] '{self.filename}' created!")
        print(f"   [NEXT] Import into your slicer for 3D printing")


if __name__ == "__main__":
    print("=" * 60)
    print("   EGGISON BULB GENERATOR - FRAYMUS Edition")
    print("   Eyeoverthink Productions LLC")
    print("=" * 60)
    
    # Example 1: Phi-Spiral outer shell with DNA inner pattern
    print("\n[EXAMPLE 1] Phi-Spiral + DNA Pattern")
    bulb1 = EggisonBulbGenerator("Eggison_PhiSpiral_DNA.stl")
    bulb1.generate_eggison_bulb(
        outer_shell_pattern="phi-spiral",
        inner_shell_type="pattern",
        inner_pattern="dna"
    )
    bulb1.save()
    
    # Example 2: Houndstooth outer with Checkers inner
    print("\n[EXAMPLE 2] Houndstooth + Checkers")
    bulb2 = EggisonBulbGenerator("Eggison_Houndstooth_Checkers.stl")
    bulb2.generate_eggison_bulb(
        outer_shell_pattern="houndstooth",
        inner_shell_type="pattern",
        inner_pattern="checkers"
    )
    bulb2.save()
    
    # Example 3: Smooth outer with Phi-Spiral inner
    print("\n[EXAMPLE 3] Smooth + Phi-Spiral Inner")
    bulb3 = EggisonBulbGenerator("Eggison_Smooth_PhiSpiral.stl")
    bulb3.generate_eggison_bulb(
        outer_shell_pattern=None,
        inner_shell_type="pattern",
        inner_pattern="phi-spiral"
    )
    bulb3.save()
    
    print("\n" + "=" * 60)
    print("   GENERATION COMPLETE")
    print("=" * 60)
    print("\n   All Eggison Bulbs ready for 3D printing!")
    print("   Recommended settings:")
    print("   - Material: Translucent PLA or PETG")
    print("   - Layer Height: 0.15-0.2mm")
    print("   - Infill: 10-15% (for light diffusion)")
    print("   - Wall Thickness: 2-3 perimeters")
    print("=" * 60)
