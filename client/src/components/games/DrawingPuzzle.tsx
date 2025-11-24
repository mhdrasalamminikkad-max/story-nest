import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GameResult } from "@shared/schema";
import { Palette, Eraser, Trash2 } from "lucide-react";

interface DrawingPuzzleProps {
  storyId: string;
  storyTitle: string;
  storyContent: string;
  onComplete: (result: GameResult) => void;
}

const COLORS = [
  "#FF6B6B", // red
  "#4ECDC4", // teal
  "#45B7D1", // blue
  "#FFA07A", // orange
  "#98D8C8", // mint
  "#F7DC6F", // yellow
  "#BB8FCE", // purple
  "#85C1E2", // sky blue
];

export function DrawingPuzzle({ storyId, onComplete }: DrawingPuzzleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [lineWidth, setLineWidth] = useState(5);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;

    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = lineWidth;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleComplete = () => {
    if (!hasDrawn) return;
    
    onComplete({
      storyId,
      gameType: "drawing",
      score: 10,
      totalScore: 10,
    });
  };

  return (
    <div className="space-y-4" data-testid="game-drawing">
      <div className="text-center">
        <p className="text-muted-foreground mb-4">
          Draw something from the story you just read!
        </p>
      </div>

      <Card className="p-4">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="w-full border-2 border-border rounded-md touch-none bg-white"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          data-testid="canvas-drawing"
        />
      </Card>

      <div className="flex gap-2 items-center flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((color) => (
            <button
              key={color}
              className={`w-8 h-8 rounded-full border-2 transition-transform ${
                selectedColor === color ? "border-foreground scale-110" : "border-border"
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
              data-testid={`color-${color}`}
            />
          ))}
        </div>

        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setLineWidth(lineWidth === 5 ? 10 : 5)}
            data-testid="button-brush-size"
          >
            <Palette className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={clearCanvas}
            data-testid="button-clear"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleComplete}
          disabled={!hasDrawn}
          size="lg"
          data-testid="button-submit-drawing"
        >
          Submit Drawing
        </Button>
      </div>
    </div>
  );
}
