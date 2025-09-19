'use client';
import { useRef, useEffect, useCallback, useMemo } from 'react';
import { gsap } from 'gsap';
import './DotGrid.css';

const throttle = (fn, limit) => {
  let last = 0; return (...args) => { const now = performance.now(); if (now - last >= limit) { last = now; fn(...args); } };
};
const hexToRgb = (hex) => {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return { r:0,g:0,b:0 }; return { r:parseInt(m[1],16), g:parseInt(m[2],16), b:parseInt(m[3],16) };
};

export default function DotGrid({
  dotSize=10, gap=16,
  baseColor='#26253a',
  activeColor='#00E5FF',      // cyan party vibe (try '#FF2D95' for pink)
  proximity=120,
  shockRadius=250, shockStrength=5,
  resistance=750, returnDuration=1.5,
  speedTrigger=120, maxSpeed=5000,
  className='', style
}){
  const wrapperRef = useRef(null);
  const canvasRef  = useRef(null);
  const dotsRef    = useRef([]);
  const pointerRef = useRef({ x:0,y:0,vx:0,vy:0,speed:0,lastTime:0,lastX:0,lastY:0 });

  // Make inertia optional (works without Club GSAP)
  let hasInertia = false;
  try {
    // eslint-disable-next-line import/no-unresolved
    const { InertiaPlugin } = require('gsap/InertiaPlugin');
    gsap.registerPlugin(InertiaPlugin);
    hasInertia = true;
  } catch {}

  const baseRgb   = useMemo(()=>hexToRgb(baseColor), [baseColor]);
  const activeRgb = useMemo(()=>hexToRgb(activeColor), [activeColor]);

  const circlePath = useMemo(() => {
    if (typeof window === 'undefined' || !window.Path2D) return null;
    const p = new window.Path2D(); p.arc(0,0,dotSize/2,0,Math.PI*2); return p;
  }, [dotSize]);

  const buildGrid = useCallback(() => {
    const wrap = wrapperRef.current, canvas = canvasRef.current; if (!wrap || !canvas) return;
    const { width, height } = wrap.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr; canvas.height = height * dpr; canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d'); if (ctx) ctx.scale(dpr, dpr);

    const cols = Math.floor((width + gap) / (dotSize + gap));
    const rows = Math.floor((height + gap) / (dotSize + gap));
    const cell = dotSize + gap;

    const gridW = cell * cols - gap, gridH = cell * rows - gap;
    const startX = (width - gridW) / 2 + dotSize / 2;
    const startY = (height - gridH) / 2 + dotSize / 2;

    const dots = [];
    for (let y=0; y<rows; y++){
      for (let x=0; x<cols; x++){
        const cx = startX + x*cell, cy = startY + y*cell;
        dots.push({ cx, cy, xOffset:0, yOffset:0, _inertiaApplied:false });
      }
    }
    dotsRef.current = dots;
  }, [dotSize, gap]);

  useEffect(() => {
    if (!circlePath) return;
    let rafId; const proxSq = proximity*proximity;
    const draw = () => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      const { x:px, y:py } = pointerRef.current;

      for (const dot of dotsRef.current){
        const ox = dot.cx + dot.xOffset, oy = dot.cy + dot.yOffset;
        const dx = dot.cx - px, dy = dot.cy - py, dsq = dx*dx + dy*dy;
        let style = baseColor;
        if (dsq <= proxSq){
          const dist = Math.sqrt(dsq), t = 1 - dist / proximity;
          const r = Math.round(baseRgb.r + (activeRgb.r - baseRgb.r) * t);
          const g = Math.round(baseRgb.g + (activeRgb.g - baseRgb.g) * t);
          const b = Math.round(baseRgb.b + (activeRgb.b - baseRgb.b) * t);
          style = `rgb(${r},${g},${b})`;
        }
        ctx.save(); ctx.translate(ox, oy); ctx.fillStyle = style; ctx.fill(circlePath); ctx.restore();
      }
      rafId = requestAnimationFrame(draw);
    };
    draw(); return () => cancelAnimationFrame(rafId);
  }, [proximity, baseColor, baseRgb, activeRgb, circlePath]);

  useEffect(() => {
    buildGrid();
    let ro=null; if ('ResizeObserver' in window){ ro = new ResizeObserver(buildGrid); wrapperRef.current && ro.observe(wrapperRef.current); }
    else window.addEventListener('resize', buildGrid);
    return () => { if (ro) ro.disconnect(); else window.removeEventListener('resize', buildGrid); };
  }, [buildGrid]);

  useEffect(() => {
    const onMove = (e) => {
      const now = performance.now(); const pr = pointerRef.current; const dt = pr.lastTime ? now - pr.lastTime : 16;
      const dx = e.clientX - pr.lastX; const dy = e.clientY - pr.lastY;
      let vx = (dx/dt)*1000, vy = (dy/dt)*1000, speed = Math.hypot(vx,vy);
      if (speed > maxSpeed){ const s = maxSpeed/speed; vx*=s; vy*=s; speed = maxSpeed; }
      pr.lastTime = now; pr.lastX = e.clientX; pr.lastY = e.clientY; pr.vx=vx; pr.vy=vy; pr.speed=speed;

      const rect = canvasRef.current.getBoundingClientRect(); pr.x = e.clientX - rect.left; pr.y = e.clientY - rect.top;

      for (const dot of dotsRef.current){
        const dist = Math.hypot(dot.cx - pr.x, dot.cy - pr.y);
        if (hasInertia && speed > speedTrigger && dist < proximity && !dot._inertiaApplied){
          dot._inertiaApplied = true; gsap.killTweensOf(dot);
          const pushX = dot.cx - pr.x + vx * 0.005, pushY = dot.cy - pr.y + vy * 0.005;
          gsap.to(dot, { inertia:{ xOffset:pushX, yOffset:pushY, resistance },
            onComplete: () => { gsap.to(dot,{ xOffset:0, yOffset:0, duration:returnDuration, ease:'elastic.out(1,0.75)' }); dot._inertiaApplied = false; } });
        }
      }
    };
    const onClick = (e) => {
      const rect = canvasRef.current.getBoundingClientRect(); const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
      for (const dot of dotsRef.current){
        const dist = Math.hypot(dot.cx - cx, dot.cy - cy);
        if (dist < shockRadius && !dot._inertiaApplied){
          dot._inertiaApplied = true; gsap.killTweensOf(dot);
          const fall = Math.max(0, 1 - dist / shockRadius);
          const pushX = (dot.cx - cx) * shockStrength * fall; const pushY = (dot.cy - cy) * shockStrength * fall;
          gsap.to(dot, { xOffset: pushX * 0.05, yOffset: pushY * 0.05, duration: 0.35, ease: 'power2.out',
            onComplete: () => { gsap.to(dot,{ xOffset:0, yOffset:0, duration:returnDuration, ease:'elastic.out(1,0.75)' }); dot._inertiaApplied = false; } });
        }
      }
    };
    const throttled = throttle(onMove, 50);
    window.addEventListener('mousemove', throttled, { passive:true });
    window.addEventListener('click', onClick);
    return () => { window.removeEventListener('mousemove', throttled); window.removeEventListener('click', onClick); };
  }, [proximity, resistance, returnDuration, shockRadius, shockStrength, speedTrigger, maxSpeed]);

  return (
    <section className={`dot-grid ${className}`} style={{ height:'100%', width:'100%', ...style }}>
      <div ref={wrapperRef} className="dot-grid__wrap">
        <canvas ref={canvasRef} className="dot-grid__canvas" />
      </div>
    </section>
  );
}
