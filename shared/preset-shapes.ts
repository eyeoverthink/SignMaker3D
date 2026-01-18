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
    pathData: 'M-6,-48 L-10,-40 L-6,-36 L-2,-40 M0,-50 L4,-42 L8,-38 L12,-42 L8,-48 M-15,-35 L-15,18 Q-15,32 -8,38 Q0,42 0,42 Q8,38 15,32 L15,18 L15,-35 Z M-12,-28 L-8,-24 L-4,-28 L0,-24 L4,-28 L8,-24 L12,-28 M-12,-20 L-8,-16 L-4,-20 L0,-16 L4,-20 L8,-16 L12,-20 M-12,-12 L-8,-8 L-4,-12 L0,-8 L4,-12 L8,-8 L12,-12 M-12,-4 L-8,0 L-4,-4 L0,0 L4,-4 L8,0 L12,-4 M-12,4 L-8,8 L-4,4 L0,8 L4,4 L8,8 L12,4 M-12,12 L-8,16 L-4,12 L0,16 L4,12 L8,16 L12,12 M-12,20 L-8,24 L-4,20 L0,24 L4,20 L8,24 L12,20',
    viewBox: '-20 -55 40 100'
  },
  {
    id: 'music-note',
    name: 'Music Note',
    category: 'icons',
    description: 'Musical note',
    pathData: 'M10,-45 L10,15 M10,15 Q10,25 2,28 Q-6,25 -8,18 Q-10,10 -8,2 Q-6,-2 2,-4 Q10,-2 10,15 M10,-35 L28,-28 L28,-20 L10,-27 Z',
    viewBox: '-15 -50 48 82'
  },
  
  // Retro Tech
  {
    id: 'retro-computer',
    name: '1980s Computer',
    category: 'retro',
    description: 'Classic desktop computer with CRT monitor',
    pathData: 'M-42,-42 Q-46,-42 -46,-38 L-46,-2 Q-46,2 -42,2 L42,2 Q46,2 46,-2 L46,-38 Q46,-42 42,-42 Z M-36,-35 L36,-35 L36,-8 L-36,-8 Z M-30,-30 L-27,-27 L-24,-30 M-28,-26 L-25,-23 L-22,-26 M-24,-22 L-21,-19 L-18,-22 M-20,2 L-20,10 L-10,14 L10,14 L20,10 L20,2 M-16,6 L-13,6 M-9,6 L-6,6 M-2,6 L1,6 M5,6 L8,6 M12,6 L15,6 M-9,9 L-6,9 M1,9 L4,9',
    viewBox: '-50 -46 100 64'
  },
  {
    id: 'floppy-disk',
    name: 'Floppy Disk',
    category: 'retro',
    description: '3.5" floppy disk',
    pathData: 'M-40,-50 L32,-50 L40,-42 L40,50 L-40,50 Z M-34,-50 L-34,-26 L34,-26 L34,-50 M-30,-44 L-30,-32 M32,-50 L32,-42 L40,-42 M-34,-16 L34,-16 L34,40 L-34,40 Z M-30,-10 L30,-10 L30,34 L-30,34 Z M-36,-6 m-4,0 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0 M-34,44 L34,44 M-34,47 L34,47',
    viewBox: '-44 -54 88 108'
  },
  {
    id: 'cd',
    name: 'CD/DVD',
    category: 'retro',
    description: 'Compact disc',
    pathData: 'M0,0 m-50,0 a50,50 0 1,0 100,0 a50,50 0 1,0 -100,0 M0,0 m-15,0 a15,15 0 1,0 30,0 a15,15 0 1,0 -30,0',
    viewBox: '-60 -60 120 120'
  },

  // Space & Planets
  {
    id: 'saturn',
    name: 'Saturn',
    category: 'space',
    description: 'Planet with rings',
    pathData: 'M0,0 m-35,0 a35,35 0 1,0 70,0 a35,35 0 1,0 -70,0 M-60,-8 Q-55,-18 60,-18 Q65,-8 60,2 Q-55,12 -60,2 Z M-45,-5 Q-42,-10 45,-10 Q48,-5 45,0 Q-42,5 -45,0 Z',
    viewBox: '-70 -45 140 90'
  },
  {
    id: 'planet',
    name: 'Planet',
    category: 'space',
    description: 'Simple planet with craters',
    pathData: 'M0,0 m-40,0 a40,40 0 1,0 80,0 a40,40 0 1,0 -80,0 M-15,10 m-8,0 a8,8 0 1,0 16,0 a8,8 0 1,0 -16,0 M10,-15 m-6,0 a6,6 0 1,0 12,0 a6,6 0 1,0 -12,0 M20,15 m-5,0 a5,5 0 1,0 10,0 a5,5 0 1,0 -10,0',
    viewBox: '-50 -50 100 100'
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    category: 'space',
    description: 'Gas giant - cylindrical can shape',
    pathData: 'M-25,-45 Q-30,-45 -30,-40 L-30,40 Q-30,45 -25,45 L25,45 Q30,45 30,40 L30,-40 Q30,-45 25,-45 Z M-30,-25 L30,-25 M-30,0 L30,0 M-30,25 L30,25',
    viewBox: '-35 -50 70 100'
  },

  // Food & Drink
  {
    id: 'soda-can',
    name: 'Soda Can',
    category: 'food',
    description: 'Soda can',
    pathData: 'M-22,-45 Q-25,-45 -25,-42 L-25,38 Q-25,42 -22,42 L22,42 Q25,42 25,38 L25,-42 Q25,-45 22,-45 Z M-25,-35 L25,-35 M-25,-30 L25,-30',
    viewBox: '-30 -50 60 95'
  },

  // Games & Dice
  {
    id: 'dice-1',
    name: 'Dice (1)',
    category: 'games',
    pathData: 'M-45,-45 Q-50,-45 -50,-40 L-50,40 Q-50,45 -45,45 L45,45 Q50,45 50,40 L50,-40 Q50,-45 45,-45 Z M0,0 m-7,0 a7,7 0 1,0 14,0 a7,7 0 1,0 -14,0',
    viewBox: '-55 -55 110 110'
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
    pathData: 'M-35,-25 Q-40,-35 -30,-40 Q-20,-42 -10,-35 L0,-25 L5,-35 Q15,-42 25,-38 Q30,-35 28,-28 L25,-20 Q30,-15 28,-8 L20,0 L15,10 L10,20 L5,30 L0,35 L-5,30 L-8,20 L-10,25 L-15,30 L-18,25 L-15,15 L-12,5 L-10,-5 L-15,-10 Q-20,-5 -25,0 L-28,5 L-30,0 L-28,-10 L-25,-20 Z M-8,-25 L-5,-22 L-8,-20 Z',
    viewBox: '-45 -45 80 85'
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
    pathData: 'M0,-40 m-12,0 a12,12 0 1,0 24,0 a12,12 0 1,0 -24,0 M0,-28 L0,10 M0,0 L-25,-20 L-28,-15 L-25,-10 M0,0 L25,15 M0,10 L-18,45 M0,10 L18,45',
    viewBox: '-35 -55 70 105'
  },

  {
    id: 'stick-waipe',
    name: 'Waipe',
    category: 'stickFigures',
    description: 'Stick figure with hand on hip',
    pathData: 'M0,-40 m-12,0 a12,12 0 1,0 24,0 a12,12 0 1,0 -24,0 M0,-28 L0,10 M0,0 L-25,8 M0,0 L20,5 L18,10 M0,10 L-18,45 M0,10 L18,45',
    viewBox: '-35 -55 70 105'
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
