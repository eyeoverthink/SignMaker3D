import * as THREE from 'three';

/**
 * CR2032 Coin Cell Battery Holder Generator
 * Compact alternative to 4×AA battery pack
 * Based on user's pink holder design from images
 */

interface CR2032HolderSettings {
  // Battery specifications
  batteryDiameter: number;      // CR2032 = 20mm
  batteryThickness: number;     // CR2032 = 3.2mm
  numBatteries: number;         // 1-3 cells in series
  
  // Holder design
  holderStyle: 'ring' | 'clip' | 'snap';
  wallThickness: number;
  contactSpringHeight: number;
  
  // Wire routing
  wireChannelWidth: number;
  wireChannelDepth: number;
  wireExitAngle: number;        // Degrees from vertical
  
  // Switch integration
  includeSwitch: boolean;
  switchType: 'slide' | 'button' | 'none';
  switchCutoutWidth: number;
  switchCutoutHeight: number;
  
  // Mounting
  mountingStyle: 'base_integrated' | 'standalone' | 'adhesive';
  mountingHoleDiameter: number;
  mountingHoleSpacing: number;
}

const defaultCR2032Settings: CR2032HolderSettings = {
  batteryDiameter: 20,
  batteryThickness: 3.2,
  numBatteries: 2,  // 6V total (2×3V)
  
  holderStyle: 'snap',
  wallThickness: 1.5,
  contactSpringHeight: 1.0,
  
  wireChannelWidth: 3,
  wireChannelDepth: 2,
  wireExitAngle: 45,
  
  includeSwitch: true,
  switchType: 'slide',
  switchCutoutWidth: 8,
  switchCutoutHeight: 3,
  
  mountingStyle: 'base_integrated',
  mountingHoleDiameter: 3,
  mountingHoleSpacing: 25,
};

/**
 * Generate ring-style CR2032 holder (like yellow holder in image)
 */
function generateRingHolder(settings: CR2032HolderSettings): THREE.Group {
  const group = new THREE.Group();
  
  const ringOuterRadius = settings.batteryDiameter / 2 + settings.wallThickness;
  const ringInnerRadius = settings.batteryDiameter / 2 - 0.2; // Slight interference fit
  const ringHeight = settings.batteryThickness + 2;
  
  // Outer ring
  const outerGeometry = new THREE.CylinderGeometry(
    ringOuterRadius,
    ringOuterRadius,
    ringHeight,
    32
  );
  const material = new THREE.MeshStandardMaterial({ color: 0xffd700 });
  const outerMesh = new THREE.Mesh(outerGeometry, material);
  group.add(outerMesh);
  
  // Inner cavity (subtract in CSG)
  const innerGeometry = new THREE.CylinderGeometry(
    ringInnerRadius,
    ringInnerRadius,
    ringHeight + 1,
    32
  );
  const innerMesh = new THREE.Mesh(innerGeometry, material);
  // Note: Use CSG subtraction in actual implementation
  
  // Bottom contact plate
  const contactGeometry = new THREE.CylinderGeometry(
    ringInnerRadius - 1,
    ringInnerRadius - 1,
    0.5,
    32
  );
  const contactMesh = new THREE.Mesh(contactGeometry, material);
  contactMesh.position.y = -ringHeight / 2 + 0.25;
  group.add(contactMesh);
  
  // Top spring contact (flexible)
  const springGeometry = new THREE.CylinderGeometry(
    2,
    2,
    settings.contactSpringHeight,
    16
  );
  const springMesh = new THREE.Mesh(springGeometry, material);
  springMesh.position.y = ringHeight / 2 - settings.contactSpringHeight / 2;
  group.add(springMesh);
  
  return group;
}

/**
 * Generate clip-style CR2032 holder (like orange/red holder in image)
 */
