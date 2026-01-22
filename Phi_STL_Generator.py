import math

# ==============================================================================
#   SIGN SCULPTOR: MATTER BRIDGE (Gen 3 Extension)
#   Output: Stereolithography (.stl)
#   Geometry: Phi-Vortex Hyper-Lattice
#   Brand: Eyeoverthink Productions LLC
# ==============================================================================

class StlGenerator:
    def __init__(self, filename="Eyeoverthink_Artifact_02.stl"):
        self.filename = filename
        self.facets = []
        self.PHI = 1.6180339887
        self.GOLDEN_ANGLE = 2.39996323 # Radians (~137.5 deg)

    def add_triangle(self, p1, p2, p3):
        # Calculate normal (simplified, pointing out)
        # For a complex lattice, slicers usually handle normals fine if the mesh is watertight
        normal = (0, 0, 0) 
        self.facets.append((normal, p1, p2, p3))

    def generate_phi_tower(self, height=50, radius=20, layers=200):
        print(f"   [MATTER] Calculating Geometry: {layers} Layers...")
        
        # We build a twisted tower using the Golden Angle
        vertices_current = []
        vertices_next = []
        
        segments = 5 # Pentagon base (5-2-5 resonance)
        
        for i in range(layers + 1):
            z = (i / layers) * height
            
            # The Twist: Rotation based on height * Phi
            # This creates the "Wormhole" structure
            rotation = (z * 0.1) * self.GOLDEN_ANGLE
            
            # The Pulse: Radius breathes with Phi
            current_radius = radius + (math.sin(z * 0.2 * self.PHI) * 3)
            
            layer_points = []
            for s in range(segments):
                theta = (s / segments) * 2 * math.pi + rotation
                x = current_radius * math.cos(theta)
                y = current_radius * math.sin(theta)
                layer_points.append((x, y, z))
            
            if i == 0:
                vertices_current = layer_points
                continue
                
            vertices_next = layer_points
            
            # Stitch the rings together into triangles
            for s in range(segments):
                s_next = (s + 1) % segments
                
                # Point indices:
                # C = Current Layer, N = Next Layer
                c1 = vertices_current[s]
                c2 = vertices_current[s_next]
                n1 = vertices_next[s]
                n2 = vertices_next[s_next]
                
                # Create 2 triangles to form the quad face
                self.add_triangle(c1, n1, c2)
                self.add_triangle(c2, n1, n2)
            
            vertices_current = vertices_next

    def save(self):
        print(f"   [MATTER] Writing {len(self.facets)} facets to disk...")
        with open(self.filename, 'w') as f:
            f.write(f"solid Phi_Lattice\n")
            for normal, p1, p2, p3 in self.facets:
                f.write(f"  facet normal {normal[0]} {normal[1]} {normal[2]}\n")
                f.write(f"    outer loop\n")
                f.write(f"      vertex {p1[0]:.6f} {p1[1]:.6f} {p1[2]:.6f}\n")
                f.write(f"      vertex {p2[0]:.6f} {p2[1]:.6f} {p2[2]:.6f}\n")
                f.write(f"      vertex {p3[0]:.6f} {p3[1]:.6f} {p3[2]:.6f}\n")
                f.write(f"    endloop\n")
                f.write(f"  endfacet\n")
            f.write(f"endsolid Phi_Lattice\n")
        print(f"   [SUCCESS] File '{self.filename}' created.")
        print("   [NEXT STEP] Open in Slicer -> Print.")

if __name__ == "__main__":
    print("========================================")
    print("   EYEOVERTHINK: MATTER COMPILER        ")
    print("========================================")
    gen = StlGenerator()
    gen.generate_phi_tower()
    gen.save()