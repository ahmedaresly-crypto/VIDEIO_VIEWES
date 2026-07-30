const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.viewerLog.create({ 
  data: { 
    fingerprint: 'test_123', 
    ip: '1.2.3.4', 
    screenResolution: '1x1', 
    language: 'en', 
    timezone: 'UTC' 
  } 
})
.then(console.log)
.catch(console.error);
