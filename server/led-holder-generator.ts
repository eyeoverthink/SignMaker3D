import { z } from "zod";

export const ledHolderSettingsSchema = z.object({
  ledType: z.enum(["3mm", "5mm", "ws2812b", "ws2812b_strip", "10mm_uv"]),
  holderStyle: z.enum(["clip", "socket", "cradle"]),
  mountType: z.enum(["magnetic", "screw", "adhesive", "clip_on"]),
  wireChannelDiameter: z.number().min(1).max(10).default(3),
  magnetDiameter: z.number().min(3).max(15).default(6),
  magnetDepth: z.number().min(1).max(5).default(2),
  screwHoleDiameter: z.number().min(2).max(6).default(3),
  wallThickness: z.number().min(1).max(5).default(2),
  tiltAngle: z.number().min(0).max(90).default(30),
  quantity: z.number().min(1).max(20).default(1),
});

export type LEDHolderSettings = z.infer<typeof ledHolderSettingsSchema>;

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface Triangle {
  v1: Vector3;
  v2: Vector3;
  v3: Vector3;
  normal: Vector3;
}

function calculateNormal(v1: Vector3, v2: Vector3, v3: Vector3): Vector3 {
  const u = { x: v2.x - v1.x, y: v2.y - v1.y, z: v2.z - v1.z };
  const v = { x: v3.x - v1.x, y: v3.y - v1.y, z: v3.z - v1.z };
  const n = {
    x: u.y * v.z - u.z * v.y,
    y: u.z * v.x - u.x * v.z,
    z: u.x * v.y - u.y * v.x,
  };
  const len = Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z);
  if (len === 0) return { x: 0, y: 0, z: 1 };
  return { x: n.x / len, y: n.y / len, z: n.z / len };
}

function addTriangle(triangles: Triangle[], v1: Vector3, v2: Vector3, v3: Vector3): void {
  triangles.push({ v1, v2, v3, normal: calculateNormal(v1, v2, v3) });
}

function trianglesToBinarySTL(triangles: Triangle[]): Buffer {
  const headerSize = 80;
  const triangleCountSize = 4;
  const triangleSize = 50;
  const bufferSize = headerSize + triangleCountSize + triangles.length * triangleSize;
  const buffer = Buffer.alloc(bufferSize);

  buffer.fill(0, 0, headerSize);
  buffer.writeUInt32LE(triangles.length, headerSize);

  let offset = headerSize + triangleCountSize;
  for (const tri of triangles) {
    buffer.writeFloatLE(tri.normal.x, offset);
    buffer.writeFloatLE(tri.normal.y, offset + 4);
    buffer.writeFloatLE(tri.normal.z, offset + 8);
    buffer.writeFloatLE(tri.v1.x, offset + 12);
    buffer.writeFloatLE(tri.v1.y, offset + 16);
    buffer.writeFloatLE(tri.v1.z, offset + 20);
    buffer.writeFloatLE(tri.v2.x, offset + 24);
    buffer.writeFloatLE(tri.v2.y, offset + 28);
    buffer.writeFloatLE(tri.v2.z, offset + 32);
    buffer.writeFloatLE(tri.v3.x, offset + 36);
    buffer.writeFloatLE(tri.v3.y, offset + 40);
    buffer.writeFloatLE(tri.v3.z, offset + 44);
    buffer.writeUInt16LE(0, offset + 48);
    offset += triangleSize;
  }

  return buffer;
}

function rotatePoint(p: Vector3, angleRad: number, axis: 'x' | 'y' | 'z'): Vector3 {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  
  if (axis === 'x') {
    return { x: p.x, y: p.y * cos - p.z * sin, z: p.y * sin + p.z * cos };
  } else if (axis === 'y') {
    return { x: p.x * cos + p.z * sin, y: p.y, z: -p.x * sin + p.z * cos };
  } else {
    return { x: p.x * cos - p.y * sin, y: p.x * sin + p.y * cos, z: p.z };
  }
}

function translatePoint(p: Vector3, offset: Vector3): Vector3 {
  return { x: p.x + offset.x, y: p.y + offset.y, z: p.z + offset.z };
}

