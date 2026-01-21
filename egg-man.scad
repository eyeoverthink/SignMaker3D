// ==================================================
// EYEOVERTHINK: EGGISON BULB (Gen 1)
// Logic: Jordan Curve Shell (1.2) | Inverse Patterning (9.1)
// ==================================================

$fn = 100;

// --- CONFIGURABLE DNA ---
pattern_type = "dna"; // [houndstooth, checkers, dots, dna, litho]
led_d = 5.2;            
magnet_d = 8.4;        
egg_scale = 1.618;    // Scaling by Phi

// --- MODULE 1: THE EGGISON BASE (The Magnetic Puck) ---
module eggison_base() {
    difference() {
        cylinder(h=8, d=30);
        // Inverse Magnet Cavity
        translate([0, 0, -0.1]) cylinder(h=3.2, d=magnet_d);
        // Wire Channel
        translate([0, 0, 4]) rotate([0, 90, 0]) cylinder(h=20, d=3);
        // Male Snap Lip
        translate([0, 0, 6]) cylinder(h=4, d=24);
    }
}

// --- MODULE 2: THE EGGISON SHELL (The Diffuser) ---
module eggison_shell() {
    difference() {
        // Outer Egg Boundary (Φ)
        scale([1, 1, egg_scale]) sphere(d=35);
        
        // Inner Cavity (D^-1)
        scale([1, 1, egg_scale]) sphere(d=31);
        
        // Attachment Port
        translate([0, 0, -25]) cylinder(h=30, d=24.5);
        
        // LED Positioning
        translate([0, 0, -10]) cylinder(h=20, d=led_d);
        
        // THE PATTERN ENGINE: Organic Variance
        if (pattern_type == "dna") {
            for (i = [0 : 10 : 360]) {
                rotate([0, 0, i]) translate([15, 0, i/10]) 
                    sphere(d=2); // Double Helix Variance
            }
        } else if (pattern_type == "dots") {
            for (phi_a = [0 : 137.5 : 2000]) { // Golden Angle distribution
                rotate([phi_a, phi_a/2, 0]) translate([16, 0, 0])
                    sphere(d=1.5);
            }
        }
    }
}

// --- RENDER ---
color("ivory") eggison_shell();
translate([0, 0, -28]) color("gold") eggison_base();