$fn = 100; // High-res curves

// === Parameters ===
magnet_diameter = 8.2;
magnet_depth = 3.2;
led_diameter = 5.2;

mount_w = 20;
mount_d = 5;
mount_height = 25; // <== Adjustable height

light_angle = 35;   // <== Adjustable aim angle (deg), default: 35 degrees
diffuser_width = 30;
diffuser_height = 10;

// === Modules ===

module front_housing_adjustable() {
    difference() {
        union() {
            // Base block
            translate([-mount_w/2, 0, 0])
                cube([mount_w, mount_d, mount_height]);

            // Adjustable diffuser
            hull() {
                // LED input hole
                translate([0, 5, mount_height/2])
                    rotate([light_angle, 0, 0])
                    cylinder(h=1, d=led_diameter + 2);

                // Output oval
                translate([0, 20, 3])
                    rotate([light_angle, 0, 0])
                    resize([diffuser_width, diffuser_height, 1])
                    cylinder(h=1, d=10);
            }
        }

        // Magnet hole
        translate([0, -0.1, mount_height/2])
            rotate([90, 0, 0])
            cylinder(h=magnet_depth, d=magnet_diameter);

        // LED chamber
        translate([0, 5, mount_height/2])
            rotate([light_angle, 0, 0])
            cylinder(h=10, d=led_diameter);

        // Hollow light cone
        hull() {
            translate([0, 6, mount_height/2])
                rotate([light_angle, 0, 0])
                cylinder(h=0.1, d=led_diameter);

            translate([0, 20.1, 3])
                rotate([light_angle, 0, 0])
                resize([diffuser_width - 2, diffuser_height - 2, 1])
                cylinder(h=0.1, d=10);
        }

        // Wire channel
        translate([-1.5, 2, mount_height/2])
            cube([3, 10, 20]);
    }
}

module back_plate() {
    difference() {
        translate([-mount_w/2, 0, 0])
            cube([mount_w, mount_d, mount_height]);

        translate([0, 5.1, mount_height/2])
            rotate([90, 0, 0])
            cylinder(h=magnet_depth, d=magnet_diameter);
    }
}

// === Render ===
color("Gold") front_housing_adjustable();
translate([30, 0, 0]) color("Gray") back_plate();

// Visualization: Canvas or wall
%translate([-15, -2, -5]) color("red", 0.3) cube([60, 2, 40]);

