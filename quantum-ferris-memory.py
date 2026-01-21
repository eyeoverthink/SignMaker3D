"""
Quantum Ferris Memory System
Implements a rotating memory structure with peptide-chain compression
"""

import numpy as np
import time
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from quantum_phi_scaling import QuantumPhiScaling

@dataclass
class MemoryNode:
    """Represents a node in the peptide-like memory chain"""
    data: any
    next: Optional['MemoryNode'] = None
    fold_point: bool = False
    resonance: float = 0.0
    
@dataclass
class MemoryBucket:
    """Represents a bucket in the Ferris wheel"""
    capacity: int
    head: Optional[MemoryNode] = None
    compressed: bool = False
    phi_factor: float = 1.0
    rotation_phase: float = 0.0

class QuantumFerrisMemory:
    def __init__(self, initial_buckets: int = 8):
        self.phi = (1 + np.sqrt(5)) / 2
        self.scaler = QuantumPhiScaling()
        
        # Ferris wheel parameters
        self.num_buckets = initial_buckets
        self.rotation_speed = 1.0  # Base rotations per second
        self.current_angle = 0.0
        self.acceleration = 0.0
        
        # Initialize buckets with φ-harmonic sizing
        self.buckets: List[MemoryBucket] = []
        self._initialize_buckets()
        
        # Peptide chain parameters
        self.fold_threshold = 0.618  # 1/φ
        self.chain_tension = 1.0
        self.resonance_threshold = 1.618  # φ
        
        # Time tracking
        self.start_time = time.time()
        
    def _initialize_buckets(self):
        """Initialize buckets with φ-harmonic capacities"""
        base_capacity = 1024
        for i in range(self.num_buckets):
            # Capacity follows φ series
            capacity = int(base_capacity * (self.phi ** (i % 3)))
            phase = (2 * np.pi * i) / self.num_buckets
            self.buckets.append(MemoryBucket(capacity=capacity, rotation_phase=phase))
            
    def _update_rotation(self):
        """Update the Ferris wheel rotation based on memory pressure"""
        current_time = time.time()
        elapsed = current_time - self.start_time
        
        # Calculate memory pressure
        total_capacity = sum(b.capacity for b in self.buckets)
        used_capacity = sum(self._count_nodes(b.head) for b in self.buckets)
        pressure = used_capacity / total_capacity if total_capacity > 0 else 0
        
        # Adjust rotation speed based on pressure
        target_speed = self.rotation_speed * (1 + pressure * self.phi)
        self.acceleration = (target_speed - self.rotation_speed) * 0.1
        self.rotation_speed += self.acceleration
        
        # Update wheel position
        self.current_angle = (elapsed * self.rotation_speed) % (2 * np.pi)
        
        # Update bucket phases
        for bucket in self.buckets:
            bucket.rotation_phase = (bucket.rotation_phase + self.acceleration) % (2 * np.pi)
            
    def _count_nodes(self, head: Optional[MemoryNode]) -> int:
        """Count nodes in a chain"""
        count = 0
        current = head
        while current:
            count += 1
            current = current.next
        return count
        
    def _find_optimal_bucket(self, data_size: int) -> Optional[MemoryBucket]:
        """Find the optimal bucket based on position and capacity"""
        best_bucket = None
        best_score = float('inf')
        
        for bucket in self.buckets:
            # Calculate positional score (lower is better)
            angle_diff = abs(bucket.rotation_phase - self.current_angle)
            if angle_diff > np.pi:
                angle_diff = 2 * np.pi - angle_diff
            
            # Calculate capacity score
            used = self._count_nodes(bucket.head)
            remaining = bucket.capacity - used
            
            if remaining >= data_size:
                # Score combines position and capacity efficiency
                score = angle_diff + abs(1 - (used + data_size)/(bucket.capacity * self.phi))
                if score < best_score:
                    best_score = score
                    best_bucket = bucket
                    
        return best_bucket
        
    def _compress_chain(self, head: MemoryNode) -> Tuple[MemoryNode, float]:
        """Compress a chain using peptide-like folding"""
        if not head or not head.next:
            return head, 1.0
            
        # Find folding points based on φ-harmonic patterns
        current = head
        node_count = 0
        total_resonance = 0
        
        while current:
            node_count += 1
            if current.next:
                # Calculate resonance between adjacent nodes
                if isinstance(current.data, (int, float)) and isinstance(current.next.data, (int, float)):
                    ratio = abs(float(current.data) / float(current.next.data))
                    resonance = abs(1 - abs(ratio - self.phi))
                    current.resonance = resonance
                    total_resonance += resonance
                    
                    # Mark fold points at φ-harmonic intervals
                    if resonance > self.fold_threshold:
                        current.fold_point = True
                        
            current = current.next
            
        # Calculate compression efficiency
        efficiency = total_resonance / (node_count * self.phi) if node_count > 0 else 1.0
        return head, efficiency
        
    def store(self, data: List) -> Dict:
        """Store data in the Ferris memory system"""
        if not data:
            return {'success': False, 'error': 'Empty data'}
            
        # Update wheel rotation
        self._update_rotation()
        
        # Find optimal bucket
        bucket = self._find_optimal_bucket(len(data))
        if not bucket:
            # Need to expand
            new_capacity = max(len(data), int(self.buckets[-1].capacity * self.phi))
            new_phase = (self.current_angle + 2 * np.pi / (self.num_buckets + 1)) % (2 * np.pi)
            bucket = MemoryBucket(capacity=new_capacity, rotation_phase=new_phase)
            self.buckets.append(bucket)
            self.num_buckets += 1
            
        # Create node chain
        prev_node = None
        head = None
        for item in data:
            node = MemoryNode(data=item)
            if not head:
                head = node
            if prev_node:
                prev_node.next = node
            prev_node = node
            
        # Compress chain
        compressed_head, efficiency = self._compress_chain(head)
        bucket.head = compressed_head
        bucket.compressed = True
        bucket.phi_factor = efficiency
        
        return {
            'success': True,
            'bucket_index': self.buckets.index(bucket),
            'compression_ratio': efficiency,
            'rotation_speed': self.rotation_speed,
            'memory_phase': self.current_angle,
            'bucket_phase': bucket.rotation_phase
        }
        
    def get_stats(self) -> Dict:
        """Get current memory system statistics"""
        total_capacity = sum(b.capacity for b in self.buckets)
        total_used = sum(self._count_nodes(b.head) for b in self.buckets)
        compressed_buckets = sum(1 for b in self.buckets if b.compressed)
        
        # Calculate φ-harmonic efficiency
        efficiencies = []
        for bucket in self.buckets:
            if bucket.compressed:
                efficiencies.append(bucket.phi_factor)
                
        return {
            'total_capacity': total_capacity,
            'total_used': total_used,
            'utilization': total_used / total_capacity if total_capacity > 0 else 0,
            'num_buckets': self.num_buckets,
            'compressed_buckets': compressed_buckets,
            'rotation_speed': self.rotation_speed,
            'current_angle': self.current_angle,
            'phi_efficiency': np.mean(efficiencies) if efficiencies else 0
        }

