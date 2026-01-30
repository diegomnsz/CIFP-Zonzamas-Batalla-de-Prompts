
import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';

interface TimerProps {
  initialSeconds: number;
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
  onFinish: () => void;
  onDurationChange: (seconds: number) => void;
}

const Timer: React.FC<TimerProps> = ({ 
  initialSeconds, 
  isRunning, 
  onToggle, 
  onReset, 
  onFinish,
  onDurationChange
}) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [customMinutes, setCustomMinutes] = useState(Math.floor(initialSeconds / 60));

  useEffect(() => {
    setTimeLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    let interval: number;
    if (isRunning && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      onFinish();
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => console.log("Audio play blocked"));
      onToggle(); // Stop timer
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onFinish, onToggle]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSetDuration = (e: React.FormEvent) => {
    e.preventDefault();
    onDurationChange(customMinutes * 60);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 border-4 border-black halftone-pattern">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-2xl font-comic text-red-600">
          <Clock className="w-8 h-8" />
          <span>TIEMPO DE MISIÓN</span>
        </div>
        
        <div className={`text-7xl font-comic tabular-nums ${timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-black'}`}>
          {formatTime(timeLeft)}
        </div>

        <div className="flex gap-4">
          <button 
            onClick={onToggle}
            className={`p-4 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-1 ${isRunning ? 'bg-yellow-400' : 'bg-green-400'}`}
          >
            {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
          </button>
          <button 
            onClick={onReset}
            className="p-4 rounded-full bg-blue-400 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-1"
          >
            <RotateCcw className="w-8 h-8" />
          </button>
        </div>

        <form onSubmit={handleSetDuration} className="mt-4 flex items-center gap-2">
          <input 
            type="number" 
            min="1" 
            max="30"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 0)}
            className="w-16 p-2 border-2 border-black rounded-lg text-center font-bold"
          />
          <span className="font-bold">minutos</span>
          <button type="submit" className="px-4 py-2 bg-gray-800 text-white rounded-lg font-bold hover:bg-black transition-colors">
            Ajustar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Timer;
