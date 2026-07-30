fetch('http://localhost:3000/api/log', { 
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' }, 
  body: JSON.stringify({ 
    fingerprint: 'cli_test', 
    latitude: null, 
    longitude: null, 
    userAgent: 'test', 
    screenResolution: '1x1', 
    language: 'en', 
    timezone: 'UTC' 
  }) 
}).then(r => r.json()).then(console.log).catch(console.error);
