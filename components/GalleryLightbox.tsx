'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface LightboxProps {
  images: string[];
  startIndex: number;
  onClose: () => void;
}

function Lightbox({ images, startIndex, onClose }: LightboxProps) {
  const [current, setCurrent] = useState(startIndex);

  const goPrev = useCallback(() => setCurrent((c) => (c - 1 + images.length) % images.length), [images.length]);
  const goNext = useCallback(() => setCurrent((c) => (c + 1) % images.length), [images.length]);

  useEffect(() => {
    const saved = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = saved; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, goPrev, goNext]);

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.97)', display: 'flex', flexDirection: 'column' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', flexShrink: 0 }}>
        <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          Close
        </button>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{current + 1} / {images.length}</span>
        <div style={{ width: 80 }} />
      </div>
      <div onClick={(e) => e.stopPropagation()} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '0 64px' }}>
        <img key={current} src={images[current]} alt={`Photo ${current + 1}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 4, userSelect: 'none', display: 'block' }} />
        {images.length > 1 && (
          <button onClick={goPrev} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
        )}
        {images.length > 1 && (
          <button onClick={goNext} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        )}
      </div>
      <div style={{ height: 24, flexShrink: 0 }} />
    </div>,
    document.body
  );
}

interface GalleryLightboxProps {
  images: string[];
  communityName?: string;
}

export default function GalleryLightbox({ images, communityName }: GalleryLightboxProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (!images || images.length === 0) return null;
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
        {images.map((url, i) => (
          <button key={i} onClick={() => setOpenIndex(i)} style={{ padding: 0, border: 'none', cursor: 'pointer', borderRadius: 12, overflow: 'hidden', aspectRatio: '4/3', background: '#f3f4f6' }}>
            <img src={url} alt={`${communityName ?? 'Gallery'} photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </button>
        ))}
      </div>
      {openIndex !== null && <Lightbox images={images} startIndex={openIndex} onClose={() => setOpenIndex(null)} />}
    </>
  );
}
