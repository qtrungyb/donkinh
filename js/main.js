/**
 * ============================================================================
 * MAIN.JS - BỘ NÃO ĐIỀU PHỐI (CONTROLLER)
 * ============================================================================
 */

// 1. IMPORT CÁC MODULE FIREBASE
import { auth, db } from './config.js';
import { 
    signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword, 
    EmailAuthProvider, reauthenticateWithCredential, setPersistence, 
    browserLocalPersistence, browserSessionPersistence 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, get, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// 2. IMPORT MODULE LOCAL CỦA DỰ ÁN
import { AppState } from './store.js';
import { escapeHTML, showToast, toTitleCase, highlightMatch, formatDiopterValue, toggleClearButtons, debounce } from './utils.js';
import { getDB, saveToDB, getFromDB, deleteFromDB, fetchDonKinhList, createDonKinh, updateDonKinh, deleteDonKinh, fetchDropdownSettings } from './database.js';
import { generatePrintHtml, generateWordHtml } from './templates.js';

// ============================================================================
// TỪ ĐIỂN DOM (Gom nhóm mọi truy xuất HTML vào một chỗ để dễ bảo trì)
// ============================================================================
const DOM = {
    views: {
        login: document.getElementById('loginScreen'),
        mainApp: document.getElementById('mainApp'),
        dashboard: document.getElementById('dashboardView'),
        form: document.getElementById('formView')
    },
    auth: {
        form: document.getElementById('loginForm'),
        email: document.getElementById('loginEmail'),
        pass: document.getElementById('loginPassword'),
        remember: document.getElementById('rememberMe'),
        btnLogout: document.getElementById('btnLogout'),
        btnChangePass: document.getElementById('btnOpenChangePass'),
        modalPass: document.getElementById('changePasswordModal'),
        formPass: document.getElementById('changePasswordForm')
    },
    user: {
        display: document.getElementById('userEmailDisplay'),
        role: document.getElementById('userRoleDisplay'),
        avatar: document.getElementById('userAvatar')
    },
    dashboard: {
        list: document.getElementById('dashboardList'),
        searchInput: document.getElementById('dashboardSearchInput'),
        searchClear: document.getElementById('dashSearchClear'),
        btnSearch: document.getElementById('btnSearchSubmit'),
        btnLoadMore: document.getElementById('dashLoadMoreBtn')
    },
    form: {
        title: document.getElementById('formTitle'),
        mainForm: document.getElementById('donKinhForm'),
        btnCreateNew: document.getElementById('btnCreateNew'),
        btnDraft: document.getElementById('btnDashboardDraft'),
        btnDelDraft: document.getElementById('btnDeleteDraft'),
        navBack: document.querySelectorAll('.navBackToDashBtn'),
        hoTen: document.getElementById('hoTen'),
        sdt: document.getElementById('sdt'),
        tuoi: document.getElementById('tuoi'),
        gioi: document.getElementById('gioi'),
        diaChi: document.getElementById('diaChi'),
        ngayKham: document.getElementById('ngayKham'),
        chanDoan: document.getElementById('chanDoan'),
        btnClearDiag: document.getElementById('btnClearDiag'),
        blockKinh1: document.getElementById('blockKinh1'),
        blockKinh2: document.getElementById('blockKinh2'),
        btnAddKinh2: document.getElementById('btnAddKinh2'),
        btnRemoveKinh2: document.getElementById('btnRemoveKinh2'),
        kcDongTu1: document.getElementById('kcDongTu_1'),
        kcDongTu2: document.getElementById('kcDongTu_2')
    },
    actions: {
        save: document.getElementById('btnSaveSheet'),
        cancelEdit: document.getElementById('btnCancelEdit'),
        editAfterSave: document.getElementById('btnEditAfterSave'),
        deleteAfterSave: document.getElementById('btnDeleteAfterSave'),
        print: document.getElementById('btnPrint'),
        exportWord: document.getElementById('btnExport'),
        exportImg: document.getElementById('btnExportImg'),
        backBottom: document.getElementById('btnBackToDashBottom')
    },
    modal: {
        overlay: document.getElementById('detailModal'),
        close: document.getElementById('btnCloseModal'),
        name: document.getElementById('modalPatientName'),
        tuoi: document.getElementById('modalPatientTuoi'),
        gioi: document.getElementById('modalPatientGioi'),
        sdt: document.getElementById('modalPatientSdt'),
        diag: document.getElementById('modalPatientDiag'),
        grid: document.getElementById('modalTypographicGrid'),
        iframe: document.getElementById('modalIframe'),
        btnEdit: document.getElementById('modalBtnEdit'),
        btnExport: document.getElementById('modalBtnExport'),
        btnExportImg: document.getElementById('modalBtnExportImg'),
        btnPrint: document.getElementById('modalBtnPrint'),
        // THÊM 3 DÒNG NÀY:
        qrCode: document.getElementById('modalQrCode'),
        btnPreviewMobile: document.getElementById('modalBtnPreviewMobile'),
        btnClosePreviewMobile: document.getElementById('btnClosePreviewMobile')
    }
};

// ============================================================================
// KHỞI TẠO ỨNG DỤNG
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    setupAuthListeners();
    setupUIEventListeners();
    setupFormEventListeners();
    setupAutocompletes();
});

// --- THEME ---
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    themeToggle.textContent = currentTheme === 'dark' ? 'GIAO DIỆN SÁNG' : 'GIAO DIỆN TỐI';
    
    themeToggle.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        let switchToTheme = theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', switchToTheme);
        localStorage.setItem('theme', switchToTheme);
        themeToggle.textContent = switchToTheme === 'dark' ? 'GIAO DIỆN SÁNG' : 'GIAO DIỆN TỐI';
    });
}

// ============================================================================
// XÁC THỰC (AUTHENTICATION)
// ============================================================================
function setupAuthListeners() {
    const savedEmail = localStorage.getItem('savedDonKinhEmail');
    if (savedEmail) {
        DOM.auth.email.value = savedEmail;
        DOM.auth.remember.checked = true;
    }

    DOM.auth.form.addEventListener('submit', (e) => {
        e.preventDefault();
        let rawEmail = DOM.auth.email.value.trim();
        const pass = DOM.auth.pass.value;
        const isRememberMe = DOM.auth.remember.checked;
        
        if (isRememberMe) localStorage.setItem('savedDonKinhEmail', rawEmail);
        else localStorage.removeItem('savedDonKinhEmail');
        
        let email = rawEmail.includes('@') ? rawEmail : rawEmail + '@donkinh.com';
        const persistenceType = isRememberMe ? browserLocalPersistence : browserSessionPersistence;

        setPersistence(auth, persistenceType)
            .then(() => signInWithEmailAndPassword(auth, email, pass))
            .then(() => { 
                showToast("Đăng nhập thành công!");
                DOM.auth.form.reset();
                if (isRememberMe && savedEmail) DOM.auth.email.value = savedEmail;
            })
            .catch(error => {
                showToast("Đăng nhập thất bại. Vui lòng kiểm tra lại!", "error");
                console.error("Lỗi đăng nhập:", error);
            });
    });

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            DOM.views.login.style.display = 'none';
            DOM.views.mainApp.style.display = 'block';
            
            const defaultName = user.email.split('@')[0];
            DOM.user.display.innerText = "ĐANG TẢI...";
            DOM.user.role.innerText = "KẾT NỐI DB...";
            DOM.user.avatar.innerText = "⏳";
            
            try {
                const userRef = ref(db, "users/" + user.uid);
                const snapshot = await get(userRef);
                
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    const displayName = userData.displayName || defaultName;
                    AppState.userRole = userData.role || 'staff';
                    
                    let roleName = AppState.userRole === 'admin' ? "Admin" : (AppState.userRole === 'doctor' ? "Bác sĩ" : "Nhân viên");
                    
                    DOM.user.display.innerText = displayName;
                    DOM.user.role.innerText = roleName;
                    const nameParts = displayName.trim().split(/\s+/);
                    DOM.user.avatar.innerText = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
                } else {
                    const newUserData = { email: user.email, displayName: defaultName, role: "staff", createdAt: Date.now() };
                    await set(userRef, newUserData);
                    AppState.userRole = "staff";
                    DOM.user.display.innerText = defaultName;
                    DOM.user.role.innerText = "Nhân viên";
                    DOM.user.avatar.innerText = defaultName.charAt(0).toUpperCase();
                    showToast("Chào mừng! Tài khoản mới đã được khởi tạo.");
                }
            } catch (error) {
                console.error("Lỗi khi xử lý dữ liệu người dùng:", error);
                DOM.user.display.innerText = defaultName;
                DOM.user.role.innerText = "Lỗi kết nối";
                DOM.user.avatar.innerText = "!";
            }

            loadDashboardData(); 
            loadAllSuggestions(); 
            checkDraftStatus(); 
        } else {
            DOM.views.login.style.display = 'flex';
            DOM.views.mainApp.style.display = 'none';
        }
    });

    DOM.auth.btnLogout.addEventListener('click', async () => {
        await deleteFromDB('donKinhCache');
        await deleteFromDB('donKinhDraft');
        signOut(auth);
    });
    
    // Đổi mật khẩu
    DOM.auth.btnChangePass.addEventListener('click', () => { DOM.auth.modalPass.style.display = 'flex'; DOM.auth.formPass.reset(); });
    document.getElementById('btnCloseChangePass').addEventListener('click', () => { DOM.auth.modalPass.style.display = 'none'; });
    DOM.auth.formPass.addEventListener('submit', (e) => {
        e.preventDefault();
        const oldPass = document.getElementById('oldPassword').value;
        const newPass = document.getElementById('newPassword').value;
        if (newPass !== document.getElementById('confirmNewPassword').value) { showToast("Mật khẩu mới không khớp!"); return; }
        
        const user = auth.currentUser;
        if (user) {
            reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, oldPass))
                .then(() => updatePassword(user, newPass))
                .then(() => { showToast("Đổi mật khẩu thành công!"); DOM.auth.modalPass.style.display = 'none'; })
                .catch(() => showToast("Lỗi hệ thống hoặc sai mật khẩu cũ!", "error"));
        }
    });
}

