// Neon Shape Designer - Primitive shapes and iconic outlines for simple neon signs
// Shapes are defined as SVG-like paths that can be converted to 3D tubes

export const neonShapeTypes = [
  "circle",
  "heart",
  "star",
  "crown",
  "peace",
  "moon",
  "rocket",
  "lips",
  "mickey",
  "dinosaur",
  "lightning",
  "planet",
  "rainbow",
  "leaf",
  "pacman",
  "gingerbread",
  "lightbulb",
  "arrow",
  "infinity",
  "hand"
] as const;

export type NeonShapeType = typeof neonShapeTypes[number];

export interface NeonShapeDefinition {
  name: string;
  category: "basic" | "icon" | "character";
  paths: Array<{
    points: Array<{ x: number; y: number }>;
    closed: boolean;
  }>;
  defaultSize: number; // Default size in mm
}

// Generate path points for each shape (normalized to -50 to 50 range)
export const neonShapes: Record<NeonShapeType, NeonShapeDefinition> = {
  circle: {
    name: "Circle",
    category: "basic",
    paths: [{
      points: generateCircle(0, 0, 40, 64),
      closed: true
    }],
    defaultSize: 100
  },
  
  heart: {
    name: "Heart",
    category: "icon",
    paths: [{
      points: [
        { x: 0, y: 10 },
        { x: -15, y: -5 },
        { x: -25, y: -15 },
        { x: -25, y: -25 },
        { x: -15, y: -35 },
        { x: 0, y: -30 },
        { x: 15, y: -35 },
        { x: 25, y: -25 },
        { x: 25, y: -15 },
        { x: 15, y: -5 },
        { x: 0, y: 10 }
      ],
      closed: true
    }],
    defaultSize: 120
  },
  
  star: {
    name: "Star (5-point)",
    category: "basic",
    paths: [{
      points: generateStar(0, 0, 40, 20, 5),
      closed: true
    }],
    defaultSize: 110
  },
  
  crown: {
    name: "Crown",
    category: "icon",
    paths: [{
      points: [
        { x: -35, y: 20 },
        { x: -35, y: -10 },
        { x: -20, y: 5 },
        { x: 0, y: -20 },
        { x: 20, y: 5 },
        { x: 35, y: -10 },
        { x: 35, y: 20 },
        { x: -35, y: 20 }
      ],
      closed: true
    }],
    defaultSize: 130
  },
  
  peace: {
    name: "Peace Sign",
    category: "icon",
    paths: [
      {
        points: generateCircle(0, 0, 35, 64),
        closed: true
      },
      {
        points: [
          { x: 0, y: -35 },
          { x: 0, y: 35 }
        ],
        closed: false
      },
      {
        points: [
          { x: 0, y: 0 },
          { x: -25, y: 25 }
        ],
        closed: false
      },
      {
        points: [
          { x: 0, y: 0 },
          { x: 25, y: 25 }
        ],
        closed: false
      }
    ],
    defaultSize: 110
  },
  
  moon: {
    name: "Crescent Moon",
    category: "icon",
    paths: [{
      points: [
        { x: 20, y: -35 },
        { x: 10, y: -30 },
        { x: 0, y: -20 },
        { x: -5, y: 0 },
        { x: 0, y: 20 },
        { x: 10, y: 30 },
        { x: 20, y: 35 },
        { x: 15, y: 25 },
        { x: 12, y: 10 },
        { x: 12, y: -10 },
        { x: 15, y: -25 },
        { x: 20, y: -35 }
      ],
      closed: true
    }],
    defaultSize: 100
  },
  
  rocket: {
    name: "Rocket",
    category: "icon",
    paths: [{
      points: [
        { x: 0, y: -40 },
        { x: -10, y: -25 },
        { x: -10, y: 10 },
        { x: -20, y: 20 },
        { x: -15, y: 30 },
        { x: -8, y: 25 },
        { x: -8, y: 35 },
        { x: 0, y: 30 },
        { x: 8, y: 35 },
        { x: 8, y: 25 },
        { x: 15, y: 30 },
        { x: 20, y: 20 },
        { x: 10, y: 10 },
        { x: 10, y: -25 },
        { x: 0, y: -40 }
      ],
      closed: true
    }],
    defaultSize: 120
  },
  
  lips: {
    name: "Lips",
    category: "icon",
    paths: [{
      points: [
        { x: -35, y: 0 },
        { x: -25, y: -10 },
        { x: -10, y: -12 },
        { x: 0, y: -10 },
        { x: 10, y: -12 },
        { x: 25, y: -10 },
        { x: 35, y: 0 },
        { x: 25, y: 10 },
        { x: 10, y: 12 },
        { x: 0, y: 10 },
        { x: -10, y: 12 },
        { x: -25, y: 10 },
        { x: -35, y: 0 }
      ],
      closed: true
    }],
    defaultSize: 130
  },
  
  mickey: {
    name: "Mickey Mouse",
    category: "character",
    paths: [
      {
        points: generateCircle(0, 0, 25, 48),
        closed: true
      },
      {
        points: generateCircle(-20, -20, 15, 32),
        closed: true
      },
      {
        points: generateCircle(20, -20, 15, 32),
        closed: true
      }
    ],
    defaultSize: 110
  },
  
  dinosaur: {
    name: "Dinosaur",
    category: "character",
    paths: [{
      points: [
        { x: -30, y: 25 },
        { x: -30, y: 15 },
        { x: -25, y: 10 },
        { x: -20, y: 10 },
        { x: -15, y: 0 },
        { x: -10, y: -10 },
        { x: -5, y: -20 },
        { x: 0, y: -25 },
        { x: 5, y: -20 },
        { x: 10, y: -15 },
        { x: 15, y: -10 },
        { x: 20, y: -5 },
        { x: 25, y: 0 },
        { x: 30, y: 5 },
        { x: 35, y: 10 },
        { x: 30, y: 15 },
        { x: 25, y: 20 },
        { x: 20, y: 25 },
        { x: 15, y: 25 },
        { x: 10, y: 20 },
        { x: 5, y: 25 },
        { x: 0, y: 25 },
        { x: -5, y: 20 },
        { x: -10, y: 25 },
        { x: -15, y: 25 },
        { x: -20, y: 20 },
        { x: -25, y: 25 },
        { x: -30, y: 25 }
      ],
      closed: true
    }],
    defaultSize: 140
  },
  
  lightning: {
    name: "Lightning Bolt",
    category: "icon",
    paths: [{
      points: [
        { x: 0, y: -40 },
        { x: -10, y: -5 },
        { x: 5, y: -5 },
        { x: -5, y: 40 },
        { x: 10, y: 5 },
        { x: -5, y: 5 },
        { x: 0, y: -40 }
      ],
      closed: true
    }],
    defaultSize: 100
  },
  
  planet: {
    name: "Planet with Ring",
    category: "icon",
    paths: [
      {
        points: generateCircle(0, 0, 25, 48),
        closed: true
      },
      {
        points: generateEllipse(0, 0, 45, 15, 48),
        closed: true
      }
    ],
    defaultSize: 120
  },
  
  rainbow: {
    name: "Rainbow",
    category: "icon",
    paths: [
      {
        points: generateArc(0, 0, 40, 0, Math.PI, 32),
        closed: false
      },
      {
        points: generateArc(0, 0, 32, 0, Math.PI, 28),
        closed: false
      },
      {
        points: generateArc(0, 0, 24, 0, Math.PI, 24),
        closed: false
      }
    ],
    defaultSize: 120
  },
  
  leaf: {
    name: "Leaf",
    category: "icon",
    paths: [{
      points: [
        { x: 0, y: -35 },
        { x: 15, y: -25 },
        { x: 25, y: -10 },
        { x: 30, y: 10 },
        { x: 25, y: 25 },
        { x: 10, y: 35 },
        { x: 0, y: 30 },
        { x: -10, y: 35 },
        { x: -25, y: 25 },
        { x: -30, y: 10 },
        { x: -25, y: -10 },
        { x: -15, y: -25 },
        { x: 0, y: -35 }
      ],
      closed: true
    }],
    defaultSize: 110
  },
  
  pacman: {
    name: "Pac-Man",
    category: "character",
    paths: [{
      points: [
        ...generateArc(0, 0, 35, Math.PI / 6, Math.PI * 2 - Math.PI / 6, 56),
        { x: 0, y: 0 }
      ],
      closed: true
    }],
    defaultSize: 100
  },
  
  gingerbread: {
    name: "Gingerbread Man",
    category: "character",
    paths: [{
      points: [
        { x: 0, y: -35 },
        { x: 8, y: -30 },
        { x: 10, y: -20 },
        { x: 10, y: -10 },
        { x: 25, y: -5 },
        { x: 30, y: 0 },
        { x: 25, y: 5 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 15, y: 25 },
        { x: 15, y: 35 },
        { x: 10, y: 35 },
        { x: 8, y: 25 },
        { x: 5, y: 15 },
        { x: 0, y: 10 },
        { x: -5, y: 15 },
        { x: -8, y: 25 },
        { x: -10, y: 35 },
        { x: -15, y: 35 },
        { x: -15, y: 25 },
        { x: -10, y: 10 },
        { x: -10, y: 0 },
        { x: -25, y: 5 },
        { x: -30, y: 0 },
        { x: -25, y: -5 },
        { x: -10, y: -10 },
        { x: -10, y: -20 },
        { x: -8, y: -30 },
        { x: 0, y: -35 }
      ],
      closed: true
    }],
    defaultSize: 120
  },
  
  lightbulb: {
    name: "Light Bulb",
    category: "icon",
    paths: [{
      points: [
        { x: 0, y: -35 },
        { x: 15, y: -30 },
        { x: 25, y: -15 },
        { x: 25, y: 0 },
        { x: 20, y: 10 },
        { x: 15, y: 15 },
        { x: 15, y: 25 },
        { x: 10, y: 30 },
        { x: 10, y: 35 },
        { x: -10, y: 35 },
        { x: -10, y: 30 },
        { x: -15, y: 25 },
        { x: -15, y: 15 },
        { x: -20, y: 10 },
        { x: -25, y: 0 },
        { x: -25, y: -15 },
        { x: -15, y: -30 },
        { x: 0, y: -35 }
      ],
      closed: true
    }],
    defaultSize: 110
  },
  
  arrow: {
    name: "Arrow",
    category: "icon",
    paths: [{
      points: [
        { x: -35, y: 0 },
        { x: 15, y: 0 },
        { x: 15, y: -15 },
        { x: 35, y: 0 },
        { x: 15, y: 15 },
        { x: 15, y: 0 },
        { x: -35, y: 0 }
      ],
      closed: true
    }],
    defaultSize: 130
  },
  
  infinity: {
    name: "Infinity",
    category: "icon",
    paths: [{
      points: [
        { x: -30, y: 0 },
        { x: -25, y: -15 },
        { x: -10, y: -20 },
        { x: 0, y: -10 },
        { x: 10, y: -20 },
        { x: 25, y: -15 },
        { x: 30, y: 0 },
        { x: 25, y: 15 },
        { x: 10, y: 20 },
        { x: 0, y: 10 },
        { x: -10, y: 20 },
        { x: -25, y: 15 },
        { x: -30, y: 0 }
      ],
      closed: true
    }],
    defaultSize: 140
  },
  
  hand: {
    name: "Hand (Peace)",
    category: "icon",
    paths: [{
      points: [
        { x: -15, y: 30 },
        { x: -15, y: 10 },
        { x: -18, y: -10 },
        { x: -15, y: -30 },
        { x: -10, y: -35 },
        { x: -8, y: -30 },
        { x: -8, y: 0 },
        { x: -5, y: -30 },
        { x: 0, y: -35 },
        { x: 3, y: -30 },
        { x: 3, y: 0 },
        { x: 6, y: -25 },
        { x: 10, y: -28 },
        { x: 12, y: -20 },
        { x: 10, y: 5 },
        { x: 15, y: 15 },
        { x: 15, y: 25 },
        { x: 10, y: 30 },
        { x: 0, y: 32 },
        { x: -10, y: 30 },
        { x: -15, y: 30 }
      ],
      closed: true
    }],
    defaultSize: 120
  }
};

// Helper functions to generate geometric shapes
function generateCircle(cx: number, cy: number, radius: number, segments: number): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius
    });
  }
  return points;
}

function generateEllipse(cx: number, cy: number, rx: number, ry: number, segments: number): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push({
      x: cx + Math.cos(angle) * rx,
      y: cy + Math.sin(angle) * ry
    });
  }
  return points;
}

function generateArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number, segments: number): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < segments; i++) {
    const angle = startAngle + (i / (segments - 1)) * (endAngle - startAngle);
    points.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius
    });
  }
  return points;
}

function generateStar(cx: number, cy: number, outerRadius: number, innerRadius: number, points: number): Array<{ x: number; y: number }> {
  const result: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    result.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius
    });
  }
  return result;
}
