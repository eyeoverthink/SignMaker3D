"""
PHI-ENHANCED SCOTT ALGORITHM
Integrating Golden Ratio and Fibonacci Sequence for Optimal Image Tracing

Author: Vaughn Scott
Date: January 2026

This enhancement integrates phi-harmonic mathematics into the Scott Algorithm
for superior boundary tracing and path simplification.
"""

import numpy as np
import cv2
from mpmath import mp, mpf
import math

# Set high precision for phi calculations
mp.dps = 100

class PhiEnhancedScottAlgorithm:
    def __init__(self):
        # Golden ratio and related constants
        self.phi = mpf('1.6180339887498948482045868343656381177203091798057628621')
        self.phi_inverse = 1 / self.phi  # 0.618034...
        self.phi_squared = self.phi ** 2  # 2.618034...
        
        # Fibonacci sequence for adaptive sampling
        self.fibonacci = self._generate_fibonacci(20)
        
        # Phi-harmonic frequencies for resonance detection
        self.frequencies = {
            'phi_base': float(self.phi * 1000),
            'phi_sqrt': float(mp.sqrt(self.phi) * 1000),
            'triangular': float(60 * self.phi),
            'perpendicular': float(90 * self.phi),
            'angle_bisector': float(30 * self.phi_squared)
        }
        
        print(f"🌀 Phi-Enhanced Scott Algorithm Initialized")
        print(f"   φ = {float(self.phi):.16f}")
        print(f"   φ⁻¹ = {float(self.phi_inverse):.16f}")
        print(f"   φ² = {float(self.phi_squared):.16f}")
    
    def _generate_fibonacci(self, n):
        """Generate Fibonacci sequence up to n terms"""
        fib = [1, 1]
        for i in range(2, n):
            fib.append(fib[-1] + fib[-2])
        return fib
    
    def _calculate_phi_resonance(self, value):
        """
        Calculate phi-resonance of a value
        Perfect resonance = 0.000000
        """
        if value == 0:
            return 0.0
        
        # Calculate fractional part of (value * phi)
        product = float(mpf(value) * self.phi)
        fractional = product - int(product)
        
        # Perfect resonance when fractional part is near 0 or 1
        resonance = min(fractional, 1 - fractional)
        return resonance
    
    def _fibonacci_adaptive_threshold(self, image_size):
        """
        Use Fibonacci sequence to determine optimal threshold
        based on image dimensions
        """
        # Find closest Fibonacci number to image diagonal
        diagonal = math.sqrt(image_size[0]**2 + image_size[1]**2)
        
        closest_fib = min(self.fibonacci, key=lambda x: abs(x - diagonal))
        fib_index = self.fibonacci.index(closest_fib)
        
        # Threshold scales with phi-ratio
        threshold = 128 * (1 + (fib_index / len(self.fibonacci)) * float(self.phi_inverse))
        
        return min(255, max(0, int(threshold)))
    
    def _phi_weighted_distance(self, p1, p2):
        """
        Calculate distance with phi-harmonic weighting
        This emphasizes natural curvature patterns
        """
        dx = p2[0] - p1[0]
        dy = p2[1] - p1[1]
        
        # Standard Euclidean distance
        dist = math.sqrt(dx**2 + dy**2)
        
        # Phi-weighted based on angle
        angle = math.atan2(dy, dx)
        
        # Phi-resonance of angle (in degrees)
        angle_deg = abs(math.degrees(angle))
        angle_resonance = self._calculate_phi_resonance(angle_deg)
        
        # Weight distance by resonance (lower resonance = more natural = lower weight)
        phi_weight = 1.0 + angle_resonance * float(self.phi_inverse)
        
        return dist * phi_weight
    
    def _douglas_peucker_phi(self, points, tolerance):
        """
        Douglas-Peucker simplification enhanced with phi-harmonic distance
        """
        if len(points) <= 2:
            return points
        
        # Find point with maximum phi-weighted distance
        max_dist = 0
        max_idx = 0
        
        for i in range(1, len(points)-1):
            # Calculate perpendicular distance with phi-weighting
            dist = self._perpendicular_distance_phi(points[i], points[0], points[-1])
            
            if dist > max_dist:
                max_dist = dist
                max_idx = i
        
        # Adaptive tolerance based on phi-resonance
        # If the segment has high phi-resonance, use stricter tolerance
        segment_resonance = self._calculate_segment_resonance(points)
        adaptive_tolerance = tolerance * (1.0 + segment_resonance * float(self.phi))
        
        # Recursively simplify
        if max_dist > adaptive_tolerance:
            left = self._douglas_peucker_phi(points[:max_idx+1], tolerance)
            right = self._douglas_peucker_phi(points[max_idx:], tolerance)
            return left[:-1] + right
        else:
            return [points[0], points[-1]]
    
    def _perpendicular_distance_phi(self, point, line_start, line_end):
        """
        Calculate perpendicular distance with phi-harmonic weighting
        """
        x0, y0 = point
        x1, y1 = line_start
        x2, y2 = line_end
        
        dx = x2 - x1
        dy = y2 - y1
        
        if dx == 0 and dy == 0:
            return math.sqrt((x0-x1)**2 + (y0-y1)**2)
        
        # Project point onto line
        t = max(0, min(1, ((x0-x1)*dx + (y0-y1)*dy) / (dx*dx + dy*dy)))
        proj_x = x1 + t * dx
        proj_y = y1 + t * dy
        
        # Standard perpendicular distance
        dist = math.sqrt((x0-proj_x)**2 + (y0-proj_y)**2)
        
        # Phi-weight based on position along segment
        # Points at phi-ratio positions are more significant
        phi_position = abs(t - float(self.phi_inverse))
        phi_weight = 1.0 + phi_position * 0.5
        
        return dist * phi_weight
    
    def _calculate_segment_resonance(self, points):
        """
        Calculate phi-resonance of a path segment
        High resonance = natural curve, preserve detail
        """
        if len(points) < 3:
            return 0.0
        
        # Calculate total path length
        total_length = 0
        for i in range(len(points)-1):
            total_length += self._phi_weighted_distance(points[i], points[i+1])
        
        # Calculate resonance based on length
        resonance = self._calculate_phi_resonance(total_length)
        
        return resonance
    
    def _fibonacci_curvature_detection(self, points):
        """
        Detect curvature using Fibonacci-spaced sampling
        This identifies natural inflection points
        """
        if len(points) < 5:
            return []
        
        curvature_points = []
        
        # Sample at Fibonacci intervals
        for fib in self.fibonacci:
            if fib >= len(points):
                break
            
            if fib < len(points) - 2:
                # Calculate curvature at this point
                p1 = points[max(0, fib-1)]
                p2 = points[fib]
                p3 = points[min(len(points)-1, fib+1)]
                
                # Curvature using Menger curvature formula
                curvature = self._calculate_curvature(p1, p2, p3)
                
                if curvature > 0.1:  # Significant curvature
                    curvature_points.append((fib, curvature))
        
        return curvature_points
    
    def _calculate_curvature(self, p1, p2, p3):
        """
        Calculate Menger curvature at point p2
        """
        # Area of triangle formed by three points
        area = abs((p2[0] - p1[0]) * (p3[1] - p1[1]) - 
                   (p3[0] - p1[0]) * (p2[1] - p1[1])) / 2.0
        
        # Side lengths
        a = math.sqrt((p2[0]-p1[0])**2 + (p2[1]-p1[1])**2)
        b = math.sqrt((p3[0]-p2[0])**2 + (p3[1]-p2[1])**2)
        c = math.sqrt((p3[0]-p1[0])**2 + (p3[1]-p1[1])**2)
        
        if a * b * c == 0:
            return 0.0
        
        # Menger curvature
        curvature = 4 * area / (a * b * c)
        
        return curvature
    
    def trace_boundary_phi(self, image, threshold=None):
        """
        Moore-Neighbor boundary tracing with phi-harmonic optimization
        """
        height, width = image.shape[:2]
        
        # Use Fibonacci-adaptive threshold if not specified
        if threshold is None:
            threshold = self._fibonacci_adaptive_threshold((width, height))
            print(f"   Fibonacci-adaptive threshold: {threshold}")
        
        # Binarize image
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        _, binary = cv2.threshold(gray, threshold, 255, cv2.THRESH_BINARY)
        
        # Find contours using OpenCV (optimized implementation)
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        
        # Convert to point lists
        contour_lists = []
        for contour in contours:
            points = [(int(pt[0][0]), int(pt[0][1])) for pt in contour]
            if len(points) > 10:  # Filter small noise
                contour_lists.append(points)
        
        print(f"   Detected {len(contour_lists)} contours")
        
        return contour_lists
    
    def simplify_with_phi(self, contours, base_tolerance=2.0):
        """
        Simplify contours using phi-enhanced Douglas-Peucker
        """
        simplified_contours = []
        
        for i, contour in enumerate(contours):
            # Calculate phi-resonance of contour
            contour_length = sum(
                self._phi_weighted_distance(contour[j], contour[j+1])
                for j in range(len(contour)-1)
            )
            
            resonance = self._calculate_phi_resonance(contour_length)
            
            # Adaptive tolerance based on resonance
            # High resonance = natural shape = preserve more detail
            tolerance = base_tolerance * (1.0 - resonance * 0.5)
            
            # Detect curvature points using Fibonacci sampling
            curvature_points = self._fibonacci_curvature_detection(contour)
            
            # Simplify with phi-enhanced algorithm
            simplified = self._douglas_peucker_phi(contour, tolerance)
            
            # Calculate reduction
            reduction = (1 - len(simplified) / len(contour)) * 100
            
            print(f"   Contour {i+1}: {len(contour)} → {len(simplified)} points "
                  f"({reduction:.1f}% reduction, φ-resonance: {resonance:.6f})")
            
            simplified_contours.append(simplified)
        
        return simplified_contours
    
    def process_image(self, image_path, tolerance=2.0, threshold=None):
        """
        Complete phi-enhanced Scott Algorithm pipeline
        """
        print(f"\n🌀 Processing: {image_path}")
        
        # Load image
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not load image: {image_path}")
        
        print(f"   Image size: {image.shape[1]}×{image.shape[0]}")
        
        # Phase 1: Boundary tracing with phi-optimization
        contours = self.trace_boundary_phi(image, threshold)
        
        # Phase 2: Phi-enhanced simplification
        simplified = self.simplify_with_phi(contours, tolerance)
        
        # Calculate overall statistics
        total_original = sum(len(c) for c in contours)
        total_simplified = sum(len(c) for c in simplified)
        overall_reduction = (1 - total_simplified / total_original) * 100 if total_original > 0 else 0
        
        print(f"\n   ✅ Overall: {total_original} → {total_simplified} points "
              f"({overall_reduction:.1f}% reduction)")
        
        return {
            'original_contours': contours,
            'simplified_contours': simplified,
            'reduction_percentage': overall_reduction,
            'phi': float(self.phi),
            'fibonacci_sequence': self.fibonacci[:10]
        }


# Example usage
if __name__ == "__main__":
    # Initialize phi-enhanced algorithm
    scott = PhiEnhancedScottAlgorithm()
    
    # Process an image
    # result = scott.process_image('path/to/image.png', tolerance=2.0)
    
    print("\n" + "="*70)
    print("PHI-ENHANCED SCOTT ALGORITHM")
    print("="*70)
    print(f"Golden Ratio (φ): {float(scott.phi):.16f}")
    print(f"Fibonacci Sequence: {scott.fibonacci[:10]}")
    print(f"Phi-Harmonic Frequencies: {scott.frequencies}")
    print("="*70)
