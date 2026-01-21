// ==================================================
// EYEOVERTHINK: BOUNDARY MANIFESTATION ENGINE
// Translating Scott Vectors to Physical Matter
// ==================================================

// --- Your Data (Already in your file) ---
scott_points = [[0, 0], [0, -2], [2249, -2], [2249, -47], [0, -47], [0, -1546], [2249, -1546], [2251, -1598], [2251, 0], [53, 0], [51, -2], [48, 0]];

// --- Engineering Constants ---
wall_thickness = 20; 
sign_height = 50;
base_thickness = 5;

// --- Stage 1: Boundary Manifestation (Φ) ---
// This turns the 1D vectors into a 3D hollow shell
difference() {
    // 1. External Perimeter (∂S + Wall)
    linear_extrude(height = sign_height)
        offset(r = wall_thickness)
        polygon(points = scott_points);

    // 2. Internal Light Channel (The Inverse)
    translate([0, 0, base_thickness])
        linear_extrude(height = sign_height + 1)
        polygon(points = scott_points);
}