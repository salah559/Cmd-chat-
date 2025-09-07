const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const server = http.createServer(app);

// إعداد Trust Proxy للعمل مع Replit
app.set('trust proxy', true);

// إعداد Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// إعدادات الأمان
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// حد معدل الطلبات مع إعدادات آمنة
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100,
  message: { error: 'كثرة الطلبات، حاول لاحقاً' },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: false, // إيقاف trust proxy للأمان
  keyGenerator: (req) => req.ip // استخدام IP مباشرة
});
app.use('/api/', limiter);

// مفتاح JWT
const JWT_SECRET = process.env.JWT_SECRET || 'terminal-chat-secret-2025';

// تخزين مؤقت في الذاكرة (للتطوير)
const users = new Map();
const rooms = new Map();
const messages = new Map();

// إنشاء غرفة عامة افتراضية
rooms.set('general', {
  id: 'general',
  name: 'القناة العامة',
  type: 'public',
  members: [],
  createdAt: new Date().toISOString()
});

// تنظيف الرسائل القديمة كل 30 دقيقة
setInterval(() => {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  let totalCleaned = 0;
  
  messages.forEach((roomMessages, roomId) => {
    const originalCount = roomMessages.length;
    
    // الاحتفاظ بآخر 100 رسالة أو الرسائل من آخر ساعتين
    const filteredMessages = roomMessages
      .filter(msg => new Date(msg.timestamp) > twoHoursAgo)
      .slice(-100); // الاحتفاظ بآخر 100 رسالة كحد أقصى
    
    if (filteredMessages.length < originalCount) {
      messages.set(roomId, filteredMessages);
      const cleaned = originalCount - filteredMessages.length;
      totalCleaned += cleaned;
      console.log(`🧹 تم تنظيف ${cleaned} رسالة قديمة من ${roomId}`);
    }
  });

  if (totalCleaned > 0) {
    console.log(`📊 إجمالي الرسائل المنظفة: ${totalCleaned}`);
    console.log(`💾 الذاكرة المستخدمة: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
  }
}, 30 * 60 * 1000); // كل 30 دقيقة

// وسطية التحقق من JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'مطلوب رمز الدخول' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'رمز دخول غير صحيح' });
    }
    req.user = user;
    next();
  });
};

// تسجيل مستخدم جديد
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    }

    // التحقق من صحة الإيميل
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'البريد الإلكتروني غير صحيح' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    }

    if (users.has(email)) {
      return res.status(409).json({ error: 'البريد الإلكتروني مستخدم مسبقاً' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      displayName,
      status: 'offline',
      createdAt: new Date().toISOString()
    };

    users.set(email, user);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح'
    });
  } catch (error) {
    console.error('خطأ في التسجيل:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// تسجيل الدخول
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' });
    }

    const user = users.get(email);
    if (!user) {
      return res.status(401).json({ error: 'بيانات دخول غير صحيحة' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'بيانات دخول غير صحيحة' });
    }

    user.status = 'online';
    user.lastLogin = new Date().toISOString();

    const token = jwt.sign(
      { id: user.id, email: user.email, displayName: user.displayName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName
      }
    });
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// الحصول على الغرف
app.get('/api/rooms', authenticateToken, (req, res) => {
  const roomList = Array.from(rooms.values());
  res.json(roomList);
});

// الحصول على الرسائل
app.get('/api/messages/:roomId', authenticateToken, (req, res) => {
  const { roomId } = req.params;
  const roomMessages = messages.get(roomId) || [];
  res.json(roomMessages);
});

// إحصائيات التطبيق
app.get('/api/stats', authenticateToken, (req, res) => {
  const stats = {
    totalUsers: users.size,
    onlineUsers: connectedUsers.size,
    totalRooms: rooms.size,
    totalMessages: Array.from(messages.values()).reduce((total, msgs) => total + msgs.length, 0),
    uptime: Math.floor(process.uptime()),
    memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
  };
  res.json(stats);
});

// صفحة تسجيل الدخول
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.IO للاتصال المباشر
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return next(new Error('Authentication error'));
    }
    socket.user = user;
    next();
  });
});

const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log(`المستخدم متصل: ${socket.user.displayName}`);

  // تسجيل المستخدم كمتصل
  connectedUsers.set(socket.user.id, {
    socketId: socket.id,
    user: socket.user,
    status: 'online'
  });

  // الانضمام للغرف
  socket.join('general');

  // إشعار الآخرين بالاتصال
  socket.broadcast.emit('user-online', {
    userId: socket.user.id,
    displayName: socket.user.displayName
  });

  // إرسال قائمة المستخدمين المتصلين
  const onlineUsers = Array.from(connectedUsers.values()).map(u => ({
    id: u.user.id,
    displayName: u.user.displayName,
    status: u.status
  }));
  socket.emit('users-list', onlineUsers);

  // الانضمام لغرفة
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`${socket.user.displayName} انضم للغرفة: ${roomId}`);
  });

  // إرسال رسالة
  socket.on('send-message', (data) => {
    const { roomId, content, type = 'text' } = data;

    const message = {
      id: Date.now().toString(),
      roomId,
      senderId: socket.user.id,
      senderName: socket.user.displayName,
      content,
      type,
      timestamp: new Date().toISOString()
    };

    // حفظ الرسالة
    if (!messages.has(roomId)) {
      messages.set(roomId, []);
    }
    messages.get(roomId).push(message);

    // إرسال للغرفة
    io.to(roomId).emit('new-message', message);
  });

  // بدء الكتابة
  socket.on('typing-start', (roomId) => {
    socket.to(roomId).emit('user-typing', {
      userId: socket.user.id,
      displayName: socket.user.displayName,
      typing: true
    });
  });

  // توقف الكتابة
  socket.on('typing-stop', (roomId) => {
    socket.to(roomId).emit('user-typing', {
      userId: socket.user.id,
      displayName: socket.user.displayName,
      typing: false
    });
  });

  // قطع الاتصال
  socket.on('disconnect', () => {
    console.log(`المستخدم قطع الاتصال: ${socket.user.displayName}`);

    connectedUsers.delete(socket.user.id);

    socket.broadcast.emit('user-offline', {
      userId: socket.user.id,
      displayName: socket.user.displayName
    });
  });
});

// معالجة الأخطاء العامة
process.on('uncaughtException', (error) => {
  console.error('خطأ غير محتوى:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('رفض غير محتوى:', reason);
  process.exit(1);
});

// تنظيف عند الإغلاق
process.on('SIGTERM', () => {
  console.log('🔄 إيقاف الخادم...');
  server.close(() => {
    console.log('✅ تم إيقاف الخادم بنجاح');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5000;

// التحقق من المنفذ قبل التشغيل
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.log(`❌ المنفذ ${PORT} مشغول. جاري إيقاف العمليات القديمة...`);
    process.exit(1);
  } else {
    console.error('خطأ في الخادم:', error);
    process.exit(1);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 خادم الدردشة يعمل على المنفذ ${PORT}`);
  console.log(`🌐 متاح على: http://0.0.0.0:${PORT}`);
  console.log(`📊 الذاكرة المستخدمة: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
  console.log(`⚡ Socket.IO جاهز للاتصالات`);
});