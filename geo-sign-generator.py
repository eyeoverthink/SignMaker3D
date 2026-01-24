import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from PIL import Image, ImageTk
import os
import uuid
import subprocess

# ==========================================
#   GEOGRAPHIC SIGN GENERATOR V1
#   Integration: Map2Model → LED Relief System
#   Pipeline: STL → Heightmap → Lithophane Shell
# ==========================================

class GeoSignApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Geographic Sign Generator - Map2Model Integration")
        self.root.geometry("1100x850")
        self.root.configure(bg="#0a0a0a")

        self.export_dir = os.path.join(os.path.expanduser("~"), "Desktop", "GeoSign_Output")
        if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)
        
        # State
        self.stl_file = None
        self.heightmap_file = None
        self.preview_img = None
        
        self.setup_ui()

    def setup_ui(self):
        # HEADER
        tk.Label(self.root, text="GEOGRAPHIC SIGN GENERATOR", font=("Impact", 24), 
                bg="#0a0a0a", fg="#00E676").pack(pady=20)
        tk.Label(self.root, text="Map2Model → LED Relief Pipeline", font=("Segoe UI", 11), 
                bg="#0a0a0a", fg="#888").pack(pady=(0, 20))

        # MAIN LAYOUT
        panes = tk.PanedWindow(self.root, bg="#0a0a0a", orient=tk.HORIZONTAL)
        panes.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # --- LEFT: CONTROLS ---
        left = tk.Frame(panes, bg="#1a1a1a", width=450)
        panes.add(left, padx=5)

        # STEP 1: IMPORT
        self.lbl(left, "STEP 1: IMPORT MAP2MODEL STL")
        tk.Button(left, text="📂 LOAD STL FILE", command=self.load_stl, 
                 bg="#2196F3", fg="white", font=("Arial", 11, "bold")).pack(fill=tk.X, padx=20, pady=5)
        self.stl_status = tk.Label(left, text="No file loaded", bg="#1a1a1a", fg="#666")
        self.stl_status.pack(pady=2)

        # STEP 2: CONVERSION
        self.lbl(left, "STEP 2: HEIGHTMAP SETTINGS")
        
        tk.Label(left, text="Resolution (Detail Level):", bg="#1a1a1a", fg="white").pack(anchor="w", padx=20)
        self.resolution = tk.IntVar(value=512)
        res_frame = tk.Frame(left, bg="#1a1a1a")
        res_frame.pack(fill=tk.X, padx=20)
        for val, label in [(256, "Fast"), (512, "Balanced"), (1024, "High"), (2048, "Ultra")]:
            tk.Radiobutton(res_frame, text=label, variable=self.resolution, value=val, 
                          bg="#1a1a1a", fg="white", selectcolor="#333").pack(side=tk.LEFT, padx=5)
        
        tk.Label(left, text="Mode:", bg="#1a1a1a", fg="white").pack(anchor="w", padx=20, pady=(10,0))
        self.invert = tk.BooleanVar(value=True)
        tk.Radiobutton(left, text="Lithophane (Light Through Thin Areas)", variable=self.invert, value=True,
                      bg="#1a1a1a", fg="white", selectcolor="#333").pack(anchor="w", padx=40)
        tk.Radiobutton(left, text="Relief (Raised Surface)", variable=self.invert, value=False,
                      bg="#1a1a1a", fg="white", selectcolor="#333").pack(anchor="w", padx=40)
        
        tk.Button(left, text="⚙️ GENERATE HEIGHTMAP", command=self.generate_heightmap, 
                 bg="#FF9800", fg="black", font=("Arial", 11, "bold")).pack(fill=tk.X, padx=20, pady=10)
        self.map_status = tk.Label(left, text="Waiting for STL...", bg="#1a1a1a", fg="#666")
        self.map_status.pack(pady=2)

        # STEP 3: LED SYSTEM
        self.lbl(left, "STEP 3: LED INTEGRATION")
        
        tk.Label(left, text="Shell Style:", bg="#1a1a1a", fg="white").pack(anchor="w", padx=20)
        self.shell_style = tk.StringVar(value="Flat Panel")
        ttk.Combobox(left, textvariable=self.shell_style, 
                    values=["Flat Panel (Wall Mount)", "Curved Shell (Freestanding)", "Deep Frame (Shadow Box)"]).pack(fill=tk.X, padx=20)
        
        tk.Label(left, text="Diffusion Pattern:", bg="#1a1a1a", fg="white").pack(anchor="w", padx=20, pady=(10,0))
        self.pattern = tk.StringVar(value="Clear")
        ttk.Combobox(left, textvariable=self.pattern, 
                    values=["Clear", "Phi-Ribs (Subtle)", "Hex-Lattice", "Frosted"]).pack(fill=tk.X, padx=20)
        
        tk.Label(left, text="Power System:", bg="#1a1a1a", fg="white").pack(anchor="w", padx=20, pady=(10,0))
        self.power = tk.StringVar(value="Magnetic Base (CR2032)")
        ttk.Combobox(left, textvariable=self.power, 
                    values=["Magnetic Base (CR2032)", "Wired (USB)", "Scott Lock Module"]).pack(fill=tk.X, padx=20)

        # GENERATE FINAL
        tk.Button(left, text="🚀 GENERATE COMPLETE SIGN ASSEMBLY", command=self.generate_sign, 
                 bg="#00E676", fg="black", font=("Arial", 13, "bold"), height=2).pack(side=tk.BOTTOM, fill=tk.X, padx=20, pady=20)

        # --- RIGHT: PREVIEW ---
        right = tk.Frame(panes, bg="black", bd=2, relief=tk.SUNKEN)
        panes.add(right, padx=5, stretch="always")
        
        tk.Label(right, text="HEIGHTMAP PREVIEW", bg="black", fg="#666").pack(pady=5)
        self.canvas = tk.Canvas(right, bg="#111", highlightthickness=0)
        self.canvas.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Initial message
        self.canvas.create_text(300, 250, text="Load an STL file from Map2Model\nto begin", 
                               fill="#444", font=("Arial", 14), justify="center")

    def lbl(self, p, t):
        tk.Label(p, text=t, bg="#1a1a1a", fg="#03A9F4", font=("Segoe UI", 10, "bold")).pack(anchor="w", padx=20, pady=(20, 5))

    def load_stl(self):
        path = filedialog.askopenfilename(
            title="Select Map2Model STL File",
            filetypes=[("STL Files", "*.stl"), ("All Files", "*.*")]
        )
        if not path: return
        
        self.stl_file = path
        filename = os.path.basename(path)
        self.stl_status.config(text=f"✓ Loaded: {filename}", fg="#00E676")
        self.map_status.config(text="Ready to generate heightmap", fg="white")

    def generate_heightmap(self):
        if not self.stl_file:
            messagebox.showwarning("No STL", "Please load an STL file first!")
            return
        
        try:
            # Import the converter
            from stl_to_heightmap import STLToHeightmap
            
            self.map_status.config(text="Processing... (may take 30-60 seconds)", fg="#FF9800")
            self.root.update()
            
            # Generate heightmap
            converter = STLToHeightmap(self.stl_file)
            
            # Get mesh info
            info = converter.get_mesh_info()
            
            # Create output filename
            base_name = os.path.splitext(os.path.basename(self.stl_file))[0]
            output_name = f"{base_name}_heightmap_{self.resolution.get()}.png"
            self.heightmap_file = os.path.join(self.export_dir, output_name)
            
            # Generate and save
            img = converter.save_heightmap(
                self.heightmap_file, 
                resolution=self.resolution.get(), 
                invert=self.invert.get()
            )
            
            # Update preview
            self.show_preview(img)
            
            self.map_status.config(
                text=f"✓ Generated: {info['triangles']:,} triangles → {self.resolution.get()}px map", 
                fg="#00E676"
            )
            
        except ImportError:
            messagebox.showerror("Missing Module", 
                "STL converter not found!\n\nInstall required packages:\npip install numpy-stl scipy pillow")
        except Exception as e:
            messagebox.showerror("Error", f"Heightmap generation failed:\n{e}")
            self.map_status.config(text=f"❌ Error: {e}", fg="#F44336")

    def show_preview(self, img):
        # Display the heightmap in the canvas
        w = self.canvas.winfo_width()
        h = self.canvas.winfo_height()
        
        if w < 100: w = 600
        if h < 100: h = 600
        
        # Resize to fit canvas
        img_resized = img.copy()
        img_resized.thumbnail((w-40, h-40))
        
        self.preview_img = ImageTk.PhotoImage(img_resized)
        
        self.canvas.delete("all")
        self.canvas.create_image(w//2, h//2, image=self.preview_img, anchor="center")
        self.canvas.create_text(w//2, h-20, text="↑ This will be carved into the LED shell", 
                               fill="#00E676", font=("Arial", 10))

    def generate_sign(self):
        if not self.heightmap_file:
            messagebox.showwarning("No Heightmap", "Generate a heightmap first (Step 2)!")
            return
        
        uid = str(uuid.uuid4())[:6]
        base_name = os.path.splitext(os.path.basename(self.stl_file))[0] if self.stl_file else "GeoSign"
        
        # Generate OpenSCAD file
        scad_file = os.path.join(self.export_dir, f"{base_name}_Sign_{uid}.scad")
        
        with open(scad_file, "w") as f:
            f.write(self.get_scad_code(base_name))
        
        # Success message
        if messagebox.askyesno("Success!", 
            f"Geographic LED Sign Generated!\n\nFiles created:\n• {os.path.basename(self.heightmap_file)}\n• {os.path.basename(scad_file)}\n\nOpen output folder?"):
            os.startfile(self.export_dir)

    def get_scad_code(self, location_name):
        map_file = os.path.basename(self.heightmap_file)
        shell = self.shell_style.get()
        pattern = self.pattern.get()
        power = self.power.get()
        
        return f"""
// ==========================================
//   GEOGRAPHIC LED SIGN
//   Location: {location_name}
//   Generated by Sign-Sculptor Map2Model Integration
// ==========================================

$fn = 60;

// --- SETTINGS ---
Heightmap = "{map_file}";
Shell_Style = "{shell}";
Pattern = "{pattern}";
Power_System = "{power}";

Base_Width = 150;  // Adjust to your map size
Base_Length = 150;
Base_Height = 8;   // Thickness of relief
Wall_Thickness = 2;

// --- MODULES ---

module geographic_shell() {{
    color("White", 0.4)
    difference() {{
        // 1. OUTER SHELL
        translate([0, 0, 0])
        if (Shell_Style == "Flat Panel (Wall Mount)") {{
            cube([Base_Width, Base_Length, Base_Height]);
        }} else if (Shell_Style == "Curved Shell (Freestanding)") {{
            hull() {{
                cube([Base_Width, Base_Length, 1]);
                translate([Base_Width/2, Base_Length/2, Base_Height+20])
                    sphere(d=Base_Width*0.8);
            }}
        }} else {{
            // Deep Frame
            cube([Base_Width, Base_Length, Base_Height*2]);
        }}
        
        // 2. HOLLOW INTERIOR (LED Space)
        translate([Wall_Thickness, Wall_Thickness, Wall_Thickness])
        if (Shell_Style == "Flat Panel (Wall Mount)") {{
            cube([Base_Width-Wall_Thickness*2, Base_Length-Wall_Thickness*2, Base_Height]);
        }} else {{
            cube([Base_Width-Wall_Thickness*2, Base_Length-Wall_Thickness*2, Base_Height*2]);
        }}
        
        // 3. THE GEOGRAPHIC RELIEF (Heightmap Carving)
        translate([Base_Width/2, Base_Length/2, Base_Height-1])
        resize([Base_Width-10, Base_Length-10, 3]) // 3mm depth variation
        surface(file=Heightmap, center=true, invert=false);
        
        // 4. DIFFUSION PATTERN
        if (Pattern == "Phi-Ribs (Subtle)") {{
            for(i=[0:137.5:3600]) {{
                rotate([0,0,i]) 
                translate([Base_Width/2, 0, Base_Height/2]) 
                cylinder(h=Base_Height+2, d=1, center=true);
            }}
        }} else if (Pattern == "Hex-Lattice") {{
            for(x=[10:15:Base_Width-10]) {{
                for(y=[10:15:Base_Length-10]) {{
                    translate([x, y, Base_Height/2])
                    cylinder(h=Base_Height+2, d=4, $fn=6, center=true);
                }}
            }}
        }}
    }}
}}

module led_backing() {{
    color("#333")
    difference() {{
        // Backing plate
        cube([Base_Width, Base_Length, 3]);
        
        // LED strip channels
        for(i=[20:30:Base_Width-20]) {{
            translate([i, 10, 1])
            cube([10, Base_Length-20, 3]);
        }}
        
        // Wire routing
        translate([Base_Width/2, Base_Length/2, -1])
        cylinder(h=5, d=5);
        
        // Magnet mounts (if magnetic base)
        if (Power_System == "Magnetic Base (CR2032)") {{
            translate([15, 15, -0.1]) cylinder(h=3, d=10.5);
            translate([Base_Width-15, 15, -0.1]) cylinder(h=3, d=10.5);
            translate([15, Base_Length-15, -0.1]) cylinder(h=3, d=10.5);
            translate([Base_Width-15, Base_Length-15, -0.1]) cylinder(h=3, d=10.5);
        }}
    }}
}}

module power_module() {{
    color("Orange")
    if (Power_System == "Magnetic Base (CR2032)") {{
        // Simple battery holder
        difference() {{
            cylinder(h=25, d=30);
            translate([0,0,2]) cylinder(h=24, d=21); // CR2032 slot
            translate([0,0,-1]) cylinder(h=5, d=5); // Wire hole
        }}
    }} else {{
        // USB connector housing
        cube([30, 20, 10]);
    }}
}}

// --- ASSEMBLY LAYOUT ---
translate([0, 0, 0]) geographic_shell();
translate([0, Base_Length + 20, 0]) led_backing();
translate([Base_Width + 30, 0, 0]) power_module();
"""

if __name__ == "__main__":
    root = tk.Tk()
    app = GeoSignApp(root)
    root.mainloop()
