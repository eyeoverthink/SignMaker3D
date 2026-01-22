import * as THREE from 'three';

/**
 * Microcontroller Housing Generator for WS2812B LED Control
 * Supports: XIAO SAMD21, Arduino Nano, ESP32
 * Based on Modular RGB LED Sign reference project
 */

interface MicrocontrollerHousingSettings {
  // Controller specifications
  controllerType: 'xiao_samd21' | 'arduino_nano' | 'esp32';
  
  // PCB dimensions (controller-specific)
  pcbWidth: number;
  pcbLength: number;
  pcbThickness: number;
  
  // Housing design
  housingWidth: number;
  housingLength: number;
  housingHeight: number;
  wallThickness: number;
  
  // Encoder integration
  includeEncoder: boolean;
  encoderType: 'ky040' | 'none';
  encoderDiameter: number;
  encoderMountHeight: number;
  
  // Component cutouts
  usbCutoutWidth: number;
  usbCutoutHeight: number;
  usbPosition: 'side' | 'top' | 'back';
  
  // Wire management
  ledDataWireChannel: boolean;
  powerWireChannel: boolean;
  wireChannelWidth: number;
  wireChannelDepth: number;
  
  // Mounting
  mountingStyle: 'base_integrated' | 'standalone' | 'magnetic';
  screwHoleDiameter: number;
  screwHoleSpacing: number;
  
  // Component holders
  include220OhmResistor: boolean;
  resistorHolderDiameter: number;
}

// Controller-specific presets
const XIAO_SAMD21_SPECS = {
  pcbWidth: 21,
  pcbLength: 17.5,
  pcbThickness: 1.6,
  usbCutoutWidth: 9,
  usbCutoutHeight: 4,
  pinSpacing: 2.54,
  numPins: 14,
};

const ARDUINO_NANO_SPECS = {
  pcbWidth: 18,
  pcbLength: 45,
  pcbThickness: 1.6,
  usbCutoutWidth: 8,
  usbCutoutHeight: 3.5,
  pinSpacing: 2.54,
  numPins: 30,
};

const ESP32_SPECS = {
  pcbWidth: 25.4,
  pcbLength: 48,
  pcbThickness: 1.6,
  usbCutoutWidth: 9,
  usbCutoutHeight: 4,
  pinSpacing: 2.54,
  numPins: 38,
};

const defaultMicrocontrollerSettings: MicrocontrollerHousingSettings = {
  controllerType: 'xiao_samd21',
  
  pcbWidth: XIAO_SAMD21_SPECS.pcbWidth,
  pcbLength: XIAO_SAMD21_SPECS.pcbLength,
  pcbThickness: XIAO_SAMD21_SPECS.pcbThickness,
  
  housingWidth: 50,
  housingLength: 60,
  housingHeight: 25,
  wallThickness: 2,
  
  includeEncoder: true,
  encoderType: 'ky040',
  encoderDiameter: 7,
  encoderMountHeight: 15,
  
  usbCutoutWidth: XIAO_SAMD21_SPECS.usbCutoutWidth,
  usbCutoutHeight: XIAO_SAMD21_SPECS.usbCutoutHeight,
  usbPosition: 'side',
  
  ledDataWireChannel: true,
  powerWireChannel: true,
  wireChannelWidth: 6,
  wireChannelDepth: 3,
  
  mountingStyle: 'base_integrated',
  screwHoleDiameter: 3,
  screwHoleSpacing: 40,
  
  include220OhmResistor: true,
  resistorHolderDiameter: 3,
};

/**
 * Generate bottom housing with PCB mounts and wire channels
 */
