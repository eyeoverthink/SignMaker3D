import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from PIL import Image, ImageTk, ImageOps, ImageFilter, ImageDraw
import os
import uuid
import math
import numpy as np

# ==========================================
#   BULB ARCHITECT V7: VISUAL COMMAND
#   Logic: Split-Screen UI + Vector Overlay
# ==========================================

class BulbArchitectApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Bulb Architect V7 - Visual Command")
        self.root.geometry("1100x800") # Wider for split screen
        self.root.configure(bg="#121212")

        # Config
        self.export_dir = os.path.join(os.path.expanduser("~"), "Desktop", "Bulb_Factory_V7")
        if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)
        
        self.imported_shape_points = []
        self.original_image = None
        self.photo_ref = None # Keep reference to prevent garbage collection

        self.setup_ui()

    def setup_ui(self):
        # MAIN SPLIT CONTAINER
        panes = tk.PanedWindow(self.root, bg="#121212", orient=tk.HORIZONTAL)
        panes.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # --- LEFT PANE (CONTROLS) ---
        left_frame = tk.Frame(panes, bg="#222", width=400)
        panes.add(left_frame, padx=5)

        tk.Label(left_frame, text="SETTINGS", font=("Segoe UI", 14, "bold"), bg="#222", fg="#00E676").pack(pady=10)

        # TABS
        style = ttk.Style()
        style.theme_use('clam')
        style.configure("TNotebook", background="#222", borderwidth=0)
        style.configure("TNotebook.Tab", background="#333", foreground="white", padding=[10, 5])
        style.map("TNotebook.Tab", background=[("selected", "#00E676")], foreground=[("selected", "black")])

        tabs = ttk.Notebook(left_frame)
        self.tab1 = tk.Frame(tabs, bg="#222")
        self.tab2 = tk.Frame(tabs, bg="#222")
        tabs.add(self.tab1, text="1. Housing")
        tabs.add(self.tab2, text="2. Core Logic")
        tabs.pack(expand=1, fill="both", padx=10)

        # Tab 1: Housing
        f1 = tk.Frame(self.tab1, bg="#222", padx=10, pady=10)
        f1.pack(fill="both")
        self.lbl(f1, "BATTERY TYPE")
        self.batt = tk.StringVar(value="AAA (x2)")
        ttk.Combobox(f1, textvariable=self.batt, values=["AAA (x2)", "AA (x2)", "18650 (Lithium)"]).pack(fill=tk.X)
        self.lbl(f1, "BULB STYLE")
        self.shape = tk.StringVar(value="Edison (ST64)")
        ttk.Combobox(f1, textvariable=self.shape, values=["Edison (ST64)", "Globe (G25)", "Standard (A19)"]).pack(fill=tk.X)
        self.lbl(f1, "DIFFUSION")
        self.pattern = tk.StringVar(value="Phi-Ribs")
        ttk.Combobox(f1, textvariable=self.pattern, values=["Phi-Ribs", "Hex-Lattice", "Clear"]).pack(fill=tk.X)

        # Tab 2: Core
        f2 = tk.Frame(self.tab2, bg="#222", padx=10, pady=10)
        f2.pack(fill="both")
        self.lbl(f2, "LIGHT SOURCE")
        self.tech = tk.StringVar(value="Neon LED (6mm)")
        ttk.Combobox(f2, textvariable=self.tech, values=["Neon LED (6mm)", "LED Filament (2mm)"]).pack(fill=tk.X)
        
        self.lbl(f2, "CORE MODE")
        self.mode = tk.StringVar(value="Standard Helix")
        tk.Radiobutton(f2, text="Standard Helix", variable=self.mode, value="Standard Helix", 
                      bg="#222", fg="white", selectcolor="#444", command=self.toggle_mode).pack(anchor="w")
        tk.Radiobutton(f2, text="Custom Image", variable=self.mode, value="Custom Shape", 
                      bg="#222", fg="white", selectcolor="#444", command=self.toggle_mode).pack(anchor="w")

        # Custom Controls (Hidden by default)
        self.custom_controls = tk.Frame(f2, bg="#333", padx=5, pady=5)
        tk.Button(self.custom_controls, text="📂 UPLOAD IMAGE", command=self.load_image, 
                 bg="#2196F3", fg="white", font=("Arial", 10, "bold")).pack(fill=tk.X, pady=2)
        tk.Button(self.custom_controls, text="❌ CLEAR", command=self.clear_image, 
                 bg="#F44336", fg="white", font=("Arial", 8)).pack(fill=tk.X, pady=2)

        # Generate Button (Bottom of Left Pane)
        tk.Button(left_frame, text="⚡ GENERATE FILES", command=self.generate, 
                 bg="#00E676", fg="black", font=("Arial", 14, "bold"), height=2).pack(fill=tk.X, padx=10, pady=20)


        # --- RIGHT PANE (PREVIEW CANVAS) ---
        right_frame = tk.Frame(panes, bg="#000", bd=2, relief=tk.SUNKEN)
        panes.add(right_frame, padx=5, stretch="always")

        tk.Label(right_frame, text="LIVE PREVIEW", font=("Segoe UI", 12), bg="black", fg="#666").pack(pady=5)
        
        # The Canvas
        self.canvas = tk.Canvas(right_frame, bg="#111", highlightthickness=0)
        self.canvas.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Overlay Text
        self.status_text = self.canvas.create_text(300, 250, text="No Image Loaded\nSelect 'Custom Image' to Begin", 
                                                  fill="#444", font=("Arial", 14), justify="center")

    def lbl(self, p, t):
        tk.Label(p, text=t, bg="#222", fg="#03A9F4", font=("Segoe UI", 8, "bold")).pack(anchor="w", pady=(10, 0))

    def toggle_mode(self):
        if self.mode.get() == "Custom Shape":
            self.custom_controls.pack(fill=tk.X, pady=10)
            self.canvas.itemconfig(self.status_text, text="Waiting for Upload...")
        else:
            self.custom_controls.pack_forget()
            self.clear_image()
            self.canvas.itemconfig(self.status_text, text="Mode: Standard Helix")

    def clear_image(self):
        self.imported_shape_points = []
        self.canvas.delete("all")
        self.status_text = self.canvas.create_text(300, 250, text="Cleared", fill="#444", font=("Arial", 14))

    def load_image(self):
        path = filedialog.askopenfilename(filetypes=[("Images", "*.png;*.jpg;*.jpeg")])
        if not path: return
        
        try:
            # 1. Load & Resize for Preview
            img = Image.open(path).convert("L") # Grayscale
            
            # Smart Resize to fit Canvas
            cw = self.canvas.winfo_width()
            ch = self.canvas.winfo_height()
            if cw < 10: cw = 500 # Fallback if window not rendered yet
            if ch < 10: ch = 500
            
            img.thumbnail((cw, ch))
            self.photo_ref = ImageTk.PhotoImage(img) # Prevent GC
            
            # 2. Display Image
            self.canvas.delete("all")
            self.canvas.create_image(cw//2, ch//2, image=self.photo_ref, anchor="center")
            
            # 3. VECTOR TRACE (The "Scott Tracer")
            data = np.array(img)
            h, w = data.shape
            points = []
            
            # Visual Feedback List (for drawing lines on canvas)
            display_points = [] 
            
            # Scan Loop (Simplified Edge Detection)
            step = 3
            for y in range(0, h, step):
                for x in range(0, w, step):
                    if data[y, x] < 128: # Dark Pixel
                        # Convert to OpenSCAD coordinates (Center 0,0)
                        sx = x - (w/2)
                        sy = (h - y) - (h/2)
                        points.append([sx, sy])
                        
                        # Convert to Canvas coordinates (Top-Left 0,0)
                        # We need to center it on the canvas
                        cx = (cw//2 - (w//2)) + x
                        cy = (ch//2 - (h//2)) + y
                        display_points.append(cx)
                        display_points.append(cy)

            self.imported_shape_points = points
            
            # 4. DRAW RED TRACE OVERLAY
            # This shows the user EXACTLY what the machine saw
            if len(display_points) > 4:
                # Draw points as a "cloud" since basic trace isn't ordered
                for i in range(0, len(display_points), 2):
                    px, py = display_points[i], display_points[i+1]
                    self.canvas.create_oval(px-1, py-1, px+1, py+1, fill="#00E676", outline="")
            
            self.canvas.create_text(cw//2, 20, text=f"TRACE SUCCESS: {len(points)} POINTS", fill="#00E676", font=("Arial", 10, "bold"))

        except Exception as e:
            messagebox.showerror("Error", str(e))

    def generate(self):
        uid = str(uuid.uuid4())[:6]
        fname = f"Bulb_V7_{uid}.scad"
        fpath = os.path.join(self.export_dir, fname)
        
        with open(fpath, "w") as f:
            f.write(self.get_scad())
        
        # Success Feedback
        if messagebox.askyesno("Generated", f"File: {fname}\nOpen Output Folder?"):
            os.startfile(self.export_dir)

    def get_scad(self):
        # Clip Logic
        tech = self.tech.get()
        clip_id = 6.2 if "6mm" in tech else (2.2 if "2mm" in tech else 2.5)
        
        # Shape Logic
        pts_str = "[]"
        if self.mode.get() == "Custom Shape" and self.imported_shape_points:
            pts_str = f"[{','.join([f'[{p[0]},{p[1]}]' for p in self.imported_shape_points])}]"

        return f"""
// ==========================================
//   BULB ARCHITECT V7: VISUAL COMMAND
//   Scott Protocol: Verified Vectors
// ==========================================

$fn = 60;

// --- PARAMETERS ---
Clip_ID = {clip_id};
Base_Dia = 34;
Design_Mode = "{self.mode.get()}";
Shape_Points = {pts_str};
Bulb_Style = "{self.shape.get()}";
Pattern_Style = "{self.pattern.get()}";

// --- MODULES ---

module thread_iso(od, h, pitch, internal) {{
    tol = internal ? 0.3 : -0.2;
    linear_extrude(height=h, twist=-360*(h/pitch), slices=h*4)
    translate([(od/2) + tol, 0, 0])
    rotate([0,0,45]) square([1.2, 1.2], center=true);
}}

module clip_hand(angle) {{
    rotate([0,0,angle]) translate([2, 0, 0]) {{
        rotate([0, 90, 0]) cylinder(h=4, d1=3, d2=2);
        translate([4, 0, 0]) rotate([90, 0, 0])
        difference() {{
            cylinder(h=4, d=Clip_ID + 2);
            translate([0,0,-1]) cylinder(h=6, d=Clip_ID);
            translate([Clip_ID/1.2, 0, 2]) cube([Clip_ID, Clip_ID, 10], center=true);
        }}
    }}
}}

// 1. CHASSIS (The Core)
module part_chassis() {{
    color("Orange")
    translate([0,0,40])
    union() {{
        // Base Plug
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
            // CUSTOM SHAPE EXTRUSION
            linear_extrude(height=4) offset(r=1) polygon(points=Shape_Points);
            
            // Smart Clips (Every 6th point)
            for(i=[0 : 6 : len(Shape_Points)-1]) {{
                translate([Shape_Points[i][0], Shape_Points[i][1], 2])
                rotate([0, 0, atan2(Shape_Points[i][1], Shape_Points[i][0])]) 
                clip_hand(0);
            }}
            
            // Stem
            hull() {{
                translate([0,0,-1]) cylinder(h=1, d=10);
                translate([0,0,0]) linear_extrude(1) offset(r=1) polygon(points=Shape_Points);
            }}
        }}
    }}
}}

// 2. BASE (Battery)
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
        translate([0,0,2]) {{
            if ("{self.batt.get()}" == "18650 (Lithium)") cylinder(h=75, d=19.5);
            else {{ translate([6,0,0]) cylinder(h=55, d=11.5); translate([-6,0,0]) cylinder(h=55, d=11.5); }}
        }}
        translate([0,0,-1]) cylinder(h=5, d=4);
    }}
}}

// 3. SHELL (Glass)
module part_shell() {{
    color("White", 0.2)
    translate([0,0,40])
    union() {{
        translate([0,0,-10]) difference() {{
            cylinder(h=10, d=Base_Dia + 4);
            translate([0,0,-1]) thread_iso(Base_Dia + 0.5, 12, 4, true);
        }}
        difference() {{
            hull() {{
                translate([0,0,0]) cylinder(h=1, d=Base_Dia + 4);
                if (Bulb_Style == "Globe (G25)") translate([0,0,45]) sphere(d=80);
                else translate([0,0,35]) sphere(d=60);
            }}
            hull() {{
                translate([0,0,0]) cylinder(h=1, d=Base_Dia);
                if (Bulb_Style == "Globe (G25)") translate([0,0,45]) sphere(d=76);
                else translate([0,0,35]) sphere(d=56);
            }}
            if (Pattern_Style == "Phi-Ribs") {{
                for(i=[0:137.5:3600]) rotate([0,0,i]) translate([29,0,15]) cylinder(h=80, d=2);
            }}
        }}
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