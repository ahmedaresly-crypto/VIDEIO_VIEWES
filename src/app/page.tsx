"use client";

import { useEffect, useState } from 'react';
import fpPromise from '@fingerprintjs/fingerprintjs';

export default function Home() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [logSent, setLogSent] = useState(false);

  useEffect(() => {
    // Fetch video URL
    fetch('/api/video')
      .then(res => res.json())
      .then(data => {
        setVideoUrl(data.videoUrl);
        setLoading(false);
      });
  }, []);

  const handlePlay = async () => {
    if (logSent) return;

    try {
      // Get fingerprint
      const fp = await fpPromise.load();
      const result = await fp.get();
      const fingerprint = result.visitorId;
      
      let latitude = null;
      let longitude = null;

      // Get geolocation if supported
      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch (geoError) {
          console.warn("Geolocation permission denied or timeout");
        }
      }

      // Send log
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint,
          latitude,
          longitude,
          userAgent: navigator.userAgent
        })
      });

      setLogSent(true);
    } catch (error) {
      console.error("Error sending log:", error);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>جاري التحميل...</div>;
  }

  return (
    <main style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="glass-container" style={{ width: '100%', maxWidth: '800px' }}>
        <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>مشغل الفيديو (Video Player)</h1>
        
        {videoUrl ? (
          <video 
            src={videoUrl} 
            controls 
            style={{ width: '100%', borderRadius: '8px' }}
            onPlay={handlePlay}
          />
        ) : (
          <p style={{ textAlign: 'center' }}>لا يوجد فيديو حالياً.</p>
        )}
        
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <a href="/admin" className="btn" style={{ textDecoration: 'none' }}>الذهاب للوحة التحكم</a>
        </div>
      </div>
    </main>
  );
}