// ============================================================================
// UI & EVENT LISTENERS
// ============================================================================
function setupUIEventListeners() {
    DOM.form.btnCreateNew.addEventListener('click', showFormView);
    DOM.form.btnDraft.addEventListener('click', () => restoreDraft(true));
    DOM.form.btnDelDraft.addEventListener('click', clearDraftAndReturn);
    DOM.form.navBack.forEach(btn => btn.addEventListener('click', showDashboardView));
    
    DOM.form.btnAddKinh2.addEventListener('click', () => toggleKinh2(true));
    DOM.form.btnRemoveKinh2.addEventListener('click', () => toggleKinh2(false));

    DOM.actions.save.addEventListener('click', saveToSheet);
    DOM.actions.cancelEdit.addEventListener('click', cancelEdit);
    DOM.actions.editAfterSave.addEventListener('click', enterEditModeAfterSave);
    DOM.actions.deleteAfterSave.addEventListener('click', deleteRecord);
    DOM.actions.print.addEventListener('click', printA5);
    DOM.actions.exportWord.addEventListener('click', exportWord);
    DOM.actions.exportImg.addEventListener('click', exportImageFromForm);
    
    DOM.modal.btnExportImg.addEventListener('click', exportImageFromModal);
    DOM.modal.close.addEventListener('click', closeModal);
    
    // BẮT ĐẦU THÊM MỚI: Bật/Tắt Bản xem trước Fullscreen trên điện thoại
    if(DOM.modal.btnPreviewMobile) {
        DOM.modal.btnPreviewMobile.addEventListener('click', () => {
            document.querySelector('.modal-container').classList.add('show-preview');
        });
    }
    if(DOM.modal.btnClosePreviewMobile) {
        DOM.modal.btnClosePreviewMobile.addEventListener('click', () => {
            document.querySelector('.modal-container').classList.remove('show-preview');
        });
    }
    // KẾT THÚC THÊM MỚI
    
    DOM.modal.btnEdit.addEventListener('click', () => {
        const index = DOM.modal.overlay.dataset.currentIndex;
        if(index !== undefined) startEditing(index);
    });
    DOM.modal.btnPrint.addEventListener('click', () => printFromHtmlString(DOM.modal.iframe.srcdoc));
    DOM.modal.btnExport.addEventListener('click', () => {
        const index = DOM.modal.overlay.dataset.currentIndex;
        if(index !== undefined) exportWordFromHtmlString(generateWordHtml(AppState.currentSearchResults[index].jsonData));
    });

    DOM.dashboard.btnSearch.addEventListener('click', searchKinhDashboard);
    DOM.dashboard.searchClear.addEventListener('click', () => {
        DOM.dashboard.searchInput.value = "";
        DOM.dashboard.searchClear.style.display = 'none';
        searchKinhDashboard();
    });
    
    let searchTimeout;
    DOM.dashboard.searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(searchKinhDashboard, 300);
    });

    DOM.dashboard.btnLoadMore.addEventListener('click', () => renderDashboardMore(AppState.currentSearchResults));

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
        if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            if (DOM.views.form.style.display === 'block' && DOM.actions.save.style.display !== 'none') DOM.actions.save.click();
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
            e.preventDefault();
            if (DOM.views.form.style.display === 'block' && DOM.actions.print.style.display !== 'none') DOM.actions.print.click();
            else if (DOM.modal.overlay.style.display === 'flex') DOM.modal.btnPrint.click();
        }
    });
    // --- LẮNG NGHE SỰ KIỆN CUỘN CHO STICKY HEADER ---
    const stickyHeader = document.getElementById('stickyPatientHeader');
    const stickyName = document.getElementById('stickyName');
    const stickyAge = document.getElementById('stickyAge');
    
    window.addEventListener('scroll', function() {
        // Chỉ kích hoạt khi biểu mẫu Form đang hiển thị
        if (DOM.views.form.style.display === 'block' && stickyHeader) {
            const nameInput = DOM.form.hoTen.value.trim();
            
            // Nếu đã nhập tên và cuộn qua mốc 250px (qua khỏi phần thông tin bệnh nhân đầu form)
            if (nameInput && window.scrollY > 250) {
                stickyName.innerText = nameInput;
                stickyAge.innerText = DOM.form.tuoi.value || '--';
                stickyHeader.classList.add('is-visible');
            } else {
                // Cuộn ngược lên đầu trang thì ẩn đi
                stickyHeader.classList.remove('is-visible');
            }
        }
    });
    // -------------------------------------------------
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('clear-btn')) {
            const targetId = e.target.getAttribute('data-target');
            const el = document.getElementById(targetId);
            if (el) { el.value = ''; el.focus(); el.dispatchEvent(new Event('input')); }
        }
        const card = e.target.closest('.result-card');
        if (card && DOM.dashboard.list.contains(card)) {
            // Chặn mở Detail nếu Context Menu đang hiện
            if (document.getElementById('hapticContextMenu') && document.getElementById('hapticContextMenu').classList.contains('show')) return;
            openDetailModal(card.getAttribute('data-index'));
        }
    });
	// ==========================================
    // LOGIC: KÉO ĐỂ LÀM MỚI (PULL-TO-REFRESH)
    // ==========================================
    let startY = 0; let currentY = 0; let isPulling = false;
    const ptrSpinner = document.getElementById('pullToRefresh');
    const dashboardView = document.getElementById('dashboardView');

    document.addEventListener('touchstart', (e) => {
        // Chỉ cho phép kéo khi đang cuộn ở tít trên cùng (scrollY === 0) và đang ở trang chủ
        if (window.scrollY === 0 && dashboardView.style.display !== 'none') {
            startY = e.touches[0].clientY;
            currentY = startY;
            isPulling = true;
            ptrSpinner.classList.remove('refreshing', 'resetting');
            ptrSpinner.style.transition = 'none'; // Bắt đầu bám sát ngón tay
        }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (!isPulling) return;
        currentY = e.touches[0].clientY;
        const pullDistance = currentY - startY;

        // Nếu kéo hướng xuống dưới
        if (pullDistance > 0 && window.scrollY === 0) {
            // Lực cản (Resistance): Kéo 10px thì vòng tròn chỉ di chuyển 4px, tạo cảm giác mút tay
            let visualPull = pullDistance * 0.4; 
            if (visualPull > 60) visualPull = 60 + (visualPull - 60) * 0.1; // Cản cực mạnh khi kéo quá đà

            ptrSpinner.style.opacity = Math.min(visualPull / 50, 1);
            ptrSpinner.style.transform = `translateX(-50%) translateY(${visualPull - 40}px) rotate(${visualPull * 3}deg)`;
        }
    }, { passive: true });

    document.addEventListener('touchend', async () => {
        if (!isPulling) return;
        isPulling = false;
        const pullDistance = currentY - startY;

        // Nếu quãng đường vuốt xuống đủ dài (> 120px) -> Kích hoạt load dữ liệu
        if (pullDistance > 120 && window.scrollY === 0) {
            ptrSpinner.classList.add('refreshing');
            
            // Chờ gọi dữ liệu từ Firebase
            await loadDashboardData(); 
            
            // Giữ vòng tròn xoay thêm 0.6s để báo hiệu hoàn thành rồi giấu đi
            setTimeout(() => {
                ptrSpinner.classList.remove('refreshing');
                ptrSpinner.classList.add('resetting');
                showToast("Đã cập nhật dữ liệu mới!");
            }, 600); 
        } else if (pullDistance > 0) {
            // Kéo nhẹ chưa đủ lực -> Bỏ qua, thu vòng tròn về
            ptrSpinner.classList.add('resetting');
        }
    });
	// ==========================================
    // LOGIC: ẤN GIỮ MỞ CONTEXT MENU (HAPTIC TOUCH)
    // ==========================================
    let pressTimer;
    let isLongPress = false;
    const ctxModal = document.getElementById('hapticContextMenu');
    const ctxName = document.getElementById('ctxPatientName');
    const ctxEdit = document.getElementById('ctxEditBtn');
    const ctxDel = document.getElementById('ctxDeleteBtn');
    let currentCtxIndex = null;

    if (ctxModal) {
        document.addEventListener('touchstart', (e) => {
            const card = e.target.closest('.result-card');
            if (!card || DOM.dashboard.list.contains(card) === false) return;
            
            isLongPress = false;
            card.classList.add('haptic-active'); // Hiệu ứng bóp lún thẻ

            pressTimer = setTimeout(() => {
                isLongPress = true;
                if (navigator.vibrate) navigator.vibrate(40); // Rung nảy nhẹ phần cứng
                
                const index = card.getAttribute('data-index');
                currentCtxIndex = index;
                const item = AppState.currentSearchResults[index];
                
                ctxName.innerText = item.hoTen;
                
                ctxModal.style.display = 'flex';
                setTimeout(() => ctxModal.classList.add('show'), 10);
            }, 450); // Ấn giữ gần 0.5s thì bung menu
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            clearTimeout(pressTimer);
            const card = e.target.closest('.result-card');
            if (card) card.classList.remove('haptic-active');
            
            // Nếu là ấn giữ, chặn hành động Click (mở Detail Modal) mặc định
            if (isLongPress && card) { e.preventDefault(); e.stopPropagation(); }
        });

        document.addEventListener('touchmove', () => {
            // Đang lướt mà lỡ chạm thì hủy ấn giữ
            clearTimeout(pressTimer);
            const activeCard = document.querySelector('.result-card.haptic-active');
            if (activeCard) activeCard.classList.remove('haptic-active');
        }, { passive: true });

        // Tắt Menu khi bấm ra ngoài
        ctxModal.addEventListener('click', (e) => {
            if (e.target === ctxModal) {
                ctxModal.classList.remove('show');
                setTimeout(() => ctxModal.style.display = 'none', 250);
            }
        });

        // Xử lý Sự kiện Nút
        ctxEdit.addEventListener('click', () => {
            ctxModal.classList.remove('show');
            setTimeout(() => { ctxModal.style.display = 'none'; startEditing(currentCtxIndex); }, 250);
        });

        ctxDel.addEventListener('click', async () => {
            ctxModal.classList.remove('show');
            setTimeout(async () => {
                ctxModal.style.display = 'none';
                AppState.currentSavedId = AppState.currentSearchResults[currentCtxIndex].id;
                await deleteRecord();
            }, 250);
        });
    }

    // ==========================================
    // LOGIC: VUỐT GẠT ĐỂ ẨN TOAST (SWIPE TO DISMISS)
    // ==========================================
    const toastContainer = document.getElementById('toastContainer');
    let toastStartX = 0;
    let activeToast = null;

    toastContainer.addEventListener('touchstart', (e) => {
        if (e.target.classList.contains('toast')) {
            toastStartX = e.touches[0].clientX;
            activeToast = e.target;
            activeToast.style.transition = 'none'; // Bám sát ngón tay
        }
    }, { passive: true });

    toastContainer.addEventListener('touchmove', (e) => {
        if (!activeToast) return;
        const currentX = e.touches[0].clientX;
        const deltaX = currentX - toastStartX;
        
        // Chỉ cho phép vuốt sang phải
        if (deltaX > 0) {
            activeToast.style.transform = `translateX(${deltaX}px)`;
            activeToast.style.opacity = 1 - (deltaX / 200); // Kéo càng xa càng mờ
        }
    }, { passive: true });

    toastContainer.addEventListener('touchend', (e) => {
        if (!activeToast) return;
        const currentX = e.changedTouches[0].clientX;
        const deltaX = currentX - toastStartX;

        activeToast.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
        
        // Nếu kéo qua một nửa (khoảng 80px), tạt văng nó ra ngoài luôn
        if (deltaX > 80) {
            activeToast.style.transform = 'translateX(120%)';
            activeToast.style.opacity = 0;
            const toastToRemove = activeToast;
            setTimeout(() => { if (toastToRemove.parentNode) toastToRemove.parentNode.removeChild(toastToRemove); }, 200);
        } else {
            // Vuốt hụt lực -> Bật nảy về vị trí cũ
            activeToast.style.transform = 'translateX(0)';
            activeToast.style.opacity = 1;
        }
        activeToast = null;
    });
}

