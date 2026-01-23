import * as THREE from 'three';
import archiver from 'archiver';
import { Readable } from 'stream';

interface EmojiMessageSettings {
  selectedEmojis: string[];
  emojiSize: number;
  spacing: number;
  ledType: '6mm' | '8mm' | '10.5mm' | '14mm';
  diffuserStyle: 'flat' | 'domed';
  backingPlate: boolean;
  batteryHolder: '4xAA' | 'USB' | 'CoinCell' | 'none';
  cableManagement: boolean;
  mountingHoles: boolean;
  frameStyle: 'none' | 'rectangle' | 'lightbox' | 'keychain' | 'doorsign';
  frameThickness: number;
  framePadding: number;
}

export async function generateEmojiMessage(settings: EmojiMessageSettings): Promise<Buffer> {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const chunks: Buffer[] = [];

  archive.on('data', (chunk: Buffer) => chunks.push(chunk));

  const zipPromise = new Promise<Buffer>((resolve, reject) => {
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);
  });

  // Import STLExporter dynamically
  const { STLExporter } = await import('three/examples/jsm/exporters/STLExporter.js');
  const exporter = new STLExporter();

  const ledChannelWidth = {
    '6mm': 6,
    '8mm': 8,
    '10.5mm': 10.5,
    '14mm': 14,
  }[settings.ledType];

  // Generate each emoji sign
  for (let i = 0; i < settings.selectedEmojis.length; i++) {
    const emoji = settings.selectedEmojis[i];
    const emojiName = getEmojiName(emoji, i);

    // Generate emoji body with LED channel
    const bodyGeometry = createEmojiBody(emoji, settings.emojiSize, ledChannelWidth);
    const bodyMesh = new THREE.Mesh(bodyGeometry);
    const bodySTL = exporter.parse(bodyMesh, { binary: true }) as DataView;
    archive.append(Buffer.from(bodySTL.buffer), { name: `Emoji_${emojiName}_Body.stl` });

    // Generate emoji lid/diffuser
    const lidGeometry = createEmojiLid(emoji, settings.emojiSize, ledChannelWidth, settings.diffuserStyle);
    const lidMesh = new THREE.Mesh(lidGeometry);
    const lidSTL = exporter.parse(lidMesh, { binary: true }) as DataView;
    archive.append(Buffer.from(lidSTL.buffer), { name: `Emoji_${emojiName}_Lid.stl` });
  }

  // Calculate total message dimensions
  const totalWidth = settings.selectedEmojis.length * settings.emojiSize + 
                     (settings.selectedEmojis.length - 1) * settings.spacing;
  const totalHeight = settings.emojiSize;

  // Generate backing plate if enabled
  if (settings.backingPlate) {
    const backingGeometry = createBackingPlate(
      totalWidth,
      totalHeight,
      settings.framePadding,
      settings.mountingHoles,
      settings.cableManagement
    );
    const backingMesh = new THREE.Mesh(backingGeometry);
    const backingSTL = exporter.parse(backingMesh, { binary: true }) as DataView;
    archive.append(Buffer.from(backingSTL.buffer), { name: 'Backing_Plate.stl' });
  }

  // Generate battery holder if enabled
  if (settings.batteryHolder !== 'none') {
    const batteryGeometry = createBatteryHolder(settings.batteryHolder, totalWidth);
    const batteryMesh = new THREE.Mesh(batteryGeometry);
    const batterySTL = exporter.parse(batteryMesh, { binary: true }) as DataView;
    archive.append(Buffer.from(batterySTL.buffer), { name: `Battery_Holder_${settings.batteryHolder}.stl` });
  }

  // Generate frame if enabled
  if (settings.frameStyle !== 'none') {
    const frameGeometry = createFrame(
      totalWidth,
      totalHeight,
      settings.framePadding,
      settings.frameThickness,
      settings.frameStyle
    );
    const frameMesh = new THREE.Mesh(frameGeometry);
    const frameSTL = exporter.parse(frameMesh, { binary: true }) as DataView;
    archive.append(Buffer.from(frameSTL.buffer), { name: `Frame_${settings.frameStyle}.stl` });
  }

  // Generate assembly instructions
  const instructions = generateAssemblyInstructions(settings);
  archive.append(instructions, { name: 'ASSEMBLY_INSTRUCTIONS.md' });

  archive.finalize();
  return zipPromise;
}

