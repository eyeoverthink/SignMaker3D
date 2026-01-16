// Preset Shape Library - Iconic, Whimsical, Nostalgic Designs
// For use in Sign-Sculptor neon sign generator

export interface PresetShape {
  id: string;
  name: string;
  category: string;
  description?: string;
  pathData: string; // SVG path data
  viewBox?: string;
  customizable?: {
    param: string;
    label: string;
    min: number;
    max: number;
    default: number;
  }[];
}

export const shapeCategories = {
  retro: 'Retro Tech',
  space: 'Space & Planets',
  food: 'Food & Drink',
  objects: 'Objects & Items',
  stickFigures: 'Stick Figures',
  emojiFaces: 'Emoji Faces',
  games: 'Games & Dice',
  nature: 'Nature & Animals'
} as const;

export const presetShapes: PresetShape[] = [
  // Retro Tech
  {
    id: 'retro-computer',
    name: '1980s Computer',
    category: 'retro',
    description: 'Classic desktop computer with CRT monitor',
    pathData: 'M-50,-40 L50,-40 L50,40 L-50,40 Z M-40,-28 L40,-28 L40,28 L-40,28 Z M-30,40 L-30,50 L30,50 L30,40',
    viewBox: '-60 -50 120 110'
  },
  {
    id: 'floppy-disk',
    name: 'Floppy Disk',
    category: 'retro',
    description: '3.5" floppy disk',
    pathData: 'M-40,-45 L40,-45 L40,45 L-40,45 Z M-32,-13 L32,-13 L32,23 L-32,23 Z M-36,-45 L-36,-23 L36,-23 L36,-45',
    viewBox: '-50 -55 100 110'
  },
  {
    id: 'cd',
    name: 'CD/DVD',
    category: 'retro',
    description: 'Compact disc',
    pathData: 'M0,0 m-50,0 a50,50 0 1,0 100,0 a50,50 0 1,0 -100,0 M0,0 m-15,0 a15,15 0 1,0 30,0 a15,15 0 1,0 -30,0',
    viewBox: '-60 -60 120 120'
  },
  {
    id: 'brick-phone',
    name: 'Brick Phone',
    category: 'retro',
    description: '1990s mobile phone',
    pathData: 'M-30,-60 L30,-60 L30,60 L-30,60 Z M-24,18 L24,18 L24,48 L-24,48 Z M-15,-48 Q-15,-42 -10,-42 Q-5,-42 -5,-48 M0,-48 Q0,-42 5,-42 Q10,-42 10,-48 M15,-48 Q15,-42 20,-42 Q25,-42 25,-48 M-15,-36 Q-15,-30 -10,-30 Q-5,-30 -5,-36 M0,-36 Q0,-30 5,-30 Q10,-30 10,-36 M15,-36 Q15,-30 20,-30 Q25,-30 25,-36 M-15,-24 Q-15,-18 -10,-18 Q-5,-18 -5,-24 M0,-24 Q0,-18 5,-18 Q10,-18 10,-24 M15,-24 Q15,-18 20,-18 Q25,-18 25,-24 M-15,-12 Q-15,-6 -10,-6 Q-5,-6 -5,-12 M0,-12 Q0,-6 5,-6 Q10,-6 10,-12 M15,-12 Q15,-6 20,-6 Q25,-6 25,-12 M-12,60 L-12,90 L-8,90 L-8,60',
    viewBox: '-40 -70 80 170'
  },

  // Space & Planets
  {
    id: 'saturn',
    name: 'Saturn',
    category: 'space',
    description: 'Planet with rings',
    pathData: 'M0,0 m-40,0 a40,40 0 1,0 80,0 a40,40 0 1,0 -80,0 M-70,0 Q-70,-15 70,-15 Q70,0 70,0 Q70,15 -70,15 Q-70,0 -70,0 M-50,0 Q-50,-9 50,-9 Q50,0 50,0 Q50,9 -50,9 Q-50,0 -50,0',
    viewBox: '-80 -50 160 100'
  },
  {
    id: 'planet',
    name: 'Planet',
    category: 'space',
    description: 'Simple planet',
    pathData: 'M0,0 m-40,0 a40,40 0 1,0 80,0 a40,40 0 1,0 -80,0',
    viewBox: '-50 -50 100 100'
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    category: 'space',
    description: 'Gas giant with bands',
    pathData: 'M0,0 m-60,0 a60,60 0 1,0 120,0 a60,60 0 1,0 -120,0 M-60,20 L60,20 M-60,-20 L60,-20',
    viewBox: '-70 -70 140 140'
  },

  // Food & Drink
  {
    id: 'soda-can',
    name: 'Soda Can',
    category: 'food',
    description: 'Soda can with straw',
    pathData: 'M-20,-40 L-20,35 Q-20,40 -14,40 L14,40 Q20,40 20,35 L20,-40 Z M-2,40 L-2,80 L2,80 L2,40',
    viewBox: '-30 -50 60 140'
  },

  // Games & Dice
  {
    id: 'dice-1',
    name: 'Dice (1)',
    category: 'games',
    pathData: 'M-50,-50 L50,-50 L50,50 L-50,50 Z M0,0 m-8,0 a8,8 0 1,0 16,0 a8,8 0 1,0 -16,0',
    viewBox: '-60 -60 120 120'
  },
  {
    id: 'dice-6',
    name: 'Dice (6)',
    category: 'games',
    pathData: 'M-50,-50 L50,-50 L50,50 L-50,50 Z M-20,-25 m-8,0 a8,8 0 1,0 16,0 a8,8 0 1,0 -16,0 M-20,0 m-8,0 a8,8 0 1,0 16,0 a8,8 0 1,0 -16,0 M-20,25 m-8,0 a8,8 0 1,0 16,0 a8,8 0 1,0 -16,0 M20,-25 m-8,0 a8,8 0 1,0 16,0 a8,8 0 1,0 -16,0 M20,0 m-8,0 a8,8 0 1,0 16,0 a8,8 0 1,0 -16,0 M20,25 m-8,0 a8,8 0 1,0 16,0 a8,8 0 1,0 -16,0',
    viewBox: '-60 -60 120 120'
  },

  // Objects
  {
    id: 'glasses',
    name: 'Glasses',
    category: 'objects',
    description: 'Eyeglasses',
    pathData: 'M-45,0 m-30,0 a30,24 0 1,0 60,0 a30,24 0 1,0 -60,0 M45,0 m-30,0 a30,24 0 1,0 60,0 a30,24 0 1,0 -60,0 M-15,0 L15,0 M-75,0 L-115,10 M75,0 L115,10',
    viewBox: '-125 -35 250 55'
  },
  {
    id: 'clock-6',
    name: 'Clock (6:00)',
    category: 'objects',
    description: 'Clock showing 6:00',
    pathData: 'M0,0 m-50,0 a50,50 0 1,0 100,0 a50,50 0 1,0 -100,0 M0,-42 m-5,0 a5,5 0 1,0 10,0 a5,5 0 1,0 -10,0 M42,0 m-5,0 a5,5 0 1,0 10,0 a5,5 0 1,0 -10,0 M0,42 m-5,0 a5,5 0 1,0 10,0 a5,5 0 1,0 -10,0 M-42,0 m-5,0 a5,5 0 1,0 10,0 a5,5 0 1,0 -10,0 M0,0 L0,35 M0,0 L0,-25',
    viewBox: '-60 -60 120 120'
  },

  // Nature
  {
    id: 'dinosaur-trex',
    name: 'T-Rex',
    category: 'nature',
    description: 'T-Rex dinosaur silhouette',
    pathData: 'M-30,-40 L-30,10 L-20,20 L0,30 L30,20 L40,10 L30,0 L20,-10 L10,-20 L15,-35 L25,-40 L20,-45 L5,-40 L0,-30 L-5,-20 L-10,-25 L-15,-20 L-20,0 L-25,-10 L-25,-40 Z',
    viewBox: '-40 -50 90 90'
  },
  {
    id: 'brain',
    name: 'Brain',
    category: 'nature',
    description: 'Human brain',
    pathData: 'M-40,0 Q-40,-50 -12,-50 Q12,-50 0,-40 Q12,-50 40,-50 Q40,0 40,40 Q12,50 0,50 Q-12,50 -40,40 Q-40,0 -40,0 M-20,-15 Q-12,-25 12,-25 Q20,-15 20,-15 M-20,0 Q-8,-10 8,-10 Q20,0 20,0 M-20,15 Q-12,5 12,5 Q20,15 20,15',
    viewBox: '-50 -60 100 120'
  },

  // Stick Figures
  {
    id: 'stick-standing',
    name: 'Standing',
    category: 'stickFigures',
    description: 'Stick figure standing',
    pathData: 'M0,40 m-15,0 a15,15 0 1,0 30,0 a15,15 0 1,0 -30,0 M0,25 L0,-10 M0,15 L-30,-5 M0,15 L30,-5 M0,-10 L-21,-50 M0,-10 L21,-50',
    viewBox: '-40 -60 80 120'
  },
  {
    id: 'stick-jumping',
    name: 'Jumping',
    category: 'stickFigures',
    description: 'Stick figure jumping',
    pathData: 'M0,40 m-15,0 a15,15 0 1,0 30,0 a15,15 0 1,0 -30,0 M0,25 L0,-10 M0,15 L-30,40 M0,15 L30,40 M0,-10 L-15,-30 M0,-10 L15,-30',
    viewBox: '-40 -40 80 100'
  },
  {
    id: 'stick-waving',
    name: 'Waving',
    category: 'stickFigures',
    description: 'Stick figure waving',
    pathData: 'M0,40 m-15,0 a15,15 0 1,0 30,0 a15,15 0 1,0 -30,0 M0,25 L0,-10 M0,15 L-21,45 L-27,40 M0,15 L30,-5 M0,-10 L-21,-50 M0,-10 L21,-50',
    viewBox: '-40 -60 80 120'
  },

  // Emoji Faces
  {
    id: 'emoji-smile',
    name: '😊 Smile',
    category: 'emojiFaces',
    description: 'Smiling face',
    pathData: 'M0,0 m-50,0 a50,50 0 1,0 100,0 a50,50 0 1,0 -100,0 M-15,10 m-6,0 a6,6 0 1,0 12,0 a6,6 0 1,0 -12,0 M15,10 m-6,0 a6,6 0 1,0 12,0 a6,6 0 1,0 -12,0 M-20,-5 Q0,-20 20,-5',
    viewBox: '-60 -60 120 120'
  },
  {
    id: 'emoji-cool',
    name: '😎 Cool',
    category: 'emojiFaces',
    description: 'Cool face with sunglasses',
    pathData: 'M0,0 m-50,0 a50,50 0 1,0 100,0 a50,50 0 1,0 -100,0 M-25,10 L-5,10 L-5,16 L-25,16 Z M5,10 L25,10 L25,16 L5,16 Z M-5,13 L5,13 M-15,-10 Q0,-15 15,-10',
    viewBox: '-60 -60 120 120'
  },
  {
    id: 'emoji-love',
    name: '😍 Love',
    category: 'emojiFaces',
    description: 'Face with heart eyes',
    pathData: 'M0,0 m-50,0 a50,50 0 1,0 100,0 a50,50 0 1,0 -100,0 M-15,16 Q-20,22 -20,10 Q-20,4 -15,2 Q-10,4 -10,10 Q-10,22 -15,16 M15,16 Q10,22 10,10 Q10,4 15,2 Q20,4 20,10 Q20,22 15,16 M-20,-5 Q0,-20 20,-5',
    viewBox: '-60 -60 120 120'
  }
];

