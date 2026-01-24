import tkinter as tk
from tkinter import filedialog, messagebox, ttk
from PIL import Image, ImageTk, ImageOps, ImageFilter
import webbrowser
import os
import requests
from io import BytesIO

# ==========================================
#   SIGN SCULPTOR STUDIO: RELIEF ENGINE
# ==========================================

class SignSculptorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Sign Sculptor Studio - Relief Engine")
        self.root.geometry("900x700")
        self.root.configure(bg="#2c3e50")

        # Configuration
        self.current_image = None
        self.processed_image = None
        self.export_dir = "Rendered_Signs"
        
        if not os.path.exists(self.export_dir):
            os.makedirs(self.export_dir)

        self.setup_ui()

    def setup_ui(self):
        # --- Header ---
        header_frame = tk.Frame(self.root, bg="#34495e", pady=10)
        header_frame.pack(fill=tk.X)
        
        title = tk.Label(header_frame, text="SIGN SCULPTOR STUDIO", font=("Arial", 18, "bold"), bg="#34495e", fg="white")
        title.pack()
        
        subtitle = tk.Label(header_frame, text="Multi-Tilt Diffusion System", font=("Arial", 10, "italic"), bg="#34495e", fg="#ecf0f1")
        subtitle.pack()

        # --- Main Content ---
        main_frame = tk.Frame(self.root, bg="#2c3e50")
        main_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)

        # Left Side (Controls)
        controls_frame = tk.Frame(main_frame, bg="#2c3e50", width=300)
        controls_frame.pack(side=tk.LEFT, fill=tk.Y, padx=10)

        # 1. Source Buttons
        tk.Label(controls_frame, text="1. Source Material", font=("Arial", 12, "bold"), bg="#2c3e50", fg="#3498db").pack(anchor="w", pady=(0,5))
        
        btn_browser = tk.Button(controls_frame, text="🌐 Open EmojiCopy.com", command=self.open_browser, bg="#e67e22", fg="white", font=("Arial", 10, "bold"), width=25)
        btn_browser.pack(pady=5)

        btn_upload = tk.Button(controls_frame, text="📂 Upload Image/Emoji", command=self.upload_image, bg="#2980b9", fg="white", font=("Arial", 10, "bold"), width=25)
        btn_upload.pack(pady=5)

        # 2. The "Trace Layer" Settings
        tk.Label(controls_frame, text="2. Diffusion Layer Logic", font=("Arial", 12, "bold"), bg="#2c3e50", fg="#3498db").pack(anchor="w", pady=(20,5))
        
        tk.Label(controls_frame, text="Relief Depth (Contrast):", bg="#2c3e50", fg="white").pack(anchor="w")
        self.depth_slider = tk.Scale(controls_frame, from_=0.5, to=4.0, resolution=0.1, orient=tk.HORIZONTAL, bg="#2c3e50", fg="white", highlightthickness=0)
        self.depth_slider.set(2.0)
        self.depth_slider.pack(fill=tk.X)

        tk.Label(controls_frame, text="Smoothing (Blur):", bg="#2c3e50", fg="white").pack(anchor="w")
        self.blur_slider = tk.Scale(controls_frame, from_=0, to=5, orient=tk.HORIZONTAL, bg="#2c3e50", fg="white", highlightthickness=0)
        self.blur_slider.set(1)
        self.blur_slider.pack(fill=tk.X)

        # 3. Engineering Settings
        tk.Label(controls_frame, text="3. Engineering Specs", font=("Arial", 12, "bold"), bg="#2c3e50", fg="#3498db").pack(anchor="w", pady=(20,5))
        
        tk.Label(controls_frame, text="Sign Height (mm):", bg="#2c3e50", fg="white").pack(anchor="w")
        self.height_entry = tk.Entry(controls_frame)
        self.height_entry.insert(0, "100")
        self.height_entry.pack(fill=tk.X)

        tk.Label(controls_frame, text="LED Channel Width (mm):", bg="#2c3e50", fg="white").pack(anchor="w")
        self.channel_var = tk.StringVar(value="6")
        channel_menu = ttk.Combobox(controls_frame, textvariable=self.channel_var, values=["6", "8", "10", "12"])
        channel_menu.pack(fill=tk.X)

        # 4. Generate
        btn_generate = tk.Button(controls_frame, text="⚡ GENERATE SCAD + MAP", command=self.generate_files, bg="#27ae60", fg="white", font=("Arial", 12, "bold"), height=2)
        btn_generate.pack(side=tk.BOTTOM, fill=tk.X, pady=20)

        # Right Side (Preview)
        self.preview_frame = tk.Frame(main_frame, bg="black", bd=2, relief=tk.SUNKEN)
        self.preview_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=10)
        
        self.image_label = tk.Label(self.preview_frame, bg="black", text="No Image Loaded\nPaste an Emoji or Upload", fg="gray")
        self.image_label.place(relx=0.5, rely=0.5, anchor="center")

    # ================= LOGIC ENGINE =================

    def open_browser(self):
        webbrowser.open("https://emojicopy.com/")

    def upload_image(self):
        file_path = filedialog.askopenfilename(filetypes=[("Images", "*.png;*.jpg;*.jpeg;*.webp")])
        if file_path:
            self.process_image(file_path)

    def process_image(self, path):
        try:
            img = Image.open(path).convert("RGBA")
            
            # Create a white background for transparent emojis
            background = Image.new("RGBA", img.size, (255, 255, 255, 255))
            combined = Image.alpha_composite(background, img).convert("L") # Convert to Grayscale
            
            self.current_image = combined
            
            # Show Preview
            display_img = combined.resize((400, 400), Image.Resampling.LANCZOS)
            photo = ImageTk.PhotoImage(display_img)
            self.image_label.config(image=photo, text="")
            self.image_label.image = photo
            
        except Exception as e:
            messagebox.showerror("Error", f"Could not load image: {str(e)}")

    def generate_files(self):
        if self.current_image is None:
            messagebox.showwarning("Missing Input", "Please upload an image or emoji first.")
            return

        name = "Custom_Sign"
        
        # 1. Create the Height Map (The Trace Layer)
        # We invert colors so Dark (Eyes) = Higher/Thicker, Light (Face) = Lower/Thinner
        # Or vice versa depending on Lithophane logic. Usually Dark = Thicker (blocks light).
        blur_val = self.blur_slider.get()
        height_map = self.current_image.copy()
        
        if blur_val > 0:
            height_map = height_map.filter(ImageFilter.GaussianBlur(blur_val))
            
        height_map = ImageOps.invert(height_map) # Invert for Lithophane logic
        
        map_filename = f"{name}_HeightMap.png"
        map_path = os.path.join(self.export_dir, map_filename)
        height_map.save(map_path)

        # 2. Generate the SCAD
        scad_filename = f"{name}_Relief.scad"
        scad_path = os.path.join(self.export_dir, scad_filename)
        
        sign_size = float(self.height_entry.get())
        relief_depth = self.depth_slider.get()
        channel_w = float(self.channel_var.get())

        scad_code = self.get_scad_template(map_filename, sign_size, relief_depth, channel_w)
        
        with open(scad_path, "w") as f:
            f.write(scad_code)

        messagebox.showinfo("Success", f"Files Generated in '{self.export_dir}':\n1. {scad_filename}\n2. {map_filename}\n\nOpen the SCAD file to see the Multi-Tilt Diffusion!")

    def get_scad_template(self, map_file, size, depth, cw):
        return f"""
// ==========================================
//   MULTI-TILT DIFFUSION SIGN ENGINE
// ==========================================

// [USER SETTINGS]
Height_Map_File = "{map_file}";
Sign_Size = {size};
Relief_Depth = {depth}; // The "Thin Trace" intensity
Channel_Width = {cw};

// [RENDERING LOGIC]
$fn = 100;

module base_shape() {{
    // Creates a basic cylinder shape scaled to the image
    // In a V2, we would trace the exact outline, but for now we use a puck
    cylinder(h=30, d=Sign_Size);
}}

module diffusion_layer() {{
    // This is the GAME KILLER
    // It reads the PNG pixel data and converts it into physical geometry
    translate([0, 0, 28]) // Move to top of sign
    intersection() {{
        // Crop the map to the sign shape
        cylinder(h=10, d=Sign_Size - 2);
        
        // The Surface Map
        translate([0, 0, 0])
        resize([Sign_Size, Sign_Size, Relief_Depth])
        surface(file = Height_Map_File, center = true, invert = false);
    }}
}}

module main_body() {{
    difference() {{
        // Outer Shell
        cylinder(h=30, d=Sign_Size + 4);
        
        // Inner Light Channel
        translate([0,0,2])
        cylinder(h=31, d=Sign_Size - Channel_Width);
    }}
}}

// --- ASSEMBLY ---

// 1. The Main Housing (Black PLA)
translate([-Sign_Size*0.6, 0, 0]) {{
    color("Black") main_body();
    // Add Friction Lip
    translate([0,0,28])
    difference() {{
        cylinder(h=2, d=Sign_Size);
        cylinder(h=3, d=Sign_Size - 2);
    }}
}}

// 2. The Multi-Tilt Diffuser (White PLA)
translate([Sign_Size*0.6, 0, 0]) {{
    color("White") 
    union() {{
        // Base Diffuser Plate
        cylinder(h=1, d=Sign_Size - 0.5);
        
        // The "Thin Trace" Image Layer
        diffusion_layer();
    }}
}}
"""

if __name__ == "__main__":
    root = tk.Tk()
    app = SignSculptorApp(root)
    root.mainloop()