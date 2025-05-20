import React, { useEffect, useRef } from 'react';

const MagicCursor: React.FC = () => {
  const blobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (blobRef.current) {
        blobRef.current.style.left = `${e.clientX - 80}px`;
        blobRef.current.style.top = `${e.clientY - 80}px`;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={blobRef}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: 260,
        height: 260,
        pointerEvents: 'none',
        zIndex: 9999,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 40% 40%, #6C63FF 0%, #FF6584 60%, #FFD600 100%)',
        filter: 'blur(80px)',
        opacity: 0.65,
        transition: 'left 0.28s cubic-bezier(.4,2,.6,1), top 0.28s cubic-bezier(.4,2,.6,1)',
        mixBlendMode: 'screen',
      }}
    />
  );
};

export default MagicCursor; 