import tkinter as tk
from tkinter import ttk, messagebox
import os
import uuid

# ==========================================
#   THE SPEEDBOAT FACTORY
#   Goal: Sub-15 Minute Benchy on ANY Printer
#   Logic: Pure Vase Mode Geometry (Single Wall)
# ==========================================

class SpeedboatApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Speedboat Factory - The Vase Benchy")
        self.root.geometry("600x700")
        self.root.configure(bg="#001f3f") # Navy Blue

        self.export_dir = os.path.join(os.path.expanduser("~"), "Desktop", "Speedboat_Factory")
        if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)

        self.setup_ui()

    def setup_ui(self):
        tk.Label(self.root, text="THE SPEEDBOAT ENGINE", font=("Impact", 24), bg="#001f3f", fg="#00E676").pack(pady=20)
        
        frame = tk.Frame(self.root, bg="#001f3f")
        frame.pack(fill=tk.BOTH, padx=40)

        # 1. SCALING
        self.lbl(frame, "1. SIZE & SPEED")
        self.scale = self.add_scale(frame, "Scale Factor (%)", 100, 50, 200)
        
        # 2. HULL SHAPE
        self.lbl(frame, "2. HYDRODYNAMICS")
        self.bow_angle = self.add_scale(frame, "Bow Sharpness", 1.5, 1.0, 3.0)
        self.stern_width = self.add_scale(frame, "Stern Width", 1.0, 0.5, 2.0)

        # 3. TEXTURE (Your Signature)
        self.lbl(frame, "3. SURFACE DRAG (Texture)")
        self.pattern = tk.StringVar(value="Smooth (Speed)")
        ttk.Combobox(frame, textvariable=self.pattern, values=["Smooth (Speed)", "Shark Skin (Ribs)", "Poly-Low (Glitch)"]).pack(fill=tk.X)

        # GENERATE
        tk.Button(self.root, text="GENERATE VASE BENCHY", command=self.generate, 
                 bg="#00E676", fg="black", font=("Arial", 14, "bold"), height=3).pack(fill=tk.X, padx=40, pady=40)

        tk.Label(self.root, text="*Slice in Vase Mode / Spiralize Outer Contour*", bg="#001f3f", fg="#888").pack()

    def lbl(self, p, t):
        tk.Label(p, text=t, bg="#001f3f", fg="#03A9F4", font=("Segoe UI", 11, "bold")).pack(anchor="w", pady=(20, 5))

    def add_scale(self, p, label, default, min_v, max_v):
        tk.Label(p, text=label, bg="#001f3f", fg="white").pack(anchor="w")
        var = tk.DoubleVar(value=default)
        tk.Scale(p, from_=min_v, to=max_v, resolution=0.1, variable=var, orient=tk.HORIZONTAL, bg="#003366", fg="#00E676", highlightthickness=0).pack(fill=tk.X)
        return var

    def generate(self):
        uid = str(uuid.uuid4())[:4]
        with open(os.path.join(self.export_dir, f"VaseBenchy_{uid}.scad"), "w") as f:
            f.write(self.get_scad())
        os.startfile(self.export_dir)

    def get_scad(self):
        s = self.scale.get() / 100.0
        bow = self.bow_angle.get()
        stern = self.stern_width.get()
        pat = self.pattern.get()
        
        return f"""
// ==========================================
//   VASE MODE BENCHY
//   Logic: Continuous Z-Loop Topology
// ==========================================
$fn = 60;
Scale = {s};
Bow_Sharpness = {bow};
Stern_Width = {stern};
Pattern = "{pat}";

module hull_slice(z_percent) {{
    // Defines the shape of the boat at height Z
    
    // Width tapers from bottom to top
    w_factor = 1 - (z_percent * 0.5); 
    
    // Length tapers at bow
    l_factor = 1.0;
    
    scale([l_factor * Scale, w_factor * Scale, 1])
    offset(r = (Pattern == "Shark Skin (Ribs)") ? sin(z_percent * 3600)*0.5 : 0)
    
    if (z_percent < 0.3) {{
        // LOWER HULL
        translate([0,0])
        circle(r=15); // Base
        
        // Elongate for Bow
        translate([15, 0]) circle(r=15/Bow_Sharpness);
        // Stern
        translate([-15, 0]) square([10, 30 * Stern_Width], center=true);
        
    }} else if (z_percent < 0.6) {{
        // CABIN TRANSITION
        // We morph from the hull shape to the cabin box
        hull() {{
            translate([-10, 0]) square([25, 25], center=true); // Cabin
            translate([10, 0]) circle(r=5); // Bow Tip
        }}
    }} else {{
        // ROOF PEAK
        // Must taper to a point/line to close the vase
        taper = 1 - ((z_percent - 0.6) * 2.5);
        scale([taper, taper])
        translate([-10, 0]) square([30, 32], center=true); // Roof
    }}
}}

// THE VASE GENERATOR
// We stack slices to create the continuous form
module build_boat() {{
    union() {{
        // 1. MAIN BODY
        linear_extrude(height=60 * Scale, twist=0, scale=0.2, slices=100)
            hull_slice(0); // This linear extrude is too simple for complex morphs
            
        // BETTER METHOD: LOFTING
        // OpenSCAD creates "Vase" friendly geometry by hulling sequential slices
        
        for (i = [0 : 2 : 100]) {{
            z_base = (i / 100) * 60 * Scale;
            z_next = ((i+2) / 100) * 60 * Scale;
            
            hull() {{
                translate([0,0,z_base]) linear_extrude(0.1) hull_slice(i/100);
                translate([0,0,z_next]) linear_extrude(0.1) hull_slice((i+2)/100);
            }}
        }}
    }}
}}

// RENDER
color("Orange") build_boat();

// Instructions
// 1. Slice in "Vase Mode" (Spiralize Outer Contour)
// 2. Set Bottom Layers to 3
// 3. Set Top Layers to 0
// 4. PRINT FAST.
"""

if __name__ == "__main__":
    root = tk.Tk()
    app = SpeedboatApp(root)
    root.mainloop()