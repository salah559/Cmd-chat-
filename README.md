# Terminal Chat PWA 🖥️💬

تطبيق محادثة احترافي بتصميم Terminal-style يعمل كـ Progressive Web App (PWA) للكروم والهاتف المحمول.

## ✨ **الميزات الأساسية**

### 🔐 **نظام تسجيل الدخول المتقدم**
- تسجيل دخول بالإيميل وكلمة المرور
- إنشاء حسابات جديدة
- حفظ جلسة العمل تلقائياً (JWT)
- إمكانية إضافة Google OAuth لاحقاً

### 💬 **ميزات المحادثة**
- **رسائل مباشرة** في الوقت الفعلي
- **محادثات جماعية** (قنوات)
- **مؤشر الكتابة** (typing indicator)
- **حالة التواجد** (online/offline)
- **سجل المحادثات** محفوظ بالخادم
- **إرسال الملفات والصور** (قريباً)

### 📱 **PWA المتقدم**
- **قابل للتثبيت** على الهاتف والحاسوب
- **يعمل أوفلاين** جزئياً (Service Workers)
- **إشعارات فورية** (Push Notifications)
- **تصميم Terminal أنيق** - مونوسبايس أخضر على أسود
- **متجاوب** - يتكيف مع جميع الشاشات

---

## 🛠️ **المكدس التقني (Tech Stack)**

### **Backend**
- **Node.js 20** + **Express.js** - خادم سريع ومرن
- **Socket.IO** - اتصال فوري ثنائي الاتجاه
- **JWT** - مصادقة آمنة ومشفرة
- **bcryptjs** - تشفير كلمات المرور
- **PostgreSQL** - قاعدة بيانات قوية (قريباً)
- **Express Rate Limit** - حماية من الهجمات

### **Frontend**
- **HTML5** + **CSS3** + **JavaScript ES6**
- **Socket.IO Client** - اتصال مباشر
- **PWA Manifest** - إعدادات التطبيق
- **Service Worker** - عمل أوفلاين
- **Terminal UI** - تصميم JetBrains Mono

### **البنية التحتية**
- **Replit** - استضافة سحابية
- **Port 5000** - الخادم الأساسي
- **HTTPS** - اتصال آمن
- **Compression** - ضغط البيانات

---

## 🚀 **طريقة التشغيل**

### **التشغيل المحلي**
```bash
# تثبيت المتطلبات
npm install

# تشغيل الخادم
npm start
# أو
node server.js
```

### **الوصول للتطبيق**
- **الويب**: http://localhost:5000
- **PWA**: قم بتثبيت التطبيق من المتصفح
- **الهاتف**: افتح الرابط وثبت كتطبيق

---

## 📋 **طريقة الاستخدام**

### **1. تسجيل حساب جديد**
1. اضغط "REGISTER NEW USER"
2. أدخل اسم المستخدم والإيميل وكلمة المرور
3. اضغط "CREATE ACCOUNT"

### **2. تسجيل الدخول**
1. أدخل الإيميل وكلمة المرور
2. اضغط "LOGIN"
3. ستنتقل لواجهة المحادثة

### **3. إرسال الرسائل**
1. اكتب رسالتك في الحقل السفلي
2. اضغط "SEND" أو Enter
3. ستظهر الرسالة فوراً لجميع المستخدمين

### **4. تثبيت PWA**
- **Chrome**: اضغط على أيقونة التثبيت في شريط العنوان
- **موبايل**: "Add to Home Screen"
- **Desktop**: "Install Terminal Chat"

---

## 🔧 **إعدادات التطوير**

### **متغيرات البيئة (.env)**
```env
# JWT Secret (قم بتغييرها في الإنتاج)
JWT_SECRET=terminal-chat-secret-key-2025

# إعدادات قاعدة البيانات
DATABASE_URL=postgresql://user:password@localhost:5432/terminalchat

# إعدادات Google OAuth (اختياري)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# منفذ الخادم
PORT=5000
```

