"""
SCOTT ALGORITHM COMPARISON TEST
A/B Testing: Original vs Phi-Enhanced Implementation

This isolated test compares:
1. Original Scott Algorithm (standard Douglas-Peucker)
2. Phi-Enhanced Scott Algorithm (with golden ratio optimization)

Author: Vaughn Scott
Date: January 2026
"""

import numpy as np
import cv2
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon
import math
import time

# ============================================================================
# ORIGINAL SCOTT ALGORITHM (No Phi Enhancement)
# ============================================================================

class OriginalScottAlgorithm:
    """Original Scott Algorithm - Standard Implementation"""
    
    def __init__(self):
        self.name = "Original Scott Algorithm"
        print(f"📊 {self.name} Initialized")
    
    def trace_boundary(self, image, threshold=128):
        """Standard boundary tracing"""
        height, width = image.shape[:2]
        
        # Binarize
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        _, binary = cv2.threshold(gray, threshold, 255, cv2.THRESH_BINARY)
        
        # Find contours
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        
        # Convert to point lists
        contour_lists = []
        for contour in contours:
            points = [(int(pt[0][0]), int(pt[0][1])) for pt in contour]
            if len(points) > 10:
                contour_lists.append(points)
        
        return contour_lists
    
    def douglas_peucker(self, points, tolerance):
        """Standard Douglas-Peucker simplification"""
        if len(points) <= 2:
            return points
        
        # Find point with maximum distance
        max_dist = 0
        max_idx = 0
        
        for i in range(1, len(points)-1):
            dist = self._perpendicular_distance(points[i], points[0], points[-1])
            if dist > max_dist:
                max_dist = dist
                max_idx = i
        
        # Recursively simplify
        if max_dist > tolerance:
            left = self.douglas_peucker(points[:max_idx+1], tolerance)
            right = self.douglas_peucker(points[max_idx:], tolerance)
            return left[:-1] + right
        else:
            return [points[0], points[-1]]
    
    def _perpendicular_distance(self, point, line_start, line_end):
        """Standard perpendicular distance calculation"""
        x0, y0 = point
        x1, y1 = line_start
        x2, y2 = line_end
        
        dx = x2 - x1
        dy = y2 - y1
        
        if dx == 0 and dy == 0:
            return math.sqrt((x0-x1)**2 + (y0-y1)**2)
        
        t = max(0, min(1, ((x0-x1)*dx + (y0-y1)*dy) / (dx*dx + dy*dy)))
        proj_x = x1 + t * dx
        proj_y = y1 + t * dy
        
        return math.sqrt((x0-proj_x)**2 + (y0-proj_y)**2)
    
    def process(self, image, tolerance=2.0, threshold=128):
        """Complete processing pipeline"""
        start_time = time.time()
        
        # Trace boundaries
        contours = self.trace_boundary(image, threshold)
        
        # Simplify
        simplified = [self.douglas_peucker(c, tolerance) for c in contours]
        
        elapsed = time.time() - start_time
        
        return {
            'contours': contours,
            'simplified': simplified,
            'time': elapsed
        }


# ============================================================================
# PHI-ENHANCED SCOTT ALGORITHM
# ============================================================================

