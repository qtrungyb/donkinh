// Thay đổi version này mỗi khi bạn đẩy code mới lên Github (VD: 'donkinh-v2', 'donkinh-v3')
const CACHE_NAME = 'donkinh-v1.6';

// Danh sách các file cần lưu Cache để chạy offline và tải nhanh
const urlsToCache = [
    '/',
    '/index.html',
    '/don-kinh.html',
    '/css/style.css',
    '/js/main.js',
    '/js/config.js',
    '/js/store.js',
    '/js/utils.js',
    '/js/database.js',
    '/js/templates.js',
    '/chukyso.jpg' // Nhớ thêm các hình ảnh hoặc icon bạn đang dùng
];

// 1. SỰ KIỆN CÀI ĐẶT (INSTALL)
self.addEventListener('install', event => {
    // Bắt buộc Service Worker mới kích hoạt ngay lập tức (Không cần chờ)
    self.skipWaiting();
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Đang tải các file vào Cache:', CACHE_NAME);
                return cache.addAll(urlsToCache);
            })
    );
});

// 2. SỰ KIỆN KÍCH HOẠT (ACTIVATE) - NƠI "SÁT THỦ" DIỆT CACHE CŨ HOẠT ĐỘNG
self.addEventListener('activate', event => {
    // Ép Service Worker kiểm soát tất cả các tab đang mở ngay lập tức
    event.waitUntil(self.clients.claim());

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Nếu phát hiện tên Cache khác với CACHE_NAME hiện tại -> Tiêu diệt!
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Đã dọn dẹp Cache cũ:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 3. SỰ KIỆN FETCH (CHẶN BẮT YÊU CẦU MẠNG)
self.addEventListener('fetch', event => {
    // Bỏ qua các yêu cầu không phải GET (VD: POST dữ liệu lên Firebase)
    if (event.request.method !== 'GET') return;
    
    // Bỏ qua các đường link ra bên ngoài (Firebase Auth, Database API...)
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // Nếu tìm thấy file trong Cache -> Trả về luôn cho siêu nhanh
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Nếu không có trong Cache -> Chạy ra mạng tải về
                return fetch(event.request).then(response => {
                    // Bỏ qua nếu lỗi hoặc không hợp lệ
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Clone (nhân bản) dữ liệu tải về để lưu lại vào Cache cho lần sau
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                    
                    return response;
                });
            })
    );
});
