# import numpy as np
# import trimesh
# import tkinter as tk
# from tkinter import filedialog
# from shapely.geometry import Polygon, MultiPolygon
# import os

# class NeonSignGenerator:
#     def __init__(self):
#         # ==========================================
#         # CONFIGURATION (Adjust these to change the look)
#         # ==========================================
#         self.total_height = 10.0      # How tall the letters stand off the wall (mm)
#         self.wall_thickness = 1.2     # Thickness of the printed plastic wall (mm)
#         self.base_height = 2.0        # Height of the straight vertical sides (mm)
#         self.layer_resolution = 0.2   # Layer height for the "smooth" dome effect (mm)
        
#         # Calculates how much doming we need
#         self.dome_height = self.total_height - self.base_height

#     def generate_diffuser(self, polygons, output_filename):
#         """
#         Main function: Turns 2D shapes into a hollow 3D neon shell.
#         """
#         print(f"Generating mesh for {len(polygons)} shapes...")
#         full_mesh = trimesh.Trimesh()

#         count = 0
#         for poly in polygons:
#             count += 1
#             print(f"  - Processing shape {count}/{len(polygons)}...")

#             # 1. Define Inner and Outer shapes
#             # Outer is the visible shape
#             outer_poly = poly
            
#             # Inner is the hollow cutout (Outer shrunk by wall_thickness)
#             # buffer(negative) shrinks the shape
#             inner_poly = poly.buffer(-self.wall_thickness, join_style=1)

#             # 2. Check if shape is valid for hollowing
#             if inner_poly.is_empty:
#                 print(f"    Warning: Shape {count} is too thin to be hollow. Printing solid.")
#                 # If too thin, just extrude a solid block with a dome
#                 # (We treat inner_poly as an empty placeholder)
#                 mesh_chunk = self._extrude_rim_layers(outer_poly, None)
#             else:
#                 # 3. Create the Hollow Shell
#                 mesh_chunk = self._extrude_rim_layers(outer_poly, inner_poly)

#             # 4. Add to the main model
#             full_mesh = trimesh.util.concatenate([full_mesh, mesh_chunk])

#         # 5. Fix normals and Export
#         print("Finalizing mesh...")
#         full_mesh.fix_normals()
        
#         print(f"Exporting to {output_filename}...")
#         full_mesh.export(output_filename)
#         print("Done!")

#     def _extrude_rim_layers(self, outer_poly, inner_poly):
#         """
#         Stacks thin layers of polygons to create a hollow, domed shell.
#         Instead of Boolean subtraction (which is slow/buggy), we generate 
#         the specific 'Rim' shape for each layer.
#         """
#         meshes = []
        
#         # Calculate how many layers we need for the curved top
#         steps = int(self.dome_height / self.layer_resolution)
#         current_z = 0

#         # --- STEP A: The Vertical Base (Straight sides) ---
#         # If inner_poly exists, the base is a hollow ring (Outer - Inner)
#         # If inner_poly is None, the base is a solid block
#         if inner_poly:
#             base_shape = outer_poly.difference(inner_poly)
#         else:
#             base_shape = outer_poly

#         if not base_shape.is_empty:
#             base_mesh = trimesh.creation.extrude_polygon(base_shape, height=self.base_height)
#             base_mesh.apply_translation([0, 0, 0]) # Base starts at Z=0
#             meshes.append(base_mesh)
#             current_z += self.base_height

#         # --- STEP B: The Domed Top (Curved layers) ---
#         for i in range(steps):
#             # 0.0 to 1.0 progress
#             progress = i / steps
            
#             # CURVATURE LOGIC:
#             # Simple parabolic curve logic to make it look "tubular"
#             # As we go up (progress), we offset (shrink) the shape inwards.
#             # Using square root gives a rounded profile.
#             offset_factor = 1 - np.sqrt(1 - progress**2) # Circular profile approximation
#             # Or simple linear for chamfer: offset_factor = progress
            
#             # How much to shrink this specific layer
#             # Maximum shrink is half the width, but let's limit it to create a flat-ish top or round
#             shrink_amount = (progress ** 2) * (self.total_height * 0.4) 

