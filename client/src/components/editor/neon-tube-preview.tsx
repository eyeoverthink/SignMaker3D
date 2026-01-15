import { useMemo } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";

interface NeonTubePreviewProps {
  text: string;
  fontId: string;
  tubeDiameter: number;
  tubeScale: number;
}

// Commercial fonts only - using system fonts for preview
// Hershey fonts will render as simple text since they're stroke-based
const fontFileMap: Record<string, string> = {
  "architects-daughter": "Architects Daughter",
  "hershey-sans": "monospace",
  "hershey-script": "cursive",
  "inter": "Inter",
  "lora": "Lora",
  "merriweather": "Merriweather",
  "montserrat": "Montserrat",
  "open-sans": "Open Sans",
  "outfit": "Outfit",
  "oxanium": "Oxanium",
  "playfair": "Playfair Display",
  "poppins": "Poppins",
  "roboto": "Roboto",
  "space-grotesk": "Space Grotesk",
};

export function NeonTubePreview({ text, fontId, tubeDiameter, tubeScale }: NeonTubePreviewProps) {
  const fontUrl = fontFileMap[fontId] || fontFileMap["hershey-sans"];
  const fontSize = 1.2 * tubeScale;
  const tubeRadius = (tubeDiameter * 0.01) / 2;
  
  // Display text exactly as user typed it (preserve case)
  const displayText = text || "NEON";
  
  return (
    <group>
      {/* Main text with tube outline effect */}
      <Text
        font={fontUrl}
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
        font={fontUrl}
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
        font={fontUrl}
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
        font={fontUrl}
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
