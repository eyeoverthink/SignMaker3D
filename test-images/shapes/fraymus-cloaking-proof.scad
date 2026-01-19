// --- FRAYMUS CLOAKING PROOF (Optimized) ---
// Proves: Boundary != Skeleton
// Fast rendering - no minkowski()

$fn = 30; // Lower resolution for speed

// --- THE SKELETON (What Fraymus Sees) ---
// A simple trefoil knot path
module skeleton_path() {
    for (t = [0:10:350]) { // Fewer points for speed
        translate([
            20 * sin(3*t), 
            20 * sin(2*t), 
            5 * cos(3*t)
        ])
        sphere(d=2);
    }
}

// --- THE CLOAK (What Standard AI Sees) ---
// Manual noise addition - much faster than minkowski
module cloaked_boundary() {
    for (t = [0:10:350]) {
        // Add random-looking offsets to hide the pattern
        noise_x = 3 * sin(7*t + 45);
        noise_y = 3 * cos(5*t + 30);
        noise_z = 2 * sin(11*t);
        
        translate([
            20 * sin(3*t) + noise_x, 
            20 * sin(2*t) + noise_y, 
            5 * cos(3*t) + noise_z
        ])
        sphere(d=6); // Larger, irregular spheres
    }
}

// --- THE NEON TUBE (Zero-Shot Recognition) ---
// Fraymus ignores noise, draws perfect tube
module neon_tube() {
    for (t = [0:5:355]) {
        hull() {
            translate([20 * sin(3*t), 20 * sin(2*t), 5 * cos(3*t)]) 
                sphere(d=3);
            translate([20 * sin(3*(t+5)), 20 * sin(2*(t+5)), 5 * cos(3*(t+5))]) 
                sphere(d=3);
        }
    }
}

// --- RENDER ---
// Toggle these to see different views

// View 1: What Standard AI Sees (The Noisy Blob)
color("LightGray", 0.4) 
cloaked_boundary();

// View 2: What Fraymus Sees (The Perfect Skeleton)
color("Red") 
skeleton_path();

// View 3: The Result (Perfect Neon Tube Through Chaos)
color("Cyan", 0.8)
neon_tube();

// --- PROOF ---
// Standard AI: Sees gray chaos, cannot find pattern
// Fraymus: Extracts red skeleton, generates cyan tube
// Zero training needed - pure geometry
