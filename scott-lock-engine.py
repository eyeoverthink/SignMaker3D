import tkinter as tk
from tkinter import ttk, messagebox
import os
import uuid

# ==========================================
#   THE SCOTT LOCK ENGINE (V1)
#   Logic: Phi-Based Decoupled Interlock
#   Source: screw-three.scad analysis
# ==========================================

class ScottLockApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Scott Lock Engine - Phi Protocol")
        self.root.geometry("500x600")
        self.root.configure(bg="#111")

        self.export_dir = os.path.join(os.path.expanduser("~"), "Desktop", "Scott_Lock_Output")
        if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)

        self.setup_ui()

    def setup_ui(self):
        # Header
        tk.Label(self.root, text="THE SCOTT LOCK", font=("Impact", 22), bg="#111", fg="#00E676").pack(pady=(20, 5))
        tk.Label(self.root, text="Phi-Decoupled Thread Generator", font=("Arial", 10), bg="#111", fg="#888").pack(pady=(0, 20))

        # CONTROLS
        ctrl = tk.Frame(self.root, bg="#111")
        ctrl.pack(fill=tk.BOTH, padx=30)

        # 1. Diameter
        self.add_lbl(ctrl, "1. DIAMETER (mm)")
        self.dia_var = tk.DoubleVar(value=30.0)
        tk.Scale(ctrl, from_=10, to=100, variable=self.dia_var, orient=tk.HORIZONTAL, bg="#222", fg="white", highlightthickness=0).pack(fill=tk.X)

        # 2. Phi Steps (Height)
        self.add_lbl(ctrl, "2. STACK HEIGHT (Steps)")
        self.steps_var = tk.IntVar(value=6)
        tk.Scale(ctrl, from_=3, to=20, variable=self.steps_var, orient=tk.HORIZONTAL, bg="#222", fg="white", highlightthickness=0).pack(fill=tk.X)

        # 3. Tolerance (CRITICAL)
        self.add_lbl(ctrl, "3. FIT TOLERANCE (mm)")
        tk.Label(ctrl, text="Increase if too tight. Decrease if loose.", bg="#111", fg="#666", font=("Arial", 8)).pack(anchor="w")
        self.tol_var = tk.DoubleVar(value=0.6)
        tk.Scale(ctrl, from_=0.2, to=1.5, resolution=0.1, variable=self.tol_var, orient=tk.HORIZONTAL, bg="#222", fg="#00E676", highlightthickness=0).pack(fill=tk.X)

        # 4. Core Style
        self.add_lbl(ctrl, "4. CORE STYLE")
        self.core_var = tk.StringVar(value="Hollow (LED Channel)")
        ttk.Combobox(ctrl, textvariable=self.core_var, values=["Hollow (LED Channel)", "Solid Post"]).pack(fill=tk.X, pady=5)

        # GENERATE
        tk.Button(self.root, text="GENERATE PHI-LOCK PAIR", command=self.generate, 
                 bg="#00E676", fg="black", font=("Arial", 12, "bold"), height=2, relief="flat").pack(fill=tk.X, padx=30, pady=30)
        
        # Status
        self.status = tk.Label(self.root, text="Ready to Decouple", bg="#111", fg="#444")
        self.status.pack()

    def add_lbl(self, parent, text):
        tk.Label(parent, text=text, bg="#111", fg="#03A9F4", font=("Arial", 9, "bold")).pack(anchor="w", pady=(15, 2))

    def generate(self):
        uid = str(uuid.uuid4())[:4]
        filename = f"ScottLock_{uid}.scad"
        filepath = os.path.join(self.export_dir, filename)
        
        with open(filepath, "w") as f:
            f.write(self.get_scad_logic())
        
        self.status.config(text=f"Generated: {filename}", fg="white")
        os.startfile(self.export_dir)

    def get_scad_logic(self):
        # Extract Variables
        dia = self.dia_var.get()
        steps = self.steps_var.get()
        tol = self.tol_var.get()
        hollow = "true" if "Hollow" in self.core_var.get() else "false";
        
        return f"""
// ==========================================================
//   THE SCOTT LOCK (GENERATED)
//   Logic: Spatial Decoupling (Phi 1.618)
// ==========================================================

$fn = 80;

// --- PARAMETERS ---
Phi = 1.6180339887;
Bolt_Dia = {dia};
Num_Steps = {steps};
Base_Height = 2.5; 
Clearance = {tol}; // The "Air Gap" for fit
Hollow_Core = {hollow};

// --- MODULES ---

module scott_tooth(d, h) {{
    // The fundamental unit of the Scott Lock
    // A tapered cylinder slice
    cylinder(h=h, d1=d, d2=d-1);
}}

module scott_bolt() {{
    union() {{
        // 1. The Core Pillar
        difference() {{
            cylinder(h = Num_Steps * (Base_Height + 0.6) * Phi + 5, d = Bolt_Dia - 8);
            if (Hollow_Core) {{
                translate([0,0,-1]) cylinder(h = 999, d = Bolt_Dia - 14); // LED Channel
            }}
        }}
        
        // 2. The Phi-Stack
        for (i = [0 : Num_Steps-1]) {{
            // Z-Position determined by Phi to ensure decoupling
            z_pos = i * (Base_Height + 0.6) * Phi;
            
            rotate([0, 0, i * 137.5]) // Golden Angle Rotation
            translate([0, 0, z_pos])
            difference() {{
                scott_tooth(Bolt_Dia, Base_Height);
                
                // The Reset Cutout (From your screw-three.scad)
                // This breaks the friction ring, allowing "twist"
                translate([Bolt_Dia/2, 0, Base_Height/2])
                    cube([Bolt_Dia/2 + 2, Bolt_Dia/Phi, Base_Height + 1], center=true);
                
                // Hollow Core Pass-through
                if (Hollow_Core) {{
                    translate([0,0,-1]) cylinder(h=Base_Height+2, d=Bolt_Dia - 14);
                }}
            }}
        }}
    }}
}}

module scott_nut() {{
    // The Receiver
    // Logic: A solid block MINUS the Bolt (plus tolerance)
    difference() {{
        // The Nut Body (Hex or Cylinder)
        cylinder(h = Num_Steps * (Base_Height + 0.6) * Phi + 5, d = Bolt_Dia + 10, $fn=6);
        
        // Subtracting the Bolt with Clearance
        union() {{
            // Core Clearance
            translate([0,0,-1]) cylinder(h=999, d=Bolt_Dia - 8 + Clearance);
            
            // Teeth Clearance
            for (i = [0 : Num_Steps-1]) {{
                z_pos = i * (Base_Height + 0.6) * Phi;
                rotate([0, 0, i * 137.5]) 
                translate([0, 0, z_pos - (Clearance/2)]) // Vertical Clearance
                
                // Expanded Tooth for Subtraction
                cylinder(h=Base_Height + Clearance, d1=Bolt_Dia + Clearance, d2=Bolt_Dia - 1 + Clearance);
            }}
        }}
    }}
}}

// --- RENDER LAYOUT ---
translate([-Bolt_Dia, 0, 0]) scott_bolt();
translate([Bolt_Dia, 0, 0]) scott_nut();
"""

if __name__ == "__main__":
    root = tk.Tk()
    app = ScottLockApp(root)
    root.mainloop()