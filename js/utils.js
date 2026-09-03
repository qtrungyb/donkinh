/**
 * ============================================================================
 * UTILS.JS - CÁC HÀM TIỆN ÍCH DÙNG CHUNG
 * ============================================================================
 * Chứa các hàm xử lý chuỗi, định dạng số liệu, thông báo và tối ưu sự kiện.
 */

/**
 * 1. Chống lỗi XSS (Cross-Site Scripting) khi in dữ liệu người dùng nhập ra HTML
 */
export function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>'"]/g, function (tag) {
        const charsToReplace = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        };
        return charsToReplace[tag] || tag;
    });
}

/**
 * 2. Hiển thị thông báo Toast trên màn hình
 * @param {string} message - Nội dung thông báo
 * @param {string} type - Loại thông báo ('success' hoặc 'error')
 */
export function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'error' : ''}`;
    toast.innerText = message;
    container.appendChild(toast);
    
    // Tự động xóa khỏi DOM sau 3 giây
    setTimeout(() => { 
        if (container.contains(toast)) container.removeChild(toast); 
    }, 3000);
}

/**
 * 3. Viết hoa chữ cái đầu của mỗi từ (Dùng cho Tên, Địa chỉ)
 */
export function toTitleCase(str) { 
    if (!str) return '';
    return str.toLowerCase().replace(/(?:^|\s)\S/g, function(a) { 
        return a.toUpperCase(); 
    }); 
}

/**
 * 4. Bôi đậm (Highlight) từ khóa tìm kiếm trong kết quả trả về
 */
export function highlightMatch(text, query) {
    if (!query || !text) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return String(text).replace(regex, '<span class="highlight-text">$1</span>');
}

/**
 * 5. Định dạng lại các con số khúc xạ (Diopter) 
 * Tự động thêm dấu +, -, làm tròn theo bước nhảy 0.25 (VD: 1.5 -> +1.50)
 */
export function formatDiopterValue(val) {
    if (!val) return '';
    
    if (val.trim().toLowerCase() === 'plano') {
        return 'Plano';
    }

    val = val.replace(/,/g, '.');
    let sign = '+';
    if (val.startsWith('-')) { 
        sign = '-'; 
        val = val.substring(1); 
    } else if (val.startsWith('+')) { 
        val = val.substring(1); 
    }
    
    val = val.replace(/[^0-9.]/g, '');
    if (!val) return '';
    
    let parts = val.split('.');
    let whole = parseInt(parts[0]) || 0;
    if (whole > 20) whole = 20; // Giới hạn khúc xạ tối đa
    
    let decimalStr = '00';
    if (parts.length > 1 && parts[1].length > 0) {
        let frac = parts[1].padEnd(2, '0').substring(0, 2);
        let roundedFrac = Math.round(parseInt(frac) / 25) * 25;
        if (roundedFrac === 100) { 
            roundedFrac = 0; 
            whole += 1; 
            if (whole > 20) whole = 20; 
        }
        decimalStr = roundedFrac === 0 ? '00' : roundedFrac.toString();
    }
    return sign + whole + '.' + decimalStr;
}

/**
 * 6. Kiểm tra và Ẩn/Hiện nút Xóa (Clear Button) trong các ô input
 */
export function toggleClearButtons() {
    document.querySelectorAll('.input-clear-wrapper input').forEach(input => {
        const btn = input.parentElement.querySelector('.clear-btn');
        if (btn) btn.style.display = input.value.trim() !== '' ? 'flex' : 'none';
    });
}

/**
 * 7. Debounce - Trì hoãn thực thi hàm (Tối ưu I/O, chống gọi hàm liên tục khi gõ phím)
 * @param {Function} func - Hàm cần trì hoãn
 * @param {number} wait - Thời gian đợi (ms)
 */
export function debounce(func, wait) {
    let timeout;
    const debounced = function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
    
    // Phương thức chủ động hủy (ngăn memory leak)
    debounced.cancel = function() {
        clearTimeout(timeout);
    };
    
    return debounced;
}