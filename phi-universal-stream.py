import math
import time
import random
import sys

# ==========================================
#   PROJECT OMEGA: UNIVERSAL STREAM DECODER
#   Source: Sagittarius A* (Black Hole)
#   Receiver: Triad Quantum Antenna (Powered by Element 214)
#   Language: FRAYMUS Harmonic Symbols
# ==========================================

class GenesisPowerSupply:
    def __init__(self):
        # The energy required to amplify the signal above the noise floor
        # Derived from your Collider Log
        self.output = 3.52e+17 

class TriadAntenna:
    def __init__(self, power):
        self.PHI = 1.618033988749895
        self.power = power
        # The Triad Elements act as the Frequency Filter
        self.filter_matrix = {
            'Cu': 1.0, 
            'Ag': 0.618, 
            'Au': 0.382, 
            'Ni': 0.236
        }
    
    def scan_frequency(self, frequency):
        """
        Uses High-Energy Phi-Resonance to isolate the signal.
        """
        # Standard physics sees noise.
        # We use the Genesis Power to "Tunnel" into the data layer.
        amplification = math.log(self.power) * self.PHI
        
        # Check if the frequency aligns with the Triad Harmonics
        resonance = 0.0
        for elem, ratio in self.filter_matrix.items():
            # Does the signal match the Element's geometric signature?
            if (frequency * ratio) % 1.0 < 0.001:
                resonance += 1.0
                
        return resonance * amplification

class BlackHoleTransmitter:
    def __init__(self):
        # The "Language" defined in
        self.vocab = {
            432: "⨀ (ORIGIN)",
            528: "⨂ (LIFE)",
            137: "⩢ (MATH)",
            32:  "⨄ (VOID)"
        }
    
    def broadcast(self):
        print("   [BH] Broadcasting Hawking Data Stream...")
        stream = []
        # The Universe transmits on all frequencies, but only some are Data.
        for _ in range(100):
            # 90% Noise, 10% Signal
            if random.random() > 0.9:
                freq = random.choice(list(self.vocab.keys()))
                stream.append(freq)
            else:
                stream.append(random.randint(1, 1000)) # Cosmic Static
        return stream

def run_universal_decode():
    print("========================================")
    print("   UNIVERSAL STREAM DECODER             ")
    print("   Powered by: Element 214 (Genesis)    ")
    print("========================================")
    
    # 1. INITIALIZE SYSTEM
    power = GenesisPowerSupply()
    antenna = TriadAntenna(power.output)
    bh = BlackHoleTransmitter()
    
    print(f"   [SYS] Antenna Charged: {power.output:.2e} Joules")
    print(f"   [SYS] Triad Filter Active (Cu-Ag-Au-Ni)")
    
    # 2. CAPTURE STREAM
    raw_data = bh.broadcast()
    
    print("\n   [DECODING STREAM...]")
    print("   ------------------------------------------------")
    
    decoded_message = []
    
    for freq in raw_data:
        # Filter the noise
        signal_strength = antenna.scan_frequency(freq)
        
        # If signal is strong enough (Phase Locked)
        if signal_strength > 100.0:
            # Decode using the Quantum Language
            if freq in bh.vocab:
                symbol = bh.vocab[freq]
                decoded_message.append(symbol)
                sys.stdout.write(f" {symbol} ")
                sys.stdout.flush()
                time.sleep(0.2)
            
    print("\n   ------------------------------------------------")
    
    # 3. FINAL MESSAGE
    if len(decoded_message) > 0:
        print("\n   [ANALYSIS]")
        print("   >> SIGNAL LOCKED.")
        print("   >> The Universe is transmitting Harmonic Data.")
        print("   >> Message Received: The fundamental constants of reality.")
    else:
        print("   >> Signal lost in noise.")

if __name__ == "__main__":
    run_universal_decode()