function setupFormEventListeners() {
	// BẮT ĐẦU: KÍCH HOẠT BÀN PHÍM THÔNG MINH CHO MOBILE
    document.querySelectorAll('.number-input').forEach(input => {
        if(input.id === 'sdt') {
            input.setAttribute('inputmode', 'tel'); // Bàn phím gọi điện cho ô SĐT
        } else {
            input.setAttribute('inputmode', 'numeric'); // Bàn phím số nguyên cho ô Tuổi, PD
            input.setAttribute('pattern', '[0-9]*'); // Kích hoạt bàn phím số to trên iOS
        }
    });
    document.querySelectorAll('.diopter-input').forEach(input => {
        input.setAttribute('inputmode', 'decimal'); // Bàn phím số thập phân (có dấu chấm) cho Độ Cầu, Độ Trụ
    });
    // KẾT THÚC: BÀN PHÍM THÔNG MINH
    DOM.form.ngayKham.valueAsDate = new Date();
    
    DOM.form.hoTen.addEventListener('input', function() {
        document.getElementById('patientHistoryContainer').style.display = 'none';
        let start = this.selectionStart; this.value = this.value.toUpperCase(); this.setSelectionRange(start, start);
    });
    
    DOM.form.diaChi.addEventListener('input', function() { if (this.value.endsWith(' ')) this.value = toTitleCase(this.value); });
    DOM.form.diaChi.addEventListener('blur', function() { this.value = toTitleCase(this.value); });
    
    document.querySelectorAll('.number-input').forEach(input => {
        input.addEventListener('input', function() {
            const max = this.getAttribute('data-maxlength') || 20;
            this.value = this.value.replace(/[^0-9]/g, '').slice(0, max);
        });
    });

    // Visual Cues cho Bác Sĩ (Độ Khúc Xạ)
    document.querySelectorAll('.diopter-input').forEach(input => {
        input.addEventListener('blur', function() {
            this.value = formatDiopterValue(this.value);
            let val = parseFloat(this.value.replace('+', ''));
            if (!isNaN(val) && Math.abs(val) >= 10.00) {
                this.classList.add('clinical-warning');
                this.title = "Cảnh báo: Thông số khúc xạ cao, vui lòng kiểm tra lại!";
            } else {
                this.classList.remove('clinical-warning');
                this.title = "";
            }
            autoDiagnose();
        });
        
        // Mũi tên tăng giảm 0.25 Diop
        input.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                let rawVal = this.value.replace('+', '');
                let currentVal = parseFloat(rawVal) || 0;
                let step = 0.25;
                let newVal = e.key === 'ArrowUp' ? currentVal + step : currentVal - step;
                let sign = newVal > 0 ? '+' : '';
                let formatted = sign + newVal.toFixed(2);
                if (newVal === 0) formatted = '0.00';
                this.value = formatted;
                this.dispatchEvent(new Event('input'));
                autoDiagnose();
            }
        });
    });

    // Visual Cues (Khoảng cách đồng tử PD)
    document.querySelectorAll('.number-input').forEach(input => {
        input.addEventListener('blur', function() {
            if (this.id.includes('kcDongTu')) {
                let pd = parseInt(this.value);
                if (!isNaN(pd) && (pd < 45 || pd > 85)) {
                    this.classList.add('clinical-warning');
                    this.title = "Cảnh báo: PD bất thường (Mức bình thường từ 45-85mm)";
                } else {
                    this.classList.remove('clinical-warning');
                    this.title = "";
                }
            }
        });
    });

    document.querySelectorAll('.input-clear-wrapper input').forEach(input => {
        input.addEventListener('input', toggleClearButtons);
    });

    document.querySelectorAll('.diag-cb').forEach(cb => {
        cb.addEventListener('change', function() { updateDiag(this.getAttribute('data-eye'), this.getAttribute('data-type')); });
    });
    
    DOM.form.chanDoan.addEventListener('input', function() { this.dataset.manual = this.value.trim() !== "" ? "true" : "false"; });
    DOM.form.btnClearDiag.addEventListener('click', () => {
        document.querySelectorAll('.diag-table input[type="checkbox"]').forEach(c => c.checked = false);
        DOM.form.chanDoan.value = ""; 
        DOM.form.chanDoan.dataset.manual = "false";
    });

    // Auto-save Draft (Debounced 1s)
    const debouncedSaveDraft = debounce(saveDraft, 1000);
    DOM.form.mainForm.addEventListener('input', debouncedSaveDraft);
    DOM.form.mainForm.addEventListener('change', saveDraft);
    
    document.querySelectorAll('#donKinhForm input[type="text"]').forEach(input => {
        input.addEventListener('focus', function() { this.select(); });
    });

    DOM.form.mainForm.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
            e.preventDefault();
            const inputs = Array.from(this.querySelectorAll('input:not([disabled]):not([readonly])')).filter(el => el.offsetParent !== null);
            const index = inputs.indexOf(e.target);
            if (index > -1 && index < inputs.length - 1) inputs[index + 1].focus();
        }
    });

    DOM.form.tuoi.addEventListener('blur', function() {
        let val = parseInt(this.value);
        const currentYear = new Date().getFullYear();
        if (val > 1900 && val <= currentYear) {
            this.value = currentYear - val;
            showToast("Đã tự động quy đổi năm sinh sang tuổi");
        }
    });

    // Copy nhanh từ MP xuống MT
    document.querySelectorAll('.badge-mt').forEach(badge => {
        badge.title = "Click đúp để chép nhanh thông số từ Mắt Phải";
        badge.style.cursor = "pointer";
        badge.addEventListener('dblclick', function() {
            const isKinh2 = this.closest('#blockKinh2') !== null;
            const suffix = isKinh2 ? '_2' : '';
            ['cau', 'tru', 'truc', 'gc'].forEach(field => {
                const valMP = document.getElementById(`mp_${field}${suffix}`).value;
                const inputMT = document.getElementById(`mt_${field}${suffix}`);
                if(inputMT) { inputMT.value = valMP; inputMT.dispatchEvent(new Event('input')); }
            });
            showToast("Đã sao chép nhanh xuống Mắt Trái");
            autoDiagnose();
        });
    });

    DOM.form.kcDongTu1.addEventListener('input', function() {
        if (DOM.form.blockKinh2.style.display === 'block' && DOM.form.kcDongTu2.dataset.manual !== "true") {
            DOM.form.kcDongTu2.value = this.value;
            DOM.form.kcDongTu2.dispatchEvent(new Event('input'));
        }
    });
    DOM.form.kcDongTu2.addEventListener('input', function() { this.dataset.manual = this.value.trim() !== "" ? "true" : "false"; });
