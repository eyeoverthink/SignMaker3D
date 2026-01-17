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
  icons: 'Icons & Symbols',
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
  // Icons & Symbols (from screenshot)
  {
    id: 'heart',
    name: 'Heart',
    category: 'icons',
    description: 'Classic heart shape',
    pathData: 'M0,-30 C-15,-45 -40,-45 -40,-20 C-40,0 0,30 0,30 C0,30 40,0 40,-20 C40,-45 15,-45 0,-30 Z',
    viewBox: '-50 -50 100 80'
  },
  {
    id: 'star',
    name: 'Star',
    category: 'icons',
    description: 'Five-pointed star',
    pathData: 'M0,-40 L12,-12 L40,-12 L18,6 L28,34 L0,16 L-28,34 L-18,6 L-40,-12 L-12,-12 Z',
    viewBox: '-45 -45 90 85'
  },
  {
    id: 'arrow',
    name: 'Arrow',
    category: 'icons',
    description: 'Right-pointing arrow',
    pathData: 'M-40,0 L20,0 L20,-20 L50,0 L20,20 L20,0 Z',
    viewBox: '-45 -25 100 50'
  },
  {
    id: 'lips',
    name: 'Lips',
    category: 'icons',
    description: 'Lips/mouth shape',
    pathData: 'M-40,0 Q-30,-15 0,-15 Q30,-15 40,0 Q30,15 0,15 Q-30,15 -40,0 M-30,0 Q-20,8 0,8 Q20,8 30,0',
    viewBox: '-45 -20 90 40'
  },
  {
    id: 'alien',
    name: 'Alien',
    category: 'icons',
    description: 'Alien head',
    pathData: 'M0,-40 Q-30,-40 -40,-10 Q-40,20 -20,35 L-10,30 Q-15,20 -15,10 Q-15,-5 -10,-10 L-20,-15 Q-25,-5 -25,10 Q-25,25 -15,30 L0,40 L15,30 Q25,25 25,10 Q25,-5 20,-15 L10,-10 Q15,-5 15,10 Q15,20 10,30 L20,35 Q40,20 40,-10 Q30,-40 0,-40 Z M-15,0 Q-15,-8 -10,-8 Q-5,-8 -5,0 Q-5,8 -10,8 Q-15,8 -15,0 M15,0 Q15,-8 20,-8 Q25,-8 25,0 Q25,8 20,8 Q15,8 15,0',
    viewBox: '-45 -45 90 90'
  },
  {
    id: 'leaf',
    name: 'Leaf',
    category: 'icons',
    description: 'Cannabis leaf',
    pathData: 'M0,-40 L0,40 M0,0 Q-10,-15 -20,-10 Q-15,0 0,5 M0,0 Q10,-15 20,-10 Q15,0 0,5 M0,-10 Q-15,-25 -30,-20 Q-20,-5 0,0 M0,-10 Q15,-25 30,-20 Q20,-5 0,0 M0,-20 Q-20,-35 -35,-25 Q-25,-10 0,-5 M0,-20 Q20,-35 35,-25 Q25,-10 0,-5',
    viewBox: '-40 -45 80 90'
  },
  {
    id: 'pineapple',
    name: 'Pineapple',
    category: 'icons',
    description: 'Pineapple fruit',
    pathData: 'M0,-40 L-5,-30 L5,-30 Z M-10,-30 L-5,-20 L5,-20 L10,-30 M-15,-20 Q-20,0 -15,20 Q-10,30 0,35 Q10,30 15,20 Q20,0 15,-20 M-10,-15 L10,-5 M-10,-5 L10,5 M-10,5 L10,15 M10,-15 L-10,-5 M10,-5 L-10,5 M10,5 L-10,15',
    viewBox: '-25 -45 50 85'
  },
  {
    id: 'music-note',
    name: 'Music Note',
    category: 'icons',
    description: 'Musical note',
    pathData: 'M10,-40 L10,20 Q10,30 0,30 Q-10,30 -10,20 Q-10,10 0,10 Q10,10 10,20 L10,-30 L30,-25 L30,-15 L10,-20',
    viewBox: '-15 -45 50 80'
  },
  
  // Retro Tech
  {
    id: 'retro-computer',
    name: '1980s Computer',
    category: 'retro',
    description: 'Classic desktop computer with CRT monitor',
    pathData: 'M-50,-40 L50,-40 L50,40 L-50,40 L-50,-40 M-40,-28 L40,-28 L40,28 L-40,28 L-40,-28 M-30,40 L-30,50 L30,50 L30,40',
    viewBox: '-60 -50 120 110'
  },
  {
    id: 'floppy-disk',
    name: 'Floppy Disk',
    category: 'retro',
    description: '3.5" floppy disk',
    pathData: 'M-40,-45 L40,-45 L40,45 L-40,45 L-40,-45 M-32,-13 L32,-13 L32,23 L-32,23 L-32,-13 M-36,-45 L-36,-23 L36,-23 L36,-45',
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
    pathData: 'M-30,-60 L30,-60 L30,60 L-30,60 L-30,-60 M-24,18 L24,18 L24,48 L-24,48 L-24,18 M-10,-70 L-10,-60',
    viewBox: '-40 -75 80 145'
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
