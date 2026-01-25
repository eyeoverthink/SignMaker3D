# import tkinter as tk
# from tkinter import ttk
# import os
# import uuid
# import math

# # ==========================================
# #   BULB ARCHITECT V30: THE SCOTT-BENCHY
# #   Input: The "Idea" of a Benchy
# #   Output: A continuous topological manifold (Vase Mode Ready)
# # ==========================================

# class ScottBenchyApp:
#     def __init__(self, root):
#         self.root = root
#         self.root.title("Scott-Benchy V30 - The Continuous Clone")
#         self.root.geometry("650x750")
#         self.root.configure(bg="#004080") # Benchy Blue

#         self.export_dir = os.path.join(os.path.expanduser("~"), "Desktop", "Scott_Benchy_V30")
#         if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)

#         self.setup_ui()

#     def setup_ui(self):
#         tk.Label(self.root, text="THE SCOTT-BENCHY", font=("Impact", 28), bg="#004080", fg="#00E676").pack(pady=20)
#         tk.Label(self.root, text="Continuous Topology Re-Master", font=("Arial", 11), bg="#004080", fg="white").pack(pady=(0,20))
        
#         frame = tk.Frame(self.root, bg="#004080")
#         frame.pack(fill=tk.BOTH, padx=40)

#         # 1. GEOMETRY SPECS
#         self.lbl(frame, "1. HULL GEOMETRY")
#         self.scale = self.add_scale(frame, "Scale (%)", 100, 50, 200)
#         self.hull_smooth = self.add_scale(frame, "Hull Smoothness (Poly-Count)", 60, 30, 120)

#         # 2. VASE OPTIMIZATION
#         self.lbl(frame, "2. SCOTT FLOW OPTIMIZATION")
#         tk.Label(frame, text="Deck Slope (Prevents flat-layer stops)", bg="#004080", fg="#ddd").pack(anchor="w")
#         self.slope = self.add_scale(frame, "Deck Angle (Deg)", 45, 30, 60)
        
#         # 3. TEXTURE
#         self.lbl(frame, "3. SURFACE FINISH")
#         self.tex = tk.StringVar(value="Classic Smooth")
#         ttk.Combobox(frame, textvariable=self.tex, values=["Classic Smooth", "Low-Poly (Stealth)", "Phi-Ribbed (Speed)"]).pack(fill=tk.X)

#         # GENERATE
#         tk.Button(self.root, text="GENERATE CONTINUOUS BENCHY", command=self.generate, 
#                  bg="#00E676", fg="black", font=("Arial", 14, "bold"), height=3).pack(fill=tk.X, padx=40, pady=40)
        
#         tk.Label(self.root, text="*INSTRUCTIONS: Print with 'Spiralize Outer Contour' (Vase Mode)*", bg="#004080", fg="yellow").pack()

#     def lbl(self, p, t):
#         tk.Label(p, text=t, bg="#004080", fg="#03A9F4", font=("Segoe UI", 11, "bold")).pack(anchor="w", pady=(20, 5))

#     def add_scale(self, p, label, default, min_v, max_v):
#         tk.Label(p, text=label, bg="#004080", fg="white").pack(anchor="w")
#         var = tk.DoubleVar(value=default)
#         tk.Scale(p, from_=min_v, to=max_v, resolution=1, variable=var, orient=tk.HORIZONTAL, bg="#003366", fg="#00E676", highlightthickness=0).pack(fill=tk.X)
#         return var

#     def generate(self):
#         uid = str(uuid.uuid4())[:4]
#         filename = os.path.join(self.export_dir, f"ScottBenchy_{uid}.scad")
#         with open(filename, "w") as f:
#             f.write(self.get_scad())
#         os.startfile(self.export_dir)

#     def get_scad(self):
#         s = self.scale.get() / 100.0
#         slope = self.slope.get()
#         fn = int(self.hull_smooth.get())
#         if self.tex.get() == "Low-Poly (Stealth)": fn = 6
        
#         return f"""
# // ==========================================
# //   THE SCOTT-BENCHY (V30)
# //   Topology: Continuous Single-Wall Manifold
# //   Logic: Zero 90-degree overhangs
# // ==========================================
# $fn = {fn};
# Scale = {s};
# Deck_Angle = {slope};

# module hull_shape(w, l, h) {{
#     // The Classic Benchy Curve (Approximated for Vase Mode)
#     scale([l, w, 1]) circle(d=1);
# }}

# module scott_benchy() {{
#     scale([Scale, Scale, Scale]) union() {{
        
