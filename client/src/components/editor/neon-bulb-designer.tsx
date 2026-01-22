/**
 * NEON BULB DESIGNER
 * Frontend UI for creating decorative LED bulbs with shaped filaments
 * 
 * Features:
 * - Text or shape filament design
 * - Multiple bulb envelope styles
 * - E26/E27 screw base with battery compartment
 * - Touch or switch control
 * - Real-time 3D preview
 */

import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Lightbulb, Download, Zap } from "lucide-react";

const FILAMENT_TYPES = ["text", "shape", "custom"] as const;
const FILAMENT_SHAPES = ["heart", "star", "wine_glass", "cursive_h", "lightning", "infinity"] as const;
const ENVELOPE_TYPES = ["standard_a19", "globe_g25", "edison_st64", "bottle_adapter"] as const;
const BASE_TYPES = ["e26", "e27"] as const;
const BATTERY_TYPES = ["cr2032_stack", "touch_motherboard"] as const;
const SWITCH_TYPES = ["twist_base", "coin_slot", "touch_sensor", "none"] as const;
const SUPPORT_STYLES = ["center_post", "wire_clips", "mounting_posts", "suspended"] as const;
const DIFFUSER_STYLES = ["clear", "frosted", "tinted"] as const;

interface NeonBulbSettings {
  filamentType: typeof FILAMENT_TYPES[number];
  filamentText: string;
  filamentShape: typeof FILAMENT_SHAPES[number];
  filamentHeight: number;
  filamentWidth: number;
  
  envelopeType: typeof ENVELOPE_TYPES[number];
  envelopeDiameter: number;
  envelopeHeight: number;
  wallThickness: number;
  diffuserStyle: typeof DIFFUSER_STYLES[number];
  
  baseType: typeof BASE_TYPES[number];
  baseHeight: number;
  includeBatteryCompartment: boolean;
  batteryType: typeof BATTERY_TYPES[number];
  batteryCount: number;
  
  switchType: typeof SWITCH_TYPES[number];
  includeDimmer: boolean;
  
  supportStyle: typeof SUPPORT_STYLES[number];
  wireChannelWidth: number;
  
  splitBulb: boolean;
  snapFitTolerance: number;
  includeThreadedCap: boolean;
  
  includeScottTorsion: boolean;
  printOrientation: "upright" | "inverted";
}

const defaultSettings: NeonBulbSettings = {
  filamentType: "text",
  filamentText: "NEON",
  filamentShape: "heart",
  filamentHeight: 40,
  filamentWidth: 30,
  
  envelopeType: "standard_a19",
  envelopeDiameter: 60,
  envelopeHeight: 110,
  wallThickness: 1.5,
  diffuserStyle: "clear",
  
  baseType: "e26",
  baseHeight: 30,
  includeBatteryCompartment: true,
  batteryType: "cr2032_stack",
  batteryCount: 3,
  
  switchType: "coin_slot",
  includeDimmer: false,
  
  supportStyle: "mounting_posts",
  wireChannelWidth: 2,
  
  splitBulb: true,
  snapFitTolerance: 0.2,
  includeThreadedCap: false,
  
  includeScottTorsion: true,
  printOrientation: "upright",
};

