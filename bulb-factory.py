import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import os
import uuid
import math

# ==========================================
#   BULB ARCHITECT V2: UNFREEZABLE
#   Logic: Modular Battery Systems + Safety Limits
# ==========================================

class BulbArchitectApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Bulb Architect V2 - Modular System")
        self.root.geometry("650x750")
        self.root.configure(bg="#1a1a1a")

        # Auto-detect Desktop for safety
        self.desktop = os.path.join(os.path.expanduser("~"), "Desktop")
        self.export_dir = os.path.join(self.desktop, "Bulb_Factory_Output")
        if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)

        self.setup_ui()

    def setup_ui(self):
        # Header
        header = tk.Label(self.root, text="BULB ARCHITECT V2", font=("Segoe UI", 18, "bold"), bg="#1a1a1a", fg="#00E676")
        header.pack(pady=20)

        main_frame = tk.Frame(self.root, bg="#262626", padx=20, pady=20)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)

        # 1. Power Source (The Base)
        self.add_section(main_frame, "1. POWER CORE (The Base)")
        self.batt_var = tk.StringVar(value="AAA (x2) - 3V")
        batt_options = ["CR2032 (Coin) - 3V", "AAA (x1) - 1.5V", "AAA (x2) - 3V", "AA (x1) - 1.5V", "18650 (Lithium) - 3.7V"]
        ttk.Combobox(main_frame, textvariable=self.batt_var, values=batt_options, state="readonly", font=("Arial", 11)).pack(fill=tk.X, pady=5)

        # 2. Diffuser Shape (The Glass)
        self.add_section(main_frame, "2. DIFFUSER SHAPE (The Shell)")
        self.shape_var = tk.StringVar(value="Edison (ST64)")
        shape_options = ["Standard (A19)", "Globe (G25)", "Edison (ST64)", "Tube (T45)", "Diamond (Modern)"]
        ttk.Combobox(main_frame, textvariable=self.shape_var, values=shape_options, state="readonly", font=("Arial", 11)).pack(fill=tk.X, pady=5)

        # 3. Filament Chassis
        self.add_section(main_frame, "3. FILAMENT CHASSIS (The Core)")
        self.fil_var = tk.StringVar(value="Double Helix")
        fil_options = ["Straight Pillar", "Double Helix", "Zig-Zag", "Heart Shape", "DNA Spiral"]
        ttk.Combobox(main_frame, textvariable=self.fil_var, values=fil_options, state="readonly", font=("Arial", 11)).pack(fill=tk.X, pady=5)

        # 4. Thread Standard
        self.add_section(main_frame, "4. SOCKET STANDARD")
        self.thread_var = tk.StringVar(value="E27 (Standard)")
        thread_options = ["E27 (Standard)", "E14 (Candelabra)", "E40 (Giant)"]
        ttk.Combobox(main_frame, textvariable=self.thread_var, values=thread_options, state="readonly", font=("Arial", 11)).pack(fill=tk.X, pady=5)

        # GENERATE
        btn_frame = tk.Frame(self.root, bg="#1a1a1a")
        btn_frame.pack(fill=tk.X, padx=20, pady=20)
        
        btn = tk.Button(btn_frame, text="GENERATE BLUEPRINTS", command=self.generate, 
                       bg="#00E676", fg="black", font=("Arial", 12, "bold"), height=2, relief="flat")
        btn.pack(fill=tk.X)
        
        tk.Label(self.root, text=f"Output: {self.export_dir}", bg="#1a1a1a", fg="#666", font=("Arial", 8)).pack(pady=5)

    def add_section(self, parent, text):
        tk.Label(parent, text=text, bg="#262626", fg="#03A9F4", font=("Segoe UI", 10, "bold")).pack(anchor="w", pady=(15, 2))

    def generate(self):
        # 1. Generate Unique ID (The Zombie Killer)
        # This guarantees the filename is NEW every time.
        unique_id = str(uuid.uuid4())[:8]
        filename = f"Bulb_{unique_id}.scad"
        filepath = os.path.join(self.export_dir, filename)

        # 2. Get Parameters
        batt = self.batt_var.get()
        shape = self.shape_var.get()
        fil = self.fil_var.get()
        thread = self.thread_var.get()

        # 3. Generate Code
        scad_code = self.get_scad_logic(batt, shape, fil, thread)
        
        # 4. Write File
        with open(filepath, "w") as f:
            f.write(scad_code)
        
        # 5. Open Folder (So you find it immediately)
        os.startfile(self.export_dir)

    def get_scad_logic(self, batt, shape, fil, thread):
        # --- PARAMETRIC DATABASE ---
        
        # Battery Specs [Diameter, Height, Count]
        b_specs = {
            "CR2032 (Coin) - 3V":   [21, 4, 1],
            "AAA (x1) - 1.5V":      [11, 45, 1],
            "AAA (x2) - 3V":        [11, 45, 2],
            "AA (x1) - 1.5V":       [15, 51, 1],
            "18650 (Lithium) - 3.7V": [19, 66, 1]
        }
        b_d, b_h, b_count = b_specs[batt]
        
        # Thread Specs (E-Series)
        t_specs = {
            "E14 (Candelabra)": 14,
            "E27 (Standard)": 27,
            "E40 (Giant)": 40
        }
        base_dia = max(t_specs[thread], b_d + 6 if b_count == 1 else (b_d*2) + 6)
        base_height = max(30, b_h + 15)

        return f"""
// ==========================================
//   BULB ARCHITECT MANIFEST
//   Generated by Scott Protocol V2
// ==========================================

$fn = 60; // Performance Mode

// --- SETTINGS ---
Base_Dia = {base_dia};
Base_Height = {base_height};
Batt_Dia = {b_d};
Batt_Height = {b_h};
Wall = 2.0;

// --- MODULES ---

module screw_thread(od, h) {{
    // Simplified E-Thread Logic
    linear_extrude(height=h, twist=-360*(h/3), slices=h*4)
    translate([od/2 - 1, 0, 0])
    circle(r=1.5);
}}

module snap_lock_male() {{
    // The connection between Base and Glass
    difference() {{
        cylinder(h=5, d=Base_Dia-2);
        // Locking groove
        translate([0,0,2]) cylinder(h=1, d=Base_Dia-1.5);
    }}
}}

module snap_lock_female() {{
    // Inside the glass
    difference() {{
        cylinder(h=6, d=Base_Dia);
        translate([0,0,-0.1]) cylinder(h=6.2, d=Base_Dia-2);
    }}
    // Locking ridge
    translate([0,0,2]) 
    difference() {{
        cylinder(h=1, d=Base_Dia-2);
        cylinder(h=1, d=Base_Dia-3);
    }}
}}

// 1. THE POWER BASE
module part_base() {{
    color("#333") 
    difference() {{
        union() {{
            cylinder(h=Base_Height, d=Base_Dia);
            translate([0,0,2]) screw_thread(Base_Dia, Base_Height-10);
            translate([0,0,Base_Height]) snap_lock_male();
        }}
        
        // BATTERY CAVITY
        translate([0,0,2]) {{
            if ("{batt}" == "AAA (x2) - 3V") {{
                translate([Batt_Dia/1.8, 0, 0]) cylinder(h=Batt_Height+5, d=Batt_Dia+0.5);
                translate([-Batt_Dia/1.8, 0, 0]) cylinder(h=Batt_Height+5, d=Batt_Dia+0.5);
                // Wiring channel between
                cube([Batt_Dia*2, 2, Batt_Height], center=true);
            }} else {{
                cylinder(h=Batt_Height+5, d=Batt_Dia+0.5);
            }}
        }}
        
        // Switch Hole (Bottom)
        translate([0,0,-1]) cylinder(h=4, d=6);
    }}
}}

// 2. THE DIFFUSER SHELL
module part_glass() {{
    color("White", 0.3)
    translate([0,0,Base_Height]) 
    union() {{
        difference() {{
            // Outer Shape
            hull() {{
                translate([0,0,5]) cylinder(h=1, d=Base_Dia);
                if ("{shape}" == "Globe (G25)") {{
                    translate([0,0,45]) sphere(d=80);
                }} else if ("{shape}" == "Edison (ST64)") {{
                    translate([0,0,60]) sphere(d=64);
                    translate([0,0,20]) cylinder(h=40, d=Base_Dia);
                }} else if ("{shape}" == "Tube (T45)") {{
                    translate([0,0,80]) sphere(d=45);
                    cylinder(h=80, d=45);
                }} else {{
                    // Standard A19
                    translate([0,0,35]) sphere(d=60);
                    cylinder(h=20, d=Base_Dia);
                }}
            }}
            
            // Inner Hollow (Wall Thickness)
            hull() {{
                translate([0,0,5]) cylinder(h=1, d=Base_Dia-4);
                if ("{shape}" == "Globe (G25)") {{
                    translate([0,0,45]) sphere(d=76);
                }} else if ("{shape}" == "Edison (ST64)") {{
                    translate([0,0,60]) sphere(d=60);
                    translate([0,0,20]) cylinder(h=40, d=Base_Dia-4);
                }} else if ("{shape}" == "Tube (T45)") {{
                    translate([0,0,80]) sphere(d=41);
                    cylinder(h=80, d=41);
                }} else {{
                    translate([0,0,35]) sphere(d=56);
                    cylinder(h=20, d=Base_Dia-4);
                }}
            }}
        }}
        
        // Snap Interface
        translate([0,0,0]) snap_lock_female();
    }}
}}

// 3. THE FILAMENT CHASSIS
module part_chassis() {{
    color("Orange")
    translate([0,0,Base_Height+5])
    union() {{
        // Plug Base
        cylinder(h=3, d=Base_Dia-6);
        
        // Structure
        if ("{fil}" == "Double Helix") {{
            linear_extrude(height=50, twist=360) translate([6,0]) circle(r=1.5);
            linear_extrude(height=50, twist=-360) translate([6,0]) circle(r=1.5);
        }} else if ("{fil}" == "Zig-Zag") {{
            for(i=[0:10:40]) {{
                translate([0,0,i]) rotate([45,0,0]) cube([12,2,2], center=true);
                translate([0,0,i+5]) rotate([-45,0,0]) cube([12,2,2], center=true);
            }}
        }} else if ("{fil}" == "DNA Spiral") {{
             linear_extrude(height=50, twist=180) translate([0,0]) square([12,2], center=true);
        }} else {{
            cylinder(h=50, d=3);
            translate([0,0,50]) sphere(d=5);
        }}
    }}
}}

// --- PRINT LAYOUT ---
// Parts are spaced out for easy slicing
translate([-50, 0, 0]) part_base();
translate([50, 0, 0]) part_glass();
translate([0, 50, 0]) part_chassis();
"""

if __name__ == "__main__":
    root = tk.Tk()
    app = BulbArchitectApp(root)
    root.mainloop()