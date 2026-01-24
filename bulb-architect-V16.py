import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from PIL import Image, ImageTk, ImageOps, ImageDraw
import os
import uuid
import math
import numpy as np

# ==========================================
#   BULB ARCHITECT V16: REFINED STANDARD
#   Focus: Stable Preview, Internal Lithophane, Clean Mesh
# ==========================================

class BulbArchitectApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Bulb Architect V16 - The Refined Standard")
        self.root.geometry("1280x850")
        self.root.configure(bg="#151515")

        self.export_dir = os.path.join(os.path.expanduser("~"), "Desktop", "Bulb_Factory_V16")
        if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)
        
        # State management
        self.shape_points = []
        self.raw_image = None
        self.preview_img_ref = None #Prevents GC
        self.litho_map_data = None

        self.setup_ui()

    def setup_ui(self):
        # MAIN LAYOUT
        panes = tk.PanedWindow(self.root, bg="#151515", orient=tk.HORIZONTAL)
        panes.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # --- LEFT: ENGINEER ---
        left = tk.Frame(panes, bg="#222", width=400)
        panes.add(left, padx=5)

        tk.Label(left, text="DESIGN CONTROLS", font=("Segoe UI", 16, "bold"), bg="#222", fg="#00E676").pack(pady=20)

        # 1. CHASSIS LOGIC
        self.lbl(left, "1. FILAMENT CHASSIS")
        self.chassis_mode = tk.StringVar(value="Standard Helix")
        btn_frame = tk.Frame(left, bg="#222")
        btn_frame.pack(fill=tk.X, padx=20)
        tk.Button(btn_frame, text="HELIX", command=lambda: self.set_c_mode("Standard Helix"), bg="#333", fg="white", width=15).pack(side=tk.LEFT, padx=2)
        tk.Button(btn_frame, text="CUSTOM TRACE", command=lambda: self.set_c_mode("Custom Trace"), bg="#2196F3", fg="white", width=15).pack(side=tk.LEFT, padx=2)
        
        self.upload_btn = tk.Button(left, text="📂 UPLOAD IMAGE (For Trace or Litho)", command=self.upload_image, bg="#FF9800", fg="black", font=("Arial", 11, "bold"))
        self.upload_btn.pack(fill=tk.X, padx=20, pady=10)
        self.status = tk.Label(left, text="No Image Loaded", bg="#222", fg="#888")
        self.status.pack(pady=2)

        # 2. SHELL LOGIC
        self.lbl(left, "2. SHELL DIFFUSION")
        self.shell_style = self.combo(left, ["Edison (ST64)", "Globe (G25)", "Tube (T45)"])
        # Added Internal Lithophane option
        self.shell_pattern = self.combo(left, ["Clear", "Internal Lithophane (Requires Image)", "Phi-Ribs", "Hex-Lattice"])

        # 3. HARDWARE BASE
        self.lbl(left, "3. POWER BASE (ISO Thread)")
        self.batt = self.combo(left, ["AAA (x2)", "AA (x1)", "18650 Li-ion"])

        # GENERATE
        tk.Button(left, text="GENERATE REFINED SCAD", command=self.generate, 
                 bg="#00E676", fg="black", font=("Arial", 14, "bold"), height=2).pack(side=tk.BOTTOM, fill=tk.X, padx=20, pady=20)

        # --- RIGHT: VISUALIZER ---
        right = tk.Frame(panes, bg="black", bd=2, relief=tk.SUNKEN)
        panes.add(right, padx=5, stretch="always")
        tk.Label(right, text="PREVIEW (Z=0 Level)", bg="black", fg="#666").pack(pady=5)
        self.canvas = tk.Canvas(right, bg="#050505", highlightthickness=0)
        self.canvas.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        self.root.after(200, self.update_preview)

    def lbl(self, p, t):
        tk.Label(p, text=t, bg="#222", fg="#03A9F4", font=("Segoe UI", 10, "bold")).pack(anchor="w", padx=20, pady=(20, 5))

    def combo(self, p, vals):
        v = tk.StringVar(value=vals[0])
        ttk.Combobox(p, textvariable=v, values=vals).pack(fill=tk.X, padx=20)
        return v

    def set_c_mode(self, mode):
        self.chassis_mode.set(mode)
        self.update_preview()

    def upload_image(self):
        path = filedialog.askopenfilename(filetypes=[("Images", "*.png;*.jpg;*.jpeg")])
        if not path: return
        try:
            # 1. Load and store raw image
            img = Image.open(path).convert("L")
            self.raw_image = img
            
            # 2. Generate Vector Trace (for Chassis)
            # Resize for consistent tracing
            trace_img = img.resize((150, 150))
            data = np.array(trace_img)
            h, w = data.shape
            points = []
            step = 3
            for y in range(0, h, step):
                for x in range(0, w, step):
                    if data[y, x] < 128: # Dark pixel
                        # Center coodinates
                        points.append([(x - w/2), ((h - y) - h/2)])
            self.shape_points = points

            # 3. Prepare Lithophane Map (for Shell)
            # Invert so dark=thick, light=thin
            self.litho_map_data = ImageOps.invert(img.resize((360, 100))) # Map to cylinder coordinates
            
            self.status.config(text="Image Loaded successfully", fg="#00E676")
            self.update_preview()

        except Exception as e:
            messagebox.showerror("Error", str(e))

    def update_preview(self):
        w = self.canvas.winfo_width()
        h = self.canvas.winfo_height()
        cx, cy = w/2, h/2
        self.canvas.delete("all")

        # 1. Draw Context (Bulb Outline at Z=0)
        # Base
        self.canvas.create_rectangle(cx-30, cy, cx+30, cy+60, outline="#444", width=2)
        self.canvas.create_text(cx, cy+80, text="Base (Z=0)", fill="#666")
        # Shell Ghost
        self.canvas.create_oval(cx-60, cy-120, cx+60, cy, outline="#333", width=2, dash=(5,5))

        # 2. Draw Image/Trace Data
        if self.raw_image:
            # A. Show the source image scaled inside the bulb
            target_h = 80
            aspect = self.raw_image.width / self.raw_image.height
            target_w = int(target_h * aspect)
            disp_img = self.raw_image.resize((target_w, target_h))
            self.preview_img_ref = ImageTk.PhotoImage(disp_img)
            self.canvas.create_image(cx, cy-60, image=self.preview_img_ref, anchor="center")

            # B. Draw the Trace Points (If custom mode selected)
            if self.chassis_mode.get() == "Custom Trace" and self.shape_points:
                # Scale factors based on the trace resize (150x150) vs display size
                sx = target_w / 150
                sy = target_h / 150
                for p in self.shape_points:
                    # Map vector space to canvas space centered in the bulb
                    px = cx + (p[0] * sx)
                    py = (cy - 60) - (p[1] * sy)
                    # Draw distinct dots, not a glob
                    self.canvas.create_oval(px, py, px+2, py+2, fill="#00E676", outline="")

    def generate(self):
        uid = str(uuid.uuid4())[:6]
        
        # Handle Lithophane Map
        map_filename = "no_map.png"
        if self.shell_pattern.get() == "Internal Lithophane (Requires Image)" and self.litho_map_data:
            map_filename = f"LithoMap_{uid}.png"
            self.litho_map_data.save(os.path.join(self.export_dir, map_filename))
        elif self.shell_pattern.get() == "Internal Lithophane (Requires Image)" and not self.litho_map_data:
             messagebox.showwarning("Warning", "Select 'Internal Lithophane' but no image loaded.\nProceeding with clear shell.")
             self.shell_pattern.set("Clear")

        fname = f"RefinedBulb_V16_{uid}.scad"
        fpath = os.path.join(self.export_dir, fname)
        
        with open(fpath, "w") as f:
            f.write(self.get_scad(map_filename))
        os.startfile(self.export_dir)

    def get_scad(self, map_file):
        pts = "[]"
        if self.chassis_mode.get() == "Custom Trace" and self.shape_points:
            pts = f"[{','.join([f'[{p[0]:.1f},{p[1]:.1f}]' for p in self.shape_points])}]"

        return f"""
// ==========================================
//   BULB ARCHITECT V16: REFINED STANDARD
//   Consistent Logic | Clean Mesh | Internal Litho
// ==========================================

$fn = 60;

// --- SETTINGS ---
Base_Dia = 34;
Chassis_Mode = "{self.chassis_mode.get()}";
Shape_Points = {pts};
Shell_Style = "{self.shell_style.get()}";
Shell_Pattern = "{self.shell_pattern.get()}";
Litho_Map = "{map_file}";

// --- MODULES ---

module thread_iso(od, h, pitch, internal) {{
    tol = internal ? 0.5 : -0.2; // Increased internal tol slightly for better fit
    linear_extrude(height=h, twist=-360*(h/pitch), slices=h*4)
    translate([(od/2) + tol, 0, 0])
    rotate([0,0,45]) square([1.2, 1.2], center=true);
}}

module clip_hand(angle) {{
    rotate([0,0,angle]) translate([0, 0, 0]) {{
        // Stem with extra overlap for clean union
        translate([1, 0, 0]) rotate([0, 90, 0]) cylinder(h=8, d1=3.5, d2=2);
        // C-Clamp
        translate([8, 0, 0]) rotate([90, 0, 0])
        difference() {{
            cylinder(h=4, d=8.2); // 6mm neon + walls
            translate([0,0,-1]) cylinder(h=6, d=6.2); 
            translate([4, 0, 2]) cube([6, 6, 10], center=true); // Snap opening
        }}
    }}
}}

// === PART 1: CHASSIS (Z=0) ===
module part_chassis() {{
    color("Orange")
    union() {{
        // Plug
        difference() {{ cylinder(h=15, d=Base_Dia - 8.5); cylinder(h=16, d=5); }}
        thread_iso(Base_Dia - 8.5, 14, 3, false);
        translate([0,0,14]) cylinder(h=1, d=Base_Dia - 6);

        // Structure (Starts at Z=15)
        translate([0,0,15]) {{
            if (Chassis_Mode == "Standard Helix") {{
                linear_extrude(height=60, twist=180) translate([0,0]) circle(r=4);
                for(i=[0:60:360]) rotate([0,0,i]) translate([0,0,i/6]) clip_hand(0);
            }} else {{
                if (len(Shape_Points) > 2) {{
                    linear_extrude(height=4) offset(r=1.5) polygon(points=Shape_Points);
                    hull() {{
                        translate([0,0,-15]) cylinder(h=1, d=10);
                        linear_extrude(1) offset(r=1.5) polygon(points=Shape_Points);
                    }}
                    for(i=[0 : 8 : len(Shape_Points)-1]) {{
                        translate([Shape_Points[i][0], Shape_Points[i][1], 2])
                        rotate([0, 0, atan2(Shape_Points[i][1], Shape_Points[i][0])]) 
                        clip_hand(0);
                    }}
                }} else {{ cylinder(h=10, d=2); }}
            }}
        }}
    }}
}}

// === PART 2: BASE (Z=0) ===
module part_base() {{
    color("#222")
    difference() {{
        union() {{
            cylinder(h=35, d=Base_Dia);
            translate([0,0,5]) thread_iso(Base_Dia, 25, 4, false);
            cylinder(h=5, d=Base_Dia + 2);
        }}
        translate([0,0,20]) {{
            cylinder(h=16, d=Base_Dia - 8);
            thread_iso(Base_Dia - 8, 15, 3, true);
        }}
        translate([0,0,2]) cylinder(h=75, d=19.5); 
        translate([0,0,-1]) cylinder(h=5, d=4);
    }}
}}

// === PART 3: SHELL (Z=0) ===
module part_shell() {{
    color("White", 0.3)
    union() {{
        // Collar
        difference() {{
            cylinder(h=10, d=Base_Dia + 4);
            translate([0,0,-1]) thread_iso(Base_Dia + 0.5, 12, 4, true);
        }}
        
        // Glass Body (Starts at Z=10)
        translate([0,0,10]) 
        difference() {{
            // Outer Surface
            hull() {{
                cylinder(h=1, d=Base_Dia + 4);
                if (Shell_Style == "Globe (G25)") translate([0,0,45]) sphere(d=80);
                else translate([0,0,35]) sphere(d=60);
            }}
            
            // Inner Surface (SUBTRACTION ZONE)
            // This is where we carve the lithophane
            if (Shell_Pattern == "Internal Lithophane (Requires Image)") {{
                // TRUE INTERNAL LITHOPHANE LOGIC
                // We create a solid inner core, then add the texture back? No.
                // We take the hollow shell, and subtract the inverted heightmap from the inside wall.
                
                difference() {{
                     hull() {{ // Standard Hollow
                        cylinder(h=1, d=Base_Dia);
                        if (Shell_Style == "Globe (G25)") translate([0,0,45]) sphere(d=76);
                        else translate([0,0,35]) sphere(d=56);
                    }}
                    
                    // THE LITHOPHANE SUBTRACTION
                    // Map the image onto a cylinder and subtract it from the inner wall.
                    // Note: This is computationally heavy for F6 render.
                    intersection() {{
                         hull() {{ // Bound to inner shape
                            cylinder(h=1, d=Base_Dia);
                            if (Shell_Style == "Globe (G25)") translate([0,0,45]) sphere(d=76);
                            else translate([0,0,35]) sphere(d=56);
                        }}
                        // Projection loop
                        for(r=[0:10:350]) {{
                             rotate([0,0,r]) translate([25,0,0]) 
                             rotate([90,0,90])
                             scale([0.5, 0.5, 1]) // Adjust depth of cut
                             surface(file=Litho_Map, center=true, invert=true);
                        }}
                    }}
                }}
            }} else {{
                // Standard Clear Hollow
                hull() {{
                    cylinder(h=1, d=Base_Dia);
                    if (Shell_Style == "Globe (G25)") translate([0,0,45]) sphere(d=76);
                    else translate([0,0,35]) sphere(d=56);
                }}
            }}
            
            // External Patterns (Phi-Ribs etc)
            if (Shell_Pattern == "Phi-Ribs") {{
                for(i=[0:137.5:3600]) rotate([0,0,i]) translate([29,0,15]) cylinder(h=80, d=2);
            }}
        }}
    }}
}}

// LAYOUT (All at Z=0)
translate([-60, 0, 0]) part_base();
translate([60, 0, 0]) part_shell();
translate([0, 60, 0]) part_chassis();
"""

if __name__ == "__main__":
    root = tk.Tk()
    app = BulbArchitectApp(root)
    root.mainloop()