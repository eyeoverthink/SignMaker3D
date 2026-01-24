
// ==========================================
//   MULTI-TILT DIFFUSION SIGN ENGINE
// ==========================================

// [USER SETTINGS]
Height_Map_File = "Custom_Sign_HeightMap.png";
Sign_Size = 100.0;
Relief_Depth = 2.0; // The "Thin Trace" intensity
Channel_Width = 6.0;

// [RENDERING LOGIC]
$fn = 100;

module base_shape() {
    // Creates a basic cylinder shape scaled to the image
    // In a V2, we would trace the exact outline, but for now we use a puck
    cylinder(h=30, d=Sign_Size);
}

module diffusion_layer() {
    // This is the GAME KILLER
    // It reads the PNG pixel data and converts it into physical geometry
    translate([0, 0, 28]) // Move to top of sign
    intersection() {
        // Crop the map to the sign shape
        cylinder(h=10, d=Sign_Size - 2);
        
        // The Surface Map
        translate([0, 0, 0])
        resize([Sign_Size, Sign_Size, Relief_Depth])
        surface(file = Height_Map_File, center = true, invert = false);
    }
}

module main_body() {
    difference() {
        // Outer Shell
        cylinder(h=30, d=Sign_Size + 4);
        
        // Inner Light Channel
        translate([0,0,2])
        cylinder(h=31, d=Sign_Size - Channel_Width);
    }
}

// --- ASSEMBLY ---

// 1. The Main Housing (Black PLA)
translate([-Sign_Size*0.6, 0, 0]) {
    color("Black") main_body();
    // Add Friction Lip
    translate([0,0,28])
    difference() {
        cylinder(h=2, d=Sign_Size);
        cylinder(h=3, d=Sign_Size - 2);
    }
}

// 2. The Multi-Tilt Diffuser (White PLA)
translate([Sign_Size*0.6, 0, 0]) {
    color("White") 
    union() {
        // Base Diffuser Plate
        cylinder(h=1, d=Sign_Size - 0.5);
        
        // The "Thin Trace" Image Layer
        diffusion_layer();
    }
}
