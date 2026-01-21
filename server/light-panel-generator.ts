import * as THREE from 'three';

// FRAYMUS Light Panel Generator - Server-side STL generation
// Integrates with Sign-Sculptor Express API

const PHI = 1.6180339887;
const GOLDEN_ANGLE = 2.39996323; // 137.507764 degrees in radians

interface LightPanelSettings {
  pattern: string;
  frameStyle: string;
  panelWidth: number;
  panelHeight: number;
  panelDepth: number;
  patternDensity: number;
  cutoutDepth: number;
  frameThickness: number;
  phiIterations: number;
  goldenAngleRotation: boolean;
  symmetry: number;
  addMountingHoles: boolean;
  mountingHoleDiameter: number;
  ledChannelDepth: number;
  addLedChannel: boolean;
}

function phiSpiralPattern(x: number, y: number, iterations: number): number {
  const r = Math.sqrt(x * x + y * y);
  const theta = Math.atan2(y, x);
  
  let spiralValue = 0;
  for (let i = 0; i < iterations; i++) {
    const angle = theta + i * GOLDEN_ANGLE;
    const radius = r / Math.pow(PHI, i);
    spiralValue += Math.sin(angle * PHI + radius * 0.1);
  }
  
  return spiralValue / iterations;
}

function phiVortexPattern(x: number, y: number, iterations: number): number {
  const r = Math.sqrt(x * x + y * y);
  const theta = Math.atan2(y, x);
  
  let vortex = 0;
  for (let i = 0; i < iterations; i++) {
    const angleOffset = i * GOLDEN_ANGLE;
    vortex += Math.sin(theta * (i + 1) + angleOffset) * Math.cos(r * 0.05 * Math.pow(PHI, i));
  }
  
  return vortex / iterations;
}

function treeOfLifePattern(x: number, y: number, iterations: number): number {
  const r = Math.sqrt(x * x + y * y);
  const theta = Math.atan2(y, x);
  
  let branches = 0;
  for (let i = 0; i < iterations; i++) {
    const branchAngle = theta + i * GOLDEN_ANGLE;
    const branchRadius = r - i * 10;
    if (branchRadius > 0) {
      branches += Math.exp(-Math.abs(Math.sin(branchAngle * 3)) * 0.5);
    }
  }
  
  return branches / iterations;
}

function sacredGeometryPattern(x: number, y: number, symmetry: number): number {
  const r = Math.sqrt(x * x + y * y);
  const theta = Math.atan2(y, x);
  
  let pattern = 0;
  for (let i = 0; i < symmetry; i++) {
    const angle = i * 2 * Math.PI / symmetry;
    const cx = 30 * Math.cos(angle);
    const cy = 30 * Math.sin(angle);
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    pattern += Math.sin(dist * 0.2 * PHI);
  }
  
  return pattern / symmetry;
}

function fibonacciFlowerPattern(x: number, y: number, iterations: number): number {
  const r = Math.sqrt(x * x + y * y);
  const theta = Math.atan2(y, x);
  
  let pattern = 0;
  for (let i = 0; i < iterations * 10; i++) {
    const angle = i * GOLDEN_ANGLE;
    const radius = Math.sqrt(i) * 3;
    const px = radius * Math.cos(angle);
    const py = radius * Math.sin(angle);
    const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
    pattern += Math.exp(-dist * 0.1);
  }
  
  return Math.min(pattern, 1.0);
}

function goldenMandalaPattern(x: number, y: number, symmetry: number, iterations: number): number {
  const r = Math.sqrt(x * x + y * y);
  const theta = Math.atan2(y, x);
  
  let pattern = 0;
  for (let i = 0; i < iterations; i++) {
    const radiusRing = 20 * Math.pow(PHI, i);
    const ringValue = Math.sin((r - radiusRing) * 0.5);
    const angularValue = Math.sin(theta * symmetry + i * GOLDEN_ANGLE);
    pattern += ringValue * angularValue;
  }
  
  return pattern / iterations;
}

function voronoiOrganicPattern(x: number, y: number, seedCount: number): number {
  let minDist = Infinity;
  for (let i = 0; i < seedCount; i++) {
    const angle = i * GOLDEN_ANGLE;
    const radius = Math.sqrt(i) * 15;
    const sx = radius * Math.cos(angle);
    const sy = radius * Math.sin(angle);
    const dist = Math.sqrt((x - sx) ** 2 + (y - sy) ** 2);
    minDist = Math.min(minDist, dist);
  }
  
  return Math.sin(minDist * 0.3);
}

