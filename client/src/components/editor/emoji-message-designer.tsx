import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Plus, X } from "lucide-react";
import { toast } from "sonner";

// Popular emoji suggestions for quick access
const SUGGESTED_EMOJIS = [
  "😂", "❤️", "🔥", "😭", "🙏", "😍", "👍", "💯", "🤔", "💀",
  "😊", "😁", "😎", "😉", "😘", "😱", "😠", "😢", "😴", "🥳",
  "🚀", "⭐", "⚡", "🎉", "🎂", "🎁", "🌈", "🌹", "🦋", "☀️"
];

const LED_TYPES = [
  { value: "6mm", label: "6mm Neon Strip" },
  { value: "8mm", label: "8mm Neon Strip" },
  { value: "10.5mm", label: "10.5mm Neon Strip" },
  { value: "14mm", label: "14mm Neon Strip" }
];

export function EmojiMessageDesigner() {
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const [emojiInput, setEmojiInput] = useState("");
  const [layout, setLayout] = useState<"grid" | "linear">("grid");
  const [gridColumns, setGridColumns] = useState(3);
  const [spacing, setSpacing] = useState(20);
  const [emojiSize, setEmojiSize] = useState(50);
  const [ledType, setLedType] = useState("10.5mm");
  const [signHeight, setSignHeight] = useState(15);
  const [wallThickness, setWallThickness] = useState(3);
  const [baseThickness, setBaseThickness] = useState(3);
  const [wireHoleSpacing, setWireHoleSpacing] = useState(50);
  const [includeBorder, setIncludeBorder] = useState(false);
  const [borderWidth, setBorderWidth] = useState(10);
  const [borderPadding, setBorderPadding] = useState(15);
  const [isExporting, setIsExporting] = useState(false);

  const addEmoji = (emoji: string) => {
    if (emoji && !selectedEmojis.includes(emoji)) {
      setSelectedEmojis(prev => [...prev, emoji]);
      setEmojiInput("");
    }
  };

  const removeEmoji = (index: number) => {
    setSelectedEmojis(prev => prev.filter((_, i) => i !== index));
  };

  const handleEmojiInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && emojiInput.trim()) {
      // Extract emojis from input (supports pasting multiple emojis)
      const emojis = Array.from(emojiInput);
      emojis.forEach(emoji => {
        if (emoji.trim() && !selectedEmojis.includes(emoji)) {
          addEmoji(emoji);
        }
      });
      setEmojiInput("");
    }
  };

  const handleExport = async () => {
    if (selectedEmojis.length === 0) {
      toast.error("Please select at least one emoji");
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch("/api/export/emoji-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emojis: selectedEmojis,
          layout,
          gridColumns,
          spacing,
          emojiSize,
          ledType,
          signHeight,
          wallThickness,
          baseThickness,
          wireHoleSpacing,
          includeBorder,
          borderWidth,
          borderPadding
        })
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Emoji_Message_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Emoji message exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export emoji message");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Emoji Message Designer</h3>
        <p className="text-sm text-muted-foreground">
          Create custom emoji signs with LED channels
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Selected Emojis ({selectedEmojis.length})
          </Label>
          <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg min-h-[60px]">
            {selectedEmojis.length === 0 ? (
              <span className="text-sm text-muted-foreground">Add emojis below...</span>
            ) : (
              selectedEmojis.map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => removeEmoji(idx)}
                  className="relative text-3xl p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-all group"
                  title="Click to remove"
                >
                  {emoji}
                  <span className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-4 w-4 text-destructive bg-background rounded-full" />
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="emojiInput">Add Emoji</Label>
          <div className="flex gap-2">
            <Input
              id="emojiInput"
              type="text"
              placeholder="Type or paste emoji (😊❤️🔥) and press Enter"
              value={emojiInput}
              onChange={(e) => setEmojiInput(e.target.value)}
              onKeyDown={handleEmojiInputKeyDown}
              className="text-2xl"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                if (emojiInput.trim()) {
                  const emojis = Array.from(emojiInput);
                  emojis.forEach(emoji => {
                    if (emoji.trim() && !selectedEmojis.includes(emoji)) {
                      addEmoji(emoji);
                    }
                  });
                  setEmojiInput("");
                }
              }}
              disabled={!emojiInput.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            💡 Tip: You can paste multiple emojis at once or use your system's emoji picker (Windows: Win+. | Mac: Cmd+Ctrl+Space)
          </p>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">Popular Emojis</Label>
          <div className="grid grid-cols-10 gap-1">
            {SUGGESTED_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => addEmoji(emoji)}
                className={`text-2xl p-1 rounded transition-all hover:scale-110 ${
                  selectedEmojis.includes(emoji)
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-muted"
                }`}
                disabled={selectedEmojis.includes(emoji)}
                title={selectedEmojis.includes(emoji) ? "Already added" : "Click to add"}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold">Layout Settings</h4>

        <div className="space-y-2">
          <Label htmlFor="layout">Layout Type</Label>
          <Select value={layout} onValueChange={(v) => setLayout(v as "grid" | "linear")}>
            <SelectTrigger id="layout">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">Grid</SelectItem>
              <SelectItem value="linear">Linear (Row)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {layout === "grid" && (
          <div className="space-y-2">
            <Label htmlFor="gridColumns">Grid Columns: {gridColumns}</Label>
            <Slider
              id="gridColumns"
              min={1}
              max={6}
              step={1}
              value={[gridColumns]}
              onValueChange={(v) => setGridColumns(v[0])}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="spacing">Emoji Spacing: {spacing}mm</Label>
          <Slider
            id="spacing"
            min={5}
            max={50}
            step={5}
            value={[spacing]}
            onValueChange={(v) => setSpacing(v[0])}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emojiSize">Emoji Size: {emojiSize}mm</Label>
          <Slider
            id="emojiSize"
            min={30}
            max={100}
            step={5}
            value={[emojiSize]}
            onValueChange={(v) => setEmojiSize(v[0])}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold">Border Settings</h4>

        <div className="flex items-center justify-between">
          <Label htmlFor="includeBorder">Include Border Frame</Label>
          <Switch
            id="includeBorder"
            checked={includeBorder}
            onCheckedChange={setIncludeBorder}
          />
        </div>

        {includeBorder && (
          <>
            <div className="space-y-2">
              <Label htmlFor="borderWidth">Border Width: {borderWidth}mm</Label>
              <Slider
                id="borderWidth"
                min={5}
                max={30}
                step={5}
                value={[borderWidth]}
                onValueChange={(v) => setBorderWidth(v[0])}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="borderPadding">Border Padding: {borderPadding}mm</Label>
              <Slider
                id="borderPadding"
                min={10}
                max={50}
                step={5}
                value={[borderPadding]}
                onValueChange={(v) => setBorderPadding(v[0])}
              />
            </div>
          </>
        )}
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold">Shell Configuration</h4>

        <div className="space-y-2">
          <Label htmlFor="ledType">LED Type</Label>
          <Select value={ledType} onValueChange={setLedType}>
            <SelectTrigger id="ledType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LED_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="signHeight">Sign Height: {signHeight}mm</Label>
          <Slider
            id="signHeight"
            min={10}
            max={30}
            step={1}
            value={[signHeight]}
            onValueChange={(v) => setSignHeight(v[0])}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="wallThickness">Wall: {wallThickness}mm</Label>
            <Slider
              id="wallThickness"
              min={2}
              max={5}
              step={0.5}
              value={[wallThickness]}
              onValueChange={(v) => setWallThickness(v[0])}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseThickness">Base: {baseThickness}mm</Label>
            <Slider
              id="baseThickness"
              min={2}
              max={5}
              step={0.5}
              value={[baseThickness]}
              onValueChange={(v) => setBaseThickness(v[0])}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="wireHoleSpacing">Wire Hole Spacing: {wireHoleSpacing}mm</Label>
          <Slider
            id="wireHoleSpacing"
            min={30}
            max={100}
            step={10}
            value={[wireHoleSpacing]}
            onValueChange={(v) => setWireHoleSpacing(v[0])}
          />
        </div>
      </div>

      <Button
        onClick={handleExport}
        disabled={isExporting || selectedEmojis.length === 0}
        className="w-full"
        size="lg"
      >
        <Download className="mr-2 h-4 w-4" />
        {isExporting ? "Generating..." : "Generate Emoji Message"}
      </Button>

      {selectedEmojis.length === 0 && (
        <p className="text-xs text-center text-muted-foreground">
          Select at least one emoji to enable export
        </p>
      )}
    </div>
  );
}
