// SVG Path Parser for preset shapes
// Converts SVG path data to point arrays for 3D extrusion

interface Point {
  x: number;
  y: number;
}

export function parseSVGPath(pathData: string, resolution: number = 100): Point[] {
  const points: Point[] = [];
  
  // Remove extra whitespace and normalize
  const normalized = pathData.trim().replace(/\s+/g, ' ');
  
  // Split into commands
  const commands = normalized.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi) || [];
  
  let currentX = 0;
  let currentY = 0;
  let startX = 0;
  let startY = 0;
  
  commands.forEach(cmd => {
    const type = cmd[0].toUpperCase();
    const isRelative = cmd[0] === cmd[0].toLowerCase();
    const coords = cmd.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    
    switch (type) {
      case 'M': // Move to
        if (coords.length >= 2) {
          currentX = isRelative ? currentX + coords[0] : coords[0];
          currentY = isRelative ? currentY + coords[1] : coords[1];
          startX = currentX;
          startY = currentY;
          points.push({ x: currentX, y: currentY });
        }
        break;
        
      case 'L': // Line to
        for (let i = 0; i < coords.length; i += 2) {
          if (i + 1 < coords.length) {
            currentX = isRelative ? currentX + coords[i] : coords[i];
            currentY = isRelative ? currentY + coords[i + 1] : coords[i + 1];
            points.push({ x: currentX, y: currentY });
          }
        }
        break;
        
      case 'H': // Horizontal line
        coords.forEach(x => {
          currentX = isRelative ? currentX + x : x;
          points.push({ x: currentX, y: currentY });
        });
        break;
        
      case 'V': // Vertical line
        coords.forEach(y => {
          currentY = isRelative ? currentY + y : y;
          points.push({ x: currentX, y: currentY });
        });
        break;
        
      case 'Q': // Quadratic Bezier
        for (let i = 0; i < coords.length; i += 4) {
          if (i + 3 < coords.length) {
            const cpX = isRelative ? currentX + coords[i] : coords[i];
            const cpY = isRelative ? currentY + coords[i + 1] : coords[i + 1];
            const endX = isRelative ? currentX + coords[i + 2] : coords[i + 2];
            const endY = isRelative ? currentY + coords[i + 3] : coords[i + 3];
            
            // Sample the quadratic curve
            const samples = Math.max(10, Math.floor(resolution / 10));
            for (let t = 0; t <= samples; t++) {
              const ratio = t / samples;
              const x = (1 - ratio) * (1 - ratio) * currentX + 
                       2 * (1 - ratio) * ratio * cpX + 
                       ratio * ratio * endX;
              const y = (1 - ratio) * (1 - ratio) * currentY + 
                       2 * (1 - ratio) * ratio * cpY + 
                       ratio * ratio * endY;
              points.push({ x, y });
            }
            
            currentX = endX;
            currentY = endY;
          }
        }
        break;
        
      case 'C': // Cubic Bezier
        for (let i = 0; i < coords.length; i += 6) {
          if (i + 5 < coords.length) {
            const cp1X = isRelative ? currentX + coords[i] : coords[i];
            const cp1Y = isRelative ? currentY + coords[i + 1] : coords[i + 1];
            const cp2X = isRelative ? currentX + coords[i + 2] : coords[i + 2];
            const cp2Y = isRelative ? currentY + coords[i + 3] : coords[i + 3];
            const endX = isRelative ? currentX + coords[i + 4] : coords[i + 4];
            const endY = isRelative ? currentY + coords[i + 5] : coords[i + 5];
            
            // Sample the cubic curve
            const samples = Math.max(10, Math.floor(resolution / 10));
            for (let t = 0; t <= samples; t++) {
              const ratio = t / samples;
              const t1 = 1 - ratio;
              const x = t1 * t1 * t1 * currentX + 
                       3 * t1 * t1 * ratio * cp1X + 
                       3 * t1 * ratio * ratio * cp2X + 
                       ratio * ratio * ratio * endX;
              const y = t1 * t1 * t1 * currentY + 
                       3 * t1 * t1 * ratio * cp1Y + 
                       3 * t1 * ratio * ratio * cp2Y + 
                       ratio * ratio * ratio * endY;
              points.push({ x, y });
            }
            
            currentX = endX;
            currentY = endY;
          }
        }
        break;
        
      case 'A': // Arc (simplified - treat as line for now)
        for (let i = 0; i < coords.length; i += 7) {
          if (i + 6 < coords.length) {
            const endX = isRelative ? currentX + coords[i + 5] : coords[i + 5];
            const endY = isRelative ? currentY + coords[i + 6] : coords[i + 6];
            
            // Simple arc approximation with lines
            const samples = 20;
            for (let t = 1; t <= samples; t++) {
              const ratio = t / samples;
              const x = currentX + (endX - currentX) * ratio;
              const y = currentY + (endY - currentY) * ratio;
              points.push({ x, y });
            }
            
            currentX = endX;
            currentY = endY;
          }
        }
        break;
        
      case 'Z': // Close path
        if (points.length > 0 && (currentX !== startX || currentY !== startY)) {
          points.push({ x: startX, y: startY });
          currentX = startX;
          currentY = startY;
        }
        break;
    }
  });
  
  return points;
}

// Convert points to path suitable for extrusion
export function pointsToPath(points: Point[]): number[][] {
  return points.map(p => [p.x, p.y]);
}

// Simplify path by removing redundant points
export function simplifyPath(points: Point[], tolerance: number = 0.5): Point[] {
  if (points.length <= 2) return points;
  
  const simplified: Point[] = [points[0]];
  
  for (let i = 1; i < points.length - 1; i++) {
    const prev = simplified[simplified.length - 1];
    const curr = points[i];
    const next = points[i + 1];
    
    // Calculate distance from current point to line between prev and next
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    if (len > 0.001) {
      const dist = Math.abs((dy * curr.x - dx * curr.y + next.x * prev.y - next.y * prev.x) / len);
      
      if (dist > tolerance) {
        simplified.push(curr);
      }
    }
  }
  
  simplified.push(points[points.length - 1]);
  
  return simplified;
}
