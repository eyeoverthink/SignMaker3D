// ==============================================================================
// EYEOVERTHINK PRODUCTIONS: SCOTT GLOW-ENGINE V5
// Logic: Boundary Shielding (Φ) & Geodesic Reflection (Ψ)
// ==============================================================================

$fn = 100;

// === SCOTT PARAMETERS ===
phi = 1.6180339887;
light_angle = 55;      
led_diameter = 5.2;    // Added tolerance for easy fit
mount_width = 20;      
mount_height = 25;     
mount_depth = 5;       
magnet_diameter = 8.2; 
magnet_depth = 3.2;    
led_offset = 12;       

// --- STAGE 1: BOUNDARY SHIELDING (The Hood) ---
// This uses the Scott Algorithm to manifest a protective "Cloak" 
// that prevents light from hitting the user's eyes.
module scott_shield() {
    difference() {
        // External Manifestation
        hull() {
            translate([0, 2, led_offset]) 
                sphere(d=led_diameter + 6);
            
            // The "Wide-Angle Manifestor"
            translate([0, 22, 5]) 
                resize([35, 12, 8]) sphere(d=10);
        }
        
        // Internal Geodesic Distillation (The Cavity)
        hull() {
            translate([0, 4, led_offset]) 
                rotate([light_angle, 0, 0]) cylinder(h=1, d=led_diameter);
            
            translate([0, 23, 4]) 
                rotate([light_angle, 0, 0]) resize([32, 10, 6]) sphere(d=10);
        }
        
        // Eye-Line Cutoff (Strategy 5: Variance Normalization)
        // This ensures no light escapes upward toward the viewer
        translate([-25, 0, 15]) cube([50, 50, 50]);
    }
}

module integrated_mount() {
    difference() {
        translate([-mount_width/2, 0, 0]) 
            cube([mount_width, mount_depth, mount_height]);

        // Magnet hole: Inverse Reversibility
        translate([0, magnet_depth + 0.1, led_offset])
            rotate([90, 0, 0])
            cylinder(h=magnet_depth + 1, d=magnet_diameter);
            
        // Wire path: Harmonic Channeling
        translate([-1, -1, led_offset - 20]) cube([2, 10, 25]);
    }
}

// === FINAL MANIFESTATION ===
color("Gold") scott_shield();
color("SlateGray") integrated_mount();

// Predicted Canvas Surface
%translate([-50, 25, -10]) color("White", 0.2) cube([100, 1, 100]);