// Helper to get shapes by category
export function getShapesByCategory(category: keyof typeof shapeCategories): PresetShape[] {
  return presetShapes.filter(shape => shape.category === category);
}

// Helper to get shape by id
export function getShapeById(id: string): PresetShape | undefined {
  return presetShapes.find(shape => shape.id === id);
}

// Convert SVG path to points for 3D extrusion
export function pathToPoints(pathData: string, resolution: number = 50): { x: number; y: number }[] {
  // This is a simplified parser - in production you'd use a proper SVG path parser
  const points: { x: number; y: number }[] = [];
  
  // Basic path command parsing (M, L, Q, C, Z)
  const commands = pathData.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi) || [];
  
  let currentX = 0;
  let currentY = 0;
  
  commands.forEach(cmd => {
    const type = cmd[0];
    const coords = cmd.slice(1).trim().split(/[\s,]+/).map(Number);
    
    switch (type.toUpperCase()) {
      case 'M': // Move to
        currentX = coords[0];
        currentY = coords[1];
        points.push({ x: currentX, y: currentY });
        break;
      case 'L': // Line to
        currentX = coords[0];
        currentY = coords[1];
        points.push({ x: currentX, y: currentY });
        break;
      case 'Z': // Close path
        if (points.length > 0) {
          points.push({ x: points[0].x, y: points[0].y });
        }
        break;
      // Add more path commands as needed
    }
  });
  
  return points;
}
