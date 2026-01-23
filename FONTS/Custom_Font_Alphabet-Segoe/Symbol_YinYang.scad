
// TEST FILE: Yin-Yang Symbol from Segoe UI Symbol font
// SYMBOL: ☯ (Unicode U+262F)

use <Segoe-UI-Symbol.ttf>;

Render_Mode = "Body"; 
Symbol = "☯";  // Yin-Yang symbol
Font_Size = 100;
Font_Name = "Segoe UI Symbol";  // Note: might need exact name
Light_Type = "Silicone_Neon_6mm";

// -- Engineering Constants --
Sign_Height = 30.0;
Wall_Thickness = 2.0;
Base_Thickness = 2.0;
Lid_Tolerance = 0.15;
Hole_Height = 5.0;
Hole_Size = 5.0;

// -- Logic Engine --
CW = (Light_Type == "Silicone_Neon_6mm") ? 6.0 :
     (Light_Type == "Silicone_Neon_8mm") ? 8.0 :
     (Light_Type == "LED_Strip_10mm")    ? 10.5 :
     (Light_Type == "Individual_Pixels")  ? 14.0 : 6.0;

Lip_Overhang = (Light_Type == "Silicone_Neon_6mm" || Light_Type == "Silicone_Neon_8mm") ? 0.4 : 0.0;

$fn = 60;

module symbol_shape() {
    text(text=Symbol, size=Font_Size, font=Font_Name, halign="center", valign="center");
}

module body_geometry() {
    difference() {
        // Positive Block
        linear_extrude(Sign_Height)
            offset(r = CW/2 + Wall_Thickness)
            symbol_shape();

        // Light Channel
        translate([0,0, Base_Thickness])
            linear_extrude(Sign_Height + 1)
            offset(r = CW/2)
            symbol_shape();

        // Friction Lip
        if (Lip_Overhang > 0) {
            translate([0,0, Sign_Height - 2.0])
                linear_extrude(3.0)
                difference() {
                    offset(r = CW/2 + 5) symbol_shape();
                    offset(r = CW/2 - Lip_Overhang) symbol_shape();
                }
        }
        
        // Lid Shelf
        translate([0,0, Sign_Height - 2.0])
            linear_extrude(3.0)
            offset(r = CW/2 + 1.5)
            symbol_shape();

        // Side Holes
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
        symbol_shape();
}

if (Render_Mode == "Body") { body_geometry(); }
else if (Render_Mode == "Lid") { lid_geometry(); }
