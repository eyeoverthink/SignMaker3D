import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from PIL import Image, ImageTk, ImageOps, ImageFilter
import os
import uuid
import math
import numpy as np

# ==========================================
#   BULB ARCHITECT V6: PRODUCTION READY
#   Logic: Double Threads + Clocking + Vector Math
# ==========================================

class BulbArchitectApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Bulb Architect V6 - Final Assembly")
        self.root.geometry("850x900")
        self.root.configure(bg="#121212")

        self.export_dir = os.path.join(os.path.expanduser("~"), "Desktop", "Bulb_Factory_V6")
        if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)
        
        self.imported_shape_points = []
        self.setup_ui()

    def setup_ui(self):
        header = tk.Label(self.root, text="LUMINARY ENGINE V6", font=("Segoe UI", 18, "bold"), bg="#121212", fg="#00E676")
        header.pack(pady=15)

        # TAB SYSTEM
        style = ttk.Style()
        style.theme_use('clam')
        style.configure("TNotebook", background="#121212", borderwidth=0)
        style.configure("TNotebook.Tab", background="#333", foreground="white", padding=[15, 5])
        style.map("TNotebook.Tab", background=[("selected", "#00E676")], foreground=[("selected", "black")])

        tabs = ttk.Notebook(self.root)
        self.tab1 = tk.Frame(tabs, bg="#222")
        self.tab2 = tk.Frame(tabs, bg="#222")
        
        tabs.add(self.tab1, text="1. The Housing (Base & Shell)")
        tabs.add(self.tab2, text="2. The Core (Filament Chassis)")
        tabs.pack(expand=1, fill="both", padx=10, pady=10)

        # --- TAB 1: HOUSING ---
        f1 = tk.Frame(self.tab1, bg="#222", padx=20, pady=20)
        f1.pack(fill="both")

        self.lbl(f1, "POWER SOURCE (Defines Base Size)")
        self.batt = tk.StringVar(value="AAA (x2)")
        ttk.Combobox(f1, textvariable=self.batt, values=["AAA (x2)", "AA (x2)", "18650 (Lithium)", "CR2032 (Coin)"]).pack(fill=tk.X)

        self.lbl(f1, "BULB SHAPE (The Diffuser)")
        self.shape = tk.StringVar(value="Edison (ST64)")
        ttk.Combobox(f1, textvariable=self.shape, values=["Edison (ST64)", "Globe (G25)", "Standard (A19)", "Tube (T45)"]).pack(fill=tk.X)

        self.lbl(f1, "DIFFUSION PATTERN")
        self.pattern = tk.StringVar(value="Phi-Ribs")
        ttk.Combobox(f1, textvariable=self.pattern, values=["Phi-Ribs", "Hex-Lattice", "Crystal (Voronoi)", "Clear"]).pack(fill=tk.X)

        # --- TAB 2: CORE ---
        f2 = tk.Frame(self.tab2, bg="#222", padx=20, pady=20)
        f2.pack(fill="both")

        self.lbl(f2, "LIGHT SOURCE (Clip Geometry)")
        self.tech = tk.StringVar(value="Neon LED (6mm)")
        ttk.Combobox(f2, textvariable=self.tech, values=["Neon LED (6mm)", "LED Filament (2mm)", "EL Wire (2.3mm)"]).pack(fill=tk.X)

        self.lbl(f2, "CORE GEOMETRY")
        self.mode = tk.StringVar(value="Standard Helix")
        tk.Radiobutton(f2, text="Procedural Helix", variable=self.mode, value="Standard Helix", bg="#222", fg="white", selectcolor="#444", command=self.toggle_import).pack(anchor="w")
        tk.Radiobutton(f2, text="Custom Vector (Image Import)", variable=self.mode, value="Custom Shape", bg="#222", fg="white", selectcolor="#444", command=self.toggle_import).pack(anchor="w")

        self.import_area = tk.Frame(f2, bg="#333", padx=10, pady=10)
        tk.Button(self.import_area, text="📂 UPLOAD SHAPE (Black on White)", command=self.load_image, bg="#2196F3", fg="white").pack(fill=tk.X)
        self.status_lbl = tk.Label(self.import_area, text="No Shape Loaded", bg="#333", fg="#888")
        self.status_lbl.pack(pady=5)

        # GENERATE
        btn = tk.Button(self.root, text="GENERATE MANUFACTURED ASSEMBLY", command=self.generate, 
                       bg="#00E676", fg="black", font=("Segoe UI", 12, "bold"), height=2)
        btn.pack(fill=tk.X, padx=20, pady=20)

    def lbl(self, p, t):
        tk.Label(p, text=t, bg="#222", fg="#03A9F4", font=("Segoe UI", 9, "bold")).pack(anchor="w", pady=(15, 2))

    def toggle_import(self):
        if self.mode.get() == "Custom Shape":
            self.import_area.pack(fill=tk.X, pady=5)
        else:
            self.import_area.pack_forget()

    def load_image(self):
        path = filedialog.askopenfilename(filetypes=[("Images", "*.png;*.jpg")])
        if not path: return
        try:
            img = Image.open(path).convert("L")
            img.thumbnail((200, 200))
            data = np.array(img)
            h, w = data.shape
            points = []
            # Sparse Sampling for clean vector loop
            for y in range(0, h, 3):
                for x in range(0, w, 3):
                    if data[y, x] < 100:
                        points.append([x - w/2, (h - y) - h/2])
            
            # Simple sorting to create a loop (Nearest Neighbor) could be added here
            # For now, we trust the OpenSCAD hull() to handle the volume
            self.imported_shape_points = points
            self.status_lbl.config(text=f"Vectorized {len(points)} points", fg="#00E676")
        except Exception as e:
            messagebox.showerror("Error", str(e))

    def generate(self):
        uid = str(uuid.uuid4())[:6]
        fname = f"Bulb_V6_{uid}.scad"
        fpath = os.path.join(self.export_dir, fname)
        
        with open(fpath, "w") as f:
            f.write(self.get_scad())
        os.startfile(self.export_dir)

    def get_scad(self):
        # Logic Translation
        clip_id = 6.2 if "6mm" in self.tech.get() else (2.2 if "2mm" in self.tech.get() else 2.5)
        
        pts_str = "[]"
        if self.mode.get() == "Custom Shape" and self.imported_shape_points:
            pts_str = f"[{','.join([f'[{p[0]},{p[1]}]' for p in self.imported_shape_points])}]"

        return f"""
// ==========================================
//   BULB ARCHITECT V6: PRODUCTION
//   Double-Threaded | Clocked | Vectorized
// ==========================================

$fn = 60;

// --- DYNAMIC SETTINGS ---
Clip_ID = {clip_id};
Base_Dia = 34; // Wider for double threads
Shape_Points = {pts_str};
Design_Mode = "{self.mode.get()}";
Bulb_Style = "{self.shape.get()}";
Pattern_Style = "{self.pattern.get()}";

// --- ENGINEERING KERNEL ---

module thread_iso(od, h, pitch, internal, taper=false) {{
    // Precision Trapezoidal Thread
    tol = internal ? 0.3 : -0.2;
    linear_extrude(height=h, twist=-360*(h/pitch), slices=h*4)
    translate([(od/2) + tol, 0, 0])
    rotate([0,0,45]) square([1.2, 1.2], center=true);
}}

module chassis_clip(angle) {{
    // The "Hand" that holds the light
    rotate([0,0,angle]) translate([2, 0, 0]) {{
        // Stem
        rotate([0, 90, 0]) cylinder(h=4, d1=3, d2=2);
        
        // C-Clamp Head
        translate([4, 0, 0]) rotate([90, 0, 0])
        difference() {{
            cylinder(h=4, d=Clip_ID + 2);
            translate([0,0,-1]) cylinder(h=6, d=Clip_ID); // The Hole
            translate([Clip_ID/1.2, 0, 2]) cube([Clip_ID, Clip_ID, 10], center=true); // Snap Opening
        }}
    }}
}}

// 1. THE POWER BASE (The Motherboard)
module part_base() {{
    color("#222")
    difference() {{
        union() {{
            // Main Body
            cylinder(h=35, d=Base_Dia);
            
            // Outer Thread (For Shell)
            translate([0,0,5]) thread_iso(Base_Dia, 25, 4, false);
            
            // Stop Block (Bottom)
            cylinder(h=5, d=Base_Dia + 2);
        }}
        
        // Inner Thread (For Chassis)
        translate([0,0,20]) {{
            cylinder(h=16, d=Base_Dia - 8); // Core Hole
            thread_iso(Base_Dia - 8, 15, 3, true); // Internal Thread
        }}
        
        // Battery Cavity
        translate([0,0,2]) {{
            if ("{self.batt.get()}" == "18650 (Lithium)") cylinder(h=75, d=19.5);
            else {{
                // AA/AAA Dual Slot
                translate([6,0,0]) cylinder(h=55, d=11.5);
                translate([-6,0,0]) cylinder(h=55, d=11.5);
            }}
        }}
        
        // Wire Path
        translate([0,0,-1]) cylinder(h=5, d=4);
    }}
}}

// 2. THE CHASSIS (The Vector Core)
module part_chassis() {{
    color("Orange")
    translate([0,0,40])
    union() {{
        // Threaded Plug (Male)
        translate([0,0,-15]) {{
            difference() {{
                cylinder(h=15, d=Base_Dia - 8.5);
                cylinder(h=16, d=5); // Wire hole
            }}
            thread_iso(Base_Dia - 8.5, 14, 3, false);
            
            // "Clocking" Ring (Stops rotation at 0 deg)
            translate([0,0,14]) cylinder(h=1, d=Base_Dia - 6);
        }}

        // --- SHAPE GENERATION ---
        if (Design_Mode == "Standard Helix") {{
            // DNA Helix
            linear_extrude(height=60, twist=180) translate([0,0]) circle(r=4);
            for(i=[0:60:360]) {{
                rotate([0,0,i]) translate([0,0,i/6]) translate([4,0,0]) chassis_clip(0);
            }}
        }} else {{
            // CUSTOM VECTOR EXTRUSION
            linear_extrude(height=4) offset(r=1) polygon(points=Shape_Points);
            
            // Smart Clip Distribution
            // Places clips on the vector points facing OUTWARD
            for(i=[0 : 6 : len(Shape_Points)-1]) {{
                translate([Shape_Points[i][0], Shape_Points[i][1], 2])
                // Calculate Normal Vector for Rotation
                rotate([0, 0, atan2(Shape_Points[i][1], Shape_Points[i][0])]) 
                chassis_clip(0);
            }}
            
            // Stem
            hull() {{
                translate([0,0,-1]) cylinder(h=1, d=10);
                translate([0,0,0]) linear_extrude(1) offset(r=1) polygon(points=Shape_Points);
            }}
        }}
    }}
}}

// 3. THE SHELL (The Diffuser)
module part_shell() {{
    color("White", 0.2)
    translate([0,0,40])
    union() {{
        // Threaded Collar (Female)
        translate([0,0,-10]) difference() {{
            cylinder(h=10, d=Base_Dia + 4);
            translate([0,0,-1]) thread_iso(Base_Dia + 0.5, 12, 4, true); // Fits onto Base
        }}
        
        // The Glass Body
        difference() {{
            hull() {{
                translate([0,0,0]) cylinder(h=1, d=Base_Dia + 4);
                if (Bulb_Style == "Globe (G25)") translate([0,0,45]) sphere(d=80);
                else if (Bulb_Style == "Tube (T45)") {{ translate([0,0,80]) sphere(d=45); cylinder(h=80, d=45); }}
                else {{ translate([0,0,35]) sphere(d=60); cylinder(h=20, d=Base_Dia+4); }}
            }}
            // Hollow
            hull() {{
                translate([0,0,0]) cylinder(h=1, d=Base_Dia);
                if (Bulb_Style == "Globe (G25)") translate([0,0,45]) sphere(d=76);
                else if (Bulb_Style == "Tube (T45)") {{ translate([0,0,80]) sphere(d=41); cylinder(h=80, d=41); }}
                else {{ translate([0,0,35]) sphere(d=56); cylinder(h=20, d=Base_Dia); }}
            }}
            
            // SCOTT DIFFUSION LOGIC
            if (Pattern_Style == "Phi-Ribs") {{
                for(i=[0:137.5:3600]) rotate([0,0,i]) translate([30,0,15]) cylinder(h=80, d=2);
            }} else if (Pattern_Style == "Hex-Lattice") {{
                for(z=[10:15:70]) for(r=[0:60:360]) 
                    rotate([0,0,r + (z/10)*30]) translate([0,0,z]) rotate([90,0,0]) cylinder(h=100, d=6, $fn=6);
            }}
        }}
    }}
}}

// LAYOUT FOR PRINTING
translate([-60, 0, 0]) part_base();
translate([60, 0, 0]) part_shell();
translate([0, 60, 0]) part_chassis();
"""

if __name__ == "__main__":
    root = tk.Tk()
    app = BulbArchitectApp(root)
    root.mainloop()