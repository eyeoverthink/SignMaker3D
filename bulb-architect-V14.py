import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from PIL import Image, ImageTk, ImageOps, ImageDraw
import os
import uuid
import math
import numpy as np

# ==========================================
#   BULB ARCHITECT V14: THE LEVELER
#   Fixes: Z-Leveling, Mesh Fusion, Visual Scaling
# ==========================================

class BulbArchitectApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Bulb Architect V14 - Manufacturing Ready")
        self.root.geometry("1200x800")
        self.root.configure(bg="#121212")

        self.export_dir = os.path.join(os.path.expanduser("~"), "Desktop", "Bulb_Factory_V14")
        if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)
        
        # State
        self.shape_points = []
        self.img_ref = None # PREVENTS GARBAGE COLLECTION
        self.raw_image = None

        self.setup_ui()

    def setup_ui(self):
        # MAIN LAYOUT
        panes = tk.PanedWindow(self.root, bg="#121212", orient=tk.HORIZONTAL)
        panes.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # --- LEFT: CONTROLS ---
        left = tk.Frame(panes, bg="#222", width=400)
        panes.add(left, padx=5)

        tk.Label(left, text="PRODUCTION ENGINE", font=("Segoe UI", 16, "bold"), bg="#222", fg="#00E676").pack(pady=20)

        # 1. CORE LOGIC
        self.lbl(left, "1. CORE CHASSIS")
        self.mode = tk.StringVar(value="Standard Helix")
        
        btn_frame = tk.Frame(left, bg="#222")
        btn_frame.pack(fill=tk.X, padx=20)
        tk.Button(btn_frame, text="HELIX CORE", command=lambda: self.set_mode("Standard Helix"), bg="#333", fg="white", width=15).pack(side=tk.LEFT, padx=2)
        tk.Button(btn_frame, text="CUSTOM SHAPE", command=lambda: self.set_mode("Custom Shape"), bg="#2196F3", fg="white", width=15).pack(side=tk.LEFT, padx=2)

        self.upload_btn = tk.Button(left, text="📂 UPLOAD TRACE IMAGE", command=self.upload_image, bg="#FF9800", fg="black", font=("Arial", 11, "bold"))
        self.status = tk.Label(left, text="Ready", bg="#222", fg="#888")
        self.status.pack(pady=5)

        # 2. SHELL LOGIC
        self.lbl(left, "2. SHELL STYLE")
        self.pattern = self.combo(left, ["Phi-Ribs (Golden Angle)", "Hex-Lattice", "Vase-Spiral (New!)", "Clear"])

        # 3. BASE LOGIC
        self.lbl(left, "3. POWER BASE")
        self.batt = self.combo(left, ["AAA (x2) - 3V", "AA (x1) - 1.5V", "18650 (Lithium)"])
        
        # GENERATE
        tk.Button(left, text="GENERATE LEVELED G-CODE", command=self.generate, 
                 bg="#00E676", fg="black", font=("Arial", 14, "bold"), height=2).pack(side=tk.BOTTOM, fill=tk.X, padx=20, pady=20)

        # --- RIGHT: VISUALIZER ---
        right = tk.Frame(panes, bg="black", bd=2, relief=tk.SUNKEN)
        panes.add(right, padx=5, stretch="always")
        
        tk.Label(right, text="PRINT PREVIEW (Z-LEVEL 0)", bg="black", fg="#666").pack(pady=5)
        self.canvas = tk.Canvas(right, bg="#050505", highlightthickness=0)
        self.canvas.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Draw Context immediately
        self.root.after(100, self.draw_preview_context)

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

    def draw_preview_context(self):
        w = self.canvas.winfo_width()
        h = self.canvas.winfo_height()
        cx, cy = w/2, h/2
        
        self.canvas.delete("all")
        
        # Draw the "Bulb Ghost" to show scale
        # Coordinates mimic the SCAD file
        self.canvas.create_oval(cx-60, cy-120, cx+60, cy, outline="#333", width=2) # Glass
        self.canvas.create_rectangle(cx-30, cy, cx+30, cy+60, outline="#444", width=2) # Base
        self.canvas.create_text(cx, cy+80, text="Build Plate (Z=0)", fill="#666")

        # If we have an image, draw it INSIDE the bulb ghost
        if self.raw_image:
            # Resize image to fit INSIDE the 120px bulb circle
            target_h = 100
            aspect = self.raw_image.width / self.raw_image.height
            target_w = int(target_h * aspect)
            
            disp_img = self.raw_image.resize((target_w, target_h))
            self.img_ref = ImageTk.PhotoImage(disp_img)
            
            # Center it in the glass area
            self.canvas.create_image(cx, cy-60, image=self.img_ref, anchor="center")
            
            # Overlay Green Trace Points
            if self.shape_points:
                scale_x = target_w / 200
                scale_y = target_h / 200
                for p in self.shape_points:
                    # Map SCAD coords back to Canvas
                    px = cx + (p[0] * scale_x)
                    py = (cy - 60) - (p[1] * scale_y)
                    self.canvas.create_oval(px, py, px+1, py+1, fill="#00E676", outline="")

    def upload_image(self):
        path = filedialog.askopenfilename(filetypes=[("Images", "*.png;*.jpg")])
        if not path: return

        try:
            img = Image.open(path).convert("L")
            self.raw_image = img
            
            # Trace Logic (Simplified for robustness)
            data = np.array(img.resize((200, 200)))
            points = []
            step = 4
            h, w = data.shape
            for y in range(0, h, step):
                for x in range(0, w, step):
                    if data[y, x] < 100: 
                        points.append([(x - w/2), ((h - y) - h/2)])
            self.shape_points = points
            self.status.config(text=f"Trace OK: {len(points)} pts", fg="#00E676")
            
            self.draw_preview_context()

        except Exception as e:
            messagebox.showerror("Error", str(e))

    def generate(self):
        uid = str(uuid.uuid4())[:6]
        fname = f"Bulb_V14_{uid}.scad"
        fpath = os.path.join(self.export_dir, fname)
        
        with open(fpath, "w") as f:
            f.write(self.get_scad())
        os.startfile(self.export_dir)

    def get_scad(self):
        pts = "[]"
        if self.mode.get() == "Custom Shape" and self.shape_points:
            pts = f"[{','.join([f'[{p[0]:.1f},{p[1]:.1f}]' for p in self.shape_points])}]"
            
        return f"""
// ==========================================
//   BULB ARCHITECT V14: LEVELED
//   Scott Protocol: Threads | Unions | Z=0
// ==========================================

$fn = 50;

// --- SETTINGS ---
Clip_ID = 6.2;
Base_Dia = 34;
Design_Mode = "{self.mode.get()}";
Shape_Points = {pts};
Pattern_Style = "{self.pattern.get()}";

// --- MODULES ---

module thread_iso(od, h, pitch, internal) {{
    tol = internal ? 0.4 : -0.2;
    linear_extrude(height=h, twist=-360*(h/pitch), slices=h*4)
    translate([(od/2) + tol, 0, 0])
    rotate([0,0,45]) square([1.2, 1.2], center=true);
}}

module clip_hand(angle) {{
    rotate([0,0,angle]) translate([0, 0, 0]) {{ // CENTERED
        // Stem (Extended into spine for Union safety)
        translate([2, 0, 0]) rotate([0, 90, 0]) cylinder(h=6, d1=3, d2=2);
        
        // C-Clamp
        translate([6, 0, 0]) rotate([90, 0, 0])
        difference() {{
            cylinder(h=4, d=Clip_ID + 2);
            translate([0,0,-1]) cylinder(h=6, d=Clip_ID); 
            translate([Clip_ID/1.5, 0, 2]) cube([Clip_ID, Clip_ID, 10], center=true);
        }}
    }}
}}

// 1. CHASSIS (Fixed: Z-Leveled to 0 for print)
module part_chassis() {{
    color("Orange")
    union() {{
        // Base Plug (Starts at Z=0)
        difference() {{ cylinder(h=15, d=Base_Dia - 8.5); cylinder(h=16, d=5); }}
        thread_iso(Base_Dia - 8.5, 14, 3, false);
        translate([0,0,14]) cylinder(h=1, d=Base_Dia - 6); // Clock Ring

        // The Structure (Starts at Z=15)
        translate([0,0,15]) {{
            if (Design_Mode == "Standard Helix") {{
                linear_extrude(height=60, twist=180) translate([0,0]) circle(r=4);
                for(i=[0:60:360]) {{
                    rotate([0,0,i]) translate([0,0,i/6]) clip_hand(0);
                }}
            }} else {{
                if (len(Shape_Points) > 2) {{
                    linear_extrude(height=4) offset(r=1) polygon(points=Shape_Points);
                    hull() {{
                        translate([0,0,-15]) cylinder(h=1, d=10); // Connect to plug
                        linear_extrude(1) offset(r=1) polygon(points=Shape_Points);
                    }}
                    // Clips
                    for(i=[0 : 8 : len(Shape_Points)-1]) {{
                        translate([Shape_Points[i][0], Shape_Points[i][1], 2])
                        rotate([0, 0, atan2(Shape_Points[i][1], Shape_Points[i][0])]) 
                        clip_hand(0);
                    }}
                }} else {{
                    cylinder(h=10, d=2);
                }}
            }}
        }}
    }}
}}

// 2. BASE (Fixed: Z=0)
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

// 3. SHELL (Fixed: Z=0)
module part_shell() {{
    color("White", 0.2)
    union() {{
        // Threaded Collar (Bottom)
        difference() {{
            cylinder(h=10, d=Base_Dia + 4);
            translate([0,0,-1]) thread_iso(Base_Dia + 0.5, 12, 4, true);
        }}
        // Glass Body (Starts at Z=10)
        translate([0,0,10]) difference() {{
            hull() {{
                cylinder(h=1, d=Base_Dia + 4);
                translate([0,0,35]) sphere(d=60);
            }}
            hull() {{
                cylinder(h=1, d=Base_Dia);
                translate([0,0,35]) sphere(d=56);
            }}
            
            // PATTERNS
            if (Pattern_Style == "Phi-Ribs (Golden Angle)") {{
                for(i=[0:137.5:3600]) rotate([0,0,i]) translate([29,0,15]) cylinder(h=80, d=2);
            }}
            if (Pattern_Style == "Vase-Spiral (New!)") {{
                // Continuous spiral cut for Vase Mode effect
                linear_extrude(height=100, twist=180) translate([28,0]) circle(r=2);
            }}
        }}
    }}
}}

// LAYOUT: ALL PARTS AT Z=0
translate([-60, 0, 0]) part_base();
translate([60, 0, 0]) part_shell();
translate([0, 60, 0]) part_chassis();
"""

if __name__ == "__main__":
    root = tk.Tk()
    app = BulbArchitectApp(root)
    root.mainloop()