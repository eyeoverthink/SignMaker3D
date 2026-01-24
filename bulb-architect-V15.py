import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from PIL import Image, ImageTk, ImageOps, ImageDraw
import os
import uuid
import math
import numpy as np

# ==========================================
#   BULB ARCHITECT V15: MASTER INTERFACE
#   Logic: Universal Thread Standards (UMI)
# ==========================================

class BulbArchitectApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Bulb Architect V15 - Master Interface")
        self.root.geometry("1200x800")
        self.root.configure(bg="#121212")

        self.export_dir = os.path.join(os.path.expanduser("~"), "Desktop", "Bulb_Factory_V15")
        if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)
        
        self.shape_points = []
        self.img_ref = None 
        self.raw_image = None

        self.setup_ui()

    def setup_ui(self):
        # MAIN LAYOUT
        panes = tk.PanedWindow(self.root, bg="#121212", orient=tk.HORIZONTAL)
        panes.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # --- LEFT: ENGINEER ---
        left = tk.Frame(panes, bg="#222", width=400)
        panes.add(left, padx=5)

        tk.Label(left, text="MASTER STANDARD (UMI)", font=("Segoe UI", 16, "bold"), bg="#222", fg="#00E676").pack(pady=20)

        # 1. CALIBRATION
        self.lbl(left, "1. CALIBRATION (Print First!)")
        tk.Button(left, text="🖨️ GENERATE THREAD TESTER (10m)", command=self.generate_calibration, 
                 bg="#444", fg="white", font=("Arial", 10)).pack(fill=tk.X, padx=20)
        tk.Label(left, text="Prints just the screw/socket to check fit.", bg="#222", fg="#888", font=("Arial", 8)).pack(pady=2)

        # 2. CORE LOGIC
        self.lbl(left, "2. CORE CHASSIS")
        self.mode = tk.StringVar(value="Standard Helix")
        
        btn_frame = tk.Frame(left, bg="#222")
        btn_frame.pack(fill=tk.X, padx=20)
        tk.Button(btn_frame, text="HELIX", command=lambda: self.set_mode("Standard Helix"), bg="#333", fg="white", width=15).pack(side=tk.LEFT, padx=2)
        tk.Button(btn_frame, text="CUSTOM", command=lambda: self.set_mode("Custom Shape"), bg="#2196F3", fg="white", width=15).pack(side=tk.LEFT, padx=2)

        self.upload_btn = tk.Button(left, text="📂 UPLOAD IMAGE", command=self.upload_image, bg="#FF9800", fg="black", font=("Arial", 11, "bold"))
        
        # 3. SHELL LOGIC
        self.lbl(left, "3. SHELL STYLE")
        self.style = self.combo(left, ["Edison (ST64)", "Globe (G25)", "Tube (T45)"])
        self.pattern = self.combo(left, ["Phi-Ribs", "Vase-Spiral", "Hex-Lattice", "Clear"])

        # 4. BASE
        self.lbl(left, "4. POWER BASE")
        self.batt = self.combo(left, ["AAA (x2) - 3V", "AA (x1) - 1.5V", "18650 (Lithium)"])
        
        # GENERATE
        tk.Button(left, text="GENERATE PRODUCTION FILES", command=self.generate, 
                 bg="#00E676", fg="black", font=("Arial", 14, "bold"), height=2).pack(side=tk.BOTTOM, fill=tk.X, padx=20, pady=20)

        # --- RIGHT: PREVIEW ---
        right = tk.Frame(panes, bg="black", bd=2, relief=tk.SUNKEN)
        panes.add(right, padx=5, stretch="always")
        
        tk.Label(right, text="STANDARD FIT PREVIEW", bg="black", fg="#666").pack(pady=5)
        self.canvas = tk.Canvas(right, bg="#050505", highlightthickness=0)
        self.canvas.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        self.root.after(100, self.draw_preview_context)

    def lbl(self, p, t):
        tk.Label(p, text=t, bg="#222", fg="#03A9F4", font=("Segoe UI", 10, "bold")).pack(anchor="w", padx=20, pady=(20, 5))

    def combo(self, p, vals):
        v = tk.StringVar(value=vals[0])
        ttk.Combobox(p, textvariable=v, values=vals).pack(fill=tk.X, padx=20)
        return v

    def set_mode(self, mode):
        self.mode.set(mode)
        if mode == "Custom Shape":
            self.upload_btn.pack(fill=tk.X, padx=20, pady=5)
        else:
            self.upload_btn.pack_forget()

    def draw_preview_context(self):
        w = self.canvas.winfo_width()
        h = self.canvas.winfo_height()
        cx, cy = w/2, h/2
        self.canvas.delete("all")
        
        # Draw Master Interface Lines (The "Standard")
        # Base
        self.canvas.create_rectangle(cx-35, cy+80, cx+35, cy+160, outline="#444", width=2)
        self.canvas.create_text(cx, cy+120, text="BASE (M34 Thread)", fill="#444")
        
        # Chassis Thread
        self.canvas.create_rectangle(cx-15, cy+80, cx+15, cy+100, fill="#332200", outline="")
        
        # Shell Ghost
        self.canvas.create_oval(cx-70, cy-100, cx+70, cy+40, outline="#333", width=2)
        
        if self.raw_image:
            # Draw Image in "Core Zone"
            target_h = 100
            aspect = self.raw_image.width / self.raw_image.height
            target_w = int(target_h * aspect)
            disp_img = self.raw_image.resize((target_w, target_h))
            self.img_ref = ImageTk.PhotoImage(disp_img)
            self.canvas.create_image(cx, cy-30, image=self.img_ref, anchor="center")
            
            # Trace Overlay
            if self.shape_points:
                scale_x = target_w / 200
                scale_y = target_h / 200
                for p in self.shape_points:
                    px = cx + (p[0] * scale_x)
                    py = (cy - 30) - (p[1] * scale_y)
                    self.canvas.create_oval(px, py, px+2, py+2, fill="#00E676", outline="")

    def upload_image(self):
        path = filedialog.askopenfilename(filetypes=[("Images", "*.png;*.jpg")])
        if not path: return
        try:
            img = Image.open(path).convert("L")
            self.raw_image = img
            data = np.array(img.resize((200, 200)))
            points = []
            step = 4
            h, w = data.shape
            for y in range(0, h, step):
                for x in range(0, w, step):
                    if data[y, x] < 100: 
                        points.append([(x - w/2), ((h - y) - h/2)])
            self.shape_points = points
            self.draw_preview_context()
        except Exception as e:
            messagebox.showerror("Error", str(e))

    def generate_calibration(self):
        # Generates just the threads to test fit
        uid = str(uuid.uuid4())[:4]
        fname = f"Calibration_UMI_{uid}.scad"
        fpath = os.path.join(self.export_dir, fname)
        with open(fpath, "w") as f:
            f.write(self.get_scad(calibration=True))
        os.startfile(self.export_dir)

    def generate(self):
        uid = str(uuid.uuid4())[:6]
        fname = f"Production_V15_{uid}.scad"
        fpath = os.path.join(self.export_dir, fname)
        with open(fpath, "w") as f:
            f.write(self.get_scad(calibration=False))
        os.startfile(self.export_dir)

    def get_scad(self, calibration):
        pts = "[]"
        if self.mode.get() == "Custom Shape" and self.shape_points:
            pts = f"[{','.join([f'[{p[0]:.1f},{p[1]:.1f}]' for p in self.shape_points])}]"
            
        return f"""
// ==========================================
//   BULB ARCHITECT V15: MASTER INTERFACE
//   Standardized ISO Threads (M34 / M26)
// ==========================================

$fn = 60;

// --- MASTER DIMENSIONS (DO NOT CHANGE) ---
// These ensure all bulbs fit all bases
Base_Thread_OD = 34; 
Core_Thread_OD = 26;
Thread_Pitch = 3;

// --- USER SETTINGS ---
Clip_ID = 6.2;
Design_Mode = "{self.mode.get()}";
Shape_Points = {pts};
Bulb_Style = "{self.style.get()}";
Pattern_Style = "{self.pattern.get()}";
Is_Calibration = {"true" if calibration else "false"};

// --- MODULES ---

module thread_iso(od, h, pitch, internal) {{
    tol = internal ? 0.4 : -0.2; 
    linear_extrude(height=h, twist=-360*(h/pitch), slices=h*4)
    translate([(od/2) + tol, 0, 0])
    rotate([0,0,45]) square([1.2, 1.2], center=true);
}}

module clip_hand(angle) {{
    rotate([0,0,angle]) translate([0, 0, 0]) {{
        translate([2, 0, 0]) rotate([0, 90, 0]) cylinder(h=6, d1=3, d2=2);
        translate([6, 0, 0]) rotate([90, 0, 0])
        difference() {{
            cylinder(h=4, d=Clip_ID + 2);
            translate([0,0,-1]) cylinder(h=6, d=Clip_ID); 
            translate([Clip_ID/1.5, 0, 2]) cube([Clip_ID, Clip_ID, 10], center=true);
        }}
    }}
}}

// 1. CHASSIS (M26 Thread)
module part_chassis() {{
    color("Orange")
    union() {{
        // STANDARD PLUG (M26)
        difference() {{ cylinder(h=15, d=Core_Thread_OD); cylinder(h=16, d=6); }}
        thread_iso(Core_Thread_OD, 14, Thread_Pitch, false);
        translate([0,0,14]) cylinder(h=1, d=Core_Thread_OD+4); // Stop Ring

        if (!Is_Calibration) {{
            translate([0,0,15]) {{
                if (Design_Mode == "Standard Helix") {{
                    linear_extrude(height=60, twist=180) translate([0,0]) circle(r=4);
                    for(i=[0:60:360]) {{
                        rotate([0,0,i]) translate([0,0,i/6]) clip_hand(0);
                    }}
                }} else {{
                    if (len(Shape_Points) > 2) {{
                        linear_extrude(height=4) offset(r=1) polygon(points=Shape_Points);
                        hull() {{
                            translate([0,0,-15]) cylinder(h=1, d=10);
                            linear_extrude(1) offset(r=1) polygon(points=Shape_Points);
                        }}
                        for(i=[0 : 8 : len(Shape_Points)-1]) {{
                            translate([Shape_Points[i][0], Shape_Points[i][1], 2])
                            rotate([0, 0, atan2(Shape_Points[i][1], Shape_Points[i][0])]) 
                            clip_hand(0);
                        }}
                    }} else {{ cylinder(h=10, d=2); }}
                }}
            }}
        }}
    }}
}}

// 2. BASE (M34 Outer / M26 Inner)
module part_base() {{
    color("#222")
    difference() {{
        union() {{
            cylinder(h=35, d=Base_Thread_OD); // Main Body
            if (!Is_Calibration) translate([0,0,5]) thread_iso(Base_Thread_OD, 25, 4, false); // Shell Thread
            cylinder(h=5, d=Base_Thread_OD + 4); // Grip Ring
        }}
        // Inner Thread for Chassis (M26)
        translate([0,0,20]) {{
            cylinder(h=16, d=Core_Thread_OD);
            thread_iso(Core_Thread_OD, 15, Thread_Pitch, true);
        }}
        // Battery
        if (!Is_Calibration) translate([0,0,2]) cylinder(h=75, d=19.5); 
        translate([0,0,-1]) cylinder(h=5, d=4);
    }}
}}

// 3. SHELL (M34 Inner)
module part_shell() {{
    color("White", 0.2)
    union() {{
        // STANDARD COLLAR (Solid)
        difference() {{
            cylinder(h=10, d=Base_Thread_OD + 4);
            translate([0,0,-1]) thread_iso(Base_Thread_OD + 0.5, 12, 4, true);
        }}
        
        // VASE BODY (Spiral)
        if (!Is_Calibration) {{
            translate([0,0,10]) difference() {{
                hull() {{
                    cylinder(h=1, d=Base_Thread_OD + 4);
                    if (Bulb_Style == "Globe (G25)") translate([0,0,45]) sphere(d=80);
                    else translate([0,0,35]) sphere(d=60);
                }}
                hull() {{
                    cylinder(h=1, d=Base_Thread_OD);
                    if (Bulb_Style == "Globe (G25)") translate([0,0,45]) sphere(d=76);
                    else translate([0,0,35]) sphere(d=56);
                }}
                if (Pattern_Style == "Phi-Ribs") {{
                    for(i=[0:137.5:3600]) rotate([0,0,i]) translate([29,0,15]) cylinder(h=80, d=2);
                }}
                if (Pattern_Style == "Vase-Spiral") {{
                    linear_extrude(height=100, twist=180) translate([28,0]) circle(r=2);
                }}
            }}
        }}
    }}
}}

// LAYOUT
if (Is_Calibration) {{
    // Print close together for quick test
    translate([-20, 0, 0]) part_base();
    translate([20, 0, 0]) part_chassis();
    translate([0, 20, 0]) part_shell();
}} else {{
    // Print spaced for production
    translate([-60, 0, 0]) part_base();
    translate([60, 0, 0]) part_shell();
    translate([0, 60, 0]) part_chassis();
}}
"""

if __name__ == "__main__":
    root = tk.Tk()
    app = BulbArchitectApp(root)
    root.mainloop()