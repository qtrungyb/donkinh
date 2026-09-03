/**
 * ============================================================================
 * TEMPLATES.JS - CHỨA CÁC MẪU HTML XUẤT FILE (IN ẤN & WORD)
 * ============================================================================
 */

/**
 * 1. Hàm tạo chuỗi HTML để In khổ A5 / Xuất Ảnh
 * @param {Object|null} customData - Dữ liệu truyền vào (Nếu null sẽ tự lấy từ DOM)
 */
export function generatePrintHtml(customData = null) {
    const getVal = id => { 
        if (customData) { 
            if(id === 'kcDongTu_1' && customData[id] === undefined && customData['kcDongTu']) {
                return customData['kcDongTu'].replace('mm','').trim(); 
            }
            return customData[id] !== undefined ? customData[id] : ""; 
        } 
        return document.getElementById(id) ? document.getElementById(id).value : ""; 
    };

    const getRadioIcons = (name, options) => { 
        let val = ""; 
        if (customData) { 
            if (name === 'donKinh_1') val = customData.donKinh || ""; 
            else if (name === 'loaiKinh_1') val = customData.loaiKinh_1 || customData.loaiKinh || ""; 
            else if (name === 'donKinh_2') val = customData.donKinh_2 || ""; 
            else if (name === 'loaiKinh_2') val = customData.loaiKinh_2 || ""; 
        } else { 
            let checkedEl = document.querySelector(`input[name="${name}"]:checked`); 
            val = checkedEl ? checkedEl.value : ""; 
        } 
        return options.map(opt => (opt === val ? "☑ " : "☐ ") + opt).join("&nbsp;&nbsp;&nbsp;&nbsp;"); 
    };

    const buildV = (label, mp, mt) => { 
        const vMp = String(getVal(mp)).trim(); 
        const vMt = String(getVal(mt)).trim(); 
        if(!vMp && !vMt) return ""; 
        return `<tr><td style="width: 160px; border: none; padding: 3px 0; text-align: left;">${label}:</td><td style="width: 120px; border: none; padding: 3px 0; text-align: left;">${vMp ? '<b>MP:</b> ' + vMp : ''}</td><td style="border: none; padding: 3px 0; text-align: left;">${vMt ? '<b>MT:</b> ' + vMt : ''}</td></tr>`; 
    };

    const tlng = String(getVal('tlng')).trim(); 
    const tlngHtml = tlng ? `<tr><td style="border: none; padding: 3px 0; text-align: left;">Thị lực nhìn gần:</td><td colspan="2" style="border: none; padding: 3px 0; text-align: left;">N${tlng}@35cm</td></tr>` : "";
    
    const pd1 = String(getVal('kcDongTu_1')).trim(); 
    const pd1Html = pd1 ? `<div style="margin-top: 8px;"><b>Khoảng cách đồng tử (PD): ${pd1}mm</b></div>` : "";
    
    const pd2 = String(getVal('kcDongTu_2')).trim(); 
    const pd2Html = pd2 ? `<div style="margin-top: 8px;"><b>Khoảng cách đồng tử (PD): ${pd2}mm</b></div>` : "";
    
    let hasKinh2 = customData ? (customData.hasKinh2 || customData.mp_cau_2 || customData.mt_cau_2) : (document.getElementById('blockKinh2').style.display === 'block');
    let block2Html = ""; 
    let titleKinh1Html = "";
    
    if (hasKinh2) { 
        titleKinh1Html = `<div style="margin-top: 12px;"><b>Đơn kính 1:</b></div>`; 
        block2Html = `<div style="margin-top: 12px; border-top: 1px solid black; padding-top: 10px;"><b>Đơn kính 2:</b></div><div style="margin-bottom: 6px;">Đơn kính: &nbsp;&nbsp;&nbsp; ${getRadioIcons('donKinh_2', ['Nhìn xa', 'Nhìn gần'])}</div><div style="margin-bottom: 10px;">Loại kính: &nbsp;&nbsp;&nbsp; ${getRadioIcons('loaiKinh_2', ['Một tròng', 'Hai tròng', 'Đa tròng'])}</div><table class="print-table"><tr><th>Mắt</th><th>Độ cầu</th><th>Độ trụ</th><th>Trục</th><th>Thị lực</th></tr><tr><td><b>MP</b></td><td>${getVal('mp_cau_2')}</td><td>${getVal('mp_tru_2')}</td><td>${getVal('mp_truc_2')}</td><td>${getVal('mp_gc_2')}</td></tr><tr><td><b>MT</b></td><td>${getVal('mt_cau_2')}</td><td>${getVal('mt_tru_2')}</td><td>${getVal('mt_truc_2')}</td><td>${getVal('mt_gc_2')}</td></tr></table>${pd2Html}`; 
    }
    
    let fNgay, fThang, fNam;
    if (customData) { 
        fNgay = String(customData.ngay || '').padStart(2, '0'); 
        fThang = String(customData.thang || '').padStart(2, '0'); 
        fNam = customData.nam || ''; 
    } else { 
        const dateObj = new Date(document.getElementById('ngayKham').value); 
        fNgay = String(dateObj.getDate()).padStart(2, '0'); 
        fThang = String(dateObj.getMonth() + 1).padStart(2, '0'); 
        fNam = dateObj.getFullYear(); 
    }

    // ========================================================================
    // TẠO MÃ QR BẢO MẬT & THÊM THỊ LỰC
    // ========================================================================
    const hoTenQR = String(getVal('hoTen')).trim() || "Khách Hàng";
    const sdtVal = String(getVal('sdt')).trim() || "---"; 
    const pdVal = String(getVal('kcDongTu_1')).trim().replace('mm', ''); 
    const tuoiVal = String(getVal('tuoi')).trim() || "--"; 
    const ngayKhamStr = `${fNgay}/${fThang}/${fNam}`; 
    const chanDoanVal = String(getVal('chanDoan')).trim();
    const ghiChuVal = String(getVal('ghiChu')).trim();
    
    // Thu thập thêm Thị lực trước và sau kính
    const tlkkMpVal = String(getVal('tlkk_mp')).trim() || "---";
    const tlkkMtVal = String(getVal('tlkk_mt')).trim() || "---";
    const tlMpVal = String(getVal('mp_gc')).trim() || "---"; // Lấy từ cột Thị lực bảng 1
    const tlMtVal = String(getVal('mt_gc')).trim() || "---"; // Lấy từ cột Thị lực bảng 1
    
    const buildEyeStr = (cauId, truId, trucId) => {
        const cau = String(getVal(cauId)).trim();
        const tru = String(getVal(truId)).trim();
        const truc = String(getVal(trucId)).trim().replace(/°/g, ""); 
        
        if (!cau && !tru) return "0.00"; 
        
        let str = cau || "+0.00";
        if (tru && tru !== "0.00" && tru !== "0" && tru !== "+0.00" && tru !== "-0.00") {
            str += `/${tru}`;
            if (truc) str += `x${truc}`; 
        }
        return str;
    };

    const mpText = buildEyeStr('mp_cau', 'mp_tru', 'mp_truc');
    const mtText = buildEyeStr('mt_cau', 'mt_tru', 'mt_truc');

    const dataObj = {
        ten: hoTenQR,
        tuoi: tuoiVal,
        sdt: sdtVal,
        mp: mpText,
        mt: mtText,
        pd: pdVal,
        ngay: ngayKhamStr,
        cd: chanDoanVal,
        gc: ghiChuVal,
        tlkk_mp: tlkkMpVal, // Thêm vào JSON
        tlkk_mt: tlkkMtVal, // Thêm vào JSON
        tl_mp: tlMpVal,     // Thêm vào JSON
        tl_mt: tlMtVal      // Thêm vào JSON
    };

    const jsonString = JSON.stringify(dataObj);
    const encodedData = encodeURIComponent(btoa(unescape(encodeURIComponent(jsonString))));

    const BASE_URL = "https://donkinh-eea6b.web.app/don-kinh.html"; 
    const safeQrData = `${BASE_URL}?data=${encodedData}`;

    return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <title>In Đơn Kính</title>
    <style>
        @page { size: A5; margin: 10mm 10mm; } 
        body { font-family: 'Times New Roman', serif; font-size: 12.5pt; line-height: 1.32; color: #000; margin: 0; padding: 0; } 
        @media screen { 
            /* Hiển thị như một tờ giấy A5 thật trên nền xám (dành cho máy tính/màn hình to) */
        @media screen { 
            html, body { 
                width: 100%; 
                height: 100%; 
                margin: 0; 
                padding: 0; 
                background: #e4e4e7; /* Nền xám bao quanh tờ giấy */
            } 
            body { 
                width: 148mm; /* Cố định bề ngang khổ A5 */
                min-height: 210mm; /* Cố định bề dọc khổ A5 */
                margin: 10px auto; /* Căn giữa tờ giấy */
                background: white; 
                padding: 10mm 10mm; 
                box-sizing: border-box; 
                box-shadow: 0 4px 10px rgba(0,0,0,0.1); /* Đổ bóng cho giống tờ giấy thật */
                transform-origin: top left; /* Làm gốc để thu nhỏ */
            } 
        }
        
        /* Thuật toán CSS thu nhỏ trang giấy A5 vừa khít bề ngang điện thoại */
        @media screen and (max-width: 600px) {
            body {
                transform: scale(0.65); /* Thu nhỏ tờ giấy còn 65% so với thực tế */
                margin-bottom: -35%; /* Cắt bỏ phần khoảng trắng thừa bị dư ra dưới đáy sau khi thu nhỏ */
            }
        }
        table.print-table { width: 100%; border-collapse: collapse; margin: 10px 0; } 
        table.print-table th, table.print-table td { border: 1px solid #000; padding: 5px; text-align: center; vertical-align: middle; } 
        .signature-box { text-align: center; width: 220px; } 
        .clearfix::after { content: ""; clear: both; display: table; }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js"></script>
</head>
<body>
    
    <div style="position: relative; margin-bottom: 16px;">
        <div style="color: #777; font-size: 11pt;">
            <div style="font-weight: bold;">BỆNH VIỆN ĐA KHOA TRƯỜNG ĐỨC</div>
            <div style="font-weight: bold;">Phòng khám Mắt</div>
        </div>
        
        <div style="position: absolute; top: 0; right: 0;">
            <canvas id="qrcode" style="width: 75px; height: 75px; display: block;" title="Mã quét thông số cắt kính"></canvas>
        </div>

        <h2 style="margin: 10px 0 0 0; text-transform: uppercase; font-size: 17pt; text-align: center;">ĐƠN KÍNH</h2>
    </div>

    <div style="margin-bottom: 6px;">Họ và tên: <b>${getVal('hoTen')}</b> &nbsp;&nbsp;&nbsp; Tuổi: ${getVal('tuoi')} &nbsp;&nbsp;&nbsp; Giới: ${getVal('gioi')}</div>
    <div style="margin-bottom: 6px;">Địa chỉ: ${getVal('diaChi')}</div>
    <div style="margin-bottom: 10px;">SĐT: ${getVal('sdt')}</div>
    <div style="margin-bottom: 12px;">Chẩn đoán: <b>${getVal('chanDoan')}</b></div>
    
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        ${buildV("Thị lực không kính", "tlkk_mp", "tlkk_mt")}
        ${buildV("Thị lực kính lỗ", "tlkl_mp", "tlkl_mt")}
        ${buildV("Thị lực kính cũ", "tlkc_mp", "tlkc_mt")}
        ${tlngHtml}
    </table>
    
    ${titleKinh1Html}
    
    <div style="margin-bottom: 6px;">Đơn kính: &nbsp;&nbsp;&nbsp; ${getRadioIcons('donKinh_1', ['Nhìn xa', 'Nhìn gần'])}</div>
    <div style="margin-bottom: 10px;">Loại kính: &nbsp;&nbsp;&nbsp; ${getRadioIcons('loaiKinh_1', ['Một tròng', 'Hai tròng', 'Đa tròng'])}</div>
    
    <table class="print-table">
        <tr><th>Mắt</th><th>Độ cầu</th><th>Độ trụ</th><th>Trục</th><th>Thị lực</th></tr>
        <tr><td><b>MP</b></td><td>${getVal('mp_cau')}</td><td>${getVal('mp_tru')}</td><td>${getVal('mp_truc')}</td><td>${getVal('mp_gc')}</td></tr>
        <tr><td><b>MT</b></td><td>${getVal('mt_cau')}</td><td>${getVal('mt_tru')}</td><td>${getVal('mt_truc')}</td><td>${getVal('mt_gc')}</td></tr>
    </table>
    
    ${pd1Html} 
    ${block2Html}
    
    <div style="margin-top: 12px;">Ghi chú: ${getVal('ghiChu')}</div>
    
    <div style="display: flex; justify-content: flex-end; align-items: flex-start; margin-top: 15px;">
        <div class="signature-box">
            <div style="margin-bottom: 4px;">Ngày ${fNgay} tháng ${fThang} năm ${fNam}</div>
            <div><b>Người khám</b></div>
            <div style="height: 55px; display: flex; align-items: center; justify-content: center;">
                <img src="chukyso.jpg" style="max-height: 50px; max-width: 100%; object-fit: contain;">
            </div>
            <div><b>${getVal('bsKham')}</b></div>
        </div>
    </div>
    
    <script>
        window.onload = function() {
            try {
                new QRious({
                    element: document.getElementById("qrcode"),
                    value: "${safeQrData}",
                    size: 250,
                    level: "M" 
                });
            } catch(e) { console.error("Lỗi vẽ QR Code:", e); }
        };
    </script>
</body>
</html>`;
}


/**
 * 2. Hàm tạo chuỗi HTML chuẩn Word xuất ra file .doc
 * @param {Object|null} customData - Dữ liệu truyền vào (Nếu null sẽ tự lấy từ DOM)
 */
export function generateWordHtml(customData = null) {
    const getVal = id => { 
        if (customData) { 
            if(id === 'kcDongTu_1' && customData[id] === undefined && customData['kcDongTu']) {
                return customData['kcDongTu'].replace('mm','').trim(); 
            }
            return customData[id] !== undefined ? customData[id] : ""; 
        } 
        return document.getElementById(id) ? document.getElementById(id).value : ""; 
    };

    const getRadioIcons = (name, options) => { 
        let val = ""; 
        if (customData) { 
            if (name === 'donKinh_1') val = customData.donKinh || ""; 
            else if (name === 'loaiKinh_1') val = customData.loaiKinh_1 || customData.loaiKinh || ""; 
            else if (name === 'donKinh_2') val = customData.donKinh_2 || ""; 
            else if (name === 'loaiKinh_2') val = customData.loaiKinh_2 || ""; 
        } else { 
            let checkedEl = document.querySelector(`input[name="${name}"]:checked`); 
            val = checkedEl ? checkedEl.value : ""; 
        } 
        return options.map(opt => (opt === val ? "☑ " : "☐ ") + opt).join("<span style='mso-tab-count:1'>&nbsp;&nbsp;&nbsp;</span>"); 
    };

    const buildV = (label, mp, mt) => { 
        const vMp = String(getVal(mp)).trim(); 
        const vMt = String(getVal(mt)).trim(); 
        if(!vMp && !vMt) return ""; 
        return `<p>${label}:<span style="mso-tab-count:1">&nbsp;&nbsp;&nbsp;&nbsp;</span>${vMp ? 'MP: '+vMp : ''}<span style="mso-tab-count:1">&nbsp;&nbsp;&nbsp;&nbsp;</span>${vMt ? 'MT: '+vMt : ''}</p>`; 
    };

    const tlng = String(getVal('tlng')).trim(); 
    const tlngHtml = tlng ? `<p>Thị lực nhìn gần:<span style="mso-tab-count:1">&nbsp;&nbsp;&nbsp;&nbsp;</span>N${tlng}@35cm</p>` : "";
    
    const pd1 = String(getVal('kcDongTu_1')).trim(); 
    const pd1Html = pd1 ? `<p style="margin-top: 5pt;"><b>Khoảng cách đồng tử (PD): ${pd1}mm</b></p>` : "";
    
    const pd2 = String(getVal('kcDongTu_2')).trim(); 
    const pd2Html = pd2 ? `<p style="margin-top: 5pt;"><b>Khoảng cách đồng tử (PD): ${pd2}mm</b></p>` : "";
    
    let hasKinh2 = customData ? (customData.hasKinh2 || customData.mp_cau_2 || customData.mt_cau_2) : (document.getElementById('blockKinh2').style.display === 'block');
    let block2Html = ""; 
    let titleKinh1Html = "";

    if (hasKinh2) { 
        titleKinh1Html = `<p style="margin-top: 10pt;"><b>Đơn kính 1:</b></p>`; 
        block2Html = `<p style="margin-top: 15pt; border-top: 1pt solid black; padding-top: 10pt;"><b>Đơn kính 2:</b></p><p>Đơn kính:<span style="mso-tab-count:1">&nbsp;&nbsp;&nbsp;</span>${getRadioIcons('donKinh_2', ['Nhìn xa', 'Nhìn gần'])}</p><p>Loại kính:<span style="mso-tab-count:1">&nbsp;&nbsp;&nbsp;</span>${getRadioIcons('loaiKinh_2', ['Một tròng', 'Hai tròng', 'Đa tròng'])}</p><table class="prescription-table"><tr><th><p>Mắt</p></th><th><p>Độ cầu</p></th><th><p>Độ trụ</p></th><th><p>Trục</p></th><th><p>Thị lực</p></th></tr><tr><td><p><b>MP</b></p></td><td><p>${getVal('mp_cau_2')}</p></td><td><p>${getVal('mp_tru_2')}</p></td><td><p>${getVal('mp_truc_2')}</p></td><td><p>${getVal('mp_gc_2')}</p></td></tr><tr><td><p><b>MT</b></p></td><td><p>${getVal('mt_cau_2')}</p></td><td><p>${getVal('mt_tru_2')}</p></td><td><p>${getVal('mt_truc_2')}</p></td><td><p>${getVal('mt_gc_2')}</p></td></tr></table>${pd2Html}`; 
    }
    
    let fNgay, fThang, fNam; 
    if (customData) { 
        fNgay = String(customData.ngay || '').padStart(2, '0'); 
        fThang = String(customData.thang || '').padStart(2, '0'); 
        fNam = customData.nam || ''; 
    } else { 
        const dateObj = new Date(document.getElementById('ngayKham').value); 
        fNgay = String(dateObj.getDate()).padStart(2, '0'); 
        fThang = String(dateObj.getMonth() + 1).padStart(2, '0'); 
        fNam = dateObj.getFullYear(); 
    }

    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><style>@page WordSection1 { size: 419.5pt 595.3pt; margin: 30pt; } div.WordSection1 { page: WordSection1; } body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.3; } p { margin: 0 0 6pt 0; } table.prescription-table { width: 100%; border-collapse: collapse; margin: 10pt 0; } table.prescription-table th, table.prescription-table td { border: 1pt solid black; padding: 2pt; text-align: center; vertical-align: middle; } table.prescription-table td p, table.prescription-table th p { margin: 0; padding: 0; line-height: 1.1; } table.no-border { width: 100%; border-collapse: collapse; margin-top: 20pt; } table.no-border td { border: none !important; text-align: center; vertical-align: top; }</style></head><body><div class='WordSection1'>`;
    const content = `<p style="margin: 0; color: #777777; font-size: 11pt;"><b>BỆNH VIỆN ĐA KHOA TRƯỜNG ĐỨC</b></p><p style="margin: 0 0 10pt 0; color: #777777; font-size: 11pt;"><b>Phòng khám Mắt</b></p><p style="text-align:center; font-size: 16pt;"><b>ĐƠN KÍNH</b></p><p>Họ và tên: <b>${getVal('hoTen')}</b> <span style="mso-tab-count:1">&nbsp;&nbsp;</span> Tuổi: ${getVal('tuoi')} <span style="mso-tab-count:1">&nbsp;&nbsp;</span> Giới: ${getVal('gioi')}</p><p>Địa chỉ: ${getVal('diaChi')}</p><p>SĐT: ${getVal('sdt')}</p><p>Chẩn đoán: <b>${getVal('chanDoan')}</b></p>${buildV("Thị lực không kính", "tlkk_mp", "tlkk_mt")}${buildV("Thị lực kính lỗ", "tlkl_mp", "tlkl_mt")}${buildV("Thị lực kính cũ", "tlkc_mp", "tlkc_mt")}${tlngHtml}${titleKinh1Html}<p>Đơn kính:<span style="mso-tab-count:1">&nbsp;&nbsp;&nbsp;</span>${getRadioIcons('donKinh_1', ['Nhìn xa', 'Nhìn gần'])}</p><p>Loại kính:<span style="mso-tab-count:1">&nbsp;&nbsp;&nbsp;</span>${getRadioIcons('loaiKinh_1', ['Một tròng', 'Hai tròng', 'Đa tròng'])}</p><table class="prescription-table"><tr><th><p>Mắt</p></th><th><p>Độ cầu</p></th><th><p>Độ trụ</p></th><th><p>Trục</p></th><th><p>Thị lực</p></th></tr><tr><td><p><b>MP</b></p></td><td><p>${getVal('mp_cau')}</p></td><td><p>${getVal('mp_tru')}</p></td><td><p>${getVal('mp_truc')}</p></td><td><p>${getVal('mp_gc')}</p></td></tr><tr><td><p><b>MT</b></p></td><td><p>${getVal('mt_cau')}</p></td><td><p>${getVal('mt_tru')}</p></td><td><p>${getVal('mt_truc')}</p></td><td><p>${getVal('mt_gc')}</p></td></tr></table>${pd1Html} ${block2Html}<p style="margin-top: 10pt;">Ghi chú: ${getVal('ghiChu')}</p><table class="no-border"><tr><td style="width:40%"></td><td><p>Ngày ${fNgay} tháng ${fThang} năm ${fNam}</p><p><b>Người khám</b></p><p style="margin: 5pt 0;"><img src="chukyso.jpg" width="120" height="40" alt="Chữ ký"/></p><p><b>${getVal('bsKham')}</b></p></td></tr></table>`;
    
    return header + content + "</div></body></html>";
}