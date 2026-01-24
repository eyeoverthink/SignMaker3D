import tkinter as tk
from tkinter import ttk, messagebox
import os
import uuid
import math

# ==========================================
#   BULB ARCHITECT V19: THE MODULAR LUMEN
#   Logic: Battery Integration + Dual-End Locks
# ==========================================

class ScottLumenApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Scott Lumen V19 - Modular Power System")
        self.root.geometry("650x800")
        self.root.configure(bg="#111")

        self.export_dir = os.path.join(os.path.expanduser("~"), "Desktop", "Scott_Lumen_V19")
        if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)

        self.setup_ui()

    def setup_ui(self):
        # Header
        tk.Label(self.root, text="MODULAR LUMEN V19", font=("Impact", 24), bg="#111", fg="#00E676").pack(pady=20)
        tk.Label(self.root, text="Self-Contained Power & Lighting Core", font=("Segoe UI", 11), bg="#111", fg="#888").pack(pady=(0, 20))

        # CONTROLS
        frame = tk.Frame(self.root, bg="#111")
        frame.pack(fill=tk.BOTH, padx=40)

        # 1. SCOTT LOCK SPECS
        self.lbl(frame, "1. INTERLOCK SPECS")
        self.add_param(frame, "Lock Diameter (mm)", 34.0, 20, 60, "dia")
        self.add_param(frame, "Fit Tolerance (mm)", 0.6, 0.2, 1.2, "tol")

        # 2. POWER SPECS
        self.lbl(frame, "2. POWER MODULE")
        self.batt_type = tk.StringVar(value="CR2032 (Stackable)")
        ttk.Combobox(frame, textvariable=self.batt_type, values=["CR2032 (Stackable)", "Direct Wire (Pass-through)"]).pack(fill=tk.X)
        
        # 3. FILAMENT CHASSIS
        self.lbl(frame, "3. FILAMENT SPINE")
        self.spine_type = tk.StringVar(value="Tension Spine (Hook)")
        ttk.Combobox(frame, textvariable=self.spine_type, values=["Tension Spine (Hook)", "Hollow Tube (Channel)", "None"]).pack(fill=tk.X)

        # GENERATE
        tk.Button(self.root, text="MANIFEST MODULAR SYSTEM", command=self.generate, 
                 bg="#00E676", fg="black", font=("Arial", 12, "bold"), height=3).pack(fill=tk.X, padx=40, pady=40)

    def lbl(self, p, t):
        tk.Label(p, text=t, bg="#111", fg="#03A9F4", font=("Segoe UI", 11, "bold")).pack(anchor="w", pady=(20, 5))

    def add_param(self, p, label, default, min_v, max_v, var_name):
        tk.Label(p, text=label, bg="#111", fg="white").pack(anchor="w")
        var = tk.DoubleVar(value=default)
        setattr(self, var_name, var)
        tk.Scale(p, from_=min_v, to=max_v, resolution=0.1, variable=var, orient=tk.HORIZONTAL, bg="#222", fg="#00E676", highlightthickness=0).pack(fill=tk.X, pady=5)

    def generate(self):
        uid = str(uuid.uuid4())[:4]
        
        # 1. The Power Module (The "New Level")
        with open(os.path.join(self.export_dir, f"Lumen_PowerCore_{uid}.scad"), "w") as f:
            f.write(self.get_scad("power"))
            
        # 2. The Chassis (Filament Holder)
        with open(os.path.join(self.export_dir, f"Lumen_Chassis_{uid}.scad"), "w") as f:
            f.write(self.get_scad("chassis"))
            
        # 3. The Shell (Diffuser)
        with open(os.path.join(self.export_dir, f"Lumen_Shell_{uid}.scad"), "w") as f:
            f.write(self.get_scad("shell"))

        os.startfile(self.export_dir)

    def get_scad(self, part):
        dia = self.dia.get()
        tol = self.tol.get()
        
        header = f"""
// ==========================================
//   SCOTT LUMEN V19
//   Modular Power & Interlock System
// ==========================================
$fn = 80;
Bolt_Dia = {dia};
Clearance = {tol};
Phi = 1.6180339887;
Base_Height = 3.0;
Num_Steps = 5;

// --- SCOTT LOCK LOGIC ---
module scott_tooth(d, h) {{
    cylinder(h=h, d1=d, d2=d-0.5);
}}

module scott_male(offset_z=0) {{
    translate([0,0,offset_z])
    union() {{
        cylinder(h = Num_Steps*(Base_Height+0.5)*Phi + 2, d = Bolt_Dia - 6);
        for (i = [0 : Num_Steps-1]) {{
            z = i * (Base_Height + 0.5) * Phi;
            rotate([0, 0, i * 137.5]) translate([0, 0, z]) difference() {{
                scott_tooth(Bolt_Dia, Base_Height);
                translate([Bolt_Dia/2, 0, Base_Height/2]) cube([Bolt_Dia/2+2, Bolt_Dia/Phi, Base_Height+1], center=true);
            }}
        }}
    }}
}}

module scott_female_cutout() {{
    union() {{
        cylinder(h=999, d=Bolt_Dia - 6 + Clearance);
        for (i = [0 : Num_Steps-1]) {{
            z = i * (Base_Height + 0.5) * Phi;
            rotate([0, 0, i * 137.5]) translate([0, 0, z - Clearance/2])
            cylinder(h=Base_Height+Clearance, d1=Bolt_Dia+Clearance, d2=Bolt_Dia-0.5+Clearance);
        }}
    }}
}}
"""
        if part == "power":
            return header + """
// === PART: THE POWER CORE (BATTERY MODULE) ===
color("#333")
difference() {
    union() {
        // Main Body Cylinder
        cylinder(h=45, d=Bolt_Dia + 6);
        
        // Male Lock on TOP (Connects to Shell)
        translate([0,0,45]) scott_male();
    }
    
    // Female Lock on BOTTOM (Connects to Base/Wall/Magnet)
    translate([0,0,2]) scott_female_cutout();
    
    // BATTERY CAVITY (CR2032)
    // Slot for the battery holder to slide in side-ways or drop in
    translate([0,0,25]) rotate([90,0,0]) cylinder(h=Bolt_Dia+10, d=20.5, center=true);
    
    // Wire Channels (Top to Battery)
    translate([0,0,25]) cylinder(h=50, d=4);
}
"""
        elif part == "chassis":
            return header + """
// === PART: THE CHASSIS (FILAMENT TENSION SPINE) ===
color("Orange")
union() {
    // 1. Connection Plug (Friction fits into Power Core)
    difference() {
        cylinder(h=10, d=Bolt_Dia - 8); // Fits inside Core hole
        cylinder(h=12, d=4); // Wire path
    }
    
    // 2. The Spine (Hollow Tube)
    translate([0,0,10]) difference() {
        cylinder(h=60, d=6);
        cylinder(h=62, d=4); // Hollow for wires
    }
    
    // 3. The Top Hook (For Tension)
    translate([0,0,70]) difference() {
        sphere(d=8);
        translate([0,0,-2]) cylinder(h=6, d=4);
        // Slit for filament loop
        cube([10, 1, 10], center=true);
    }
}
"""
        elif part == "shell":
            return header + """
// === PART: THE SHELL (VASE READY) ===
color("White", 0.3)
union() {
    // 1. Interface Collar (Solid)
    difference() {
        cylinder(h=25, d=Bolt_Dia + 6);
        translate([0,0,-1]) scott_female_cutout();
    }
    
    // 2. Vase Body
    translate([0,0,25]) 
    difference() {
        hull() {
            cylinder(h=1, d=Bolt_Dia + 6);
            translate([0,0,40]) sphere(d=60);
        }
        hull() {
            cylinder(h=1, d=Bolt_Dia + 2);
            translate([0,0,40]) sphere(d=56);
        }
    }
}
"""

if __name__ == "__main__":
    root = tk.Tk()
    app = ScottLumenApp(root)
    root.mainloop()