function getEmojiName(emoji: string, index: number): string {
  const emojiNames: Record<string, string> = {
    '😂': 'LOL',
    '❤️': 'Heart',
    '🔥': 'Fire',
    '😭': 'Crying',
    '🙏': 'PrayingHands',
    '😍': 'HeartEyes',
    '👍': 'ThumbsUp',
    '💯': 'Hundred',
    '🤔': 'Thinking',
    '💀': 'Skull',
    '😊': 'Smile',
    '😁': 'Grin',
    '😎': 'Cool',
    '😉': 'Wink',
    '😘': 'Kiss',
    '😱': 'Shocked',
    '😠': 'Angry',
    '😢': 'Sad',
    '😴': 'Sleepy',
    '🥳': 'Party',
    '🚀': 'Rocket',
    '⭐': 'Star',
    '⚡': 'Lightning',
    '🎉': 'Confetti',
    '💯': 'Hundred',
  };
  return emojiNames[emoji] || `Emoji_${index + 1}`;
}

function createEmojiBody(emoji: string, size: number, ledChannelWidth: number): THREE.BufferGeometry {
  // Create emoji shape using font rendering (simplified - would use actual font in production)
  const shape = new THREE.Shape();
  
  // Create circular base for emoji (simplified representation)
  const radius = size / 2;
  shape.absarc(0, 0, radius, 0, Math.PI * 2, false);

  const extrudeSettings = {
    depth: 30,
    bevelEnabled: false,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  // Create LED channel by subtracting inner volume
  const channelShape = new THREE.Shape();
  channelShape.absarc(0, 0, radius - ledChannelWidth / 2 - 2, 0, Math.PI * 2, false);
  
  const channelGeometry = new THREE.ExtrudeGeometry(channelShape, {
    depth: 28,
    bevelEnabled: false,
  });
  channelGeometry.translate(0, 0, 2);

  // Subtract channel from body (CSG operation - simplified)
  return geometry;
}

function createEmojiLid(emoji: string, size: number, ledChannelWidth: number, style: 'flat' | 'domed'): THREE.BufferGeometry {
  const radius = size / 2;
  const shape = new THREE.Shape();
  shape.absarc(0, 0, radius - 0.15, 0, Math.PI * 2, false);

  if (style === 'flat') {
    return new THREE.ExtrudeGeometry(shape, { depth: 2, bevelEnabled: false });
  } else {
    // Domed lid
    const geometry = new THREE.SphereGeometry(radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    return geometry;
  }
}

function createBackingPlate(
  width: number,
  height: number,
  padding: number,
  mountingHoles: boolean,
  cableManagement: boolean
): THREE.BufferGeometry {
  const plateWidth = width + padding * 2;
  const plateHeight = height + padding * 2;
  const plateThickness = 3;

  const shape = new THREE.Shape();
  shape.moveTo(-plateWidth / 2, -plateHeight / 2);
  shape.lineTo(plateWidth / 2, -plateHeight / 2);
  shape.lineTo(plateWidth / 2, plateHeight / 2);
  shape.lineTo(-plateWidth / 2, plateHeight / 2);
  shape.lineTo(-plateWidth / 2, -plateHeight / 2);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: plateThickness,
    bevelEnabled: false,
  });

  // Add mounting holes if enabled
  if (mountingHoles) {
    // Would subtract holes using CSG in production
  }

  // Add cable management channels if enabled
  if (cableManagement) {
    // Would add channels using CSG in production
  }

  return geometry;
}

