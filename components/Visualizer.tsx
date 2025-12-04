import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ analyser, isActive }) => {
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
    const gradient = ctx.createLinearGradient(0, rect.height, 0, 0);
    gradient.addColorStop(0, '#6366f1'); // Indigo 500
    gradient.addColorStop(0.5, '#a855f7'); // Purple 500
    gradient.addColorStop(1, '#ec4899'); // Pink 500

    // Data buffer
    const bufferLength = analyser ? analyser.frequencyBinCount : 0;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      const width = rect.width;
      const height = rect.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      if (!isActive || !analyser) {
        // Idle animation: Breathing circle
        const time = Date.now() / 1000;
        const radius = 20 + Math.sin(time * 2) * 2;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 5, 0, Math.PI * 2);
        ctx.fillStyle = '#f1f5f9';
        ctx.fill();
        
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Get real frequency data
      analyser.getByteFrequencyData(dataArray);

      // Config
      const bars = 40; // Number of bars on one side (total = bars * 2)
      const barWidth = (width / 2) / bars - 2;
      const maxBarHeight = height * 0.8;
      
      ctx.fillStyle = gradient;

      // Draw mirrored spectrum
      for (let i = 0; i < bars; i++) {
        // Map bar index to frequency bin (logarithmic or linear mapping)
        // We skip the very low frequencies (index 0-4) as they are often DC offset or rumble
        const binIndex = Math.floor((i / bars) * (bufferLength / 2)) + 2; 
        const value = dataArray[binIndex] || 0;
        
        // Smooth scaling
        const percent = value / 255;
        const barHeight = Math.max(4, percent * maxBarHeight);
        
        // Right side
        const xRight = centerX + (i * (barWidth + 2));
        const y = centerY - (barHeight / 2);
        
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(xRight, y, barWidth, barHeight, 4);
        } else {
          ctx.rect(xRight, y, barWidth, barHeight);
        }
        ctx.fill();

        // Left side (Mirror)
        const xLeft = centerX - ((i + 1) * (barWidth + 2));
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(xLeft, y, barWidth, barHeight, 4);
        } else {
          ctx.rect(xLeft, y, barWidth, barHeight);
        }
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [analyser, isActive]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default Visualizer;