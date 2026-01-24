import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from PIL import Image, ImageTk, ImageOps, ImageDraw
import os
import uuid
import math
import numpy as np

# ==========================================
#   BULB ARCHITECT V13: HYBRID ENGINE
#   Logic: V8 Function + V12 Speed + 3D Preview
# ==========================================

class BulbArchitectApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Bulb Architect V13 - The Hybrid")
        self.root.geometry("1300x900")
        self.root.configure(bg="#151515")

        self.export_dir = os.path.join(os.path.expanduser("~"), "Desktop", "Bulb_Factory_V13")
        if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)
        
        # State
        self.shape_points = []
        self.preview_img_ref = None # Python Garbage Collector lock
        self.raw_image = None

        self.setup_ui()

    def setup_ui(self):
        # MAIN LAYOUT
        panes = tk.PanedWindow(self.root, bg="#151515", orient=tk.HORIZONTAL)
        panes.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # --- LEFT: ENGINEER ---
        left = tk.Frame(panes, bg="#222", width=400)
        panes.add(left, padx=5)

        tk.Label(left, text="HYBRID ENGINEER", font=("Segoe UI", 16, "bold"), bg="#222", fg="#00E676").pack(pady=20)

        # 1. CORE LOGIC (V8 Logic)
        self.lbl(left, "1. CORE CHASSIS")
        self.mode = tk.StringVar(value="Standard Helix")
        
        btn_frame = tk.Frame(left, bg="#222")
        btn_frame.pack(fill=tk.X, padx=20)
        tk.Button(btn_frame, text="HELIX CORE", command=lambda: self.set_mode("Standard Helix"), bg="#333", fg="white", width=15).pack(side=tk.LEFT, padx=2)
        tk.Button(btn_frame, text="CUSTOM IMAGE", command=lambda: self.set_mode("Custom Shape"), bg="#2196F3", fg="white", width=15).pack(side=tk.LEFT, padx=2)

        self.upload_btn = tk.Button(left, text="📂 UPLOAD VECTOR IMAGE", command=self.upload_image, bg="#FF9800", fg="black", font=("Arial", 11, "bold"))
        # Hidden by default until mode selected
        
        self.status = tk.Label(left, text="Ready", bg="#222", fg="#888")
        self.status.pack(pady=5)

        # 2. SHELL LOGIC (V12 Logic)
        self.lbl(left, "2. SHELL PHYSICS")
        self.shell_mode = self.combo(left, ["Hybrid Vase (Solid Thread + Spiral Body)", "Full Structural (Slow)"])
        self.pattern = self.combo(left, ["Phi-Ribs (Golden Angle)", "Hex-Lattice", "Clear"])

        # 3. BASE LOGIC (V8 Logic)
        self.lbl(left, "3. POWER BASE")
        self.batt = self.combo(left, ["AAA (x2) - 3V", "AA (x1) - 1.5V", "18650 (Lithium)", "CR2032"])
        
        # GENERATE
        tk.Button(left, text="MANIFEST HYBRID G-CODE", command=self.generate, 
                 bg="#00E676", fg="black", font=("Arial", 14, "bold"), height=2).pack(side=tk.BOTTOM, fill=tk.X, padx=20, pady=20)

        # --- RIGHT: VISUALIZER ---
        right = tk.Frame(panes, bg="black", bd=2, relief=tk.SUNKEN)
        panes.add(right, padx=5, stretch="always")
        
        tk.Label(right, text="HOLOGRAPHIC PREVIEW", bg="black", fg="#666").pack(pady=5)
        self.canvas = tk.Canvas(right, bg="#050505", highlightthickness=0)
        self.canvas.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Draw the "Bulb Context" immediately
        self.root.after(100, self.draw_bulb_context)

    def lbl(self, p, t):
        tk.Label(p, text=t, bg="#222", fg="#03A9F4", font=("Segoe UI", 10, "bold")).pack(anchor="w", padx=20, pady=(20, 5))

    def combo(self, p, vals):
        v = tk.StringVar(value=vals[0])
        ttk.Combobox(p, textvariable=v, values=vals).pack(fill=tk.X, padx=20)
        return v

    def set_mode(self, mode):
        self.mode.set(mode)
        if mode == "Custom Shape":
            self.upload_btn.pack(fill=tk.X, padx=20, pady=5)
        else:
            self.upload_btn.pack_forget()

    def draw_bulb_context(self):
        w = self.canvas.winfo_width()
        h = self.canvas.winfo_height()
        cx, cy = w/2, h/2
        
        self.canvas.delete("context")
        
        # Draw Base (Gray)
        self.canvas.create_rectangle(cx-40, cy+100, cx+40, cy+180, outline="#444", width=2, tags="context")
        # Draw Threads
        for i in range(0, 40, 10):
            self.canvas.create_line(cx-40, cy+110+i, cx+40, cy+120+i, fill="#333", width=1, tags="context")
            
        # Draw Glass Outline (Cyan Ghost)
        # Edison Shape
        points = [
            cx-40, cy+100, # Neck
            cx-40, cy+50,
            cx-80, cy-50, # Body
            cx-80, cy-120,
            cx, cy-180,   # Top
            cx+80, cy-120,
            cx+80, cy-50,
            cx+40, cy+50,
            cx+40, cy+100
        ]
        self.canvas.create_polygon(points, outline="#00E676", fill="", width=2, smooth=True, tags="context")
        self.canvas.create_text(cx, cy+140, text="BASE", fill="#666", tags="context")

    def upload_image(self):
        path = filedialog.askopenfilename(filetypes=[("Images", "*.png;*.jpg")])
        if not path: return

        try:
            # 1. Load
            img = Image.open(path).convert("L")
            self.raw_image = img
            
            # 2. Trace Vector (For SCAD)
            data = np.array(img.resize((200, 200)))
            points = []
            step = 4
            h, w = data.shape
            for y in range(0, h, step):
                for x in range(0, w, step):
                    if data[y, x] < 100: # Dark
                        points.append([(x - w/2), ((h - y) - h/2)])
            self.shape_points = points
            
            # 3. HOLOGRAPHIC PREVIEW (The Visual Fix)
            self.update_preview()
            
            self.status.config(text=f"Core Loaded: {len(points)} Vectors", fg="#00E676")

        except Exception as e:
            messagebox.showerror("Error", str(e))

    def update_preview(self):
        if not self.raw_image: return
        
        # Get Canvas Size
        w = self.canvas.winfo_width()
        h = self.canvas.winfo_height()
        cx, cy = w/2, h/2
        
        self.canvas.delete("preview")
        
        # Simulate Cylindrical Projection
        # We slice the image into strips and map them
        sim_w = 140 # Width of bulb on screen
        sim_h = 200 # Height of image area
        
        disp_img = self.raw_image.resize((sim_w, sim_h))
        self.preview_img_ref = ImageTk.PhotoImage(disp_img)
        
        # Draw Image INSIDE the Bulb Outline
        self.canvas.create_image(cx, cy-40, image=self.preview_img_ref, tags="preview")
        
        # Draw Green "Vector Dots" over it to confirm tracing
        scale_x = sim_w / 200
        scale_y = sim_h / 200
        
        if len(self.shape_points) > 0:
            flat_pts = []
            for p in self.shape_points:
                # Map vector space to canvas space
                px = cx + (p[0] * scale_x)
                py = (cy - 40) - (p[1] * scale_y)
                flat_pts.extend([px, py])
            
            # Draw the trace as a point cloud
            for i in range(0, len(flat_pts), 2):
                x, y = flat_pts[i], flat_pts[i+1]
                self.canvas.create_rectangle(x, y, x+2, y+2, fill="#00E676", outline="", tags="preview")

    def generate(self):
        uid = str(uuid.uuid4())[:6]
        fname = f"HybridBulb_V13_{uid}.scad"
        fpath = os.path.join(self.export_dir, fname)
        
        with open(fpath, "w") as f:
            f.write(self.get_scad())
        os.startfile(self.export_dir)

    def get_scad(self):
        # Data prep
        pts = "[]"
        if self.mode.get() == "Custom Shape" and self.shape_points:
            pts = f"[{','.join([f'[{p[0]:.1f},{p[1]:.1f}]' for p in self.shape_points])}]"
            
        return f"""
// ==========================================
//   BULB ARCHITECT V13: HYBRID ENGINE
//   Base: V8 Structural | Shell: V12 Vase Hybrid
// ==========================================

$fn = 60;

// --- PARAMETERS ---
Clip_ID = 6.2; // Neon 6mm
Base_Dia = 34;
Design_Mode = "{self.mode.get()}";
Shape_Points = {pts};
Shell_Mode = "{self.shell_mode.get()}";

// --- MODULES ---

module thread_iso(od, h, pitch, internal) {{
    tol = internal ? 0.4 : -0.2;
    linear_extrude(height=h, twist=-360*(h/pitch), slices=h*4)
    translate([(od/2) + tol, 0, 0])
    rotate([0,0,45]) square([1.2, 1.2], center=true);
}}

module clip_hand(angle) {{
    // The "Invisible" C-Clamp
    rotate([0,0,angle]) translate([2, 0, 0]) {{
        rotate([0, 90, 0]) cylinder(h=3, d1=3, d2=2); 
        translate([3, 0, 0]) rotate([90, 0, 0])
        difference() {{
            cylinder(h=3, d=Clip_ID + 1.5); // Thin Wall
            translate([0,0,-1]) cylinder(h=5, d=Clip_ID);
            translate([Clip_ID/1.5, 0, 2]) cube([Clip_ID, Clip_ID, 10], center=true);
        }}
    }}
}}

// 1. THE HYBRID SHELL (The Magic Part)
module part_shell() {{
    color("White", 0.3)
    translate([0,0,40])
    union() {{
        // SECTION A: The Threaded Collar (Solid Print)
        // Prints normal speed, 100% infill recommended
        translate([0,0,-10]) difference() {{
            cylinder(h=10, d=Base_Dia + 4);
            translate([0,0,-1]) thread_iso(Base_Dia + 0.5, 12, 4, true);
        }}
        
        // SECTION B: The Vase Body (High Speed)
        // Designed for "Spiralize Outer Contour" or 0% Infill
        translate([0,0,0])
        difference() {{
            // Outer Hull
            hull() {{
                cylinder(h=1, d=Base_Dia + 4);
                translate([0,0,35]) sphere(d=60);
                translate([0,0,70]) sphere(d=30);
            }}
            // Inner Hull (Thin Wall)
            hull() {{
                cylinder(h=1, d=Base_Dia); // 2mm Wall at bottom for strength
                translate([0,0,35]) sphere(d=58); // 1mm Wall top
                translate([0,0,70]) sphere(d=28);
            }}
            
            // PATTERN: Phi-Ribs (Surface Cuts for Vase Mode)
            // We cut SLITS into the wall. Vase mode will trace around them.
            for(i=[0:137.5:3600]) {{
                rotate([0,0,i]) translate([29,0,20]) cylinder(h=60, d=3);
            }}
        }}
    }}
}}

// 2. THE CHASSIS (Vector Core)
module part_chassis() {{
    color("Orange")
    translate([0,0,40])
    union() {{
        // Threaded Plug
        translate([0,0,-15]) {{
            difference() {{ cylinder(h=15, d=Base_Dia - 8.5); cylinder(h=16, d=5); }}
            thread_iso(Base_Dia - 8.5, 14, 3, false);
            translate([0,0,14]) cylinder(h=1, d=Base_Dia - 6);
        }}

        if (Design_Mode == "Standard Helix") {{
            linear_extrude(height=60, twist=180) translate([0,0]) circle(r=4);
            for(i=[0:60:360]) {{
                rotate([0,0,i]) translate([0,0,i/6]) translate([4,0,0]) clip_hand(0);
            }}
        }} else {{
            // CUSTOM SHAPE
            if (len(Shape_Points) > 2) {{
                linear_extrude(height=4) offset(r=1) polygon(points=Shape_Points);
                for(i=[0 : 8 : len(Shape_Points)-1]) {{
                    translate([Shape_Points[i][0], Shape_Points[i][1], 2])
                    rotate([0, 0, atan2(Shape_Points[i][1], Shape_Points[i][0])]) 
                    clip_hand(0);
                }}
                hull() {{
                    translate([0,0,-1]) cylinder(h=1, d=10);
                    translate([0,0,0]) linear_extrude(1) offset(r=1) polygon(points=Shape_Points);
                }}
            }} else {{
                cylinder(h=10, d=2);
            }}
        }}
    }}
}}

// 3. THE BASE (Structural)
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
        translate([0,0,2]) cylinder(h=75, d=19.5); // Battery
        translate([0,0,-1]) cylinder(h=5, d=4);
    }}
}}

translate([-60, 0, 0]) part_base();
translate([60, 0, 0]) part_shell();
translate([0, 60, 0]) part_chassis();
"""

if __name__ == "__main__":
    root = tk.Tk()
    app = BulbArchitectApp(root)
    root.mainloop()