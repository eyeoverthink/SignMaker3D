import numpy as np
from stl import mesh
from scipy.interpolate import griddata
from PIL import Image

class STLToHeightmap:
    """
    Converts STL mesh files into 2D heightmap images.
    Used for Map2Model geographic data → LED relief signs.
    """
    
    def __init__(self, stl_path):
        """Load the STL file."""
        self.mesh = mesh.Mesh.from_file(stl_path)
        self.vertices = self._extract_vertices()
        
    def _extract_vertices(self):
        """Extract all unique vertices from the mesh."""
        # STL files store triangles, we need unique vertices
        vertices = []
        for i in range(len(self.mesh.vectors)):
            for j in range(3):
                vertices.append(self.mesh.vectors[i][j])
        return np.array(vertices)
    
    def get_mesh_info(self):
        """Return mesh statistics."""
        return {
            'triangles': len(self.mesh.vectors),
            'vertices': len(self.vertices),
            'bounds': {
                'x': (self.vertices[:, 0].min(), self.vertices[:, 0].max()),
                'y': (self.vertices[:, 1].min(), self.vertices[:, 1].max()),
                'z': (self.vertices[:, 2].min(), self.vertices[:, 2].max())
            }
        }
    
    def generate_heightmap(self, resolution=512, invert=False):
        """
        Generate a 2D heightmap from the 3D mesh.
        
        Args:
            resolution: Output image size (resolution x resolution)
            invert: If True, inverts the heightmap (for lithophanes)
        
        Returns:
            PIL Image object
        """
        # Get X, Y, Z coordinates
        x = self.vertices[:, 0]
        y = self.vertices[:, 1]
        z = self.vertices[:, 2]
        
        # Normalize to 0-1 range
        x_norm = (x - x.min()) / (x.max() - x.min())
        y_norm = (y - y.min()) / (y.max() - y.min())
        z_norm = (z - z.min()) / (z.max() - z.min())
        
        # Create grid
        grid_x, grid_y = np.mgrid[0:1:complex(0, resolution), 
                                   0:1:complex(0, resolution)]
        
        # Interpolate Z values onto the grid
        # This creates the heightmap by averaging Z values at each XY position
        points = np.column_stack((x_norm, y_norm))
        grid_z = griddata(points, z_norm, (grid_x, grid_y), method='linear')
        
        # Fill any NaN values (gaps in the mesh)
        mask = np.isnan(grid_z)
        if mask.any():
            # Fill with nearest neighbor interpolation
            grid_z_filled = griddata(points, z_norm, (grid_x, grid_y), method='nearest')
            grid_z[mask] = grid_z_filled[mask]
        
        # Convert to 8-bit image (0-255)
        if invert:
            # For lithophanes: high Z = thin = dark
            img_array = (255 * (1 - grid_z)).astype(np.uint8)
        else:
            # For relief: high Z = raised = bright
            img_array = (255 * grid_z).astype(np.uint8)
        
        # Create PIL Image
        img = Image.fromarray(img_array, mode='L')
        
        return img
    
    def save_heightmap(self, output_path, resolution=512, invert=False):
        """
        Generate and save heightmap to file.
        
        Args:
            output_path: Path to save the PNG file
            resolution: Output image size
            invert: If True, inverts the heightmap
        
        Returns:
            PIL Image object
        """
        img = self.generate_heightmap(resolution, invert)
        img.save(output_path)
        print(f"Heightmap saved: {output_path}")
        return img


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python stl_to_heightmap.py <input.stl> [output.png] [resolution]")
        print("Example: python stl_to_heightmap.py city.stl city_heightmap.png 1024")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else "heightmap.png"
    resolution = int(sys.argv[3]) if len(sys.argv) > 3 else 512
    
    print(f"Converting {input_file} to heightmap...")
    converter = STLToHeightmap(input_file)
    
    info = converter.get_mesh_info()
    print(f"Mesh info: {info['triangles']} triangles, {info['vertices']} vertices")
    
    converter.save_heightmap(output_file, resolution=resolution, invert=True)
    print(f"Done! Heightmap saved to {output_file}")
