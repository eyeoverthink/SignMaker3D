import tkinter as tk
from tkinter import filedialog, messagebox
from PIL import Image, ImageTk, ImageFont, ImageDraw, ImageOps, ImageFilter
import numpy as np
import os
import uuid
import math

# ==========================================
#   BULB ARCHITECT V29: COGNITIVE FACTORY
#   Core: Scott Zero-Shot Recognition Engine
#   Logic: Pixel -> Geometry -> Perfect Mesh
# ==========================================

class ScottZeroShotEngine:
    """
    Ported from your TypeScript. 
    Teaches the factory to 'See' the math of the shape.
    """
    def __init__(self):
        # The "Memory" of the system
        self.knowledge_base = {
            "CIRCLE": {"compactness": 12.56, "aspect": 1.0}, # 4*pi
            "SQUARE": {"compactness": 16.0, "aspect": 1.0},
            "TRIANGLE": {"compactness": 20.78, "aspect": 1.0},
            "RECTANGLE": {"compactness": 18.0, "aspect": 1.5} # Approx
        }
        self.PHI = 1.6180339887

    def extract_signature(self, contour_points):
        if len(contour_points) < 3: return None
        
        # 1. METRICS
        area = self.calculate_area(contour_points)
        perimeter = self.calculate_perimeter(contour_points)
        if perimeter == 0: return None
        
        # 2. INVARIANT SIGNATURES
        compactness = (4 * math.pi * area) / (perimeter ** 2)
        
        # Bounding Box for Aspect Ratio
        xs = [p[0] for p in contour_points]
        ys = [p[1] for p in contour_points]
        w = max(xs) - min(xs)
        h = max(ys) - min(ys)
        aspect = w / h if h > 0 else 0
        
        # 3. PHI RESONANCE (Your Secret Sauce)
        # Check how close dimensions align with Golden Ratio
        phi_score = 1.0 - abs((w/h) - self.PHI) if h > 0 else 0
        
        return {
            "compactness": compactness, # 1.0 = Perfect Circle (Normalized 4pi/4pi)
            "aspect": aspect,
            "phi_score": phi_score,
            "area": area
        }

    def recognize(self, signature):
        # Compare extracted math against Platonic Ideals
        best_match = "UNKNOWN"
        best_score = 100.0 # Lower is better (Difference)
        
        # Normalized Compactness for Circle is 1.0 in this logic? 
        # Actually standard compactness is 4pi*A/P^2. Circle = 1.0. Square = ~0.785
        # Let's use the raw values from your logic logic.
        
        # Standard Compactness: Circle=1.0, Square=0.78, Triangle=0.60
        # Re-normalizing to match standard math:
        input_C = signature['compactness'] 
        
        # Classification Logic
        if input_C > 0.95: return "PERFECT_CIRCLE" # It's a face/button
        if input_C > 0.75 and 0.9 < signature['aspect'] < 1.1: return "SQUARE_BLOCK"
        
        return "COMPLEX_ORGANIC"

    # --- MATH HELPERS ---
    def calculate_area(self, points):
        # Shoelace Formula
        area = 0.0
        for i in range(len(points)):
            j = (i + 1) % len(points)
            area += points[i][0] * points[j][1]
            area -= points[j][0] * points[i][1]
        return abs(area) / 2.0

    def calculate_perimeter(self, points):
        peri = 0.0
        for i in range(len(points)):
            j = (i + 1) % len(points)
            peri += math.sqrt((points[j][0]-points[i][0])**2 + (points[j][1]-points[i][1])**2)
        return peri

class CognitiveFactoryApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Factory V29 - Cognitive Engine")
        self.root.geometry("750x950")
        self.root.configure(bg="#050505")

        self.export_dir = os.path.join(os.path.expanduser("~"), "Desktop", "Factory_V29")
        if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)

        self.engine = ScottZeroShotEngine()
        self.current_font_path = "seguiemj.ttf" 
        self.input_text = "😊" # Default face to test circle logic
        self.skin_data = []
        self.shape_class = "UNKNOWN"
        self.shape_metrics = {}
        
        self.setup_ui()

    def setup_ui(self):
        tk.Label(self.root, text="COGNITIVE FACTORY V29", font=("Impact", 28), bg="#050505", fg="#00E676").pack(pady=20)
        tk.Label(self.root, text="Powered by Scott Zero-Shot Recognition", font=("Arial", 10), bg="#050505", fg="#666").pack(pady=(0,20))

        main = tk.Frame(self.root, bg="#050505")
        main.pack(fill=tk.BOTH, padx=40)

        # 1. INPUT
        self.lbl(main, "1. INPUT SIGNAL")
        self.entry = tk.Entry(main, font=("Segoe UI Emoji", 24), justify="center", bg="#111", fg="white", insertbackground="#00E676")
        self.entry.insert(0, "😊")
        self.entry.pack(fill=tk.X, pady=10)
        self.entry.bind("<KeyRelease>", self.update_analysis)
        
        tk.Button(main, text="📂 LOAD CUSTOM FONT", command=self.load_font, bg="#222", fg="white").pack(fill=tk.X)

        # 2. DIAGNOSTICS (The "Brain" View)
        self.lbl(main, "2. GEOMETRIC ANALYSIS")
        diag_frame = tk.Frame(main, bg="#111", highlightbackground="#00E676", highlightthickness=1)
        diag_frame.pack(fill=tk.X, pady=5)
        
        self.stat_lbl = tk.Label(diag_frame, text="Waiting for signal...", bg="#111", fg="#00E676", font=("Consolas", 10), justify="left")
        self.stat_lbl.pack(padx=10, pady=10, fill=tk.X)

        # 3. SETTINGS
        self.lbl(main, "3. FABRICATION")
        self.size_scale = self.add_scale(main, "Size (mm)", 150, 50, 400)
        self.depth_scale = self.add_scale(main, "Depth (mm)", 40, 20, 100)
        
        self.cloak_var = tk.BooleanVar(value=True)
        tk.Checkbutton(main, text="APPLY GEOMETRIC CLOAKING", variable=self.cloak_var, bg="#050505", fg="#00E676", selectcolor="#222").pack(anchor="w")

        # PREVIEW
        self.canvas = tk.Canvas(main, bg="black", height=200, highlightthickness=0)
        self.canvas.pack(fill=tk.X, pady=20)

        tk.Button(self.root, text="🚀 OPTIMIZE & MANUFACTURE", command=self.generate, 
                 bg="#00E676", fg="black", font=("Arial", 14, "bold"), height=3).pack(fill=tk.X, padx=40, pady=20)
        
        self.update_analysis()

    def lbl(self, p, t):
        tk.Label(p, text=t, bg="#050505", fg="#03A9F4", font=("Segoe UI", 11, "bold")).pack(anchor="w", pady=(15, 5))

    def add_scale(self, p, label, default, min_v, max_v):
        tk.Label(p, text=label, bg="#050505", fg="white").pack(anchor="w")
        var = tk.DoubleVar(value=default)
        tk.Scale(p, from_=min_v, to=max_v, resolution=5, variable=var, orient=tk.HORIZONTAL, bg="#111", fg="#00E676", highlightthickness=0).pack(fill=tk.X)
        return var

    def load_font(self):
        path = filedialog.askopenfilename(filetypes=[("Fonts", "*.ttf;*.otf")])
        if path:
            self.current_font_path = path
            self.update_analysis()

    def update_analysis(self, event=None):
        text = self.entry.get()
        if not text: return
        self.input_text = text
        
        try:
            # 1. Render & Edge Detect
            res = 400
            img = Image.new("L", (res, res), 0)
            draw = ImageDraw.Draw(img)
            try: font = ImageFont.truetype(self.current_font_path, int(res * 0.7))
            except: font = ImageFont.load_default()
            
            bbox = draw.textbbox((0,0), text, font=font)
            w, h = bbox[2]-bbox[0], bbox[3]-bbox[1]
            draw.text(((res-w)/2, (res-h)/2 - bbox[1]), text, font=font, fill=255)
            
            # Get Contour for Analysis
            edges = img.filter(ImageFilter.FIND_EDGES)
            data = np.array(edges)
            
            points_for_math = []
            self.skin_data = [] # For SCAD
            
            step = 3
            h_pix, w_pix = data.shape
            for y in range(0, h_pix, step):
                for x in range(0, w_pix, step):
                    if data[y, x] > 50:
                        nx = (x - w_pix/2) / (w_pix/2)
                        ny = ((h_pix - y) - h_pix/2) / (h_pix/2)
                        self.skin_data.append(f"[{nx:.3f},{ny:.3f}]")
                        points_for_math.append([nx, ny])

            # 2. RUN SCOTT ENGINE
            sig = self.engine.extract_signature(points_for_math)
            if sig:
                self.shape_class = self.engine.recognize(sig)
                self.shape_metrics = sig
                
                # Update UI
                comp = sig['compactness']
                phi = sig['phi_score']
                status = f"Compactness: {comp:.3f}\nPhi Resonance: {phi:.3f}\n\n>> CLASSIFICATION: {self.shape_class}"
                self.stat_lbl.config(text=status)
            
            # Preview
            disp = edges.resize((200, 200))
            self.preview_ref = ImageTk.PhotoImage(disp)
            self.canvas.delete("all")
            self.canvas.create_image(100, 100, image=self.preview_ref)

        except Exception as e: print(e)

    def generate(self):
        if not self.skin_data: return
        uid = str(uuid.uuid4())[:4]
        safe = "".join(x for x in self.input_text if x.isalnum()) or "Shape"
        
        filename = os.path.join(self.export_dir, f"Cognitive_{safe}_{self.shape_class}_{uid}.scad")
        self.write_scad(filename)
        os.startfile(self.export_dir)

    def write_scad(self, path):
        points = ",".join(self.skin_data)
        size = self.size_scale.get()
        depth = self.depth_scale.get()
        is_cloaked = self.cloak_var.get()
        
        # INTELLIGENT MESH GENERATION
        # If the engine says "PERFECT_CIRCLE", we ignore the pixels and draw a cylinder.
        
        scad = f"""
// ==========================================
//   COGNITIVE FACTORY V29
//   Detected Geometry: {self.shape_class}
//   Cloaking: {"ACTIVE" if is_cloaked else "OFF"}
// ==========================================
$fn = 60;
Sign_Size = {size};
Depth = {depth};
Mode = "preview"; 

Pixels = [{points}];

// --- GEOMETRY ENGINE ---

module reconstructed_shape(expansion) {{
    scale = Sign_Size / 2;
    
    if ("{self.shape_class}" == "PERFECT_CIRCLE") {{
        // SCOTT ENGINE OVERRIDE:
        // Detected a circle. Replacing pixel noise with perfect vector math.
        circle(d = Sign_Size + (expansion*20)); 
    }} 
    else {{
        // STANDARD VOXEL RECONSTRUCTION
        for(p = Pixels) {{
            translate([p[0]*scale, p[1]*scale])
            rotate([0,0, { "rands(0,90,1)[0]" if is_cloaked else "0" }])
            square([scale/60 + expansion, scale/60 + expansion], center=true);
        }}
    }}
}}

// 1. SKIN (Black)
module part_skin() {{
    color("Black")
    linear_extrude(0.6)
    reconstructed_shape(0.2);
}}

// 2. LID (White)
module part_lid() {{
    color("White", 0.5)
    translate([0,0,-1])
    linear_extrude(1)
    if ("{self.shape_class}" != "PERFECT_CIRCLE") offset(r=2) // Only smooth if pixel-based
    reconstructed_shape(1.5);
}}

// 3. BOX
module part_box() {{
    color("#222")
    difference() {{
        translate([0,0,-Depth])
        linear_extrude(Depth)
        if ("{self.shape_class}" != "PERFECT_CIRCLE") offset(r=3)
        reconstructed_shape(1.5);
        
        translate([0,0,-Depth])
        linear_extrude(Depth+1)
        if ("{self.shape_class}" != "PERFECT_CIRCLE") offset(r=-1)
        if ("{self.shape_class}" == "PERFECT_CIRCLE") offset(r=-2) // Wall thickness for circles
        reconstructed_shape(1.5);
        
        // Wire Port
        translate([0, -Sign_Size/2, -Depth/2]) rotate([90,0,0]) cylinder(h=50, d=6);
    }}
}}

if (Mode == "preview") {{
    translate([0,0,0.6]) part_skin();
    translate([0,0,0]) part_lid();
    translate([0,0,0]) part_box();
}}
if (Mode == "skin") part_skin();
if (Mode == "lid") part_lid();
if (Mode == "box") part_box();
"""
        with open(path, "w", encoding="utf-8") as f:
            f.write(scad)

if __name__ == "__main__":
    root = tk.Tk()
    app = CognitiveFactoryApp(root)
    root.mainloop()