function islamicGeometricPattern(x: number, y: number, symmetry: number): number {
  const r = Math.sqrt(x * x + y * y);
  const theta = Math.atan2(y, x);
  
  let pattern = 0;
  for (let i = 0; i < symmetry; i++) {
    const angle = theta + i * 2 * Math.PI / symmetry;
    const starValue = Math.abs(Math.cos(angle * symmetry / 2));
    const radiusModulation = Math.sin(r * 0.1 * PHI);
    pattern += starValue * radiusModulation;
  }
  
  return pattern / symmetry;
}

function celticKnotPattern(x: number, y: number): number {
  const wave1 = Math.sin(x * 0.1 * PHI + y * 0.1);
  const wave2 = Math.sin(x * 0.1 - y * 0.1 * PHI);
  const wave3 = Math.sin((x + y) * 0.08 * PHI);
  
  return (wave1 + wave2 + wave3) / 3;
}

function natureLeavesPattern(x: number, y: number, iterations: number): number {
  const r = Math.sqrt(x * x + y * y);
  const theta = Math.atan2(y, x);
  
  const mainVein = Math.abs(Math.sin(theta * 2));
  let branches = 0;
  for (let i = 0; i < iterations; i++) {
    const branchAngle = theta + i * GOLDEN_ANGLE / 2;
    const branchValue = Math.exp(-Math.abs(Math.sin(branchAngle * 4)) * r * 0.01);
    branches += branchValue;
  }
  
  return (mainVein + branches / iterations) / 2;
}

function dnaHelixPattern(x: number, y: number, z: number = 0): number {
  const r = Math.sqrt(x * x + y * y);
  const theta = Math.atan2(y, x);
  
  const helix1 = Math.sin(theta * 2 + z * 0.1 * PHI) * Math.exp(-Math.abs(r - 30) * 0.05);
  const helix2 = Math.sin(theta * 2 - z * 0.1 * PHI + Math.PI) * Math.exp(-Math.abs(r - 30) * 0.05);
  
  return helix1 + helix2;
}

function fractalBranchesPattern(x: number, y: number, iterations: number): number {
  const r = Math.sqrt(x * x + y * y);
  const theta = Math.atan2(y, x);
  
  let pattern = 0;
  for (let i = 0; i < iterations; i++) {
    const scale = Math.pow(PHI, -i);
    const angle1 = theta + i * GOLDEN_ANGLE;
    const angle2 = theta - i * GOLDEN_ANGLE;
    const branch1 = Math.exp(-Math.abs(Math.sin(angle1 * 3)) * r * scale * 0.01);
    const branch2 = Math.exp(-Math.abs(Math.sin(angle2 * 3)) * r * scale * 0.01);
    pattern += branch1 + branch2;
  }
  
  return pattern / (iterations * 2);
}

function getPatternValue(
  x: number,
  y: number,
  patternType: string,
  iterations: number,
  symmetry: number
): number {
  switch (patternType) {
    case "phi_spiral":
      return phiSpiralPattern(x, y, iterations);
    case "phi_vortex":
      return phiVortexPattern(x, y, iterations);
    case "tree_of_life":
      return treeOfLifePattern(x, y, iterations);
    case "sacred_geometry":
      return sacredGeometryPattern(x, y, symmetry);
    case "fibonacci_flower":
      return fibonacciFlowerPattern(x, y, iterations);
    case "golden_mandala":
      return goldenMandalaPattern(x, y, symmetry, iterations);
    case "voronoi_organic":
      return voronoiOrganicPattern(x, y, 20);
    case "islamic_geometric":
      return islamicGeometricPattern(x, y, symmetry);
    case "celtic_knot":
      return celticKnotPattern(x, y);
    case "nature_leaves":
      return natureLeavesPattern(x, y, iterations);
    case "dna_helix":
      return dnaHelixPattern(x, y);
    case "fractal_branches":
      return fractalBranchesPattern(x, y, iterations);
    default:
      return 0;
  }
}

