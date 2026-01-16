import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { presetShapes, getShapesByCategory } from "@shared/preset-shapes";
import { Sparkles } from "lucide-react";

export function PresetShapesEditor() {
  const [selectedPreset, setSelectedPreset] = useState<string>("");

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = presetShapes.find(p => p.id === presetId);
    
    if (preset) {
      console.log('Selected preset:', preset);
      // This will be integrated with Sign-Sculptor's shape generation system
    }
  };

  const generatePreview = () => {
    if (!selectedPreset) return;
    
    const preset = presetShapes.find(p => p.id === selectedPreset);
    if (!preset) return;

    // This would trigger your existing 3D generation pipeline
    // You'll need to convert the SVG path to your internal shape format
    console.log('Generating 3D preview for:', preset.name);
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Preset Shapes
          </CardTitle>
          <CardDescription>
            Choose from 40+ iconic designs - retro tech, space, stick figures, emoji faces, and more
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="preset-select">Select Shape</Label>
            <Select value={selectedPreset} onValueChange={handlePresetSelect}>
              <SelectTrigger id="preset-select">
                <SelectValue placeholder="Choose a preset shape..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>🎮 Retro Tech</SelectLabel>
                  {getShapesByCategory('retro').map(shape => (
                    <SelectItem key={shape.id} value={shape.id}>
                      {shape.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
                
                <SelectGroup>
                  <SelectLabel>🪐 Space & Planets</SelectLabel>
                  {getShapesByCategory('space').map(shape => (
                    <SelectItem key={shape.id} value={shape.id}>
                      {shape.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
                
                <SelectGroup>
                  <SelectLabel>🍔 Food & Drink</SelectLabel>
                  {getShapesByCategory('food').map(shape => (
                    <SelectItem key={shape.id} value={shape.id}>
                      {shape.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
                
                <SelectGroup>
                  <SelectLabel>🎲 Games & Dice</SelectLabel>
                  {getShapesByCategory('games').map(shape => (
                    <SelectItem key={shape.id} value={shape.id}>
                      {shape.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
                
                <SelectGroup>
                  <SelectLabel>🕶️ Objects</SelectLabel>
                  {getShapesByCategory('objects').map(shape => (
                    <SelectItem key={shape.id} value={shape.id}>
                      {shape.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
                
                <SelectGroup>
                  <SelectLabel>🦖 Nature & Animals</SelectLabel>
                  {getShapesByCategory('nature').map(shape => (
                    <SelectItem key={shape.id} value={shape.id}>
                      {shape.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
                
                <SelectGroup>
                  <SelectLabel>🚶 Stick Figures</SelectLabel>
                  {getShapesByCategory('stickFigures').map(shape => (
                    <SelectItem key={shape.id} value={shape.id}>
                      {shape.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
                
                <SelectGroup>
                  <SelectLabel>😊 Emoji Faces</SelectLabel>
                  {getShapesByCategory('emojiFaces').map(shape => (
                    <SelectItem key={shape.id} value={shape.id}>
                      {shape.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {selectedPreset && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {presetShapes.find(p => p.id === selectedPreset)?.description}
              </div>
              
              <Button 
                onClick={generatePreview} 
                className="w-full"
                size="lg"
              >
                Generate 3D Preview
              </Button>
            </div>
          )}

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Pro Tip:</strong> These simple, iconic shapes are perfect for neon signs and light bulbs. 
              Nostalgic designs like stick figures and retro tech are what people actually put on their walls!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