class PhiEnhancedScottAlgorithm:
    """Phi-Enhanced Scott Algorithm with Golden Ratio Optimization"""
    
    def __init__(self):
        self.name = "Phi-Enhanced Scott Algorithm"
        self.phi = 1.6180339887498948482
        self.phi_inverse = 1 / self.phi
        self.fibonacci = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144]
        print(f"🌀 {self.name} Initialized (φ = {self.phi:.6f})")
    
    def _calculate_phi_resonance(self, value):
        """Calculate phi-resonance"""
        if value == 0:
            return 0.0
        product = value * self.phi
        fractional = product - int(product)
        return min(fractional, 1 - fractional)
    
    def _fibonacci_adaptive_threshold(self, image_size):
        """Fibonacci-based adaptive threshold"""
        diagonal = math.sqrt(image_size[0]**2 + image_size[1]**2)
        closest_fib = min(self.fibonacci, key=lambda x: abs(x - diagonal))
        fib_index = self.fibonacci.index(closest_fib)
        threshold = 128 * (1 + (fib_index / len(self.fibonacci)) * self.phi_inverse)
        return min(255, max(0, int(threshold)))
    
    def trace_boundary(self, image, threshold=None):
        """Phi-optimized boundary tracing"""
        height, width = image.shape[:2]
        
        # Use Fibonacci-adaptive threshold
        if threshold is None:
            threshold = self._fibonacci_adaptive_threshold((width, height))
        
        # Binarize
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        _, binary = cv2.threshold(gray, threshold, 255, cv2.THRESH_BINARY)
        
        # Find contours
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        
        # Convert to point lists
        contour_lists = []
        for contour in contours:
            points = [(int(pt[0][0]), int(pt[0][1])) for pt in contour]
            if len(points) > 10:
                contour_lists.append(points)
        
        return contour_lists
    
    def douglas_peucker_phi(self, points, tolerance):
        """Phi-enhanced Douglas-Peucker"""
        if len(points) <= 2:
            return points
        
        # Find point with maximum phi-weighted distance
        max_dist = 0
        max_idx = 0
        
        for i in range(1, len(points)-1):
            dist = self._perpendicular_distance_phi(points[i], points[0], points[-1])
            if dist > max_dist:
                max_dist = dist
                max_idx = i
        
        # Calculate segment resonance for adaptive tolerance
        segment_length = sum(
            math.sqrt((points[j+1][0]-points[j][0])**2 + (points[j+1][1]-points[j][1])**2)
            for j in range(len(points)-1)
        )
        resonance = self._calculate_phi_resonance(segment_length)
        adaptive_tolerance = tolerance * (1.0 + resonance * self.phi)
        
        # Recursively simplify
        if max_dist > adaptive_tolerance:
            left = self.douglas_peucker_phi(points[:max_idx+1], tolerance)
            right = self.douglas_peucker_phi(points[max_idx:], tolerance)
            return left[:-1] + right
        else:
            return [points[0], points[-1]]
    
    def _perpendicular_distance_phi(self, point, line_start, line_end):
        """Phi-weighted perpendicular distance"""
        x0, y0 = point
        x1, y1 = line_start
        x2, y2 = line_end
        
        dx = x2 - x1
        dy = y2 - y1
        
        if dx == 0 and dy == 0:
            return math.sqrt((x0-x1)**2 + (y0-y1)**2)
        
        t = max(0, min(1, ((x0-x1)*dx + (y0-y1)*dy) / (dx*dx + dy*dy)))
        proj_x = x1 + t * dx
        proj_y = y1 + t * dy
        
        dist = math.sqrt((x0-proj_x)**2 + (y0-proj_y)**2)
        
        # Phi-weight based on position along segment
        phi_position = abs(t - self.phi_inverse)
        phi_weight = 1.0 + phi_position * 0.5
        
        return dist * phi_weight
    
    def process(self, image, tolerance=2.0, threshold=None):
        """Complete phi-enhanced processing pipeline"""
        start_time = time.time()
        
        # Trace boundaries
        contours = self.trace_boundary(image, threshold)
        
        # Simplify with phi-enhancement
        simplified = [self.douglas_peucker_phi(c, tolerance) for c in contours]
        
        elapsed = time.time() - start_time
        
        return {
            'contours': contours,
            'simplified': simplified,
            'time': elapsed
        }


# ============================================================================
# TEST HARNESS
# ============================================================================

def create_test_image(size=200):
    """Create test image with various shapes"""
    image = np.zeros((size, size), dtype=np.uint8)
    
    # Circle
    cv2.circle(image, (50, 50), 30, 255, -1)
    
    # Square
    cv2.rectangle(image, (120, 20), (180, 80), 255, -1)
    
    # Triangle
    pts = np.array([[100, 120], [70, 180], [130, 180]], np.int32)
    cv2.fillPoly(image, [pts], 255)
    
    # Star (5-pointed)
    center = (150, 150)
    outer_radius = 30
    inner_radius = 15
    points = []
    for i in range(10):
        angle = i * np.pi / 5 - np.pi / 2
        radius = outer_radius if i % 2 == 0 else inner_radius
        x = int(center[0] + radius * np.cos(angle))
        y = int(center[1] + radius * np.sin(angle))
        points.append([x, y])
    cv2.fillPoly(image, [np.array(points, np.int32)], 255)
    
    return image