export default function NeonBulbDesigner() {
  const [settings, setSettings] = useState<NeonBulbSettings>(defaultSettings);
  const [isGenerating, setIsGenerating] = useState(false);

  const updateSettings = (updates: Partial<NeonBulbSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-neon-bulb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error("Generation failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `neon-bulb-${settings.filamentText || settings.filamentShape}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Generation error:", error);
      alert("Failed to generate neon bulb. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* 3D Preview */}
      <div className="flex-1 bg-gray-900">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 200]} fov={50} />
          <OrbitControls enableDamping dampingFactor={0.05} />
          <Environment preset="studio" />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          
          {/* Bulb Preview */}
          <BulbPreview settings={settings} />
        </Canvas>
      </div>

      {/* Controls Panel */}
      <div className="w-96 bg-gray-800 text-white overflow-y-auto p-6 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-6 h-6 text-yellow-400" />
          <h2 className="text-2xl font-bold">Neon Bulb Designer</h2>
        </div>

        {/* Filament Design */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-gray-600 pb-2">Filament Design</h3>
          
          <div>
            <Label>Filament Type</Label>
            <Select
              value={settings.filamentType}
              onValueChange={(value: typeof settings.filamentType) =>
                updateSettings({ filamentType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="shape">Shape</SelectItem>
                <SelectItem value="custom">Custom Path</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.filamentType === "text" && (
            <div>
              <Label>Text</Label>
              <Input
                value={settings.filamentText}
                onChange={(e) => updateSettings({ filamentText: e.target.value })}
                placeholder="Enter text..."
                maxLength={10}
              />
            </div>
          )}

          {settings.filamentType === "shape" && (
            <div>
              <Label>Shape</Label>
              <Select
                value={settings.filamentShape}
                onValueChange={(value: typeof settings.filamentShape) =>
                  updateSettings({ filamentShape: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="heart">Heart</SelectItem>
                  <SelectItem value="star">Star</SelectItem>
                  <SelectItem value="wine_glass">Wine Glass</SelectItem>
                  <SelectItem value="cursive_h">Cursive H</SelectItem>
                  <SelectItem value="lightning">Lightning</SelectItem>
                  <SelectItem value="infinity">Infinity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Filament Size (mm)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-400">Width</Label>
                <Input
                  type="number"
                  value={settings.filamentWidth}
                  onChange={(e) => updateSettings({ filamentWidth: Number(e.target.value) })}
                  min={10}
                  max={50}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-400">Height</Label>
                <Input
                  type="number"
                  value={settings.filamentHeight}
                  onChange={(e) => updateSettings({ filamentHeight: Number(e.target.value) })}
                  min={10}
                  max={80}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bulb Envelope */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-gray-600 pb-2">Bulb Envelope</h3>
          
          <div>
            <Label>Envelope Style</Label>
            <Select
              value={settings.envelopeType}
              onValueChange={(value: typeof settings.envelopeType) =>
                updateSettings({ envelopeType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard_a19">Standard A19</SelectItem>
                <SelectItem value="globe_g25">Globe G25</SelectItem>
                <SelectItem value="edison_st64">Edison ST64</SelectItem>
                <SelectItem value="bottle_adapter">Bottle Adapter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Diffuser Style</Label>
            <Select
              value={settings.diffuserStyle}
              onValueChange={(value: typeof settings.diffuserStyle) =>
                updateSettings({ diffuserStyle: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clear">Clear</SelectItem>
                <SelectItem value="frosted">Frosted</SelectItem>
                <SelectItem value="tinted">Tinted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>Split Bulb (for assembly)</Label>
            <Switch
              checked={settings.splitBulb}
              onCheckedChange={(v) => updateSettings({ splitBulb: v })}
            />
          </div>
        </div>

        {/* Screw Base & Electronics */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-gray-600 pb-2">Base & Electronics</h3>
          
          <div>
            <Label>Base Type</Label>
            <Select
              value={settings.baseType}
              onValueChange={(value: typeof settings.baseType) =>
                updateSettings({ baseType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="e26">E26 (US Standard)</SelectItem>
                <SelectItem value="e27">E27 (EU Standard)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>Battery Compartment</Label>
            <Switch
              checked={settings.includeBatteryCompartment}
              onCheckedChange={(v) => updateSettings({ includeBatteryCompartment: v })}
            />
          </div>

          {settings.includeBatteryCompartment && (
            <>
              <div>
                <Label>Battery Type</Label>
                <Select
                  value={settings.batteryType}
                  onValueChange={(value: typeof settings.batteryType) =>
                    updateSettings({ batteryType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cr2032_stack">CR2032 Stack</SelectItem>
                    <SelectItem value="touch_motherboard">Touch Motherboard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.batteryType === "cr2032_stack" && (
                <div>
                  <Label>Battery Count: {settings.batteryCount}× ({settings.batteryCount * 3}V)</Label>
                  <Slider
                    value={[settings.batteryCount]}
                    onValueChange={([v]) => updateSettings({ batteryCount: v })}
                    min={1}
                    max={4}
                    step={1}
                    className="mt-2"
                  />
                </div>
              )}
            </>
          )}

          <div>
            <Label>Switch Type</Label>
            <Select
              value={settings.switchType}
              onValueChange={(value: typeof settings.switchType) =>
                updateSettings({ switchType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="twist_base">Twist Base</SelectItem>
                <SelectItem value="coin_slot">Coin Slot</SelectItem>
                <SelectItem value="touch_sensor">Touch Sensor</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filament Support */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-gray-600 pb-2">Filament Support</h3>
          
          <div>
            <Label>Support Style</Label>
            <Select
              value={settings.supportStyle}
              onValueChange={(value: typeof settings.supportStyle) =>
                updateSettings({ supportStyle: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="center_post">Center Post</SelectItem>
                <SelectItem value="wire_clips">Wire Clips</SelectItem>
                <SelectItem value="mounting_posts">Mounting Posts</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Zap className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-5 h-5 mr-2" />
              Generate Neon Bulb
            </>
          )}
        </Button>

        <div className="text-xs text-gray-400 space-y-1">
          <p>Export includes:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Bulb envelope STL (top + bottom)</li>
            <li>Screw base STL with threads</li>
            <li>Filament support STL</li>
            <li>Assembly instructions</li>
            <li>Wiring diagram</li>
            <li>Bill of materials</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * 3D Preview Component
 */
function BulbPreview({ settings }: { settings: NeonBulbSettings }) {
  return (
    <group>
      {/* Bulb Envelope */}
      <mesh>
        <sphereGeometry args={[settings.envelopeDiameter / 2, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color={0xffffff}
          transparent
          opacity={settings.diffuserStyle === "clear" ? 0.15 : 0.4}
          roughness={settings.diffuserStyle === "frosted" ? 0.8 : 0.1}
          transmission={0.9}
        />
      </mesh>

      {/* Screw Base */}
      <mesh position={[0, -settings.envelopeHeight / 2 - settings.baseHeight / 2, 0]}>
        <cylinderGeometry args={[13, 13, settings.baseHeight, 32]} />
        <meshStandardMaterial color={0x808080} metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Filament (simplified visualization) */}
      <FilamentPreview settings={settings} />
    </group>
  );
}

/**
 * Filament Preview Component
 */
function FilamentPreview({ settings }: { settings: NeonBulbSettings }) {
  const filamentPath = React.useMemo(() => {
    return generateFilamentPath(settings);
  }, [settings.filamentType, settings.filamentShape, settings.filamentText, settings.filamentWidth, settings.filamentHeight]);

  const points = filamentPath.map((p) => new THREE.Vector3(p.x, p.y, 0));
  const curve = new THREE.CatmullRomCurve3(points);
  const tubeGeometry = new THREE.TubeGeometry(curve, 64, 1, 8, false);

  return (
    <mesh geometry={tubeGeometry}>
      <meshStandardMaterial color={0xFFAA00} emissive={0xFF8800} emissiveIntensity={0.5} />
    </mesh>
  );
}

/**
 * Generate filament path for preview
 */
function generateFilamentPath(settings: NeonBulbSettings): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const hw = settings.filamentWidth / 2;
  const hh = settings.filamentHeight / 2;

  if (settings.filamentType === "shape") {
    switch (settings.filamentShape) {
      case "heart":
        for (let i = 0; i <= 32; i++) {
          const t = (i / 32) * Math.PI * 2;
          const x = 16 * Math.pow(Math.sin(t), 3);
          const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
          points.push({ x: (x / 16) * hw, y: -(y / 16) * hh });
        }
        break;

      case "star":
        for (let i = 0; i <= 10; i++) {
          const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
          const radius = i % 2 === 0 ? hw : hw * 0.4;
          points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
        }
        break;

      case "wine_glass":
        for (let i = 0; i <= 16; i++) {
          const t = i / 16;
          const angle = Math.PI * t + Math.PI;
          const x = Math.cos(angle) * hw * 0.6;
          const y = Math.sin(angle) * hh * 0.4 + hh * 0.3;
          points.push({ x, y });
        }
        points.push({ x: 0, y: -hh * 0.5 });
        points.push({ x: -hw * 0.4, y: -hh });
        points.push({ x: hw * 0.4, y: -hh });
        break;

      case "cursive_h":
        points.push({ x: -hw * 0.6, y: -hh });
        points.push({ x: -hw * 0.6, y: hh });
        for (let i = 0; i <= 8; i++) {
          const t = i / 8;
          const x = -hw * 0.6 + t * hw * 1.2;
          const y = Math.sin(t * Math.PI) * hh * 0.2;
          points.push({ x, y });
        }
        points.push({ x: hw * 0.6, y: hh });
        points.push({ x: hw * 0.6, y: -hh });
        break;

      case "lightning":
        points.push({ x: 0, y: hh });
        points.push({ x: -hw * 0.2, y: hh * 0.3 });
        points.push({ x: hw * 0.15, y: hh * 0.35 });
        points.push({ x: -hw * 0.1, y: -hh * 0.2 });
        points.push({ x: hw * 0.2, y: -hh * 0.15 });
        points.push({ x: 0, y: -hh });
        break;

      case "infinity":
        for (let i = 0; i <= 64; i++) {
          const t = (i / 64) * Math.PI * 2;
          const x = (hw * Math.cos(t)) / (1 + Math.pow(Math.sin(t), 2));
          const y = (hh * Math.sin(t) * Math.cos(t)) / (1 + Math.pow(Math.sin(t), 2));
          points.push({ x, y });
        }
        break;
    }
  } else {
    // Default circle for text mode
    for (let i = 0; i <= 32; i++) {
      const angle = (i / 32) * Math.PI * 2;
      points.push({ x: Math.cos(angle) * hw, y: Math.sin(angle) * hh });
    }
  }

  return points;
}
