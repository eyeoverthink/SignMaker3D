# import tkinter as tk
# from tkinter import ttk, messagebox, filedialog
# from PIL import Image, ImageTk, ImageOps, ImageFilter, ImageDraw
# import os
# import uuid
# import math
# import numpy as np

# # ==========================================
# #   BULB ARCHITECT V7: VISUAL COMMAND
# #   Logic: Split-Screen UI + Vector Overlay
# # ==========================================

# class BulbArchitectApp:
#     def __init__(self, root):
#         self.root = root
#         self.root.title("Bulb Architect V7 - Visual Command")
#         self.root.geometry("1100x800") # Wider for split screen
#         self.root.configure(bg="#121212")

#         # Config
#         self.export_dir = os.path.join(os.path.expanduser("~"), "Desktop", "Bulb_Factory_V7")
#         if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)
        
#         self.imported_shape_points = []
#         self.original_image = None
#         self.photo_ref = None # Keep reference to prevent garbage collection

#         self.setup_ui()

#     def setup_ui(self):
#         # MAIN SPLIT CONTAINER
#         panes = tk.PanedWindow(self.root, bg="#121212", orient=tk.HORIZONTAL)
#         panes.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

#         # --- LEFT PANE (CONTROLS) ---
#         left_frame = tk.Frame(panes, bg="#222", width=400)
#         panes.add(left_frame, padx=5)

#         tk.Label(left_frame, text="SETTINGS", font=("Segoe UI", 14, "bold"), bg="#222", fg="#00E676").pack(pady=10)

#         # TABS
#         style = ttk.Style()
#         style.theme_use('clam')
#         style.configure("TNotebook", background="#222", borderwidth=0)
#         style.configure("TNotebook.Tab", background="#333", foreground="white", padding=[10, 5])
#         style.map("TNotebook.Tab", background=[("selected", "#00E676")], foreground=[("selected", "black")])

#         tabs = ttk.Notebook(left_frame)
#         self.tab1 = tk.Frame(tabs, bg="#222")
#         self.tab2 = tk.Frame(tabs, bg="#222")
#         tabs.add(self.tab1, text="1. Housing")
#         tabs.add(self.tab2, text="2. Core Logic")
#         tabs.pack(expand=1, fill="both", padx=10)

#         # Tab 1: Housing
#         f1 = tk.Frame(self.tab1, bg="#222", padx=10, pady=10)
#         f1.pack(fill="both")
#         self.lbl(f1, "BATTERY TYPE")
#         self.batt = tk.StringVar(value="AAA (x2)")
#         ttk.Combobox(f1, textvariable=self.batt, values=["AAA (x2)", "AA (x2)", "18650 (Lithium)"]).pack(fill=tk.X)
#         self.lbl(f1, "BULB STYLE")
#         self.shape = tk.StringVar(value="Edison (ST64)")
#         ttk.Combobox(f1, textvariable=self.shape, values=["Edison (ST64)", "Globe (G25)", "Standard (A19)"]).pack(fill=tk.X)
#         self.lbl(f1, "DIFFUSION")
#         self.pattern = tk.StringVar(value="Phi-Ribs")
#         ttk.Combobox(f1, textvariable=self.pattern, values=["Phi-Ribs", "Hex-Lattice", "Clear"]).pack(fill=tk.X)

#         # Tab 2: Core
#         f2 = tk.Frame(self.tab2, bg="#222", padx=10, pady=10)
#         f2.pack(fill="both")
#         self.lbl(f2, "LIGHT SOURCE")
#         self.tech = tk.StringVar(value="Neon LED (6mm)")
#         ttk.Combobox(f2, textvariable=self.tech, values=["Neon LED (6mm)", "LED Filament (2mm)"]).pack(fill=tk.X)
        
#         self.lbl(f2, "CORE MODE")
#         self.mode = tk.StringVar(value="Standard Helix")
#         tk.Radiobutton(f2, text="Standard Helix", variable=self.mode, value="Standard Helix", 
#                       bg="#222", fg="white", selectcolor="#444", command=self.toggle_mode).pack(anchor="w")
#         tk.Radiobutton(f2, text="Custom Image", variable=self.mode, value="Custom Shape", 
#                       bg="#222", fg="white", selectcolor="#444", command=self.toggle_mode).pack(anchor="w")