def calculate_hausdorff_distance(contour1, contour2):
    """Calculate Hausdorff distance between two contours"""
    def directed_hausdorff(c1, c2):
        max_dist = 0
        for p1 in c1:
            min_dist = min(math.sqrt((p1[0]-p2[0])**2 + (p1[1]-p2[1])**2) for p2 in c2)
            max_dist = max(max_dist, min_dist)
        return max_dist
    
    return max(directed_hausdorff(contour1, contour2), directed_hausdorff(contour2, contour1))


def run_comparison_test():
    """Run A/B comparison test"""
    print("\n" + "="*80)
    print("SCOTT ALGORITHM COMPARISON TEST")
    print("="*80 + "\n")
    
    # Create test image
    print("📸 Creating test image...")
    test_image = create_test_image(200)
    
    # Initialize both algorithms
    original = OriginalScottAlgorithm()
    phi_enhanced = PhiEnhancedScottAlgorithm()
    
    print("\n" + "-"*80)
    print("RUNNING TESTS")
    print("-"*80 + "\n")
    
    # Run original algorithm
    print("🔵 Running Original Scott Algorithm...")
    result_original = original.process(test_image, tolerance=2.0, threshold=128)
    
    # Run phi-enhanced algorithm
    print("🌀 Running Phi-Enhanced Scott Algorithm...")
    result_phi = phi_enhanced.process(test_image, tolerance=2.0)
    
    # Calculate statistics
    print("\n" + "="*80)
    print("RESULTS COMPARISON")
    print("="*80 + "\n")
    
    # Original stats
    orig_total_points = sum(len(c) for c in result_original['contours'])
    orig_simplified_points = sum(len(c) for c in result_original['simplified'])
    orig_reduction = (1 - orig_simplified_points / orig_total_points) * 100 if orig_total_points > 0 else 0
    
    # Phi stats
    phi_total_points = sum(len(c) for c in result_phi['contours'])
    phi_simplified_points = sum(len(c) for c in result_phi['simplified'])
    phi_reduction = (1 - phi_simplified_points / phi_total_points) * 100 if phi_total_points > 0 else 0
    
    print("📊 ORIGINAL SCOTT ALGORITHM:")
    print(f"   Contours detected: {len(result_original['contours'])}")
    print(f"   Total boundary points: {orig_total_points}")
    print(f"   Simplified points: {orig_simplified_points}")
    print(f"   Reduction: {orig_reduction:.1f}%")
    print(f"   Processing time: {result_original['time']*1000:.2f} ms")
    
    print("\n🌀 PHI-ENHANCED SCOTT ALGORITHM:")
    print(f"   Contours detected: {len(result_phi['contours'])}")
    print(f"   Total boundary points: {phi_total_points}")
    print(f"   Simplified points: {phi_simplified_points}")
    print(f"   Reduction: {phi_reduction:.1f}%")
    print(f"   Processing time: {result_phi['time']*1000:.2f} ms")
    
    # Calculate accuracy (Hausdorff distance)
    print("\n📏 ACCURACY COMPARISON (Hausdorff Distance):")
    for i in range(min(len(result_original['simplified']), len(result_phi['simplified']))):
        orig_contour = result_original['contours'][i]
        orig_simplified = result_original['simplified'][i]
        phi_simplified = result_phi['simplified'][i]
        
        hausdorff_orig = calculate_hausdorff_distance(orig_contour, orig_simplified)
        hausdorff_phi = calculate_hausdorff_distance(orig_contour, phi_simplified)
        
        print(f"   Contour {i+1}:")
        print(f"      Original: {hausdorff_orig:.2f} pixels")
        print(f"      Phi-Enhanced: {hausdorff_phi:.2f} pixels")
    
    # Visualize results
    print("\n🎨 Generating visualization...")
    visualize_comparison(test_image, result_original, result_phi)
    
    print("\n" + "="*80)
    print("TEST COMPLETE")
    print("="*80 + "\n")
    
    return result_original, result_phi