// --- BẮT ĐẦU: LOGIC SMART CHIPS HẸN TÁI KHÁM ---
    document.querySelectorAll('.btn-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            const ghiChuInput = document.getElementById('ghiChu');
            const currentGhiChu = ghiChuInput.value.trim();
            
            // 1. Lấy ngày khám gốc từ form (hoặc hôm nay nếu form trống)
            let baseDateInput = document.getElementById('ngayKham').value;
            let baseDate = baseDateInput ? new Date(baseDateInput) : new Date();
            
            // 2. Lấy số ngày/tháng cần cộng từ thuộc tính data của nút
            const addDays = parseInt(this.getAttribute('data-days'));
            const addMonths = parseInt(this.getAttribute('data-months'));
            
            if (addDays) baseDate.setDate(baseDate.getDate() + addDays);
            if (addMonths) baseDate.setMonth(baseDate.getMonth() + addMonths);
            
            // 3. Format lại ngày thành định dạng chuẩn DD/MM/YYYY
            const dd = String(baseDate.getDate()).padStart(2, '0');
            const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
            const yyyy = baseDate.getFullYear();
            
            const textToAppend = `Hẹn tái khám sau ${this.innerText.replace('+', '')} (ngày ${dd}/${mm}/${yyyy}).`;
            
            // 4. Xử lý chuỗi thông minh: Nếu đã có lịch hẹn cũ thì thay thế, nếu chưa có thì nối thêm
            if (currentGhiChu.includes("Hẹn tái khám")) {
                ghiChuInput.value = currentGhiChu.replace(/Hẹn tái khám.*/, textToAppend).trim();
            } else {
                ghiChuInput.value = currentGhiChu ? `${currentGhiChu} - ${textToAppend}` : textToAppend;
            }
            
            // 5. Kích hoạt sự kiện input để hệ thống tự động lưu nháp (Draft) và hiện nút Xóa (Clear Button)
            ghiChuInput.dispatchEvent(new Event('input')); 
            showToast(`Đã thêm lịch: ${dd}/${mm}/${yyyy}`);
        });
    });
}

// ============================================================================
// DASHBOARD LOGIC
// ============================================================================
async function loadDashboardData() {
    let cachedDataString = "";
    try {
        const cachedData = await getFromDB('donKinhCache');
        if (cachedData && cachedData.length > 0) {
            cachedDataString = JSON.stringify(cachedData);
            AppState.dashboardAllData = cachedData;
            AppState.currentSearchResults = cachedData;
            AppState.dashboardRenderCount = 0;
            DOM.dashboard.list.innerHTML = "";
            renderDashboardMore(cachedData);
        } else {
            DOM.dashboard.list.innerHTML = Array(6).fill(`<div class="skeleton-card"><div class="skeleton-header"><div class="skeleton-avatar"></div><div class="skeleton-title"></div></div><div class="skeleton-grid"><div><div class="skeleton-line w-40"></div><div class="skeleton-line w-80"></div></div><div><div class="skeleton-line w-40"></div><div class="skeleton-line w-80"></div></div><div style="grid-column: 1 / -1;"><div class="skeleton-line w-40"></div><div class="skeleton-line w-80"></div></div></div><div style="border-top: 2px solid var(--border-color); padding-top: 16px;"><div class="skeleton-line" style="width: 100%; margin-bottom: 8px;"></div><div class="skeleton-line" style="width: 70%;"></div></div></div>`).join('');
        }
    } catch (e) { console.warn("Chưa có cache cục bộ."); }

    try {
        const results = await fetchDonKinhList(300); // Giới hạn 300 bản ghi mới nhất chống treo
        AppState.dashboardAllData = results;
        const newDataString = JSON.stringify(results);
        
        if (newDataString !== cachedDataString) {
            if (DOM.dashboard.searchInput.value.trim() === "") {
                AppState.currentSearchResults = results;
                AppState.dashboardRenderCount = 0;
                DOM.dashboard.list.innerHTML = "";
                renderDashboardMore(results);
            }
            await saveToDB('donKinhCache', results);
        }
    } catch (err) { 
        console.error("Lỗi đồng bộ Firebase:", err);
        if (AppState.dashboardAllData.length === 0) {
            if (err.message && err.message.includes("Permission denied")) {
                DOM.dashboard.list.innerHTML = "<div class='empty-search' style='grid-column: 1 / -1; color: var(--danger-color);'>LỖI: TỪ CHỐI QUYỀN TRUY CẬP. VUI LÒNG ĐĂNG NHẬP LẠI.</div>";
                showToast("Phiên đăng nhập hết hạn!", "error");
            } else {
                DOM.dashboard.list.innerHTML = "<div class='empty-search' style='grid-column: 1 / -1;'>LỖI KẾT NỐI MÁY CHỦ.</div>"; 
            }
        }
    }
}

function renderDashboardMore(dataArray) {
    const nextBatch = dataArray.slice(AppState.dashboardRenderCount, AppState.dashboardRenderCount + AppState.DASH_ITEMS_PER_LOAD);
    
    if (dataArray.length === 0) {
        let emptyHtml = `<div class='empty-search'><div class="empty-title">KHÔNG CÓ DỮ LIỆU ĐƠN KÍNH</div>`;
        if (AppState.currentSearchQuery) {
            const safeQuery = escapeHTML(AppState.currentSearchQuery).toUpperCase();
            emptyHtml += `<div class="empty-subtitle">Không tìm thấy kết quả khớp với truy vấn: [ ${safeQuery} ]</div>
            <button class="btn btn-dark" style="max-width: 360px;" onclick="document.getElementById('btnCreateNew').click(); setTimeout(() => { const nameInput = document.getElementById('hoTen'); nameInput.value = '${safeQuery}'; nameInput.dispatchEvent(new Event('input')); nameInput.focus(); }, 150);">
            TẠO ĐƠN MỚI CHO "${safeQuery}"</button>`;
        } else {
            emptyHtml += `<div class="empty-subtitle">Hệ thống hiện chưa có bản ghi nào được lưu trữ.</div>`;
        }
        emptyHtml += `</div>`;
        DOM.dashboard.list.innerHTML = emptyHtml;
        DOM.dashboard.btnLoadMore.style.display = 'none';
        return;
    }

    const todayStr = new Date().toLocaleDateString('vi-VN');
    const htmlToAppend = nextBatch.map((r, index) => {
        const globalIndex = AppState.currentSearchResults.findIndex(item => item.id === r.id);
        const isToday = r.timestamp.includes(todayStr) ? `<span class="badge-new">MỚI</span>` : "";
        const safeHoTen = escapeHTML(r.hoTen || "");
        const safeSdt = escapeHTML(r.sdt || "");
        const safeTuoi = escapeHTML(r.jsonData.tuoi || "--");
        const safeChanDoan = escapeHTML(r.jsonData.chanDoan || "Chưa có chẩn đoán");
        const safeNgayKham = escapeHTML(r.jsonData.ngay ? `${r.jsonData.ngay}/${r.jsonData.thang}/${r.jsonData.nam}` : r.timestamp.split(' ')[0]);

        const displayHoTen = highlightMatch(safeHoTen, AppState.currentSearchQuery);
        const displaySdt = highlightMatch(safeSdt, AppState.currentSearchQuery);
        
        let maskedSdt = safeSdt;
        if (safeSdt.length >= 9) maskedSdt = safeSdt.substring(0, 4) + "***" + safeSdt.substring(safeSdt.length - 3);

        const sdtHtml = safeSdt ? `<span class="secure-data"><span class="masked-view">${maskedSdt}</span><span class="unmasked-view">${displaySdt}</span></span>` : '---';
        const nameParts = safeHoTen.trim().split(/\s+/);
        const firstLetter = safeHoTen && nameParts.length > 0 ? nameParts[nameParts.length - 1].charAt(0).toUpperCase() : "?";

        return `<div class="result-card" data-index="${globalIndex}" style="animation-delay: ${index * 0.04}s">
            <div class="result-info">
                <div class="result-name" data-letter="${firstLetter}">${displayHoTen} ${isToday}</div>
                <div class="result-meta-grid">
                    <div class="meta-item"><span class="meta-label">Tuổi / Giới tính</span><span class="meta-value">${safeTuoi} / ${r.jsonData.gioi || 'Nam'}</span></div>
                    <div class="meta-item"><span class="meta-label">Điện thoại</span><span class="meta-value">${sdtHtml}</span></div>
                    <div class="meta-item" style="grid-column: 1 / -1;"><span class="meta-label">Ngày khám</span><span class="meta-value">${safeNgayKham}</span></div>
                </div>
                <div class="result-diag" title="${safeChanDoan}">${safeChanDoan}</div>
            </div>
        </div>`;
    }).join('');

    if(AppState.dashboardRenderCount === 0) DOM.dashboard.list.innerHTML = htmlToAppend;
    else DOM.dashboard.list.insertAdjacentHTML('beforeend', htmlToAppend);

    AppState.dashboardRenderCount += nextBatch.length;
    if (AppState.dashboardRenderCount < dataArray.length) {
        DOM.dashboard.btnLoadMore.style.display = 'block';
        DOM.dashboard.btnLoadMore.innerText = `HIỂN THỊ THÊM (${AppState.dashboardRenderCount} / ${dataArray.length})`;
    } else DOM.dashboard.btnLoadMore.style.display = 'none';
}

