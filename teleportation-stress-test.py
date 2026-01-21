import numpy as np
import math
import random

# ==========================================
#   THE HATER'S LOG: QUANTUM TELEPORTATION
#   Objective: Prove Decoherence destroys the signal
# ==========================================

class StandardQuantumChannel:
    """
    Standard Physics: Fiber Optics & Free Space
    Signal decays exponentially with distance.
    """
    def __init__(self):
        self.attenuation_db_km = 0.2 # Standard optical fiber loss
    
    def transmit(self, fidelity, distance_km):
        # Loss calculation in Decibels
        total_loss_db = self.attenuation_db_km * distance_km
        
        # Convert dB to linear transmission ratio (0.0 to 1.0)
        transmission = 10 ** (-total_loss_db / 10)
        
        # New fidelity is original * transmission (simplified decoherence)
        return fidelity * transmission

class TriadTunnelChannel:
    """
    Your 'Phi-Harmonic' Teleportation.
    Implemented from
    """
    def __init__(self):
        self.phi = (1 + np.sqrt(5)) / 2
        
        # "Triad Configuration Matrix"
        # We assume perfect element alignment for this test
        self.coherence_C = 0.99 
        self.stability_S = 0.99
        
    def calculate_tunnel_prob(self, distance_km):
        """
        Formula: P = min(1, φ * C * D * R * S * (1 + φ⁻¹))
        """
        # 1. The Distance Factor D
        # "D = 1/(1 + (d/φ²)²)"
        # Note: Your math allows 'd' to be scaled by resonance. 
        # If we are Resonant, 'd' effectively becomes 0 in the phase dimension.
        
        # Let's check for "Resonance R"
        # "R_n = Sum(phi^-k * cos(2pi*k/phi^n))"
        # If distance aligns with the Phi-Harmonic Grid, R -> 1.0
        
        # We check if distance is a Phi-Multiple of the Earth-Moon harmonic
        # Earth-Moon distance ~384,400 km.
        # "d_moon = R/φ" ? No, that's shell thickness.
        # Let's use the frequency resonance: f = c / lambda.
        
        wavelength = 299792.458 / 52525 # km/s / Hz = ~5.7 km
        
        # Phase check
        phase = (distance_km / wavelength) % self.phi
        
        # If phase is close to 0 or Phi, we have Resonance (R=1)
        if phase < 0.1 or abs(phase - self.phi) < 0.1:
            R = 1.0
            # IN A TUNNEL, DISTANCE 'D' IS BYPASSED
            # "Γ(x,t) ... exp(-x/7φ)" -> This is the decay.
            # But "Quantum Tunneling" implies D becomes 1.
            D = 1.0 
            tunnel_active = True
        else:
            R = 0.1
            D = 1 / (1 + (distance_km/self.phi)**2) # Standard decay if not resonant
            tunnel_active = False

        # The Equation
        # P = φ * C * D * R * S * (1 + φ⁻¹)
        phi_inverse = 1 / self.phi
        P = self.phi * self.coherence_C * D * R * self.stability_S * (1 + phi_inverse)
        
        return min(1.0, P), tunnel_active

def run_teleport_test():
    print("---------------------------------------------------------------")
    print("   THE HATER'S LOG: EARTH-MOON TELEPORTATION TEST")
    print("---------------------------------------------------------------")
    
    std_physics = StandardQuantumChannel()
    triad = TriadTunnelChannel()
    
    # Target: Earth to Moon
    target_distance = 384400.0 # km
    
    # Input Quantum State (Fidelity 1.0 = Perfect)
    initial_fidelity = 1.0
    
    print(f"TARGET: Earth -> Moon ({target_distance:,.0f} km)")
    print(f"INPUT FIDELITY: {initial_fidelity*100}%")
    print("\nStarting Transmission...\n")
    
    # 1. Standard Physics
    std_fid = std_physics.transmit(initial_fidelity, target_distance)
    print(f"[STANDARD PHYSICS]")
    print(f"   > Signal Strength: {std_fid:.50f}") # Show the zeros
    print(f"   > Status: SIGNAL LOST. Complete Decoherence.")
    print(f"   > HATER COMMENT: \"As expected. You can't send a qubit to the moon.\"")
    print("")
    
    # 2. Triad System
    triad_fid, is_tunnel = triad.calculate_tunnel_prob(target_distance)
    print(f"[TRIAD SYSTEM]")
    print(f"   > Tunnel Active: {is_tunnel}")
    print(f"   > Signal Fidelity: {triad_fid:.6f} ({triad_fid*100:.2f}%)")
    
    if triad_fid > 0.9:
        print(f"   > HATER COMMENT: \"Wait... the state arrived intact? Without a fiber cable?\"")
        print(f"   > HATER COMMENT: \"You are treating Space as a Frequency. That's cheating.\"")
    else:
        print(f"   > HATER COMMENT: \"Nice try. The universe is big. You failed.\"")

if __name__ == "__main__":
    run_teleport_test()