#         # Custom Controls (Hidden by default)
#         self.custom_controls = tk.Frame(f2, bg="#333", padx=5, pady=5)
#         tk.Button(self.custom_controls, text="📂 UPLOAD IMAGE", command=self.load_image, 
#                  bg="#2196F3", fg="white", font=("Arial", 10, "bold")).pack(fill=tk.X, pady=2)
#         tk.Button(self.custom_controls, text="❌ CLEAR", command=self.clear_image, 
#                  bg="#F44336", fg="white", font=("Arial", 8)).pack(fill=tk.X, pady=2)

#         # Generate Button (Bottom of Left Pane)
#         tk.Button(left_frame, text="⚡ GENERATE FILES", command=self.generate, 
#                  bg="#00E676", fg="black", font=("Arial", 14, "bold"), height=2).pack(fill=tk.X, padx=10, pady=20)


#         # --- RIGHT PANE (PREVIEW CANVAS) ---
#         right_frame = tk.Frame(panes, bg="#000", bd=2, relief=tk.SUNKEN)
#         panes.add(right_frame, padx=5, stretch="always")

#         tk.Label(right_frame, text="LIVE PREVIEW", font=("Segoe UI", 12), bg="black", fg="#666").pack(pady=5)
        
#         # The Canvas
#         self.canvas = tk.Canvas(right_frame, bg="#111", highlightthickness=0)
#         self.canvas.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
#         # Overlay Text
#         self.status_text = self.canvas.create_text(300, 250, text="No Image Loaded\nSelect 'Custom Image' to Begin", 
#                                                   fill="#444", font=("Arial", 14), justify="center")

#     def lbl(self, p, t):
#         tk.Label(p, text=t, bg="#222", fg="#03A9F4", font=("Segoe UI", 8, "bold")).pack(anchor="w", pady=(10, 0))

#     def toggle_mode(self):
#         if self.mode.get() == "Custom Shape":
#             self.custom_controls.pack(fill=tk.X, pady=10)
#             self.canvas.itemconfig(self.status_text, text="Waiting for Upload...")
#         else:
#             self.custom_controls.pack_forget()
#             self.clear_image()
#             self.canvas.itemconfig(self.status_text, text="Mode: Standard Helix")

#     def clear_image(self):
#         self.imported_shape_points = []
#         self.canvas.delete("all")
#         self.status_text = self.canvas.create_text(300, 250, text="Cleared", fill="#444", font=("Arial", 14))

#     def load_image(self):
#         path = filedialog.askopenfilename(filetypes=[("Images", "*.png;*.jpg;*.jpeg")])
#         if not path: return
        
#         try:
#             # 1. Load & Resize for Preview
#             img = Image.open(path).convert("L") # Grayscale
            
#             # Smart Resize to fit Canvas
#             cw = self.canvas.winfo_width()
#             ch = self.canvas.winfo_height()
#             if cw < 10: cw = 500 # Fallback if window not rendered yet
#             if ch < 10: ch = 500
            
#             img.thumbnail((cw, ch))
#             self.photo_ref = ImageTk.PhotoImage(img) # Prevent GC
            
#             # 2. Display Image
#             self.canvas.delete("all")
#             self.canvas.create_image(cw//2, ch//2, image=self.photo_ref, anchor="center")
            
#             # 3. VECTOR TRACE (The "Scott Tracer")
#             data = np.array(img)
#             h, w = data.shape
#             points = []
            
#             # Visual Feedback List (for drawing lines on canvas)
#             display_points = [] 
            
#             # Scan Loop (Simplified Edge Detection)
#             step = 3
#             for y in range(0, h, step):
#                 for x in range(0, w, step):
#                     if data[y, x] < 128: # Dark Pixel
#                         # Convert to OpenSCAD coordinates (Center 0,0)
#                         sx = x - (w/2)
#                         sy = (h - y) - (h/2)
#                         points.append([sx, sy])
                        
