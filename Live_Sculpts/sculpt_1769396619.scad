
    // MEDUSA CAPTURE: scan_1769396619.png
    
    // -- Settings --
    Sign_Height = 5;       // Total thickness (mm)
    Base_Height = 2;       // Solid base thickness (mm)
    Invert = true;         // True = Dark is raised, False = Light is raised
    Smoothness = 1;        // Resolution (1 = Pixel perfect)

    // -- Geometry --
    union() {
        // The Base Plate
        translate([0,0, Base_Height/2])
            cube([200, 150, Base_Height], center=true);

        // The Data Extrusion
        translate([0, 0, Base_Height])
            scale([200/640, 150/480, Sign_Height/255]) // Scale pixels to MM
            surface(file = "scan_1769396619.png", center = true, invert = Invert);
    }
    