export function generateMicrocontrollerHousingBottom(
  settings: MicrocontrollerHousingSettings = defaultMicrocontrollerSettings
): THREE.Group {
  const group = new THREE.Group();
  
  // Main housing base
  const baseGeometry = new THREE.BoxGeometry(
    settings.housingWidth,
    settings.housingHeight / 2,
    settings.housingLength
  );
  const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x2d3748 });
  const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
  group.add(baseMesh);
  
  // Hollow out interior
  const innerGeometry = new THREE.BoxGeometry(
    settings.housingWidth - settings.wallThickness * 2,
    settings.housingHeight / 2 + 1,
    settings.housingLength - settings.wallThickness * 2
  );
  const innerMesh = new THREE.Mesh(innerGeometry, baseMaterial);
  innerMesh.position.y = settings.wallThickness;
  // Note: Use CSG subtraction in actual implementation
  
  // PCB mounting posts (4 corners)
  const postRadius = 2;
  const postHeight = 5;
  const postGeometry = new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 16);
  const postMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
  
  const pcbCorners = [
    { x: -settings.pcbWidth / 2 + 3, z: -settings.pcbLength / 2 + 3 },
    { x: settings.pcbWidth / 2 - 3, z: -settings.pcbLength / 2 + 3 },
    { x: -settings.pcbWidth / 2 + 3, z: settings.pcbLength / 2 - 3 },
    { x: settings.pcbWidth / 2 - 3, z: settings.pcbLength / 2 - 3 },
  ];
  
  pcbCorners.forEach(corner => {
    const post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.set(
      corner.x,
      -settings.housingHeight / 4 + postHeight / 2,
      corner.z
    );
    group.add(post);
  });
  
  // 220Ω Resistor holder (if included)
  if (settings.include220OhmResistor) {
    const resistorHolderGeometry = new THREE.CylinderGeometry(
      settings.resistorHolderDiameter / 2,
      settings.resistorHolderDiameter / 2,
      10,
      16
    );
    const resistorHolder = new THREE.Mesh(resistorHolderGeometry, postMaterial);
    resistorHolder.position.set(
      settings.pcbWidth / 2 + 5,
      -settings.housingHeight / 4 + 5,
      0
    );
    resistorHolder.rotation.z = Math.PI / 2;
    group.add(resistorHolder);
  }
  
  // LED data wire channel
  if (settings.ledDataWireChannel) {
    const channelGeometry = new THREE.BoxGeometry(
      settings.wireChannelWidth,
      settings.wireChannelDepth,
      settings.wallThickness + 2
    );
    const channelMesh = new THREE.Mesh(channelGeometry, baseMaterial);
    channelMesh.position.set(
      settings.housingWidth / 2,
      -settings.housingHeight / 4,
      settings.housingLength / 4
    );
    // Note: Use CSG subtraction
  }
  
  // Power wire channel
  if (settings.powerWireChannel) {
    const channelGeometry = new THREE.BoxGeometry(
      settings.wireChannelWidth,
      settings.wireChannelDepth,
      settings.wallThickness + 2
    );
    const channelMesh = new THREE.Mesh(channelGeometry, baseMaterial);
    channelMesh.position.set(
      settings.housingWidth / 2,
      -settings.housingHeight / 4,
      -settings.housingLength / 4
    );
    // Note: Use CSG subtraction
  }
  
  // Mounting holes (if standalone)
  if (settings.mountingStyle === 'standalone') {
    const holePositions = [
      { x: -settings.screwHoleSpacing / 2, z: 0 },
      { x: settings.screwHoleSpacing / 2, z: 0 },
    ];
    
    holePositions.forEach(pos => {
      const holeGeometry = new THREE.CylinderGeometry(
        settings.screwHoleDiameter / 2,
        settings.screwHoleDiameter / 2,
        settings.wallThickness + 2,
        16
      );
      const holeMesh = new THREE.Mesh(holeGeometry, baseMaterial);
      holeMesh.position.set(pos.x, -settings.housingHeight / 4, pos.z);
      // Note: Use CSG subtraction
    });
  }
  
  return group;
}

/**
 * Generate top housing lid with encoder mount and USB access
 */
