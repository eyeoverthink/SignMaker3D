import { useMemo, useRef } from "react";
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

// Generate simple stroke paths for preview (approximation) with welding
function generateStrokePaths(text: string, scale: number): { paths: THREE.Vector3[][], bridges: THREE.Vector3[][] } {
  const paths: THREE.Vector3[][] = [];
  const bridges: THREE.Vector3[][] = [];
  const letterSpacing = 0.8 * scale;
  let xOffset = -(text.length * letterSpacing) / 2;
  
  let lastEndPoint: THREE.Vector3 | null = null;
  
  // Simple letter path approximations for preview
  for (let i = 0; i < text.length; i++) {
    const char = text[i].toUpperCase();
    const path: THREE.Vector3[] = [];
    
    // Generate simple stroke paths based on character
    if (char === 'N') {
      path.push(
        new THREE.Vector3(xOffset, -0.5 * scale, 0),
        new THREE.Vector3(xOffset, 0.5 * scale, 0),
        new THREE.Vector3(xOffset + 0.6 * scale, -0.5 * scale, 0),
        new THREE.Vector3(xOffset + 0.6 * scale, 0.5 * scale, 0)
      );
    } else if (char === 'E') {
      path.push(
        new THREE.Vector3(xOffset + 0.5 * scale, 0.5 * scale, 0),
        new THREE.Vector3(xOffset, 0.5 * scale, 0),
        new THREE.Vector3(xOffset, 0, 0),
        new THREE.Vector3(xOffset + 0.4 * scale, 0, 0),
        new THREE.Vector3(xOffset, 0, 0),
        new THREE.Vector3(xOffset, -0.5 * scale, 0),
        new THREE.Vector3(xOffset + 0.5 * scale, -0.5 * scale, 0)
      );
    } else if (char === 'O') {
      // Circle approximation
      for (let a = 0; a <= Math.PI * 2; a += Math.PI / 8) {
        path.push(new THREE.Vector3(
          xOffset + 0.3 * scale + Math.cos(a) * 0.3 * scale,
          Math.sin(a) * 0.5 * scale,
          0
        ));
      }
    } else if (char === ' ') {
      // Skip spaces but track position
      xOffset += letterSpacing;
      continue;
    } else {
      // Default vertical line for unknown chars
      path.push(
        new THREE.Vector3(xOffset + 0.3 * scale, -0.5 * scale, 0),
        new THREE.Vector3(xOffset + 0.3 * scale, 0.5 * scale, 0)
      );
    }
    
    if (path.length > 0) {
      // Create bridge from last letter to this one
      if (lastEndPoint && path.length > 0) {
        const startPoint = path[0];
        bridges.push([lastEndPoint, startPoint]);
      }
      
      paths.push(path);
      lastEndPoint = path[path.length - 1];
    }
    
    xOffset += letterSpacing;
  }
  
  return { paths, bridges };
}

export function NeonTubePreview({ text, fontId, tubeDiameter, tubeScale }: NeonTubePreviewProps) {
  const outerRadius = (tubeDiameter * 0.01) / 2;
  const innerRadius = outerRadius * 0.6; // Hollow center for LED wire
  
  const { paths, bridges } = useMemo(() => {
    return generateStrokePaths(text || "NEON", tubeScale);
  }, [text, tubeScale]);
  
  return (
    <group>
      {/* Letter tubes */}
      {paths.map((path, pathIndex) => (
        <group key={`letter-${pathIndex}`}>
          {/* Outer tube surface */}
          <mesh>
            <tubeGeometry args={[
              new THREE.CatmullRomCurve3(path),
              path.length * 8,
              outerRadius,
              16,
              false
            ]} />
            <meshStandardMaterial 
              color="#8b5cf6"
              metalness={0.3}
              roughness={0.4}
              transparent
              opacity={0.8}
            />
          </mesh>
          
          {/* Inner hollow channel (darker to show it's hollow) */}
          <mesh>
            <tubeGeometry args={[
              new THREE.CatmullRomCurve3(path),
              path.length * 8,
              innerRadius,
              16,
              false
            ]} />
            <meshStandardMaterial 
              color="#1e1b4b"
              metalness={0.1}
              roughness={0.8}
              side={THREE.BackSide}
            />
          </mesh>
          
          {/* LED path visualization (thin glowing line through center) */}
          <mesh>
            <tubeGeometry args={[
              new THREE.CatmullRomCurve3(path),
              path.length * 8,
              innerRadius * 0.3,
              8,
              false
            ]} />
            <meshBasicMaterial 
              color="#fbbf24"
              transparent
              opacity={0.6}
            />
          </mesh>
        </group>
      ))}
      
      {/* Bridge connections between letters */}
      {bridges.map((bridge, bridgeIndex) => (
        <group key={`bridge-${bridgeIndex}`}>
          {/* Outer bridge tube */}
          <mesh>
            <tubeGeometry args={[
              new THREE.CatmullRomCurve3(bridge),
              16,
              outerRadius,
              16,
              false
            ]} />
            <meshStandardMaterial 
              color="#6d28d9"
              metalness={0.3}
              roughness={0.4}
              transparent
              opacity={0.8}
            />
          </mesh>
          
          {/* Inner hollow channel */}
          <mesh>
            <tubeGeometry args={[
              new THREE.CatmullRomCurve3(bridge),
              16,
              innerRadius,
              16,
              false
            ]} />
            <meshStandardMaterial 
              color="#1e1b4b"
              metalness={0.1}
              roughness={0.8}
              side={THREE.BackSide}
            />
          </mesh>
          
          {/* LED path through bridge */}
          <mesh>
            <tubeGeometry args={[
              new THREE.CatmullRomCurve3(bridge),
              16,
              innerRadius * 0.3,
              8,
              false
            ]} />
            <meshBasicMaterial 
              color="#fbbf24"
              transparent
              opacity={0.6}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
