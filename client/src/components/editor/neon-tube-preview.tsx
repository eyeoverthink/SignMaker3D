import { useMemo } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";

interface NeonTubePreviewProps {
  text: string;
  fontId: string;
  tubeDiameter: number;
  tubeScale: number;
}

const fontFileMap: Record<string, string> = {
  "aerioz": "/fonts/Aerioz-Demo.otf",
  "airstream": "/fonts/Airstream.ttf",
  "airstream-nf": "/fonts/AirstreamNF.ttf",
  "alliston": "/fonts/Alliston-Demo.ttf",
  "cookiemonster": "/fonts/Cookiemonster.ttf",
  "darlington": "/fonts/Darlington-Demo.ttf",
  "dirtyboy": "/fonts/Dirtyboy.ttf",
  "disco-everyday": "/fonts/DiscoEverydayValue.ttf",
  "electronica": "/fonts/Electronica.ttf",
  "future-light": "/fonts/FutureLight.ttf",
  "future-light-italic": "/fonts/FutureLightItalic.ttf",
  "great-day": "/fonts/GreatDay.ttf",
  "great-day-bold": "/fonts/GreatDayBold.ttf",
  "halimun": "/fonts/Halimun.ttf",
  "hershey-sans": "/fonts/Airstream.ttf",
  "hershey-script": "/fonts/Halimun.ttf",
  "inter": "/fonts/Airstream.ttf",
  "las-enter": "/fonts/LasEnter.ttf",
  "roboto": "/fonts/Airstream.ttf",
  "poppins": "/fonts/Airstream.ttf",
  "montserrat": "/fonts/Airstream.ttf",
  "open-sans": "/fonts/Airstream.ttf",
  "playfair": "/fonts/Darlington-Demo.ttf",
  "merriweather": "/fonts/Darlington-Demo.ttf",
  "lora": "/fonts/Halimun.ttf",
  "space-grotesk": "/fonts/Airstream.ttf",
  "outfit": "/fonts/Airstream.ttf",
  "tomatoes": "/fonts/Tomatoes.ttf",
  "architects-daughter": "/fonts/Halimun.ttf",
  "oxanium": "/fonts/Airstream.ttf",
};

export function NeonTubePreview({ text, fontId, tubeDiameter, tubeScale }: NeonTubePreviewProps) {
  const fontUrl = fontFileMap[fontId] || fontFileMap["airstream"];
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
