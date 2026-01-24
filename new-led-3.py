import tkinter as tk
from tkinter import ttk, messagebox
import os
import uuid

# ==========================================
#   LUMINARY V4: WIRELESS MONOLITH
#   Focus: CR2032 Integration + Canvas Clamping
# ==========================================

class LuminaryWirelessApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Luminary V4 - Wireless Art Light")
        self.root.geometry("600x750")
        self.root.configure(bg="#1a1a1a")

        self.export_dir = os.path.join(os.path.expanduser("~"), "Desktop", "Luminary_V4_Wireless")
        if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)

        self.setup_ui()

    def setup_ui(self):
        tk.Label(self.root, text="WIRELESS LUMINARY V4", font=("Impact", 24), bg="#1a1a1a", fg="#00E676").pack(pady=20)
        
        frame = tk.Frame(self.root, bg="#1a1a1a")
        frame.pack(fill=tk.BOTH, padx=40)

        # 1. MODULE SIZE
        self.lbl(frame, "1. MODULE SIZE")
        self.width = self.add_scale(frame, "Width (mm)", 30.0, 25, 50)
        self.height = self.add_scale(frame, "Height/Thick (mm)", 14.0, 10, 25) # Needs room for battery

        # 2. LIGHT ANGLE
        self.lbl(frame, "2. LIGHT THROW")
        # Controls how "down" the light points
        self.angle = self.add_scale(frame, "Wash Angle (Degrees)", 15.0, 0, 45) 
        
        # 3. MAGNETS
        self.lbl(frame, "3. MAGNET CLAMP")
        self.mag_d = self.add_scale(frame, "Magnet Diameter (mm)", 10.0, 5, 20)

        # GENERATE
        tk.Button(self.root, text="GENERATE WIRELESS SYSTEM", command=self.generate, 
                 bg="#00E676", fg="black", font=("Arial", 12, "bold"), height=3).pack(fill=tk.X, padx=40, pady=40)

    def lbl(self, p, t):
        tk.Label(p, text=t, bg="#1a1a1a", fg="#03A9F4", font=("Segoe UI", 11, "bold")).pack(anchor="w", pady=(20, 5))

    def add_scale(self, p, label, default, min_v, max_v):
        tk.Label(p, text=label, bg="#1a1a1a", fg="white").pack(anchor="w")
        var = tk.DoubleVar(value=default)
        tk.Scale(p, from_=min_v, to=max_v, resolution=0.5, variable=var, orient=tk.HORIZONTAL, bg="#222", fg="#00E676", highlightthickness=0).pack(fill=tk.X)
        return var

    def generate(self):
        uid = str(uuid.uuid4())[:4]
        
        # 1. Front Module (Battery + LED)
        with open(os.path.join(self.export_dir, f"Wireless_Engine_{uid}.scad"), "w") as f:
            f.write(self.get_scad("engine"))
            
        # 2. Rear Anchor (Behind Canvas)
        with open(os.path.join(self.export_dir, f"Canvas_Anchor_{uid}.scad"), "w") as f:
            f.write(self.get_scad("anchor"))

        # 3. Battery Cap (Lid)
        with open(os.path.join(self.export_dir, f"Battery_Lid_{uid}.scad"), "w") as f:
            f.write(self.get_scad("lid"))

        os.startfile(self.export_dir)

    def get_scad(self, part):
        w = self.width.get()
        h = self.height.get()
        angle = self.angle.get()
        mag = self.mag_d.get()
        
        header = f"""
// ==========================================
//   LUMINARY V4: WIRELESS SYSTEM
//   Power: CR2032 (Internal)
//   Mount: Magnetic Sandwich
// ==========================================
$fn = 60;
Width = {w};
Length = 50; // Standard length for battery + LED
Height = {h};
Wash_Angle = {angle};
Mag_Dia = {mag};
Bat_Dia = 20.5; // CR2032 Tolerance
Bat_Thick = 3.5;

module smooth_brick(x,y,z,r) {{
    hull() {{
        translate([r,r,0]) cylinder(h=z,r=r);
        translate([x-r,r,0]) cylinder(h=z,r=r);
        translate([x-r,y-r,0]) cylinder(h=z,r=r);
        translate([r,y-r,0]) cylinder(h=z,r=r);
    }}
}}
"""
        
        if part == "engine":
            return header + """
// === PART 1: THE ENGINE (Front Unit) ===
module wireless_engine() {
    difference() {
        // MAIN BODY
        smooth_brick(Width, Length, Height, 3);
        
        // 1. MAGNET SOCKET (Rear Face)
        // Connects to the Anchor through canvas
        translate([Width/2, Length-10, -0.1])
            cylinder(h=3, d=Mag_Dia + 0.4);
            
        // 2. BATTERY BAY (CR2032)
        // Slotted in the center
        translate([Width/2, Length/2, Height - 2.5])
            cylinder(h=4, d=Bat_Dia);
        // Finger access / Wire path
        translate([Width/2, Length/2, Height - 2.5])
            cube([10, Bat_Dia+10, 4], center=true);
            
        // 3. LED TUNNEL (Front)
        // Angled to wash the canvas
        translate([-1, 5, Height/2]) 
            rotate([0, Wash_Angle, 0]) // Tilt the light path
            cube([Width+2, 10, 6]); // The Light Slot
            
        // 4. INTERNAL WIRING TUNNEL
        // Connects Battery to LED
        hull() {
            translate([Width/2, Length/2, Height-3]) sphere(d=3); // At Battery
            translate([Width/2, 5, Height/2]) sphere(d=3); // At LED
        }
    }
}
wireless_engine();
"""
        elif part == "anchor":
            return header + """
// === PART 2: THE ANCHOR (Rear Unit) ===
// Goes BEHIND the canvas
module canvas_anchor() {
    difference() {
        smooth_brick(Width, 30, 3, 3); // Thin plate
        
        // MAGNET SOCKET
        // Matches the engine's magnet position
        translate([Width/2, 15, -0.1])
            cylinder(h=3.5, d=Mag_Dia + 0.4);
            
        // TEXTURE (Grip)
        for(i=[0:4:Width]) {
            translate([i, 0, 3]) rotate([45,0,0]) cube([1, 30, 1]);
        }
    }
}
canvas_anchor();
"""
        elif part == "lid":
             return header + """
// === PART 3: BATTERY LID ===
// Simple friction fit cap
module battery_lid() {
    cylinder(h=1.5, d=Bat_Dia - 0.2); // Fits in hole
    translate([0,0,1.5]) cylinder(h=1, d=Bat_Dia + 2); // Rim
    // Slot for coin twist
    translate([0,0,2.5]) cube([10, 2, 2], center=true);
}
battery_lid();
"""

if __name__ == "__main__":
    root = tk.Tk()
    app = LuminaryWirelessApp(root)
    root.mainloop()