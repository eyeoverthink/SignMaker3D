import cv2
import numpy as np
import time
import os
import sys

# ==============================================================================
#   THE SCOTT VITAL SIGNS MONITOR
#   Paradigm: Zero-Shot Physics (No Training)
#   Function: Measures the 'Entropy Pulse' of a data stream in real-time.
# ==============================================================================

def calculate_life_signal(image_array):
    """
    Applies the Scott Variance Protocol to a raw data array.
    Returns the 'Energy' (Sigma) of the frame.
    """
    if image_array is None:
        return 0
    
    # Flatten to 1D array of raw intensity
    flat_data = image_array.flatten()
    
    # The Scott Metric: Standard Deviation (Chaos) relative to Mean (Order)
    mu = np.mean(flat_data)
    sigma = np.std(flat_data)
    
    if mu == 0: return 0
    
    # This is the "Voltage" of the image
    variance_score = (sigma / mu) * 100
    return variance_score

def start_monitoring(source=0):
    """
    Connects to a live feed (Webcam or Video File).
    Treats the video not as 'pictures', but as a stream of living data.
    """
    cap = cv2.VideoCapture(source)
    
    print(">>> INITIALIZING SCOTT VITAL SIGNS MONITOR...")
    print(">>> SENSORS ACTIVE. LISTENING FOR ENTROPY PULSE.")
    print("-" * 50)
    
    # Calibration baseline
    ORGANIC_THRESHOLD = 300.0 
    SYNTHETIC_CEILING = 200.0
    
    history = []
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # 1. Convert to Grayscale (Measure pure luminance intensity)
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # 2. Extract the Life Signal
            pulse = calculate_life_signal(gray)
            history.append(pulse)
            if len(history) > 10: history.pop(0) # Keep rolling average
            
            # 3. The Verdict (Real-Time)
            status = ""
            if pulse > ORGANIC_THRESHOLD:
                status = "[ALIVE / ORGANIC] - High Entropy"
                bar = "||||||||||||||||||||||||||||||||||"
            elif pulse < SYNTHETIC_CEILING:
                status = "[DEAD / SYNTHETIC] - Low Entropy"
                bar = "||||||"
            else:
                status = "[UNCERTAIN / HYBRID]"
                bar = "||||||||||||||"
            
            # 4. Visualization
            # This allows you to SEE the data breathing
            sys.stdout.write(f"\rSIGNAL: {pulse:.2f}% | {bar} {status}")
            sys.stdout.flush()
            
            # Visual Feed with HUD
            cv2.putText(frame, f"VARIANCE: {pulse:.2f}%", (10, 30), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
            if pulse > ORGANIC_THRESHOLD:
                cv2.putText(frame, "STATUS: ORGANIC", (10, 60), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            else:
                cv2.putText(frame, "STATUS: SYNTHETIC", (10, 60), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            
            cv2.imshow('Scott Vital Signs', frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
    except KeyboardInterrupt:
        pass
    finally:
        cap.release()
        cv2.destroyAllWindows()
        print("\n>>> MONITOR TERMINATED.")

if __name__ == "__main__":
    # If you provide a video file path as an argument, it reads that.
    # Otherwise, it defaults to the webcam (Source 0) to look at YOU.
    if len(sys.argv) > 1:
        start_monitoring(sys.argv[1])
    else:
        start_monitoring(0)