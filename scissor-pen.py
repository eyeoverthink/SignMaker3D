import tkinter as tk
from tkinter import filedialog, messagebox
from PIL import Image, ImageTk
import cv2
import numpy as np
import os

# ==========================================
# SCOTT ENGINE V4.0: SCISSORS + PEN + DIFFUSER
# Logic: Masking -> Hybrid Detail -> 3D Channel Generation
# ==========================================

class ScottApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Scott Engine V4.0 - The Complete Manifest")
        self.root.geometry("1300x750")
        self.root.configure(bg='#1E1E1E') # Darker "Pro" theme

        # Logic State
        self.cv_image = None
        self.mask = None
        self.final_contours = []
        
        self._setup_gui()

    def _setup_gui(self):
        # --- Control Panel ---
        control_frame = tk.Frame(self.root, bg='#333333', pady=15, padx=15)
        control_frame.pack(fill=tk.X)

        # Style Config
        btn_base = {'font': ('Segoe UI', 11, 'bold'), 'padx': 15, 'pady': 8, 'bd': 0}
        
        # 1. LOAD
        tk.Button(control_frame, text="1. Load Image", command=self.load_image, 
                 bg='#505050', fg='white', **btn_base).pack(side=tk.LEFT, padx=5)

        # 2. SCISSORS (The Mask)
        tk.Button(control_frame, text="2. Run Scissors (Mask)", command=self.run_scissors, 
                 bg='#FFA500', fg='black', **btn_base).pack(side=tk.LEFT, padx=5)

        # 3. PEN (The Detail)
        tk.Button(control_frame, text="3. Run Pen (Hybrid Detail)", command=self.run_pen, 
                 bg='#00BFFF', fg='black', **btn_base).pack(side=tk.LEFT, padx=5)

        # 4. MANIFEST (The Output)
        tk.Button(control_frame, text="4. Export SCAD", command=self.save_scad, 
                 bg='#32CD32', fg='black', **btn_base).pack(side=tk.RIGHT, padx=5)

        # Diffuser Toggle
        self.diffuser_var = tk.BooleanVar()
        tk.Checkbutton(control_frame, text="Generate Diffuser Lid?", variable=self.diffuser_var, 
                      bg='#333333', fg='white', selectcolor='#444444', font=('Segoe UI', 10),
                      activebackground='#333333', activeforeground='white').pack(side=tk.RIGHT, padx=15)

        # --- Display Area ---
        display_frame = tk.Frame(self.root, bg='#1E1E1E')
        display_frame.pack(fill=tk.BOTH, expand=True, pady=10)

        # Left (Input)
        self.panel_left = tk.Label(display_frame, bg='black')
        self.panel_left.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=10)
        
        # Right (Output)
        self.panel_right = tk.Label(display_frame, bg='black')
        self.panel_right.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=10)

    # ================= LOGIC ENGINE =================

    def load_image(self):
        path = filedialog.askopenfilename(filetypes=[("Images", "*.jpg *.png *.jpeg *.bmp")])
        if not path: return
        
        self.cv_image = cv2.imread(path)
        self.mask = None # Reset mask
        self._show(self.cv_image, self.panel_left)
        self._show(np.zeros_like(self.cv_image), self.panel_right) # Clear right

    def run_scissors(self):
        """STEP 1: The 'Kid Cut' (Isolation Logic)"""
        if self.cv_image is None: return

        # Heavy Blur to ignore details, finding only the main "Blob"
        gray = cv2.cvtColor(self.cv_image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (35, 35), 0)
        _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

        # Find Largest Contour
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours: return
        
        largest = max(contours, key=cv2.contourArea)
        
        # Draw the Mask
        self.mask = np.zeros_like(gray)
        cv2.drawContours(self.mask, [largest], -1, (255), thickness=cv2.FILLED)
        
        # Show Mask
        self._show(self.mask, self.panel_right)

    def run_pen(self):
        """STEP 2: The 'Hybrid Pen' (Detail Logic)"""
        if self.cv_image is None: return
        if self.mask is None:
            messagebox.showwarning("Logic Error", "Run 'Scissors' first to define the boundary!")
            return

        gray = cv2.cvtColor(self.cv_image, cv2.COLOR_BGR2GRAY)

        # A. Signal Boost (CLAHE)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        
        # B. Hybrid Mix
        # 1. Canny (Structure)
        edges = cv2.Canny(enhanced, 30, 100)
        # 2. Adaptive (Texture)
        thresh = cv2.adaptiveThreshold(enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2)
        # 3. Mix
        hybrid = cv2.bitwise_or(edges, thresh)

        # C. The "Scissors" Cut (Masking)
        # We delete everything outside the main body
        masked_details = cv2.bitwise_and(hybrid, hybrid, mask=self.mask)

        # D. Manifestation (Thickening)
        kernel = np.ones((2,2), np.uint8)
        thickened = cv2.dilate(masked_details, kernel, iterations=1)
        closed = cv2.morphologyEx(thickened, cv2.MORPH_CLOSE, kernel)

        # E. Geodesic Distillation
        contours, _ = cv2.findContours(closed, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        self.final_contours = []
        
        # Visualization Canvas
        vis = np.ones_like(self.cv_image) * 255 

        for cnt in contours:
            if cv2.contourArea(cnt) > 20: # Filter dust
                epsilon = 0.001 * cv2.arcLength(cnt, True)
                approx = cv2.approxPolyDP(cnt, epsilon, True)
                self.final_contours.append(approx)
                cv2.drawContours(vis, [approx], -1, (0,0,0), 2)

        self._show(vis, self.panel_right)

    def save_scad(self):
        """STEP 3: The Diffuser (Physical Manifest)"""
        if not self.final_contours: return
        
        path = filedialog.asksaveasfilename(defaultextension=".scad", filetypes=[("OpenSCAD", "*.scad")])
        if not path: return

        # Align center
        all_pts = [p for cnt in self.final_contours for p in cnt]
        xs = [p[0][0] for p in all_pts]
        ys = [-p[0][1] for p in all_pts] # Flip Y for CAD
        cx, cy = (min(xs)+max(xs))/2, (min(ys)+max(ys))/2

        # SCAD Header
        scad = f"""// SCOTT ENGINE V4.0 MANIFEST
$fn=40;
module geometry() {{
    translate([{-cx}, {-cy}, 0]) {{
"""
        # Vector Injection
        for cnt in self.final_contours:
            pts_str = str([[p[0][0], -p[0][1]] for p in cnt]).replace("'", "")
            scad += f"        polygon(points={pts_str});\n"
        
        scad += "    }\n}\n\n"

        # --- THE DIFFUSER LOGIC ---
        if self.diffuser_var.get():
            # LID MODE (The Diffuser)
            # Thin, offset slightly smaller to snap-fit inside
            scad += """// DIFFUSER LID MANIFEST
color("white") 
linear_extrude(2) 
    offset(r=-0.15) // Tolerance Gap
    geometry();
"""
        else:
            # BODY MODE (The Channel)
            # Extruded walls with hollow channels for LED/Structure
            scad += """// BODY MANIFEST
difference() {
    // 1. Outer Wall
    linear_extrude(30) 
        offset(r=2) // Wall Thickness
        geometry();

    // 2. The Channel (Hollow)
    translate([0,0,2]) // Base thickness
    linear_extrude(30) 
        offset(r=0) // Exact line width
        geometry();
}
"""

        with open(path, "w") as f:
            f.write(scad)
        messagebox.showinfo("Success", f"Manifest saved to: {os.path.basename(path)}")

    # --- Utils ---
    def _show(self, img, label):
        # Resize/Convert for TKinter
        h, w = img.shape[:2]
        display_w, display_h = 600, 600
        scale = min(display_w/w, display_h/h)
        new_w, new_h = int(w*scale), int(h*scale)
        
        if len(img.shape) == 2: img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
        else: img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        resized = cv2.resize(img, (new_w, new_h))
        tk_img = ImageTk.PhotoImage(Image.fromarray(resized))
        label.config(image=tk_img)
        label.image = tk_img

if __name__ == "__main__":
    root = tk.Tk()
    app = ScottApp(root)
    root.mainloop()