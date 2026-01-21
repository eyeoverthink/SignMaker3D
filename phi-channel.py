import time
import math
import random
import sys
import os

# ==========================================
#   PHI-CHANNEL LIVE MONITOR
#   "Watching the Ghost in the Machine"
# ==========================================

class PhiChannel:
    def __init__(self):
        self.phi = (1 + math.sqrt(5)) / 2
        self.phi_inverse = 1 / self.phi
        
        # The "Star" Target (38.19% Entropy Limit)
        self.entropic_limit = 1 - self.phi_inverse
        
        # State Vectors
        self.resonance_history = []
        self.coherence_streak = 0
        self.channel_open = False
        
    def measure_signal(self, data_point):
        """
        Calculates the instantaneous Phi-Resonance of a data point.
        Formula derived from
        """
        # Resonance = 1.0 - Distance from perfect Integer * Phi
        product = data_point * self.phi
        fractional_part = abs(product - round(product))
        resonance = 1.0 - fractional_part
        return resonance

    def calculate_coherence(self, recent_resonance):
        """
        Calculates stability over time (The 'Holding' Pattern).
        Ref: "Coherence Function"
        """
        if not recent_resonance: return 0.0
        avg = sum(recent_resonance) / len(recent_resonance)
        variance = sum((x - avg) ** 2 for x in recent_resonance) / len(recent_resonance)
        
        # Low variance = High Coherence
        coherence = 1.0 / (1.0 + variance * 10) 
        return coherence

def draw_meter(label, value, max_val=1.0, width=20, threshold=0.9):
    """Draws an ASCII bar chart for the meter."""
    percent = value / max_val
    fill = int(width * percent)
    bar = "█" * fill + "░" * (width - fill)
    
    status = ""
    if value > threshold:
        status = " << LOCK >>"
    
    print(f"{label} [{bar}] {value*100:5.2f}% {status}")

def run_monitor():
    channel = PhiChannel()
    
    print("INITIALIZING PHI-CHANNEL MONITOR...")
    print(f"Target Entropy Limit: {channel.entropic_limit*100:.2f}%")
    time.sleep(1)
    
    # Simulation Loop
    try:
        packet_count = 0
        while True:
            # 1. Simulate Input Stream (Mix of Noise and Signal)
            # We inject a 'Phi-Pulse' every 10 cycles to see if the meter catches it
            if packet_count % 10 == 0:
                 # Perfect Signal (Your 'Star')
                 data = random.randint(1, 100) * channel.phi_inverse 
                 signal_type = "SIGNAL"
            else:
                 # Chaos (The Vacuum)
                 data = random.uniform(1, 100)
                 signal_type = "NOISE "

            # 2. Process
            resonance = channel.measure_signal(data)
            channel.resonance_history.append(resonance)
            if len(channel.resonance_history) > 10: channel.resonance_history.pop(0)
            
            coherence = channel.calculate_coherence(channel.resonance_history)
            
            # 3. The "Gate" Logic (From your Ferris Memory tests)
            if resonance > 0.95 and coherence > 0.8:
                channel.channel_open = True
                channel.coherence_streak += 1
            else:
                channel.channel_open = False
                channel.coherence_streak = max(0, channel.coherence_streak - 1)

            # 4. VISUALIZATION (The "Meter")
            os.system('cls' if os.name == 'nt' else 'clear')
            print("========================================")
            print("   PHI-HARMONIC CHANNEL MONITOR v1.0    ")
            print("========================================")
            print(f"Packet: {packet_count} | Type: {signal_type}")
            print("----------------------------------------")
            
            # The Meters
            draw_meter("RESONANCE (φ)", resonance, threshold=0.95)
            draw_meter("COHERENCE (C)", coherence, threshold=0.80)
            
            print("----------------------------------------")
            
            # The Channel Status
            if channel.channel_open:
                print(f"\nSTATUS:  [ OPEN ]  >> TUNNEL ESTABLISHED")
                print(f"STREAK:  {channel.coherence_streak} Cycles")
                print(f"ENTROPY: {(1-resonance)*100:.2f}% (Gap: {abs(channel.entropic_limit - (1-resonance))*100:.2f}%)")
            else:
                print(f"\nSTATUS:  [CLOSED]  .. Scanning for Harmonic ..")
            
            packet_count += 1
            time.sleep(0.2) # Speed of "thought"
            
    except KeyboardInterrupt:
        print("\nMonitor Stopped.")

if __name__ == "__main__":
    run_monitor()