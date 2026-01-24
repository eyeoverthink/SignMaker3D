import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import os
import uuid

# ==========================================
#   BULB ARCHITECT V4: MINIMALIST CLAMPS
#   Logic: Sparse Anchors + Maximum Visibility
# ==========================================

class BulbArchitectApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Bulb Architect V4 - Minimalist System")
        self.root.geometry("700x800")
        self.root.configure(bg="#1a1a1a")

        self.export_dir = os.path.join(os.path.expanduser("~"), "Desktop", "Bulb_Factory_V4")
        if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)

        self.setup_ui()

    def setup_ui(self):
        header = tk.Label(self.root, text="BULB ARCHITECT V4", font=("Segoe UI", 18, "bold"), bg="#1a1a1a", fg="#00E676")
        header.pack(pady=20)

        main = tk.Frame(self.root, bg="#262626", padx=20, pady=20)
        main.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)

        # 1. LIGHT SOURCE
        self.add_label(main, "1. LIGHT SOURCE (Defines the C-Clamp)")
        self.tech_var = tk.StringVar(value="Neon LED Tube (6mm)")
        tech_opts = [
            "EL Wire (2.3mm)", 
            "LED Filament (2mm)",
            "Neon LED Tube (6mm)",
            "Neon LED Tube (10mm)"
        ]
        ttk.Combobox(main, textvariable=self.tech_var, values=tech_opts, state="readonly", font=("Arial", 11)).pack(fill=tk.X, pady=5)

        # 2. DIFFUSION
        self.add_label(main, "2. SHELL DIFFUSION")
        self.pattern_var = tk.StringVar(value="Phi-Ribs (Golden Angle)")
        pat_opts = ["Clear (No Pattern)", "Phi-Ribs (Golden Angle)", "Hex-Lattice (Structural)"]
        ttk.Combobox(main, textvariable=self.pattern_var, values=pat_opts, state="readonly", font=("Arial", 11)).pack(fill=tk.X, pady=5)

        # 3. SHAPE
        self.add_label(main, "3. BULB FORM")
        self.shape_var = tk.StringVar(value="Edison (ST64)")
        shape_opts = ["Standard (A19)", "Globe (G25)", "Edison (ST64)", "Tube (T45)"]
        ttk.Combobox(main, textvariable=self.shape_var, values=shape_opts, state="readonly", font=("Arial", 11)).pack(fill=tk.X, pady=5)

        # 4. POWER
        self.add_label(main, "4. POWER CORE")
        self.batt_var = tk.StringVar(value="AAA (x2) - 3V")
        batt_opts = ["CR2032 (Coin)", "AAA (x2) - 3V", "18650 (Lithium)"]
        ttk.Combobox(main, textvariable=self.batt_var, values=batt_opts, state="readonly", font=("Arial", 11)).pack(fill=tk.X, pady=5)

        # GENERATE
        btn = tk.Button(self.root, text="GENERATE MINIMALIST ASSEMBLY", command=self.generate, 
                       bg="#00E676", fg="black", font=("Arial", 12, "bold"), height=2)
        btn.pack(fill=tk.X, padx=40, pady=20)

    def add_label(self, parent, text):
        tk.Label(parent, text=text, bg="#262626", fg="#03A9F4", font=("Segoe UI", 10, "bold")).pack(anchor="w", pady=(15, 2))

    def generate(self):
        unique_id = str(uuid.uuid4())[:6]
        filename = f"Bulb_V4_{unique_id}.scad"
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
        # Clip Sizing Logic
        clip_id = 2.0 # Inner Diameter
        if "6mm" in tech: clip_id = 6.0
        if "10mm" in tech: clip_id = 10.0
        if "2.3mm" in tech: clip_id = 2.3

        # Clamp Wall Thickness (Minimalist)
        wall = 1.2 

        return f"""
// ==========================================
//   BULB ARCHITECT V4: MINIMALIST
//   Logic: C-Clamps + Golden Angle Spacing
// ==========================================

$fn = 60;

// --- PARAMETERS ---
Clip_ID = {clip_id};
Clamp_Wall = {wall};
Bulb_Shape = "{shape}";
Pattern_Type = "{pattern}";
Base_Dia = 30;

// --- MODULES ---

module c_clamp() {{
    // The "Ghost" Clamp: Minimalist C-Snap
    difference() {{
        // Outer Shell
        cylinder(h=4, d=Clip_ID + (Clamp_Wall*2));
        
        // Inner Hole (The Light)
        translate([0,0,-1]) cylinder(h=6, d=Clip_ID);
        
        // The "C" Cutout (Side Opening for Snap-In)
        // Opening is slightly smaller than diameter to create "Snap"
        translate([Clip_ID/2, 0, 2]) 
            cube([Clip_ID, Clip_ID * 0.85, 6], center=true);
    }}
    
    // Tiny Connection Stem to Spine
    translate([-Clip_ID/2 - 1, 0, 2])
        cube([2, 2, 4], center=true);
}}

// 1. THE CHASSIS (Central Spine)
module chassis() {{
    color("Orange")
    translate([0,0,40])
    union() {{
        // Central Spine (The Structural Core)
        // A thin, elegant helix that hides in the center
        linear_extrude(height=55, twist=180)
            translate([0,0]) circle(r=2.5); // 5mm thick spine
            
        // THE CLAMPS (Golden Angle Distribution)
        // Only placing clips where needed, rotating naturally
        for (i = [0 : 72 : 360]) {{ // One clip every 72 degrees (5 per turn)
            rotate([0, 0, i]) 
            translate([0, 0, i/6.5]) // Height progress
            rotate([0, 0, 0]) // Align to spine
            translate([8, 0, 0]) // Push out to radius
            rotate([0, 90, 0]) // Orient C-Clamp vertical
            c_clamp();
        }}
        
        // Base Connector
        translate([0,0,-10]) 
        difference() {{
            cylinder(h=10, d=Base_Dia-4);
            // Wire Path
            cylinder(h=12, d=4);
        }}
    }}
}}

// 2. THE SHELL (Standard Scott Diffusion)
module shell() {{
    color("White", 0.3)
    translate([0,0,30]) 
    difference() {{
        // Outer Shape
        hull() {{
            translate([0,0,5]) cylinder(h=1, d=Base_Dia);
            if (Bulb_Shape == "Globe (G25)") translate([0,0,45]) sphere(d=80);
            else if (Bulb_Shape == "Tube (T45)") {{ translate([0,0,80]) sphere(d=45); cylinder(h=80, d=45); }}
            else {{ translate([0,0,35]) sphere(d=60); cylinder(h=20, d=Base_Dia); }}
        }}
        
        // Inner Hollow
        hull() {{
            translate([0,0,5]) cylinder(h=1, d=Base_Dia-4);
            if (Bulb_Shape == "Globe (G25)") translate([0,0,45]) sphere(d=76);
            else if (Bulb_Shape == "Tube (T45)") {{ translate([0,0,80]) sphere(d=41); cylinder(h=80, d=41); }}
            else {{ translate([0,0,35]) sphere(d=56); cylinder(h=20, d=Base_Dia-4); }}
        }}

        // --- PATTERN SUBTRACTION ---
        if (Pattern_Type == "Phi-Ribs (Golden Angle)") {{
            for(i=[0:137.5:3600]) {{
                rotate([0,0,i]) translate([28,0,10]) cylinder(h=100, d=2);
            }}
        }} else if (Pattern_Type == "Hex-Lattice (Structural)") {{
            for(z=[10:15:80]) {{
                for(r=[0:60:360]) {{
                    rotate([0,0,r + (z/10)*30]) translate([0,0,z]) rotate([90,0,0]) cylinder(h=100, d=6);
                }}
            }}
        }}
        
        // Thread Interface (Female)
        translate([0,0,-1]) cylinder(h=11, d=Base_Dia);
    }}
}}

// 3. THE BASE
module base() {{
    color("#222")
    difference() {{
        union() {{
            cylinder(h=30, d=Base_Dia);
            // Simple friction lock for now to save poly count
            translate([0,0,28]) cylinder(h=2, d=Base_Dia-2); 
        }}
        
        // Battery Cavity
        translate([0,0,2]) {{
            if ("{batt}" == "18650 (Lithium)") cylinder(h=70, d=19);
            else if ("{batt}" == "AAA (x2) - 3V") {{
                translate([6,0,0]) cylinder(h=50, d=11);
                translate([-6,0,0]) cylinder(h=50, d=11);
            }} else cylinder(h=30, d=21);
        }}
        
        // Wire Path
        translate([0,0,28]) cylinder(h=4, d=4);
    }}
}}

// LAYOUT
translate([-50, 0, 0]) base();
translate([50, 0, 0]) shell();
translate([0, 50, 0]) chassis();
"""

if __name__ == "__main__":
    root = tk.Tk()
    app = BulbArchitectApp(root)
    root.mainloop()