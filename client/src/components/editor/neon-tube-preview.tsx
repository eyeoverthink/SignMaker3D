import { useMemo } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";

interface NeonTubePreviewProps {
  text: string;
  fontId: string;
  tubeDiameter: number;
  tubeScale: number;
}

// Map font IDs to font file paths for preview
const fontMap: Record<string, string> = {
  "aguafina-script": "/fonts/aguafina-script-v24-latin-regular.otf",
  "alex-brush": "/fonts/alex-brush-v23-latin-regular.ttf",
  "allison": "/fonts/allison-v13-latin-regular.ttf",
  "allura": "/fonts/allura-v23-latin-regular.ttf",
  "amatic-sc": "/fonts/amatic-sc-v28-latin-regular.ttf",
  "amita": "/fonts/amita-v20-latin-regular.ttf",
  "annie-use-your-telescope": "/fonts/annie-use-your-telescope-v20-latin-regular.ttf",
  "architects-daughter": "/fonts/architects-daughter-v20-latin-regular.ttf",
  "archivo-black": "/fonts/archivo-black-v23-latin-regular.ttf",
  "archivo-narrow": "/fonts/archivo-narrow-v35-latin-regular.ttf",
  "are-you-serious": "/fonts/are-you-serious-v14-latin-regular.otf",
  "arizonia": "/fonts/arizonia-v23-latin-regular.ttf",
  "babylonica": "/fonts/babylonica-v7-latin-regular.ttf",
  "bad-script": "/fonts/bad-script-v18-latin-regular.ttf",
  "ballet": "/fonts/ballet-v30-latin-regular.ttf",
  "beau-rivage": "/fonts/beau-rivage-v2-latin-regular.ttf",
  "berkshire-swash": "/fonts/berkshire-swash-v22-latin-regular.ttf",
  "beth-ellen": "/fonts/beth-ellen-v22-latin-regular.ttf",
  "bilbo": "/fonts/bilbo-v21-latin-regular.ttf",
  "bilbo-swash-caps": "/fonts/bilbo-swash-caps-v23-latin-regular.ttf",
  "birthstone": "/fonts/birthstone-v16-latin-regular.ttf",
  "birthstone-bounce": "/fonts/birthstone-bounce-v13-latin-regular.ttf",
  "bonbon": "/fonts/bonbon-v32-latin-regular.ttf",
  "bonheur-royale": "/fonts/bonheur-royale-v15-latin-regular.ttf",
  "borel": "/fonts/borel-v10-latin-regular.ttf",
  "butterfly-kids": "/fonts/butterfly-kids-v27-latin-regular.ttf",
  "calligraffitti": "/fonts/calligraffitti-v20-latin-regular.ttf",
  "caramel": "/fonts/caramel-v8-latin-regular.ttf",
  "cause": "/fonts/cause-v1-latin-regular.ttf",
  "caveat": "/fonts/caveat-v23-latin-regular.ttf",
  "caveat-brush": "/fonts/caveat-brush-v12-latin-regular.ttf",
  "cedarville-cursive": "/fonts/cedarville-cursive-v18-latin-regular.ttf",
  "charm": "/fonts/charm-v14-latin-regular.ttf",
  "charmonman": "/fonts/charmonman-v20-latin-regular.ttf",
  "chilanka": "/fonts/chilanka-v23-latin-regular.ttf",
  "edu-nsw-act-cursive": "/fonts/edu-nsw-act-cursive-v3-latin-regular.ttf",
  "inter": "/fonts/inter-v20-latin-regular.ttf",
  "inter-tight": "/fonts/inter-tight-v9-latin-regular.ttf",
  "lora": "/fonts/lora-v37-latin-regular.ttf",
  "montserrat": "/fonts/montserrat-v31-latin-regular.ttf",
  "neonderthaw": "/fonts/neonderthaw-v8-latin-regular.otf",
  "open-sans": "/fonts/open-sans-v44-latin-regular.ttf",
  "outfit": "/fonts/outfit-v15-latin-regular.ttf",
  "playfair-display": "/fonts/playfair-display-v40-latin-regular.ttf",
  "recursive": "/fonts/recursive-v44-latin-regular.otf",
  "tilt-neon": "/fonts/tilt-neon-v12-latin-regular.otf",
};

export function NeonTubePreview({ text, fontId, tubeDiameter, tubeScale }: NeonTubePreviewProps) {
  const fontSize = 1.2 * tubeScale;
  const tubeRadius = (tubeDiameter * 0.01) / 2;
  const fontUrl = fontMap[fontId];
  
  // Display text exactly as user typed it (preserve case)
  const displayText = text || "NEON";
  
  // Create unique key to force re-render when text or font changes
  const renderKey = `${displayText}-${fontId}`;
  
  return (
    <group key={renderKey}>
      {/* Main text with tube outline effect */}
      <Text
        key={`main-${renderKey}`}
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
        key={`glow-${renderKey}`}
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
        key={`inner-${renderKey}`}
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
        key={`core-${renderKey}`}
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