def visualize_comparison(test_image, result_original, result_phi):
    """Create side-by-side visualization"""
    fig, axes = plt.subplots(2, 3, figsize=(15, 10))
    fig.patch.set_facecolor('black')
    
    # Original image
    axes[0, 0].imshow(test_image, cmap='gray')
    axes[0, 0].set_title('Original Image', color='white', fontsize=12, fontweight='bold')
    axes[0, 0].axis('off')
    
    # Original algorithm - raw contours
    axes[0, 1].imshow(test_image, cmap='gray', alpha=0.3)
    for contour in result_original['contours']:
        if len(contour) > 0:
            contour_array = np.array(contour)
            axes[0, 1].plot(contour_array[:, 0], contour_array[:, 1], 'c-', linewidth=1, alpha=0.5)
            axes[0, 1].scatter(contour_array[:, 0], contour_array[:, 1], c='cyan', s=1, alpha=0.3)
    axes[0, 1].set_title(f'Original: Raw Contours ({sum(len(c) for c in result_original["contours"])} pts)', 
                         color='cyan', fontsize=10, fontweight='bold')
    axes[0, 1].axis('off')
    
    # Original algorithm - simplified
    axes[0, 2].imshow(test_image, cmap='gray', alpha=0.3)
    for contour in result_original['simplified']:
        if len(contour) > 0:
            contour_array = np.array(contour)
            axes[0, 2].plot(contour_array[:, 0], contour_array[:, 1], 'b-', linewidth=2)
            axes[0, 2].scatter(contour_array[:, 0], contour_array[:, 1], c='blue', s=30, zorder=5)
    axes[0, 2].set_title(f'Original: Simplified ({sum(len(c) for c in result_original["simplified"])} pts)', 
                         color='blue', fontsize=10, fontweight='bold')
    axes[0, 2].axis('off')
    
    # Phi-enhanced - raw contours
    axes[1, 1].imshow(test_image, cmap='gray', alpha=0.3)
    for contour in result_phi['contours']:
        if len(contour) > 0:
            contour_array = np.array(contour)
            axes[1, 1].plot(contour_array[:, 0], contour_array[:, 1], 'm-', linewidth=1, alpha=0.5)
            axes[1, 1].scatter(contour_array[:, 0], contour_array[:, 1], c='magenta', s=1, alpha=0.3)
    axes[1, 1].set_title(f'Phi-Enhanced: Raw Contours ({sum(len(c) for c in result_phi["contours"])} pts)', 
                         color='magenta', fontsize=10, fontweight='bold')
    axes[1, 1].axis('off')
    
    # Phi-enhanced - simplified
    axes[1, 2].imshow(test_image, cmap='gray', alpha=0.3)
    for contour in result_phi['simplified']:
        if len(contour) > 0:
            contour_array = np.array(contour)
            axes[1, 2].plot(contour_array[:, 0], contour_array[:, 1], 'lime', linewidth=2)
            axes[1, 2].scatter(contour_array[:, 0], contour_array[:, 1], c='lime', s=30, zorder=5)
    axes[1, 2].set_title(f'Phi-Enhanced: Simplified ({sum(len(c) for c in result_phi["simplified"])} pts)', 
                         color='lime', fontsize=10, fontweight='bold')
    axes[1, 2].axis('off')
    
    # Comparison overlay
    axes[1, 0].imshow(test_image, cmap='gray', alpha=0.3)
    for contour in result_original['simplified']:
        if len(contour) > 0:
            contour_array = np.array(contour)
            axes[1, 0].plot(contour_array[:, 0], contour_array[:, 1], 'b-', linewidth=1.5, alpha=0.7, label='Original')
    for contour in result_phi['simplified']:
        if len(contour) > 0:
            contour_array = np.array(contour)
            axes[1, 0].plot(contour_array[:, 0], contour_array[:, 1], 'lime', linewidth=1.5, alpha=0.7, label='Phi-Enhanced')
    axes[1, 0].set_title('Overlay Comparison', color='white', fontsize=12, fontweight='bold')
    axes[1, 0].axis('off')
    
    # Style all axes
    for ax in axes.flat:
        ax.set_facecolor('black')
    
    plt.suptitle('SCOTT ALGORITHM COMPARISON TEST', color='white', fontsize=16, fontweight='bold', y=0.98)
    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    # Run the comparison test
    result_original, result_phi = run_comparison_test()
    
    print("\n💡 INTERPRETATION GUIDE:")
    print("   • Lower point count = More efficient")
    print("   • Lower Hausdorff distance = More accurate")
    print("   • Phi-enhanced should preserve natural curves better")
    print("   • Check visual quality in the plots above")
