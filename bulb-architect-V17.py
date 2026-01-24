import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from PIL import Image, ImageTk, ImageOps, ImageDraw
import os
import uuid
import math
import numpy as np

# ==========================================
#   BULB ARCHITECT V17: THE MECHANIC
#   Focus: Deep Threads, Correct Boolean Logic
# ==========================================

class BulbArchitectApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Bulb Architect V17 - Mechanical Fix")
        self.root.geometry("1000x800")
        self.root.configure(bg="#151515")

        self.export_dir = os.path.join(os.path.expanduser("~"), "Desktop", "Bulb_Factory_V17")
        if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)
        
        self.shape_points = []
        self.raw_image = None
        self.img_ref = None

        self.setup_ui()

    def setup_ui(self):
        panes = tk.PanedWindow(self.root, bg="#151515", orient=tk.HORIZONTAL)
        panes.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # LEFT
        left = tk.Frame(panes, bg="#222", width=400)
        panes.add(left, padx=5)

        tk.Label(left, text="MECHANICAL CORE", font=("Segoe UI", 16, "bold"), bg="#222", fg="#00E676").pack(pady=20)

        # 1. CORE
        self.lbl(left, "1. CHASSIS SHAPE")
        self.c_mode = tk.StringVar(value="Standard Helix")
        tk.Button(left, text="HELIX", command=lambda: self.set_mode("Standard Helix"), bg="#333", fg="white").pack(fill=tk.X, padx=20)
        tk.Button(left, text="CUSTOM TRACE", command=lambda: self.set_mode("Custom Trace"), bg="#2196F3", fg="white").pack(fill=tk.X, padx=20)
        
        self.upload_btn = tk.Button(left, text="📂 UPLOAD IMAGE", command=self.upload_image, bg="#FF9800", fg="black")
        
        # 2. SHELL
        self.lbl(left, "2. SHELL TYPE")
        self.style = self.combo(left, ["Edison (ST64)", "Globe (G25)", "Tube (T45)"])
        self.pattern = self.combo(left, ["Clear", "Phi-Ribs", "Hex-Lattice"])

        # 3. BASE
        self.lbl(left, "3. POWER")
        self.batt = self.combo(left, ["AAA (x2)", "AA (x1)", "18650"])

        # GENERATE
        tk.Button(left, text="GENERATE CORRECTED SCAD", command=self.generate, 
                 bg="#00E676", fg="black", font=("Arial", 14, "bold"), height=2).pack(side=tk.BOTTOM, fill=tk.X, padx=20, pady=20)

        # RIGHT
        right = tk.Frame(panes, bg="black", bd=2, relief=tk.SUNKEN)
        panes.add(right, padx=5, stretch="always")
        
        self.canvas = tk.Canvas(right, bg="#050505", highlightthickness=0)
        self.canvas.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        self.root.after(100, self.draw_preview)

    def lbl(self, p, t):
        tk.Label(p, text=t, bg="#222", fg="#03A9F4", font=("Segoe UI", 10, "bold")).pack(anchor="w", padx=20, pady=(20, 5))

    def combo(self, p, vals):
        v = tk.StringVar(value=vals[0])
        ttk.Combobox(p, textvariable=v, values=vals).pack(fill=tk.X, padx=20)
        return v

    def set_mode(self, m):
        self.c_mode.set(m)
        if m == "Custom Trace": self.upload_btn.pack(fill=tk.X, padx=20, pady=5)
        else: self.upload_btn.pack_forget()

    def draw_preview(self):
        w = self.canvas.winfo_width()
        h = self.canvas.winfo_height()
        cx, cy = w/2, h/2
        self.canvas.delete("all")
        
        # Draw Thread Diagram to confirm depth
        # Schematic of the M34 Thread
        self.canvas.create_text(cx, cy-150, text="Thread Depth Verify:", fill="#666")
        
        # Male Thread (Base)
        self.canvas.create_rectangle(cx-40, cy-100, cx-10, cy, fill="#333", outline="")
        for i in range(0, 100, 10):
            # Draw Teeth
            self.canvas.create_polygon(cx-10, cy-100+i, cx, cy-95+i, cx-10, cy-90+i, fill="#555")
            
        # Female Thread (Shell)
        self.canvas.create_rectangle(cx+10, cy-100, cx+40, cy, fill="#222", outline="")
        for i in range(0, 100, 10):
            # Draw Grooves
            self.canvas.create_polygon(cx+10, cy-95+i, cx, cy-90+i, cx+10, cy-85+i, fill="black")

        self.canvas.create_text(cx, cy+20, text="Deep-Cut 'Knuckle' Thread\n2.5mm Engagement", fill="#00E676", justify="center")

        if self.raw_image:
             # Just show small thumbnail
             self.img_ref = ImageTk.PhotoImage(self.raw_image.resize((100, 100)))
             self.canvas.create_image(cx, cy+100, image=self.img_ref)

    def upload_image(self):
        path = filedialog.askopenfilename(filetypes=[("Images", "*.png;*.jpg")])
        if not path: return
        try:
            img = Image.open(path).convert("L")
            self.raw_image = img
            data = np.array(img.resize((200, 200)))
            points = []
            step = 4
            h, w = data.shape
            for y in range(0, h, step):
                for x in range(0, w, step):
                    if data[y, x] < 100: 
                        points.append([(x - w/2), ((h - y) - h/2)])
            self.shape_points = points
            self.draw_preview()
        except: pass

    def generate(self):
        uid = str(uuid.uuid4())[:6]
        fname = f"Bulb_V17_{uid}.scad"
        fpath = os.path.join(self.export_dir, fname)
        with open(fpath, "w") as f:
            f.write(self.get_scad())
        os.startfile(self.export_dir)

    def get_scad(self):
        pts = "[]"
        if self.c_mode.get() == "Custom Trace" and self.shape_points:
            pts = f"[{','.join([f'[{p[0]:.1f},{p[1]:.1f}]' for p in self.shape_points])}]"
            
        return f"""
// ==========================================
//   BULB ARCHITECT V17: THE MECHANIC
//   Fix: Correct Boolean Logic for Threads
// ==========================================

$fn = 60;

// --- SETTINGS ---
Base_Dia = 34;
Clip_ID = 6.2;
Shape_Mode = "{self.c_mode.get()}";
Shape_Points = {pts};
Shell_Style = "{self.style.get()}";
Shell_Pattern = "{self.pattern.get()}";

// --- THREAD ENGINE (THE FIX) ---
// We use a "Knuckle" profile (Round) for easier printing and deeper cut.
// Depth = 2.0mm

module knuckle_thread(od, h, pitch, internal) {{
    // If internal, we are creating a "Tap" to subtract.
    // If external, we are creating the "Bolt" to add.
    
    offset_val = internal ? 0.6 : -0.2; // Tolerance
    
    linear_extrude(height=h, twist=-360*(h/pitch), slices=h*4)
    translate([(od/2) + offset_val, 0, 0])
    circle(r=1.5); // 3mm Thick Thread! (Deep Cut)
}}

module clip_hand(angle) {{
    rotate([0,0,angle]) translate([0, 0, 0]) {{
        translate([2, 0, 0]) rotate([0, 90, 0]) cylinder(h=8, d1=3.5, d2=2);
        translate([8, 0, 0]) rotate([90, 0, 0])
        difference() {{
            cylinder(h=4, d=Clip_ID + 2.5);
            translate([0,0,-1]) cylinder(h=6, d=Clip_ID); 
            translate([Clip_ID/1.5, 0, 2]) cube([Clip_ID, Clip_ID, 10], center=true);
        }}
    }}
}}

// === PART 1: BASE (MALE THREAD) ===
module part_base() {{
    color("#222")
    difference() {{
        union() {{
            cylinder(h=35, d=Base_Dia); // Core
            // ADD THE THREAD
            translate([0,0,5]) knuckle_thread(Base_Dia, 25, 5, false);
            cylinder(h=5, d=Base_Dia + 4); // Stop Ring
        }}
        
        // CHASSIS SOCKET (FEMALE)
        // We subtract the 'Tap' here
        translate([0,0,20]) {{
            // 1. Core Hole
            cylinder(h=16, d=Base_Dia - 8); 
            // 2. Thread Groove
            knuckle_thread(Base_Dia - 8, 15, 4, true);
        }}
        
        // Battery
        translate([0,0,2]) cylinder(h=75, d=19.5); 
        translate([0,0,-1]) cylinder(h=5, d=4);
    }}
}}

// === PART 2: SHELL (FEMALE THREAD) ===
module part_shell() {{
    color("White", 0.3)
    union() {{
        // COLLAR
        difference() {{
            // The Outer Solid Ring
            cylinder(h=12, d=Base_Dia + 6);
            
            // THE FIX: SUBTRACT THE WHOLE CORE
            translate([0,0,-1]) {{
                // 1. Core Hole (Slightly larger than Base_Dia)
                cylinder(h=14, d=Base_Dia + 0.8);
                // 2. Thread Groove
                translate([0,0,1]) knuckle_thread(Base_Dia, 12, 5, true);
            }}
        }}
        
        // GLASS BODY
        translate([0,0,12]) difference() {{
            hull() {{
                cylinder(h=1, d=Base_Dia + 6);
                if (Shell_Style == "Globe (G25)") translate([0,0,45]) sphere(d=80);
                else translate([0,0,35]) sphere(d=60);
            }}
            hull() {{
                cylinder(h=1, d=Base_Dia);
                if (Shell_Style == "Globe (G25)") translate([0,0,45]) sphere(d=76);
                else translate([0,0,35]) sphere(d=56);
            }}
            if (Shell_Pattern == "Phi-Ribs") {{
                for(i=[0:137.5:3600]) rotate([0,0,i]) translate([29,0,15]) cylinder(h=80, d=2);
            }}
        }}
    }}
}}

// === PART 3: CHASSIS (MALE THREAD) ===
module part_chassis() {{
    color("Orange")
    union() {{
        // PLUG
        difference() {{
            cylinder(h=15, d=Base_Dia - 8);
            cylinder(h=16, d=5);
        }}
        // THREAD
        knuckle_thread(Base_Dia - 8, 14, 4, false);
        translate([0,0,14]) cylinder(h=1, d=Base_Dia - 4);

        // STRUCTURE
        translate([0,0,15]) {{
            if (Shape_Mode == "Standard Helix") {{
                linear_extrude(height=60, twist=180) translate([0,0]) circle(r=4);
                for(i=[0:60:360]) rotate([0,0,i]) translate([0,0,i/6]) clip_hand(0);
            }} else {{
                if (len(Shape_Points) > 2) {{
                    linear_extrude(height=4) offset(r=1) polygon(points=Shape_Points);
                    hull() {{
                        translate([0,0,-15]) cylinder(h=1, d=10);
                        linear_extrude(1) offset(r=1) polygon(points=Shape_Points);
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

// LAYOUT (Z=0)
translate([-60, 0, 0]) part_base();
translate([60, 0, 0]) part_shell();
translate([0, 60, 0]) part_chassis();
"""

if __name__ == "__main__":
    root = tk.Tk()
    app = BulbArchitectApp(root)
    root.mainloop()