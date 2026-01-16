import { useMemo } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";

interface NeonTubePreviewProps {
  text: string;
  fontId: string;
  tubeDiameter: number;
  tubeScale: number;
}

export function NeonTubePreview({ text, fontId, tubeDiameter, tubeScale }: NeonTubePreviewProps) {
  const fontSize = 1.2 * tubeScale;
  const tubeRadius = (tubeDiameter * 0.01) / 2;
  
  // Display text exactly as user typed it (preserve case)
  const displayText = text || "NEON";
  
  return (
    <group>
      {/* Main text with tube outline effect */}
      <Text
        fontSize={fontSize}
        anchorX="center"
        anchorY="middle"
        outlineWidth={tubeRadius * 0.8}
        outlineColor="#8b5cf6"
        outlineOpacity={0.9}
      >
        {displayText}
        <meshStandardMaterial
          color="#a78bfa"
          emissive="#8b5cf6"
          emissiveIntensity={0.5}
          metalness={0.2}
          roughness={0.3}
        />
      </Text>
      
      {/* Outer glow layer for cyberpunk effect */}
      <Text
        fontSize={fontSize * 1.02}
        anchorX="center"
        anchorY="middle"
        position={[0, 0, -0.01]}
        outlineWidth={tubeRadius * 1.2}
        outlineColor="#6d28d9"
        outlineOpacity={0.4}
      >
        {displayText}
        <meshBasicMaterial
          color="#c4b5fd"
          transparent
          opacity={0.3}
        />
      </Text>
      
      {/* Inner LED glow simulation */}
      <Text
        fontSize={fontSize * 0.95}
        anchorX="center"
        anchorY="middle"
        position={[0, 0, 0.01]}
      >
        {displayText}
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={0.6}
          toneMapped={false}
        />
      </Text>
      
      {/* Bright core glow */}
      <Text
        fontSize={fontSize * 0.9}
        anchorX="center"
        anchorY="middle"
        position={[0, 0, 0.02]}
      >
        {displayText}
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.8}
          toneMapped={false}
        />
      </Text>
      
      {/* Additional bloom effect */}
      <pointLight position={[0, 0, 0.5]} intensity={2} color="#a78bfa" distance={3} />
    </group>
  );
}
