// ==========================================
// EYEKA'S NEON COLLECTION (Geometric Recreation)
// ==========================================

$fn = 60; // Resolution (High for smooth tubes)

// 1. SELECT YOUR ICON HERE:
// Change this to "alien", "computer", or "glasses"
icon_selection = "alien"; 

// 2. NEON SETTINGS
tube_diameter = 8;
wall_thickness = 1.5;
sign_height = 10;

// ==========================================
// RENDER ENGINE
// ==========================================

// This creates the "Sandwich" Casing
union() {
    // 1. The White Diffuser Cap
    color("white", 0.9) 
    translate([0,0,1])
    difference() {
        // Outer Shell
        minkowski() {
            linear_extrude(sign_height - 2) SelectShape();
            sphere(d=tube_diameter);
        }
        // Hollow Inside
        translate([0,0,-5])
        linear_extrude(sign_height + 10)
            offset(r = -wall_thickness) SelectShape();
            
        // Flat Bottom Cut
        translate([0,0,-sign_height]) cube([500,500,20], center=true);
    }

    // 2. The Backing Plate (Gray)
    color("#333333") 
    translate([0,0, -2])
    linear_extrude(3)
        offset(r = tube_diameter/2 - wall_thickness - 0.2) SelectShape();
}

module SelectShape() {
    if (icon_selection == "alien") Alien();
    else if (icon_selection == "computer") RetroComputer();
    else if (icon_selection == "glasses") Glasses();
}

// ==========================================
// SHAPE LIBRARIES (Recreated from your Images)
// ==========================================

module Alien() {
    scale([1.2, 1.2, 1]) // Size Adjustment
    difference() {
        // The Head (Egg Shape)
        hull() {
            translate([0, 15, 0]) circle(d=45); // Top of head
            translate([0, -10, 0]) circle(d=15); // Chin
        }
        
        // The Eyes (Angled Ovals)
        translate([-8, 12, 0]) rotate([0,0,-20]) scale([1, 1.6]) circle(d=10);
        translate([8, 12, 0]) rotate([0,0,20]) scale([1, 1.6]) circle(d=10);
        
        // The Nostril/Mouth dot
        translate([1, 0, 0]) circle(d=2);
    }
}

module Glasses() {
    scale([1.5, 1.5, 1])
    union() {
        // Left Rim
        difference() {
            circle(d=30);
            circle(d=24); // Inner hole
        }
        
        // Right Rim
        translate([40, 0, 0]) 
        difference() {
            circle(d=30);
            circle(d=24);
        }
        
        // The Bridge (Arc)
        difference() {
            translate([20, 5, 0]) circle(d=20); // Outer Arc
            translate([20, 5, 0]) circle(d=16); // Inner Cut
            translate([20, -10, 0]) square([30, 20], center=true); // Cut bottom half
        }
        
        // Temple Stubs (Hinges)
        translate([-16, 0, 0]) square([4, 2], center=true);
        translate([56, 0, 0]) square([4, 2], center=true);
    }
}

module RetroComputer() {
    scale([0.8, 0.8, 1])
    union() {
        // 1. Monitor Frame
        translate([0, 20, 0])
        difference() {
            // Outer CRT Shape (Rounded Square)
            hull() {
                translate([-25, 25]) circle(d=5);
                translate([25, 25]) circle(d=5);
                translate([-25, -5]) circle(d=5);
                translate([25, -5]) circle(d=5);
            }
            // Screen Cutout
            hull() {
                translate([-20, 20]) circle(d=2);
                translate([20, 20]) circle(d=2);
                translate([-20, 0]) circle(d=2);
                translate([20, 0]) circle(d=2);
            }
        }
        
        // 2. Base/Keyboard
        translate([0, -10, 0])
        difference() {
            // Trapezoid Body
            hull() {
                translate([-30, 0]) circle(d=4);
                translate([30, 0]) circle(d=4);
                translate([-35, -15]) circle(d=4);
                translate([35, -15]) circle(d=4);
            }
            // Floppy Drive Slot
            translate([15, -8]) square([15, 2], center=true);
            // Power Button
            translate([-20, -8]) circle(d=3);
        }
    }
}