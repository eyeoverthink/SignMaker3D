import tkinter as tk
from tkinter import ttk, messagebox
import os
import uuid

# ==========================================
#   CANVAS LUMINARY V3: THE PHOTON KEY
#   Concept: Sealed "Keychain Light" Module
#   Focus: Light Control, Wire Routing, Enclosure
# ==========================================

class PhotonKeyApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Luminary V3 - The Photon Key")
        self.root.geometry("600x750")
        self.root.configure(bg="#111")

        self.export_dir = os.path.join(os.path.expanduser("~"), "Desktop", "Luminary_V3_Key")
        if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)

        self.setup_ui()

    def setup_ui(self):
        tk.Label(self.root, text="THE PHOTON KEY", font=("Impact", 24), bg="#111", fg="#00E676").pack(pady=20)
        tk.Label(self.root, text="Sealed LED Enclosure System", font=("Arial", 10), bg="#111", fg="#888").pack(pady=(0,20))
        
        frame = tk.Frame(self.root, bg="#111")
        frame.pack(fill=tk.BOTH, padx=40)

        # 1. MODULE SIZE
        self.lbl(frame, "1. MODULE DIMENSIONS")
        self.width = self.add_scale(frame, "Width (mm)", 25.0, 15, 50)
        self.length = self.add_scale(frame, "Length (mm)", 50.0, 30, 80)
        self.thick = self.add_scale(frame, "Thickness (mm)", 12.0, 8, 20)

        # 2. LIGHT ENGINE
        self.lbl(frame, "2. LIGHT CONTROL")
        self.led_w = self.add_scale(frame, "LED Strip Width (mm)", 10.0, 5, 15)
        # The Aperture controls the "Laser" effect. Smaller = Sharper.
        self.aperture = self.add_scale(frame, "Beam Aperture Height (mm)", 4.0, 1.0, 10.0) 
        
        # 3. MAGNET BASE
        self.lbl(frame, "3. MOUNTING")
        self.mag_d = self.add_scale(frame, "Magnet Diameter (mm)", 10.0, 5, 20)

        # GENERATE
        tk.Button(self.root, text="GENERATE KEYCHAIN PARTS", command=self.generate, 
                 bg="#00E676", fg="black", font=("Arial", 12, "bold"), height=3).pack(fill=tk.X, padx=40, pady=40)

    def lbl(self, p, t):
        tk.Label(p, text=t, bg="#111", fg="#03A9F4", font=("Segoe UI", 11, "bold")).pack(anchor="w", pady=(20, 5))

    def add_scale(self, p, label, default, min_v, max_v):
        tk.Label(p, text=label, bg="#111", fg="white").pack(anchor="w")
        var = tk.DoubleVar(value=default)
        tk.Scale(p, from_=min_v, to=max_v, resolution=0.5, variable=var, orient=tk.HORIZONTAL, bg="#222", fg="#00E676", highlightthickness=0).pack(fill=tk.X)
        return var

    def generate(self):
        uid = str(uuid.uuid4())[:4]
        
        # 1. The Main Housing (Holds LED + Wire Path)
        with open(os.path.join(self.export_dir, f"Photon_Body_{uid}.scad"), "w") as f:
            f.write(self.get_scad("body"))
            
        # 2. The Back Plate (Holds Magnet + Snaps on)
        with open(os.path.join(self.export_dir, f"Photon_Base_{uid}.scad"), "w") as f:
            f.write(self.get_scad("base"))

        os.startfile(self.export_dir)

    def get_scad(self, part):
        w = self.width.get()
        l = self.length.get()
        h = self.thick.get()
        led = self.led_w.get()
        beam = self.aperture.get()
        mag = self.mag_d.get()
        
        header = f"""
// ==========================================
//   LUMINARY V3: THE PHOTON KEY
//   Concept: Sealed Enclosure
// ==========================================
$fn = 60;
// DIMENSIONS
Width = {w};
Length = {l};
Height = {h};
LED_W = {led};
Beam_H = {beam};
Mag_D = {mag};
Radius = 4; // Corner rounding

// --- SHAPE LOGIC ---
module smooth_box(x, y, z) {{
    hull() {{
        translate([Radius, Radius, 0]) cylinder(h=z, r=Radius);
        translate([x-Radius, Radius, 0]) cylinder(h=z, r=Radius);
        translate([x-Radius, y-Radius, 0]) cylinder(h=z, r=Radius);
        translate([Radius, y-Radius, 0]) cylinder(h=z, r=Radius);
    }}
}}
"""
        
        if part == "body":
            return header + """
// === PART 1: THE BODY (The Sealed Housing) ===

module photon_body() {
    difference() {
        // 1. MAIN SHELL
        smooth_box(Width, Length, Height);
        
        // 2. LED CAVITY (The "Coffin")
        // Buried deep inside. Only opens to the bottom.
        translate([2, 5, 2]) // 2mm Wall thickness everywhere
            cube([Width-4, Length-10, Height]); // Opens to the back (for Base to cover)
            
        // 3. THE "LASER" APERTURE (Light Exit)
        // A narrow slit at the bottom face
        translate([2, -1, 3]) // Positioned to align with LED
            cube([Width-4, 10, Beam_H]); 
            
        // 4. LIGHT TRAP WIRE CHANNEL (Top Exit)
        // Bends 90 degrees so light cant escape
        // Vertical shaft
        translate([Width/2, Length-5, Height/2])
            cylinder(h=Height, d=4, center=true);
        // Horizontal connection to LED cavity
        translate([Width/2, Length-8, Height/2])
            rotate([90,0,0])
            cylinder(h=10, d=4);
            
        // 5. SNAP FIT RECESS (For Base Plate)
        translate([1, 1, Height-2])
            cube([Width-2, Length-2, 3]);
    }
}

photon_body();
"""
        elif part == "base":
            return header + """
// === PART 2: THE BASE PLATE (Magnet Mount) ===

module photon_base() {
    difference() {
        // 1. THE PLATE
        union() {
            // The Cap (Sits flush on back)
            smooth_box(Width, Length, 2);
            
            // The Plug (Snaps INTO the body)
            translate([1.1, 1.1, 2])
                cube([Width-2.2, Length-2.2, 1.5]);
        }
        
        // 2. MAGNET SOCKET
        // Recessed into the plate
        translate([Width/2, Length/2, -0.1])
            cylinder(h=3, d=Mag_D + 0.4);
            
        // 3. WIRE PASSTHROUGH (Optional backup exit)
        // translate([Width/2, Length-5, -1]) cylinder(h=10, d=4);
    }
}

photon_base();
"""

if __name__ == "__main__":
    root = tk.Tk()
    app = PhotonKeyApp(root)
    root.mainloop()