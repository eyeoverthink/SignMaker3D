import { useMemo } from "react";
import { Text, RoundedBox } from "@react-three/drei";

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
  "future-light": "/fonts/FutureLight.ttf",
  "future-light-italic": "/fonts/FutureLightItalic.ttf",
  "halimun": "/fonts/Halimun.ttf",
  "hershey-sans": "/fonts/Airstream.ttf",
  "hershey-script": "/fonts/Halimun.ttf",
  "inter": "/fonts/Airstream.ttf",
  "roboto": "/fonts/Airstream.ttf",
  "poppins": "/fonts/Airstream.ttf",
  "montserrat": "/fonts/Airstream.ttf",
  "open-sans": "/fonts/Airstream.ttf",
  "playfair": "/fonts/Darlington-Demo.ttf",
  "merriweather": "/fonts/Darlington-Demo.ttf",
  "lora": "/fonts/Halimun.ttf",
  "space-grotesk": "/fonts/Airstream.ttf",
  "outfit": "/fonts/Airstream.ttf",
  "architects-daughter": "/fonts/Halimun.ttf",
  "oxanium": "/fonts/Airstream.ttf",
};

export function NeonTubePreview({ text, fontId, tubeDiameter, tubeScale }: NeonTubePreviewProps) {
  const fontUrl = fontFileMap[fontId] || fontFileMap["inter"];
  const fontSize = 1.2 * tubeScale;
  
  // Calculate approximate text dimensions
  const textWidth = useMemo(() => {
    return Math.max(text.length * fontSize * 0.6, 1);
  }, [text, fontSize]);
  
  const textHeight = useMemo(() => {
    return fontSize * 1.2;
  }, [fontSize]);
  
  const tubeDepth = tubeDiameter * 0.01;
  
  return (
    <group>
      {/* Backing plate to represent the tube casing */}
      <RoundedBox
        args={[textWidth + 0.5, textHeight + 0.3, tubeDepth]}
        radius={0.05}
        smoothness={4}
        position={[0, 0, -tubeDepth / 2]}
      >
        <meshStandardMaterial 
          color="#2d1b4e"
          metalness={0.2}
          roughness={0.6}
          transparent
          opacity={0.9}
        />
      </RoundedBox>
      
      {/* Actual text in selected font - this is what the user sees */}
      <Text
        font={fontUrl}
        position={[0, 0, tubeDepth / 2 + 0.02]}
        fontSize={fontSize}
        color="#ff00ff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#ff00ff"
      >
        {text || "NEON"}
      </Text>
      
      {/* Glowing effect layer */}
      <Text
        font={fontUrl}
        position={[0, 0, tubeDepth / 2 + 0.01]}
        fontSize={fontSize * 1.02}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.3}
      >
        {text || "NEON"}
      </Text>
    </group>
  );
}
