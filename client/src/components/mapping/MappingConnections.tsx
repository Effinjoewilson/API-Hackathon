"use client";
import { useEffect, useRef } from "react";

interface MappingConnectionsProps {
  mappings: any[];
  containerRef: React.RefObject<HTMLDivElement>;
}

export default function MappingConnections({ mappings, containerRef }: MappingConnectionsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    mappings.forEach((mapping, index) => {
      const sourceElement = container.querySelector(`[data-source-path="${mapping.source_path}"]`);
      const targetElement = container.querySelector(`[data-target-column="${mapping.target_column}"]`);

      if (sourceElement && targetElement) {
        const sourceRect = sourceElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        const startX = sourceRect.right - containerRect.left;
        const startY = sourceRect.top + sourceRect.height / 2 - containerRect.top;
        const endX = targetRect.left - containerRect.left;
        const endY = targetRect.top + targetRect.height / 2 - containerRect.top;

        // Draw bezier curve
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        
        const controlPoint1X = startX + (endX - startX) / 3;
        const controlPoint2X = endX - (endX - startX) / 3;
        
        ctx.bezierCurveTo(
          controlPoint1X, startY,
          controlPoint2X, endY,
          endX, endY
        );

        // Set line style based on validation
        const validation = mapping.validation;
        if (validation?.compatible && !validation?.conversion_needed) {
          ctx.strokeStyle = '#10b981'; // Green
          ctx.lineWidth = 2;
        } else if (validation?.compatible) {
          ctx.strokeStyle = '#f59e0b'; // Yellow
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
        } else {
          ctx.strokeStyle = '#ef4444'; // Red
          ctx.lineWidth = 2;
          ctx.setLineDash([2, 2]);
        }

        ctx.stroke();
        ctx.setLineDash([]); // Reset dash
      }
    });
  }, [mappings, containerRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}