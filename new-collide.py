import math
import sys

# ==========================================
#   PROJECT AEGIS: PHI-COLLISION DYNAMICS
#   Objective: Dissipate 1.5 MJ of Kinetic Energy
#   Limit: Keep Passenger G-Force < 40G
# ==========================================

class CrashTestDummy:
    def __init__(self, name):
        self.name = name
        self.peak_g = 0.0
        self.survival = True

    def register_impact(self, g_force):
        if g_force > self.peak_g:
            self.peak_g = g_force
        
        # Human Tolerance Thresholds
        if g_force > 80.0:
            self.survival = False # Instant fatality
        elif g_force > 60.0:
            self.survival = "CRITICAL" # Severe Injury

class StandardFrame:
    def __init__(self):
        self.stiffness = 200000.0 # N/m (Linear Spring)
    
    def absorb(self, displacement, velocity):
        # Hooke's Law: F = kx
        # Plus Damping: F = cv
        force = (self.stiffness * displacement) + (5000 * velocity)
        return force

class PhiFrame:
    def __init__(self):
        self.PHI = 1.618033988749895
        # The stiffness isn't constant; it adapts geometrically.
        # As the frame crushes, it spirals the energy outwards.
        self.base_stiffness = 200000.0 
        
    def absorb(self, displacement, velocity):
        # FRAYMUS GEOMETRY:
        # Force is dissipated radially. 
        # F = (k * x) / Phi_Factor
        # The deeper the impact, the more the spiral tightens (Phi^2),
        # distributing force over a larger *effective* area.
        
        # We model the dispersion as a Logarithmic Phi Curve
        # This prevents the "Spike" of a linear crash.
        
        phi_dispersion = self.PHI ** (displacement + 1.0)
        
        force = (self.base_stiffness * displacement) / math.sqrt(phi_dispersion)
        
        # Add "Vortex Damping" (Velocity squared divided by Phi)
        damping = (5000 * velocity) / self.PHI
        
        return force + damping

def run_crash_simulation():
    print("========================================")
    print("   IMPACT SIMULATION: 100 MPH (44.7 m/s)")
    print("   Mass: 1500kg | Target: Concrete Wall ")
    print("========================================")
    
    # Initial Conditions
    v0 = 44.7 # m/s
    mass = 1500.0 # kg
    dt = 0.005 # 5ms time steps
    
    # ----------------------------------
    # RUN 1: STANDARD CAR
    # ----------------------------------
    print("\n>>> TEST 1: STANDARD LINEAR FRAME")
    dummy_std = CrashTestDummy("Std_Dummy")
    car_std = StandardFrame()
    
    vel = v0
    pos = 0.0
    time_elapsed = 0.0
    
    print("   [TIME]   [G-FORCE]   [STATUS]")
    
    # Simple Euler Integration
    while vel > 0.1:
        force = car_std.absorb(pos, vel)
        accel = force / mass # F=ma -> a=F/m
        g_force = accel / 9.81
        
        dummy_std.register_impact(g_force)
        
        vel -= accel * dt
        pos += vel * dt
        time_elapsed += dt
        
        if time_elapsed <= 0.05: # Show first 50ms (The Impact)
            bar = "█" * int(g_force / 5)
            print(f"   {time_elapsed*1000:.0f}ms      {g_force:.1f} G      {bar}")
            
    # ----------------------------------
    # RUN 2: PHI-GEOMETRY FRAME
    # ----------------------------------
    print("\n>>> TEST 2: FRAYMUS PHI FRAME")
    dummy_phi = CrashTestDummy("Phi_Dummy")
    car_phi = PhiFrame()
    
    vel = v0
    pos = 0.0
    time_elapsed = 0.0
    
    print("   [TIME]   [G-FORCE]   [STATUS]")
    
    while vel > 0.1:
        force = car_phi.absorb(pos, vel)
        accel = force / mass
        g_force = accel / 9.81
        
        dummy_phi.register_impact(g_force)
        
        vel -= accel * dt
        pos += vel * dt
        time_elapsed += dt
        
        if time_elapsed <= 0.05:
            bar = "▓" * int(g_force / 5)
            print(f"   {time_elapsed*1000:.0f}ms      {g_force:.1f} G      {bar}")

    print("\n========================================")
    print("   CRASH REPORT EXPORT")
    print("========================================")
    print(f"   STANDARD PEAK G: {dummy_std.peak_g:.2f} G")
    print(f"   OUTCOME:         {dummy_std.survival}")
    print("-" * 40)
    print(f"   FRAYMUS PEAK G:  {dummy_phi.peak_g:.2f} G")
    print(f"   OUTCOME:         {dummy_phi.survival}")
    
    delta = dummy_std.peak_g - dummy_phi.peak_g
    reduction = (delta / dummy_std.peak_g) * 100.0
    print(f"   >> FORCE REDUCTION: {reduction:.1f}%")

if __name__ == "__main__":
    run_crash_simulation()