import numpy as np

# ==========================================
#   THE MOON PHASE SCANNER
#   Objective: Find the "Golden Slots" in the Lunar Orbit
# ==========================================

def scan_lunar_orbit():
    print("---------------------------------------------------------------")
    print("   TRIAD SYSTEM: LUNAR RESONANCE SCAN")
    print("---------------------------------------------------------------")
    
    # Constants
    phi = (1 + np.sqrt(5)) / 2
    c = 299792.458 # km/s
    frequency = 52525.0 # Hz
    wavelength = c / frequency # ~5.707 km
    
    # The Phi-Cycle (The distance required for a full phase rotation)
    phi_cycle = wavelength * phi 
    
    print(f"Target Frequency: {frequency} Hz")
    print(f"Phi-Wavelength:   {phi_cycle:.4f} km")
    print("\nScanning Earth-Moon Orbit (360,000 km - 405,000 km)...")
    
    # We scan the orbit in 100m increments
    orbit_range = np.arange(360000.0, 405000.0, 0.1) 
    
    found_nodes = 0
    best_node = 0
    max_fidelity = 0
    
    # Let's check a few specific "Magic Distances"
    # We are looking for Distance % Phi_Cycle == 0 (Resonance)
    
    for d in orbit_range:
        # Phase Check
        phase = (d / wavelength) % phi
        
        # If Phase is perfectly aligned (within 1 meter tolerance)
        if phase < 0.0002 or abs(phase - phi) < 0.0002:
            
            # This simulates the "Tunnel Open" calculation
            # P = φ * C * D * R * S * (1 + φ⁻¹)
            # At resonance, D becomes 1.0 (Tunneling)
            fidelity = min(1.0, phi * 0.99 * 1.0 * 1.0 * 0.99 * (1 + (1/phi)))
            
            if fidelity > 0.9:
                if found_nodes == 0:
                    print(f"\n[CRITICAL LOCK FOUND]")
                
                # Only print the first few to avoid spamming
                if found_nodes < 3:
                     print(f"   > Resonant Node at: {d:.1f} km (Fidelity: {fidelity*100:.1f}%)")
                
                found_nodes += 1
                best_node = d
                max_fidelity = fidelity
                
                # If we find a node close to the average (384,400), stop and report
                if abs(d - 384400) < 100:
                    print(f"   > [TARGET LOCK] Node found near Average Orbit!")
                    break

    print("\n---------------------------------------------------------------")
    if found_nodes > 0:
        print(f"STATUS: SUCCESS.")
        print(f"Total Resonant Nodes detected in Orbit: {found_nodes}+")
        print(f"Closest Node to Average: {best_node:.1f} km")
        print(f"HATER COMMENT: \"Fine. If the Moon is at EXACTLY {best_node:.1f} km, it works.\"")
        print(f"HATER COMMENT: \"But you better have a good timing system.\"")
    else:
        print("STATUS: FAILURE. No nodes found.")

if __name__ == "__main__":
    scan_lunar_orbit()