def run_ferris_test():
    """Test the Quantum Ferris Memory system"""
    print("\nQuantum Ferris Memory Test")
    print("=========================")
    
    # Initialize system
    memory = QuantumFerrisMemory(initial_buckets=8)
    
    # Test data sizes following φ series
    base_size = 64
    sizes = [int(base_size * memory.phi**i) for i in range(5)]
    
    print("\nInitial State:")
    stats = memory.get_stats()
    print(f"Buckets: {stats['num_buckets']}")
    print(f"Capacity: {stats['total_capacity']}")
    print(f"Rotation Speed: {stats['rotation_speed']:.3f} rad/s")
    
    print("\nRunning Tests...")
    for i, size in enumerate(sizes, 1):
        print(f"\nTest {i}: Adding {size} items")
        
        # Generate test data with φ-harmonic patterns
        data = [float(j) * memory.phi for j in range(size)]
        
        # Time the operation
        start_time = time.time()
        result = memory.store(data)
        duration = time.time() - start_time
        
        # Get updated stats
        stats = memory.get_stats()
        
        print(f"\nOperation completed in {duration:.3f} seconds")
        print(f"Storage Location: Bucket {result['bucket_index']}")
        print(f"Compression Ratio: {result['compression_ratio']:.3f}")
        print(f"Memory State:")
        print(f"  Utilization: {stats['utilization']*100:.1f}%")
        print(f"  Rotation Speed: {stats['rotation_speed']:.3f} rad/s")
        print(f"  φ-Efficiency: {stats['phi_efficiency']:.3f}")
        
        # Small delay to observe rotation
        time.sleep(0.5)
        
    # Final stats
    final_stats = memory.get_stats()
    print("\nFinal System State:")
    print(f"Total Buckets: {final_stats['num_buckets']}")
    print(f"Total Capacity: {final_stats['total_capacity']}")
    print(f"Utilization: {final_stats['utilization']*100:.1f}%")
    print(f"Compressed Buckets: {final_stats['compressed_buckets']}")
    print(f"Final Rotation Speed: {final_stats['rotation_speed']:.3f} rad/s")
    print(f"Final φ-Efficiency: {final_stats['phi_efficiency']:.3f}")

if __name__ == "__main__":
    run_ferris_test()