#                         # Convert to Canvas coordinates (Top-Left 0,0)
#                         # We need to center it on the canvas
#                         cx = (cw//2 - (w//2)) + x
#                         cy = (ch//2 - (h//2)) + y
#                         display_points.append(cx)
#                         display_points.append(cy)

#             self.imported_shape_points = points
            
#             # 4. DRAW RED TRACE OVERLAY
#             # This shows the user EXACTLY what the machine saw
#             if len(display_points) > 4:
#                 # Draw points as a "cloud" since basic trace isn't ordered
#                 for i in range(0, len(display_points), 2):
#                     px, py = display_points[i], display_points[i+1]
#                     self.canvas.create_oval(px-1, py-1, px+1, py+1, fill="#00E676", outline="")
            
#             self.canvas.create_text(cw//2, 20, text=f"TRACE SUCCESS: {len(points)} POINTS", fill="#00E676", font=("Arial", 10, "bold"))

#         except Exception as e:
#             messagebox.showerror("Error", str(e))

#     def generate(self):
#         uid = str(uuid.uuid4())[:6]
#         fname = f"Bulb_V7_{uid}.scad"
#         fpath = os.path.join(self.export_dir, fname)
        
#         with open(fpath, "w") as f:
#             f.write(self.get_scad())
        
#         # Success Feedback
#         if messagebox.askyesno("Generated", f"File: {fname}\nOpen Output Folder?"):
#             os.startfile(self.export_dir)

#     def get_scad(self):
#         # Clip Logic
#         tech = self.tech.get()
#         clip_id = 6.2 if "6mm" in tech else (2.2 if "2mm" in tech else 2.5)
        
#         # Shape Logic
#         pts_str = "[]"
#         if self.mode.get() == "Custom Shape" and self.imported_shape_points:
#             pts_str = f"[{','.join([f'[{p[0]},{p[1]}]' for p in self.imported_shape_points])}]"

#         return f"""
# // ==========================================
# //   BULB ARCHITECT V7: VISUAL COMMAND
# //   Scott Protocol: Verified Vectors
# // ==========================================

# $fn = 60;

# // --- PARAMETERS ---
# Clip_ID = {clip_id};
# Base_Dia = 34;
# Design_Mode = "{self.mode.get()}";
# Shape_Points = {pts_str};
# Bulb_Style = "{self.shape.get()}";
# Pattern_Style = "{self.pattern.get()}";

# // --- MODULES ---

# module thread_iso(od, h, pitch, internal) {{
#     tol = internal ? 0.3 : -0.2;
#     linear_extrude(height=h, twist=-360*(h/pitch), slices=h*4)
#     translate([(od/2) + tol, 0, 0])
#     rotate([0,0,45]) square([1.2, 1.2], center=true);
# }}

# module clip_hand(angle) {{
#     rotate([0,0,angle]) translate([2, 0, 0]) {{
#         rotate([0, 90, 0]) cylinder(h=4, d1=3, d2=2);
#         translate([4, 0, 0]) rotate([90, 0, 0])
#         difference() {{
#             cylinder(h=4, d=Clip_ID + 2);
#             translate([0,0,-1]) cylinder(h=6, d=Clip_ID);
#             translate([Clip_ID/1.2, 0, 2]) cube([Clip_ID, Clip_ID, 10], center=true);
#         }}
#     }}
# }}

# // 1. CHASSIS (The Core)
# module part_chassis() {{
#     color("Orange")
#     translate([0,0,40])
#     union() {{
#         // Base Plug
#         translate([0,0,-15]) {{
#             difference() {{ cylinder(h=15, d=Base_Dia - 8.5); cylinder(h=16, d=5); }}
#             thread_iso(Base_Dia - 8.5, 14, 3, false);
#             translate([0,0,14]) cylinder(h=1, d=Base_Dia - 6);
#         }}

