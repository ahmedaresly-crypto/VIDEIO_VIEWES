"use client";

import { useEffect, useState, useMemo } from 'react';
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

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<'all' | 'with_gps' | 'without_gps'>('all');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'android' | 'ios' | 'desktop'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week'>('all');

  // Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState({
    date: true,
    fingerprint: true,
    coords: true,
    ip: true,
    os: true,
    device: true,
    map: true,
  });

  const [showColumnToggles, setShowColumnToggles] = useState(false);

  const fetchLogs = () => {
    fetch('/api/log')
      .then(res => res.json())
      .then(data => setLogs(data.logs || []));
  };

  useEffect(() => {
    fetch('/api/video')
      .then(res => res.json())
      .then(data => {
        setVideoUrl(data.videoUrl || '');
        setTitle(data.title || '');
        setThumbnailUrl(data.thumbnailUrl || '');
      });

    fetchLogs();
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

  const handleDeleteLog = async (id: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا السجل؟')) return;
    
    const res = await fetch(`/api/log?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setLogs(prev => prev.filter(log => log.id !== id));
      setMessage('تم حذف السجل بنجاح.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleClearAllLogs = async () => {
    if (!confirm('تحذير: هل أنت متأكد من مسح جميع السجلات؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    
    const res = await fetch('/api/log', { method: 'DELETE' });
    if (res.ok) {
      setLogs([]);
      setMessage('تم مسح جميع السجلات.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchIp = log.ip?.toLowerCase().includes(query);
        const matchFp = log.fingerprint?.toLowerCase().includes(query);
        const matchUa = log.userAgent?.toLowerCase().includes(query);
        const matchRes = log.screenResolution?.toLowerCase().includes(query);
        const matchLang = log.language?.toLowerCase().includes(query);
        const matchTz = log.timezone?.toLowerCase().includes(query);
        const matchDate = new Date(log.createdAt).toLocaleString('ar-EG').includes(query);
        
        if (!matchIp && !matchFp && !matchUa && !matchRes && !matchLang && !matchTz && !matchDate) {
          return false;
        }
      }

      // 2. Location Filter
      const hasGps = log.latitude !== null && log.longitude !== null;
      if (locationFilter === 'with_gps' && !hasGps) return false;
      if (locationFilter === 'without_gps' && hasGps) return false;

      // 3. Device Filter
      const ua = log.userAgent?.toLowerCase() || '';
      if (deviceFilter === 'android' && !ua.includes('android')) return false;
      if (deviceFilter === 'ios' && (!ua.includes('iphone') && !ua.includes('ipad') && !ua.includes('ios'))) return false;
      if (deviceFilter === 'desktop' && (ua.includes('android') || ua.includes('iphone') || ua.includes('ipad') || ua.includes('mobile'))) return false;

      // 4. Date Filter
      if (dateFilter !== 'all') {
        const logDate = new Date(log.createdAt);
        const now = new Date();
        if (dateFilter === 'today') {
          const isToday = logDate.toDateString() === now.toDateString();
          if (!isToday) return false;
        } else if (dateFilter === 'week') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          if (logDate < sevenDaysAgo) return false;
        }
      }

      return true;
    });
  }, [logs, searchQuery, locationFilter, deviceFilter, dateFilter]);

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const exportToCSV = () => {
    if (filteredLogs.length === 0) {
      alert('لا توجد بيانات مطابقة للفلترة لتصديرها');
      return;
    }
    
    const headers: string[] = [];
    if (visibleColumns.date) headers.push('الوقت والتاريخ');
    if (visibleColumns.fingerprint) headers.push('بصمة الجهاز');
    if (visibleColumns.coords) headers.push('الإحداثيات');
    if (visibleColumns.ip) headers.push('IP');
    if (visibleColumns.os) headers.push('نظام التشغيل');
    if (visibleColumns.device) headers.push('معلومات الجهاز');
    
    const rows = filteredLogs.map(log => {
      const rowData: string[] = [];
      const date = new Date(log.createdAt).toLocaleString('ar-EG');
      const coords = log.latitude && log.longitude ? `${log.latitude}, ${log.longitude}` : '-';
      const device = `الشاشة: ${log.screenResolution || '-'} | اللغة: ${log.language || '-'} | المنطقة: ${log.timezone || '-'}`;
      
      if (visibleColumns.date) rowData.push(`"${date}"`);
      if (visibleColumns.fingerprint) rowData.push(`"${log.fingerprint}"`);
      if (visibleColumns.coords) rowData.push(`"${coords}"`);
      if (visibleColumns.ip) rowData.push(`"${log.ip || '-'}"`);
      if (visibleColumns.os) rowData.push(`"${log.userAgent || '-'}"`);
      if (visibleColumns.device) rowData.push(`"${device}"`);

      return rowData.join(',');
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
    <div style={{ padding: '1rem', maxWidth: '1300px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }} dir="rtl">
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ color: '#1b7bc2', fontSize: '2rem' }}>لوحة التحكم والمراقبة</h1>
      </div>

      {/* Video & Metadata Settings */}
      <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
        <h3 style={{ margin: 0, borderBottom: '2px solid #1b7bc2', paddingBottom: '8px' }}>إعدادات الفيديو والمظهر</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '1rem' }}>
          
          {/* Metadata Settings */}
          <div style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '15px', color: '#333' }}>الاسم والصورة (المعاينة عند مشاركة الرابط)</h4>
            
            <form onSubmit={handleUpdateMetadata} style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                placeholder="عنوان أو اسم الفيديو"
                required
              />
              <button type="submit" className="btn" style={{ padding: '10px 15px', backgroundColor: '#1b7bc2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>حفظ الاسم</button>
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
                <button type="submit" className="btn" style={{ padding: '10px 15px', backgroundColor: '#1b7bc2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>تحديث الرابط</button>
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

      {/* Logs Section Header */}
      <div style={{ backgroundColor: 'white', padding: '1.2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '1rem' }}>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', margin: 0, color: '#333' }}>سجل الزيارات والنشاط</h2>
            <span style={{ fontSize: '13px', color: '#666' }}>
              إجمالي السجلات: <b>{logs.length}</b> | المعروض بعد الفلترة: <b>{filteredLogs.length}</b>
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button 
              onClick={() => setShowColumnToggles(!showColumnToggles)}
              style={{ backgroundColor: '#6c757d', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
            >
              👁️ تخصيص الأعمدة
            </button>
            <button 
              style={{ backgroundColor: '#28a745', color: 'white', padding: '8px 14px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }} 
              onClick={exportToCSV}
            >
              📊 تصدير Excel (CSV)
            </button>
            <button 
              style={{ backgroundColor: '#dc3545', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }} 
              onClick={handleClearAllLogs}
            >
              🗑️ مسح السجل
            </button>
            <button 
              style={{ backgroundColor: '#1b7bc2', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }} 
              onClick={() => window.location.href = '/'}
            >
              🎬 المشغل
            </button>
          </div>
        </div>

        {/* Column Toggles Panel */}
        {showColumnToggles && (
          <div style={{ backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '6px', marginBottom: '1rem', border: '1px solid #dee2e6' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>حدد الأعمدة التي تريد إظهارها في الجدول:</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', fontSize: '13px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                <input type="checkbox" checked={visibleColumns.date} onChange={() => toggleColumn('date')} />
                الوقت والتاريخ
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                <input type="checkbox" checked={visibleColumns.fingerprint} onChange={() => toggleColumn('fingerprint')} />
                بصمة الجهاز
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                <input type="checkbox" checked={visibleColumns.coords} onChange={() => toggleColumn('coords')} />
                الإحداثيات
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                <input type="checkbox" checked={visibleColumns.ip} onChange={() => toggleColumn('ip')} />
                IP
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                <input type="checkbox" checked={visibleColumns.os} onChange={() => toggleColumn('os')} />
                نظام التشغيل (User Agent)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                <input type="checkbox" checked={visibleColumns.device} onChange={() => toggleColumn('device')} />
                معلومات الجهاز
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                <input type="checkbox" checked={visibleColumns.map} onChange={() => toggleColumn('map')} />
                رابط الخريطة
              </label>
            </div>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '6px' }}>
          
          {/* Search Box */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>🔍 بحث سريع في السجل:</label>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بـ IP، بصمة، هاتف..."
              style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }}
            />
          </div>

          {/* Location Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>📍 فلترة الموقع (GPS):</label>
            <select 
              value={locationFilter} 
              onChange={(e: any) => setLocationFilter(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }}
            >
              <option value="all">جميع الزيارات</option>
              <option value="with_gps">فقط الزيارات مع إحداثيات GPS</option>
              <option value="without_gps">فقط الزيارات بدون إحداثيات GPS</option>
            </select>
          </div>

          {/* Device Type Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>📱 نوع الجهاز:</label>
            <select 
              value={deviceFilter} 
              onChange={(e: any) => setDeviceFilter(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }}
            >
              <option value="all">جميع الأجهزة</option>
              <option value="android">أجهزة أندرويد (Android)</option>
              <option value="ios">أجهزة آيفون / آيباد (iOS)</option>
              <option value="desktop">أجهزة كمبيوتر (Desktop)</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>📅 التاريخ:</label>
            <select 
              value={dateFilter} 
              onChange={(e: any) => setDateFilter(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }}
            >
              <option value="all">كل الأوقات</option>
              <option value="today">زيارات اليوم فقط</option>
              <option value="week">آخر 7 أيام</option>
            </select>
          </div>

        </div>

      </div>

      {/* Table Section */}
      <div style={{ overflowX: 'auto', backgroundColor: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px', minWidth: '800px' }}>
          <thead>
            <tr style={{ backgroundColor: '#1b7bc2', color: 'white' }}>
              {visibleColumns.date && <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>الوقت والتاريخ</th>}
              {visibleColumns.fingerprint && <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>بصمة الجهاز</th>}
              {visibleColumns.coords && <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>الإحداثيات</th>}
              {visibleColumns.ip && <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>IP</th>}
              {visibleColumns.os && <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>نظام التشغيل</th>}
              {visibleColumns.device && <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>معلومات الجهاز</th>}
              {visibleColumns.map && <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>الخريطة</th>}
              <th style={{ padding: '10px', border: '1px solid #dee2e6', width: '60px' }}>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => {
              const date = new Date(log.createdAt);
              return (
                <tr key={log.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  
                  {visibleColumns.date && (
                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                      {date.toLocaleDateString('ar-EG')}<br/>
                      {date.toLocaleTimeString('ar-EG')}
                    </td>
                  )}

                  {visibleColumns.fingerprint && (
                    <td style={{ padding: '10px', border: '1px solid #dee2e6', wordBreak: 'break-all', fontSize: '12px' }}>
                      {log.fingerprint}
                    </td>
                  )}

                  {visibleColumns.coords && (
                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }} dir="ltr">
                      {log.latitude && log.longitude ? (
                        <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                          {log.latitude.toFixed(5)}, {log.longitude.toFixed(5)}
                        </span>
                      ) : (
                        <span style={{ color: '#888' }}>-</span>
                      )}
                    </td>
                  )}

                  {visibleColumns.ip && (
                    <td style={{ padding: '10px', border: '1px solid #dee2e6', fontWeight: 'bold' }} dir="ltr">
                      {log.ip || '-'}
                    </td>
                  )}

                  {visibleColumns.os && (
                    <td style={{ padding: '10px', border: '1px solid #dee2e6', maxWidth: '220px', wordBreak: 'break-word', fontSize: '12px', color: '#555' }} dir="ltr">
                      {log.userAgent || '-'}
                    </td>
                  )}

                  {visibleColumns.device && (
                    <td style={{ padding: '10px', border: '1px solid #dee2e6', fontSize: '12px', color: '#555', textAlign: 'right' }}>
                      <div>الشاشة: <b>{log.screenResolution || '-'}</b></div>
                      <div>اللغة: <b>{log.language || '-'}</b></div>
                      <div>المنطقة: <b>{log.timezone || '-'}</b></div>
                    </td>
                  )}

                  {visibleColumns.map && (
                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                      {log.latitude && log.longitude ? (
                        <a 
                          href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          style={{ color: '#fff', backgroundColor: '#1b7bc2', padding: '4px 8px', borderRadius: '4px', textDecoration: 'none', fontSize: '12px', display: 'inline-block' }}
                        >
                          عرض الخريطة 📍
                        </a>
                      ) : (
                        <span style={{ color: '#aaa', fontSize: '12px' }}>غير متاح</span>
                      )}
                    </td>
                  )}

                  <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                    <button 
                      onClick={() => handleDeleteLog(log.id)}
                      title="حذف هذا السجل"
                      style={{ backgroundColor: '#ffefef', border: '1px solid #ffcccc', color: '#dc3545', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      ❌
                    </button>
                  </td>

                </tr>
              );
            })}
            
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '30px', textAlign: 'center', color: '#888' }}>
                  {logs.length === 0 ? 'لا توجد سجلات مسجلة حتى الآن.' : 'لا توجد نتائج مطابقة لشروط الفلترة والبحث.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
