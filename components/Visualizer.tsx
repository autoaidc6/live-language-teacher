import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
  barColorStart?: string;
  barColorEnd?: string;
}

const Visualizer: React.FC<VisualizerProps> = ({ 
  analyser, 
  isActive,
  barColorStart = '#818cf8', // Indigo 400
  barColorEnd = '#ec4899'    // Pink 500
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    let animationFrameId: number;
    
    // Gradient
    const gradient = ctx.createLinearGradient(0, 0, rect.width, 0);
    gradient.addColorStop(0, barColorStart);
    gradient.addColorStop(1, barColorEnd);

    // Data buffer
    const bufferLength = analyser ? analyser.frequencyBinCount : 0;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      const width = rect.width;
      const height = rect.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      if (!isActive || !analyser) {
        return; // Render nothing if not active (controlled by parent now)
      }

      // Get real frequency data
      analyser.getByteFrequencyData(dataArray);

      // Config for a "Voice Memo" style wave
      const bars = 60; 
      const step = Math.floor(bufferLength / bars);
      const barWidth = (width / bars) * 0.6; // Thin bars with space
      const gap = (width / bars) * 0.4;
      const maxBarHeight = height * 0.9;
      
      ctx.fillStyle = gradient;

      for (let i = 0; i < bars; i++) {
        // We focus on the vocal range (skipping very low and very high freq)
        const dataIndex = Math.floor(i * step) + 4; 
        const value = dataArray[dataIndex] || 0;
        
        // Non-linear scale for better visual representation of voice
        const percent = Math.pow(value / 255, 1.5); 
        
        // Minimum height to show the "track" even when silent
        const barHeight = Math.max(4, percent * maxBarHeight);
        
        const x = i * (barWidth + gap) + (gap / 2);
        const y = centerY - (barHeight / 2);
        
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, y, barWidth, barHeight, 50); // Fully rounded caps
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [analyser, isActive, barColorStart, barColorEnd]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default Visualizer;