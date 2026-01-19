
// AUTOMATICALLY GENERATED BRAND FILE
// SIGN SCULPTOR ENGINE V3

// 1. IMPORT THE FILE (This loads the data)
use <Dirtyboy-BxYl.ttf>;

// 2. CONFIGURATION
Render_Mode = "Body";
Letter = "C";
Font_Size = 100;
Light_Type = "Silicone_Neon_6mm"; 

// 3. CALL THE FONT (This uses the Internal Name)
Font_Name = "Neonderthaw"; 

// -- ENGINEERING CONSTANTS --
Sign_Height = 30.0;
Wall_Thickness = 2.0;
Base_Thickness = 2.0;
Lid_Tolerance = 0.15;
Hole_Height = 5.0;
Hole_Size = 5.0;

// -- LOGIC ENGINE --
CW = (Light_Type == "Silicone_Neon_6mm") ? 6.0 :
     (Light_Type == "Silicone_Neon_8mm") ? 8.0 :
     (Light_Type == "LED_Strip_10mm")    ? 10.5 :
     (Light_Type == "Individual_Pixels")  ? 14.0 : 6.0;

Lip_Overhang = (Light_Type == "Silicone_Neon_6mm" || Light_Type == "Silicone_Neon_8mm") ? 0.4 : 0.0;

$fn = 60;

module letter_shape() {
    // The Critical Link: Using the Internal Name
    text(text=Letter, size=Font_Size, font=Font_Name, halign="center", valign="center");
}

module body_geometry() {
    difference() {
        // Positive Extrusion
        linear_extrude(Sign_Height)
            offset(r = CW/2 + Wall_Thickness)
            letter_shape();

        // Negative Channel
        translate([0,0, Base_Thickness])
            linear_extrude(Sign_Height + 1)
            offset(r = CW/2)
            letter_shape();

        // Friction Lip (For Neon)
        if (Lip_Overhang > 0) {
            translate([0,0, Sign_Height - 2.0])
                linear_extrude(3.0)
                difference() {
                    offset(r = CW/2 + 5) letter_shape();
                    offset(r = CW/2 - Lip_Overhang) letter_shape();
                }
        }
        
        // Lid Shelf
        translate([0,0, Sign_Height - 2.0])
            linear_extrude(3.0)
            offset(r = CW/2 + 1.5)
            letter_shape();

        // Wire Tunnels
        translate([-Font_Size/1.8, 0, Hole_Height + Base_Thickness])
            rotate([0, 90, 0]) cylinder(h = Font_Size, r = Hole_Size/2);
            
        translate([Font_Size/1.8, 0, Hole_Height + Base_Thickness])
            rotate([0, -90, 0]) cylinder(h = Font_Size, r = Hole_Size/2);
    }
}

module lid_geometry() {
    color("White")
        linear_extrude(2.0)
        offset(r = (CW/2 + 1.5) - Lid_Tolerance)
        letter_shape();
}

if (Render_Mode == "Body") { body_geometry(); }
else if (Render_Mode == "Lid") { lid_geometry(); }
