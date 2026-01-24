import tkinter as tk
from tkinter import filedialog, messagebox, ttk
from PIL import Image, ImageTk, ImageOps, ImageFilter, ImageEnhance, ImageGrab, ImageDraw, ImageFont
import webbrowser
import os
import platform
import subprocess

# ==========================================
#   SIGN SCULPTOR V3: CLIPBOARD PROTOCOL
#   Logic: Direct Paste + OpenSCAD Optimization
# ==========================================

class SignSculptorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Sign Sculptor V3 - The Clipboard Protocol")
        self.root.geometry("1100x850")
        self.root.configure(bg="#2c3e50")

        self.original_image = None
        self.processed_image = None
        self.preview_mode = "Map"
        
        # Auto-detect Desktop
        desktop = os.path.join(os.path.expanduser("~"), "Desktop")
        self.export_dir = os.path.join(desktop, "SignSculptor_Exports")
        if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)

        self.setup_ui()

    def setup_ui(self):
        # --- Main Layout ---
        main_split = tk.PanedWindow(self.root, bg="#2c3e50", orient=tk.HORIZONTAL)
        main_split.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        controls = tk.Frame(main_split, bg="#34495e", width=350)
        main_split.add(controls, padx=5, pady=5)

        preview = tk.Frame(main_split, bg="black", bd=2, relief=tk.SUNKEN)
        main_split.add(preview, padx=5, pady=5)

        # === 1. INPUT SOURCES (The New Logic) ===
        tk.Label(controls, text="1. INPUT SOURCE", font=("Segoe UI", 10, "bold"), bg="#34495e", fg="#3498db").pack(anchor="w", pady=(10,5), padx=10)
        
        # A. Website Link
        tk.Button(controls, text="🌐 Open EmojiCopy.com", command=lambda: webbrowser.open("https://emojicopy.com/"), bg="#e67e22", fg="white").pack(fill=tk.X, padx=10, pady=2)

        # B. Direct Text Paste
        paste_frame = tk.Frame(controls, bg="#34495e")
        paste_frame.pack(fill=tk.X, padx=10, pady=5)
        
        tk.Label(paste_frame, text="Paste Emoji Here:", bg="#34495e", fg="#ecf0f1", font=("Arial", 9)).pack(anchor="w")
        
        self.emoji_entry = tk.Entry(paste_frame, font=("Segoe UI Emoji", 14), justify="center")
        self.emoji_entry.pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        tk.Button(paste_frame, text="Render", command=self.render_from_text, bg="#27ae60", fg="white", font=("Arial", 9, "bold")).pack(side=tk.RIGHT, padx=(5,0))

        # C. Clipboard Buttons
        btn_grid = tk.Frame(controls, bg="#34495e")
        btn_grid.pack(fill=tk.X, padx=10, pady=5)
        
        tk.Button(btn_grid, text="📋 Paste Image", command=self.paste_from_clipboard, bg="#8e44ad", fg="white").pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0,2))
        tk.Button(btn_grid, text="📂 Upload File", command=self.upload_image, bg="#2980b9", fg="white").pack(side=tk.RIGHT, fill=tk.X, expand=True, padx=(2,0))

        # === 2. DIFFUSION LOGIC ===
        tk.Label(controls, text="2. RELIEF ENGINE", font=("Segoe UI", 10, "bold"), bg="#34495e", fg="#3498db").pack(anchor="w", pady=(20,5), padx=10)

        # Smoothing
        tk.Label(controls, text="Smoothing (Remove Noise):", bg="#34495e", fg="white").pack(anchor="w", padx=10)
        self.blur_slider = tk.Scale(controls, from_=0, to=10, orient=tk.HORIZONTAL, bg="#34495e", fg="white", highlightthickness=0, command=self.update_preview)
        self.blur_slider.set(1)
        self.blur_slider.pack(fill=tk.X, padx=10)

        # Signal Boost
        tk.Label(controls, text="Signal Boost (Deepen Cuts):", bg="#34495e", fg="white").pack(anchor="w", padx=10)
        self.contrast_slider = tk.Scale(controls, from_=1.0, to=5.0, resolution=0.1, orient=tk.HORIZONTAL, bg="#34495e", fg="white", highlightthickness=0, command=self.update_preview)
        self.contrast_slider.set(2.0)
        self.contrast_slider.pack(fill=tk.X, padx=10)

        # Relief Depth
        tk.Label(controls, text="Physical Depth (mm):", bg="#34495e", fg="white").pack(anchor="w", padx=10)
        self.depth_slider = tk.Scale(controls, from_=0.5, to=5.0, resolution=0.1, orient=tk.HORIZONTAL, bg="#34495e", fg="white", highlightthickness=0)
        self.depth_slider.set(2.5)
        self.depth_slider.pack(fill=tk.X, padx=10)

        # === 3. EXPORT ===
        tk.Button(controls, text="⚡ GENERATE FILES", command=self.generate_files, bg="#c0392b", fg="white", font=("Segoe UI", 12, "bold"), height=2).pack(side=tk.BOTTOM, fill=tk.X, padx=10, pady=20)

        # Preview Area
        self.preview_label = tk.Label(preview, bg="black", text="Paste an Emoji or Image to Begin", fg="gray")
        self.preview_label.place(relx=0.5, rely=0.5, anchor="center")
        
        self.view_btn = tk.Button(preview, text="👁 Toggle View", command=self.toggle_view, bg="gray", fg="white")
        self.view_btn.place(relx=0.95, rely=0.95, anchor="se")

    # ================= INPUT HANDLERS =================

    def render_from_text(self):
        char = self.emoji_entry.get()
        if not char: return
        
        # Create a blank image
        size = 500
        img = Image.new("RGBA", (size, size), (255, 255, 255, 0)) # Transparent
        draw = ImageDraw.Draw(img)
        
        # Load Emoji Font (Windows Standard)
        try:
            font = ImageFont.truetype("seguiemj.ttf", 400) # Segoe UI Emoji
        except:
            try:
                font = ImageFont.truetype("arial.ttf", 400) # Fallback
            except:
                font = ImageFont.load_default()

        # Center Text
        # Using simple math for robustness
        # anchor="mm" centers the text horizontally and vertically
        draw.text((size/2, size/2), char, font=font, anchor="mm", fill="black")
        
        # Convert to white background RGB
        bg = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == 'RGBA':
             # Use alpha channel as mask for pasting
             bg.paste(img, mask=img.split()[3]) 
        else:
             bg.paste(img)
        
        self.original_image = bg
        self.base_name = f"Emoji_{ord(char[0])}"
        self.update_preview()

    def paste_from_clipboard(self):
        try:
            img = ImageGrab.grabclipboard()
            if img:
                self.original_image = img.convert("RGB")
                self.base_name = "Clipboard_Paste"
                self.update_preview()
            else:
                messagebox.showinfo("Clipboard", "No image found in clipboard.")
        except Exception as e:
            messagebox.showerror("Error", str(e))

    def upload_image(self):
        path = filedialog.askopenfilename(filetypes=[("Images", "*.png;*.jpg;*.jpeg;*.webp")])
        if path:
            self.base_name = os.path.splitext(os.path.basename(path))[0]
            self.original_image = Image.open(path).convert("RGB")
            self.update_preview()

    # ================= PROCESSING LOGIC =================

    def update_preview(self, event=None):
        if self.original_image is None: return

        # 1. Processing Pipeline
        img = self.original_image.convert("L") # Grayscale
        
        # Signal Boost (Contrast)
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(self.contrast_slider.get())
        
        # Smoothing
        if self.blur_slider.get() > 0:
            img = img.filter(ImageFilter.GaussianBlur(self.blur_slider.get()))
            
        # Invert (Dark = Thick Plastic)
        self.processed_image = ImageOps.invert(img)

        # 2. Display
        to_show = self.processed_image if self.preview_mode == "Map" else self.original_image
        
        # Resize for GUI
        w, h = to_show.size
        aspect = w/h
        disp_h = 600
        disp_w = int(disp_h * aspect)
        
        resized = to_show.resize((disp_w, disp_h), Image.Resampling.LANCZOS)
        photo = ImageTk.PhotoImage(resized)
        
        self.preview_label.config(image=photo, text="")
        self.preview_label.image = photo

    def toggle_view(self):
        self.preview_mode = "Original" if self.preview_mode == "Map" else "Map"
        self.update_preview()

    def generate_files(self):
        if self.processed_image is None: return

        # OPTIMIZATION: Resize Map to 500px max
        # This fixes the OpenSCAD "Node didn't fit into cache" warning
        optimized_map = self.processed_image.copy()
        optimized_map.thumbnail((500, 500), Image.Resampling.LANCZOS)

        map_filename = f"{self.base_name}_HeightMap.png"
        map_path = os.path.join(self.export_dir, map_filename)
        optimized_map.save(map_path)

        scad_filename = f"{self.base_name}_Relief.scad"
        scad_path = os.path.join(self.export_dir, scad_filename)
        
        # Dynamic SCAD generation
        scad_code = self.get_scad_template(map_filename, 100, self.depth_slider.get())
        
        with open(scad_path, "w") as f:
            f.write(scad_code)

        if messagebox.askyesno("Success", "Files Generated! Open Output Folder?"):
            self.open_folder()

    def get_scad_template(self, map_file, size, depth):
        return f"""
// SCOTT PROTOCOL: MULTI-TILT DIFFUSION
// Optimized for OpenSCAD Caching

Height_Map = "{map_file}";
Size = {size};
Depth = {depth};

$fn=80; // Reduced from 100 for faster preview

// The Diffuser Lid
union() {{
    // 1. Snap-Fit Rim
    difference() {{
        cylinder(h=4, d=Size);
        translate([0,0,-1]) cylinder(h=6, d=Size-2);
    }}
    
    // 2. The Relief Surface
    translate([0,0,2])
    intersection() {{
        cylinder(h=Depth+1, d=Size-1);
        
        translate([0,0,0])
        resize([Size, Size, Depth])
        surface(file=Height_Map, center=true, invert=false);
    }}
}}
"""

    def open_folder(self):
        if platform.system() == "Windows": os.startfile(self.export_dir)
        elif platform.system() == "Darwin": subprocess.Popen(["open", self.export_dir])
        else: subprocess.Popen(["xdg-open", self.export_dir])

if __name__ == "__main__":
    root = tk.Tk()
    app = SignSculptorApp(root)
    root.mainloop()