#             # Shrink both Outer and Inner rings
#             layer_outer = outer_poly.buffer(-shrink_amount)
            
#             if inner_poly:
#                 # Shrink inner too, keeping the wall thickness roughly constant
#                 layer_inner = inner_poly.buffer(-shrink_amount)
#                 try:
#                     layer_shape = layer_outer.difference(layer_inner)
#                 except:
#                     layer_shape = layer_outer # Fallback if math fails
#             else:
#                 layer_shape = layer_outer

#             # If the shape has shrunk to nothing, stop building
#             if layer_shape.is_empty:
#                 break
            
#             # Create the thin slice for this layer
#             layer_mesh = trimesh.creation.extrude_polygon(layer_shape, height=self.layer_resolution)
            
#             # Move slice up to the current height
#             layer_mesh.apply_translation([0, 0, current_z])
#             meshes.append(layer_mesh)
            
#             current_z += self.layer_resolution

#         # Combine all slices into one solid object
#         return trimesh.util.concatenate(meshes)

# # ==========================================
# # MAIN EXECUTION
# # ==========================================
# if __name__ == "__main__":
#     generator = NeonSignGenerator()

#     # 1. SETUP FILE DIALOG (Ask user for file)
#     print("Opening file selector...")
    
#     # Initialize hidden root window
#     root = tk.Tk()
#     root.withdraw() 
    
#     # Open File Picker
#     file_path = filedialog.askopenfilename(
#         title="Select your Lasso Tracing (SVG or DXF)",
#         filetypes=[("Vector Files", "*.svg *.dxf"), ("All Files", "*.*")]
#     )

#     # 2. RUN PROCESSING
#     if file_path:
#         print(f"Selected: {file_path}")
        
#         try:
#             # Load the vector file using Trimesh
#             path_data = trimesh.load_path(file_path)
            
#             # Convert to closed polygons
#             # This handles the "Lasso" logic (converting lines to shapes)
#             polygons = path_data.polygons_closed
            
#             if not polygons:
#                 print("Error: No closed shapes found!") 
#                 print("Tip: Make sure your Lasso tool closes the loop (end point meets start point).")
#             else:
#                 # Create Output Name
#                 base_name = os.path.splitext(os.path.basename(file_path))[0]
#                 output_name = f"{base_name}_diffuser.stl"
                
#                 # Run the Generator
#                 generator.generate_diffuser(polygons, output_name)
                
#         except Exception as e:
#             print(f"CRITICAL ERROR: {e}")
#             import traceback
#             traceback.print_exc()
#     else:
#         print("Operation Cancelled: No file selected.")

import numpy as np
import trimesh
import tkinter as tk
from tkinter import filedialog, simpledialog
from shapely.geometry import Polygon, MultiPolygon
from shapely.ops import unary_union
from matplotlib.textpath import TextPath
from matplotlib.font_manager import FontProperties
import os

