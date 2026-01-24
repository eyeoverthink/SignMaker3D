import tkinter as tk
from tkinter import filedialog, messagebox, simpledialog
from PIL import Image, ImageTk, ImageFont, ImageDraw, ImageOps, ImageFilter
import numpy as np
import os
import uuid

# ==========================================
#   BULB ARCHITECT V25: THE VECTOR FACTORY
#   Focus: High-Res Edge Detection & Auto-Plating
# ==========================================

class VectorFactoryApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Sign Factory V25 - Auto-Plate Production")
        self.root.geometry("750x900")
        self.root.configure(bg="#151515")

        self.export_dir = os.path.join(os.path.expanduser("~"), "Desktop", "Sign_Factory_V25")
        if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)

        # DEFAULTS
        self.font_path = "seguiemj.ttf" 
        self.input_text = "👌"
        self.preview_ref = None
        self.skin_data = []  # Solid fill data
        self.edge_data = []  # Outline data
        
        self.setup_ui()

    def setup_ui(self):
        tk.Label(self.root, text="VECTOR FACTORY V25", font=("Impact", 28), bg="#151515", fg="#00E676").pack(pady=20)
        
        main = tk.Frame(self.root, bg="#151515")
        main.pack(fill=tk.BOTH, padx=40)

        # 1. TOOLING
        self.lbl(main, "1. FONT & TEXT")
        btn_frame = tk.Frame(main, bg="#151515")
        btn_frame.pack(fill=tk.X, pady=5)
        tk.Button(btn_frame, text="📂 LOAD FONT", command=self.load_font, bg="#333", fg="white", width=15).pack(side=tk.LEFT)
        self.font_lbl = tk.Label(btn_frame, text="Default: Segoe UI Emoji", bg="#151515", fg="#666")
        self.font_lbl.pack(side=tk.LEFT, padx=10)

        self.entry = tk.Entry(main, font=("Segoe UI Emoji", 24), justify="center", bg="#222", fg="white", insertbackground="white")
        self.entry.insert(0, "👌")
        self.entry.pack(fill=tk.X, pady=10)
        self.entry.bind("<KeyRelease>", self.update_preview)

        # 2. FACTORY SETTINGS
        self.lbl(main, "2. DIMENSIONS")
        self.size_scale = self.add_scale(main, "Sign Size (mm)", 150, 50, 300)
        self.depth_scale = self.add_scale(main, "Box Depth (mm)", 30, 20, 80)
        
        # 3. SKIN LOGIC
        self.lbl(main, "3. SKIN TYPE (Detail Layer)")
        self.skin_mode = tk.StringVar(value="Edge Outline (Smart)")
        tk.Radiobutton(main, text="Edge Outline (Best for Shapes)", variable=self.skin_mode, value="Edge Outline (Smart)", bg="#151515", fg="white", selectcolor="#00E676", command=self.update_preview).pack(anchor="w")
        tk.Radiobutton(main, text="Solid Fill (Blocky)", variable=self.skin_mode, value="Solid Fill", bg="#151515", fg="white", selectcolor="#00E676", command=self.update_preview).pack(anchor="w")

        # PREVIEW
        self.canvas = tk.Canvas(main, bg="black", height=200, highlightthickness=0)
        self.canvas.pack(fill=tk.X, pady=15)

        # GENERATE
        tk.Button(self.root, text="🏭 GENERATE AUTO-PLATE", command=self.generate, 
                 bg="#00E676", fg="black", font=("Arial", 14, "bold"), height=3).pack(fill=tk.X, padx=40, pady=20)
        
        self.update_preview()

    def lbl(self, p, t):
        tk.Label(p, text=t, bg="#151515", fg="#03A9F4", font=("Segoe UI", 11, "bold")).pack(anchor="w", pady=(15, 5))

    def add_scale(self, p, label, default, min_v, max_v):
        tk.Label(p, text=label, bg="#151515", fg="white").pack(anchor="w")
        var = tk.DoubleVar(value=default)
        tk.Scale(p, from_=min_v, to=max_v, resolution=5, variable=var, orient=tk.HORIZONTAL, bg="#222", fg="#00E676", highlightthickness=0).pack(fill=tk.X)
        return var

    def load_font(self):
        path = filedialog.askopenfilename(filetypes=[("Fonts", "*.ttf;*.otf")])
        if path:
            self.font_path = path
            self.font_lbl.config(text=os.path.basename(path))
            self.update_preview()

    def update_preview(self, event=None):
        text = self.entry.get()
        if not text: return
        self.input_text = text
        
        try:
            # High Res Render
            res = 500 
            img = Image.new("L", (res, res), 0) # Black BG
            draw = ImageDraw.Draw(img)
            
            try:
                font = ImageFont.truetype(self.font_path, int(res * 0.7))
            except:
                font = ImageFont.load_default()

            # Draw Centered
            bbox = draw.textbbox((0,0), text, font=font)
            w = bbox[2] - bbox[0]
            h = bbox[3] - bbox[1]
            draw.text(((res-w)/2, (res-h)/2 - bbox[1]), text, font=font, fill=255) # White Text
            
            # --- IMAGE PROCESSING ---
            data = np.array(img)
            self.skin_data = [] # For Solid Fill
            self.edge_data = [] # For Edges
            
            # 1. Edge Detection (The "Inverse Trace")
            if "Edge" in self.skin_mode.get():
                # Apply filter to find edges
                edges = img.filter(ImageFilter.FIND_EDGES)
                # Dilate slightly to make lines printable
                edges = edges.filter(ImageFilter.MaxFilter(3)) 
                edge_data_arr = np.array(edges)
                
                # Scan Edges
                step = 3 # High Res
                h_pix, w_pix = edge_data_arr.shape
                for y in range(0, h_pix, step):
                    for x in range(0, w_pix, step):
                        if edge_data_arr[y, x] > 50: # If pixel is Lit (Edge)
                            nx = (x - w_pix/2) / (w_pix/2)
                            ny = ((h_pix - y) - h_pix/2) / (h_pix/2)
                            self.edge_data.append(f"[{nx:.3f},{ny:.3f}]")
                
                preview_img = edges
                
            else:
                # Solid Fill Logic
                step = 4
                h_pix, w_pix = data.shape
                for y in range(0, h_pix, step):
                    for x in range(0, w_pix, step):
                        if data[y, x] > 100: # If pixel is Lit (Body)
                            nx = (x - w_pix/2) / (w_pix/2)
                            ny = ((h_pix - y) - h_pix/2) / (h_pix/2)
                            self.skin_data.append(f"[{nx:.3f},{ny:.3f}]")
                
                preview_img = img

            # Display
            disp = preview_img.resize((200, 200))
            self.preview_ref = ImageTk.PhotoImage(disp)
            self.canvas.delete("all")
            self.canvas.create_image(100, 100, image=self.preview_ref)
            
        except Exception as e:
            print(e)

    def generate(self):
        uid = str(uuid.uuid4())[:4]
        safe_name = "".join(x for x in self.input_text if x.isalnum()) or "Sign"
        filename = os.path.join(self.export_dir, f"Factory_V25_{safe_name}_{uid}.scad")
        
        # Select data source based on mode
        points = ",".join(self.edge_data if "Edge" in self.skin_mode.get() else self.skin_data)
        
        # THE SCAD GENERATOR
        scad = f"""
// ==========================================
//   BULB ARCHITECT V25: AUTO-PLATE
//   Text: "{self.input_text}"
//   Mode: {self.skin_mode.get()}
// ==========================================
$fn = 40;
Sign_Size = {self.size_scale.get()};
Depth = {self.depth_scale.get()};

// RAW DATA (The "Ink")
Pixel_Cloud = [{points}];

// 1. RECONSTRUCTION ENGINE
module build_layer(thickness, expansion) {{
    scale = Sign_Size / 2;
    // Voxel reconstruction
    for(p = Pixel_Cloud) {{
        translate([p[0]*scale, p[1]*scale, 0])
        // Overlap cubes to form continuous mesh
        cube([scale/150 + expansion, scale/150 + expansion, thickness], center=true);
    }}
}}

// 2. THE PARTS

module part_skin() {{
    color("Black")
    // This is the Detail Layer
    linear_extrude(0.6)
    build_layer(1.0, 0.4); 
}}

module part_diffuser() {{
    color("White", 0.5)
    // We hull the pixel cloud to create the solid shape
    linear_extrude(1.0)
    offset(r=1.5) hull() projection() 
    build_layer(1.0, 1.0);
}}

module part_housing() {{
    color("#222")
    difference() {{
        // Outer Wall
        translate([0,0,-Depth])
        linear_extrude(Depth)
        offset(r=2) hull() projection() build_layer(1.0, 1.5);
        
        // Inner Hollow
        translate([0,0,-Depth])
        linear_extrude(Depth+1)
        offset(r=-1.5) hull() projection() build_layer(1.0, 1.5);
        
        // Wire Port
        translate([0, -Sign_Size/2, -Depth/2]) rotate([90,0,0]) cylinder(h=50, d=6);
    }}
}}

// 3. AUTO-PLATE LAYOUT
// Lays out all parts ready to slice

translate([-Sign_Size/1.5, 0, 0]) part_housing();
translate([Sign_Size/1.5, 0, 0]) part_diffuser();
translate([Sign_Size/1.5, Sign_Size/1.2, 0]) part_skin();

// Text Label
color("White") translate([0, -Sign_Size/1.5, 0]) 
    text("Print Plate: Housing | Diffuser | Skin", size=Sign_Size/10, halign="center");
"""
        with open(filename, "w", encoding="utf-8") as f:
            f.write(scad)
        os.startfile(self.export_dir)

if __name__ == "__main__":
    root = tk.Tk()
    app = VectorFactoryApp(root)
    root.mainloop()