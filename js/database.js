/**
 * ============================================================================
 * DATABASE.JS - LỚP DỮ LIỆU (DATA LAYER)
 * ============================================================================
 * Quản lý mọi luồng dữ liệu vào/ra của ứng dụng bao gồm:
 * 1. IndexedDB: Lưu bản nháp (Draft) và Cache offline dưới trình duyệt.
 * 2. Firebase Database: Gửi, sửa, xóa và lấy danh sách đơn kính.
 */

import { db } from './config.js'; // Import instance kết nối Firebase từ file config
import { ref, push, set, update, remove, get, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

/* ==========================================================================
 * PHẦN 1: TƯƠNG TÁC LOCAL (INDEXED-DB) - LƯU NHÁP & CACHE
 * ========================================================================== */

const DB_NAME = "DonKinhAppDB";
const STORE_NAME = "Drafts";
let dbPromise;

/**
 * Khởi tạo hoặc kết nối tới IndexedDB cục bộ
 */
export function getDB() {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = (e) => {
                const localDb = e.target.result;
                if (!localDb.objectStoreNames.contains(STORE_NAME)) {
                    localDb.createObjectStore(STORE_NAME);
                }
            };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }
    return dbPromise;
}

/**
 * Lưu dữ liệu vào Local Database
 */
export async function saveToDB(key, val) {
    const database = await getDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(val, key);
        tx.oncomplete = () => resolve(); 
        tx.onerror = () => reject(tx.error);
    });
}

/**
 * Lấy dữ liệu từ Local Database
 */
export async function getFromDB(key) {
    const database = await getDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(key);
        req.onsuccess = () => resolve(req.result); 
        req.onerror = () => reject(req.error);
    });
}

/**
 * Xóa dữ liệu khỏi Local Database
 */
export async function deleteFromDB(key) {
    const database = await getDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(key);
        tx.oncomplete = () => resolve(); 
        tx.onerror = () => reject(tx.error);
    });
}


/* ==========================================================================
 * PHẦN 2: TƯƠNG TÁC CLOUD (FIREBASE REALTIME DATABASE)
 * ========================================================================== */

/**
 * Lấy danh sách Đơn kính từ Firebase
 * @param {number} limit - Giới hạn số lượng bản ghi (tránh quá tải RAM)
 * @returns {Array} Mảng các đơn kính đã được sắp xếp mới nhất lên đầu
 */
export async function fetchDonKinhList(limit = 300) {
    // Sử dụng limitToLast để chống sập RAM khi db có hàng vạn bản ghi
    const donKinhQuery = query(ref(db, "donKinh"), orderByChild("createdAt"), limitToLast(limit));
    const snapshot = await get(donKinhQuery);
    
    let results = [];
    if (snapshot.exists()) {
        snapshot.forEach((child) => { 
            results.push({ id: child.key, ...child.val() }); 
        });
        results.reverse(); // Đảo ngược mảng để bản ghi mới nhất hiển thị trên cùng
    }
    return results;
}

/**
 * Thêm mới một Đơn kính
 * @param {Object} recordData - Dữ liệu đơn kính
 * @returns {string} ID của bản ghi vừa tạo
 */
export async function createDonKinh(recordData) {
    const newDocRef = push(ref(db, "donKinh"));
    await set(newDocRef, recordData);
    return newDocRef.key;
}

/**
 * Cập nhật một Đơn kính đã có
 * @param {string} id - ID của bản ghi
 * @param {Object} updateData - Dữ liệu cần cập nhật
 */
export async function updateDonKinh(id, updateData) {
    await update(ref(db, "donKinh/" + id), updateData);
}

/**
 * Xóa một Đơn kính
 * @param {string} id - ID của bản ghi
 */
export async function deleteDonKinh(id) {
    await remove(ref(db, "donKinh/" + id));
}

/**
 * Lấy danh sách cài đặt các tùy chọn sổ xuống (Autocomplete Dropdowns)
 * @returns {Object|null} Object chứa mảng các địa chỉ, thị lực, độ khúc xạ...
 */
export async function fetchDropdownSettings() {
    const snapshot = await get(ref(db, "settings/dropdowns"));
    return snapshot.exists() ? snapshot.val() : null;
}