### **إضافة Google OAuth**
1. انشئ مشروع في [Google Cloud Console](https://console.cloud.google.com)
2. فعل Google+ API
3. انشئ OAuth 2.0 credentials
4. أضف `http://localhost:5000/auth/google/callback` في Authorized redirects
5. أضف المفاتيح في `.env`

---

## 🗄️ **قاعدة البيانات**

### **مخطط الجداول (Schema)**
```sql
-- جدول المستخدمين
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'offline',
    last_seen TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- جدول الغرف/القنوات
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(20) DEFAULT 'public', -- public, private, direct
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- جدول الرسائل
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(id),
    sender_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- text, image, file
    file_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

-- جدول أعضاء الغرف
CREATE TABLE room_members (
    room_id INTEGER REFERENCES rooms(id),
    user_id INTEGER REFERENCES users(id),
    joined_at TIMESTAMP DEFAULT NOW(),
    role VARCHAR(20) DEFAULT 'member', -- admin, member
    PRIMARY KEY (room_id, user_id)
);
```

---

## 🚀 **نشر التطبيق (Deployment)**

### **1. نشر على Replit**
- التطبيق جاهز للعمل على Replit
- سيتم تشغيل `npm start` تلقائياً
- الرابط: `https://your-repl-name.your-username.repl.co`

### **2. نشر على Heroku**
```bash
# إنشاء تطبيق Heroku
heroku create terminal-chat-app

# إضافة PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# نشر الكود
git push heroku main

# تشغيل الخادم
heroku ps:scale web=1
```

### **3. نشر على Vercel/Netlify**
- للواجهة الأمامية فقط (Static)
- يحتاج خادم منفصل للـ backend

### **4. نشر على VPS**
```bash
# تثبيت Node.js و PM2
npm install -g pm2

# تشغيل التطبيق
pm2 start server.js --name "terminal-chat"

# حفظ إعدادات PM2
pm2 save && pm2 startup
```

---

## 🔒 **الأمان والحماية**

### **إعدادات الأمان المطبقة**
- ✅ **تشفير كلمات المرور** (bcrypt)
- ✅ **JWT آمن** (7 أيام انتهاء)
- ✅ **Rate Limiting** (100 طلب/15 دقيقة)
- ✅ **Helmet.js** (حماية Headers)
- ✅ **CORS** محدود
- ✅ **Input Validation** ضد XSS

### **توصيات أمان إضافية**
- استخدم HTTPS في الإنتاج
- قم بتغيير JWT_SECRET
- فعل 2FA للمستخدمين المهمين
- استخدم قاعدة بيانات منفصلة
- راقب الـ logs والأخطاء

---

## 📈 **الميزات القادمة (Roadmap)**

### **المرحلة 2**
- [ ] قاعدة بيانات PostgreSQL كاملة
- [ ] رفع الملفات والصور
- [ ] غرف خاصة (Private Rooms)
- [ ] Google OAuth
- [ ] Magic Link Login

### **المرحلة 3**
- [ ] مكالمات صوتية (WebRTC)
- [ ] مشاركة الشاشة
- [ ] بحث في الرسائل
- [ ] إعدادات التطبيق المتقدمة
- [ ] نظام الإشراف (Moderation)

### **المرحلة 4**
- [ ] تطبيق موبايل أصلي (React Native)
- [ ] نظام البوتات والإضافات
- [ ] التشفير الكامل (E2E)
- [ ] نظام النسخ الاحتياطي

---

## 🐛 **حل المشاكل الشائعة**

### **المشكلة: الخادم لا يعمل**
```bash
# تحقق من المنفذ
netstat -tlnp | grep :5000

# تحقق من اللوغز
npm start
```

### **المشكلة: Socket.IO لا يتصل**
- تأكد من تشغيل الخادم
- تحقق من اعدادات CORS
- تأكد من وجود token صحيح

### **المشكلة: PWA لا يثبت**
- تأكد من وجود manifest.json
- تحقق من Service Worker
- استخدم HTTPS

---

## 👨‍💻 **المطور**

**Terminal Chat PWA** - تطبيق محادثة احترافي بواجهة ترمينال أنيقة

**التقنيات**: Node.js • Socket.IO • PWA • JWT • Terminal UI

**الرخصة**: MIT License

---

## 📞 **الدعم والمساعدة**

لأي استفسارات أو مشاكل:
1. تحقق من قسم حل المشاكل أعلاه
2. راجع اللوغز في الخادم
3. تأكد من اتباع خطوات التثبيت بدقة

**نصائح للأداء الأفضل:**
- استخدم متصفح حديث (Chrome/Firefox)
- تأكد من اتصال إنترنت مستقر
- قم بتحديث الصفحة إذا واجهت مشاكل

---

*تم تطوير هذا التطبيق ليكون احترافياً وقابلاً للتطوير. يمكنك تخصيصه حسب احتياجاتك الخاصة.*