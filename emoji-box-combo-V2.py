import tkinter as tk
from tkinter import filedialog, messagebox, simpledialog
from PIL import Image, ImageTk, ImageFont, ImageDraw, ImageOps
import numpy as np
import os
import uuid

# ==========================================
#   BULB ARCHITECT V24: THE SIGN FACTORY
#   Capabilities: Custom Fonts (.ttf/.otf), Cut-and-Paste Input
#   Output: Structural Box + Diffuser + Detail Skin
# ==========================================

class SignFactoryApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Sign Factory V24 - The Production Line")
        self.root.geometry("700x850")
        self.root.configure(bg="#1e1e1e")

        self.export_dir = os.path.join(os.path.expanduser("~"), "Desktop", "Sign_Factory_Output")
        if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)

        # DEFAULTS
        self.current_font_path = "seguiemj.ttf" # Default Windows Emoji
        self.input_text = "👌"
        self.preview_img = None
        self.skin_data = []
        
        self.setup_ui()

    def setup_ui(self):
        # HEADER
        tk.Label(self.root, text="THE SIGN FACTORY", font=("Impact", 28), bg="#1e1e1e", fg="#00E676").pack(pady=20)
        
        main = tk.Frame(self.root, bg="#1e1e1e")
        main.pack(fill=tk.BOTH, padx=40)

        # 1. THE FONT LOADER
        self.lbl(main, "1. TOOLING (Load Font)")
        btn_frame = tk.Frame(main, bg="#1e1e1e")
        btn_frame.pack(fill=tk.X, pady=5)
        
        tk.Button(btn_frame, text="📂 LOAD .TTF / .OTF", command=self.load_font, 
                 bg="#2196F3", fg="white", font=("Arial", 11, "bold"), height=2).pack(side=tk.LEFT, fill=tk.X, expand=True, padx=5)
        
        self.font_label = tk.Label(main, text=f"Active: {os.path.basename(self.current_font_path)}", bg="#1e1e1e", fg="#888")
        self.font_label.pack(anchor="w", padx=5)

        # 2. THE INPUT (Cut & Paste)
        self.lbl(main, "2. RAW MATERIAL (Text/Emoji)")
        self.entry = tk.Entry(main, font=("Segoe UI Emoji", 24), justify="center", bg="#333", fg="white", insertbackground="white")
        self.entry.insert(0, "👌")
        self.entry.pack(fill=tk.X, pady=5)
        self.entry.bind("<KeyRelease>", self.update_preview)

        # 3. SETTINGS
        self.lbl(main, "3. SPECIFICATIONS")
        self.size_scale = self.add_scale(main, "Sign Height (mm)", 150, 50, 400)
        self.depth_scale = self.add_scale(main, "Box Depth (mm)", 40, 20, 100)

        # PREVIEW WINDOW
        self.canvas = tk.Canvas(main, bg="black", height=200, highlightthickness=0)
        self.canvas.pack(fill=tk.X, pady=20)

        # MANUFACTURE BUTTON
        tk.Button(self.root, text="🏭 MANUFACTURE ALL PARTS", command=self.generate, 
                 bg="#00E676", fg="black", font=("Arial", 14, "bold"), height=3).pack(fill=tk.X, padx=40, pady=20)

        # Initialize
        self.update_preview()

    def lbl(self, p, t):
        tk.Label(p, text=t, bg="#1e1e1e", fg="#03A9F4", font=("Segoe UI", 11, "bold")).pack(anchor="w", pady=(20, 5))

    def add_scale(self, p, label, default, min_v, max_v):
        tk.Label(p, text=label, bg="#1e1e1e", fg="white").pack(anchor="w")
        var = tk.DoubleVar(value=default)
        tk.Scale(p, from_=min_v, to=max_v, resolution=5, variable=var, orient=tk.HORIZONTAL, bg="#333", fg="#00E676", highlightthickness=0).pack(fill=tk.X)
        return var

    def load_font(self):
        path = filedialog.askopenfilename(filetypes=[("Font Files", "*.ttf;*.otf")])
        if path:
            self.current_font_path = path
            self.font_label.config(text=f"Active: {os.path.basename(path)}")
            self.update_preview()

    def update_preview(self, event=None):
        text = self.entry.get()
        if not text: return
        self.input_text = text
        
        try:
            # 1. Render High-Res Image
            res = 400
            img = Image.new("L", (res, res), 255) # White BG
            draw = ImageDraw.Draw(img)
            
            try:
                font = ImageFont.truetype(self.current_font_path, int(res * 0.7))
            except:
                font = ImageFont.load_default()

            # Center Text
            bbox = draw.textbbox((0,0), text, font=font)
            w = bbox[2] - bbox[0]
            h = bbox[3] - bbox[1]
            draw.text(((res-w)/2, (res-h)/2 - bbox[1]), text, font=font, fill=0) # Black Text
            
            # 2. Extract Data (The "Factory Logic")
            data = np.array(img)
            self.skin_data = []
            step = 4
            h_pix, w_pix = data.shape
            
            for y in range(0, h_pix, step):
                for x in range(0, w_pix, step):
                    # Inverted Logic: Dark pixels are STRUCTURE/SKIN
                    if data[y, x] < 150: 
                        norm_x = (x - w_pix/2) / (w_pix/2)
                        norm_y = ((h_pix - y) - h_pix/2) / (h_pix/2)
                        self.skin_data.append(f"[{norm_x:.3f},{norm_y:.3f}]")

            # 3. Show Preview
            disp_img = ImageOps.invert(img).resize((200, 200)) # Show negative for cool factor
            self.preview_img = ImageTk.PhotoImage(disp_img)
            self.canvas.delete("all")
            self.canvas.create_image(100, 100, image=self.preview_img)
            self.canvas.create_text(100, 180, text=f"{len(self.skin_data)} Vector Points Detected", fill="#00E676")
            
        except Exception as e:
            print(e)

    def generate(self):
        if not self.skin_data: return
        uid = str(uuid.uuid4())[:4]
        safe_name = "".join(x for x in self.input_text if x.isalnum()) or "Emoji"
        
        filename = os.path.join(self.export_dir, f"Factory_{safe_name}_{uid}.scad")
        
        # Write SCAD
        self.write_scad(filename)
        os.startfile(self.export_dir)

    def write_scad(self, path):
        points = ",".join(self.skin_data)
        size = self.size_scale.get()
        depth = self.depth_scale.get()
        
        scad = f"""
// ==========================================
//   SIGN FACTORY V24 OUTPUT
//   Content: "{self.input_text}"
//   Font: {os.path.basename(self.current_font_path)}
// ==========================================

$fn = 40;
Sign_Size = {size};
Depth = {depth};
Mode = "preview"; // Set to "box", "lid", or "skin" to export

// THE DNA (Extracted Data)
Pixels = [{points}];

module draw_shape(expansion) {{
    scale = Sign_Size / 2;
    // Reconstruction Loop
    for(p = Pixels) {{
        translate([p[0]*scale, p[1]*scale, 0])
        cube([scale/40 + expansion, scale/40 + expansion, 1], center=true);
    }}
}}

// 1. THE SKIN (Detail Layer - Black)
module part_skin() {{
    color("Black")
    linear_extrude(0.6)
    draw_shape(0.2);
}}

// 2. THE LID (Diffuser - White)
module part_lid() {{
    color("White", 0.5)
    translate([0,0,-1])
    linear_extrude(1)
    offset(r=2) hull() projection() 
    linear_extrude(1) draw_shape(1.5);
}}

// 3. THE BOX (Housing - Any Color)
module part_box() {{
    color("#333")
    difference() {{
        // Outer Shell
        translate([0,0,-Depth])
        linear_extrude(Depth)
        offset(r=2) hull() projection() linear_extrude(1) draw_shape(1.5);
        
        // Inner Cavity
        translate([0,0,-Depth])
        linear_extrude(Depth+1)
        offset(r=-2) hull() projection() linear_extrude(1) draw_shape(1.5);
        
        // Wire Hole
        translate([0, -Sign_Size/2, -Depth/2]) rotate([90,0,0]) cylinder(h=50, d=6);
    }}
}}

// RENDER LOGIC
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
    app = SignFactoryApp(root)
    root.mainloop()