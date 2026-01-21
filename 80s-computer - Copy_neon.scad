// AUTOMATIC NEON GENERATOR
// Generated from: 80s-computer - Copy.PNG

$fn = 60;

wall_thickness = 2;
tube_height = 10;
tube_width = 8;

// RENDER COMMANDS
translate([0,0,0]) color("white") NeonTop();
translate([0,0,-15]) color("gray") BackPlate();

module IconShape() {
    polygon(points=[[184, -123], [168, -557], [86, -685], [91, -740], [845, -741], [851, -693], [761, -553], [752, -153], [737, -125], [457, -100], ]);
}


module NeonTop() {
    difference() {
        // Outer Shell (Minkowski Rounding)
        minkowski() {
            linear_extrude(tube_height - 2) IconShape();
            sphere(r=2); // Creates the rounded "Tubular" look
        }
        
        // Inner Hollow (The Channel)
        translate([0,0,-5])
        linear_extrude(tube_height + 10)
            offset(r=-wall_thickness) IconShape();
            
        // Cut Bottom Flat
        translate([0,0,-10]) cube([10000, 10000, 20], center=true);
    }
}

module BackPlate() {
    difference() {
        linear_extrude(3)
            offset(r=-0.2) // Tolerance gap
            offset(r=-wall_thickness) IconShape();
            
        // Screw Holes?
    }
}