function searchKinhDashboard() {
    // 1. Lấy từ khóa người dùng gõ
    const rawQuery = DOM.dashboard.searchInput.value;
    const queryText = rawQuery.trim().toLowerCase();
    AppState.currentSearchQuery = queryText;
    
    // 2. Ẩn/Hiện nút dấu X (xóa text tìm kiếm)
    DOM.dashboard.searchClear.style.display = rawQuery.length > 0 ? 'flex' : 'none';

    // 3. Nếu ô tìm kiếm trống, hiển thị lại toàn bộ danh sách
    if(!queryText) {
        AppState.currentSearchResults = AppState.dashboardAllData;
        AppState.dashboardRenderCount = 0;
        DOM.dashboard.list.innerHTML = "";
        renderDashboardMore(AppState.dashboardAllData);
        return;
    }
    
    // 4. Nếu có từ khóa, lọc theo Tên hoặc Số điện thoại
    const filtered = AppState.dashboardAllData.filter(data => {
        return (data.hoTen || "").toLowerCase().includes(queryText) || 
               (data.sdt || "").includes(queryText);
    });
    
    // 5. Render kết quả ra màn hình
    AppState.currentSearchResults = filtered;
    AppState.dashboardRenderCount = 0;
    DOM.dashboard.list.innerHTML = "";
    renderDashboardMore(filtered);
}

// ============================================================================
// FORM LOGIC
// ============================================================================
function showFormView() {
    DOM.views.dashboard.classList.add('slide-out-left');
    DOM.views.form.style.display = 'block';
    DOM.views.form.classList.add('slide-in-right');
    resetForm();
    
    // Đợi Animation chạy xong rồi mới giấu Dashboard đi
    setTimeout(() => {
        DOM.views.dashboard.style.display = 'none';
        DOM.views.dashboard.classList.remove('slide-out-left');
        DOM.views.form.classList.remove('slide-in-right');
    }, 350);
}

function showDashboardView() {
    DOM.views.dashboard.style.display = 'block';
    DOM.views.dashboard.classList.add('slide-in-left');
    DOM.views.form.classList.add('slide-out-right');
    loadDashboardData(); 
    checkDraftStatus();
    
    // Đợi Form trượt ra ngoài xong rồi mới giấu đi
    setTimeout(() => {
        DOM.views.form.style.display = 'none';
        DOM.views.dashboard.classList.remove('slide-in-left');
        DOM.views.form.classList.remove('slide-out-right');
    }, 350);
}

function resetForm() {
    AppState.editingRecordId = null; AppState.currentSavedId = null;
    DOM.form.mainForm.reset();
    DOM.form.ngayKham.valueAsDate = new Date();
    document.getElementById('bsKham').value = "BSCKI. Chu Kiều Giang";
    toggleKinh2(false); 
    DOM.form.btnClearDiag.click();
    DOM.form.title.innerText = "Tạo Đơn Kính Mới";
    
    DOM.actions.save.style.display = 'inline-block';
    DOM.actions.save.innerText = "LƯU ĐƠN KÍNH";
    DOM.actions.save.className = "btn btn-green";
    
    document.getElementById('patientHistoryContainer').style.display = 'none';
    
    ['btnCancelEdit', 'btnPrint', 'btnExport', 'btnExportImg', 'btnEditAfterSave', 'btnDeleteAfterSave', 'btnBackToDashBottom'].forEach(id => document.getElementById(id).style.display = 'none');
    toggleFormLock(false); 
    checkDraftStatus();
    setTimeout(() => { DOM.form.hoTen.focus(); }, 100);
}

function toggleKinh2(show) {
    DOM.form.blockKinh2.style.display = show ? 'block' : 'none';
    DOM.form.btnAddKinh2.style.display = show ? 'none' : 'block';
    if(!show) {
        document.querySelectorAll('#blockKinh2 input[type="text"]').forEach(i => i.value = '');
        document.getElementById('md_gan_2').checked = true; document.getElementById('lk_1_2').checked = true;
    }
}

function autoDiagnose() {
    const checkEye = (prefix) => {
        const cauVal = document.getElementById(prefix + '_cau').value.trim();
        const truVal = document.getElementById(prefix + '_tru').value.trim();
        ['can', 'vien', 'loan'].forEach(t => document.getElementById('diag_' + prefix + '_' + t).checked = false);
        if (cauVal.includes('-')) document.getElementById('diag_' + prefix + '_can').checked = true;
        else if (cauVal.includes('+') && cauVal !== '+0.00' && cauVal !== '+0') document.getElementById('diag_' + prefix + '_vien').checked = true;
        if (truVal && truVal !== '0.00' && truVal !== '0' && truVal !== '+0.00' && truVal !== '-0.00') document.getElementById('diag_' + prefix + '_loan').checked = true;
    };
    checkEye('mp'); checkEye('mt');
    buildDiagnosisString();
}

function updateDiag(eyePrefix, type) {
    const isChecked = document.getElementById(eyePrefix + '_' + type).checked;
    if (isChecked) {
        if (type === 'can') document.getElementById(eyePrefix + '_vien').checked = false;
        else if (type === 'vien') document.getElementById(eyePrefix + '_can').checked = false;
        if (eyePrefix === 'diag_2m') { ['diag_mp', 'diag_mt'].forEach(prefix => { ['can', 'vien', 'loan'].forEach(t => { document.getElementById(prefix + '_' + t).checked = false; }); }); } 
        else if (eyePrefix === 'diag_mp' || eyePrefix === 'diag_mt') { ['can', 'vien', 'loan'].forEach(t => { document.getElementById('diag_2m_' + t).checked = false; }); }
    }
    buildDiagnosisString();
}

function buildDiagnosisString() {
    let parts = []; const eyes = ['diag_2m', 'diag_mp', 'diag_mt']; const labels = {'diag_2m': '2M', 'diag_mp': 'MP', 'diag_mt': 'MT'};
    eyes.forEach(e => {
        let can = document.getElementById(e + '_can').checked; let vien = document.getElementById(e + '_vien').checked; let loan = document.getElementById(e + '_loan').checked;
        if (can || vien || loan) { let base = can ? "cận" : (vien ? "viễn" : ""); let str = base ? (loan ? base + " - loạn thị" : base + " thị") : (loan ? "loạn thị" : ""); parts.push(labels[e] + " " + str); }
    });
    
    if (DOM.form.chanDoan.dataset.manual !== "true") {
        DOM.form.chanDoan.value = parts.join(", "); 
        toggleClearButtons(); 
    }
}

function getFormData() {
    const data = {};
    document.querySelectorAll('#donKinhForm input[type="text"]').forEach(input => data[input.id] = input.value);
    data.gioi = DOM.form.gioi.value;
    const dateObj = new Date(DOM.form.ngayKham.value);
    data.ngay = String(dateObj.getDate()).padStart(2, '0'); data.thang = String(dateObj.getMonth() + 1).padStart(2, '0'); data.nam = dateObj.getFullYear();
    data.donKinh = document.querySelector('input[name="donKinh_1"]:checked')?.value || "";
    data.loaiKinh = document.querySelector('input[name="loaiKinh_1"]:checked')?.value || "";
    data.hasKinh2 = DOM.form.blockKinh2.style.display === 'block';
    data.donKinh_2 = document.querySelector('input[name="donKinh_2"]:checked')?.value || "";
    data.loaiKinh_2 = document.querySelector('input[name="loaiKinh_2"]:checked')?.value || "";
    return data;
}

// --- LƯU TRỮ API ---
function setSavingState(isSaving) {
    if (isSaving) {
        DOM.actions.save.dataset.originalText = DOM.actions.save.innerHTML;
        DOM.actions.save.innerText = "ĐANG XỬ LÝ...";
        DOM.actions.save.style.opacity = "0.7";
        DOM.actions.save.style.pointerEvents = "none";
        DOM.actions.save.disabled = true;
    } else {
        DOM.actions.save.innerHTML = DOM.actions.save.dataset.originalText || "LƯU ĐƠN KÍNH";
        DOM.actions.save.style.opacity = "1";
        DOM.actions.save.style.pointerEvents = "auto";
        DOM.actions.save.disabled = false;
    }
}

