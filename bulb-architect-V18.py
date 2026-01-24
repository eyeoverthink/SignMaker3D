import tkinter as tk
from tkinter import ttk, messagebox
import os
import uuid

# ==========================================
#   BULB ARCHITECT V18: THE SCOTT PROTOCOL
#   Logic: Phi-Decoupled Interlock + Hollow Core
#   Source: screw-three.scad
# ==========================================

class ScottSystemApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Scott System V18 - Phi Interlock")
        self.root.geometry("600x750")
        self.root.configure(bg="#111")

        self.export_dir = os.path.join(os.path.expanduser("~"), "Desktop", "Scott_System_V18")
        if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)

        self.setup_ui()

    def setup_ui(self):
        # Header
        tk.Label(self.root, text="THE SCOTT PROTOCOL", font=("Impact", 24), bg="#111", fg="#00E676").pack(pady=20)
        tk.Label(self.root, text="Phi-Decoupled Kinematic System", font=("Segoe UI", 10), bg="#111", fg="#888").pack(pady=(0, 20))

        # CONTROLS
        frame = tk.Frame(self.root, bg="#111")
        frame.pack(fill=tk.BOTH, padx=40)

        # 1. LOCK GEOMETRY
        self.lbl(frame, "1. INTERLOCK SETTINGS")
        
        tk.Label(frame, text="Diameter (mm)", bg="#111", fg="white").pack(anchor="w")
        self.dia_var = tk.DoubleVar(value=34.0)
        tk.Scale(frame, from_=20, to=60, variable=self.dia_var, orient=tk.HORIZONTAL, bg="#222", fg="#00E676", highlightthickness=0).pack(fill=tk.X, pady=5)
        
        tk.Label(frame, text="Fit Tolerance (Air Gap)", bg="#111", fg="white").pack(anchor="w")
        self.tol_var = tk.DoubleVar(value=0.6)
        tk.Scale(frame, from_=0.2, to=1.2, resolution=0.1, variable=self.tol_var, orient=tk.HORIZONTAL, bg="#222", fg="#00E676", highlightthickness=0).pack(fill=tk.X, pady=5)

        # 2. LIGHTING CORE
        self.lbl(frame, "2. LIGHTING CHANNEL")
        self.core_type = tk.StringVar(value="Pass-Through (Hollow)")
        ttk.Combobox(frame, textvariable=self.core_type, values=["Pass-Through (Hollow)", "Solid Post"]).pack(fill=tk.X)
        
        tk.Label(frame, text="Inner Diameter (for LEDs):", bg="#111", fg="white", font=("Arial", 8)).pack(anchor="w", pady=(5,0))
        self.inner_dia = tk.DoubleVar(value=14.0)
        tk.Entry(frame, textvariable=self.inner_dia, bg="#222", fg="white").pack(fill=tk.X)

        # 3. SHELL TYPE
        self.lbl(frame, "3. BULB STRUCTURE")
        self.bulb_style = tk.StringVar(value="Edison (ST64)")
        ttk.Combobox(frame, textvariable=self.bulb_style, values=["Edison (ST64)", "Globe (G25)", "Tube (T45)"]).pack(fill=tk.X)

        # GENERATE
        tk.Button(self.root, text="GENERATE SCOTT SYSTEM FILES", command=self.generate, 
                 bg="#00E676", fg="black", font=("Arial", 12, "bold"), height=3).pack(fill=tk.X, padx=40, pady=40)

    def lbl(self, p, t):
        tk.Label(p, text=t, bg="#111", fg="#03A9F4", font=("Segoe UI", 11, "bold")).pack(anchor="w", pady=(20, 5))

    def generate(self):
        uid = str(uuid.uuid4())[:4]
        
        # We generate ONE file containing the separate parts for easy printing
        # Based on your requirement: "give me one file of each"
        
        # 1. The Core (Male)
        with open(os.path.join(self.export_dir, f"Scott_Core_{uid}.scad"), "w") as f:
            f.write(self.get_scad("core"))
            
        # 2. The Socket/Base (Female)
        with open(os.path.join(self.export_dir, f"Scott_Base_{uid}.scad"), "w") as f:
            f.write(self.get_scad("base"))

        # 3. The Shell (Female Interface)
        with open(os.path.join(self.export_dir, f"Scott_Shell_{uid}.scad"), "w") as f:
            f.write(self.get_scad("shell"))

        os.startfile(self.export_dir)

    def get_scad(self, part_type):
        dia = self.dia_var.get()
        tol = self.tol_var.get()
        inner_d = self.inner_dia.get()
        style = self.bulb_style.get()
        
        # Common Logic Header (Your Math)
        header = f"""
// ==========================================
//   THE SCOTT PROTOCOL (V18)
//   Geometry: Phi-Decoupled Interlock
// ==========================================
$fn = 80;

// PARAMETERS
Bolt_Dia = {dia};
Clearance = {tol};
Inner_Dia = {inner_d};
Phi = 1.6180339887;
Base_Height = 3.0; // Height of each tooth
Num_Steps = 5;     // Number of stacking teeth

// --- THE SCOTT MATH ---

module scott_tooth(d, h) {{
    // Tapered for self-centering
    cylinder(h=h, d1=d, d2=d-0.5);
}}

module scott_lock_male() {{
    union() {{
        // Central Shaft
        difference() {{
            cylinder(h = Num_Steps * (Base_Height+0.5) * Phi + 5, d = Bolt_Dia - 6);
            // HOLLOW CORE FOR LEDS
            translate([0,0,-1]) cylinder(h=999, d=Inner_Dia);
        }}
        
        // The Phi Stack
        for (i = [0 : Num_Steps-1]) {{
            z_pos = i * (Base_Height + 0.5) * Phi;
            
            rotate([0, 0, i * 137.5]) 
            translate([0, 0, z_pos])
            difference() {{
                scott_tooth(Bolt_Dia, Base_Height);
                
                // THE RESET CUTOUT (Vital for twisting)
                translate([Bolt_Dia/2, 0, Base_Height/2])
                    cube([Bolt_Dia/2 + 2, Bolt_Dia/Phi, Base_Height + 1], center=true);
            }}
        }}
    }}
}}

module scott_lock_female_cutout() {{
    // This creates the void to subtract from the Base/Shell
    union() {{
        // Shaft Clearance
        cylinder(h=999, d=Bolt_Dia - 6 + Clearance);
        
        // Teeth Clearance
        for (i = [0 : Num_Steps-1]) {{
            z_pos = i * (Base_Height + 0.5) * Phi;
            
            rotate([0, 0, i * 137.5]) 
            translate([0, 0, z_pos - (Clearance/2)])
            // Oversized Tooth
            cylinder(h=Base_Height + Clearance, d1=Bolt_Dia+Clearance, d2=Bolt_Dia-0.5+Clearance);
        }}
    }}
}}
"""
        
        # Specific Part Logic
        if part_type == "core":
            return header + """
// === PART: THE CORE (LIGHT HOLDER) ===
color("Orange")
union() {
    // 1. The Locking Mechanism
    scott_lock_male();
    
    // 2. The Stop Plate (Bottom)
    translate([0,0,-2]) difference() {
        cylinder(h=2, d=Bolt_Dia + 4);
        translate([0,0,-1]) cylinder(h=4, d=Inner_Dia);
    }
}
"""
        elif part_type == "base":
            return header + """
// === PART: THE BASE (WALL MOUNT / STAND) ===
color("#333")
difference() {
    // Outer Body
    cylinder(h=30, d=Bolt_Dia + 10);
    
    // Subtract The Scott Lock
    translate([0,0,2]) scott_lock_female_cutout();
    
    // Wire Hole
    translate([0,0,-1]) cylinder(h=10, d=Inner_Dia);
}
"""
        elif part_type == "shell":
            return header + f"""
// === PART: THE BULB SHELL (VASE) ===
color("White", 0.3)
union() {{
    // 1. The Interface Collar (Solid)
    difference() {{
        cylinder(h=25, d=Bolt_Dia + 8);
        translate([0,0,-1]) scott_lock_female_cutout();
    }}
    
    // 2. The Vase Body (Starts above lock)
    translate([0,0,25]) difference() {{
        hull() {{
            cylinder(h=1, d=Bolt_Dia + 8);
            if ("{style}" == "Globe (G25)") translate([0,0,45]) sphere(d=80);
            else translate([0,0,35]) sphere(d=60);
        }}
        hull() {{
            cylinder(h=1, d=Bolt_Dia + 4); // Wall thickness
            if ("{style}" == "Globe (G25)") translate([0,0,45]) sphere(d=76);
            else translate([0,0,35]) sphere(d=56);
        }}
    }}
}}
"""

if __name__ == "__main__":
    root = tk.Tk()
    app = ScottSystemApp(root)
    root.mainloop()