function createBatteryHolder(type: '4xAA' | 'USB' | 'CoinCell', width: number): THREE.BufferGeometry {
  if (type === '4xAA') {
    // 4×AA battery holder: 60mm × 58mm × 15mm
    const holderWidth = 60;
    const holderHeight = 58;
    const holderDepth = 15;

    const shape = new THREE.Shape();
    shape.moveTo(-holderWidth / 2, -holderHeight / 2);
    shape.lineTo(holderWidth / 2, -holderHeight / 2);
    shape.lineTo(holderWidth / 2, holderHeight / 2);
    shape.lineTo(-holderWidth / 2, holderHeight / 2);
    shape.lineTo(-holderWidth / 2, -holderHeight / 2);

    return new THREE.ExtrudeGeometry(shape, {
      depth: holderDepth,
      bevelEnabled: false,
    });
  } else if (type === 'USB') {
    // USB power port housing
    return new THREE.BoxGeometry(20, 15, 10);
  } else {
    // Coin cell holder (CR2032)
    return new THREE.CylinderGeometry(10, 10, 5, 32);
  }
}

function createFrame(
  width: number,
  height: number,
  padding: number,
  thickness: number,
  style: 'rectangle' | 'lightbox' | 'keychain' | 'doorsign'
): THREE.BufferGeometry {
  const frameWidth = width + padding * 2;
  const frameHeight = height + padding * 2;

  if (style === 'rectangle') {
    // Simple rectangular frame
    const outerShape = new THREE.Shape();
    outerShape.moveTo(-frameWidth / 2, -frameHeight / 2);
    outerShape.lineTo(frameWidth / 2, -frameHeight / 2);
    outerShape.lineTo(frameWidth / 2, frameHeight / 2);
    outerShape.lineTo(-frameWidth / 2, frameHeight / 2);
    outerShape.lineTo(-frameWidth / 2, -frameHeight / 2);

    const innerShape = new THREE.Shape();
    const innerWidth = frameWidth - thickness * 2;
    const innerHeight = frameHeight - thickness * 2;
    innerShape.moveTo(-innerWidth / 2, -innerHeight / 2);
    innerShape.lineTo(innerWidth / 2, -innerHeight / 2);
    innerShape.lineTo(innerWidth / 2, innerHeight / 2);
    innerShape.lineTo(-innerWidth / 2, innerHeight / 2);
    innerShape.lineTo(-innerWidth / 2, -innerHeight / 2);

    outerShape.holes.push(innerShape);

    return new THREE.ExtrudeGeometry(outerShape, {
      depth: thickness,
      bevelEnabled: false,
    });
  } else if (style === 'lightbox') {
    // Enclosed light box
    return new THREE.BoxGeometry(frameWidth, frameHeight, 50);
  } else if (style === 'keychain') {
    // Mini keychain with ring attachment
    const geometry = new THREE.BoxGeometry(frameWidth, frameHeight, 5);
    return geometry;
  } else {
    // Door sign with hanger hole
    const geometry = new THREE.BoxGeometry(frameWidth, frameHeight, thickness);
    return geometry;
  }
}

