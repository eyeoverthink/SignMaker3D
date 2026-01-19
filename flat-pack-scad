// ==========================================
//   SIGN SCULPTOR: FLAT-PACK NEON ENGINE
//   (For Router, Laser, or 3D Printed Panels)
// ==========================================

/* [Output Mode] */
// "Preview" shows front/back transparency
// "Router_Template_Front" = The main groove cut
// "Router_Template_Back" = The wire hiding channels
Render_Mode = "Preview"; // [Preview, Router_Template_Front, Router_Template_Back, 3D_Printable_Solid]

/* [Content] */
Text_String = "BITTER";
Font_Size = 80;
Font_Name = "Arial:style=Bold";

/* [Neon Strip Dimensions] */
// Width of the silicone strip (usually 6mm or 8mm)
Strip_Width = 6.0;
// Depth to cut into the material (usually 5mm-10mm)
Groove_Depth = 6.0;
// Make groove slightly tighter/looser (-0.1 is snug)
Friction_Fit = -0.1;

/* [Board Engineering] */
// Total thickness of your wood/acrylic
Board_Thickness = 12.0;
// How much border to leave around the text
Contour_Padding = 15.0;
// Smoothness of the outer shape
Contour_Rounding = 10.0;

/* [Wire Management] */
// Diameter of holes drilled for wires
Drill_Hole_Size = 4.0;
// Width of channels on the BACK to hide wires
Back_Channel_Width = 6.0;

$fn = 60;

// -- LOGIC ENGINE --

module raw_text() {
    text(text=Text_String, size=Font_Size, font=Font_Name, halign="center", valign="center");
}

module board_shape() {
    // Generates the "Bubble" outline around the text
    offset(r = Contour_Rounding)
        offset(r = Contour_Padding)
        raw_text();
}

module front_grooves() {
    // The channel for the Neon Strip
    offset(r = (Strip_Width / 2) + Friction_Fit)
        raw_text();
}

module back_routing() {
    // Wider channels on the back to tuck wires into
    // We offset slightly more to ensure wires fit easily
    offset(r = (Back_Channel_Width / 2))
        raw_text();
}

module drill_points() {
    // This is a heuristic: It punches holes at the "skeleton" of the text
    // In a real CAM software you pick endpoints, but here we create a 
    // centerline "sieve" to allow wires to pass through anywhere.
    offset(r = -1) raw_text();
}

// -- RENDER CONTROLLER --

if (Render_Mode == "Preview") {
    difference() {
        // Main Board
        color("BurlyWood") 
        linear_extrude(Board_Thickness) 
            board_shape();
        
        // Front Cuts (Neon)
        color("Red") 
        translate([0,0, Board_Thickness - Groove_Depth])
            linear_extrude(Groove_Depth + 1)
            front_grooves();
            
        // Back Cuts (Wires)
        color("Blue")
        translate([0,0, -1])
            linear_extrude(4.0) // 4mm deep wire channels on back
            back_routing();
            
        // Thru-Holes (Connecting Front to Back)
        // We erode the text to create a thin centerline for drilling
        color("Black")
        translate([0,0,-1])
            linear_extrude(Board_Thickness + 2)
            offset(r = -Strip_Width/3) // Centerline approximation
            raw_text();
    }
}

else if (Render_Mode == "Router_Template_Front") {
    // Export this as DXF for Laser/CNC
    difference() {
        board_shape();
        front_grooves();
    }
}

else if (Render_Mode == "Router_Template_Back") {
    // Export as DXF to cut the back wire channels
    difference() {
        board_shape();
        back_routing();
    }
}

else if (Render_Mode == "3D_Printable_Solid") {
    // Generates a watertight mesh if you want to print the whole board
    difference() {
        linear_extrude(Board_Thickness) board_shape();
        
        // Front
        translate([0,0, Board_Thickness - Groove_Depth])
            linear_extrude(Groove_Depth + 1)
            front_grooves();
            
        // Back Wire Channels
        translate([0,0, -1])
            linear_extrude(4.0)
            back_routing();
            
        // Connection Slots
        translate([0,0,-1])
            linear_extrude(Board_Thickness + 2)
            offset(r = -Strip_Width/3) 
            raw_text();
    }
}