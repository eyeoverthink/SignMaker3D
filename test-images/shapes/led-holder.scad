// --- Canvas Glow-Clip v2: Wide Diffuser ---
// Adjusted for "Wash" lighting instead of "Spot" lighting

$fn = 100; // High resolution

// --- Parameters ---
magnet_diameter = 8.2;
magnet_depth = 3.2; 
led_diameter = 5.2; 
mount_w = 20;
mount_h = 25;
mount_d = 5;

module front_housing_wide() {
    difference() {
        union() {
            // 1. The Base Plate
            translate([-mount_w/2, 0, 0]) cube([mount_w, mount_d, mount_h]);
            
            // 2. The "Duckbill" Light Spreader
            // We use a 'hull' to blend a circle (LED) into a wide oval (Output)
            hull() {
                // The LED base (where the light starts)
                translate([0, 5, 12.5]) 
                rotate([45, 0, 0]) 
                cylinder(h=1, d=10); 
                
                // The Wide Mouth (where light exits)
                translate([0, 20, 3]) // Moved further out and down
                rotate([45, 0, 0]) 
                resize([30, 10, 1]) // Stretch it WIDE (30mm wide)
                cylinder(h=1, d=10);
            }
        }

        // --- CUTOUTS ---
        
        // Magnet Hole (Back)
        translate([0, -0.1, 12.5]) 
        rotate([90, 0, 0]) 
        cylinder(h=magnet_depth, d=magnet_diameter);

        // LED Chamber (The actual hole for the bulb)
        translate([0, 5, 12.5]) 
        rotate([45, 0, 0]) 
        cylinder(h=10, d=led_diameter); // Deep hole for LED legs
        
        // The Light Cone (Hollow inside the duckbill)
        hull() {
            translate([0, 6, 12.5]) 
            rotate([45, 0, 0]) 
            cylinder(h=0.1, d=led_diameter); // Start at LED size
            
            translate([0, 20.1, 3]) 
            rotate([45, 0, 0]) 
            resize([28, 8, 1]) // End at Wide size
            cylinder(h=0.1, d=10);
        }

        // Wire Channel (Top Exit)
        translate([-1.5, 2, 12.5])
        cube([3, 10, 20]);
    }
}

module back_plate() {
    difference() {
        translate([-mount_w/2, 0, 0]) cube([mount_w, mount_d, mount_h]);
        translate([0, 5.1, 12.5]) 
        rotate([90, 0, 0]) 
        cylinder(h=magnet_depth, d=magnet_diameter);
    }
}

// --- RENDER ---
color("Gold") front_housing_wide();
translate([30, 0, 0]) color("Gray") back_plate();

// VISUALIZATION ONLY: This Red Box represents the canvas in between
%translate([-15, -2, -5]) color("red", 0.3) cube([60, 2, 40]);