class NeonSignGenerator:
    def __init__(self):
        # CONFIGURATION
        self.total_height = 10.0      
        self.wall_thickness = 1.2     
        self.base_height = 2.0        
        self.layer_resolution = 0.2   
        self.dome_height = self.total_height - self.base_height

    def generate_diffuser(self, polygons, output_filename):
        print(f"Generating mesh for {len(polygons)} shapes...")
        full_mesh = trimesh.Trimesh()

        for poly in polygons:
            # Create Inner (Hollow) and Outer (Shell) shapes
            outer_poly = poly
            inner_poly = poly.buffer(-self.wall_thickness, join_style=1)

            if inner_poly.is_empty:
                # Too thin to be hollow? Make it solid.
                mesh_chunk = self._extrude_rim_layers(outer_poly, None)
            else:
                # Make it hollow
                mesh_chunk = self._extrude_rim_layers(outer_poly, inner_poly)

            full_mesh = trimesh.util.concatenate([full_mesh, mesh_chunk])

        full_mesh.fix_normals()
        print(f"Exporting to {output_filename}...")
        full_mesh.export(output_filename)
        print("Done!")

    def _extrude_rim_layers(self, outer_poly, inner_poly):
        meshes = []
        steps = int(self.dome_height / self.layer_resolution)
        current_z = 0

        # Base Layer
        base_shape = outer_poly.difference(inner_poly) if inner_poly else outer_poly
        if not base_shape.is_empty:
            base_mesh = trimesh.creation.extrude_polygon(base_shape, height=self.base_height)
            meshes.append(base_mesh)
            current_z += self.base_height

        # Domed Layers
        for i in range(steps):
            progress = i / steps
            offset_factor = 1 - np.sqrt(1 - progress**2) 
            shrink_amount = (progress ** 2) * (self.total_height * 0.4) 

            layer_outer = outer_poly.buffer(-shrink_amount)
            if inner_poly:
                layer_inner = inner_poly.buffer(-shrink_amount)
                try:
                    layer_shape = layer_outer.difference(layer_inner)
                except:
                    layer_shape = layer_outer
            else:
                layer_shape = layer_outer

            if layer_shape.is_empty: break
            
            layer_mesh = trimesh.creation.extrude_polygon(layer_shape, height=self.layer_resolution)
            layer_mesh.apply_translation([0, 0, current_z])
            meshes.append(layer_mesh)
            current_z += self.layer_resolution

        return trimesh.util.concatenate(meshes)

    # --- TEXT CONVERSION LOGIC ---
    def text_to_polygons(self, text, font_path, size=50):
        print(f"Converting text '{text}' using font...")
        prop = FontProperties(fname=font_path)
        path = TextPath((0, 0), text, size=size, prop=prop)
        
        polys = []
        for polygon_verts in path.to_polygons():
            if len(polygon_verts) > 2:
                polys.append(Polygon(polygon_verts))
        
        # Merge overlapping letters (Cursive logic)
        merged_shape = unary_union(polys)
        
        if isinstance(merged_shape, Polygon):
            return [merged_shape]
        elif isinstance(merged_shape, MultiPolygon):
            return list(merged_shape.geoms)
        return []

# ==========================================
# UNIVERSAL IMPORT LOGIC
# ==========================================
if __name__ == "__main__":
    generator = NeonSignGenerator()

    # 1. SETUP WINDOW
    root = tk.Tk()
    root.withdraw() 
    
    print("Please select a file (SVG/DXF for Lasso, or OTF/TTF for Text)...")
    
    # 2. ASK FOR FILE (Accepts Fonts OR Vectors)
    file_path = filedialog.askopenfilename(
        title="Select Input File",
        filetypes=[
            ("All Supported", "*.svg *.dxf *.ttf *.otf"),
            ("Vector Tracings", "*.svg *.dxf"), 
            ("Font Files", "*.ttf *.otf")
        ]
    )

    if file_path:
        base_name = os.path.splitext(os.path.basename(file_path))[0]
        extension = os.path.splitext(file_path)[1].lower()
        polygons = []

        # 3. CHECK FILE TYPE
        if extension in ['.ttf', '.otf']:
            # --- FONT MODE ---
            # We have the font, but we need the words!
            user_text = simpledialog.askstring("Input", f"Selected Font: {base_name}\n\nType the text for your sign:")
            
            if user_text:
                output_name = f"{user_text}_{base_name}_neon.stl"
                # Convert text to shapes using the font
                polygons = generator.text_to_polygons(user_text, file_path, size=60)
            else:
                print("No text entered.")

        elif extension in ['.svg', '.dxf']:
            # --- LASSO/VECTOR MODE ---
            # We have the shapes directly from the lasso tool
            print(f"Loading Vector Tracing: {base_name}")
            path_data = trimesh.load_path(file_path)
            polygons = path_data.polygons_closed
            output_name = f"{base_name}_neon.stl"

        # 4. GENERATE
        if polygons:
            generator.generate_diffuser(polygons, output_name)
        else:
            print("Error: Could not extract valid shapes.")
    else:
        print("Cancelled.")