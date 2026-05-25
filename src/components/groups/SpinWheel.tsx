import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export const SpinWheel = ({ members, onClose }: { members: string[], onClose?: () => void }) => {
  const [result, setResult] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const location = useLocation();

  // Close on navigation
  useEffect(() => {
    if (onClose) {
      onClose();
    }
  }, [location.pathname, onClose]);

  const spin = () => {
    if (spinning || members.length === 0) return;
    setSpinning(true);
    setResult(null);
    // Simulate spin duration
    setTimeout(() => {
      const winner = members[Math.floor(Math.random() * members.length)];
      setResult(winner);
      setSpinning(false);
    }, 2000);
  };

  const resetSpin = () => {
    setResult(null);
    setSpinning(false);
  };

  return (
    <div className="relative p-6 bg-white/5 rounded-3xl border border-white/10 text-center shadow-xl">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Close Spin Wheel"
        >
          <X className="h-5 w-5 text-white" />
        </button>
      )}

      <h3 className="text-xl font-black text-white uppercase mb-4 mt-2">🎡 Who Pays Next?</h3>
      
      <div className={`h-32 w-32 mx-auto rounded-full border-4 border-pink-500 flex items-center justify-center transition-all ${spinning ? 'animate-spin border-dashed' : ''}`}>
        {spinning ? '🔄' : <span className="text-4xl">💸</span>}
      </div>

      <div className="mt-6 h-12 flex items-center justify-center">
        {result && <p className="text-emerald-400 font-bold text-lg animate-in fade-in zoom-in">👉 {result} will pay!</p>}
      </div>

      <div className="mt-4 flex gap-3 flex-col sm:flex-row">
        {result ? (
          <Button onClick={resetSpin} className="bg-white/10 hover:bg-white/20 text-white font-bold w-full rounded-xl transition-all h-12">
            Spin Again!
          </Button>
        ) : (
          <Button onClick={spin} disabled={spinning || members.length === 0} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold w-full rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all active:scale-95 h-12 disabled:opacity-50">
            {spinning ? 'Spinning...' : 'Spin the Wheel!'}
          </Button>
        )}
      </div>
    </div>
  );
};