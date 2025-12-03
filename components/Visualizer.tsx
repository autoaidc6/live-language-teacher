import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  level: number; // 0 to 255
  isActive: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ level, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Animation settings
    let animationFrameId: number;
    const bars = 5;
    const spacing = 10;
    const width = 20;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!isActive) {
        // Draw idle state (pulsing circle)
        ctx.beginPath();
        ctx.arc(centerX, centerY, 10 + Math.sin(Date.now() / 500) * 2, 0, Math.PI * 2);
        ctx.fillStyle = '#94a3b8';
        ctx.fill();
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Draw active visualizer
      const normalizedLevel = Math.max(level, 10) / 255;
      
      ctx.fillStyle = '#6366f1'; // Indigo-500
      
      for (let i = -2; i <= 2; i++) {
        // Create a wave effect based on time and index
        const timeOffset = Date.now() / 200;
        const wave = Math.sin(timeOffset + i);
        const height = 20 + (normalizedLevel * 100) + (wave * 20 * normalizedLevel);
        
        const x = centerX + (i * (width + spacing)) - (width / 2);
        const y = centerY - (height / 2);
        
        // Rounded bars with fallback
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, y, width, height, 10);
        } else {
          ctx.rect(x, y, width, height);
        }
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [level, isActive]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={200} 
      className="w-full h-full max-w-[300px] max-h-[200px]"
    />
  );
};

export default Visualizer;