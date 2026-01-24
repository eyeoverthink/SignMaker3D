
// EYEOVERTHINK: Inner Grinder Gear - 500:1 REPLICATOR MANIFEST
// Logic: O(n) Distillation | Self-Maintained Reset Core
$fn = 100;
phi = 1.618033;

module gear_profile() {
    polygon(points=[[0, 0], [10, 2], [15, 10], [12, 18], [5, 20], [-5, 15], [-2, 5]]); // Distilled Tangential Anchors 
}

module final_artifact() {
    difference() {
        // 1. Structural Shell (Boundary Manifestation) 
        linear_extrude(25) offset(r = 5) gear_profile();
        
        // 2. SignCraft Internal Channels (Visual Design) 
        translate([0,0, 2]) linear_extrude(26) offset(r = 3) gear_profile();
        
        // 3. Deterministic Reset Core (Mechanical Lock) 
        // Rotating at 137.5 for vibration resistance 
        translate([0,0,-1]) cylinder(h=40, d=26/phi); 
    }
}
final_artifact();