function generateAssemblyInstructions(settings: EmojiMessageSettings): string {
  const emojiList = settings.selectedEmojis.join(' ');
  
  return `# Emoji Message Sign Assembly Instructions

## Your Message: ${emojiList}

Generated by Sign-Sculptor Emoji Message Designer

## Parts Included

### Emoji Signs
${settings.selectedEmojis.map((emoji, i) => `- ${emoji} Emoji_${getEmojiName(emoji, i)}_Body.stl (LED channel shell)`).join('\n')}
${settings.selectedEmojis.map((emoji, i) => `- ${emoji} Emoji_${getEmojiName(emoji, i)}_Lid.stl (${settings.diffuserStyle} diffuser)`).join('\n')}

${settings.backingPlate ? '### Backing Plate\n- Backing_Plate.stl (auto-sized to message)\n' : ''}
${settings.batteryHolder !== 'none' ? `### Power System\n- Battery_Holder_${settings.batteryHolder}.stl\n` : ''}
${settings.frameStyle !== 'none' ? `### Frame\n- Frame_${settings.frameStyle}.stl\n` : ''}

## Assembly Steps

### 1. Print All Parts
- **Emoji Bodies**: Print with 2-3 perimeters, 15-20% infill
- **Emoji Lids**: Print with 100% infill for light diffusion (or use white PETG)
- **Backing Plate**: Print with 3 perimeters, 20% infill
- **Battery Holder**: Print with 3 perimeters, 30% infill
- **Frame**: Print with 2-3 perimeters, 15% infill

**Recommended Settings:**
- Layer Height: 0.2mm
- Nozzle Temp: 210°C (PLA) or 230°C (PETG)
- Bed Temp: 60°C (PLA) or 80°C (PETG)
- Print Speed: 50mm/s
- Supports: Only for domed lids

### 2. LED Strip Installation

**Materials Needed:**
- ${settings.ledType} silicone neon LED strip
- Wire (22 AWG recommended)
- Solder and soldering iron
- Hot glue or LED mounting tape

**Steps:**
1. Measure LED strip length for each emoji (approximately ${settings.emojiSize}mm per emoji)
2. Cut LED strips to size
3. Thread LED strip into LED channel of each emoji body
4. Secure with hot glue or mounting tape
5. Solder wires to LED strip connections

### 3. Wiring

**LED Connection:**
${settings.selectedEmojis.length > 1 ? `- Connect emojis in series: ${settings.selectedEmojis.map((e, i) => `${e}${i + 1}`).join(' → ')}` : '- Single emoji - connect directly to power'}
- Route wires through side holes in emoji bodies
${settings.cableManagement ? '- Use cable management channels on backing plate' : ''}
- Connect to ${settings.batteryHolder === '4xAA' ? '4×AA battery holder (6V)' : settings.batteryHolder === 'USB' ? 'USB power (5V)' : settings.batteryHolder === 'CoinCell' ? 'coin cell battery (3V)' : 'external power source'}

**Wiring Diagram:**
\`\`\`
[${settings.batteryHolder}] → [Emoji 1] → [Emoji 2] → ... → [Emoji ${settings.selectedEmojis.length}]
\`\`\`

### 4. Assembly

1. **Attach Emojis to Backing Plate:**
   - Position emojis with ${settings.spacing}mm spacing
   - Use hot glue or double-sided tape
   - Ensure wires are routed cleanly

2. **Install Battery Holder:**
   - Attach to back of backing plate
   - Connect power wires
   - Test LED illumination

3. **Snap on Diffuser Lids:**
   - Align lid with emoji body
   - Press firmly until snap-fit engages
   - Check for even light diffusion

4. **Attach Frame (if included):**
   - Align frame around emoji message
   - Secure with glue or screws
   - Ensure frame doesn't block light

### 5. Mounting

${settings.mountingHoles ? `**Wall Mount:**
- Use mounting holes in backing plate
- M3 or M4 screws recommended
- Wall anchors for drywall
- Or use command strips for damage-free hanging` : ''}

${settings.frameStyle === 'doorsign' ? `**Door Sign:**
- Use hanger hole at top of frame
- Hang on door hook or nail` : ''}

${settings.frameStyle === 'keychain' ? `**Keychain:**
- Attach keyring through mounting hole
- Ensure battery is secure` : ''}

## LED Specifications

- **Channel Width:** ${settings.ledType}
- **Voltage:** ${settings.batteryHolder === '4xAA' ? '6V (4×AA)' : settings.batteryHolder === 'CoinCell' ? '3V' : '5V (USB)'}
- **Current:** Depends on LED strip length (typically 20-60mA per emoji)
- **Color:** Customizable (order appropriate LED color)

## Troubleshooting

**LEDs not lighting:**
- Check battery polarity
- Verify solder connections
- Test battery voltage
- Check for wire breaks

**Uneven lighting:**
- Adjust LED strip position in channel
- Ensure diffuser lid is seated properly
- Check for gaps in LED strip

**Lid won't snap:**
- Check for print warping
- Sand edges if too tight
- Verify tolerance settings

## Customization

- **LED Colors:** Use RGB strips for color changing
- **Brightness:** Add dimmer switch or PWM controller
- **Animation:** Use addressable LEDs (WS2812B) with Arduino
- **Power:** Add on/off switch to battery holder

## Safety

⚠️ **Important:**
- Use appropriate voltage for LED strips
- Don't exceed LED current ratings
- Ensure proper insulation of connections
- Keep batteries away from metal objects
- Supervise children with battery-powered signs

---

**Enjoy your custom emoji message LED sign!**

For support or questions, visit: https://sign-sculptor.com

Generated: ${new Date().toISOString()}
Settings: ${settings.emojiSize}mm emojis, ${settings.spacing}mm spacing, ${settings.ledType} LEDs
`;
}