function getLEDDimensions(ledType: string): { bodyRadius: number; bodyHeight: number; legSpacing: number } {
  switch (ledType) {
    case "3mm":
      return { bodyRadius: 1.5, bodyHeight: 5, legSpacing: 2.54 };
    case "5mm":
      return { bodyRadius: 2.5, bodyHeight: 8.6, legSpacing: 2.54 };
    case "10mm_uv":
      return { bodyRadius: 5, bodyHeight: 13, legSpacing: 2.54 };
    case "ws2812b":
      return { bodyRadius: 2.5, bodyHeight: 1.6, legSpacing: 5.0 };
    case "ws2812b_strip":
      return { bodyRadius: 6, bodyHeight: 3, legSpacing: 10 };
    default:
      return { bodyRadius: 2.5, bodyHeight: 8.6, legSpacing: 2.54 };
  }
}

export function generateLEDHolder(settings: LEDHolderSettings): Buffer {
  const triangles: Triangle[] = [];
  const segments = 24;

  const led = getLEDDimensions(settings.ledType);
  const wall = settings.wallThickness;
  const tiltRad = (settings.tiltAngle * Math.PI) / 180;

  const socketInnerRadius = led.bodyRadius + 0.3;
  const socketOuterRadius = socketInnerRadius + wall;
  const socketDepth = Math.min(led.bodyHeight * 0.7, 10);

  const stemRadius = settings.wireChannelDiameter / 2 + wall;
  const wireChannelRadius = settings.wireChannelDiameter / 2;
  const stemLength = 25;

  const magnetRadius = settings.magnetDiameter / 2;
  const magnetPocketRadius = magnetRadius + 0.2;
  const magnetHousingRadius = magnetPocketRadius + wall;

  if (settings.ledType === "ws2812b" || settings.ledType === "ws2812b_strip") {
    const ws2812Size = settings.ledType === "ws2812b" ? 5 : 12;
    const ledHeight = settings.ledType === "ws2812b" ? 1.6 : 3;

    const cradleInner = ws2812Size / 2 + 0.3;
    const cradleOuter = cradleInner + wall;
    const cradleDepth = ledHeight + wall + 1;
    const cradleHeight = ws2812Size + wall * 2;

    const backThickness = wall + 2;
    const totalHeight = cradleHeight + backThickness;

    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2;
      const angle2 = ((i + 1) / segments) * Math.PI * 2;

      const cos1 = Math.cos(angle1);
      const sin1 = Math.sin(angle1);
      const cos2 = Math.cos(angle2);
      const sin2 = Math.sin(angle2);

      const outerBottom1: Vector3 = { x: cos1 * cradleOuter, y: 0, z: sin1 * cradleOuter };
      const outerBottom2: Vector3 = { x: cos2 * cradleOuter, y: 0, z: sin2 * cradleOuter };
      const outerTop1: Vector3 = { x: cos1 * cradleOuter, y: totalHeight, z: sin1 * cradleOuter };
      const outerTop2: Vector3 = { x: cos2 * cradleOuter, y: totalHeight, z: sin2 * cradleOuter };

      addTriangle(triangles, outerBottom1, outerTop1, outerTop2);
      addTriangle(triangles, outerBottom1, outerTop2, outerBottom2);

      const innerBottom1: Vector3 = { x: cos1 * cradleInner, y: backThickness, z: sin1 * cradleInner };
      const innerBottom2: Vector3 = { x: cos2 * cradleInner, y: backThickness, z: sin2 * cradleInner };
      const innerTop1: Vector3 = { x: cos1 * cradleInner, y: totalHeight, z: sin1 * cradleInner };
      const innerTop2: Vector3 = { x: cos2 * cradleInner, y: totalHeight, z: sin2 * cradleInner };

      addTriangle(triangles, innerBottom1, innerTop2, innerTop1);
      addTriangle(triangles, innerBottom1, innerBottom2, innerTop2);

      addTriangle(triangles, outerTop1, innerTop1, innerTop2);
      addTriangle(triangles, outerTop1, innerTop2, outerTop2);

      addTriangle(triangles, outerBottom1, innerBottom2, innerBottom1);
      addTriangle(triangles, outerBottom1, outerBottom2, innerBottom2);
    }

    const stemStartY = 0;
    const stemEndY = -stemLength;

    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2;
      const angle2 = ((i + 1) / segments) * Math.PI * 2;

      const cos1 = Math.cos(angle1);
      const sin1 = Math.sin(angle1);
      const cos2 = Math.cos(angle2);
      const sin2 = Math.sin(angle2);

      const outerTop1: Vector3 = { x: cos1 * stemRadius, y: stemStartY, z: sin1 * stemRadius };
      const outerTop2: Vector3 = { x: cos2 * stemRadius, y: stemStartY, z: sin2 * stemRadius };
      const outerBottom1: Vector3 = { x: cos1 * stemRadius, y: stemEndY, z: sin1 * stemRadius };
      const outerBottom2: Vector3 = { x: cos2 * stemRadius, y: stemEndY, z: sin2 * stemRadius };

      addTriangle(triangles, outerTop1, outerBottom1, outerBottom2);
      addTriangle(triangles, outerTop1, outerBottom2, outerTop2);

      const innerTop1: Vector3 = { x: cos1 * wireChannelRadius, y: stemStartY + backThickness, z: sin1 * wireChannelRadius };
      const innerTop2: Vector3 = { x: cos2 * wireChannelRadius, y: stemStartY + backThickness, z: sin2 * wireChannelRadius };
      const innerBottom1: Vector3 = { x: cos1 * wireChannelRadius, y: stemEndY, z: sin1 * wireChannelRadius };
      const innerBottom2: Vector3 = { x: cos2 * wireChannelRadius, y: stemEndY, z: sin2 * wireChannelRadius };

      addTriangle(triangles, innerTop1, innerBottom2, innerBottom1);
      addTriangle(triangles, innerTop1, innerTop2, innerBottom2);
    }

    if (settings.mountType === "magnetic") {
      const mountY = stemEndY;
      const mountHeight = settings.magnetDepth + wall;

      for (let i = 0; i < segments; i++) {
        const angle1 = (i / segments) * Math.PI * 2;
        const angle2 = ((i + 1) / segments) * Math.PI * 2;

        const cos1 = Math.cos(angle1);
        const sin1 = Math.sin(angle1);
        const cos2 = Math.cos(angle2);
        const sin2 = Math.sin(angle2);

        const outerTop1: Vector3 = { x: cos1 * magnetHousingRadius, y: mountY, z: sin1 * magnetHousingRadius };
        const outerTop2: Vector3 = { x: cos2 * magnetHousingRadius, y: mountY, z: sin2 * magnetHousingRadius };
        const outerBottom1: Vector3 = { x: cos1 * magnetHousingRadius, y: mountY - mountHeight, z: sin1 * magnetHousingRadius };
        const outerBottom2: Vector3 = { x: cos2 * magnetHousingRadius, y: mountY - mountHeight, z: sin2 * magnetHousingRadius };

        addTriangle(triangles, outerTop1, outerBottom1, outerBottom2);
        addTriangle(triangles, outerTop1, outerBottom2, outerTop2);

        const innerTop1: Vector3 = { x: cos1 * magnetPocketRadius, y: mountY, z: sin1 * magnetPocketRadius };
        const innerTop2: Vector3 = { x: cos2 * magnetPocketRadius, y: mountY, z: sin2 * magnetPocketRadius };
        const innerBottom1: Vector3 = { x: cos1 * magnetPocketRadius, y: mountY - settings.magnetDepth, z: sin1 * magnetPocketRadius };
        const innerBottom2: Vector3 = { x: cos2 * magnetPocketRadius, y: mountY - settings.magnetDepth, z: sin2 * magnetPocketRadius };

        addTriangle(triangles, innerTop1, innerBottom2, innerBottom1);
        addTriangle(triangles, innerTop1, innerTop2, innerBottom2);

        addTriangle(triangles, innerBottom1, innerBottom2, { x: 0, y: mountY - settings.magnetDepth, z: 0 });

        const baseInner1: Vector3 = { x: cos1 * magnetPocketRadius, y: mountY - settings.magnetDepth, z: sin1 * magnetPocketRadius };
        const baseInner2: Vector3 = { x: cos2 * magnetPocketRadius, y: mountY - settings.magnetDepth, z: sin2 * magnetPocketRadius };
        const baseOuter1: Vector3 = { x: cos1 * magnetHousingRadius, y: mountY - mountHeight, z: sin1 * magnetHousingRadius };
        const baseOuter2: Vector3 = { x: cos2 * magnetHousingRadius, y: mountY - mountHeight, z: sin2 * magnetHousingRadius };

        addTriangle(triangles, baseInner1, baseOuter1, baseOuter2);
        addTriangle(triangles, baseInner1, baseOuter2, baseInner2);
      }
    }
  } else {
    const bodyStartY = 0;
    const bodyEndY = socketDepth + wall;

    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2;
      const angle2 = ((i + 1) / segments) * Math.PI * 2;

      const cos1 = Math.cos(angle1);
      const sin1 = Math.sin(angle1);
      const cos2 = Math.cos(angle2);
      const sin2 = Math.sin(angle2);

      let outerBottom1: Vector3 = { x: cos1 * socketOuterRadius, y: bodyStartY, z: sin1 * socketOuterRadius };
      let outerBottom2: Vector3 = { x: cos2 * socketOuterRadius, y: bodyStartY, z: sin2 * socketOuterRadius };
      let outerTop1: Vector3 = { x: cos1 * socketOuterRadius, y: bodyEndY, z: sin1 * socketOuterRadius };
      let outerTop2: Vector3 = { x: cos2 * socketOuterRadius, y: bodyEndY, z: sin2 * socketOuterRadius };

      outerBottom1 = rotatePoint(outerBottom1, tiltRad, 'z');
      outerBottom2 = rotatePoint(outerBottom2, tiltRad, 'z');
      outerTop1 = rotatePoint(outerTop1, tiltRad, 'z');
      outerTop2 = rotatePoint(outerTop2, tiltRad, 'z');

      addTriangle(triangles, outerBottom1, outerTop1, outerTop2);
      addTriangle(triangles, outerBottom1, outerTop2, outerBottom2);

      let innerBottom1: Vector3 = { x: cos1 * socketInnerRadius, y: wall, z: sin1 * socketInnerRadius };
      let innerBottom2: Vector3 = { x: cos2 * socketInnerRadius, y: wall, z: sin2 * socketInnerRadius };
      let innerTop1: Vector3 = { x: cos1 * socketInnerRadius, y: bodyEndY, z: sin1 * socketInnerRadius };
      let innerTop2: Vector3 = { x: cos2 * socketInnerRadius, y: bodyEndY, z: sin2 * socketInnerRadius };

      innerBottom1 = rotatePoint(innerBottom1, tiltRad, 'z');
      innerBottom2 = rotatePoint(innerBottom2, tiltRad, 'z');
      innerTop1 = rotatePoint(innerTop1, tiltRad, 'z');
      innerTop2 = rotatePoint(innerTop2, tiltRad, 'z');

      addTriangle(triangles, innerBottom1, innerTop2, innerTop1);
      addTriangle(triangles, innerBottom1, innerBottom2, innerTop2);

      addTriangle(triangles, outerTop1, innerTop1, innerTop2);
      addTriangle(triangles, outerTop1, innerTop2, outerTop2);

      const baseCenter = rotatePoint({ x: 0, y: wall, z: 0 }, tiltRad, 'z');
      addTriangle(triangles, outerBottom1, innerBottom2, innerBottom1);
      addTriangle(triangles, outerBottom1, outerBottom2, innerBottom2);
    }

    const domeRadius = socketOuterRadius;
    const domeRings = 6;
    const domeCenter: Vector3 = rotatePoint({ x: 0, y: 0, z: 0 }, tiltRad, 'z');

    for (let r = 0; r < domeRings; r++) {
      const phi1 = (r / domeRings) * (Math.PI / 2);
      const phi2 = ((r + 1) / domeRings) * (Math.PI / 2);

      const ringRadius1 = domeRadius * Math.cos(phi1);
      const ringRadius2 = domeRadius * Math.cos(phi2);
      const ringY1 = -domeRadius * Math.sin(phi1);
      const ringY2 = -domeRadius * Math.sin(phi2);

      for (let i = 0; i < segments; i++) {
        const angle1 = (i / segments) * Math.PI * 2;
        const angle2 = ((i + 1) / segments) * Math.PI * 2;

        let p1: Vector3 = { x: Math.cos(angle1) * ringRadius1, y: ringY1, z: Math.sin(angle1) * ringRadius1 };
        let p2: Vector3 = { x: Math.cos(angle2) * ringRadius1, y: ringY1, z: Math.sin(angle2) * ringRadius1 };
        let p3: Vector3 = { x: Math.cos(angle1) * ringRadius2, y: ringY2, z: Math.sin(angle1) * ringRadius2 };
        let p4: Vector3 = { x: Math.cos(angle2) * ringRadius2, y: ringY2, z: Math.sin(angle2) * ringRadius2 };

        p1 = rotatePoint(p1, tiltRad, 'z');
        p2 = rotatePoint(p2, tiltRad, 'z');
        p3 = rotatePoint(p3, tiltRad, 'z');
        p4 = rotatePoint(p4, tiltRad, 'z');

        addTriangle(triangles, p1, p3, p4);
        addTriangle(triangles, p1, p4, p2);
      }
    }

    const stemConnectionY = -domeRadius * Math.sin(Math.PI / 4);
    const stemConnectionPoint = rotatePoint({ x: 0, y: stemConnectionY, z: 0 }, tiltRad, 'z');

    const stemDir: Vector3 = { x: 0, y: -1, z: 0 };

    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2;
      const angle2 = ((i + 1) / segments) * Math.PI * 2;

      const cos1 = Math.cos(angle1);
      const sin1 = Math.sin(angle1);
      const cos2 = Math.cos(angle2);
      const sin2 = Math.sin(angle2);

      const topOuter1: Vector3 = translatePoint({ x: cos1 * stemRadius, y: 0, z: sin1 * stemRadius }, stemConnectionPoint);
      const topOuter2: Vector3 = translatePoint({ x: cos2 * stemRadius, y: 0, z: sin2 * stemRadius }, stemConnectionPoint);
      const bottomOuter1: Vector3 = translatePoint({ x: cos1 * stemRadius, y: -stemLength, z: sin1 * stemRadius }, stemConnectionPoint);
      const bottomOuter2: Vector3 = translatePoint({ x: cos2 * stemRadius, y: -stemLength, z: sin2 * stemRadius }, stemConnectionPoint);

      addTriangle(triangles, topOuter1, bottomOuter1, bottomOuter2);
      addTriangle(triangles, topOuter1, bottomOuter2, topOuter2);

      const topInner1: Vector3 = translatePoint({ x: cos1 * wireChannelRadius, y: 0, z: sin1 * wireChannelRadius }, stemConnectionPoint);
      const topInner2: Vector3 = translatePoint({ x: cos2 * wireChannelRadius, y: 0, z: sin2 * wireChannelRadius }, stemConnectionPoint);
      const bottomInner1: Vector3 = translatePoint({ x: cos1 * wireChannelRadius, y: -stemLength, z: sin1 * wireChannelRadius }, stemConnectionPoint);
      const bottomInner2: Vector3 = translatePoint({ x: cos2 * wireChannelRadius, y: -stemLength, z: sin2 * wireChannelRadius }, stemConnectionPoint);

      addTriangle(triangles, topInner1, bottomInner2, bottomInner1);
      addTriangle(triangles, topInner1, topInner2, bottomInner2);
    }

    if (settings.mountType === "magnetic") {
      const mountCenter = translatePoint({ x: 0, y: -stemLength, z: 0 }, stemConnectionPoint);
      const mountHeight = settings.magnetDepth + wall;

      for (let i = 0; i < segments; i++) {
        const angle1 = (i / segments) * Math.PI * 2;
        const angle2 = ((i + 1) / segments) * Math.PI * 2;

        const cos1 = Math.cos(angle1);
        const sin1 = Math.sin(angle1);
        const cos2 = Math.cos(angle2);
        const sin2 = Math.sin(angle2);

        const outerTop1: Vector3 = translatePoint({ x: cos1 * magnetHousingRadius, y: 0, z: sin1 * magnetHousingRadius }, mountCenter);
        const outerTop2: Vector3 = translatePoint({ x: cos2 * magnetHousingRadius, y: 0, z: sin2 * magnetHousingRadius }, mountCenter);
        const outerBottom1: Vector3 = translatePoint({ x: cos1 * magnetHousingRadius, y: -mountHeight, z: sin1 * magnetHousingRadius }, mountCenter);
        const outerBottom2: Vector3 = translatePoint({ x: cos2 * magnetHousingRadius, y: -mountHeight, z: sin2 * magnetHousingRadius }, mountCenter);

        addTriangle(triangles, outerTop1, outerBottom1, outerBottom2);
        addTriangle(triangles, outerTop1, outerBottom2, outerTop2);

        const innerTop1: Vector3 = translatePoint({ x: cos1 * magnetPocketRadius, y: 0, z: sin1 * magnetPocketRadius }, mountCenter);
        const innerTop2: Vector3 = translatePoint({ x: cos2 * magnetPocketRadius, y: 0, z: sin2 * magnetPocketRadius }, mountCenter);
        const innerBottom1: Vector3 = translatePoint({ x: cos1 * magnetPocketRadius, y: -settings.magnetDepth, z: sin1 * magnetPocketRadius }, mountCenter);
        const innerBottom2: Vector3 = translatePoint({ x: cos2 * magnetPocketRadius, y: -settings.magnetDepth, z: sin2 * magnetPocketRadius }, mountCenter);

        addTriangle(triangles, innerTop1, innerBottom2, innerBottom1);
        addTriangle(triangles, innerTop1, innerTop2, innerBottom2);

        const bottomCenter = translatePoint({ x: 0, y: -settings.magnetDepth, z: 0 }, mountCenter);
        addTriangle(triangles, innerBottom2, innerBottom1, bottomCenter);

        const ringBottom: Vector3 = translatePoint({ x: 0, y: -mountHeight, z: 0 }, mountCenter);
        const baseInner1: Vector3 = translatePoint({ x: cos1 * magnetPocketRadius, y: -settings.magnetDepth, z: sin1 * magnetPocketRadius }, mountCenter);
        const baseInner2: Vector3 = translatePoint({ x: cos2 * magnetPocketRadius, y: -settings.magnetDepth, z: sin2 * magnetPocketRadius }, mountCenter);
        const baseOuter1: Vector3 = translatePoint({ x: cos1 * magnetHousingRadius, y: -mountHeight, z: sin1 * magnetHousingRadius }, mountCenter);
        const baseOuter2: Vector3 = translatePoint({ x: cos2 * magnetHousingRadius, y: -mountHeight, z: sin2 * magnetHousingRadius }, mountCenter);

        addTriangle(triangles, baseInner1, baseOuter1, baseOuter2);
        addTriangle(triangles, baseInner1, baseOuter2, baseInner2);
      }
    } else if (settings.mountType === "screw") {
      const mountCenter = translatePoint({ x: 0, y: -stemLength, z: 0 }, stemConnectionPoint);
      const plateWidth = 20;
      const plateThickness = 3;

      const hw = plateWidth / 2;
      const ht = plateThickness;

      const plateVerts = [
        translatePoint({ x: -hw, y: 0, z: -hw }, mountCenter),
        translatePoint({ x: hw, y: 0, z: -hw }, mountCenter),
        translatePoint({ x: hw, y: 0, z: hw }, mountCenter),
        translatePoint({ x: -hw, y: 0, z: hw }, mountCenter),
        translatePoint({ x: -hw, y: -ht, z: -hw }, mountCenter),
        translatePoint({ x: hw, y: -ht, z: -hw }, mountCenter),
        translatePoint({ x: hw, y: -ht, z: hw }, mountCenter),
        translatePoint({ x: -hw, y: -ht, z: hw }, mountCenter),
      ];

      addTriangle(triangles, plateVerts[0], plateVerts[1], plateVerts[2]);
      addTriangle(triangles, plateVerts[0], plateVerts[2], plateVerts[3]);

      addTriangle(triangles, plateVerts[4], plateVerts[6], plateVerts[5]);
      addTriangle(triangles, plateVerts[4], plateVerts[7], plateVerts[6]);

      addTriangle(triangles, plateVerts[0], plateVerts[4], plateVerts[5]);
      addTriangle(triangles, plateVerts[0], plateVerts[5], plateVerts[1]);
      addTriangle(triangles, plateVerts[1], plateVerts[5], plateVerts[6]);
      addTriangle(triangles, plateVerts[1], plateVerts[6], plateVerts[2]);
      addTriangle(triangles, plateVerts[2], plateVerts[6], plateVerts[7]);
      addTriangle(triangles, plateVerts[2], plateVerts[7], plateVerts[3]);
      addTriangle(triangles, plateVerts[3], plateVerts[7], plateVerts[4]);
      addTriangle(triangles, plateVerts[3], plateVerts[4], plateVerts[0]);
    } else if (settings.mountType === "adhesive") {
      const mountCenter = translatePoint({ x: 0, y: -stemLength, z: 0 }, stemConnectionPoint);
      const padRadius = 10;
      const padThickness = 2;

      for (let i = 0; i < segments; i++) {
        const angle1 = (i / segments) * Math.PI * 2;
        const angle2 = ((i + 1) / segments) * Math.PI * 2;

        const cos1 = Math.cos(angle1);
        const sin1 = Math.sin(angle1);
        const cos2 = Math.cos(angle2);
        const sin2 = Math.sin(angle2);

        const top1 = translatePoint({ x: cos1 * padRadius, y: 0, z: sin1 * padRadius }, mountCenter);
        const top2 = translatePoint({ x: cos2 * padRadius, y: 0, z: sin2 * padRadius }, mountCenter);
        const bot1 = translatePoint({ x: cos1 * padRadius, y: -padThickness, z: sin1 * padRadius }, mountCenter);
        const bot2 = translatePoint({ x: cos2 * padRadius, y: -padThickness, z: sin2 * padRadius }, mountCenter);

        addTriangle(triangles, mountCenter, top1, top2);
        addTriangle(triangles, top1, bot1, bot2);
        addTriangle(triangles, top1, bot2, top2);

        const botCenter = translatePoint({ x: 0, y: -padThickness, z: 0 }, mountCenter);
        addTriangle(triangles, botCenter, bot2, bot1);
      }
    } else if (settings.mountType === "clip_on") {
      const mountCenter = translatePoint({ x: 0, y: -stemLength, z: 0 }, stemConnectionPoint);
      const clipGap = 4;
      const clipDepth = 8;
      const clipThickness = wall;

      const armOffset = clipGap / 2 + clipThickness / 2;

      const leftArm = [
        translatePoint({ x: -armOffset - clipThickness / 2, y: 0, z: -clipThickness / 2 }, mountCenter),
        translatePoint({ x: -armOffset + clipThickness / 2, y: 0, z: -clipThickness / 2 }, mountCenter),
        translatePoint({ x: -armOffset + clipThickness / 2, y: 0, z: clipThickness / 2 }, mountCenter),
        translatePoint({ x: -armOffset - clipThickness / 2, y: 0, z: clipThickness / 2 }, mountCenter),
        translatePoint({ x: -armOffset - clipThickness / 2, y: -clipDepth, z: -clipThickness / 2 }, mountCenter),
        translatePoint({ x: -armOffset + clipThickness / 2, y: -clipDepth, z: -clipThickness / 2 }, mountCenter),
        translatePoint({ x: -armOffset + clipThickness / 2, y: -clipDepth, z: clipThickness / 2 }, mountCenter),
        translatePoint({ x: -armOffset - clipThickness / 2, y: -clipDepth, z: clipThickness / 2 }, mountCenter),
      ];

      addTriangle(triangles, leftArm[0], leftArm[1], leftArm[2]);
      addTriangle(triangles, leftArm[0], leftArm[2], leftArm[3]);
      addTriangle(triangles, leftArm[4], leftArm[6], leftArm[5]);
      addTriangle(triangles, leftArm[4], leftArm[7], leftArm[6]);
      addTriangle(triangles, leftArm[0], leftArm[4], leftArm[5]);
      addTriangle(triangles, leftArm[0], leftArm[5], leftArm[1]);
      addTriangle(triangles, leftArm[1], leftArm[5], leftArm[6]);
      addTriangle(triangles, leftArm[1], leftArm[6], leftArm[2]);
      addTriangle(triangles, leftArm[2], leftArm[6], leftArm[7]);
      addTriangle(triangles, leftArm[2], leftArm[7], leftArm[3]);
      addTriangle(triangles, leftArm[3], leftArm[7], leftArm[4]);
      addTriangle(triangles, leftArm[3], leftArm[4], leftArm[0]);

      const rightArm = [
        translatePoint({ x: armOffset - clipThickness / 2, y: 0, z: -clipThickness / 2 }, mountCenter),
        translatePoint({ x: armOffset + clipThickness / 2, y: 0, z: -clipThickness / 2 }, mountCenter),
        translatePoint({ x: armOffset + clipThickness / 2, y: 0, z: clipThickness / 2 }, mountCenter),
        translatePoint({ x: armOffset - clipThickness / 2, y: 0, z: clipThickness / 2 }, mountCenter),
        translatePoint({ x: armOffset - clipThickness / 2, y: -clipDepth, z: -clipThickness / 2 }, mountCenter),
        translatePoint({ x: armOffset + clipThickness / 2, y: -clipDepth, z: -clipThickness / 2 }, mountCenter),
        translatePoint({ x: armOffset + clipThickness / 2, y: -clipDepth, z: clipThickness / 2 }, mountCenter),
        translatePoint({ x: armOffset - clipThickness / 2, y: -clipDepth, z: clipThickness / 2 }, mountCenter),
      ];

      addTriangle(triangles, rightArm[0], rightArm[1], rightArm[2]);
      addTriangle(triangles, rightArm[0], rightArm[2], rightArm[3]);
      addTriangle(triangles, rightArm[4], rightArm[6], rightArm[5]);
      addTriangle(triangles, rightArm[4], rightArm[7], rightArm[6]);
      addTriangle(triangles, rightArm[0], rightArm[4], rightArm[5]);
      addTriangle(triangles, rightArm[0], rightArm[5], rightArm[1]);
      addTriangle(triangles, rightArm[1], rightArm[5], rightArm[6]);
      addTriangle(triangles, rightArm[1], rightArm[6], rightArm[2]);
      addTriangle(triangles, rightArm[2], rightArm[6], rightArm[7]);
      addTriangle(triangles, rightArm[2], rightArm[7], rightArm[3]);
      addTriangle(triangles, rightArm[3], rightArm[7], rightArm[4]);
      addTriangle(triangles, rightArm[3], rightArm[4], rightArm[0]);

      const crossBar = [
        translatePoint({ x: -armOffset + clipThickness / 2, y: -clipDepth, z: -clipThickness / 2 }, mountCenter),
        translatePoint({ x: armOffset - clipThickness / 2, y: -clipDepth, z: -clipThickness / 2 }, mountCenter),
        translatePoint({ x: armOffset - clipThickness / 2, y: -clipDepth, z: clipThickness / 2 }, mountCenter),
        translatePoint({ x: -armOffset + clipThickness / 2, y: -clipDepth, z: clipThickness / 2 }, mountCenter),
        translatePoint({ x: -armOffset + clipThickness / 2, y: -clipDepth - clipThickness, z: -clipThickness / 2 }, mountCenter),
        translatePoint({ x: armOffset - clipThickness / 2, y: -clipDepth - clipThickness, z: -clipThickness / 2 }, mountCenter),
        translatePoint({ x: armOffset - clipThickness / 2, y: -clipDepth - clipThickness, z: clipThickness / 2 }, mountCenter),
        translatePoint({ x: -armOffset + clipThickness / 2, y: -clipDepth - clipThickness, z: clipThickness / 2 }, mountCenter),
      ];

      addTriangle(triangles, crossBar[0], crossBar[1], crossBar[2]);
      addTriangle(triangles, crossBar[0], crossBar[2], crossBar[3]);
      addTriangle(triangles, crossBar[4], crossBar[6], crossBar[5]);
      addTriangle(triangles, crossBar[4], crossBar[7], crossBar[6]);
      addTriangle(triangles, crossBar[0], crossBar[4], crossBar[5]);
      addTriangle(triangles, crossBar[0], crossBar[5], crossBar[1]);
      addTriangle(triangles, crossBar[1], crossBar[5], crossBar[6]);
      addTriangle(triangles, crossBar[1], crossBar[6], crossBar[2]);
      addTriangle(triangles, crossBar[2], crossBar[6], crossBar[7]);
      addTriangle(triangles, crossBar[2], crossBar[7], crossBar[3]);
      addTriangle(triangles, crossBar[3], crossBar[7], crossBar[4]);
      addTriangle(triangles, crossBar[3], crossBar[4], crossBar[0]);
    }
  }

  return trianglesToBinarySTL(triangles);
}
