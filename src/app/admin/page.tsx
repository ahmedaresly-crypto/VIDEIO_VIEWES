"use client";

import { useEffect, useState } from 'react';

type Log = {
  id: number;
  fingerprint: string;
  latitude: number | null;
  longitude: number | null;
  userAgent: string | null;
  createdAt: string;
};

export default function AdminPanel() {
  const [videoUrl, setVideoUrl] = useState('');
  const [logs, setLogs] = useState<Log[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/video')
      .then(res => res.json())
      .then(data => setVideoUrl(data.videoUrl || ''));

    fetch('/api/log')
      .then(res => res.json())
      .then(data => setLogs(data.logs || []));
  }, []);

  const handleUpdateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('جاري التحديث...');
    
    const res = await fetch('/api/video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl })
    });
    
    if (res.ok) {
      setMessage('تم تحديث الفيديو بنجاح!');
    } else {
      setMessage('حدث خطأ أثناء التحديث.');
    }
    
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>لوحة التحكم (Admin Panel)</h1>
        <a href="/" className="btn" style={{ textDecoration: 'none' }}>العودة للمشغل</a>
      </div>
      
      <div className="glass-container" style={{ marginBottom: '2rem' }}>
        <h2>إعدادات الفيديو</h2>
        <form onSubmit={handleUpdateVideo} style={{ marginTop: '1rem' }}>
          <input 
            type="url" 
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="input-field"
            placeholder="أدخل رابط الفيديو (MP4)"
            required
            dir="ltr"
          />
          <button type="submit" className="btn">حفظ الفيديو</button>
          {message && <p style={{ marginTop: '1rem', color: 'var(--primary)' }}>{message}</p>}
        </form>
      </div>

      <div className="glass-container">
        <h2>سجلات المشاهدين</h2>
        <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }} dir="ltr">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '12px' }}>ID</th>
                <th style={{ padding: '12px' }}>Fingerprint</th>
                <th style={{ padding: '12px' }}>Location</th>
                <th style={{ padding: '12px' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '12px' }}>{log.id}</td>
                  <td style={{ padding: '12px', fontSize: '0.9em' }}>{log.fingerprint}</td>
                  <td style={{ padding: '12px' }}>
                    {log.latitude && log.longitude ? (
                      <a href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>
                        {log.latitude.toFixed(4)}, {log.longitude.toFixed(4)}
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '12px', textAlign: 'center' }}>لا توجد سجلات حتى الآن</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
