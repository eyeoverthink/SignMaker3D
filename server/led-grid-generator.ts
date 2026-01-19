/**
 * LED GRID GENERATOR FOR PHYSICAL PAC-MAN CANVAS
 * Generates 3D-printable mounting grid for WS2812B LED strips
 * Designed for autonomous Scott Algorithm maze demonstration
 */

interface LEDGridConfig {
  gridWidth: number;      // Number of cells horizontally
  gridHeight: number;     // Number of cells vertically
  ledSpacing: number;     // Distance between LEDs in mm (default 12.7mm)
  wallThickness: number;  // Grid wall thickness in mm
  baseThickness: number;  // Base plate thickness in mm
  ledDiameter: number;    // LED holder diameter in mm
  mountingHoles: boolean; // Add corner mounting holes
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

export class LEDGridGenerator {
  private config: LEDGridConfig;

  constructor(config: Partial<LEDGridConfig> = {}) {
    this.config = {
      gridWidth: config.gridWidth || 16,
      gridHeight: config.gridHeight || 12,
      ledSpacing: config.ledSpacing || 12.7,
      wallThickness: config.wallThickness || 2,
      baseThickness: config.baseThickness || 3,
      ledDiameter: config.ledDiameter || 5,
      mountingHoles: config.mountingHoles !== false,
    };
  }

  /**
   * Generate STL for LED mounting grid
   */
  generateGridSTL(): string {
    const { gridWidth, gridHeight, ledSpacing, wallThickness, baseThickness } = this.config;
    
    const totalWidth = gridWidth * ledSpacing + wallThickness * 2;
    const totalHeight = gridHeight * ledSpacing + wallThickness * 2;
    
    let stl = 'solid LEDGrid\n';

    // Base plate
    stl += this.generateBasePlate(totalWidth, totalHeight, baseThickness);

    // Vertical walls
    for (let x = 0; x <= gridWidth; x++) {
      const xPos = wallThickness + x * ledSpacing;
      stl += this.generateWall(
        xPos, wallThickness,
        wallThickness, totalHeight - wallThickness,
        baseThickness, baseThickness + 10
      );
    }

    // Horizontal walls
    for (let y = 0; y <= gridHeight; y++) {
      const yPos = wallThickness + y * ledSpacing;
      stl += this.generateWall(
        wallThickness, totalWidth - wallThickness,
        yPos, yPos,
        baseThickness, baseThickness + 10
      );
    }

    // LED mounting holes
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const xPos = wallThickness + x * ledSpacing + ledSpacing / 2;
        const yPos = wallThickness + y * ledSpacing + ledSpacing / 2;
        stl += this.generateLEDHole(xPos, yPos, baseThickness);
      }
    }

    // Corner mounting holes
    if (this.config.mountingHoles) {
      const holePositions = [
        { x: 5, y: 5 },
        { x: totalWidth - 5, y: 5 },
        { x: 5, y: totalHeight - 5 },
        { x: totalWidth - 5, y: totalHeight - 5 },
      ];
      
      for (const pos of holePositions) {
        stl += this.generateMountingHole(pos.x, pos.y, baseThickness);
      }
    }