export function generateMicrocontrollerHousingTop(
  settings: MicrocontrollerHousingSettings = defaultMicrocontrollerSettings
): THREE.Group {
  const group = new THREE.Group();
  
  // Main lid
  const lidGeometry = new THREE.BoxGeometry(
    settings.housingWidth,
    settings.housingHeight / 2,
    settings.housingLength
  );
  const lidMaterial = new THREE.MeshStandardMaterial({ color: 0x4a5568 });
  const lidMesh = new THREE.Mesh(lidGeometry, lidMaterial);
  group.add(lidMesh);
  
  // Hollow out interior (fits over bottom housing)
  const innerGeometry = new THREE.BoxGeometry(
    settings.housingWidth - settings.wallThickness,
    settings.housingHeight / 2 - settings.wallThickness,
    settings.housingLength - settings.wallThickness
  );
  const innerMesh = new THREE.Mesh(innerGeometry, lidMaterial);
  innerMesh.position.y = -settings.wallThickness;
  // Note: Use CSG subtraction
  
  // Encoder mount hole (top center)
  if (settings.includeEncoder && settings.encoderType === 'ky040') {
    const encoderHoleGeometry = new THREE.CylinderGeometry(
      settings.encoderDiameter / 2,
      settings.encoderDiameter / 2,
      settings.wallThickness + 2,
      32
    );
    const encoderHoleMesh = new THREE.Mesh(encoderHoleGeometry, lidMaterial);
    encoderHoleMesh.position.set(0, settings.housingHeight / 4, 0);
    // Note: Use CSG subtraction
    
    // Encoder mounting posts (inside lid)
    const encoderPostGeometry = new THREE.CylinderGeometry(1.5, 1.5, 8, 16);
    const encoderPostMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
    
    const encoderPostPositions = [
      { x: -6, z: -6 },
      { x: 6, z: -6 },
      { x: -6, z: 6 },
      { x: 6, z: 6 },
    ];
    
    encoderPostPositions.forEach(pos => {
      const post = new THREE.Mesh(encoderPostGeometry, encoderPostMaterial);
      post.position.set(pos.x, settings.housingHeight / 4 - 4, pos.z);
      group.add(post);
    });
  }
  
  // USB cutout
  const usbGeometry = new THREE.BoxGeometry(
    settings.usbCutoutWidth,
    settings.usbCutoutHeight,
    settings.wallThickness + 2
  );
  const usbMesh = new THREE.Mesh(usbGeometry, lidMaterial);
  
  if (settings.usbPosition === 'side') {
    usbMesh.position.set(
      -settings.housingWidth / 2,
      0,
      -settings.housingLength / 4
    );
  } else if (settings.usbPosition === 'back') {
    usbMesh.position.set(
      0,
      0,
      -settings.housingLength / 2
    );
  } else {
    usbMesh.position.set(
      0,
      settings.housingHeight / 4,
      -settings.housingLength / 4
    );
  }
  // Note: Use CSG subtraction
  
  // Ventilation slots (optional, for heat dissipation)
  const slotWidth = 1;
  const slotLength = 15;
  const numSlots = 3;
  
  for (let i = 0; i < numSlots; i++) {
    const slotGeometry = new THREE.BoxGeometry(
      slotWidth,
      settings.wallThickness + 2,
      slotLength
    );
    const slotMesh = new THREE.Mesh(slotGeometry, lidMaterial);
    slotMesh.position.set(
      -settings.housingWidth / 4 + i * 8,
      settings.housingHeight / 4,
      settings.housingLength / 4
    );
    // Note: Use CSG subtraction
  }
  
  return group;
}

/**
 * Generate wiring diagram for WS2812B system
 */
export function generateWS2812BWiringDiagram(
  controllerType: 'xiao_samd21' | 'arduino_nano' | 'esp32' = 'xiao_samd21'
): string {
  const specs = controllerType === 'xiao_samd21' ? XIAO_SAMD21_SPECS :
                controllerType === 'arduino_nano' ? ARDUINO_NANO_SPECS :
                ESP32_SPECS;
  
  return `
# WS2812B Addressable LED Wiring Diagram

## Controller: ${controllerType.toUpperCase().replace('_', ' ')}

### Components Required:
- ${controllerType.toUpperCase().replace('_', ' ')} Microcontroller (1×)
- WS2812B LED Strip (60 LEDs/meter)
- KY-040 Rotary Encoder with Pushbutton (1×)
- 220Ω Resistor (1×) - Data line protection
- 5V Power Supply (USB or external)
- 22 AWG Wire (red, black, blue)

### Pin Connections:

#### WS2812B LED Strip → ${controllerType.toUpperCase()}
\`\`\`
LED Strip DI (Data In) → 220Ω Resistor → Pin 3 (DATA)
LED Strip 5V          → 5V
LED Strip GND         → GND
\`\`\`

**CRITICAL**: Always connect LED data line through 220Ω resistor!

#### KY-040 Encoder → ${controllerType.toUpperCase()}
\`\`\`
Encoder CLK → Pin 8
Encoder DT  → Pin 9
Encoder SW  → Pin 10 (with internal pullup)
Encoder +   → 3V3
Encoder GND → GND
\`\`\`

#### Power Distribution:
\`\`\`
USB 5V → ${controllerType.toUpperCase()} 5V Pin → LED Strip 5V
GND    → ${controllerType.toUpperCase()} GND    → LED Strip GND → Encoder GND
\`\`\`

### Wiring Notes:
1. **Data Line Protection**: 220Ω resistor prevents voltage spikes
2. **Power Considerations**: 
   - Each WS2812B LED draws ~60mA at full white
   - 1 meter (60 LEDs) = ~3.6A max
   - USB power (500mA) suitable for <8 LEDs at full brightness
   - Use external 5V power supply for longer strips
3. **Ground Loop**: All grounds must be connected together
4. **Wire Gauge**: 22 AWG minimum for data, 18 AWG for power (>1m strips)

### Testing Procedure:
1. Connect encoder first, test rotation and button
2. Connect LED strip WITHOUT power
3. Upload FastLED code to controller
4. Apply power and test single LED
5. Gradually increase brightness to test power supply

### Troubleshooting:
- **LEDs flicker**: Insufficient power or loose ground
- **Wrong colors**: Check GRB vs RGB color order in code
- **No response**: Verify 220Ω resistor and data pin connection
- **Encoder not working**: Check pullup resistor on SW pin
`;
}

