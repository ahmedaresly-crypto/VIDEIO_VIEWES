# تطبيق متتبع الفيديو (Video Tracker App)

هذا التطبيق مبني باستخدام Next.js ويسمح لك بعرض فيديو مع تتبع البصمة (Fingerprint) والموقع الجغرافي للمشاهدين، مع لوحة تحكم مدمجة.

## التشغيل المحلي (Local Development)

1. تثبيت الحزم: `npm install`
2. تهيئة قاعدة البيانات المحلية (SQLite): `npx prisma db push`
3. تشغيل الخادم المحلي: `npm run dev`
4. افتح المتصفح على: `http://localhost:3000`
5. للوصول للوحة التحكم: `http://localhost:3000/admin`

## الرفع والنشر على Render (Deployment)

بما أن منصة Render تستخدم ملفات مؤقتة، لا يُنصح باستخدام SQLite هناك. لذلك اتبع الخطوات التالية للتحويل إلى PostgreSQL ونشر التطبيق:

### 1. تجهيز الكود لـ Render
قبل رفع الكود النهائي، قم بتعديل ملف `prisma/schema.prisma`:
قم بتغيير:
```prisma
datasource db {
  provider = "sqlite"
}
```
إلى:
```prisma
datasource db {
  provider = "postgresql"
}
```
ثم احفظ الملف وارفع التغييرات إلى GitHub (`git push`).

### 2. إعداد قاعدة البيانات في Render
- في لوحة تحكم Render، أنشئ قاعدة بيانات جديدة (`New` -> `PostgreSQL`).
- بعد الإنشاء، انسخ رابط قاعدة البيانات (`Internal Database URL` إذا كان التطبيق على Render أيضاً، أو `External Database URL`).

### 3. إعداد التطبيق (Web Service) في Render
- اختر إنشاء تطبيق جديد (`New` -> `Web Service`).
- اربطه بمستودع GitHub الخاص بك.
- إعدادات البناء والتشغيل:
  - **Build Command:** `npm install && npx prisma generate && npx prisma db push && npm run build`
  - **Start Command:** `npm run start`
- أضف المتغيرات البيئية (Environment Variables):
  - اسم المتغير: `DATABASE_URL` 
  - القيمة: الصق رابط قاعدة البيانات الذي نسخته في الخطوة السابقة.

### 4. ربط الدومين (Custom Domain)
- بعد تشغيل التطبيق بنجاح في Render، اذهب إلى إعدادات التطبيق (Settings).
- ابحث عن قسم **Custom Domains**.
- أضف الدومين الخاص بك واتبع تعليمات ضبط سجلات DNS (إضافة CNAME) في مزود الدومين الخاص بك.
