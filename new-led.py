import tkinter as tk
from tkinter import ttk, messagebox
import os
import uuid

# ==========================================
#   CANVAS LUMINARY V2: THE MONOLITH
#   Focus: "Flat" Aesthetic, Zero Leak, Precision
# ==========================================

class LuminaryMonolithApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Luminary V2 - The Monolith")
        self.root.geometry("550x700")
        self.root.configure(bg="#1a1a1a")

        self.export_dir = os.path.join(os.path.expanduser("~"), "Desktop", "Luminary_V2_Monolith")
        if not os.path.exists(self.export_dir): os.makedirs(self.export_dir)

        self.setup_ui()

    def setup_ui(self):
        tk.Label(self.root, text="THE MONOLITH V2", font=("Impact", 24), bg="#1a1a1a", fg="#00E676").pack(pady=20)
        
        frame = tk.Frame(self.root, bg="#1a1a1a")
        frame.pack(fill=tk.BOTH, padx=40)

        # 1. PROFILE (The "Flat Part" Style)
        self.lbl(frame, "1. THE SHAPE (Match Your Style)")
        self.width = self.add_scale(frame, "Module Width (mm)", 30.0, 15, 60)
        self.length = self.add_scale(frame, "Module Length (mm)", 50.0, 30, 100)
        self.radius = self.add_scale(frame, "Corner Radius (mm)", 5.0, 0, 15)

        # 2. LED CHANNEL (The "Laser" Slot)
        self.lbl(frame, "2. LIGHT ENGINE")
        self.led_w = self.add_scale(frame, "LED Strip Width (mm)", 10.0, 5, 20)
        self.shield_len = self.add_scale(frame, "Light Shield Depth (mm)", 5.0, 0, 15)
        
        # 3. MAGNETS
        self.lbl(frame, "3. CONNECTION")
        self.mag_d = self.add_scale(frame, "Magnet Diameter (mm)", 10.0, 5, 25)

        # GENERATE
        tk.Button(self.root, text="GENERATE MATCHED PAIR", command=self.generate, 
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
        
        # 1. The Light Housing (Thick)
        with open(os.path.join(self.export_dir, f"Monolith_Light_{uid}.scad"), "w") as f:
            f.write(self.get_scad("light"))
            
        # 2. The Anchor Plate (Thin)
        with open(os.path.join(self.export_dir, f"Monolith_Anchor_{uid}.scad"), "w") as f:
            f.write(self.get_scad("anchor"))

        os.startfile(self.export_dir)

    def get_scad(self, part):
        w = self.width.get()
        l = self.length.get()
        r = self.radius.get()
        led = self.led_w.get()
        shield = self.shield_len.get()
        mag = self.mag_d.get()
        
        header = f"""
// ==========================================
//   LUMINARY V2: THE MONOLITH
//   Style: Flat Stack | Logic: Internal Tunnel
// ==========================================
$fn = 60;
Width = {w};
Length = {l};
Radius = {r};
LED_Width = {led};
Shield_Depth = {shield};
Mag_Dia = {mag};

// --- BASE SHAPE (Used for both parts to ensure match) ---
module rounded_rect_shape(h) {{
    hull() {{
        translate([Radius, Radius, 0]) cylinder(h=h, r=Radius);
        translate([Width-Radius, Radius, 0]) cylinder(h=h, r=Radius);
        translate([Width-Radius, Length-Radius, 0]) cylinder(h=h, r=Radius);
        translate([Radius, Length-Radius, 0]) cylinder(h=h, r=Radius);
    }}
}}
"""
        
        if part == "light":
            return header + """
// === PART 1: THE LIGHT BRICK ===
// Thick slab with internal tunneling

module light_brick() {
    difference() {
        // 1. MAIN BODY
        union() {
            rounded_rect_shape(15 + LED_Width); // Total height based on LED
            
            // THE BAFFLE (Light Shield Lip)
            // Extends the front face down to block user's view of the LED
            if (Shield_Depth > 0) {
                translate([0, Length-2, 0]) cube([Width, 2, 15 + LED_Width + Shield_Depth]);
            }
        }
        
        // 2. MAGNET SOCKET (Bottom Face)
        translate([Width/2, Length/2, -0.1]) 
            cylinder(h=3.5, d=Mag_Dia + 0.4);
            
        // 3. LED TUNNEL (The "Pocket Laser")
        // A deep slot cut into the side/bottom
        translate([-1, 10, 8]) // Start 10mm from magnet end
            cube([Width+2, Length-15, LED_Width + 1]); 
            
        // 4. LIGHT EXIT WINDOW (Bottom/Side)
        // This directs the light AT the canvas (assuming mounted on top)
        translate([-1, 15, 8]) 
            cube([Width+2, Length-20, LED_Width+1]);
            
        // 5. WIRE PATH (Rear Exit)
        translate([Width/2, 0, 8 + LED_Width/2])
            rotate([90, 0, 0])
            cylinder(h=20, d=4);
    }
}

light_brick();
"""
        elif part == "anchor":
            return header + """
// === PART 2: THE ANCHOR PLATE ===
// Thin slab, matches profile exactly

module anchor_plate() {
    difference() {
        // 1. MAIN BODY
        rounded_rect_shape(4); // 4mm thick plate
        
        // 2. MAGNET SOCKET (Top Face)
        translate([Width/2, Length/2, 0.5]) 
            cylinder(h=4, d=Mag_Dia + 0.4);
            
        // 3. SCREW HOLES (Optional mounting)
        translate([Width/2, 10, -1]) cylinder(h=6, d=3);
        translate([Width/2, Length-10, -1]) cylinder(h=6, d=3);
    }
}

anchor_plate();
"""

if __name__ == "__main__":
    root = tk.Tk()
    app = LuminaryMonolithApp(root)
    root.mainloop()