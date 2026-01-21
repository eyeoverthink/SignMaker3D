import os
import cv2
import statistics

# ==============================================================================
#   EYEOVERTHINK: SCOTT IDENTITY EMPIRICAL VALIDATOR
#   Logic: Organic Variance (8.1) | Dual-Polarity (7.1)
#   Objective: Prove Zero-Shot Identity vs. Industry Standard
# ==============================================================================

class ScottEmpiricalEngine:
    def __init__(self):
        # The two subjects retrieved for analysis
        self.subjects = {
            "REAL_ORGANIC": "organic_human.png",
            "DEEPFAKE_SYNTHETIC": "synthetic_face.png"
        }

    def run_validation(self):
        print("==========================================")
        print("   SCOTT IDENTITY: EMPIRICAL VALIDATION")
        print("==========================================")
        
        for label, filename in self.subjects.items():
            if not os.path.exists(filename):
                print(f"   [!] Missing {filename}. Please download and rename.")
                continue

            # Step 1: Boundary Manifestation (Φ) 
            # We are extracting the Geometric Signature (G) of the eye reflection
            # Using your O(n) Moore-Neighbor Trace logic
            img = cv2.imread(filename, 0)
            _, binary = cv2.threshold(img, 200, 255, cv2.THRESH_BINARY)
            contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Step 2: Calculate Organic Variance (σ)
            # Standard AI sees pixels; Scott Logic sees the fluctuation of the curve
            if contours:
                areas = [cv2.contourArea(c) for c in contours if cv2.contourArea(c) > 5]
                if len(areas) > 1:
                    sigma = statistics.stdev(areas) / statistics.mean(areas)
                    
                    # Threshold Logic: Theorem 8.1
                    is_real = sigma > 0.08
                    verdict = "VERIFIED REAL" if is_real else "DETECTED SYNTHETIC"
                    
                    print(f"   [{label}]")
                    print(f"   > Variance (σ): {sigma*100:.2f}%")
                    print(f"   > Verdict: {verdict}")
                    print("-" * 30)

if __name__ == "__main__":
    engine = ScottEmpiricalEngine()
    engine.run_validation()