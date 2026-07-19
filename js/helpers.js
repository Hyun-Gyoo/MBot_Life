// --- Helper Functions ---

// 1. Korean Won Formatting (e.g. 3억 5,000만원)
function formatKRW(val) {
    if (val === 0) return '0원';
    const isNegative = val < 0;
    let absVal = Math.abs(val);
    
    let result = '';
    const EOK = 100000000;
    const MAN = 10000;
    
    if (absVal >= EOK) {
        const eokPart = Math.floor(absVal / EOK);
        absVal %= EOK;
        result += `${eokPart}억 `;
    }
    
    if (absVal >= MAN) {
        const manPart = Math.floor(absVal / MAN);
        absVal %= MAN;
        if (manPart > 0) {
            result += `${manPart.toLocaleString()}만`;
        }
    } else if (absVal > 0) {
        result += `${absVal.toLocaleString()}`;
    }
    
    result = result.trim();
    if (!result.endsWith('원')) {
        result += '원';
    }
    
    return (isNegative ? '-' : '') + result;
}

// Simple absolute numbers formatter for tables (with commas)
function formatNumber(val) {
    return Math.round(val).toLocaleString() + '원';
}

// 2. Add Months to YYYY-MM
function addMonths(dateStr, m) {
    const [year, month] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1 + m, 1);
    const y = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${mm}`;
}

// 3. Difference in months between two YYYY-MM dates
function diffMonths(startStr, endStr) {
    const [sYear, sMonth] = startStr.split('-').map(Number);
    const [eYear, eMonth] = endStr.split('-').map(Number);
    return (eYear - sYear) * 12 + (eMonth - sMonth);
}


// 4. Format Input with Comma
function formatInputWithComma(el) {
    let v = String(el.value).replace(/[^0-9-]/g, '');
    if (v === '' || v === '-') {
        el.value = v;
        return;
    }
    el.value = Number(v).toLocaleString();
}


// 5. Calculate Inflated Amount String


function getAgeAt(dateStr) {
    if (!currentState.birthDate || !dateStr) return "";
    let target = dateStr;
    if (typeof target === 'number' || String(target).length === 4) {
        target = `${target}-12`;
    }
    const m = diffMonths(currentState.birthDate, target);
    if (m < 0) return "";
    const age = Math.floor(m / 12);
    return `<span style="margin-left: 12px; font-size: 13px; font-weight: bold; color: var(--color-emerald); display: inline-block; min-width: 65px; white-space: nowrap;">만 ${age}세</span>`;
}

window.updateModalAIPreview = function() {
    const startEl = document.getElementById('modal-ai-start');
    const endEl = document.getElementById('modal-ai-end');
    const amountEl = document.getElementById('modal-ai-amount');
    const applyInfEl = document.getElementById('modal-ai-apply-inflation');
    const increaseEl = document.getElementById('modal-ai-increase-rate');
    const previewEl = document.getElementById('modal-ai-inflated-preview');
    
    const startAgeEl = document.getElementById('modal-ai-start-age');
    const endAgeEl = document.getElementById('modal-ai-end-age');
    if (startEl && startAgeEl) startAgeEl.innerHTML = getAgeAt(startEl.value);
    if (endEl && endAgeEl) endAgeEl.innerHTML = getAgeAt(endEl.value);
    
    if (!startEl || !endEl || !amountEl || !applyInfEl || !previewEl || !increaseEl) return;
    
    const start = Number(startEl.value);
    const end = Number(endEl.value);
    const amountStr = amountEl.value.replace(/,/g, '');
    const amount = Number(amountStr);
    const applyInf = applyInfEl.checked;
    const incRate = Number(increaseEl.value) || 0;
    
    const infRate = currentState.inflationRate || 0;
    const totalRate = incRate + infRate;
    const labelEl = document.querySelector('label[for="modal-ai-apply-inflation"]');
    if (labelEl) {
        labelEl.innerHTML = `물가상승률 및 연증가율 반영 <span style="color:var(--color-indigo); font-weight:bold;">(${(totalRate).toFixed(1)}% 반영)</span>`;
    }
    
    if (!currentState.startDate || !start || !end) {
        previewEl.innerHTML = '';
        return;
    }
    
    const durationYears = end - start + 1;
    if (durationYears <= 0) {
        previewEl.innerHTML = '';
        return;
    }
    
    let html = '';
    const showYears = [];
    for (let y = 1; y <= durationYears; y++) {
        if (y <= 3 || y === durationYears) showYears.push(y);
    }
    
    const uniqueShowYears = [...new Set(showYears)].sort((a, b) => a - b);
    
    let lastY = 0;
    uniqueShowYears.forEach(y => {
        if (y > lastY + 1) html += `<div style="color:var(--text-muted); margin: 2px 0;">... (중략) ...</div>`;
        
        const currentYear = start + y - 1;
        const currentYM = `${currentYear}-12`;
        
        const monthsSinceSimStart = diffMonths(currentState.startDate, currentYM);
        const infFactor = monthsSinceSimStart > 0 ? Math.pow(1 + currentState.inflationRate / 100, monthsSinceSimStart / 12) : 1;
        
        const monthsSinceItemStart = (y - 1) * 12;
        const incFactor = monthsSinceItemStart > 0 ? Math.pow(1 + incRate / 100, monthsSinceItemStart / 12) : 1;
        
        const inflated = amount * infFactor * incFactor;
        
        html += `<div>👉 ${y}년차 (${currentYear}년) 기준: <strong style="color:var(--color-indigo);">${Math.round(inflated).toLocaleString()}원</strong></div>`;
        lastY = y;
    });
    
    previewEl.innerHTML = html;
};

window.updateModalMEPreview = function() {
    const startEl = document.getElementById('modal-me-start');
    const endEl = document.getElementById('modal-me-end');
    const amountEl = document.getElementById('modal-me-amount');
    const applyInfEl = document.getElementById('modal-me-apply-inflation');
    const previewEl = document.getElementById('modal-me-inflated-preview');
    
    const startAgeEl = document.getElementById('modal-me-start-age');
    const endAgeEl = document.getElementById('modal-me-end-age');
    if (startEl && startAgeEl) startAgeEl.innerHTML = getAgeAt(startEl.value);
    if (endEl && endAgeEl) endAgeEl.innerHTML = getAgeAt(endEl.value);
    
    if (!startEl || !endEl || !amountEl || !applyInfEl || !previewEl) return;
    
    const start = startEl.value;
    const end = endEl.value;
    const amountStr = amountEl.value.replace(/,/g, '');
    const amount = Number(amountStr);
    const applyInf = applyInfEl.checked;
    
    if (!currentState.startDate || !start || !end) {
        previewEl.innerHTML = '';
        return;
    }
    
    const durationMonths = diffMonths(start, end) + 1;
    if (durationMonths <= 0) {
        previewEl.innerHTML = '';
        return;
    }
    
    const totalYears = Math.ceil(durationMonths / 12);
    let html = '';
    
    const showYears = [];
    for (let y = 1; y <= totalYears; y++) {
        if (y <= 3 || y === totalYears) showYears.push(y);
    }
    
    const uniqueShowYears = [...new Set(showYears)].sort((a, b) => a - b);
    
    let lastY = 0;
    uniqueShowYears.forEach(y => {
        if (y > lastY + 1) html += `<div style="color:var(--text-muted); margin: 2px 0;">... (중략) ...</div>`;
        
        let monthOffset = (y - 1) * 12;
        if (monthOffset >= durationMonths) monthOffset = durationMonths - 1;
        
        const currentYM = addMonths(start, monthOffset);
        const monthsSinceSimStart = diffMonths(currentState.startDate, currentYM);
        const infFactor = monthsSinceSimStart > 0 ? Math.pow(1 + currentState.inflationRate / 100, monthsSinceSimStart / 12) : 1;
        
        const inflated = amount * infFactor;
        
        html += `<div>👉 ${y}년차 (${currentYM}) 기준: <strong style="color:var(--color-indigo);">${Math.round(inflated).toLocaleString()}원</strong></div>`;
        lastY = y;
    });
    
    previewEl.innerHTML = html;
};

window.updateModalLoanPreview = function() {
    const borrowEl = document.getElementById('modal-loan-borrow-date');
    const repayEl = document.getElementById('modal-loan-repay-date');
    const amountEl = document.getElementById('modal-loan-amount');
    
    const borrowAgeEl = document.getElementById('modal-loan-borrow-date-age');
    const repayAgeEl = document.getElementById('modal-loan-repay-date-age');
    if (borrowEl && borrowAgeEl) borrowAgeEl.innerHTML = getAgeAt(borrowEl.value);
    if (repayEl && repayAgeEl) repayAgeEl.innerHTML = getAgeAt(repayEl.value);
    
    const previewEl = document.getElementById('modal-loan-inflated-preview');
    if (!borrowEl || !repayEl || !amountEl || !previewEl) return;
    
    const start = borrowEl.value;
    const end = repayEl.value;
    const amount = Number(amountEl.value.replace(/,/g, ''));
    
    if (!currentState.startDate || !start || !end) {
        previewEl.innerHTML = '';
        return;
    }
    
    const mStart = diffMonths(currentState.startDate, start);
    const mEnd = diffMonths(currentState.startDate, end);
    
    const infStart = mStart > 0 ? Math.pow(1 + currentState.inflationRate / 100, mStart / 12) : 1;
    const infEnd = mEnd > 0 ? Math.pow(1 + currentState.inflationRate / 100, mEnd / 12) : 1;
    
    previewEl.innerHTML = `
        <div>👉 시작시점(${start}) 가치: <strong style="color:var(--color-indigo);">${Math.round(amount * infStart).toLocaleString()}원</strong></div>
        <div>👉 종료시점(${end}) 가치: <strong style="color:var(--color-indigo);">${Math.round(amount * infEnd).toLocaleString()}원</strong></div>
    `;
};
window.updateModalOTPreview = function() {
    const dateEl = document.getElementById('modal-ot-date');
    const amountEl = document.getElementById('modal-ot-amount');
    
    const dateAgeEl = document.getElementById('modal-ot-date-age');
    if (dateEl && dateAgeEl) dateAgeEl.innerHTML = getAgeAt(dateEl.value);
    
    const previewEl = document.getElementById('modal-ot-inflated-preview');
    if (!dateEl || !amountEl || !previewEl) return;
    
    const date = dateEl.value;
    const amount = Number(amountEl.value.replace(/,/g, ''));
    
    if (!currentState.startDate || !date) {
        previewEl.innerHTML = '';
        return;
    }
    
    const m = diffMonths(currentState.startDate, date);
    const inf = m > 0 ? Math.pow(1 + currentState.inflationRate / 100, m / 12) : 1;
    
    previewEl.innerHTML = `<div>👉 발생시점(${date}) 가치: <strong style="color:var(--color-indigo);">${Math.round(amount * inf).toLocaleString()}원</strong></div>`;
};


window.updateModalMIPreview = function() {
    const startEl = document.getElementById('modal-mi-start');
    const endEl = document.getElementById('modal-mi-end');
    const startAgeEl = document.getElementById('modal-mi-start-age');
    const endAgeEl = document.getElementById('modal-mi-end-age');
    if (startEl && startAgeEl) startAgeEl.innerHTML = getAgeAt(startEl.value);
    if (endEl && endAgeEl) endAgeEl.innerHTML = getAgeAt(endEl.value);
    const amountEl = document.getElementById('modal-mi-amount');
    const applyInfEl = document.getElementById('modal-mi-apply-inflation');
    const increaseEl = document.getElementById('modal-mi-increase-rate');
    const previewEl = document.getElementById('modal-mi-inflated-preview');
    
    if (!startEl || !endEl || !amountEl || !applyInfEl || !previewEl || !increaseEl) return;
    
    const start = startEl.value;
    const end = endEl.value;
    const amountStr = amountEl.value.replace(/,/g, '');
    const amount = Number(amountStr);
    const applyInf = applyInfEl.checked;
    const incRate = Number(increaseEl.value) || 0;
    
    const infRate = currentState.inflationRate || 0;
    const totalRate = incRate + infRate;
    const labelEl = document.querySelector('label[for="modal-mi-apply-inflation"]');
    if (labelEl) {
        labelEl.innerHTML = `물가상승률 및 임금인상 반영 <span style="color:var(--color-indigo); font-weight:bold;">(${(totalRate).toFixed(1)}% 반영)</span>`;
    }
    
    if (!currentState.startDate || !start || !end) {
        previewEl.innerHTML = '';
        return;
    }
    
    const durationMonths = diffMonths(start, end) + 1;
    if (durationMonths <= 0) {
        previewEl.innerHTML = '';
        return;
    }
    
    const totalYears = Math.ceil(durationMonths / 12);
    let html = '';
    
    const showYears = [];
    for (let y = 1; y <= totalYears; y++) {
        if (y <= 3 || y === totalYears) { // Show up to 3 years and the last year
            showYears.push(y);
        }
    }
    
    // Remove duplicates if duration is short (e.g. 4 years -> 1, 2, 3, 4)
    const uniqueShowYears = [...new Set(showYears)].sort((a, b) => a - b);
    
    let lastY = 0;
    uniqueShowYears.forEach(y => {
        if (y > lastY + 1) {
            html += `<div style="color:var(--text-muted); margin: 2px 0;">... (중략) ...</div>`;
        }
        
        let monthOffset = (y - 1) * 12;
        if (monthOffset >= durationMonths) {
            monthOffset = durationMonths - 1;
        }
        
        const currentYM = addMonths(start, monthOffset);
        
        const monthsSinceSimStart = diffMonths(currentState.startDate, currentYM);
        const infFactor = monthsSinceSimStart > 0 ? Math.pow(1 + currentState.inflationRate / 100, monthsSinceSimStart / 12) : 1;
        
        const monthsSinceItemStart = diffMonths(start, currentYM);
        const incFactor = monthsSinceItemStart > 0 ? Math.pow(1 + incRate / 100, monthsSinceItemStart / 12) : 1;
        
        const inflated = amount * infFactor * incFactor;
        
        html += `<div>👉 ${y}년차 (${currentYM}) 기준: <strong style="color:var(--color-indigo);">${Math.round(inflated).toLocaleString()}원</strong></div>`;
        lastY = y;
    });
    
    previewEl.innerHTML = html;
};

function getInflatedAmountStr(baseAmount, targetDateStr, applyInflation) {
    if (!applyInflation) return "";
    if (!currentState.startDate || !targetDateStr) return "";
    
    let dateStr = targetDateStr;
    if (typeof dateStr === 'number' || String(dateStr).length === 4) {
        dateStr = `${dateStr}-12`;
    }
    
    const m = diffMonths(currentState.startDate, dateStr);
    if (m <= 0) return "";
    
    const factor = Math.pow(1 + currentState.inflationRate / 100, m / 12);
    const inflated = baseAmount * factor;
    return `👉 ${dateStr} 기준 환산액: <strong style="color:var(--color-indigo);">${Math.round(inflated).toLocaleString()}원</strong>`;
}