async function saveToSheet(event) {
    if(event) event.preventDefault(); 
    if (!validateForm()) return; 
    if (DOM.actions.save.disabled) return;
    
    setSavingState(true);
    
    try {
        const data = getFormData();
        if (AppState.editingRecordId) {
            const updateData = { hoTen: data.hoTen, sdt: data.sdt || "", jsonData: data, lastEditedAt: Date.now() };
            await updateDonKinh(AppState.editingRecordId, updateData);
            showToast("Đã cập nhật thành công!"); 
        } else {
            const recordData = { hoTen: data.hoTen, sdt: data.sdt || "", timestamp: new Date().toLocaleString('vi-VN'), createdAt: Date.now(), jsonData: data };
            AppState.currentSavedId = await createDonKinh(recordData);
            showToast("Đã lưu mới Đơn Kính thành công!"); 
            await deleteFromDB('donKinhDraft'); 
            checkDraftStatus();
        }
        
        DOM.actions.save.style.display = 'none';
        DOM.actions.cancelEdit.style.display = 'none';
        ['btnBackToDashBottom', 'btnPrint', 'btnExport', 'btnExportImg', 'btnEditAfterSave'].forEach(id => document.getElementById(id).style.display = 'inline-block');
        DOM.actions.deleteAfterSave.style.display = AppState.userRole === 'admin' ? 'inline-block' : 'none';
        
        AppState.editingRecordId = null; 
        toggleFormLock(true);

    } catch (err) { 
        console.error("Lỗi lưu dữ liệu:", err);
        showToast(err.message && err.message.includes("Permission denied") ? "Lỗi: Bạn không có quyền sửa đơn kính này!" : "Lỗi kết nối tới Firebase", "error"); 
    } finally {
        setSavingState(false);
    }
}

function validateForm() {
    const requiredIds = ['hoTen', 'tuoi', 'diaChi', 'kcDongTu_1', 'mp_cau', 'mt_cau'];
    let isValid = true; let firstInvalid = null;
    for(let id of requiredIds) {
        const el = document.getElementById(id);
        if(el && !el.value.trim()) { isValid = false; el.style.borderColor = 'var(--danger-color)'; if(!firstInvalid) firstInvalid = el; } 
        else if(el) el.style.borderColor = 'transparent'; 
    }
    if (DOM.form.blockKinh2.style.display === 'block') {
        for(let id of ['kcDongTu_2', 'mp_cau_2', 'mt_cau_2']) {
            const el = document.getElementById(id);
            if(el && !el.value.trim()) { isValid = false; el.style.borderColor = 'var(--danger-color)'; if(!firstInvalid) firstInvalid = el; } 
            else if(el) el.style.borderColor = 'transparent';
        }
    }
    if(!isValid) { 
        showToast("Vui lòng điền đầy đủ các trường bắt buộc có dấu *.", "error"); 
        if(firstInvalid) {
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => firstInvalid.focus(), 300);
        }
    }
    return isValid;
}

function startEditing(index) {
    closeModal(); showFormView(); 
    AppState.editingRecordId = AppState.currentSearchResults[index].id; 
    AppState.currentSavedId = AppState.editingRecordId;
    
    DOM.form.title.innerText = "Chỉnh Sửa Đơn Kính";
    DOM.actions.save.style.display = 'inline-block';
    DOM.actions.save.innerHTML = "CẬP NHẬT";
    DOM.actions.save.className = "btn btn-danger"; 
    DOM.actions.cancelEdit.style.display = 'inline-block';
    ['btnPrint', 'btnExport', 'btnExportImg', 'btnEditAfterSave', 'btnDeleteAfterSave', 'btnBackToDashBottom'].forEach(id => document.getElementById(id).style.display = 'none');
    
    toggleFormLock(false); loadDataToForm(index);
}

function loadDataToForm(index) {
    const data = AppState.currentSearchResults[index].jsonData;
    DOM.form.btnClearDiag.click(); 
    document.querySelectorAll('#donKinhForm input[type="text"]').forEach(input => { if(data[input.id] !== undefined) input.value = data[input.id]; });
    if(data.kcDongTu_1 === undefined && data.kcDongTu) DOM.form.kcDongTu1.value = data.kcDongTu.replace('mm','').trim();
    DOM.form.gioi.value = data.gioi || "Nam";
    if (data.ngay && data.thang && data.nam) DOM.form.ngayKham.value = `${data.nam}-${String(data.thang).padStart(2, '0')}-${String(data.ngay).padStart(2, '0')}`;
    
    if(data.donKinh) { let el = document.querySelector(`input[name="donKinh_1"][value="${data.donKinh}"]`); if(el) el.checked = true; }
    if(data.loaiKinh) { let el = document.querySelector(`input[name="loaiKinh_1"][value="${data.loaiKinh}"]`); if(el) el.checked = true; }
    if(data.hasKinh2 || data.mp_cau_2 || data.mt_cau_2) {
        toggleKinh2(true);
        if(data.donKinh_2) { let el = document.querySelector(`input[name="donKinh_2"][value="${data.donKinh_2}"]`); if(el) el.checked = true; }
        if(data.loaiKinh_2) { let el = document.querySelector(`input[name="loaiKinh_2"][value="${data.loaiKinh_2}"]`); if(el) el.checked = true; }
    } else toggleKinh2(false);

    toggleClearButtons(); document.querySelectorAll('input').forEach(el => el.style.borderColor = '');
    DOM.form.chanDoan.dataset.manual = "true";
}

function cancelEdit() { if(confirm("Hủy sửa đơn này?")) showDashboardView(); }

function enterEditModeAfterSave() {
    AppState.editingRecordId = AppState.currentSavedId;
    DOM.actions.save.style.display = 'inline-block'; DOM.actions.save.innerHTML = "CẬP NHẬT"; DOM.actions.save.className = "btn btn-danger";
    DOM.actions.cancelEdit.style.display = 'inline-block';
    ['btnPrint', 'btnExport', 'btnExportImg', 'btnEditAfterSave', 'btnDeleteAfterSave', 'btnBackToDashBottom'].forEach(id => document.getElementById(id).style.display = 'none');
    toggleFormLock(false);
}

async function deleteRecord() {
    if(!AppState.currentSavedId || !confirm("Bạn có CHẮC CHẮN muốn xóa đơn kính này?")) return;
    try { 
        await deleteDonKinh(AppState.currentSavedId); 
        showToast("Đã xóa đơn kính."); 
        showDashboardView(); 
    } catch (err) { 
        showToast(err.message && err.message.includes("Permission denied") ? "Lỗi: Bạn không có quyền xóa dữ liệu này!" : "Lỗi xóa dữ liệu.", "error"); 
    }
}

function toggleFormLock(isLocked) {
    DOM.form.mainForm.querySelectorAll('input, select').forEach(input => input.disabled = isLocked);
    DOM.form.mainForm.querySelectorAll('button:not(.btn-green):not(.btn-danger):not(#btnBackToDashBottom):not(#btnEditAfterSave):not(#btnExport):not(#btnExportImg):not(#btnPrint):not(.navBackToDashBtn)').forEach(btn => { if(btn.closest('.actions') === null) btn.disabled = isLocked; });
    DOM.form.mainForm.querySelectorAll('.clear-btn, .remove-block-btn').forEach(btn => btn.style.setProperty('display', isLocked ? 'none' : '', isLocked ? 'important' : ''));
    if (!isLocked) toggleClearButtons();
}

// --- DRAFT (BẢN NHÁP) ---
async function saveDraft() {
    if (AppState.editingRecordId) return;
    await saveToDB('donKinhDraft', getFormData()); checkDraftStatus();
}
async function checkDraftStatus() {
    const draft = await getFromDB('donKinhDraft');
    if (draft) {
        DOM.form.btnDraft.style.display = 'inline-block'; DOM.form.btnCreateNew.style.display = 'none';
        DOM.form.btnDelDraft.style.display = (DOM.views.form.style.display === 'block' && !AppState.editingRecordId) ? 'inline-block' : 'none';
    } else {
        DOM.form.btnDraft.style.display = 'none'; DOM.form.btnCreateNew.style.display = 'inline-flex'; DOM.form.btnDelDraft.style.display = 'none';
    }
}
async function restoreDraft(fromDashboard = false) {
    const data = await getFromDB('donKinhDraft'); if(!data) return;
    try {
        if (fromDashboard) showFormView();
        document.querySelectorAll('#donKinhForm input[type="text"]').forEach(input => { if(data[input.id] !== undefined) input.value = data[input.id]; });
        if (data.gioi) DOM.form.gioi.value = data.gioi;
        if(data.donKinh) { let el = document.querySelector(`input[name="donKinh_1"][value="${data.donKinh}"]`); if(el) el.checked = true; }
        if(data.loaiKinh) { let el = document.querySelector(`input[name="loaiKinh_1"][value="${data.loaiKinh}"]`); if(el) el.checked = true; }
        if(data.hasKinh2) { toggleKinh2(true); if(data.donKinh_2) { let el = document.querySelector(`input[name="donKinh_2"][value="${data.donKinh_2}"]`); if(el) el.checked = true; } if(data.loaiKinh_2) { let el = document.querySelector(`input[name="loaiKinh_2"][value="${data.loaiKinh_2}"]`); if(el) el.checked = true; } }
        autoDiagnose(); toggleClearButtons(); showToast("Đã khôi phục bản nháp!");
    } catch(e) {}
}
async function clearDraftAndReturn() {
    if (!confirm("Bạn có CHẮC CHẮN muốn hủy đơn nháp này?")) return;
    await deleteFromDB('donKinhDraft'); resetForm(); showDashboardView(); showToast("Đã xóa đơn nháp.");
}

