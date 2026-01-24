import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import os
import uuid

# ==========================================
#   BULB ARCHITECT V3: FUNCTIONAL CHASSIS
#   Logic: Tech-Specific Clips + True Diffusion
# ==========================================

class BulbArchitectApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Bulb Architect V3 - Functional Systems")
        self.root.geometry("700x800")
        self.root.configure(bg="#1a1a1a")

        self.export_dir = os.path.join(os.path.expanduser("~"), "Desktop", "Bulb_Factory_V3")
        if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)

        self.setup_ui()

    def setup_ui(self):
        header = tk.Label(self.root, text="BULB ARCHITECT V3", font=("Segoe UI", 18, "bold"), bg="#1a1a1a", fg="#00E676")
        header.pack(pady=20)

        main = tk.Frame(self.root, bg="#262626", padx=20, pady=20)
        main.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)

        # 1. LIGHT SOURCE (Defines the Clips)
        self.add_label(main, "1. LIGHT SOURCE (Generates Clips)")
        self.tech_var = tk.StringVar(value="LED Filament (2mm)")
        tech_opts = [
            "EL Wire (2.3mm) - Spiral Clips", 
            "LED Filament (2mm) - Tension Mount",
            "Neon LED Tube (6mm) - C-Clips",
            "Neon LED Tube (10mm) - C-Clips", 
            "WS2812 Strip (10mm Flat) - Backing"
        ]
        ttk.Combobox(main, textvariable=self.tech_var, values=tech_opts, state="readonly", font=("Arial", 11)).pack(fill=tk.X, pady=5)

        # 2. DIFFUSION ALGORITHM
        self.add_label(main, "2. SHELL DIFFUSION (The Algorithm)")
        self.pattern_var = tk.StringVar(value="Phi-Ribs (Golden Angle)")
        pat_opts = ["Clear (No Pattern)", "Phi-Ribs (Golden Angle)", "Hex-Lattice (Structural)", "Voronoi (Organic)"]
        ttk.Combobox(main, textvariable=self.pattern_var, values=pat_opts, state="readonly", font=("Arial", 11)).pack(fill=tk.X, pady=5)

        # 3. BULB SHAPE
        self.add_label(main, "3. BULB FORM FACTOR")
        self.shape_var = tk.StringVar(value="Edison (ST64)")
        shape_opts = ["Standard (A19)", "Globe (G25)", "Edison (ST64)", "Tube (T45)"]
        ttk.Combobox(main, textvariable=self.shape_var, values=shape_opts, state="readonly", font=("Arial", 11)).pack(fill=tk.X, pady=5)

        # 4. POWER CORE
        self.add_label(main, "4. POWER CORE")
        self.batt_var = tk.StringVar(value="AAA (x2) - 3V")
        batt_opts = ["CR2032 (Coin)", "AAA (x2) - 3V", "18650 (Lithium)"]
        ttk.Combobox(main, textvariable=self.batt_var, values=batt_opts, state="readonly", font=("Arial", 11)).pack(fill=tk.X, pady=5)

        # GENERATE
        btn = tk.Button(self.root, text="GENERATE FUNCTIONAL ASSEMBLY", command=self.generate, 
                       bg="#00E676", fg="black", font=("Arial", 12, "bold"), height=2)
        btn.pack(fill=tk.X, padx=40, pady=20)

    def add_label(self, parent, text):
        tk.Label(parent, text=text, bg="#262626", fg="#03A9F4", font=("Segoe UI", 10, "bold")).pack(anchor="w", pady=(15, 2))

    def generate(self):
        unique_id = str(uuid.uuid4())[:6]
        filename = f"Bulb_V3_{unique_id}.scad"
        filepath = os.path.join(self.export_dir, filename)

        scad_code = self.get_scad_logic(
            self.tech_var.get(),
            self.pattern_var.get(),
            self.shape_var.get(),
            self.batt_var.get()
        )
        
        with open(filepath, "w") as f:
            f.write(scad_code)
        
        os.startfile(self.export_dir)

    def get_scad_logic(self, tech, pattern, shape, batt):
        # Determine Clip Dimensions
        clip_dia = 2.0
        if "6mm" in tech: clip_dia = 6.2
        if "10mm" in tech: clip_dia = 10.5
        if "2.3mm" in tech: clip_dia = 2.4

        # Is it a flat strip?
        is_flat = "Strip" in tech

        return f"""
// ==========================================
//   BULB ARCHITECT V3: FUNCTIONAL
//   Scott Protocol: Logic > Shape
// ==========================================

$fn = 60;

// --- PARAMETERS ---
Clip_Dia = {clip_dia};
Is_Flat_Strip = {"true" if is_flat else "false"};
Bulb_Shape = "{shape}";
Pattern_Type = "{pattern}";
Base_Dia = 30;

// --- MODULES ---

module thread_standard(d, h, pitch) {{
    linear_extrude(height=h, twist=-360*(h/pitch), slices=h*4)
    translate([d/2, 0, 0])
    circle(r=1.2);
}}

module clip_shape() {{
    if (Is_Flat_Strip) {{
        // Holder for WS2812 Strip (10mm)
        difference() {{
            cube([12, 4, 10], center=true);
            cube([10.5, 2, 11], center=true); // Slot
        }}
    }} else {{
        // C-Clip for Tubes/Wires
        difference() {{
            cylinder(h=5, d=Clip_Dia+3);
            translate([0,0,-1]) cylinder(h=7, d=Clip_Dia);
            translate([Clip_Dia/2, 0, 0]) cube([Clip_Dia, Clip_Dia, 10], center=true); // Opening
        }}
    }}
}}

// 1. THE CHASSIS (The Smart Core)
module chassis() {{
    color("Orange")
    translate([0,0,40])
    union() {{
        // Central Spine or Helix
        if (Is_Flat_Strip) {{
            // Flat Spiral for LED Strip
            linear_extrude(height=50, twist=360) 
            translate([8,0,0]) rotate([90,0,0]) square([2, 12], center=true);
        }} else {{
            // Helix for Tubes/Wires
            for (i = [0:20:360]) {{
                rotate([0,0,i]) 
                translate([10, 0, i/7]) 
                rotate([0, 90, i]) 
                clip_shape();
            }}
            // Central Support
            cylinder(h=55, d=6);
        }}
        
        // Base Connector (Screw Thread Male)
        translate([0,0,-10]) 
        union() {{
            cylinder(h=10, d=Base_Dia-4);
            thread_standard(Base_Dia-4, 10, 3);
        }}
    }}
}}

// 2. THE SHELL (Scott Diffusion)
module shell() {{
    color("White", 0.4)
    translate([0,0,30]) 
    difference() {{
        // Outer Shape
        hull() {{
            translate([0,0,5]) cylinder(h=1, d=Base_Dia);
            if (Bulb_Shape == "Globe (G25)") translate([0,0,45]) sphere(d=80);
            else if (Bulb_Shape == "Tube (T45)") {{ translate([0,0,80]) sphere(d=45); cylinder(h=80, d=45); }}
            else {{ translate([0,0,35]) sphere(d=60); cylinder(h=20, d=Base_Dia); }} // A19/Edison
        }}
        
        // Inner Hollow
        hull() {{
            translate([0,0,5]) cylinder(h=1, d=Base_Dia-4);
            if (Bulb_Shape == "Globe (G25)") translate([0,0,45]) sphere(d=76);
            else if (Bulb_Shape == "Tube (T45)") {{ translate([0,0,80]) sphere(d=41); cylinder(h=80, d=41); }}
            else {{ translate([0,0,35]) sphere(d=56); cylinder(h=20, d=Base_Dia-4); }}
        }}

        // --- THE ALGORITHM (Pattern Subtraction) ---
        if (Pattern_Type == "Phi-Ribs (Golden Angle)") {{
            for(i=[0:137.5:3600]) {{
                rotate([0,0,i]) translate([28,0,10]) cylinder(h=100, d=2);
            }}
        }} else if (Pattern_Type == "Hex-Lattice (Structural)") {{
            for(z=[10:10:80]) {{
                for(r=[0:60:360]) {{
                    rotate([0,0,r + (z/10)*30]) translate([0,0,z]) rotate([90,0,0]) cylinder(h=100, d=5);
                }}
            }}
        }}
        
        // Thread Interface (Female)
        translate([0,0,-1]) cylinder(h=11, d=Base_Dia);
    }}
}}

// 3. THE BASE (Battery Housing)
module base() {{
    color("#222")
    difference() {{
        union() {{
            cylinder(h=30, d=Base_Dia);
            // Internal Thread for Chassis
            translate([0,0,25]) difference() {{
                cylinder(h=10, d=Base_Dia);
                translate([0,0,0]) cylinder(h=10, d=Base_Dia-4); // Thread cutout
            }}
        }}
        
        // Battery Cavity
        translate([0,0,2]) {{
            if ("{batt}" == "18650 (Lithium)") cylinder(h=70, d=19);
            else if ("{batt}" == "AAA (x2) - 3V") {{
                translate([6,0,0]) cylinder(h=50, d=11);
                translate([-6,0,0]) cylinder(h=50, d=11);
            }} else cylinder(h=30, d=21); // Coin
        }}
    }}
}}

// --- RENDER LAYOUT ---
translate([-50, 0, 0]) base();
translate([50, 0, 0]) shell();
translate([0, 50, 0]) chassis();
"""

if __name__ == "__main__":
    root = tk.Tk()
    app = BulbArchitectApp(root)
    root.mainloop()