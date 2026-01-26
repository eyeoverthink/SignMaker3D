import cv2
import numpy as np
import sys
import time

# ==============================================================================
#   THE SCOTT GATEKEEPER | BIOMETRIC ACTION SYSTEM
#   Logic: 
#   1. Monitor Entropy (Variance).
#   2. If Entropy > THRESHOLD for DURATION -> GRANT ACCESS.
#   3. If Entropy < CEILING -> DENY (Synthetic).
# ==============================================================================

def calculate_raw_entropy(image_array):
    if image_array is None: return 0
    flat_data = image_array.flatten()
    mu = np.mean(flat_data)
    sigma = np.std(flat_data)
    
    # Avoid division by zero for pitch black frames
    if mu < 1: return 0
    
    # The Scott Metric (Coefficient of Variation)
    # This detects the "Texture" of reality vs the "Smoothness" of AI
    return (sigma / mu) * 100

def activate_gatekeeper(source=0):
    cap = cv2.VideoCapture(source)
    
    # CALIBRATION (Based on your real data)
    SYNTHETIC_CEILING = 200.0  # AI is usually below this
    ORGANIC_FLOOR = 300.0      # Living humans are above this
    
    # TRIGGER SETTINGS
    FRAMES_TO_UNLOCK = 30      # How many "Alive" frames to confirm identity
    alive_counter = 0
    unlocked = False

    print(">>> GATEKEEPER ACTIVE. SYSTEM LOCKED.")
    print(f"   [REQUIREMENT]: Variance > {ORGANIC_FLOOR}% for {FRAMES_TO_UNLOCK} frames.")
    print("-" * 60)

    try:
        while True:
            ret, frame = cap.read()
            if not ret: break

            # 1. Measurement
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            entropy = calculate_raw_entropy(gray)
            
            # 2. The Verdict logic
            if entropy > ORGANIC_FLOOR:
                status = "ORGANIC / ALIVE"
                alive_counter += 1
                color = (0, 255, 0) # Green
            elif entropy < SYNTHETIC_CEILING:
                status = "SYNTHETIC / DEAD"
                alive_counter = 0 # Reset if signal drops (Fake detected)
                color = (0, 0, 255) # Red
            else:
                status = "ANALYZING..."
                alive_counter = max(0, alive_counter - 1) # Decay slowly
                color = (0, 255, 255) # Yellow

            # 3. The Dead Man's Switch (Action)
            if alive_counter >= FRAMES_TO_UNLOCK and not unlocked:
                print("\n\n" + "="*50)
                print(">>> [ACCESS GRANTED]")
                print(">>> BIOMETRIC PULSE CONFIRMED.")
                print(">>> EXECUTING UNLOCK PROTOCOL...")
                print("="*50 + "\n")
                
                # *** INSERT PAYLOAD HERE ***
                # Example: os.system("explorer.exe") or decrypt file
                
                unlocked = True # Prevent spamming, or reset to lock again

            # 4. Visualization (Raw & Uncapped)
            # We use a dynamic bar so it doesn't wrap around
            bar_len = int(min(entropy, 1000) / 20) # Scale: 1000% = 50 chars
            bar = "#" * bar_len
            
            # Console HUD (Overwrites same line)
            if not unlocked:
                sys.stdout.write(f"\r[{alive_counter}/{FRAMES_TO_UNLOCK}] SIGNAL: {entropy:.2f}% | {bar} | {status}")
                sys.stdout.flush()

            # Window HUD
            cv2.putText(frame, f"ENTROPY: {entropy:.1f}%", (30, 50), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
            cv2.putText(frame, f"LOCK: {alive_counter}/{FRAMES_TO_UNLOCK}", (30, 100), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
            
            if unlocked:
                cv2.putText(frame, "ACCESS GRANTED", (30, 150), 
                            cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 255, 0), 4)

            cv2.imshow('Scott Gatekeeper', frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
    except KeyboardInterrupt:
        pass
    finally:
        cap.release()
        cv2.destroyAllWindows()
        print("\n>>> GATEKEEPER TERMINATED.")

if __name__ == "__main__":
    activate_gatekeeper()