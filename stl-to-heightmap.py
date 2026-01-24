import numpy as np
from PIL import Image
from stl import mesh
import os

# ==========================================
#   STL TO HEIGHTMAP CONVERTER
#   Logic: Map2Model STL → PNG Depth Map
#   Purpose: Convert geographic 3D models to lithophane-ready images
# ==========================================

class STLToHeightmap:
    def __init__(self, stl_path):
        """Load STL file from Map2Model"""
        self.stl_path = stl_path
        self.mesh = mesh.Mesh.from_file(stl_path)
        
    def extract_heightmap(self, resolution=512, invert=False):
        """
        Convert STL mesh to 2D heightmap
        
        Args:
            resolution: Output image size (pixels)
            invert: If True, valleys=white, peaks=black (for lithophane)
        
        Returns:
            PIL Image object (grayscale heightmap)
        """
        # 1. Get all vertices from the mesh
        vertices = self.mesh.vectors.reshape(-1, 3)
        
        # 2. Find bounds (min/max X, Y, Z)
        min_x, min_y, min_z = vertices.min(axis=0)
        max_x, max_y, max_z = vertices.max(axis=0)
        
        # 3. Normalize coordinates to 0-1 range
        x_range = max_x - min_x
        y_range = max_y - min_y
        z_range = max_z - min_z
        
        if z_range == 0:
            z_range = 1  # Prevent division by zero
            
        # 4. Create 2D grid for heightmap
        grid = np.zeros((resolution, resolution))
        counts = np.zeros((resolution, resolution))  # Track how many points per pixel
        
        # 5. Project vertices onto 2D grid and accumulate Z values
        for vertex in vertices:
            # Normalize to 0-1
            x_norm = (vertex[0] - min_x) / x_range if x_range > 0 else 0.5
            y_norm = (vertex[1] - min_y) / y_range if y_range > 0 else 0.5
            z_norm = (vertex[2] - min_z) / z_range
            
            # Convert to pixel coordinates
            px = int(x_norm * (resolution - 1))
            py = int(y_norm * (resolution - 1))
            
            # Accumulate height values
            grid[py, px] += z_norm
            counts[py, px] += 1
        
        # 6. Average the heights (handle multiple vertices per pixel)
        mask = counts > 0
        grid[mask] = grid[mask] / counts[mask]
        
        # 7. Fill empty pixels with interpolation (smooth gaps)
        grid = self._fill_gaps(grid)
        
        # 8. Convert to 0-255 range
        heightmap = (grid * 255).astype(np.uint8)
        
        # 9. Invert if needed (for lithophane: high=thin, low=thick)
        if invert:
            heightmap = 255 - heightmap
        
        # 10. Convert to PIL Image
        img = Image.fromarray(heightmap, mode='L')
        
        return img
    
    def _fill_gaps(self, grid):
        """Fill empty pixels using nearest neighbor interpolation"""
        from scipy.ndimage import distance_transform_edt
        
        # Find empty pixels
        mask = grid == 0
        
        if not mask.any():
            return grid  # No gaps to fill
        
        # Get indices of filled pixels
        indices = distance_transform_edt(mask, return_distances=False, return_indices=True)
        
        # Fill gaps with nearest neighbor values
        filled = grid[tuple(indices)]
        
        return filled
    
    def save_heightmap(self, output_path, resolution=512, invert=False):
        """Generate and save heightmap to file"""
        img = self.extract_heightmap(resolution, invert)
        img.save(output_path)
        print(f"✓ Heightmap saved: {output_path}")
        print(f"  Resolution: {resolution}x{resolution}")
        print(f"  Mode: {'Lithophane (inverted)' if invert else 'Relief (normal)'}")
        return img
    
    def get_mesh_info(self):
        """Return information about the loaded mesh"""
        vertices = self.mesh.vectors.reshape(-1, 3)
        min_coords = vertices.min(axis=0)
        max_coords = vertices.max(axis=0)
        dimensions = max_coords - min_coords
        
        return {
            'vertices': len(vertices),
            'triangles': len(self.mesh.vectors),
            'dimensions': {
                'x': dimensions[0],
                'y': dimensions[1],
                'z': dimensions[2]
            },
            'bounds': {
                'min': min_coords.tolist(),
                'max': max_coords.tolist()
            }
        }


# ==========================================
#   COMMAND LINE INTERFACE
# ==========================================

if __name__ == "__main__":
    import sys
    
    print("=" * 50)
    print("  STL TO HEIGHTMAP CONVERTER")
    print("  Map2Model → LED Sign Pipeline")
    print("=" * 50)
    
    if len(sys.argv) < 2:
        print("\nUsage: python stl-to-heightmap.py <input.stl> [options]")
        print("\nOptions:")
        print("  --resolution 512    Output image size (default: 512)")
        print("  --invert           Invert for lithophane (default: False)")
        print("  --output map.png   Output filename (default: auto)")
        print("\nExample:")
        print("  python stl-to-heightmap.py paris_eiffel.stl --resolution 1024 --invert")
        sys.exit(1)
    
    # Parse arguments
    stl_file = sys.argv[1]
    resolution = 512
    invert = False
    output_file = None
    
    for i, arg in enumerate(sys.argv[2:], start=2):
        if arg == "--resolution" and i+1 < len(sys.argv):
            resolution = int(sys.argv[i+1])
        elif arg == "--invert":
            invert = True
        elif arg == "--output" and i+1 < len(sys.argv):
            output_file = sys.argv[i+1]
    
    # Auto-generate output filename if not specified
    if output_file is None:
        base_name = os.path.splitext(os.path.basename(stl_file))[0]
        output_file = f"{base_name}_heightmap.png"
    
    # Process
    try:
        print(f"\n📂 Loading: {stl_file}")
        converter = STLToHeightmap(stl_file)
        
        # Show mesh info
        info = converter.get_mesh_info()
        print(f"\n📊 Mesh Info:")
        print(f"   Vertices: {info['vertices']:,}")
        print(f"   Triangles: {info['triangles']:,}")
        print(f"   Dimensions: {info['dimensions']['x']:.2f} x {info['dimensions']['y']:.2f} x {info['dimensions']['z']:.2f}")
        
        # Generate heightmap
        print(f"\n🔄 Generating heightmap...")
        converter.save_heightmap(output_file, resolution, invert)
        
        print(f"\n✅ Success! Ready for LED sign generation.")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