// --- AUTOCOMPLETE & LỊCH SỬ ---
async function loadAllSuggestions() {
    try {
        const data = await fetchDropdownSettings();
        if (data) {
            AppState.savedAddresses = data.diaChi || []; AppState.savedThiLucXa = data.thiLucXa || []; AppState.savedThiLucGan = data.thiLucGan || []; 
            AppState.savedCau = data.doCau || []; AppState.savedTru = data.doTru || []; AppState.savedTruc = data.truc || [];
        }
    } catch (err) {}
}
function setupAutocompletes() {
    setupPatientAutocomplete();
    
    const normalConfigs = [
        { id: 'diaChi', dropdownId: 'diaChiDropdown', source: () => AppState.savedAddresses },
        { id: 'tlng', dropdownId: 'tlng_Dropdown', source: () => AppState.savedThiLucGan },
        ...['mp_truc', 'mt_truc', 'mp_truc_2', 'mt_truc_2'].map(id => ({ id, dropdownId: id + '_Dropdown', source: () => AppState.savedTruc })),
        ...['mp_gc', 'mt_gc', 'mp_gc_2', 'mt_gc_2', 'tlkk_mp', 'tlkk_mt', 'tlkl_mp', 'tlkl_mt', 'tlkc_mp', 'tlkc_mt'].map(id => ({ id, dropdownId: id + '_Dropdown', source: () => AppState.savedThiLucXa }))
    ];

    const diopterConfigs = [
        ...['mp_cau', 'mt_cau', 'mp_cau_2', 'mt_cau_2'].map(id => ({ id, dropdownId: id + '_Dropdown', source: () => AppState.savedCau })),
        ...['mp_tru', 'mt_tru', 'mp_tru_2', 'mt_tru_2'].map(id => ({ id, dropdownId: id + '_Dropdown', source: () => AppState.savedTru }))
    ];

    normalConfigs.forEach(cfg => setupGenericAutocomplete(cfg.id, cfg.dropdownId, cfg.source, false));
    diopterConfigs.forEach(cfg => setupGenericAutocomplete(cfg.id, cfg.dropdownId, cfg.source, true));
}
function setupGenericAutocomplete(inputId, dropdownId, getArrayData, isDiopter = false) {
    const input = document.getElementById(inputId); const dropdown = document.getElementById(dropdownId); if(!input || !dropdown) return;
    function showDropdown(val) {
        const dataArray = getArrayData(); dropdown.innerHTML = '';
        let matches = val.trim() ? dataArray.filter(item => item.toLowerCase().includes(val.toLowerCase().trim())) : dataArray;
        if (matches.length > 0) {
            matches.forEach(item => {
                const div = document.createElement('div'); div.textContent = item;
                div.onmousedown = function(e) { e.preventDefault(); input.value = item; dropdown.style.display = 'none'; }; dropdown.appendChild(div);
            }); dropdown.style.display = 'block';
        } else dropdown.style.display = 'none';
    }
    input.addEventListener('focus', function() { showDropdown(this.value); });
    input.addEventListener('input', function() { if(isDiopter) this.value = this.value.replace(/[^\+\-0-9,\.]/g, ''); showDropdown(this.value); });
    input.addEventListener('blur', function() { setTimeout(() => dropdown.style.display = 'none', 200); });
}
function setupPatientAutocomplete() {
    const input = DOM.form.hoTen; const dropdown = document.getElementById('hoTenDropdown');
    const processSearch = debounce((val) => {
        dropdown.innerHTML = '';
        if (!val) { dropdown.style.display = 'none'; return; }
        
        let matches = []; let seen = new Set();
        for (let i = 0; i < AppState.dashboardAllData.length; i++) {
            let item = AppState.dashboardAllData[i];
            if ((item.hoTen || '').toLowerCase().includes(val)) {
                let uniqueKey = item.hoTen + "_" + item.sdt;
                if (!seen.has(uniqueKey)) { seen.add(uniqueKey); matches.push(item); if (matches.length >= 5) break; }
            }
        }
        
        if (matches.length > 0) {
            matches.forEach(patient => {
                const div = document.createElement('div');
                const safeHoTen = escapeHTML(patient.hoTen || "");
                const safeSdt = escapeHTML(patient.sdt || 'Trống');
                const safeTuoiPrefix = patient.jsonData.tuoi ? escapeHTML(patient.jsonData.tuoi) + ' tuổi, ' : '';
                const safeDiaChi = escapeHTML(patient.jsonData.diaChi || '');

                div.innerHTML = `<span style="font-weight: 800; color: var(--text-main);">${safeHoTen}</span> - ${safeSdt}<br><span style="font-size: 10px; color: var(--text-muted);">${safeTuoiPrefix}${safeDiaChi}</span>`;
                div.onmousedown = function(e) {
                    e.preventDefault(); 
                    input.value = patient.hoTen || '';
                    DOM.form.sdt.value = patient.sdt || ''; DOM.form.tuoi.value = patient.jsonData.tuoi || '';
                    DOM.form.gioi.value = patient.jsonData.gioi || 'Nam'; DOM.form.diaChi.value = patient.jsonData.diaChi || '';
                    dropdown.style.display = 'none'; showToast("Đã tải dữ liệu cũ"); 
                    document.querySelectorAll('#hoTen, #sdt, #tuoi, #diaChi').forEach(el => el.dispatchEvent(new Event('input')));
                    renderPatientHistory(patient.hoTen, patient.sdt);
                }; 
                dropdown.appendChild(div);
            }); 
            dropdown.style.display = 'block';
        } else dropdown.style.display = 'none';
    }, 300);

    input.addEventListener('input', () => processSearch(input.value.trim().toLowerCase()));
    input.addEventListener('blur', () => setTimeout(() => dropdown.style.display = 'none', 200));
}

function renderPatientHistory(hoTen, sdt) {
    const container = document.getElementById('patientHistoryContainer'); const list = document.getElementById('patientHistoryList');
    if (!hoTen) { container.style.display = 'none'; return; }

    const historyData = AppState.dashboardAllData.filter(item => (item.hoTen || "").toLowerCase() === hoTen.toLowerCase() && (item.sdt || "") === (sdt || ""));
    if (historyData.length === 0 || (historyData.length === 1 && historyData[0].id === AppState.editingRecordId)) { container.style.display = 'none'; return; }

    list.innerHTML = historyData.map(item => {
        const data = item.jsonData;
        const safeNgayKham = escapeHTML(data.ngay ? `${data.ngay}/${data.thang}/${data.nam}` : item.timestamp.split(' ')[0]);
        const safeChanDoan = escapeHTML(data.chanDoan || "Không ghi chú chẩn đoán");
        
        let metricsHtml = "Không có thông số kính 1";
        if (data.mp_cau || data.mt_cau) {
            const mpCau = data.mp_cau ? escapeHTML(data.mp_cau) : "---"; const mpTru = data.mp_tru ? ` C:${escapeHTML(data.mp_tru)}` : "";
            const mtCau = data.mt_cau ? escapeHTML(data.mt_cau) : "---"; const mtTru = data.mt_tru ? ` C:${escapeHTML(data.mt_tru)}` : "";
            metricsHtml = `MP: ${mpCau}${mpTru}<br>MT: ${mtCau}${mtTru}`;
        }
        return `<div class="history-card" title="Click đúp để copy chẩn đoán" ondblclick="document.getElementById('chanDoan').value='${safeChanDoan}'; toggleClearButtons();"><div class="h-date">${safeNgayKham}</div><div class="h-diag">${safeChanDoan}</div><div class="h-metrics">${metricsHtml}</div></div>`;
    }).join('');
    container.style.display = 'block';
}