export function generateLightPanelSTL(settings: LightPanelSettings): string {
  const {
    pattern,
    panelWidth,
    panelHeight,
    panelDepth,
    frameThickness,
    patternDensity,
    cutoutDepth,
    phiIterations,
    symmetry,
  } = settings;

  const resolution = 3; // 3mm grid resolution
  const threshold = (100 - patternDensity) / 100.0;

  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];

  const xSteps = Math.floor(panelWidth / resolution);
  const ySteps = Math.floor(panelHeight / resolution);

  // Generate vertices and faces
  for (let i = 0; i < xSteps; i++) {
    for (let j = 0; j < ySteps; j++) {
      const x1 = (i - xSteps / 2) * resolution;
      const y1 = (j - ySteps / 2) * resolution;
      const x2 = x1 + resolution;
      const y2 = y1 + resolution;

      // Check if in frame border
      const inFrame =
        Math.abs(x1) > panelWidth / 2 - frameThickness ||
        Math.abs(y1) > panelHeight / 2 - frameThickness;

      let zOffset = 0;

      if (!inFrame) {
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        const patternVal = getPatternValue(cx, cy, pattern, phiIterations, symmetry);

        const isCutout = patternVal > threshold;
        if (isCutout) {
          zOffset = panelDepth - cutoutDepth;
        }
      }

      // Add quad (2 triangles)
      const baseIndex = vertices.length / 3;

      // Bottom vertices
      vertices.push(x1, y1, zOffset);
      vertices.push(x2, y1, zOffset);
      vertices.push(x2, y2, zOffset);
      vertices.push(x1, y2, zOffset);

      // Top vertices
      vertices.push(x1, y1, panelDepth);
      vertices.push(x2, y1, panelDepth);
      vertices.push(x2, y2, panelDepth);
      vertices.push(x1, y2, panelDepth);

      // Bottom face
      indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
      indices.push(baseIndex, baseIndex + 2, baseIndex + 3);

      // Top face
      indices.push(baseIndex + 7, baseIndex + 6, baseIndex + 5);
      indices.push(baseIndex + 7, baseIndex + 5, baseIndex + 4);

      // Side walls if cutout
      if (zOffset > 0) {
        // Left
        indices.push(baseIndex, baseIndex + 4, baseIndex + 7);
        indices.push(baseIndex, baseIndex + 7, baseIndex + 3);
        // Right
        indices.push(baseIndex + 1, baseIndex + 2, baseIndex + 6);
        indices.push(baseIndex + 1, baseIndex + 6, baseIndex + 5);
        // Front
        indices.push(baseIndex, baseIndex + 1, baseIndex + 5);
        indices.push(baseIndex, baseIndex + 5, baseIndex + 4);
        // Back
        indices.push(baseIndex + 3, baseIndex + 7, baseIndex + 6);
        indices.push(baseIndex + 3, baseIndex + 6, baseIndex + 2);
      }
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  // Convert to STL format
  const positionAttribute = geometry.getAttribute('position');
  const normalAttribute = geometry.getAttribute('normal');
  const indexAttribute = geometry.getIndex();

  let stl = 'solid LightPanel\n';

  if (indexAttribute) {
    for (let i = 0; i < indexAttribute.count; i += 3) {
      const i1 = indexAttribute.getX(i);
      const i2 = indexAttribute.getX(i + 1);
      const i3 = indexAttribute.getX(i + 2);

      const v1 = new THREE.Vector3().fromBufferAttribute(positionAttribute, i1);
      const v2 = new THREE.Vector3().fromBufferAttribute(positionAttribute, i2);
      const v3 = new THREE.Vector3().fromBufferAttribute(positionAttribute, i3);

      const n = new THREE.Vector3().fromBufferAttribute(normalAttribute, i1);

      stl += `  facet normal ${n.x.toFixed(6)} ${n.y.toFixed(6)} ${n.z.toFixed(6)}\n`;
      stl += `    outer loop\n`;
      stl += `      vertex ${v1.x.toFixed(6)} ${v1.y.toFixed(6)} ${v1.z.toFixed(6)}\n`;
      stl += `      vertex ${v2.x.toFixed(6)} ${v2.y.toFixed(6)} ${v2.z.toFixed(6)}\n`;
      stl += `      vertex ${v3.x.toFixed(6)} ${v3.y.toFixed(6)} ${v3.z.toFixed(6)}\n`;
      stl += `    endloop\n`;
      stl += `  endfacet\n`;
    }
  }

  stl += 'endsolid LightPanel\n';

  return stl;
}