    stl += 'endsolid LEDGrid\n';
    return stl;
  }

  private generateBasePlate(width: number, height: number, thickness: number): string {
    // Simple rectangular base
    const vertices = [
      { x: 0, y: 0, z: 0 },
      { x: width, y: 0, z: 0 },
      { x: width, y: height, z: 0 },
      { x: 0, y: height, z: 0 },
      { x: 0, y: 0, z: thickness },
      { x: width, y: 0, z: thickness },
      { x: width, y: height, z: thickness },
      { x: 0, y: height, z: thickness },
    ];

    return this.generateBox(vertices);
  }

  private generateWall(x1: number, x2: number, y1: number, y2: number, z1: number, z2: number): string {
    const { wallThickness } = this.config;
    const vertices = [
      { x: x1, y: y1, z: z1 },
      { x: x2, y: y1, z: z1 },
      { x: x2, y: y2, z: z1 },
      { x: x1, y: y2, z: z1 },
      { x: x1, y: y1, z: z2 },
      { x: x2, y: y1, z: z2 },
      { x: x2, y: y2, z: z2 },
      { x: x1, y: y2, z: z2 },
    ];

    return this.generateBox(vertices);
  }

  private generateLEDHole(x: number, y: number, z: number): string {
    // Simplified cylinder as comment - actual implementation would use proper cylinder tessellation
    return `  facet normal 0 0 -1
    outer loop
      vertex ${x - 2.5} ${y - 2.5} ${z}
      vertex ${x + 2.5} ${y - 2.5} ${z}
      vertex ${x + 2.5} ${y + 2.5} ${z}
    endloop
  endfacet
  facet normal 0 0 -1
    outer loop
      vertex ${x - 2.5} ${y - 2.5} ${z}
      vertex ${x + 2.5} ${y + 2.5} ${z}
      vertex ${x - 2.5} ${y + 2.5} ${z}
    endloop
  endfacet\n`;
  }

  private generateMountingHole(x: number, y: number, thickness: number): string {
    const radius = 1.5; // M3 screw hole
    return this.generateLEDHole(x, y, 0);
  }

  private generateBox(vertices: Point3D[]): string {
    let stl = '';
    
    // Bottom face
    stl += this.generateTriangle(vertices[0], vertices[1], vertices[2], { x: 0, y: 0, z: -1 });
    stl += this.generateTriangle(vertices[0], vertices[2], vertices[3], { x: 0, y: 0, z: -1 });
    
    // Top face
    stl += this.generateTriangle(vertices[4], vertices[6], vertices[5], { x: 0, y: 0, z: 1 });
    stl += this.generateTriangle(vertices[4], vertices[7], vertices[6], { x: 0, y: 0, z: 1 });
    
    // Front face
    stl += this.generateTriangle(vertices[0], vertices[4], vertices[5], { x: 0, y: -1, z: 0 });
    stl += this.generateTriangle(vertices[0], vertices[5], vertices[1], { x: 0, y: -1, z: 0 });
    
    // Back face
    stl += this.generateTriangle(vertices[2], vertices[6], vertices[7], { x: 0, y: 1, z: 0 });
    stl += this.generateTriangle(vertices[2], vertices[7], vertices[3], { x: 0, y: 1, z: 0 });
    
    // Left face
    stl += this.generateTriangle(vertices[0], vertices[3], vertices[7], { x: -1, y: 0, z: 0 });
    stl += this.generateTriangle(vertices[0], vertices[7], vertices[4], { x: -1, y: 0, z: 0 });
    
    // Right face
    stl += this.generateTriangle(vertices[1], vertices[5], vertices[6], { x: 1, y: 0, z: 0 });
    stl += this.generateTriangle(vertices[1], vertices[6], vertices[2], { x: 1, y: 0, z: 0 });
    
    return stl;
  }

  private generateTriangle(v1: Point3D, v2: Point3D, v3: Point3D, normal: Point3D): string {
    return `  facet normal ${normal.x} ${normal.y} ${normal.z}
    outer loop
      vertex ${v1.x} ${v1.y} ${v1.z}
      vertex ${v2.x} ${v2.y} ${v2.z}
      vertex ${v3.x} ${v3.y} ${v3.z}
    endloop
  endfacet\n`;
  }

  /**
   * Generate WS2812B coordinate mapping
   */
  generateLEDMapping(): { x: number; y: number; index: number }[] {
    const { gridWidth, gridHeight, ledSpacing, wallThickness } = this.config;
    const mapping: { x: number; y: number; index: number }[] = [];
    
    let index = 0;
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        mapping.push({
          x: wallThickness + x * ledSpacing + ledSpacing / 2,
          y: wallThickness + y * ledSpacing + ledSpacing / 2,
          index: index++,
        });
      }
    }
    
    return mapping;
  }

  /**
   * Generate wiring diagram data
   */
  generateWiringDiagram(): {
    totalLEDs: number;
    stripLength: number;
    powerRequirement: string;
    dataPin: string;
    connections: string[];
  } {
    const totalLEDs = this.config.gridWidth * this.config.gridHeight;
    const stripLength = totalLEDs * this.config.ledSpacing;
    const currentDraw = totalLEDs * 0.06; // 60mA per LED at full white
    
    return {
      totalLEDs,
      stripLength: Math.round(stripLength),
      powerRequirement: `5V ${Math.ceil(currentDraw)}A (${Math.ceil(currentDraw * 5)}W)`,
      dataPin: 'GPIO 16',
      connections: [
        'ESP32 5V → WS2812B VCC (red wire)',
        'ESP32 GND → WS2812B GND (black wire)',
        'ESP32 GPIO16 → WS2812B DIN (green wire)',
        'Power Supply 5V → ESP32 VIN',
        'Power Supply GND → ESP32 GND',
      ],
    };
  }
}
