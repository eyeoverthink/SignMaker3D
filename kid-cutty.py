import tkinter as tk
from tkinter import filedialog, messagebox
from PIL import Image, ImageTk
import cv2
import numpy as np
import os

# ==========================================
# THE SCOTT ENGINE - GUI V1.0
# Logic: "The Kid Cut" (Scissors) + Hybrid Detail
# ==========================================

class ScottApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Scott Engine V1.0 - The Scissors Protocol")
        self.root.geometry("1200x700")
        self.root.configure(bg='#2E2E2E')

        # State variables
        self.current_image_path = None
        self.original_cv_image = None
        self.processed_cv_image = None
        self.kid_cut_mask = None # Stores the "scissors" result

        self._setup_gui()

    def _setup_gui(self):
        # Top Control Panel
        control_frame = tk.Frame(self.root, bg='#404040', pady=10)
        control_frame.pack(fill=tk.X)

        btn_style = {'bg': '#505050', 'fg': 'white', 'font': ('Arial', 12, 'bold'), 'padx': 20, 'pady': 5}

        tk.Button(control_frame, text="1. Load Image", command=self.load_image, **btn_style).pack(side=tk.LEFT, padx=10)
        
        # THE NEW LOGIC BUTTON
        tk.Button(control_frame, text="2. Test 'Kid Cut' (Scissors)", command=self.run_kid_cut, bg='#FFA500', fg='black', font=('Arial', 12, 'bold'), padx=20, pady=5).pack(side=tk.LEFT, padx=10)
        
        # Final Result Button
        tk.Button(control_frame, text="3. Generate Final Manifest", command=self.run_final_manifest, bg='#00FF00', fg='black', font=('Arial', 12, 'bold'), padx=20, pady=5).pack(side=tk.LEFT, padx=10)
        
        tk.Button(control_frame, text="Save .SCAD", command=self.save_scad, **btn_style).pack(side=tk.RIGHT, padx=10)

        # Image Display Area
        display_frame = tk.Frame(self.root, bg='#2E2E2E')
        display_frame.pack(fill=tk.BOTH, expand=True, pady=20)

        # Left Canvas (Original)
        self.canvas_left = tk.Canvas(display_frame, bg='black', width=580, height=550)
        self.canvas_left.pack(side=tk.LEFT, padx=10, expand=True)
        tk.Label(self.canvas_left, text="ORIGINAL INPUT", bg='black', fg='white').place(x=10, y=10)

        # Right Canvas (Result)
        self.canvas_right = tk.Canvas(display_frame, bg='black', width=580, height=550)
        self.canvas_right.pack(side=tk.RIGHT, padx=10, expand=True)
        self.label_right = tk.Label(self.canvas_right, text="PROCESSED RESULT", bg='black', fg='white')
        self.label_right.place(x=10, y=10)

    def resize_for_display(self, cv_img, target_width=580, target_height=550):
        h, w = cv_img.shape[:2]
        aspect = w / h
        
        if w > h:
            new_w = target_width
            new_h = int(new_w / aspect)
        else:
            new_h = target_height
            new_w = int(new_h * aspect)
            
        resized = cv2.resize(cv_img, (new_w, new_h), interpolation=cv2.INTER_AREA)
        return resized

    def display_image(self, cv_img, canvas):
        # Convert BGR to RGB for display
        if len(cv_img.shape) == 2: # Grayscale
            rgb_img = cv2.cvtColor(cv_img, cv2.COLOR_GRAY2RGB)
        else:
            rgb_img = cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB)
            
        resized = self.resize_for_display(rgb_img)
        pil_img = Image.fromarray(resized)
        tk_img = ImageTk.PhotoImage(image=pil_img)
        
        canvas.image = tk_img # Keep reference to avoid garbage collection
        canvas.create_image(290, 275, image=tk_img, anchor=tk.CENTER)

    # ================= FUNCTIONS =================

    def load_image(self):
        path = filedialog.askopenfilename(filetypes=[("Images", "*.jpg *.png *.jpeg")])
        if path:
            self.current_image_path = path
            self.original_cv_image = cv2.imread(path)
            self.kid_cut_mask = None # Reset mask on new load
            self.display_image(self.original_cv_image, self.canvas_left)
            self.label_right.config(text="Ready for Processing...")

    def run_kid_cut(self):
        """Implementing your 'Scissors' logic to isolate the main subject."""
        if self.original_cv_image is None: return

        gray = cv2.cvtColor(self.original_cv_image, cv2.COLOR_BGR2GRAY)
        
        # 1. Heavy Blur to ignore internal details (eyes, ties, etc.)
        # We just want the big shape.
        blurred = cv2.GaussianBlur(gray, (25, 25), 0)
        
        # 2. Simple Threshold to get a big blob
        _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        
        # 3. Find the biggest contour (The main subject)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
             messagebox.showerror("Error", "No main object found.")
             return

        largest_contour = max(contours, key=cv2.contourArea)
        
        # 4. Create the "Scissors Mask"
        # Black background, white fill for the main object only.
        self.kid_cut_mask = np.zeros_like(gray)
        cv2.drawContours(self.kid_cut_mask, [largest_contour], -1, (255), thickness=cv2.FILLED)
        
        # Display the mask so you can verify the "cut"
        self.display_image(self.kid_cut_mask, self.canvas_right)
        self.label_right.config(text="RESULT: The 'Kid Cut' Mask (Scissors)")
        messagebox.showinfo("Logic Check", "Step 1 Complete. This white area is the only place we will look for details in the next step.")


    def run_final_manifest(self):
        """The Hybrid V3 logic, CONSTRAINED by the Kid Cut mask."""
        if self.original_cv_image is None: return
        if self.kid_cut_mask is None:
             messagebox.showwarning("Order of Operations", "Please run 'Step 2: Kid Cut' first to define the boundary.")
             return

        # --- Standard V3 Hybrid Prep ---
        gray = cv2.cvtColor(self.original_cv_image, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        blurred_detail = cv2.GaussianBlur(enhanced, (3, 3), 0)

        # A. Canny (Structure)
        edges = cv2.Canny(blurred_detail, 30, 100)
        # B. Adaptive (Texture)
        thresh = cv2.adaptiveThreshold(blurred_detail, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2)
        # C. Mix
        hybrid_details = cv2.bitwise_or(edges, thresh)

        # --- THE SCOTT LOGIC APPLICATION ---
        # Apply the "Scissors Mask". We only keep details where the mask is white.
        # This deletes all background noise instantly.
        final_masked_details = cv2.bitwise_and(hybrid_details, hybrid_details, mask=self.kid_cut_mask)

        # --- Manifestation (Thickening & Tracing) ---
        kernel = np.ones((2,2), np.uint8)
        thickened = cv2.dilate(final_masked_details, kernel, iterations=1)
        closed = cv2.morphologyEx(thickened, cv2.MORPH_CLOSE, kernel)

        # Visualization: Create a clean white image with black vectors
        visualization = np.ones_like(self.original_cv_image) * 255
        
        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        self.final_contours = []

        for cnt in contours:
            if cv2.contourArea(cnt) > 30: # Filter dust
                # Geodesic Distillation
                epsilon = 0.001 * cv2.arcLength(cnt, True)
                approx = cv2.approxPolyDP(cnt, epsilon, True)
                self.final_contours.append(approx)
                # Draw for visualization in GUI
                cv2.drawContours(visualization, [approx], -1, (0,0,0), 2)

        self.processed_cv_image = visualization
        self.display_image(visualization, self.canvas_right)
        self.label_right.config(text="RESULT: Final Manifest (Masked + Distilled)")

    def save_scad(self):
        if not hasattr(self, 'final_contours') or not self.final_contours:
             messagebox.showwarning("Save", "No manifest generated yet.")
             return
             
        output_path = filedialog.asksaveasfilename(defaultextension=".scad", filetypes=[("OpenSCAD", "*.scad")])
        if not output_path: return

        # Center calculation
        all_points = []
        for cnt in self.final_contours:
            for p in cnt:
                all_points.append([p[0][0], -p[0][1]]) # Flip Y

        if not all_points: return
        xs = [p[0] for p in all_points]
        ys = [p[1] for p in all_points]
        c_x = (min(xs) + max(xs)) / 2
        c_y = (min(ys) + max(ys)) / 2

        scad_content = f"// SCOTT ENGINE GUI MANIFEST\n$fn=40;\nmodule lines(){{translate([{-c_x},{-c_y},0]){{\n"
        for cnt in self.final_contours:
            pts_str = "[" + ",".join([f"[{p[0][0]},{-p[0][1]}]" for p in cnt]) + "]"
            scad_content += f"polygon(points={pts_str});\n"
        scad_content += "}}}\nlinear_extrude(2) lines();"

        with open(output_path, "w") as f:
            f.write(scad_content)
        messagebox.showinfo("Saved", f"Manifest saved to {output_path}")


if __name__ == "__main__":
    root = tk.Tk()
    app = ScottApp(root)
    root.mainloop()