function generateClipHolder(settings: CR2032HolderSettings): THREE.Group {
  const group = new THREE.Group();
  
  const baseRadius = settings.batteryDiameter / 2 + settings.wallThickness + 2;
  const baseHeight = 2;
  
  // Base platform
  const baseGeometry = new THREE.CylinderGeometry(
    baseRadius,
    baseRadius,
    baseHeight,
    32
  );
  const material = new THREE.MeshStandardMaterial({ color: 0xff6347 });
  const baseMesh = new THREE.Mesh(baseGeometry, material);
  group.add(baseMesh);
  
  // Battery cavity
  const cavityGeometry = new THREE.CylinderGeometry(
    settings.batteryDiameter / 2 + 0.2,
    settings.batteryDiameter / 2 + 0.2,
    settings.batteryThickness,
    32
  );
  const cavityMesh = new THREE.Mesh(cavityGeometry, material);
  cavityMesh.position.y = baseHeight / 2 + settings.batteryThickness / 2;
  group.add(cavityMesh);
  
  // Clip arms (2 opposing sides)
  const clipWidth = 4;
  const clipHeight = settings.batteryThickness + 1;
  const clipThickness = settings.wallThickness;
  
  for (let i = 0; i < 2; i++) {
    const angle = i * Math.PI;
    const x = Math.cos(angle) * (settings.batteryDiameter / 2 + clipThickness / 2);
    const z = Math.sin(angle) * (settings.batteryDiameter / 2 + clipThickness / 2);
    
    const clipGeometry = new THREE.BoxGeometry(
      clipWidth,
      clipHeight,
      clipThickness
    );
    const clipMesh = new THREE.Mesh(clipGeometry, material);
    clipMesh.position.set(x, baseHeight / 2 + clipHeight / 2, z);
    group.add(clipMesh);
  }
  
  // Bottom contact
  const contactGeometry = new THREE.CylinderGeometry(
    3,
    3,
    0.5,
    16
  );
  const contactMesh = new THREE.Mesh(contactGeometry, material);
  contactMesh.position.y = baseHeight / 2 + 0.25;
  group.add(contactMesh);
  
  return group;
}

/**
 * Generate snap-fit CR2032 holder (like pink holder in image 5)
 */
function generateSnapHolder(settings: CR2032HolderSettings): THREE.Group {
  const group = new THREE.Group();
  
  const holderWidth = settings.batteryDiameter + 4;
  const holderDepth = settings.batteryDiameter + 4;
  const holderHeight = settings.batteryThickness + 3;
  
  // Main body
  const bodyGeometry = new THREE.BoxGeometry(
    holderWidth,
    holderHeight,
    holderDepth
  );
  const material = new THREE.MeshStandardMaterial({ color: 0xff69b4 });
  const bodyMesh = new THREE.Mesh(bodyGeometry, material);
  group.add(bodyMesh);
  
  // Battery cavity (circular)
  const cavityGeometry = new THREE.CylinderGeometry(
    settings.batteryDiameter / 2 + 0.3,
    settings.batteryDiameter / 2 + 0.3,
    holderHeight + 1,
    32
  );
  const cavityMesh = new THREE.Mesh(cavityGeometry, material);
  cavityMesh.rotation.x = Math.PI / 2;
  // Note: Use CSG subtraction
  
  // Snap-fit retention clips (4 corners)
  const clipSize = 2;
  const clipPositions = [
    { x: settings.batteryDiameter / 2 - 1, z: settings.batteryDiameter / 2 - 1 },
    { x: -settings.batteryDiameter / 2 + 1, z: settings.batteryDiameter / 2 - 1 },
    { x: settings.batteryDiameter / 2 - 1, z: -settings.batteryDiameter / 2 + 1 },
    { x: -settings.batteryDiameter / 2 + 1, z: -settings.batteryDiameter / 2 + 1 },
  ];
  
  clipPositions.forEach(pos => {
    const clipGeometry = new THREE.BoxGeometry(clipSize, clipSize, clipSize);
    const clipMesh = new THREE.Mesh(clipGeometry, material);
    clipMesh.position.set(pos.x, holderHeight / 2 - clipSize / 2, pos.z);
    group.add(clipMesh);
  });
  
  // Wire channels (integrated into body)
  const channelGeometry = new THREE.BoxGeometry(
    settings.wireChannelWidth,
    settings.wireChannelDepth,
    holderDepth + 2
  );
  const channelMesh = new THREE.Mesh(channelGeometry, material);
  channelMesh.position.set(
    holderWidth / 2 - settings.wireChannelWidth / 2,
    -holderHeight / 2 + settings.wireChannelDepth / 2,
    0
  );
  // Note: Use CSG subtraction
  
  return group;
}

/**
 * Generate multi-cell holder (series connection for higher voltage)
 */
