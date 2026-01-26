
// AUTOMATICALLY GENERATED FILE: GeoSign_Pro_CITY_HALL
// CONTENT TYPE: Text
// SOURCE: N/A (Using Text)

use <arialbd.ttf>;

// --- RENDER MODE SELECTOR ---
// Change to "Lid" to generate the back cover diffuser.
Render_Mode = "Body"; // Options: "Body", "Lid"

// --- USER PARAMETERS ---
Text_String = "🏛️ CITY HALL";
Font_Name = "Arial:style=Bold";
Content_Size = 50.0; // Base size for text or scaling factor for models
Sign_Height = 30.0;
Light_Type = "LED_Strip_10mm";

// --- ENGINEERING CONSTANTS ---
Wall_Thickness = 2.0;
Base_Thickness = 2.0;
Lid_Tolerance = 0.15;
Hole_Diameter = 5.0;
Hole_Height_Offset = 5.0;

// --- LOGIC ENGINE ---
// Determine Channel Width (CW) based on Light_Type
CW = (Light_Type == "Silicone_Neon_6mm") ? 6.0 :
     (Light_Type == "Silicone_Neon_8mm") ? 8.0 :
     (Light_Type == "LED_Strip_10mm")    ? 10.5 : 6.0; // Default

// Determine Lip Overhang for friction fit neon
Lip_Overhang = (Light_Type == "Silicone_Neon_6mm" || Light_Type == "Silicone_Neon_8mm") ? 0.4 : 0.0;

// Resolution for curves
$fn = 60;

// --- CONTENT GENERATION MODULES ---

module content_text() {
    text(text=Text_String, size=Content_Size, font=Font_Name, halign="center", valign="center");
}

module content_stl() {
    // Import an external STL model.
    // Scale it to fit reasonably within the Content_Size box.
    // You may need to adjust the scale manually in OpenSCAD for perfect sizing.
    scale([Content_Size/100, Content_Size/100, Content_Size/100]) // Rough scaling
    import("N/A (Using Text)", convexity=10);
}

module content_image_surface() {
    // Create a 3D surface from an image's brightness.
    // Ideally, use a high-contrast, grayscale image.
    // Scale Z to a reasonable height for the relief.
    scale([Content_Size/100, Content_Size/100, 5.0/100]) // Scale X, Y, and Z height
    surface(file = "N/A (Using Text)", center = true, invert = true);
}

// --- MAIN GEOMETRY SELECTOR ---
module base_2d_shape() {
    if ("Text" == "Text") {
        content_text();
    } else if ("Text" == "External_STL") {
        // For STL, we need a 2D base outline. projection() creates this.
        projection(cut = false) content_stl();
    } else if ("Text" == "Image_Surface") {
        // For image surface, projection creates the 2D outline.
        projection(cut = false) content_image_surface();
    }
}

module base_3d_content() {
    if ("Text" == "Text") {
        // For text, we extrude the 2D shape.
        linear_extrude(Sign_Height)
            offset(r = CW/2 + Wall_Thickness)
            base_2d_shape();
    } else if ("Text" == "External_STL") {
        // For STL, we place the true 3D model on top of a base block.
        union() {
            // Base Block
            linear_extrude(Base_Thickness)
                offset(r = CW/2 + Wall_Thickness)
                base_2d_shape();
            // Place 3D Model on top
            translate([0, 0, Base_Thickness])
                content_stl();
            // Create walls around the 3D model for the light channel
            difference() {
                 linear_extrude(Sign_Height)
                    offset(r = CW/2 + Wall_Thickness)
                    base_2d_shape();
                 translate([0,0,Base_Thickness])
                 linear_extrude(Sign_Height)
                    offset(r = CW/2)
                    base_2d_shape();
            }
        }
    } else if ("Text" == "Image_Surface") {
        // For image surface, similar to STL, place it on a base.
        union() {
            // Base Block
            linear_extrude(Base_Thickness)
                 offset(r = CW/2 + Wall_Thickness)
                 base_2d_shape();
            // Place 3D Surface on top
            translate([0, 0, Base_Thickness])
                content_image_surface();
             // Create walls around the 3D model for the light channel
            difference() {
                 linear_extrude(Sign_Height)
                    offset(r = CW/2 + Wall_Thickness)
                    base_2d_shape();
                 translate([0,0,Base_Thickness])
                 linear_extrude(Sign_Height)
                    offset(r = CW/2)
                    base_2d_shape();
            }
        }
    }
}


module body_geometry() {
    difference() {
        // 1. Positive Body Shape
        base_3d_content();

        // 2. Light Channel (Carve out)
        // Only needed for Text mode, as STL/Image modes build walls around the content.
        if ("Text" == "Text") {
            translate([0,0, Base_Thickness])
                linear_extrude(Sign_Height + 1)
                offset(r = CW/2)
                base_2d_shape();
        }

        // 3. Friction Lip for Neon (if applicable)
        if (Lip_Overhang > 0 && "Text" == "Text") {
            translate([0,0, Sign_Height - 2.0])
                linear_extrude(3.0)
                difference() {
                    offset(r = CW/2 + 5) base_2d_shape();
                    offset(r = CW/2 - Lip_Overhang) base_2d_shape();
                }
        }
        
        // 4. Lid Shelf (Recess for the back cover)
        // Calculated from the outer wall boundary.
        translate([0,0, Sign_Height - 2.0])
            linear_extrude(3.0)
            offset(r = CW/2 + 1.5)
            base_2d_shape();

        // 5. Wiring/Mounting Holes
        // Positioned relative to the approximate center.
        // You might need to adjust these for complex STL shapes.
        translate([-Content_Size/2, 0, Hole_Height_Offset + Base_Thickness])
            rotate([0, 90, 0]) cylinder(h = Content_Size, d = Hole_Diameter, center=true);
            
        translate([Content_Size/2, 0, Hole_Height_Offset + Base_Thickness])
            rotate([0, -90, 0]) cylinder(h = Content_Size, d = Hole_Diameter, center=true);
    }
}

module lid_geometry() {
    // Generates the back cover diffuser.
    color("White", 0.5)
        linear_extrude(2.0)
        offset(r = (CW/2 + 1.5) - Lid_Tolerance)
        base_2d_shape();
}

// --- MAIN RENDER CALL ---
if (Render_Mode == "Body") { body_geometry(); }
else if (Render_Mode == "Lid") { lid_geometry(); }