/**
 * Generate assembly instructions
 */
export function generateMicrocontrollerAssemblyInstructions(
  settings: MicrocontrollerHousingSettings = defaultMicrocontrollerSettings
): string {
  return `
# Microcontroller Housing Assembly Instructions

## Controller: ${settings.controllerType.toUpperCase().replace('_', ' ')}

### Parts Checklist:
- [ ] 3D Printed Housing Bottom
- [ ] 3D Printed Housing Top
- [ ] ${settings.controllerType.toUpperCase().replace('_', ' ')} Board
- [ ] KY-040 Rotary Encoder (if included)
- [ ] 220Ω Resistor
- [ ] M2.5 or M3 screws for PCB mounting
- [ ] Jumper wires (22 AWG)

### Assembly Steps:

#### 1. Prepare Housing Bottom
- Remove any support material from 3D print
- Test fit PCB on mounting posts
- Clean wire channel openings

#### 2. Install 220Ω Resistor
${settings.include220OhmResistor ? 
  `- Insert resistor into holder on side of housing
- Solder one lead to Pin 3 (DATA) on controller
- Other lead will connect to LED strip DI` :
  '- Solder 220Ω resistor inline with data wire'}

#### 3. Mount Controller PCB
- Place ${settings.controllerType.toUpperCase()} on mounting posts
- Secure with M2.5 screws (don't overtighten!)
- Ensure USB port aligns with cutout

#### 4. Wire Encoder (if included)
${settings.includeEncoder ?
  `- Solder wires to encoder pins:
  - CLK → Pin 8
  - DT → Pin 9  
  - SW → Pin 10
  - + → 3V3
  - GND → GND
- Route wires through channels
- Test encoder rotation before closing housing` :
  '- Encoder not included in this configuration'}

#### 5. Wire LED Strip Connection
- Solder red wire to 5V pad
- Solder black wire to GND pad
- Solder blue wire to resistor (data line)
- Route wires through side channel
- Use strain relief (zip tie or hot glue)

#### 6. Install Encoder in Top Housing
${settings.includeEncoder ?
  `- Insert encoder shaft through top hole
- Secure with encoder nut (hand-tight)
- Attach encoder PCB to mounting posts inside lid
- Verify encoder rotates freely` :
  '- No encoder installation needed'}

#### 7. Close Housing
- Align top and bottom housings
- Press fit or use screws at corners
- Test all connections before sealing
- Apply hot glue to wire exits for strain relief

#### 8. Upload Code
- Connect USB cable to ${settings.controllerType.toUpperCase()}
- Open Arduino IDE
- Select board: "${settings.controllerType === 'xiao_samd21' ? 'Seeeduino XIAO' : settings.controllerType === 'arduino_nano' ? 'Arduino Nano' : 'ESP32 Dev Module'}"
- Upload FastLED code (see generated .ino file)
- Open Serial Monitor to verify operation

### Testing:
1. **Encoder Test**: Rotate encoder, should see brightness change
2. **Button Test**: Short press = ON/OFF, Long press = Mode change
3. **LED Test**: LEDs should light up in rainbow pattern
4. **Animation Test**: Cycle through all 8 modes

### Mounting Options:
${settings.mountingStyle === 'base_integrated' ?
  '- Housing integrates directly into neon stand base' :
  settings.mountingStyle === 'standalone' ?
  `- Use M3 screws through mounting holes (${settings.screwHoleSpacing}mm spacing)
- Secure to base or wall` :
  '- Attach magnets to bottom for magnetic mounting'}

### Safety Notes:
⚠️ **Important**:
- Never connect/disconnect LEDs while powered
- Use proper power supply for strip length
- Ensure all grounds are connected
- Don't exceed 5V on data line
- Keep housing ventilated (don't seal completely)
`;
}

