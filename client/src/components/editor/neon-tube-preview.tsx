import { useMemo, useState, useEffect } from "react";
import * as THREE from "three";

interface NeonTubePreviewProps {
  text: string;
  fontId: string;
  tubeDiameter: number;
  tubeScale: number;
}

export function NeonTubePreview({ text, fontId, tubeDiameter, tubeScale }: NeonTubePreviewProps) {
  const [fontPaths, setFontPaths] = useState<number[][][]>([]);
  
  // Fetch real font paths from API
  useEffect(() => {
    if (!text) {
      setFontPaths([]);
      return;
    }
    
    fetch('/api/fonts/stroke-paths', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, fontId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.paths) {
          setFontPaths(data.paths);
        }
      })
      .catch(err => {
        console.warn('Failed to load font paths:', err);
        setFontPaths([]);
      });
  }, [text, fontId]);
  
  const tubeGeometries = useMemo(() => {
    if (!fontPaths || fontPaths.length === 0) return [];
    
    const tubeRadius = (tubeDiameter / 2) * 0.01 * tubeScale;
    const geometries: THREE.TubeGeometry[] = [];
    
    // Convert font paths to 3D tube geometries
    fontPaths.forEach((path) => {
      if (path.length < 2) return;
      
      // Convert 2D font path points to 3D points
      const points: THREE.Vector3[] = path.map(([x, y]) => 
        new THREE.Vector3(x * 0.01 * tubeScale, y * 0.01 * tubeScale, 0)
      );
      
      // Create tube geometry from the path
      if (points.length >= 2) {
        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = new THREE.TubeGeometry(curve, 64, tubeRadius, 16, false);
        geometries.push(geometry);
      }
    });
    
    return geometries;
  }, [fontPaths, tubeDiameter, tubeScale]);
  
  return (
    <group>
      {tubeGeometries.map((geometry, index) => (
        <group key={index}>
          <mesh geometry={geometry}>
            <meshStandardMaterial 
              color="#ff00ff" 
              emissive="#ff00ff"
              emissiveIntensity={0.5}
              transparent
              opacity={0.8}
            />
          </mesh>
          <mesh geometry={geometry}>
            <meshStandardMaterial 
              color="#ffffff" 
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
