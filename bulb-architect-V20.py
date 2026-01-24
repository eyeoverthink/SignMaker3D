import tkinter as tk
from tkinter import ttk, messagebox
import os
import uuid
import math

# ==========================================
#   BULB ARCHITECT V20: UNIFIED STACK
#   Focus: Overlapping Unions & Battery Integration
# ==========================================

class ScottUnifiedApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Scott System V20 - Unified Power Stack")
        self.root.geometry("700x850")
        self.root.configure(bg="#111")

        self.export_dir = os.path.join(os.path.expanduser("~"), "Desktop", "Scott_Unified_V20")
        if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)

        self.setup_ui()

    def setup_ui(self):
        tk.Label(self.root, text="SCOTT UNIFIED V20", font=("Impact", 24), bg="#111", fg="#00E676").pack(pady=20)
        
        # CONTROLS
        frame = tk.Frame(self.root, bg="#111")
        frame.pack(fill=tk.BOTH, padx=40)

        self.lbl(frame, "1. GLOBAL FIT")
        self.add_scale(frame, "Lock Diameter (mm)", 34.0, 25, 50, "dia")
        self.add_scale(frame, "Tolerance (Air Gap)", 0.5, 0.1, 1.0, "tol")

        self.lbl(frame, "2. POWER MODULE")
        self.batt_type = tk.StringVar(value="CR2032 (Side-Slot)")
        ttk.Combobox(frame, textvariable=self.batt_type, values=["CR2032 (Side-Slot)", "Direct Wire"]).pack(fill=tk.X)

        self.lbl(frame, "3. FILAMENT CHASSIS")
        self.spine_h = self.add_scale(frame, "Spine Height (mm)", 60, 40, 100, "spine_height")

        # GENERATE BUTTONS
        btn_frame = tk.Frame(self.root, bg="#111")
        btn_frame.pack(fill=tk.X, padx=40, pady=30)
        
        tk.Button(btn_frame, text="GENERATE ALL PARTS", command=self.generate_all, 
                 bg="#00E676", fg="black", font=("Arial", 12, "bold"), height=3).pack(fill=tk.X)

    def lbl(self, p, t):
        tk.Label(p, text=t, bg="#111", fg="#03A9F4", font=("Segoe UI", 11, "bold")).pack(anchor="w", pady=(20, 5))

    def add_scale(self, p, label, default, min_v, max_v, var_name):
        tk.Label(p, text=label, bg="#111", fg="white").pack(anchor="w")
        var = tk.DoubleVar(value=default)
        setattr(self, var_name, var)
        tk.Scale(p, from_=min_v, to=max_v, resolution=0.1, variable=var, orient=tk.HORIZONTAL, bg="#222", fg="#00E676", highlightthickness=0).pack(fill=tk.X, pady=5)
        return var

    def generate_all(self):
        uid = str(uuid.uuid4())[:4]
        # Generate the Master Assembly File
        with open(os.path.join(self.export_dir, f"Scott_System_V20_{uid}.scad"), "w") as f:
            f.write(self.get_scad_master())
        os.startfile(self.export_dir)

    def get_scad_master(self):
        dia = self.dia.get()
        tol = self.tol.get()
        spine_h = self.spine_height.get()
        
        return f"""
// ==========================================
//   SCOTT SYSTEM V20: MASTER STACK
//   Logic: Penetrating Unions (Solid Parts)
// ==========================================
$fn = 80;

// PARAMS
Bolt_Dia = {dia};
Clearance = {tol};
Phi = 1.6180339887;
Base_Height = 3.0;
Num_Steps = 4;
Spine_H = {spine_h};

// --- CORE LOGIC ---

module scott_tooth(d, h) {{
    // Tapered tooth for lock
    cylinder(h=h, d1=d, d2=d-0.6);
}}

module scott_lock_male(d, extra_h) {{
    // The "Bolt"
    union() {{
        // 1. Central Shaft (Extends DOWN for fusion)
        translate([0,0, -2]) // PENETRATION FIX
            cylinder(h = Num_Steps*(Base_Height+0.5)*Phi + 2 + extra_h, d = d - 6);
            
        // 2. The Teeth
        for (i = [0 : Num_Steps-1]) {{
            z = i * (Base_Height + 0.5) * Phi;
            rotate([0, 0, i * 137.5]) translate([0, 0, z]) difference() {{
                scott_tooth(d, Base_Height);
                // Reset Cutout
                translate([d/2, 0, Base_Height/2]) cube([d/2+2, d/Phi, Base_Height+1], center=true);
            }}
        }}
    }}
}}

module scott_lock_female_cutout(d) {{
    // The "Void" to subtract
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
//   PART 1: THE POWER HUB (BATTERY CORE)
// ==========================================
module part_power_hub() {{
    color("#333")
    difference() {{
        union() {{
            // Main Body
            cylinder(h=35, d=Bolt_Dia + 6);
            
            // Male Lock (TOP) for Shell - FUSED
            translate([0,0,35]) scott_lock_male(Bolt_Dia, 0);
        }}
        
        // Female Lock (BOTTOM) for Mounts
        translate([0,0,2]) scott_lock_female_cutout(Bolt_Dia);
        
        // CHASSIS SOCKET (Internal)
        // A smaller lock inside for the filament spine
        translate([0,0,25]) scott_lock_female_cutout(Bolt_Dia - 10);
        
        // BATTERY SLOT (CR2032 Side Entry)
        translate([0,0,18]) 
            cube([Bolt_Dia+10, 21, 4], center=true); // 21mm wide, 4mm high
            
        // Wire Path
        cylinder(h=99, d=3);
    }}
}}

// ==========================================
//   PART 2: THE FILAMENT CHASSIS
// ==========================================
module part_chassis() {{
    color("Orange")
    union() {{
        // Male Lock (BOTTOM) - Fits into Power Hub
        // Note: Smaller diameter
        scott_lock_male(Bolt_Dia - 10, 0);
        
        // The Spine
        translate([0,0,15]) {{
            difference() {{
                cylinder(h=Spine_H, d=6); // Main Rod
                cylinder(h=Spine_H+1, d=3); // Hollow Wire Path
            }}
            
            // Top Tension Hook
            translate([0,0,Spine_H]) difference() {{
                sphere(d=8);
                translate([0,0,-5]) cylinder(h=10, d=3);
                cube([10, 1.5, 10], center=true); // Filament Slot
            }}
        }}
    }}
}}

// ==========================================
//   PART 3: THE SHELL (VASE)
// ==========================================
module part_shell() {{
    color("White", 0.3)
    union() {{
        // Interface Collar
        difference() {{
            cylinder(h=25, d=Bolt_Dia + 6);
            translate([0,0,-1]) scott_lock_female_cutout(Bolt_Dia);
        }}
        
        // Vase Body
        translate([0,0,25]) difference() {{
            hull() {{
                cylinder(h=1, d=Bolt_Dia + 6);
                translate([0,0,40]) sphere(d=60);
            }}
            hull() {{
                cylinder(h=1, d=Bolt_Dia + 2); // Thin Wall
                translate([0,0,40]) sphere(d=56);
            }}
        }}
    }}
}}

// ==========================================
//   PART 4: THE BASE (MOUNT)
// ==========================================
module part_base() {{
    color("#444")
    union() {{
        cylinder(h=5, d=Bolt_Dia+20); // Plate
        translate([0,0,5]) scott_lock_male(Bolt_Dia, 0); // Connector
    }}
}}

// LAYOUT FOR PRINTING
translate([-50, 0, 0]) part_power_hub();
translate([50, 0, 0]) part_shell();
translate([0, 50, 0]) part_chassis();
translate([0, -50, 0]) part_base();
"""

if __name__ == "__main__":
    root = tk.Tk()
    app = ScottUnifiedApp(root)
    root.mainloop()