#         if (Design_Mode == "Standard Helix") {{
#             linear_extrude(height=60, twist=180) translate([0,0]) circle(r=4);
#             for(i=[0:60:360]) {{
#                 rotate([0,0,i]) translate([0,0,i/6]) translate([4,0,0]) clip_hand(0);
#             }}
#         }} else {{
#             // CUSTOM SHAPE EXTRUSION
#             linear_extrude(height=4) offset(r=1) polygon(points=Shape_Points);
            
#             // Smart Clips (Every 6th point)
#             for(i=[0 : 6 : len(Shape_Points)-1]) {{
#                 translate([Shape_Points[i][0], Shape_Points[i][1], 2])
#                 rotate([0, 0, atan2(Shape_Points[i][1], Shape_Points[i][0])]) 
#                 clip_hand(0);
#             }}
            
#             // Stem
#             hull() {{
#                 translate([0,0,-1]) cylinder(h=1, d=10);
#                 translate([0,0,0]) linear_extrude(1) offset(r=1) polygon(points=Shape_Points);
#             }}
#         }}
#     }}
# }}

# // 2. BASE (Battery)
# module part_base() {{
#     color("#222")
#     difference() {{
#         union() {{
#             cylinder(h=35, d=Base_Dia);
#             translate([0,0,5]) thread_iso(Base_Dia, 25, 4, false);
#             cylinder(h=5, d=Base_Dia + 2);
#         }}
#         translate([0,0,20]) {{
#             cylinder(h=16, d=Base_Dia - 8);
#             thread_iso(Base_Dia - 8, 15, 3, true);
#         }}
#         translate([0,0,2]) {{
#             if ("{self.batt.get()}" == "18650 (Lithium)") cylinder(h=75, d=19.5);
#             else {{ translate([6,0,0]) cylinder(h=55, d=11.5); translate([-6,0,0]) cylinder(h=55, d=11.5); }}
#         }}
#         translate([0,0,-1]) cylinder(h=5, d=4);
#     }}
# }}

# // 3. SHELL (Glass)
# module part_shell() {{
#     color("White", 0.2)
#     translate([0,0,40])
#     union() {{
#         translate([0,0,-10]) difference() {{
#             cylinder(h=10, d=Base_Dia + 4);
#             translate([0,0,-1]) thread_iso(Base_Dia + 0.5, 12, 4, true);
#         }}
#         difference() {{
#             hull() {{
#                 translate([0,0,0]) cylinder(h=1, d=Base_Dia + 4);
#                 if (Bulb_Style == "Globe (G25)") translate([0,0,45]) sphere(d=80);
#                 else translate([0,0,35]) sphere(d=60);
#             }}
#             hull() {{
#                 translate([0,0,0]) cylinder(h=1, d=Base_Dia);
#                 if (Bulb_Style == "Globe (G25)") translate([0,0,45]) sphere(d=76);
#                 else translate([0,0,35]) sphere(d=56);
#             }}
#             if (Pattern_Style == "Phi-Ribs") {{
#                 for(i=[0:137.5:3600]) rotate([0,0,i]) translate([29,0,15]) cylinder(h=80, d=2);
#             }}
#         }}
#     }}
# }}

# translate([-60, 0, 0]) part_base();
# translate([60, 0, 0]) part_shell();
# translate([0, 60, 0]) part_chassis();
# """

# if __name__ == "__main__":
#     root = tk.Tk()
#     app = BulbArchitectApp(root)
#     root.mainloop()

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from PIL import Image, ImageTk, ImageOps, ImageFilter, ImageDraw
import os
import uuid
import math
import numpy as np

# ==========================================
#   BULB ARCHITECT V8: TRANSPARENCY ENGINE
#   Logic: Memory-Safe Preview + Live Trace
# ==========================================

class BulbArchitectApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Bulb Architect V8 - Transparency Engine")
        self.root.geometry("1200x800")
        self.root.configure(bg="#121212")

        self.export_dir = os.path.join(os.path.expanduser("~"), "Desktop", "Bulb_Factory_V8")
        if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)
        
        # LOGIC STATE
        self.shape_points = []
        self.image_ref = None # CRITICAL: Prevents Garbage Collection
        self.preview_scale = 1.0

        self.setup_ui()

    def setup_ui(self):
        # MAIN LAYOUT (Split Screen)
        panes = tk.PanedWindow(self.root, bg="#121212", orient=tk.HORIZONTAL)
        panes.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # --- LEFT: COMMAND CENTER ---
        left = tk.Frame(panes, bg="#222", width=400)
        panes.add(left, padx=5)

        tk.Label(left, text="DESIGN CONTROLS", font=("Segoe UI", 14, "bold"), bg="#222", fg="#00E676").pack(pady=15)

        # 1. CORE MODE
        self.lbl(left, "1. CORE GEOMETRY")
        self.mode = tk.StringVar(value="Standard Helix")
        
        # Mode Switcher
        btn_frame = tk.Frame(left, bg="#222")
        btn_frame.pack(fill=tk.X, padx=10)
        
        b1 = tk.Button(btn_frame, text="HELIX (Procedural)", command=lambda: self.set_mode("Standard Helix"), 
                      bg="#333", fg="white", font=("Arial", 10))
        b1.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=2)
        
        b2 = tk.Button(btn_frame, text="CUSTOM (Import)", command=lambda: self.set_mode("Custom Shape"), 
                      bg="#2196F3", fg="white", font=("Arial", 10, "bold"))
        b2.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=2)

        # Custom Controls (Visible only in Custom Mode)
        self.custom_panel = tk.Frame(left, bg="#333", padx=10, pady=10)
        tk.Button(self.custom_panel, text="📂 UPLOAD IMAGE", command=self.upload_image, 
                 bg="#FF9800", fg="black", font=("Arial", 11, "bold")).pack(fill=tk.X)
        
        tk.Label(self.custom_panel, text="Shape Scale", bg="#333", fg="white", font=("Arial", 8)).pack(pady=(10,0))
        self.scale_slider = tk.Scale(self.custom_panel, from_=0.5, to=2.0, resolution=0.1, orient=tk.HORIZONTAL, 
                                    bg="#333", fg="white", highlightthickness=0, command=self.update_trace_scale)
        self.scale_slider.set(1.0)
        self.scale_slider.pack(fill=tk.X)

        self.trace_status = tk.Label(self.custom_panel, text="No Data", bg="#333", fg="#888")
        self.trace_status.pack(pady=5)

        # 2. HARDWARE SPECS
        self.lbl(left, "2. HARDWARE SPECS")
        self.tech = self.combo(left, ["Neon LED (6mm)", "LED Filament (2mm)", "EL Wire (2.3mm)"])
        self.batt = self.combo(left, ["AAA (x2)", "AA (x2)", "18650 (Lithium)"])
        self.base_style = self.combo(left, ["Edison (ST64)", "Globe (G25)", "Standard (A19)"])

        # GENERATE
        tk.Button(left, text="⚡ MANIFEST ASSEMBLY", command=self.generate, 
                 bg="#00E676", fg="black", font=("Arial", 14, "bold"), height=2).pack(side=tk.BOTTOM, fill=tk.X, padx=10, pady=20)

        # --- RIGHT: PREVIEW ---
        right = tk.Frame(panes, bg="black", bd=2, relief=tk.SUNKEN)
        panes.add(right, padx=5, stretch="always")

        tk.Label(right, text="LIVE TRACE PREVIEW", bg="black", fg="#666").pack(pady=5)
        self.canvas = tk.Canvas(right, bg="#111", highlightthickness=0)
        self.canvas.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Initial State
        self.draw_grid()

    def lbl(self, p, t):
        tk.Label(p, text=t, bg="#222", fg="#03A9F4", font=("Segoe UI", 9, "bold")).pack(anchor="w", padx=10, pady=(15, 2))

    def combo(self, p, vals):
        v = tk.StringVar(value=vals[0])
        ttk.Combobox(p, textvariable=v, values=vals).pack(fill=tk.X, padx=10)
        return v

    def set_mode(self, mode):
        self.mode.set(mode)
        if mode == "Custom Shape":
            self.custom_panel.pack(fill=tk.X, padx=10, pady=5)
        else:
            self.custom_panel.pack_forget()

    def draw_grid(self):
        self.canvas.delete("all")
        w = 600
        h = 600
        # Draw Center Lines
        self.canvas.create_line(w/2, 0, w/2, h, fill="#333", dash=(4, 4))
        self.canvas.create_line(0, h/2, w, h/2, fill="#333", dash=(4, 4))
        self.canvas.create_text(w/2, h/2, text="Waiting for Image...", fill="#444", font=("Arial", 16))

    def upload_image(self):
        path = filedialog.askopenfilename(filetypes=[("Images", "*.png;*.jpg;*.jpeg")])
        if not path: return

        try:
            # 1. Load Image
            img = Image.open(path).convert("L") # Grayscale
            
            # 2. Resize for Preview (Fit to Canvas)
            cw = self.canvas.winfo_width()
            ch = self.canvas.winfo_height()
            if cw < 100: cw = 600
            if ch < 100: ch = 600
            
            img.thumbnail((cw - 50, ch - 50)) # Leave margin
            
            # 3. LOCK IN MEMORY (The Bug Fix)
            self.image_ref = ImageTk.PhotoImage(img)
            self.current_pil_image = img # Keep PIL version for tracing
            
            # 4. Display
            self.canvas.delete("all")
            # Center the image
            self.canvas.create_image(cw/2, ch/2, image=self.image_ref, anchor="center")
            
            # 5. Auto-Trace
            self.run_trace()

        except Exception as e:
            messagebox.showerror("Error", str(e))

    def update_trace_scale(self, val):
        self.preview_scale = float(val)
        if self.image_ref:
            self.run_trace() # Re-trace with new scale

    def run_trace(self):
        if not hasattr(self, 'current_pil_image'): return
        
        img = self.current_pil_image
        data = np.array(img)
        h, w = data.shape
        
        points = [] # For SCAD (Centered 0,0)
        canvas_points = [] # For UI (Top-Left)
        
        cw = self.canvas.winfo_width()
        ch = self.canvas.winfo_height()
        
        # Scaling Factor (User Slider)
        scale = self.preview_scale
        
        # SCAN LOOP (Simple Edge Detection)
        step = 4 # Skip pixels for performance
        for y in range(0, h, step):
            for x in range(0, w, step):
                if data[y, x] < 128: # Dark Pixel found
                    
                    # 1. Calculate SCAD Coordinate (Centered & Scaled)
                    sx = (x - (w/2)) * scale
                    sy = ((h - y) - (h/2)) * scale # Flip Y
                    points.append([sx, sy])
                    
                    # 2. Calculate Canvas Coordinate (Visual Feedback)
                    cx = (cw/2) + sx
                    cy = (ch/2) - sy 
                    canvas_points.append(cx)
                    canvas_points.append(cy)

        self.shape_points = points
        
        # VISUAL FEEDBACK: Draw Green Dots over the image
        # Clear old dots (keep image)
        self.canvas.delete("dots") 
        if len(canvas_points) > 4:
            # Draw points as a single complex line or individual dots
            # Individual dots are better for verifying the "Cloud"
            for i in range(0, len(canvas_points), 2):
                px, py = canvas_points[i], canvas_points[i+1]
                self.canvas.create_rectangle(px, py, px+2, py+2, fill="#00E676", outline="", tags="dots")
                
        self.trace_status.config(text=f"Active Trace: {len(points)} Vectors", fg="#00E676")

    def generate(self):
        uid = str(uuid.uuid4())[:6]
        fname = f"Bulb_V8_{uid}.scad"
        fpath = os.path.join(self.export_dir, fname)
        
        with open(fpath, "w") as f:
            f.write(self.get_scad())
        
        if messagebox.askyesno("Done", f"Generated: {fname}\nOpen Folder?"):
            os.startfile(self.export_dir)

    def get_scad(self):
        # Clip Size Logic
        t = self.tech.get()
        clip_d = 6.2 if "6mm" in t else (2.4 if "EL" in t else 2.2)
        
        # Shape Data
        pts_str = "[]"
        if self.mode.get() == "Custom Shape" and self.shape_points:
            pts_str = f"[{','.join([f'[{p[0]:.2f},{p[1]:.2f}]' for p in self.shape_points])}]"

        return f"""
// ==========================================
//   BULB ARCHITECT V8: TRANSPARENCY
//   Scott Protocol: Verified Vectors
// ==========================================

$fn = 50;

// --- SETTINGS ---
Clip_ID = {clip_d};
Base_Dia = 34;
Design_Mode = "{self.mode.get()}";
Shape_Points = {pts_str};
Bulb_Style = "Edison (ST64)"; // Default for now

// --- MODULES ---

module thread_iso(od, h, pitch, internal) {{
    tol = internal ? 0.4 : -0.2;
    linear_extrude(height=h, twist=-360*(h/pitch), slices=h*4)
    translate([(od/2) + tol, 0, 0])
    rotate([0,0,45]) square([1.2, 1.2], center=true);
}}

module clip_hand(angle) {{
    rotate([0,0,angle]) translate([2, 0, 0]) {{
        rotate([0, 90, 0]) cylinder(h=4, d1=3, d2=2); // Stem
        translate([4, 0, 0]) rotate([90, 0, 0])
        difference() {{
            cylinder(h=4, d=Clip_ID + 2);
            translate([0,0,-1]) cylinder(h=6, d=Clip_ID); // Hole
            translate([Clip_ID/1.5, 0, 2]) cube([Clip_ID, Clip_ID, 10], center=true); // Snap Gap
        }}
    }}
}}

// 1. CHASSIS
module part_chassis() {{
    color("Orange")
    translate([0,0,40])
    union() {{
        // Base Plug
        translate([0,0,-15]) {{
            difference() {{ cylinder(h=15, d=Base_Dia - 8.5); cylinder(h=16, d=5); }}
            thread_iso(Base_Dia - 8.5, 14, 3, false);
            translate([0,0,14]) cylinder(h=1, d=Base_Dia - 6); // Clocking Ring
        }}

        if (Design_Mode == "Standard Helix") {{
            linear_extrude(height=60, twist=180) translate([0,0]) circle(r=4);
            for(i=[0:60:360]) {{
                rotate([0,0,i]) translate([0,0,i/6]) translate([4,0,0]) clip_hand(0);
            }}
        }} else {{
            // CUSTOM SHAPE LOGIC
            if (len(Shape_Points) > 2) {{
                // Extrude the vector shape
                linear_extrude(height=4) offset(r=1) polygon(points=Shape_Points);
                
                // Smart Clips (Every 8th point to avoid crowding)
                for(i=[0 : 8 : len(Shape_Points)-1]) {{
                    translate([Shape_Points[i][0], Shape_Points[i][1], 2])
                    // Auto-Rotate to face outward
                    rotate([0, 0, atan2(Shape_Points[i][1], Shape_Points[i][0])]) 
                    clip_hand(0);
                }}
                
                // Stem to Base
                hull() {{
                    translate([0,0,-1]) cylinder(h=1, d=10);
                    translate([0,0,0]) linear_extrude(1) offset(r=1) polygon(points=Shape_Points);
                }}
            }} else {{
                // Fallback if empty
                cylinder(h=10, d=2);
            }}
        }}
    }}
}}

// 2. BASE
module part_base() {{
    color("#222")
    difference() {{
        union() {{
            cylinder(h=35, d=Base_Dia);
            translate([0,0,5]) thread_iso(Base_Dia, 25, 4, false); // Outer thread
            cylinder(h=5, d=Base_Dia + 2);
        }}
        translate([0,0,20]) {{
            cylinder(h=16, d=Base_Dia - 8);
            thread_iso(Base_Dia - 8, 15, 3, true); // Inner thread
        }}
        translate([0,0,2]) {{
            // Battery Cavity (Generic Large)
            cylinder(h=75, d=19.5); 
        }}
        translate([0,0,-1]) cylinder(h=5, d=4);
    }}
}}

// 3. SHELL
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
                translate([0,0,35]) sphere(d=60);
            }}
            hull() {{
                translate([0,0,0]) cylinder(h=1, d=Base_Dia);
                translate([0,0,35]) sphere(d=56);
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