// ==================================================
// EYEOVERTHINK: SCOTT-BULB V1 (Edison Style)
// Logic: Inverse Reversibility (9.3) | Two-Part Manifestation
// ==================================================

$fn = 100;

// --- CONFIGURABLE DNA ---
led_d = 5.2;            // LED Hole
magnet_d = 8.4;         // Magnet Hole (with 0.2 tolerance)
magnet_depth = 3.2; 
shell_thickness = 2.0;

// --- MODULE 1: THE MAGNETIC BASE PLATE ---
module scott_base_plate() {
    difference() {
        // The Manifested Foundation
        cylinder(h=5, d=25); 
        
        // Inverse Magnet Cavity
        translate([0, 0, -0.1])
            cylinder(h=magnet_depth, d=magnet_d);
            
        // Scott-Wire Channel (Algorithm 3.3)
        translate([magnet_d/2 - 1, -2, -0.1])
            cube([5, 4, 10]);
            
        // Thread/Snap Lip (The Boundary Operator)
        translate([0, 0, 3])
            difference() {
                cylinder(h=3, d=26);
                cylinder(h=3.1, d=23);
            }
    }
}

// --- MODULE 2: THE EDISON DIFFUSER BULB ---
module scott_diffuser_bulb() {
    difference() {
        // The External Boundary (Φ)
        union() {
            // Bulb Body
            translate([0, 0, 5])
                sphere(d=30);
            // Attachment Neck
            cylinder(h=10, d=25);
        }
        
        // The Inverse Cavity (D^-1)
        // This is where you insert the light
        translate([0, 0, 5])
            sphere(d=26);
        translate([0, 0, -0.1])
            cylinder(h=11, d=21);
            
        // LED Positioning Port
        translate([0, 0, 8])
            cylinder(h=20, d=led_d);
    }
}

// --- RENDER CONTROL ---
// Set to 0 to see assembly, 1 for Base only, 2 for Bulb only
render_mode = 0; 

if (render_mode == 0) {
    color("SlateGray") scott_base_plate();
    translate([0, 0, 10]) color("Gold", 0.5) scott_diffuser_bulb();
} else if (render_mode == 1) {
    scott_base_plate();
} else if (render_mode == 2) {
    scott_diffuser_bulb();
}