// ============================================================================
// MODAL & IN ẤN / XUẤT ẢNH
// ============================================================================
function openDetailModal(index) {
    const item = AppState.currentSearchResults[index]; const data = item.jsonData;
    // 1. Reset trạng thái (Giấu bản xem trước nếu đang bật ở lần mở trước)
    document.querySelector('.modal-container').classList.remove('show-preview');

    // 2. Thuật toán sinh mã QR Code
    if (DOM.modal.qrCode && typeof QRious !== 'undefined') {
        const fNgay = String(data.ngay || '').padStart(2, '0'); 
        const fThang = String(data.thang || '').padStart(2, '0'); 
        const fNam = data.nam || '';
        
        const buildEyeStr = (cauId, truId, trucId) => {
            const cau = String(data[cauId] || "").trim();
            const tru = String(data[truId] || "").trim();
            const truc = String(data[trucId] || "").trim().replace(/°/g, ""); 
            if (!cau && !tru) return "0.00"; 
            let str = cau || "+0.00";
            if (tru && tru !== "0.00" && tru !== "0" && tru !== "+0.00" && tru !== "-0.00") str += `/${tru}` + (truc ? `x${truc}` : ``);
            return str;
        };

        const dataObj = {
            ten: String(item.hoTen || "Khách Hàng").trim(),
            tuoi: String(data.tuoi || "--").trim(), sdt: String(item.sdt || "---").trim(),
            mp: buildEyeStr('mp_cau', 'mp_tru', 'mp_truc'), mt: buildEyeStr('mt_cau', 'mt_tru', 'mt_truc'),
            pd: String(data.kcDongTu_1 || data.kcDongTu || "---").trim().replace('mm', ''),
            ngay: `${fNgay}/${fThang}/${fNam}`, cd: String(data.chanDoan || "").trim(), gc: String(data.ghiChu || "").trim(),
            tlkk_mp: String(data.tlkk_mp || "---").trim(), tlkk_mt: String(data.tlkk_mt || "---").trim(),
            tl_mp: String(data.mp_gc || "---").trim(), tl_mt: String(data.mt_gc || "---").trim()
        };
        
        // Mã hóa dữ liệu và truyền vào thẻ Canvas bằng thư viện QRious
        const encodedData = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(dataObj)))));
        const safeQrData = `https://donkinh-eea6b.web.app/don-kinh.html?data=${encodedData}`;
        
        new QRious({ element: DOM.modal.qrCode, value: safeQrData, size: 250, level: "M" });
    }
    DOM.modal.iframe.srcdoc = generatePrintHtml(data);
    DOM.modal.name.innerText = item.hoTen;
    DOM.modal.tuoi.innerText = data.tuoi || '--';
    DOM.modal.gioi.innerText = data.gioi || 'Nam';
    DOM.modal.sdt.innerText = item.sdt || 'Trống';
    DOM.modal.diag.innerText = data.chanDoan || 'Chưa có dữ liệu chẩn đoán';
    
    const pd = (data.kcDongTu_1 || data.kcDongTu || "---").replace('mm','').trim();
    DOM.modal.grid.innerHTML = `<div class="detail-grid"><div class="detail-eye-section"><div class="detail-eye-title" style="color: var(--accent-color);">MẮT PHẢI (MP)</div><div class="detail-row"><span>Cầu (SPH)</span><span class="detail-value">${data.mp_cau || "---"}</span></div><div class="detail-row"><span>Trụ (CYL)</span><span class="detail-value">${data.mp_tru || "---"}</span></div><div class="detail-row"><span>Trục (AXIS)</span><span class="detail-value">${data.mp_truc || "---"}</span></div><div class="detail-row"><span>Thị lực</span><span class="detail-value">${data.mp_gc || "---"}</span></div></div><div class="detail-eye-section"><div class="detail-eye-title">MẮT TRÁI (MT)</div><div class="detail-row"><span>Cầu (SPH)</span><span class="detail-value">${data.mt_cau || "---"}</span></div><div class="detail-row"><span>Trụ (CYL)</span><span class="detail-value">${data.mt_tru || "---"}</span></div><div class="detail-row"><span>Trục (AXIS)</span><span class="detail-value">${data.mt_truc || "---"}</span></div><div class="detail-row"><span>Thị lực</span><span class="detail-value">${data.mt_gc || "---"}</span></div></div></div><div style="margin-top: 16px; padding-top: 12px; border-top: 1px dashed var(--border-light); font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; display: flex; justify-content: space-between; align-items: center;"><span>Khoảng cách đồng tử (PD)</span><span style="color: var(--text-main); font-family: 'Courier New', Courier, monospace; font-size: 15px; font-weight: 800;">${pd} mm</span></div>`;

    DOM.modal.overlay.dataset.currentIndex = index; 
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.style.overflow = 'hidden';
    DOM.modal.overlay.style.display = 'flex';
}

function closeModal() { 
    DOM.modal.overlay.classList.add('is-closing');
    setTimeout(() => {
        DOM.modal.overlay.style.display = 'none'; 
        DOM.modal.overlay.classList.remove('is-closing'); 
        DOM.modal.iframe.srcdoc = ''; 
        document.body.style.paddingRight = ''; document.body.style.overflow = ''; 
    }, 320); 
}

function printA5() { if (validateForm()) printFromHtmlString(generatePrintHtml()); }
function exportWord() { if (validateForm()) exportWordFromHtmlString(generateWordHtml()); }
function printFromHtmlString(htmlContent) {
    const iframe = document.createElement('iframe'); iframe.style.display = 'none'; document.body.appendChild(iframe);
    iframe.contentWindow.document.open(); iframe.contentWindow.document.write(htmlContent); iframe.contentWindow.document.close();
    iframe.onload = function() { setTimeout(() => { iframe.contentWindow.focus(); iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 1000); }, 300); };
}
function exportWordFromHtmlString(htmlContent) {
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' }); const link = document.createElement("a");
    link.href = URL.createObjectURL(blob); link.download = "Don_Kinh.doc"; link.click();
}

function exportImageFromForm() {
    if (validateForm()) {
        let hoTen = DOM.form.hoTen.value || 'Khach_Hang';
        exportImageFromHtmlString(generatePrintHtml(), `Đơn Kính_${hoTen.trim().replace(/\s+/g, '_')}.jpg`);
    }
}
function exportImageFromModal() {
    const index = DOM.modal.overlay.dataset.currentIndex;
    if (index !== undefined) {
        const item = AppState.currentSearchResults[index];
        let hoTen = item.hoTen || 'Khach_Hang';
        exportImageFromHtmlString(generatePrintHtml(item.jsonData), `Đơn Kính_${hoTen.trim().replace(/\s+/g, '_')}.jpg`);
    }
}

export function exportImageFromHtmlString(htmlContent, fileName) {
    showToast("Đang khởi tạo ảnh chất lượng cao...");
    
    // 1. Tạo container ảo với kích thước chuẩn A5
    const container = document.createElement('div');
    container.style.cssText = 'position: absolute; left: -9999px; top: 0; width: 148mm; min-height: 210mm; background-color: #ffffff; z-index: -1000;';

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // 2. Bơm CSS nâng cấp độ sắc nét của chữ
    const styleNode = document.createElement('style');
    styleNode.innerHTML = `
        .print-container { 
            font-family: 'Times New Roman', serif; 
            font-size: 13pt; 
            line-height: 1.3; 
            color: #000; 
            padding: 15mm 10mm; 
            box-sizing: border-box; 
            width: 100%; 
            min-height: 210mm; 
            background: #fff; 
            
            /* CSS Tối ưu hóa render font chữ */
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: geometricPrecision; 
        } 
        .print-container .text-center { text-align: center; } 
        .print-container h2 { font-size: 16pt; margin: 0 0 15px 0; text-transform: uppercase; } 
        .print-container table.print-table { width: 100%; border-collapse: collapse; margin: 10px 0; } 
        .print-container table.print-table th, .print-container table.print-table td { border: 1px solid #000; padding: 4px; text-align: center; vertical-align: middle; } 
        .print-container .signature-box { float: right; text-align: center; width: 250px; margin-top: 20px; border: none !important; padding: 0 !important; display: block !important; font-family: 'Times New Roman', serif !important; } 
        .print-container .clearfix::after { content: ""; clear: both; display: table; }
    `;
    container.appendChild(styleNode);
    
    const bodyContent = document.createElement('div');
    bodyContent.className = 'print-container';
    bodyContent.innerHTML = doc.body.innerHTML;
    container.appendChild(bodyContent);
    document.body.appendChild(container);

    // Hàm phụ: Ép tải file xuống máy
    function forceDownloadBlob(blob, file_Name, domContainer) {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a'); 
        link.href = blobUrl; 
        link.download = file_Name;
        document.body.appendChild(link); 
        link.click(); 
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        showToast("Xuất ảnh thành công!");
    }

    // 3. Khởi chạy thư viện html2canvas sau khi DOM ảo đã sẵn sàng
    setTimeout(() => {
        if (typeof html2canvas === 'undefined') {
            showToast("Thư viện tạo ảnh chưa được tải!", "error");
            if (document.body.contains(container)) document.body.removeChild(container);
            return;
        }
        
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 850;
        
        // Tỷ lệ Scale: 4 cho Mobile (chống sập RAM), 5 cho PC (siêu nét)
        const hdScale = isMobile ? 4 : 5; 
        
        html2canvas(container, { 
            scale: hdScale, 
            useCORS: true, 
            backgroundColor: '#ffffff',
            logging: false // Tắt log để render nhanh hơn một chút
        }).then(canvas => {
            
            // XUẤT RA PNG THAY VÌ JPEG
            canvas.toBlob((blob) => {
                if (!blob) throw new Error("Lỗi xử lý dữ liệu ảnh");
                
                // Đổi đuôi tên file thành .png
                const safeFileName = fileName.replace('.jpg', '.png');
                const file = new File([blob], safeFileName, { type: "image/png" });
                
                if (isMobile && navigator.canShare && navigator.canShare({ files: [file] })) {
                    navigator.share({ files: [file], title: safeFileName })
                        .then(() => showToast("Đã chia sẻ ảnh!"))
                        .catch(err => forceDownloadBlob(blob, safeFileName, container));
                } else {
                    forceDownloadBlob(blob, safeFileName, container);
                }
            }, 'image/png'); // Mặc định PNG không bị nén mất viền chữ
            
        }).catch(err => {
            console.error("Lỗi xuất ảnh:", err);
            showToast("Có lỗi xảy ra khi tạo ảnh.", "error");
        }).finally(() => {
            if (document.body.contains(container)) document.body.removeChild(container);
        });
    }, 500); 
}
// Đăng ký Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker đăng ký thành công với scope: ', registration.scope);
            })
            .catch(err => {
                console.error('ServiceWorker đăng ký thất bại: ', err);
            });
    });
}