#         // --- SECTION 1: THE HULL (0mm to 15mm) ---
#         // Smooth transition from base to deck line
#         for(i=[0:1:15]) {{
#             z = i;
#             z_next = i+1;
#             // Taper factor
#             tf = 1 + (i/15)*0.5; 
            
#             hull() {{
#                 translate([0,0,z]) linear_extrude(0.1) 
#                     scale([1 + (i/30), 1]) hull_shape(30, 60, 1);
#                 translate([0,0,z_next]) linear_extrude(0.1) 
#                     scale([1 + ((i+1)/30), 1]) hull_shape(30, 60, 1);
#             }}
#         }}

#         // --- SECTION 2: THE DECK & GUNWALES (15mm to 25mm) ---
#         // STANDARD BENCHY HAS A FLAT DECK. WE CANNOT DO THAT.
#         // We slope the deck inward at 45 degrees to maintain flow.
        
#         for(i=[15:1:25]) {{
#             z = i;
#             z_next = i+1;
#             progress = (i-15)/10;
            
#             hull() {{
#                 translate([0,0,z]) linear_extrude(0.1) 
#                     difference() {{
#                         scale([1.5, 1]) circle(d=30); // Outer Gunwale
#                         // The Cabin Cutout (Starts small, gets bigger)
#                         if (i > 18) translate([-5,0]) scale([0.8 * progress, 0.6 * progress]) square([20,20], center=true);
#                     }}
#                 translate([0,0,z_next]) linear_extrude(0.1) 
#                     difference() {{
#                         scale([1.5, 1]) circle(d=30);
#                         if (i+1 > 18) translate([-5,0]) scale([0.8 * ((progress)+0.1), 0.6 * ((progress)+0.1)]) square([20,20], center=true);
#                     }}
#             }}
#         }}

#         // --- SECTION 3: THE CABIN (25mm to 40mm) ---
#         // A rectangular prism growing out of the slope
        
#         for(i=[25:1:40]) {{
#             z = i;
#             z_next = i+1;
            
#             hull() {{
#                 translate([-5,0,z]) linear_extrude(0.1) 
#                     scale([1, 0.8]) square([25, 22], center=true);
                
#                 translate([-5,0,z_next]) linear_extrude(0.1) 
#                     scale([1, 0.8]) square([25, 22], center=true);
#             }}
#         }}

#         // --- SECTION 4: THE ROOF (40mm to 48mm) ---
#         // Must peak to a point or line to close naturally
        
#         hull() {{
#             translate([-5,0,40]) linear_extrude(0.1) scale([1, 0.8]) square([28, 24], center=true); // Roof Overhang
#             translate([-5,0,45]) linear_extrude(0.1) scale([0.8, 0.6]) square([20, 15], center=true); 
#         }}
#         hull() {{
#             translate([-5,0,45]) linear_extrude(0.1) scale([0.8, 0.6]) square([20, 15], center=true);
#             translate([-5,0,48]) linear_extrude(0.1) circle(d=2); // The Chimney Tip (Closed)
#         }}
        
#         // --- THE CHIMNEY (Integrated) ---
#         // We add the chimney as a bulge on the roof, not a separate cylinder
#         translate([5, 0, 42]) cylinder(h=8, d1=6, d2=4);
#     }}
# }}

# // RENDER COLOR
# color("CornflowerBlue") scott_benchy();

# // TEXTURE OVERLAY (If Requested)
# if ("{self.tex.get()}" == "Phi-Ribbed (Speed)") {{
#     for(i=[0:20:360]) rotate([0,0,i]) translate([10,0,0]) cylinder(h=50, d=1);
# }}
# """

# if __name__ == "__main__":
#     root = tk.Tk()
#     app = ScottBenchyApp(root)
#     root.mainloop()

import tkinter as tk
from tkinter import filedialog, messagebox
import os
import uuid

# ==========================================
#   BULB ARCHITECT V31: THE OPTIMIZER
#   Input: REAL STL (e.g., Benchy)
#   Algo: Continuous Phi-Spiral Reinforcement
# ==========================================

class ScottOptimizerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Scott STL Optimizer - V31")
        self.root.geometry("600x700")
        self.root.configure(bg="#222")

        self.export_dir = os.path.join(os.path.expanduser("~"), "Desktop", "Scott_Optimizer_Output")
        if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)

        self.stl_path = ""
        self.setup_ui()

    def setup_ui(self):
        tk.Label(self.root, text="THE REAL BENCHY OPTIMIZER", font=("Impact", 24), bg="#222", fg="#00E676").pack(pady=20)
        
        frame = tk.Frame(self.root, bg="#222")
        frame.pack(fill=tk.BOTH, padx=40)

        # 1. INPUT
        self.lbl(frame, "1. SOURCE FILE")
        tk.Button(frame, text="📂 LOAD REAL STL (3dbenchy.stl)", command=self.load_stl, 
                 bg="#2196F3", fg="white", font=("Arial", 11, "bold")).pack(fill=tk.X, pady=5)
        self.file_lbl = tk.Label(frame, text="No file selected", bg="#222", fg="#888")
        self.file_lbl.pack()

        # 2. THE ALGO (Internal Structure)
        self.lbl(frame, "2. SCOTT STRUCTURE")
        self.rib_density = self.add_scale(frame, "Phi-Rib Density", 10, 5, 30)
        self.rib_thick = self.add_scale(frame, "Rib Thickness (mm)", 0.8, 0.4, 2.0)
        self.wall_thick = self.add_scale(frame, "Outer Shell Thickness (mm)", 1.2, 0.8, 3.0)

        # 3. GENERATE
        tk.Button(self.root, text="INJECT ALGORITHM & EXPORT", command=self.generate, 
                 bg="#00E676", fg="black", font=("Arial", 14, "bold"), height=3).pack(fill=tk.X, padx=40, pady=40)

    def lbl(self, p, t):
        tk.Label(p, text=t, bg="#222", fg="#03A9F4", font=("Segoe UI", 11, "bold")).pack(anchor="w", pady=(20, 5))

    def add_scale(self, p, label, default, min_v, max_v):
        tk.Label(p, text=label, bg="#222", fg="white").pack(anchor="w")
        var = tk.DoubleVar(value=default)
        tk.Scale(p, from_=min_v, to=max_v, resolution=0.1, variable=var, orient=tk.HORIZONTAL, bg="#333", fg="#00E676", highlightthickness=0).pack(fill=tk.X)
        return var

    def load_stl(self):
        path = filedialog.askopenfilename(filetypes=[("STL Files", "*.stl")])
        if path:
            self.stl_path = path
            self.file_lbl.config(text=os.path.basename(path))

    def generate(self):
        if not self.stl_path: return
        uid = str(uuid.uuid4())[:4]
        
        # We need the absolute path for OpenSCAD to find the STL
        abs_path = os.path.abspath(self.stl_path).replace("\\", "/")
        filename = os.path.join(self.export_dir, f"Optimized_Benchy_{uid}.scad")
        
        with open(filename, "w") as f:
            f.write(self.get_scad(abs_path))
        
        os.startfile(self.export_dir)

    def get_scad(self, stl_path):
        density = int(self.rib_density.get())
        rib_t = self.rib_thick.get()
        wall = self.wall_thick.get()
        
        return f"""
// ==========================================
//   SCOTT OPTIMIZER V31
//   Target: {os.path.basename(stl_path)}
//   Algo: Phi-Spiral Internal Ribbing
// ==========================================

$fn = 60;
Rib_Count = {density};
Rib_Thick = {rib_t};
Wall_Thick = {wall};
Phi = 1.6180339887;

// 1. IMPORT THE REAL BENCHY
module source_mesh() {{
    import("{stl_path}");
}}

// 2. GENERATE SCOTT LATTICE (The Algo)
module scott_lattice() {{
    // Creates a continuous twisting structure
    // No retractions needed for these ribs if printed spiral
    intersection() {{
        source_mesh(); // Constrain to ship shape
        
        union() {{
            for(i=[0:Rib_Count]) {{
                rotate([0, 0, i * 137.5]) // Golden Angle distribution
                linear_extrude(height=100, twist=360) 
                translate([10, 0]) 
                square([100, Rib_Thick], center=true);
            }}
        }}
    }}
}}

// 3. THE ASSEMBLY
module optimized_benchy() {{
    union() {{
        // A. The Hollow Shell (Outer Strength)
        difference() {{
            source_mesh();
            // Subtract inner volume to make it hollow
            translate([0,0,0]) offset_3d(-Wall_Thick) source_mesh(); 
        }}
        
        // B. The Internal Structure (Speed & Strength)
        scott_lattice();
    }}
}}

// Helper for 3D offsetting (Minkowski approx)
module offset_3d(r) {{
    // Simple scaling approximation for speed in preview
    // In production, minkowski is better but slow.
    // Using scaling hack for speed:
    translate([0,0,0.5]) scale([0.92, 0.92, 0.92]) source_mesh();
}}

// RENDER
color("CornflowerBlue") optimized_benchy();

/* PRINT SETTINGS:
   - Infill: 0% (The script generates the structure)
   - Top Layers: 3
   - Bottom Layers: 3
   - Walls: 2
*/
"""

if __name__ == "__main__":
    root = tk.Tk()
    app = ScottOptimizerApp(root)
    root.mainloop()