import numpy as np
import trimesh
from shapely.geometry import Polygon, MultiPolygon
from shapely.ops import unary_union
import matplotlib.font_manager as fm
from matplotlib.textpath import TextPath
from matplotlib.font_manager import FontProperties

class NeonSignGenerator:
    def __init__(self):
        # Configuration for the "Neon" look
        self.height = 10.0          # Total height of the letter
        self.wall_thickness = 1.2   # Thickness of the plastic wall
        self.resolution = 0.5       # Layer height for the "dome" effect (lower = smoother)
        self.base_height = 2.0      # Height of the vertical side walls before doming starts

    def text_to_polygons(self, text, font_path, size=50):
        """
        Converts text string into Shapely Polygons using a specific font file.
        """
        # Load font properties
        prop = FontProperties(fname=font_path)
        path = TextPath((0, 0), text, size=size, prop=prop)
        
        # Extract vertices and codes from matplotlib path
        polys = []
        for polygon_verts in path.to_polygons():
            # Clean up vertices to ensure they are valid polygons
            if len(polygon_verts) > 2:
                polys.append(Polygon(polygon_verts))
        
        # Merge overlapping characters (Cursive logic)
        merged_shape = unary_union(polys)
        
        # Standardize to list of polygons
        if isinstance(merged_shape, Polygon):
            return [merged_shape]
        elif isinstance(merged_shape, MultiPolygon):
            return list(merged_shape.geoms)
        return []

    def generate_diffuser(self, polygons, output_filename="diffuser.stl"):
        """
        Generates a hollow, domed 'diffuser' shell from 2D polygons.
        """
        print(f"Generatng mesh for {len(polygons)} glyphs...")
        full_mesh = trimesh.Trimesh()

        for poly in polygons:
            # 1. Create the Outer Shell (The visible rounded shape)
            outer_mesh = self._create_domed_block(poly)
            
            # 2. Create the Inner Cutter (To make it hollow)
            # We erode the polygon by the wall thickness
            inner_poly = poly.buffer(-self.wall_thickness, join_style=1)
            
            if not inner_poly.is_empty:
                # Create a cutter that is slightly smaller and starts inside
                inner_mesh = self._create_domed_block(inner_poly, is_cutter=True)
                
                # Boolean subtract (Difference)
                # Note: Boolean ops are slow/unstable in pure python. 
                # TRICK: Instead of boolean, we can just print the outer shell with 0% infill
                # BUT, for a true shell, we often just extrude the WALLS.
                
                # FASTER METHOD: Extrude the "Rim" (Outer - Inner)
                # This is much more robust than 3D boolean subtraction.
                shell_mesh = self._extrude_rim_layers(poly, inner_poly)
                full_mesh = trimesh.util.concatenate([full_mesh, shell_mesh])
            else:
                # If parts are too thin to hollow, just print solid
                full_mesh = trimesh.util.concatenate([full_mesh, outer_mesh])

        # 3. Export
        print(f"Exporting to {output_filename}...")
        full_mesh.export(output_filename)
        print("Done.")

    def _extrude_rim_layers(self, outer_poly, inner_poly):
        """
        Stacks layers of (Outer - Inner) polygons to create a hollow shell.
        """
        meshes = []
        
        # Calculate how many layers we need for the dome
        dome_height = self.height - self.base_height
        steps = int(dome_height / self.resolution)
        
        current_z = 0
        
        # A. Vertical Base (Straight sides)
        # We create a prism that represents the walls
        base_shape = outer_poly.difference(inner_poly)
        if not base_shape.is_empty:
            base_mesh = trimesh.creation.extrude_polygon(base_shape, height=self.base_height)
            meshes.append(base_mesh)
            current_z += self.base_height

        # B. Domed Top (Stepped layers)
        for i in range(steps):
            # Calculate dome curvature (simple spherical approximation)
            # As we go up (i), we offset inwards
            progress = i / steps
            offset_amount = (progress ** 2) * (self.height * 0.3) # Adjust for curvature
            
            # Shrink both outer and inner rings
            layer_outer = outer_poly.buffer(-offset_amount)
            layer_inner = inner_poly.buffer(-offset_amount)
            
            # Create the rim for this layer
            layer_shape = layer_outer.difference(layer_inner)
            
            if not layer_shape.is_empty:
                layer_mesh = trimesh.creation.extrude_polygon(layer_shape, height=self.resolution)
                # Move it up to the correct height
                layer_mesh.apply_translation([0, 0, current_z])
                meshes.append(layer_mesh)
            
            current_z += self.resolution

        # Combine all layers into one mesh
        return trimesh.util.concatenate(meshes)

    def _create_domed_block(self, poly, is_cutter=False):
        """
        Helper if we wanted solid blocks (not used in the optimized rim method).
        """
        return trimesh.creation.extrude_polygon(poly, height=self.height)

# ==========================================
# USAGE EXAMPLE
# ==========================================
if __name__ == "__main__":
    generator = NeonSignGenerator()
    
    # 1. LOAD FONT & TEXT
    # Replace with path to a valid .ttf file on your system
    # 'Arial.ttf' or similar. 
    # If on Mac: '/Library/Fonts/Brush Script.ttf'
    # If on Windows: 'C:\\Windows\\Fonts\\arial.ttf'
    font_path = "C:\\Windows\\Fonts\\arial.ttf" 
    
    try:
        # 2. CONVERT TEXT TO SHAPES
        print("Processing text...")
        # Lasso Tracing would inject polygons here instead of text_to_polygons
        polygons = generator.text_to_polygons("Neon", font_path, size=60)
        
        # 3. GENERATE STL
        generator.generate_diffuser(polygons, "my_neon_sign.stl")
        
    except Exception as e:
        print(f"Error: {e}")
        print("Make sure you point 'font_path' to a real .ttf file!")