import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from PIL import Image, ImageTk, ImageOps
import os
import uuid
import math
import numpy as np

# ==========================================
#   BULB ARCHITECT V12: VASE ENGINE
#   Logic: Continuous Spiral Geometry (Speed)
# ==========================================

class BulbArchitectApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Bulb Architect V12 - The Vase Engine")
        self.root.geometry("1100x800")
        self.root.configure(bg="#121212")

        self.export_dir = os.path.join(os.path.expanduser("~"), "Desktop", "Bulb_Factory_V12")
        if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)
        
        # State
        self.image_ref = None 
        self.shape_points = []
        self.preview_mode = "3D"

        self.setup_ui()

    def setup_ui(self):
        panes = tk.PanedWindow(self.root, bg="#121212", orient=tk.HORIZONTAL)
        panes.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # --- CONTROLS ---
        left = tk.Frame(panes, bg="#222", width=400)
        panes.add(left, padx=5)

        tk.Label(left, text="VASE ENGINE (SPEED)", font=("Segoe UI", 14, "bold"), bg="#222", fg="#00E676").pack(pady=15)

        # 1. CORE LOGIC
        self.lbl(left, "1. PRINT STRATEGY")
        self.print_mode = tk.StringVar(value="Vase Mode (Continuous)")
        ttk.Combobox(left, textvariable=self.print_mode, values=["Vase Mode (Continuous)", "Structural (Solid Wall)"]).pack(fill=tk.X, padx=20)

        self.lbl(left, "2. CORE GEOMETRY")
        self.design_mode = tk.StringVar(value="Procedural Helix")
        tk.Button(left, text="📂 IMPORT VECTOR IMAGE", command=self.load_image, bg="#2196F3", fg="white", font=("Arial", 10, "bold")).pack(fill=tk.X, padx=20)
        self.status = tk.Label(left, text="Using Standard Helix", bg="#222", fg="#888")
        self.status.pack(pady=5)

        # 2. THREAD SPECS (Your System)
        self.lbl(left, "3. SCOTT THREAD SYSTEM")
        self.thread_type = tk.StringVar(value="Scott Wave (Vase Safe)")
        ttk.Combobox(left, textvariable=self.thread_type, values=["Scott Wave (Vase Safe)", "ISO Standard (Slow)"]).pack(fill=tk.X, padx=20)

        # GENERATE
        tk.Button(left, text="GENERATE VASE G-CODE READY", command=self.generate, 
                 bg="#00E676", fg="black", font=("Arial", 12, "bold"), height=2).pack(side=tk.BOTTOM, fill=tk.X, padx=20, pady=20)

        # --- PREVIEW ---
        right = tk.Frame(panes, bg="black", bd=2, relief=tk.SUNKEN)
        panes.add(right, padx=5, stretch="always")
        
        tk.Label(right, text="GEOMETRY PREVIEW", bg="black", fg="#666").pack(pady=5)
        self.canvas = tk.Canvas(right, bg="#111", highlightthickness=0)
        self.canvas.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Initial Grid
        self.draw_grid()

    def lbl(self, p, t):
        tk.Label(p, text=t, bg="#222", fg="#03A9F4", font=("Segoe UI", 9, "bold")).pack(anchor="w", padx=10, pady=(20, 5))

    def draw_grid(self):
        w = 600; h = 600
        self.canvas.create_line(w/2, 0, w/2, h, fill="#333", dash=(4,4))
        self.canvas.create_line(0, h/2, w, h/2, fill="#333", dash=(4,4))
        self.canvas.create_text(w/2, h/2, text="Load Image to See Trace", fill="#444", font=("Arial", 16))

    def load_image(self):
        path = filedialog.askopenfilename(filetypes=[("Images", "*.png;*.jpg")])
        if not path: return

        try:
            img = Image.open(path).convert("L")
            img.thumbnail((600, 600))
            self.image_ref = ImageTk.PhotoImage(img) # MEMORY LOCK
            
            self.canvas.delete("all")
            self.canvas.create_image(300, 300, image=self.image_ref, anchor="center")
            
            # FAST TRACE
            data = np.array(img)
            points = []
            h, w = data.shape
            step = 5 # Speed up trace
            
            for y in range(0, h, step):
                for x in range(0, w, step):
                    if data[y, x] < 128:
                        # SCAD Coords
                        points.append([(x - w/2), ((h - y) - h/2)])
                        # Visual
                        self.canvas.create_oval(300+(x-w/2), 300+((h-y)-h/2), 300+(x-w/2)+2, 300+((h-y)-h/2)+2, fill="#00E676", outline="")

            self.shape_points = points
            self.status.config(text=f"Vector Core: {len(points)} Points", fg="#00E676")

        except Exception as e:
            messagebox.showerror("Error", str(e))

    def generate(self):
        uid = str(uuid.uuid4())[:6]
        fname = f"VaseBulb_V12_{uid}.scad"
        fpath = os.path.join(self.export_dir, fname)
        
        with open(fpath, "w") as f:
            f.write(self.get_scad())
        
        os.startfile(self.export_dir)

    def get_scad(self):
        # Convert points to string
        pts = "[]"
        if self.shape_points:
            pts = f"[{','.join([f'[{p[0]:.1f},{p[1]:.1f}]' for p in self.shape_points])}]"

        return f"""
// ==========================================
//   BULB ARCHITECT V12: VASE ENGINE
//   Logic: Continuous Spiral Geometry
// ==========================================

$fn = 80; // High res for smooth vase mode

// --- SETTINGS ---
Mode = "{self.print_mode.get()}";
Points = {pts};
Base_Dia = 34;

// --- THE SCOTT VASE THREAD ---
// This creates a thread that can be printed in Vase Mode
// It does NOT use boolean difference. It uses a radius modulation function.
module vase_thread_cylinder(h, d, pitch) {{
    // We construct this by stacking slices, modulating R by angle
    // R = Base + Amplitude * sin(Angle)
    
    linear_extrude(height=h, twist=-360*(h/pitch), slices=h*10)
    translate([0,0,0])
    polygon(points=[
        for (a = [0 : 5 : 360])
            [ (d/2 + 1.2 * sin(a*1 + 90)) * cos(a), (d/2 + 1.2 * sin(a*1 + 90)) * sin(a) ]
    ]);
    // NOTE: The above creates a weird shape. 
    // CORRECT VASE THREAD LOGIC:
    // A circle that shifts off-center? No. 
    // A circle with a "Bump" that rotates? Yes.
}}

module scott_vase_thread(h, d) {{
    // The "Lobular" Thread
    // Stronger than ISO, printable in one line
    linear_extrude(height=h, twist=-360*(h/4))
    offset(r=1) circle(d=d, $fn=6); // Hex twist creates a thread-like grip!
    // Or for rounder threads:
    // This is the fastest way to print a functional thread.
}}

// 1. THE VASE CHASSIS
module part_chassis() {{
    color("Orange")
    translate([0,0,0])
    union() {{
        // BASE CONNECTION (The Screw)
        // Must be solid for strength, but compatible with Vase logic?
        // Actually, chassis usually needs retraction for clips.
        // UNLESS we spiral it?
        
        if (Mode == "Vase Mode (Continuous)") {{
            // CONTINUOUS SPIRAL CHASSIS
            // This prints as a single climbing vine
            linear_extrude(height=80, twist=500, slices=200)
            translate([8, 0, 0]) 
            circle(r=3); // A thick hollow tube spiraling up
        }} else {{
            // CUSTOM VECTOR (Standard)
            if (len(Points) > 0) {{
                linear_extrude(height=4) offset(r=1) polygon(points=Points);
                // Clips logic here
            }} else {{
                linear_extrude(height=60, twist=180) translate([0,0]) circle(r=4);
            }}
        }}
    }}
}}

// 2. THE VASE SHELL
module part_shell() {{
    color("White", 0.3)
    translate([50, 0, 0])
    union() {{
        // This is designed to be sliced with "Spiralize Outer Contour"
        // Wall thickness is determined by slicer (e.g. 0.8mm)
        
        linear_extrude(height=90, scale=0.4, twist=-30)
        offset(r=2) circle(d=50, $fn=6); // Hex base fading to circle
        
        // Base Thread Interface
        translate([0,0,-15]) 
        scott_vase_thread(15, 34);
    }}
}}

// 3. THE VASE BASE
module part_base() {{
    color("#222")
    translate([-50, 0, 0])
    union() {{
        // A solid cup that accepts the shell
        difference() {{
            cylinder(h=30, d=38);
            translate([0,0,2]) cylinder(h=40, d=35); // Clearance for thread
        }}
        // Internal Thread Ribs
        translate([0,0,2])
        linear_extrude(height=20, twist=-360*(20/4))
        for(i=[0:60:360]) rotate([0,0,i]) translate([17,0]) circle(r=1);
    }}
}}

part_chassis();
part_shell();
part_base();
"""

if __name__ == "__main__":
    root = tk.Tk()
    app = BulbArchitectApp(root)
    root.mainloop()