export function generateCR2032Holder(
  settings: CR2032HolderSettings = defaultCR2032Settings
): THREE.Group {
  const group = new THREE.Group();
  
  for (let i = 0; i < settings.numBatteries; i++) {
    let cellHolder: THREE.Group;
    
    switch (settings.holderStyle) {
      case 'ring':
        cellHolder = generateRingHolder(settings);
        break;
      case 'clip':
        cellHolder = generateClipHolder(settings);
        break;
      case 'snap':
      default:
        cellHolder = generateSnapHolder(settings);
        break;
    }
    
    // Position cells in series
    const spacing = settings.batteryDiameter + 5;
    cellHolder.position.x = i * spacing - ((settings.numBatteries - 1) * spacing) / 2;
    group.add(cellHolder);
  }
  
  // Add integrated switch if requested
  if (settings.includeSwitch && settings.switchType !== 'none') {
    const switchHolder = generateSwitchCutout(settings);
    switchHolder.position.set(
      0,
      0,
      settings.batteryDiameter / 2 + 5
    );
    group.add(switchHolder);
  }
  
  // Add mounting holes if standalone
  if (settings.mountingStyle === 'standalone') {
    const mountingHoles = generateMountingHoles(settings);
    group.add(mountingHoles);
  }
  
  return group;
}

/**
 * Generate switch cutout for integrated slide switch
 */
function generateSwitchCutout(settings: CR2032HolderSettings): THREE.Group {
  const group = new THREE.Group();
  
  const switchBodyWidth = settings.switchCutoutWidth + 4;
  const switchBodyHeight = settings.switchCutoutHeight + 2;
  const switchBodyDepth = 6;
  
  // Switch housing
  const bodyGeometry = new THREE.BoxGeometry(
    switchBodyWidth,
    switchBodyHeight,
    switchBodyDepth
  );
  const material = new THREE.MeshStandardMaterial({ color: 0x2d3748 });
  const bodyMesh = new THREE.Mesh(bodyGeometry, material);
  group.add(bodyMesh);
  
  // Switch slot
  const slotGeometry = new THREE.BoxGeometry(
    settings.switchCutoutWidth,
    settings.switchCutoutHeight,
    switchBodyDepth + 1
  );
  const slotMesh = new THREE.Mesh(slotGeometry, material);
  // Note: Use CSG subtraction
  
  return group;
}

/**
 * Generate mounting holes for standalone installation
 */
function generateMountingHoles(settings: CR2032HolderSettings): THREE.Group {
  const group = new THREE.Group();
  
  const holePositions = [
    { x: -settings.mountingHoleSpacing / 2, z: 0 },
    { x: settings.mountingHoleSpacing / 2, z: 0 },
  ];
  
  holePositions.forEach(pos => {
    const holeGeometry = new THREE.CylinderGeometry(
      settings.mountingHoleDiameter / 2,
      settings.mountingHoleDiameter / 2,
      5,
      16
    );
    const material = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const holeMesh = new THREE.Mesh(holeGeometry, material);
    holeMesh.position.set(pos.x, -2.5, pos.z);
    holeMesh.rotation.x = Math.PI / 2;
    group.add(holeMesh);
  });
  
  return group;
}

/**
 * Generate assembly instructions for CR2032 holder
 */