/**
 * Generate BOM for microcontroller system
 */
export function generateMicrocontrollerBOM(
  settings: MicrocontrollerHousingSettings = defaultMicrocontrollerSettings
): string {
  const controllerCost = settings.controllerType === 'xiao_samd21' ? 5 :
                         settings.controllerType === 'arduino_nano' ? 3 :
                         8;
  
  return `
# Microcontroller System - Bill of Materials

## 3D Printed Parts
- [ ] Microcontroller Housing Bottom (1×) - PLA/PETG, 2mm walls
- [ ] Microcontroller Housing Top (1×) - PLA/PETG, 2mm walls

## Electronic Components
- [ ] ${settings.controllerType.toUpperCase().replace('_', ' ')} (1×) - $${controllerCost}.00
- [ ] WS2812B LED Strip 60/m (per meter) - $8-15
${settings.includeEncoder ? '- [ ] KY-040 Rotary Encoder with Pushbutton (1×) - $2.00' : ''}
- [ ] 220Ω Resistor 1/4W (1×) - $0.10
- [ ] 22 AWG Hookup Wire (assorted colors) - $2.00
- [ ] USB Cable (power + programming) - $1.50

## Hardware
${settings.mountingStyle === 'standalone' ? `- [ ] M3×6mm Screws (2×) - $0.50` : ''}
- [ ] M2.5×6mm Screws (4×) - PCB mounting - $0.40
${settings.includeEncoder ? '- [ ] Encoder Knob (optional) - $1.00' : ''}

## Software (Free)
- [ ] Arduino IDE - https://arduino.cc
- [ ] FastLED Library - https://github.com/FastLED/FastLED
- [ ] Encoder Library - https://github.com/PaulStoffregen/Encoder

## Estimated Costs
- 3D Printed Parts: $1.00
- Microcontroller: $${controllerCost}.00
- LED Strip (1m): $12.00
${settings.includeEncoder ? '- Encoder: $2.00' : '- Encoder: $0.00'}
- Components: $4.00
- Hardware: $${settings.mountingStyle === 'standalone' ? '0.90' : '0.40'}
**Total: ~$${(1 + controllerCost + 12 + (settings.includeEncoder ? 2 : 0) + 4 + (settings.mountingStyle === 'standalone' ? 0.90 : 0.40)).toFixed(2)}**

## Comparison: 555 Timer vs WS2812B System

| Feature | 555 Timer | WS2812B (This System) |
|---------|-----------|----------------------|
| Colors | Single | 16.7 million RGB |
| Control | Potentiometer | Encoder (brightness + color) |
| Animations | None | 8 modes (rainbow, glitter, etc.) |
| Per-LED Control | No | Yes (individually addressable) |
| Programming | None | Arduino IDE |
| Cost | ~$16-32 | ~$${(1 + controllerCost + 12 + (settings.includeEncoder ? 2 : 0) + 4 + (settings.mountingStyle === 'standalone' ? 0.90 : 0.40)).toFixed(2)} |
| Complexity | Simple (analog) | Moderate (digital) |
| Best For | Basic signs | RGB animations, effects |

## Power Requirements by Strip Length:
- **10 LEDs** (~17cm): 600mA max → USB powered ✓
- **30 LEDs** (~50cm): 1.8A max → External 5V 2A
- **60 LEDs** (1 meter): 3.6A max → External 5V 4A
- **120 LEDs** (2 meters): 7.2A max → External 5V 10A

**Note**: Above values are at full white brightness. Typical usage is 30-50% of max.
`;
}

export { 
  MicrocontrollerHousingSettings, 
  defaultMicrocontrollerSettings,
  XIAO_SAMD21_SPECS,
  ARDUINO_NANO_SPECS,
  ESP32_SPECS
};
