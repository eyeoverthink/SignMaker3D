import tkinter as tk
from tkinter import ttk, messagebox
import os
import uuid
import math

# ==========================================
#   LUMINARY V22: THE PHOTON WEAVER
#   Concept: Structural Lattice (Shoelace Logic)
#   Light Source: Flexible Filament Wrap
# ==========================================

class PhotonWeaverApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Luminary V22 - The Photon Weaver")
        self.root.geometry("600x800")
        self.root.configure(bg="#050505") # Pitch black for light focus

        self.export_dir = os.path.join(os.path.expanduser("~"), "Desktop", "Luminary_V22_Weaver")
        if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)

        self.setup_ui()

    def setup_ui(self):
        tk.Label(self.root, text="THE PHOTON WEAVER", font=("Impact", 24), bg="#050505", fg="#00E676").pack(pady=20)
        
        frame = tk.Frame(self.root, bg="#050505")
        frame.pack(fill=tk.BOTH, padx=40)

        # 1. THE LATTICE (Shoelaces)
        self.lbl(frame, "1. LATTICE STRUCTURE")
        self.strands = self.add_scale(frame, "Strand Count (Density)", 12, 6, 36)
        self.twist = self.add_scale(frame, "Twist Angle (Kaleidoscope)", 120, 45, 360)
        self.thick = self.add_scale(frame, "Strand Thickness (mm)", 2.0, 0.8, 4.0)

        # 2. THE CORE (Filament Wrap)
        self.lbl(frame, "2. LIGHT SPOOL")
        self.spool_d = self.add_scale(frame, "Spool Diameter (mm)", 20, 10, 40)
        
        # 3. POWER BASE (V4 Standard)
        self.lbl(frame, "3. POWER MODULE")
        self.mag_d = self.add_scale(frame, "Magnet Diameter (mm)", 10.0, 5, 20)

        # GENERATE
        tk.Button(self.root, text="WEAVE LIGHT SYSTEM", command=self.generate, 
                 bg="#00E676", fg="black", font=("Arial", 12, "bold"), height=3).pack(fill=tk.X, padx=40, pady=40)

    def lbl(self, p, t):
        tk.Label(p, text=t, bg="#050505", fg="#03A9F4", font=("Segoe UI", 11, "bold")).pack(anchor="w", pady=(20, 5))

    def add_scale(self, p, label, default, min_v, max_v):
        tk.Label(p, text=label, bg="#050505", fg="white").pack(anchor="w")
        var = tk.DoubleVar(value=default)
        tk.Scale(p, from_=min_v, to=max_v, resolution=1, variable=var, orient=tk.HORIZONTAL, bg="#111", fg="#00E676", highlightthickness=0).pack(fill=tk.X)
        return var

    def generate(self):
        uid = str(uuid.uuid4())[:4]
        
        # 1. The Lattice Shell (The Art)
        with open(os.path.join(self.export_dir, f"Weaver_Shell_{uid}.scad"), "w") as f:
            f.write(self.get_scad("shell"))
            
        # 2. The Light Spool (The Core)
        with open(os.path.join(self.export_dir, f"Weaver_Spool_{uid}.scad"), "w") as f:
            f.write(self.get_scad("spool"))
            
        # 3. The Power Base (The Anchor)
        with open(os.path.join(self.export_dir, f"Weaver_Base_{uid}.scad"), "w") as f:
            f.write(self.get_scad("base"))

        os.startfile(self.export_dir)

    def get_scad(self, part):
        strands = int(self.strands.get())
        twist = self.twist.get()
        thick = self.thick.get()
        spool = self.spool_d.get()
        mag = self.mag_d.get()
        
        header = f"""
// ==========================================
//   LUMINARY V22: PHOTON WEAVER
//   Logic: Double-Helix Structural Lattice
//   Light: Flexible Filament Wrap
// ==========================================
$fn = 60;
Strands = {strands};
Twist = {twist};
Thickness = {thick};
Spool_Dia = {spool};
Mag_Dia = {mag};
Base_Dia = Spool_Dia + 15;
Height = 60;
"""
        
        if part == "shell":
            return header + """
// === PART 1: THE LATTICE SHELL ===
// The "Shoelaces" that hold the light

module strand_ring(direction) {
    // Generate a ring of twisted strands
    for(i=[0 : 360/Strands : 360]) {
        rotate([0,0,i])
        linear_extrude(height=Height, twist=direction * Twist, slices=100)
        translate([Base_Dia/2, 0])
        circle(d=Thickness); // The "String" profile
    }
}

module weaver_shell() {
    color("Cyan", 0.3)
    union() {
        // 1. CLOCKWISE STRANDS
        strand_ring(1);
        
        // 2. COUNTER-CLOCKWISE STRANDS
        // By opposing the twist, we create a strong woven mesh
        strand_ring(-1);
        
        // 3. TOP CAP (Diffusion Ring)
        translate([0,0,Height])
            rotate_extrude()
            translate([Base_Dia/2, 0])
            circle(d=Thickness*1.5);
            
        // 4. BOTTOM INTERFACE (Solid Ring)
        difference() {
            cylinder(h=5, d=Base_Dia + Thickness*2);
            translate([0,0,-1]) cylinder(h=7, d=Base_Dia - 0.5); // Friction fit to Base
        }
    }
}

weaver_shell();
"""
        elif part == "spool":
            return header + """
// === PART 2: THE LIGHT SPOOL ===
// Wrap your flexible LED filament around this core

module light_spool() {
    color("Orange")
    difference() {
        union() {
            // CENTRAL PILLAR
            cylinder(h=Height-5, d=Spool_Dia);
            
            // BOTTOM FLANGE (Keeps filament on)
            cylinder(h=2, d=Spool_Dia + 4);
            
            // TOP FLANGE
            translate([0,0,Height-7])
            cylinder(h=2, d=Spool_Dia + 4);
        }
        
        // 1. HOLLOW CORE (For Battery/Wire)
        translate([0,0,-1]) cylinder(h=Height+1, d=Spool_Dia - 4);
        
        // 2. FILAMENT PASS-THROUGH
        // Holes to feed the LED ends into the center
        translate([0,0,5]) rotate([90,0,0]) cylinder(h=Spool_Dia+10, d=3, center=true);
        translate([0,0,Height-10]) rotate([90,0,0]) cylinder(h=Spool_Dia+10, d=3, center=true);
    }
}

light_spool();
"""
        elif part == "base":
            return header + """
// === PART 3: THE POWER BASE ===
// Houses the CR2032 and holds the Spool

module power_base() {
    color("#222")
    difference() {
        // MAIN PUCK
        cylinder(h=15, d=Base_Dia);
        
        // 1. SPOOL SOCKET (Top)
        translate([0,0,10])
            cylinder(h=6, d=Spool_Dia - 4 + 0.2); // Tight fit for Spool Core
            
        // 2. BATTERY SLOT (Side Entry CR2032)
        translate([0,0,6])
            cube([Base_Dia+2, 21, 4], center=true);
            
        // 3. MAGNET SOCKET (Bottom)
        translate([0,0,-0.1])
            cylinder(h=3.5, d=Mag_Dia + 0.4);
            
        // 4. SHELL CHANNEL (Rim)
        // The Lattice Shell sits in this groove
        difference() {
            translate([0,0,10]) cylinder(h=6, d=Base_Dia);
            translate([0,0,9]) cylinder(h=7, d=Base_Dia - 1);
        }
    }
}

power_base();
"""

if __name__ == "__main__":
    root = tk.Tk()
    app = PhotonWeaverApp(root)
    root.mainloop()