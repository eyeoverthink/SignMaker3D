/**
 * ANIMATION SEQUENCE DESIGNER
 * Frontend UI for creating multi-frame LED animations
 * 
 * Features:
 * - Frame-by-frame animation editor
 * - Real-time preview with play/pause
 * - LED pattern editor per frame
 * - Arduino code generation
 * - Adjustable timing and colors
 */

import React, { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Plus, Minus, Download, Film, Copy } from "lucide-react";

const LED_TYPES = ["ws2812b", "simple_led", "neopixel"] as const;
const CONTROLLER_TYPES = ["arduino_nano", "esp32", "xiao_samd21"] as const;
const PATTERN_TYPES = ["stick_figure", "text", "shape", "custom"] as const;

interface FrameConfig {
  frameNumber: number;
  frameName: string;
  patternType: typeof PATTERN_TYPES[number];
  ledPattern: number[];
  brightness: number;
  color: { r: number; g: number; b: number };
  duration: number;
}

interface AnimationSequenceSettings {
  sequenceName: string;
  frameCount: number;
  frameDelay: number;
  animationSpeed: number;
  loopAnimation: boolean;
  frames: FrameConfig[];
  ledType: typeof LED_TYPES[number];
  ledCount: number;
  ledPin: number;
  controllerType: typeof CONTROLLER_TYPES[number];
  includeDimmer: boolean;
  dimmerPin: number;
  brightnessLevels: number;
  signWidth: number;
  signHeight: number;
  exportFormat: "stl" | "3mf";
  includeControllerCode: boolean;
  includeWiringDiagram: boolean;
}

const defaultSettings: AnimationSequenceSettings = {
  sequenceName: "Walking Stick Figure",
  frameCount: 4,
  frameDelay: 500,
  animationSpeed: 2.0,
  loopAnimation: true,
  frames: [
    {
      frameNumber: 1,
      frameName: "Stick Figure",
      patternType: "stick_figure",
      ledPattern: [0, 1, 2, 3, 4, 5, 10, 11],
      brightness: 255,
      color: { r: 255, g: 255, b: 255 },
      duration: 500,
    },
    {
      frameNumber: 2,
      frameName: "Stick Figure",
      patternType: "stick_figure",
      ledPattern: [0, 1, 2, 3, 6, 7, 12, 13],
      brightness: 255,
      color: { r: 255, g: 255, b: 255 },
      duration: 500,
    },
    {
      frameNumber: 3,
      frameName: "Stick Figure",
      patternType: "stick_figure",
      ledPattern: [0, 1, 2, 3, 8, 9, 14, 15],
      brightness: 255,
      color: { r: 255, g: 255, b: 255 },
      duration: 500,
    },
    {
      frameNumber: 4,
      frameName: "Stick Figure",
      patternType: "stick_figure",
      ledPattern: [0, 1, 2, 3, 4, 5, 10, 11],
      brightness: 255,
      color: { r: 255, g: 255, b: 255 },
      duration: 500,
    },
  ],
  ledType: "ws2812b",
  ledCount: 60,
  ledPin: 3,
  controllerType: "arduino_nano",
  includeDimmer: true,
  dimmerPin: 5,
  brightnessLevels: 255,
  signWidth: 60,
  signHeight: 80,
  exportFormat: "stl",
  includeControllerCode: true,
  includeWiringDiagram: true,
};