export function generateCR2032Instructions(
  settings: CR2032HolderSettings = defaultCR2032Settings
): string {
  const voltage = settings.numBatteries * 3; // Each CR2032 = 3V
  const capacity = 220; // mAh typical for CR2032
  
  return `
# CR2032 Coin Cell Battery Holder - Assembly Guide

## Specifications
- Battery Type: CR2032 Lithium Coin Cell
- Quantity: ${settings.numBatteries}× cells in series
- Total Voltage: ${voltage}V
- Capacity: ~${capacity}mAh per cell
- Holder Style: ${settings.holderStyle}

## Battery Installation
1. **Polarity Check**: CR2032 batteries have + on top, - on bottom
2. **Series Connection**: 
   ${settings.numBatteries > 1 ? `- Cell 1: + terminal connects to Cell 2 - terminal
   - Cell 2: + terminal connects to output
   - Cell 1: - terminal connects to ground` : '- Single cell: + to output, - to ground'}
3. **Insertion**: 
   ${settings.holderStyle === 'snap' ? '- Press battery into holder until snap clips engage' : 
     settings.holderStyle === 'clip' ? '- Slide battery under clip arms' :
     '- Insert battery into ring, ensure contact with spring'}

## Wiring
- **Red Wire (Positive)**: Connect to top contact spring
- **Black Wire (Ground)**: Connect to bottom contact plate
- **Wire Gauge**: 22-24 AWG recommended
- **Wire Exit**: ${settings.wireExitAngle}° angle for strain relief

${settings.includeSwitch ? `
## Integrated Switch
- **Type**: ${settings.switchType} switch
- **Position**: ${settings.switchType === 'slide' ? 'Slide to ON position to complete circuit' : 'Press button to activate'}
- **Function**: Breaks positive (+) connection when OFF
` : ''}

## Mounting
${settings.mountingStyle === 'base_integrated' ? 
  '- Holder integrates directly into neon stand base' :
  settings.mountingStyle === 'standalone' ?
  `- Use M3 screws through mounting holes (${settings.mountingHoleSpacing}mm spacing)
- Secure to base or enclosure` :
  '- Use double-sided adhesive tape on bottom surface'}

## Power Calculations
- **LED Current Draw**: ~20mA per meter @ 5V (typical)
- **Battery Life**: 
  - 1m LED strip: ~11 hours
  - 2m LED strip: ~5.5 hours
  - 3m LED strip: ~3.7 hours

## Safety Notes
⚠️ **Do NOT**:
- Mix old and new batteries
- Install batteries backwards (reverse polarity)
- Short circuit terminals
- Expose to extreme heat (>60°C)
- Attempt to recharge (CR2032 are non-rechargeable)

✓ **DO**:
- Replace all batteries at once
- Store spare batteries in cool, dry place
- Dispose of dead batteries properly
- Test voltage with multimeter before installation

## Advantages vs AA Batteries
✓ Compact size (50% smaller)
✓ Lightweight (80% lighter)
✓ Longer shelf life (10 years)
✓ Better for small/portable designs
✗ Lower capacity (shorter runtime)
✗ Higher cost per mAh
`;
}

/**
 * Generate BOM for CR2032 holder
 */
export function generateCR2032BOM(
  settings: CR2032HolderSettings = defaultCR2032Settings
): string {
  return `
# CR2032 Battery Holder - Bill of Materials

## 3D Printed Parts
- [ ] CR2032 Holder (${settings.holderStyle} style) - ${settings.numBatteries}× cells
- [ ] Wire Channel Cover (optional)
${settings.includeSwitch ? `- [ ] Switch Housing (${settings.switchType} type)` : ''}

## Electronic Components
- [ ] CR2032 Lithium Batteries (${settings.numBatteries}×) - $${(settings.numBatteries * 0.50).toFixed(2)}
- [ ] Contact Springs (${settings.numBatteries * 2}×) - $${(settings.numBatteries * 0.20).toFixed(2)}
${settings.includeSwitch ? `- [ ] ${settings.switchType === 'slide' ? 'Slide Switch SS12D00' : 'Tactile Button Switch'} (1×) - $0.50` : ''}
- [ ] 22 AWG Wire (red + black) - $1.00

## Hardware
${settings.mountingStyle === 'standalone' ? `- [ ] M3×6mm Screws (2×) - $0.50` : ''}

## Tools Required
- Soldering iron
- Wire strippers
- Multimeter

## Estimated Costs
- 3D Printed Parts: $0.50
- Batteries: $${(settings.numBatteries * 0.50).toFixed(2)}
- Components: $${settings.includeSwitch ? '1.70' : '1.20'}
- Hardware: $${settings.mountingStyle === 'standalone' ? '0.50' : '0.00'}
**Total: ~$${(0.50 + settings.numBatteries * 0.50 + (settings.includeSwitch ? 1.70 : 1.20) + (settings.mountingStyle === 'standalone' ? 0.50 : 0)).toFixed(2)}**

## Comparison: CR2032 vs 4×AA
| Feature | CR2032 (${settings.numBatteries}×) | 4×AA |
|---------|------------|------|
| Voltage | ${settings.numBatteries * 3}V | 6V |
| Capacity | ~${220 * settings.numBatteries}mAh | ~2500mAh |
| Size | 20×${settings.batteryThickness * settings.numBatteries}mm | 50×14mm |
| Weight | ~${3 * settings.numBatteries}g | ~96g |
| Cost | $${(settings.numBatteries * 0.50).toFixed(2)} | $2.00 |
| Best For | Small/portable | Long runtime |
`;
}

export { CR2032HolderSettings, defaultCR2032Settings };
