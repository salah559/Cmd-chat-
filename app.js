class TerminalChat {
    constructor() {
        this.socket = null;
        this.token = null;
        this.currentUser = null;
        this.currentRoom = 'general';
        this.typingTimeout = null;
        this.notificationsEnabled = false;

        this.init();
        this.requestNotificationPermission();
    }

    init() {
        // التحقق من وجود token محفوظ
        const savedToken = localStorage.getItem('chat_token');
        if (savedToken) {
            this.token = savedToken;
            this.showChatInterface();
            this.connectSocket();
        } else {
            this.showAuthInterface();
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        // حفظ المسودة عند الكتابة
        document.addEventListener('input', (e) => {
            if (e.target.id === 'message-input') {
                localStorage.setItem('message_draft', e.target.value);
                this.handleTyping();
            }
        });

        // أزرار التسجيل وتسجيل الدخول
        document.addEventListener('click', (e) => {
            if (e.target.id === 'login-btn') {
                e.preventDefault();
                this.login();
            } else if (e.target.id === 'register-btn') {
                e.preventDefault();
                this.register();
            } else if (e.target.id === 'send-btn') {
                e.preventDefault();
                this.sendMessage();
            } else if (e.target.id === 'logout-btn') {
                e.preventDefault();
                this.logout();
            } else if (e.target.id === 'theme-toggle') {
                e.preventDefault();
                this.toggleTheme();
            } else if (e.target.id === 'emoji-btn') {
                e.preventDefault();
                this.toggleEmojiPicker();
            } else if (e.target.classList.contains('toggle-auth')) {
                e.preventDefault();
                this.toggleAuthMode();
            }
        });

        // البحث في الرسائل
        document.addEventListener('input', (e) => {
            if (e.target.id === 'search-input') {
                this.searchMessages(e.target.value);
            }
        });

        // إرسال بالضغط على Enter
        document.addEventListener('keypress', (e) => {
            if (e.target.id === 'message-input' && e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // مؤشر الكتابة
        document.addEventListener('input', (e) => {
            if (e.target.id === 'message-input') {
                this.handleTyping();
            }
        });
    }

    showAuthInterface() {
        document.body.innerHTML = `
            <div class="auth-container">
                <div class="terminal-header">
                    <div class="terminal-title">⚡ TERMINAL CHAT</div>
                    <div class="terminal-subtitle">Progressive Web App</div>
                </div>

                <div class="auth-form">
                    <div class="auth-mode" id="auth-mode">
                        <h2 id="auth-title">تسجيل الدخول</h2>

                        <div class="form-group" id="display-name-group" style="display: none;">
                            <label>اسم المستخدم:</label>
                            <input type="text" id="display-name" placeholder="أدخل اسم المستخدم">
                        </div>

                        <div class="form-group">
                            <label>البريد الإلكتروني:</label>
                            <input type="email" id="email" placeholder="user@example.com">
                        </div>

                        <div class="form-group">
                            <label>كلمة المرور:</label>
                            <input type="password" id="password" placeholder="••••••••">
                        </div>

                        <button id="login-btn" class="auth-btn">دخول</button>
                        <button id="register-btn" class="auth-btn" style="display: none;">إنشاء حساب</button>

                        <div class="auth-toggle">
                            <span id="toggle-text">ليس لديك حساب؟</span>
                            <a href="#" class="toggle-auth" id="toggle-link">إنشاء حساب جديد</a>
                        </div>

                        <div class="auth-message" id="auth-message"></div>
                    </div>
                </div>
            </div>
        `;
    }

    showChatInterface() {
        document.body.innerHTML = `
            <div class="chat-container">
                <div class="chat-header">
                    <div class="header-left">
                        <span class="terminal-prompt">user@terminal-chat:~$</span>
                        <span class="room-name">${this.currentRoom}</span>
                    </div>
                    <div class="header-right">
                        <span class="user-info">${this.currentUser?.displayName || 'مستخدم'}</span>
                        <button id="logout-btn" class="logout-btn">خروج</button>
                    </div>
                </div>

                <div class="chat-messages" id="chat-messages">
                    <div class="system-message">
                        🔄 جاري الاتصال بالخادم...
                    </div>
                </div>

                <div class="typing-indicator" id="typing-indicator"></div>

                <div class="chat-input">
                    <input type="text" id="message-input" placeholder="اكتب رسالتك هنا... (Enter للإرسال)" autocomplete="off">
                    <button id="send-btn">إرسال</button>
                </div>

                <div class="online-users" id="online-users">
                    <div class="users-title">📶 متصل الآن:</div>
                    <div class="users-list" id="users-list"></div>
                </div>
            </div>
        `;

        // تحميل الرسائل السابقة
        this.loadMessages();

        // استعادة المسودة
        const savedDraft = localStorage.getItem('message_draft');
        if (savedDraft) {
            const messageInput = document.getElementById('message-input');
            if (messageInput) {
                messageInput.value = savedDraft;
            }
        }

        // تحميل النمط المحفوظ
        setTimeout(() => this.loadTheme(), 100);
    }

    toggleAuthMode() {
        const isLoginMode = document.getElementById('login-btn').style.display !== 'none';

        if (isLoginMode) {
            // تبديل لوضع التسجيل
            document.getElementById('auth-title').textContent = 'إنشاء حساب جديد';
            document.getElementById('display-name-group').style.display = 'block';
            document.getElementById('login-btn').style.display = 'none';
            document.getElementById('register-btn').style.display = 'block';
            document.getElementById('toggle-text').textContent = 'لديك حساب مسبقاً؟';
            document.getElementById('toggle-link').textContent = 'تسجيل الدخول';
        } else {
            // تبديل لوضع تسجيل الدخول
            document.getElementById('auth-title').textContent = 'تسجيل الدخول';
            document.getElementById('display-name-group').style.display = 'none';
            document.getElementById('login-btn').style.display = 'block';
            document.getElementById('register-btn').style.display = 'none';
            document.getElementById('toggle-text').textContent = 'ليس لديك حساب؟';
            document.getElementById('toggle-link').textContent = 'إنشاء حساب جديد';
        }

        // مسح الرسائل
        document.getElementById('auth-message').textContent = '';
    }

    showAuthMessage(message, type = 'error') {
        const messageEl = document.getElementById('auth-message');
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.className = `auth-message ${type}`;
        }
    }

    async login() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!email || !password) {
            this.showAuthMessage('يرجى إدخال البريد الإلكتروني وكلمة المرور');
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                this.token = data.token;
                this.currentUser = data.user;
                localStorage.setItem('chat_token', this.token);
                this.showChatInterface();
                this.connectSocket();
                this.showAuthMessage('تم تسجيل الدخول بنجاح!', 'success');
            } else {
                this.showAuthMessage(data.error);
            }
        } catch (error) {
            this.showAuthMessage('خطأ في الاتصال. حاول مرة أخرى.');
        }
    }

    async register() {
        const displayName = document.getElementById('display-name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!displayName || !email || !password) {
            this.showAuthMessage('يرجى إدخال جميع البيانات المطلوبة');
            return;
        }

        if (password.length < 6) {
            this.showAuthMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ displayName, email, password })
            });

            const data = await response.json();

            if (data.success) {
                this.showAuthMessage('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول', 'success');
                this.toggleAuthMode(); // تبديل لوضع تسجيل الدخول
            } else {
                this.showAuthMessage(data.error);
            }
        } catch (error) {
            this.showAuthMessage('خطأ في الاتصال. حاول مرة أخرى.');
        }
    }

    connectSocket() {
        if (!this.token) return;

        this.socket = io({
            auth: {
                token: this.token
            }
        });

        this.socket.on('connect', () => {
            console.log('متصل بالخادم');
            this.addSystemMessage('✅ تم الاتصال بالخادم بنجاح');
            this.socket.emit('join-room', this.currentRoom);
        });

        this.socket.on('disconnect', () => {
            console.log('تم قطع الاتصال');
            this.addSystemMessage('❌ تم قطع الاتصال عن الخادم');
        });

        this.socket.on('new-message', (message) => {
            this.displayMessage(message);
        });

        this.socket.on('user-online', (data) => {
            this.addSystemMessage(`📶 ${data.displayName} انضم للدردشة`);
            this.updateUsersList();
        });

        this.socket.on('user-offline', (data) => {
            this.addSystemMessage(`📵 ${data.displayName} غادر الدردشة`);
            this.updateUsersList();
        });

        this.socket.on('users-list', (users) => {
            this.updateUsersList(users);
        });

        this.socket.on('user-typing', (data) => {
            this.showTypingIndicator(data);
        });

        this.socket.on('connect_error', (error) => {
            console.error('خطأ في الاتصال:', error);
            this.addSystemMessage('❌ خطأ في الاتصال بالخادم - جاري المحاولة مرة أخرى...');
            
            // إعادة محاولة الاتصال
            setTimeout(() => {
                if (!this.socket.connected) {
                    this.connectSocket();
                }
            }, 3000);
        });
    }

    async loadMessages() {
        if (!this.token) return;

        try {
            const response = await fetch(`/api/messages/${this.currentRoom}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const messages = await response.json();
                const messagesContainer = document.getElementById('chat-messages');
                messagesContainer.innerHTML = '';

                messages.forEach(message => {
                    this.displayMessage(message);
                });
            }
        } catch (error) {
            console.error('خطأ في تحميل الرسائل:', error);
        }
    }

    sendMessage() {
        const input = document.getElementById('message-input');
        const content = input.value.trim();

        if (!content || !this.socket) return;

        this.socket.emit('send-message', {
            roomId: this.currentRoom,
            content: content,
            type: 'text'
        });

        input.value = '';
        this.stopTyping();
    }

    displayMessage(message) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageEl = document.createElement('div');
        messageEl.className = 'message';

        const isOwn = message.senderId === this.currentUser?.id;
        if (isOwn) {
            messageEl.classList.add('own-message');
        } else {
            // تشغيل صوت وإشعار للرسائل الجديدة من الآخرين
            this.playNotificationSound();
            this.showNotification(
                `رسالة جديدة من ${message.senderName}`,
                message.content.length > 50 ? message.content.substring(0, 50) + '...' : message.content
            );
        }

        const time = new Date(message.timestamp).toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageEl.innerHTML = `
            <div class="message-header">
                <span class="sender">${message.senderName}</span>
                <span class="timestamp">${time}</span>
            </div>
            <div class="message-content">${this.escapeHtml(message.content)}</div>
        `;

        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    addSystemMessage(message) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        const messageEl = document.createElement('div');
        messageEl.className = 'system-message';
        messageEl.textContent = message;

        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    updateUsersList(users = []) {
        const usersListEl = document.getElementById('users-list');
        if (!usersListEl) return;

        usersListEl.innerHTML = '';

        users.forEach(user => {
            const userEl = document.createElement('div');
            userEl.className = 'user-item';
            userEl.innerHTML = `
                <span class="user-status online"></span>
                <span class="user-name">${user.displayName}</span>
            `;
            usersListEl.appendChild(userEl);
        });
    }

    handleTyping() {
        if (!this.socket) return;

        this.socket.emit('typing-start', this.currentRoom);

        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.stopTyping();
        }, 2000);
    }

    stopTyping() {
        if (!this.socket) return;

        this.socket.emit('typing-stop', this.currentRoom);
        clearTimeout(this.typingTimeout);
    }

    showTypingIndicator(data) {
        const indicatorEl = document.getElementById('typing-indicator');
        if (!indicatorEl) return;

        if (data.typing && data.userId !== this.currentUser?.id) {
            indicatorEl.textContent = `${data.displayName} يكتب...`;
            indicatorEl.style.display = 'block';
        } else {
            indicatorEl.style.display = 'none';
        }
    }

    logout() {
        localStorage.removeItem('chat_token');
        if (this.socket) {
            this.socket.disconnect();
        }
        this.token = null;
        this.currentUser = null;
        this.showAuthInterface();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    playNotificationSound() {
        // تشغيل صوت إشعار بسيط
        try {
            if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                const audioContext = new AudioContextClass();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
            }
        } catch (error) {
            console.log('لا يمكن تشغيل الصوت:', error);
        }
    }

    toggleTheme() {
        const body = document.body;
        const themeBtn = document.getElementById('theme-toggle');

        if (body.classList.contains('light-mode')) {
            body.classList.remove('light-mode');
            themeBtn.textContent = '🌙';
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.add('light-mode');
            themeBtn.textContent = '☀️';
            localStorage.setItem('theme', 'light');
        }
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        const body = document.body;
        const themeBtn = document.getElementById('theme-toggle');

        if (savedTheme === 'light') {
            body.classList.add('light-mode');
            if (themeBtn) themeBtn.textContent = '☀️';
        }
    }

    toggleEmojiPicker() {
        const picker = document.getElementById('emoji-picker');
        if (picker) {
            picker.classList.toggle('hidden');
            this.setupEmojiList();
        }
    }

    setupEmojiList() {
        const emojiList = document.querySelector('.emoji-list');
        if (!emojiList || emojiList.hasChildNodes()) return;

        const emojis = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😮‍💨','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾'];

        emojis.forEach(emoji => {
            const span = document.createElement('span');
            span.textContent = emoji;
            span.onclick = () => this.insertEmoji(emoji);
            emojiList.appendChild(span);
        });
    }

    insertEmoji(emoji) {
        const input = document.getElementById('message-input');
        if (input) {
            input.value += emoji;
            input.focus();
            this.toggleEmojiPicker(); // إخفاء المنتقي
        }
    }

    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            this.notificationsEnabled = permission === 'granted';
        }
    }

    showNotification(title, message, icon = '/icons/icon-72x72.png') {
        if (this.notificationsEnabled && document.hidden) {
            try {
                new Notification(title, {
                    body: message,
                    icon: icon,
                    badge: icon,
                    tag: 'terminal-chat',
                    requireInteraction: false,
                    silent: false
                });
            } catch (error) {
                console.log('خطأ في الإشعار:', error);
            }
        }
    }

    searchMessages(query) {
        const messages = document.querySelectorAll('.message');
        
        if (!query.trim()) {
            // إظهار جميع الرسائل
            messages.forEach(msg => {
                msg.style.display = 'block';
                msg.style.opacity = '1';
            });
            return;
        }

        const searchTerm = query.toLowerCase().trim();
        messages.forEach(msg => {
            const content = msg.querySelector('.message-content');
            const sender = msg.querySelector('.sender');
            
            const contentText = content ? content.textContent.toLowerCase() : '';
            const senderText = sender ? sender.textContent.toLowerCase() : '';
            
            if (contentText.includes(searchTerm) || senderText.includes(searchTerm)) {
                msg.style.display = 'block';
                msg.style.opacity = '1';
                // تمييز النص المطابق
                this.highlightText(content, searchTerm);
            } else {
                msg.style.display = 'none';
                msg.style.opacity = '0.3';
            }
        });
    }

    highlightText(element, searchTerm) {
        if (!element || !searchTerm) return;
        
        const originalText = element.textContent;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        const highlightedText = originalText.replace(regex, '<mark style="background: #00ff00; color: #000;">$1</mark>');
        element.innerHTML = highlightedText;
    }
}

// تشغيل التطبيق
document.addEventListener('DOMContentLoaded', () => {
    new TerminalChat();
});

// تسجيل Service Worker البسيط
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('Service Worker مسجل بنجاح:', registration);
            })
            .catch((error) => {
                console.log('فشل تسجيل Service Worker:', error);
            });
    });
}