export default function AnimationSequenceDesigner() {
  const [settings, setSettings] = useState<AnimationSequenceSettings>(defaultSettings);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPreviewFrame, setCurrentPreviewFrame] = useState(0);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const updateSettings = (updates: Partial<AnimationSequenceSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const updateFrame = (frameNumber: number, updates: Partial<FrameConfig>) => {
    setSettings((prev) => ({
      ...prev,
      frames: prev.frames.map((frame) =>
        frame.frameNumber === frameNumber ? { ...frame, ...updates } : frame
      ),
    }));
  };

  const addFrame = () => {
    if (settings.frameCount >= 20) return;
    
    const newFrameNumber = settings.frameCount + 1;
    const lastFrame = settings.frames[settings.frames.length - 1];
    const newFrame: FrameConfig = {
      ...lastFrame,
      frameNumber: newFrameNumber,
      frameName: `Frame ${newFrameNumber}`,
    };
    
    updateSettings({
      frameCount: newFrameNumber,
      frames: [...settings.frames, newFrame],
    });
  };

  const removeFrame = () => {
    if (settings.frameCount <= 1) return;
    
    updateSettings({
      frameCount: settings.frameCount - 1,
      frames: settings.frames.slice(0, -1),
    });
    
    if (selectedFrame > settings.frameCount - 1) {
      setSelectedFrame(settings.frameCount - 1);
    }
  };

  const duplicateFrame = (frameNumber: number) => {
    const frameToDuplicate = settings.frames.find(f => f.frameNumber === frameNumber);
    if (!frameToDuplicate || settings.frameCount >= 20) return;
    
    const newFrameNumber = settings.frameCount + 1;
    const newFrame: FrameConfig = {
      ...frameToDuplicate,
      frameNumber: newFrameNumber,
      frameName: `${frameToDuplicate.frameName} (Copy)`,
    };
    
    updateSettings({
      frameCount: newFrameNumber,
      frames: [...settings.frames, newFrame],
    });
  };

  const toggleLED = (ledIndex: number) => {
    const currentFrame = settings.frames[selectedFrame - 1];
    const ledPattern = [...currentFrame.ledPattern];
    const ledIndexInPattern = ledPattern.indexOf(ledIndex);
    
    if (ledIndexInPattern >= 0) {
      ledPattern.splice(ledIndexInPattern, 1);
    } else {
      ledPattern.push(ledIndex);
      ledPattern.sort((a, b) => a - b);
    }
    
    updateFrame(selectedFrame, { ledPattern });
  };

  const playAnimation = () => {
    setIsPlaying(true);
    setCurrentPreviewFrame(0);
  };

  const pauseAnimation = () => {
    setIsPlaying(false);
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (isPlaying) {
      const currentFrame = settings.frames[currentPreviewFrame];
      animationTimerRef.current = setTimeout(() => {
        setCurrentPreviewFrame((prev) => {
          const next = prev + 1;
          if (next >= settings.frameCount) {
            if (settings.loopAnimation) {
              return 0;
            } else {
              setIsPlaying(false);
              return prev;
            }
          }
          return next;
        });
      }, currentFrame.duration);
    }
    
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, [isPlaying, currentPreviewFrame, settings.frameCount, settings.loopAnimation, settings.frames]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-animation-sequence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error("Generation failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `animation-${settings.sequenceName.replace(/\s+/g, '_')}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Generation error:", error);
      alert("Failed to generate animation sequence. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const currentFrame = settings.frames[selectedFrame - 1];
  const previewFrame = settings.frames[currentPreviewFrame];

  return (
    <div className="flex h-full">
      {/* 3D Preview */}
      <div className="flex-1 bg-gray-900 relative">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 150]} fov={50} />
          <OrbitControls enableDamping dampingFactor={0.05} />
          <Environment preset="studio" />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          
          {/* Animation Preview */}
          <AnimationPreview settings={settings} frame={previewFrame} />
        </Canvas>
        
        {/* Preview Controls Overlay */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white p-4 rounded-lg">
          <div className="flex items-center gap-4">
            <Button
              size="sm"
              variant="outline"
              onClick={isPlaying ? pauseAnimation : playAnimation}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <div className="text-sm">
              Frame {currentPreviewFrame + 1}/{settings.frameCount}
            </div>
            <div className="text-xs text-gray-400">
              {settings.animationSpeed} FPS
            </div>
          </div>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="w-96 bg-gray-800 text-white overflow-y-auto p-6 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Film className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-bold">Animation Sequence</h2>
        </div>

        {/* Sequence Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-gray-600 pb-2">Sequence</h3>
          
          <div>
            <Label>Sequence Name</Label>
            <Input
              value={settings.sequenceName}
              onChange={(e) => updateSettings({ sequenceName: e.target.value })}
              placeholder="Enter name..."
            />
          </div>

          <div>
            <Label>Frame Delay: {settings.frameDelay}ms</Label>
            <Slider
              value={[settings.frameDelay]}
              onValueChange={([v]) => updateSettings({ frameDelay: v })}
              min={100}
              max={2000}
              step={50}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Animation Speed: {settings.animationSpeed.toFixed(1)} FPS</Label>
            <Slider
              value={[settings.animationSpeed * 10]}
              onValueChange={([v]) => updateSettings({ animationSpeed: v / 10 })}
              min={5}
              max={60}
              step={5}
              className="mt-2"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Loop Animation</Label>
            <Switch
              checked={settings.loopAnimation}
              onCheckedChange={(v) => updateSettings({ loopAnimation: v })}
            />
          </div>
        </div>

        {/* Frame Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Frames</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={removeFrame} disabled={settings.frameCount <= 1}>
                <Minus className="w-4 h-4" />
              </Button>
              <span className="px-3 py-1 bg-gray-700 rounded">{settings.frameCount}</span>
              <Button size="sm" variant="outline" onClick={addFrame} disabled={settings.frameCount >= 20}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Frame Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {settings.frames.map((frame) => (
              <Button
                key={frame.frameNumber}
                size="sm"
                variant={selectedFrame === frame.frameNumber ? "default" : "outline"}
                onClick={() => setSelectedFrame(frame.frameNumber)}
                className="min-w-[60px]"
              >
                {frame.frameNumber}
              </Button>
            ))}
          </div>

          {/* Current Frame Editor */}
          {currentFrame && (
            <div className="space-y-4 p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Frame {currentFrame.frameNumber}</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => duplicateFrame(currentFrame.frameNumber)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              
              <div>
                <Label>Frame Name</Label>
                <Input
                  value={currentFrame.frameName}
                  onChange={(e) => updateFrame(currentFrame.frameNumber, { frameName: e.target.value })}
                />
              </div>

              <div>
                <Label>Duration: {currentFrame.duration}ms</Label>
                <Slider
                  value={[currentFrame.duration]}
                  onValueChange={([v]) => updateFrame(currentFrame.frameNumber, { duration: v })}
                  min={100}
                  max={2000}
                  step={50}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Color</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <Label className="text-xs">R</Label>
                    <Input
                      type="number"
                      value={currentFrame.color.r}
                      onChange={(e) => updateFrame(currentFrame.frameNumber, {
                        color: { ...currentFrame.color, r: Number(e.target.value) }
                      })}
                      min={0}
                      max={255}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">G</Label>
                    <Input
                      type="number"
                      value={currentFrame.color.g}
                      onChange={(e) => updateFrame(currentFrame.frameNumber, {
                        color: { ...currentFrame.color, g: Number(e.target.value) }
                      })}
                      min={0}
                      max={255}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">B</Label>
                    <Input
                      type="number"
                      value={currentFrame.color.b}
                      onChange={(e) => updateFrame(currentFrame.frameNumber, {
                        color: { ...currentFrame.color, b: Number(e.target.value) }
                      })}
                      min={0}
                      max={255}
                    />
                  </div>
                </div>
                <div 
                  className="w-full h-8 mt-2 rounded border border-gray-600"
                  style={{ 
                    backgroundColor: `rgb(${currentFrame.color.r}, ${currentFrame.color.g}, ${currentFrame.color.b})` 
                  }}
                />
              </div>

              <div>
                <Label>LED Pattern ({currentFrame.ledPattern.length} LEDs active)</Label>
                <div className="grid grid-cols-8 gap-1 mt-2 max-h-40 overflow-y-auto p-2 bg-gray-800 rounded">
                  {Array.from({ length: settings.ledCount }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => toggleLED(i)}
                      className={`w-8 h-8 rounded text-xs font-mono ${
                        currentFrame.ledPattern.includes(i)
                          ? 'bg-yellow-500 text-black'
                          : 'bg-gray-600 text-gray-400'
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controller Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-gray-600 pb-2">Controller</h3>
          
          <div>
            <Label>Controller Type</Label>
            <Select
              value={settings.controllerType}
              onValueChange={(value: typeof CONTROLLER_TYPES[number]) =>
                updateSettings({ controllerType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="arduino_nano">Arduino Nano</SelectItem>
                <SelectItem value="esp32">ESP32</SelectItem>
                <SelectItem value="xiao_samd21">XIAO SAMD21</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>LED Type</Label>
            <Select
              value={settings.ledType}
              onValueChange={(value: typeof LED_TYPES[number]) =>
                updateSettings({ ledType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ws2812b">WS2812B</SelectItem>
                <SelectItem value="simple_led">Simple LED</SelectItem>
                <SelectItem value="neopixel">NeoPixel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>LED Count</Label>
              <Input
                type="number"
                value={settings.ledCount}
                onChange={(e) => updateSettings({ ledCount: Number(e.target.value) })}
                min={1}
                max={300}
              />
            </div>
            <div>
              <Label>LED Pin</Label>
              <Input
                type="number"
                value={settings.ledPin}
                onChange={(e) => updateSettings({ ledPin: Number(e.target.value) })}
                min={0}
                max={13}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>Include Dimmer</Label>
            <Switch
              checked={settings.includeDimmer}
              onCheckedChange={(v) => updateSettings({ includeDimmer: v })}
            />
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Film className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-5 h-5 mr-2" />
              Export Animation ({settings.frameCount} frames + code)
            </>
          )}
        </Button>

        <div className="text-xs text-gray-400 space-y-1">
          <p>Export includes:</p>
          <ul className="list-disc list-inside space-y-1">
            {settings.frames.map((frame) => (
              <li key={frame.frameNumber}>frame_{frame.frameNumber}_{frame.frameName}.stl</li>
            ))}
            <li>animation_controller.ino</li>
            <li>controller_routing.ino</li>
            <li>wiring_diagram.md</li>
            <li>assembly_instructions.md</li>
            <li>README.md</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Animation Preview Component
 */
function AnimationPreview({ 
  settings, 
  frame 
}: { 
  settings: AnimationSequenceSettings;
  frame: FrameConfig;
}) {
  return (
    <group>
      {/* Sign panel */}
      <mesh>
        <boxGeometry args={[settings.signWidth, settings.signHeight, 2]} />
        <meshStandardMaterial color={0x202020} />
      </mesh>
      
      {/* Active LEDs for current frame */}
      {frame.ledPattern.map((ledIndex) => {
        const position = calculateLEDPosition(ledIndex, settings.ledCount, settings.signWidth, settings.signHeight);
        return (
          <mesh key={ledIndex} position={[position.x, position.y, 2]}>
            <sphereGeometry args={[2, 16, 16]} />
            <meshStandardMaterial
              color={new THREE.Color(frame.color.r / 255, frame.color.g / 255, frame.color.b / 255)}
              emissive={new THREE.Color(frame.color.r / 255, frame.color.g / 255, frame.color.b / 255)}
              emissiveIntensity={0.8}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * Calculate LED position on sign
 */
function calculateLEDPosition(
  ledIndex: number,
  totalLEDs: number,
  signWidth: number,
  signHeight: number
): { x: number; y: number } {
  const ledsPerRow = Math.ceil(Math.sqrt(totalLEDs));
  const row = Math.floor(ledIndex / ledsPerRow);
  const col = ledIndex % ledsPerRow;
  
  const spacingX = signWidth / (ledsPerRow + 1);
  const spacingY = signHeight / (ledsPerRow + 1);
  
  return {
    x: (col + 1) * spacingX - signWidth / 2,
    y: signHeight / 2 - (row + 1) * spacingY,
  };
}
