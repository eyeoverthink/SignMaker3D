import tkinter as tk
from tkinter import ttk, messagebox
import os
import uuid
import math

# ==========================================
#   BULB ARCHITECT V21: THE COOKIE PROTOCOL
#   Focus: Precision Filament Containment (Slab Style)
#   Credit: Scott Protocol Phi-Decoupled Logic
# ==========================================

class ScottCookieApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Scott System V21 - 'Cookie' Filament Chassis")
        self.root.geometry("750x900")
        self.root.configure(bg="#151515")

        self.export_dir = os.path.join(os.path.expanduser("~"), "Desktop", "Scott_V21_Cookie")
        if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)

        self.setup_ui()

    def setup_ui(self):
        tk.Label(self.root, text="SCOTT PROTOCOL V21", font=("Impact", 24), bg="#151515", fg="#00E676").pack(pady=20)
        tk.Label(self.root, text="Modular 'Cookie' Filament Containment System", font=("Segoe UI", 11), bg="#151515", fg="#888").pack(pady=(0, 20))

        frame = tk.Frame(self.root, bg="#151515")
        frame.pack(fill=tk.BOTH, padx=40)

        # 1. SYSTEM FIT
        self.lbl(frame, "1. SCOTT SYSTEM FIT")
        self.add_scale(frame, "Master Diameter (mm)", 34.0, 25, 50, "dia")
        self.add_scale(frame, "Fit Tolerance (mm)", 0.5, 0.1, 1.0, "tol")

        # 2. SHELL AESTHETICS (Patterns Restored!)
        self.lbl(frame, "2. SHELL PATTERN")
        self.shell_pattern = tk.StringVar(value="Phi-Ribs (Diffusion)")
        ttk.Combobox(frame, textvariable=self.shell_pattern, values=["Phi-Ribs (Diffusion)", "Houndstooth-Vase", "Hex-Lattice", "Clear"]).pack(fill=tk.X)

        # 3. THE COOKIE CHASSIS
        self.lbl(frame, "3. FILAMENT 'COOKIE' INSERT")
        tk.Label(frame, text="Filament Diameter (mm):", bg="#151515", fg="white").pack(anchor="w")
        self.fil_dia = tk.DoubleVar(value=4.0) # Standard flexible LED
        tk.Entry(frame, textvariable=self.fil_dia, bg="#222", fg="white").pack(fill=tk.X)
        
        tk.Label(frame, text="Proof-of-Concept Shape: 'Infinity Loop'", bg="#151515", fg="#888", font=("Arial", 9)).pack(anchor="w", pady=5)

        # GENERATE
        tk.Button(self.root, text="GENERATE COOKIE SYSTEM (4 PARTS)", command=self.generate_all, 
                 bg="#00E676", fg="black", font=("Arial", 12, "bold"), height=3).pack(fill=tk.X, padx=40, pady=40)

    def lbl(self, p, t):
        tk.Label(p, text=t, bg="#151515", fg="#03A9F4", font=("Segoe UI", 11, "bold")).pack(anchor="w", pady=(20, 5))

    def add_scale(self, p, label, default, min_v, max_v, var_name):
        tk.Label(p, text=label, bg="#151515", fg="white").pack(anchor="w")
        var = tk.DoubleVar(value=default)
        setattr(self, var_name, var)
        tk.Scale(p, from_=min_v, to=max_v, resolution=0.1, variable=var, orient=tk.HORIZONTAL, bg="#222", fg="#00E676", highlightthickness=0).pack(fill=tk.X, pady=5)
        return var

    def generate_all(self):
        uid = str(uuid.uuid4())[:4]
        with open(os.path.join(self.export_dir, f"Scott_V21_Master_{uid}.scad"), "w") as f:
            f.write(self.get_scad_master())
        os.startfile(self.export_dir)

    def get_scad_master(self):
        dia = self.dia.get()
        tol = self.tol.get()
        fil_d = self.fil_dia.get()
        pattern = self.shell_pattern.get()
        
        return f"""
// ==========================================
//   SCOTT SYSTEM V21: THE COOKIE PROTOCOL
//   Based on Scott Phi-Decoupled Logic
// ==========================================
$fn = 80;

// PARAMS
Bolt_Dia = {dia};
Clearance = {tol};
Filament_Dia = {fil_d};
Phi = 1.6180339887;
Base_Height = 3.0;
Num_Steps = 4;

// --- FIXED SCOTT LOCK MODULES ---

module scott_tooth(d, h) {{
    // Tapered tooth, slightly oversized internally for overlap
    cylinder(h=h, d1=d, d2=d-0.6);
}}

module scott_lock_male(d, extra_h) {{
    // THE FIX: Teeth now overlap the shaft radially by 0.4mm
    Shaft_Dia = d - 6;
    Tooth_Inner_Dia = Shaft_Dia - 0.8; // Overlap!
    
    union() {{
        // Central Shaft
        translate([0,0, -2]) 
            cylinder(h = Num_Steps*(Base_Height+0.5)*Phi + 2 + extra_h, d = Shaft_Dia);
            
        // Teeth with OverlapSolid Union
        for (i = [0 : Num_Steps-1]) {{
            z = i * (Base_Height + 0.5) * Phi;
            rotate([0, 0, i * 137.5]) translate([0, 0, z]) difference() {{
                scott_tooth(d, Base_Height);
                // Reset Cutout
                translate([d/2, 0, Base_Height/2]) cube([d/2+2, d/Phi, Base_Height+1], center=true);
                // Hollow center for shaft overlap
                translate([0,0,-1]) cylinder(h=Base_Height+2, d=Tooth_Inner_Dia);
            }}
        }}
    }}
}}

module scott_lock_female_cutout(d) {{
    union() {{
        cylinder(h=999, d=d - 6 + Clearance);
        for (i = [0 : Num_Steps-1]) {{
            z = i * (Base_Height + 0.5) * Phi;
            rotate([0, 0, i * 137.5]) translate([0, 0, z - Clearance/2])
            cylinder(h=Base_Height+Clearance, d1=d+Clearance, d2=d-0.6+Clearance);
        }}
    }}
}}

// ==========================================
//   THE "COOKIE" (Filament Slab)
// ==========================================

module filament_channel_shape() {{
    // Proof of Concept: A simple "Infinity Loop" path
    // This would be replaced by your custom shapes later
    for(i=[0:10:360]) {{
        angle = i;
        rad = 15 + 8 * sin(angle*2); // Figure-8ish shape
        x = rad * cos(angle);
        y = rad * sin(angle);
        translate([x,y,0]) sphere(d=Filament_Dia);
    }}
    // Entry/Exit path down center
    rotate([90,0,0]) cylinder(h=40, d=Filament_Dia, center=true);
}}

module cookie_half(is_lid) {{
    thickness = Filament_Dia + 3; // Total thickness of slab
    slab_w = Bolt_Dia + 15;
    slab_h = 60;

    difference() {{
        union() {{
            // The Slab Body
            translate([-slab_w/2, -2, 0]) cube([slab_w, 4, slab_h]);
            
            if (!is_lid) {{
                // Base has the connection post
                 translate([0,0,0]) rotate([-90,0,0]) scott_lock_male(Bolt_Dia-10, 0);
                 // Alignment Pins
                 translate([slab_w/2-4, 2, 10]) rotate([90,0,0]) cylinder(h=4, d=3);
                 translate([-slab_w/2+4, 2, slab_h-10]) rotate([90,0,0]) cylinder(h=4, d=3);
            }}
        }}
        
        // THE CHANNEL CUTOUT (Half depth)
        translate([0, 0, slab_h/2]) 
            rotate([-90,0,0])
            filament_channel_shape();
            
        if (is_lid) {{
            // Alignment Holes
             translate([slab_w/2-4, 3, 10]) rotate([90,0,0]) cylinder(h=6, d=3.4);
             translate([-slab_w/2+4, 3, slab_h-10]) rotate([90,0,0]) cylinder(h=6, d=3.4);
        }}
    }}
}}

// ==========================================
//   PARTS RENDER
// ==========================================

// 1. COOKIE BASE (Half A)
translate([60, 0, 0]) color("Orange") cookie_half(false);

// 2. COOKIE LID (Half B)
translate([100, 0, 0]) color("Yellow") cookie_half(true);

// 3. POWER HUB
translate([0, 0, 0]) color("#333") {{
    difference() {{
        cylinder(h=35, d=Bolt_Dia + 6);
        translate([0,0,35]) scott_lock_male(Bolt_Dia, 0); // Top Lock
    }}
    translate([0,0,2]) scott_lock_female_cutout(Bolt_Dia); // Bottom Lock
    translate([0,0,25]) scott_lock_female_cutout(Bolt_Dia - 10); // Cookie Socket
    // Wire/Battery paths...
    translate([0,0,18]) cube([Bolt_Dia+10, 21, 4], center=true);
    cylinder(h=99, d=3);
}}

// 4. SHELL (With Patterns!)
translate([0, 60, 0]) color("White", 0.3) {{
    difference() {{
        cylinder(h=25, d=Bolt_Dia + 6);
        translate([0,0,-1]) scott_lock_female_cutout(Bolt_Dia);
    }}
    translate([0,0,25]) difference() {{
        hull() {{ cylinder(h=1, d=Bolt_Dia+6); translate([0,0,40]) sphere(d=60); }}
        hull() {{ cylinder(h=1, d=Bolt_Dia+2); translate([0,0,40]) sphere(d=56); }}
        
        // RESTORED PATTERNS
        if ("{pattern}" == "Phi-Ribs (Diffusion)") {{
             for(i=[0:137.5:3600]) rotate([0,0,i]) translate([29,0,20]) cylinder(h=80, d=2);
        }}
        if ("{pattern}" == "Houndstooth-Vase") {{
             for(i=[0:20:360]) rotate([0,0,i]) translate([28,0,10]) cube([5,2,50]);
        }}
    }}
}}
"""

if __name__ == "__main__":
    root = tk.Tk()
    app = ScottCookieApp(root)
    root.mainloop()