import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from PIL import Image, ImageTk, ImageOps, ImageFilter
import os
import uuid
import math
import numpy as np

# ==========================================
#   BULB ARCHITECT V5: LUMINARY ENGINE
#   Logic: Image-to-Chassis + Precision Threads
# ==========================================

class BulbArchitectApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Bulb Architect V5 - The Luminary Engine")
        self.root.geometry("800x850")
        self.root.configure(bg="#1e1e1e")

        # Config
        self.export_dir = os.path.join(os.path.expanduser("~"), "Desktop", "Bulb_Factory_V5")
        if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)
        
        self.imported_shape_points = [] # Stores vector path
        self.preview_image = None

        self.setup_ui()

    def setup_ui(self):
        # Header
        header = tk.Label(self.root, text="LUMINARY ENGINE V5", font=("Segoe UI", 16, "bold"), bg="#1e1e1e", fg="#00E676")
        header.pack(pady=10)

        # TABS
        tab_control = ttk.Notebook(self.root)
        
        self.tab_arch = tk.Frame(tab_control, bg="#2d2d2d")
        self.tab_core = tk.Frame(tab_control, bg="#2d2d2d")
        
        tab_control.add(self.tab_arch, text="1. Housing & Power")
        tab_control.add(self.tab_core, text="2. Filament Core (Scott Logic)")
        tab_control.pack(expand=1, fill="both", padx=10, pady=10)

        # --- TAB 1: ARCHITECT ---
        self.build_architect_tab()

        # --- TAB 2: CORE ---
        self.build_core_tab()

        # GENERATE BUTTON
        btn = tk.Button(self.root, text="GENERATE COMPLETE ASSEMBLY", command=self.generate, 
                       bg="#00E676", fg="black", font=("Arial", 12, "bold"), height=2)
        btn.pack(fill=tk.X, padx=20, pady=20)

    def build_architect_tab(self):
        frame = tk.Frame(self.tab_arch, bg="#2d2d2d", padx=20, pady=20)
        frame.pack(fill="both", expand=True)

        self.add_label(frame, "1. SOCKET STANDARD (Thread Logic)")
        self.socket_var = tk.StringVar(value="E27 (Standard)")
        ttk.Combobox(frame, textvariable=self.socket_var, values=["E27 (Standard)", "E14 (Small)", "E40 (Giant)"]).pack(fill=tk.X)

        self.add_label(frame, "2. POWER SOURCE (Battery)")
        self.batt_var = tk.StringVar(value="AAA (x2)")
        ttk.Combobox(frame, textvariable=self.batt_var, values=["AAA (x2)", "AA (x1)", "18650 (Lithium)", "CR2032 (Coin)"]).pack(fill=tk.X)

        self.add_label(frame, "3. DIFFUSER SHELL")
        self.shape_var = tk.StringVar(value="Edison (ST64)")
        ttk.Combobox(frame, textvariable=self.shape_var, values=["Edison (ST64)", "Globe (G25)", "Standard (A19)", "Tube (T45)"]).pack(fill=tk.X)

        self.add_label(frame, "4. SHELL PATTERN (Scott Diffusion)")
        self.pattern_var = tk.StringVar(value="Phi-Ribs")
        ttk.Combobox(frame, textvariable=self.pattern_var, values=["Phi-Ribs", "Hex-Lattice", "Voronoi", "Clear"]).pack(fill=tk.X)

    def build_core_tab(self):
        frame = tk.Frame(self.tab_core, bg="#2d2d2d", padx=20, pady=20)
        frame.pack(fill="both", expand=True)

        self.add_label(frame, "LIGHT SOURCE (Clip Sizing)")
        self.tech_var = tk.StringVar(value="Neon LED (6mm)")
        ttk.Combobox(frame, textvariable=self.tech_var, values=["Neon LED (6mm)", "LED Filament (2mm)", "EL Wire (2.3mm)"]).pack(fill=tk.X)

        self.add_label(frame, "DESIGN MODE")
        self.mode_var = tk.StringVar(value="Standard Helix")
        
        # Sub-frame for switching logic
        self.mode_frame = tk.Frame(frame, bg="#2d2d2d")
        self.mode_frame.pack(fill=tk.X, pady=10)
        
        tk.Radiobutton(self.mode_frame, text="Standard Helix", variable=self.mode_var, value="Standard Helix", 
                      bg="#2d2d2d", fg="white", selectcolor="#444", command=self.toggle_mode).pack(anchor="w")
        tk.Radiobutton(self.mode_frame, text="Custom Shape (Import Image)", variable=self.mode_var, value="Custom Shape", 
                      bg="#2d2d2d", fg="white", selectcolor="#444", command=self.toggle_mode).pack(anchor="w")

        # Custom Import UI (Hidden by default)
        self.import_frame = tk.Frame(frame, bg="#333", padx=10, pady=10)
        tk.Button(self.import_frame, text="📂 LOAD IMAGE (Black on White)", command=self.load_image, bg="#2196F3", fg="white").pack(fill=tk.X)
        self.img_label = tk.Label(self.import_frame, text="No Image", bg="#333", fg="#888")
        self.img_label.pack(pady=5)

    def toggle_mode(self):
        if self.mode_var.get() == "Custom Shape":
            self.import_frame.pack(fill=tk.X, pady=10)
        else:
            self.import_frame.pack_forget()

    def add_label(self, parent, text):
        tk.Label(parent, text=text, bg="#2d2d2d", fg="#03A9F4", font=("Segoe UI", 9, "bold")).pack(anchor="w", pady=(10, 2))

    # --- IMAGE TRACING LOGIC (Simple Trace for Portability) ---
    def load_image(self):
        path = filedialog.askopenfilename(filetypes=[("Images", "*.png;*.jpg")])
        if not path: return
        
        try:
            img = Image.open(path).convert("L")
            # Resize for consistent processing
            img.thumbnail((200, 200)) 
            self.preview_image = img
            
            # Simple Boundary Trace
            # We look for black pixels
            data = np.array(img)
            points = []
            h, w = data.shape
            
            # Simplistic scan-line to find "skeleton" pixels
            # In a full CV2 version we'd use findContours
            # Here we just grab coordinate of dark pixels to form a point cloud for OpenSCAD to hull
            for y in range(0, h, 4):
                for x in range(0, w, 4):
                    if data[y, x] < 128: # Dark pixel
                        # Center coordinates
                        cx = x - (w/2)
                        cy = (h - y) - (h/2) # Flip Y
                        points.append([cx, cy])
            
            self.imported_shape_points = points
            self.img_label.config(text=f"Loaded: {len(points)} vector points")
            
        except Exception as e:
            messagebox.showerror("Error", str(e))

    def generate(self):
        unique_id = str(uuid.uuid4())[:6]
        filename = f"Luminary_V5_{unique_id}.scad"
        filepath = os.path.join(self.export_dir, filename)

        scad_code = self.get_scad_logic()
        
        with open(filepath, "w") as f:
            f.write(scad_code)
        
        os.startfile(self.export_dir)

    def get_scad_logic(self):
        # Clip Size
        tech = self.tech_var.get()
        clip_id = 6.2 if "6mm" in tech else (2.2 if "2mm" in tech else 2.5)
        
        # Format Points for OpenSCAD
        points_str = "[]"
        if self.mode_var.get() == "Custom Shape" and self.imported_shape_points:
            p_list = [f"[{p[0]},{p[1]}]" for p in self.imported_shape_points]
            points_str = f"[{','.join(p_list)}]"

        return f"""
// ==========================================
//   LUMINARY ENGINE V5: UNIVERSAL
//   Scott Protocol: Thread Mating + Custom Vectors
// ==========================================

$fn = 60;

// --- SETTINGS ---
Clip_ID = {clip_id};
Base_Dia = 32;
Shape_Mode = "{self.mode_var.get()}";
Points = {points_str};

// --- MODULES ---

// 1. PRECISION THREAD (Trapezoidal Profile)
module iso_thread(od, h, pitch, internal=false) {{
    tolerance = internal ? 0.4 : -0.2; 
    linear_extrude(height=h, twist=-360*(h/pitch), slices=h*4)
    translate([(od/2) + tolerance, 0, 0])
    rotate([0, 0, 45]) square([1.2, 1.2], center=true);
}}

// 2. THE DISTINCT CLIP (The "Hand")
module clip_hand(angle) {{
    rotate([0, 0, angle]) translate([0, -2, 0]) {{
        // The Stem (Standoff)
        translate([0, -3, 0]) cube([2, 6, 3], center=true);
        
        // The C-Clamp (Distinct Object)
        translate([0, -6, 0]) rotate([90, 0, 0])
        difference() {{
            cylinder(h=4, d=Clip_ID + 2.5);
            translate([0,0,-1]) cylinder(h=6, d=Clip_ID); // The Hole
            translate([Clip_ID/1.5, 0, 2]) cube([Clip_ID, Clip_ID, 10], center=true); // The Snap Opening
        }}
    }}
}}

// 3. THE CORE CHASSIS
module chassis() {{
    color("Orange")
    translate([0,0,35])
    union() {{
        // Base Plug (Threaded Male)
        translate([0,0,-10]) difference() {{
            cylinder(h=10, d=Base_Dia-4);
            // Wire channel
            cylinder(h=12, d=5);
        }}
        translate([0,0,-10]) iso_thread(Base_Dia-4, 10, 3, false);

        // --- SHAPE LOGIC ---
        if (Shape_Mode == "Standard Helix") {{
            // Central Spine
            linear_extrude(height=60, twist=180) translate([0,0]) circle(r=3);
            
            // Clips placed along the Helix
            for(i=[0:72:360]) {{
                rotate([0,0,i]) translate([0,0,i/6]) 
                translate([4,0,0]) // Offset from spine
                rotate([0,0,-90]) // Face outward
                clip_hand(0);
            }}
        }} else {{
            // CUSTOM SHAPE (From Image)
            // We extrude the 2D shape points into a 3D frame
            linear_extrude(height=4) 
                offset(r=2) polygon(points=Points); // The Frame
            
            // Add Clips automatically at intervals
            // This is a simplified distribution for imported points
            for(i=[0 : 5 : len(Points)-1]) {{
                translate([Points[i][0], Points[i][1], 2])
                clip_hand(0); 
            }}
            
            // Support Stalk to Base
            hull() {{
                translate([0,0,-5]) cylinder(h=1, d=8);
                translate([0,0,0]) linear_extrude(1) offset(r=1) polygon(points=Points);
            }}
        }}
    }}
}}

// 4. THE POWER BASE (Female Thread)
module base() {{
    color("#333")
    difference() {{
        union() {{
            cylinder(h=30, d=Base_Dia);
            // Grip Texture
            for(i=[0:30:360]) rotate([0,0,i]) translate([Base_Dia/2, 0, 5]) cylinder(h=20, d=2);
        }}
        
        // Threaded Receiver for Chassis
        translate([0,0,20]) {{
            cylinder(h=11, d=Base_Dia-4.5); // Core hole
            iso_thread(Base_Dia-4, 10, 3, true); // Internal thread cut
        }}
        
        // Battery Cavity
        translate([0,0,2]) cylinder(h=25, d=Base_Dia-8);
        
        // Bottom Wire Hole
        translate([0,0,-1]) cylinder(h=5, d=4);
    }}
}}

// 5. THE SHELL (Threaded Interface)
module shell() {{
    color("White", 0.2)
    translate([0,0,30])
    union() {{
        // Thread Connection to Base (Male)
        translate([0,0,-5]) difference() {{
            cylinder(h=5, d=Base_Dia);
            cylinder(h=5, d=Base_Dia-4);
        }}
        
        // The Bulb Body
        difference() {{
            hull() {{
                translate([0,0,0]) cylinder(h=1, d=Base_Dia);
                translate([0,0,35]) sphere(d=60); // Edison Shape
            }}
            hull() {{
                translate([0,0,0]) cylinder(h=1, d=Base_Dia-4);
                translate([0,0,35]) sphere(d=56);
            }}
            
            // Pattern: Phi-Ribs
            for(i=[0:137.5:3600]) {{
                rotate([0,0,i]) translate([29,0,15]) cylinder(h=80, d=2);
            }}
        }}
    }}
}}

// RENDER
translate([-40, 0, 0]) base();
translate([40, 0, 0]) shell();
translate([0, 40, 0]) chassis();
"""

if __name__ == "__main__":
    root = tk.Tk()
    app = BulbArchitectApp(root)
    root.mainloop()