import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';

export interface CaptchaRef {
  refresh: () => void;
  getCode: () => string;
  verify: (userInput: string) => boolean;
}

interface CaptchaProps {
  onCodeChange?: (code: string) => void;
  length?: number;
}

// Characters excluding visually ambiguous letters (0/O, 1/I/l)
const CAPTCHA_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export const Captcha = forwardRef<CaptchaRef, CaptchaProps>(({ onCodeChange, length = 5 }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentCode, setCurrentCode] = useState<string>('');
  const [isRotating, setIsRotating] = useState<boolean>(false);

  const generateRandomCode = (len: number): string => {
    let result = '';
    for (let i = 0; i < len; i++) {
      const idx = Math.floor(Math.random() * CAPTCHA_CHARS.length);
      result += CAPTCHA_CHARS.charAt(idx);
    }
    return result;
  };

  const drawCaptcha = (code: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Dark textured canvas background
    ctx.fillStyle = '#161917';
    ctx.fillRect(0, 0, width, height);

    // 2. Subtle grid pattern
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 10; x < width; x += 15) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 10; y < height; y += 15) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 3. Random noise interference lines
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(74, 222, 128, 0.35)' : 'rgba(217, 119, 6, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.bezierCurveTo(
        Math.random() * width,
        Math.random() * height,
        Math.random() * width,
        Math.random() * height,
        Math.random() * width,
        Math.random() * height
      );
      ctx.stroke();
    }

    // 4. Random noise dots
    for (let i = 0; i < 35; i++) {
      ctx.fillStyle = `rgba(${150 + Math.random() * 100}, ${150 + Math.random() * 100}, ${150 + Math.random() * 100}, ${0.2 + Math.random() * 0.4})`;
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Draw each character with slight rotation and distortion
    const charSpacing = width / (code.length + 1);
    const fonts = ['Georgia', 'Courier New', 'Trebuchet MS', 'Arial'];
    const colors = ['#f5f2e9', '#c5a059', '#34d399', '#fde68a', '#e2e8f0'];

    for (let i = 0; i < code.length; i++) {
      const char = code.charAt(i);
      ctx.save();

      const x = charSpacing * (i + 0.8) + (Math.random() * 4 - 2);
      const y = height / 2 + 7 + (Math.random() * 6 - 3);

      const angle = (Math.random() * 36 - 18) * (Math.PI / 180);
      ctx.translate(x, y);
      ctx.rotate(angle);

      const font = fonts[i % fonts.length];
      const fontSize = Math.floor(height * 0.58 + Math.random() * 4);
      ctx.font = `bold ${fontSize}px ${font}`;
      ctx.fillStyle = colors[i % colors.length];
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      ctx.fillText(char, -fontSize / 3.5, 0);
      ctx.restore();
    }
  };

  const refresh = () => {
    setIsRotating(true);
    const newCode = generateRandomCode(length);
    setCurrentCode(newCode);
    drawCaptcha(newCode);
    if (onCodeChange) onCodeChange(newCode);
    setTimeout(() => setIsRotating(false), 500);
  };

  useEffect(() => {
    refresh();
  }, [length]);

  useImperativeHandle(ref, () => ({
    refresh,
    getCode: () => currentCode,
    verify: (userInput: string) => {
      if (!userInput) return false;
      return userInput.trim().toUpperCase() === currentCode.toUpperCase();
    },
  }));

  return (
    <div className="flex items-center gap-3">
      <div className="relative rounded-xl overflow-hidden border border-admin-border/80 bg-black/40 shadow-inner flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={150}
          height={48}
          className="block cursor-pointer select-none"
          onClick={refresh}
          title="Click to refresh Captcha"
        />
        <div className="absolute top-1 left-1.5 pointer-events-none opacity-40">
          <ShieldCheck className="w-3 h-3 text-admin-gold" />
        </div>
      </div>

      <button
        type="button"
        onClick={refresh}
        title="Generate new Captcha code"
        className="p-2.5 rounded-xl bg-admin-card hover:bg-admin-border border border-admin-border text-admin-muted hover:text-admin-gold transition-all active:scale-95"
      >
        <RefreshCw className={`w-4 h-4 ${isRotating ? 'animate-spin text-admin-gold' : ''}`} />
      </button>
    </div>
  );
});

Captcha.displayName = 'Captcha';
