// --- Restored UI and Modal Logic ---


function getAgeAt(dateStr) {
    if (!currentState.birthDate || !dateStr) return "";
    let target = dateStr;
    if (typeof target === 'number' || String(target).length === 4) {
        target = `${target}-12`;
    }
    const m = diffMonths(currentState.birthDate, target);
    if (m < 0) return "";
    const age = Math.floor(m / 12);
    return `<span style="margin-left: 8px; font-size: 13px; font-weight: bold; color: var(--color-emerald);">만 ${age}세</span>`;
}

window.toggleLoanDeferredOptions = function() {
    const chk = document.getElementById('modal-loan-is-deferred');
    const container = document.getElementById('modal-loan-deferred-container');
    if (chk && container) {
        container.style.display = chk.checked ? 'block' : 'none';
    }
};

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
    
    if (!applyInf || !currentState.startDate || !start || !end) {
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
    
    if (!applyInf || !currentState.startDate || !start || !end) {
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
    const dateEl = document.getElementById('modal-loan-date');
    const dateAgeEl = document.getElementById('modal-loan-date-age');
    if (dateEl && dateAgeEl) dateAgeEl.innerHTML = getAgeAt(dateEl.value);
};
window.updateModalOTPreview = function() {
    const dateEl = document.getElementById('modal-ot-date');
    const dateAgeEl = document.getElementById('modal-ot-date-age');
    if (dateEl && dateAgeEl) dateAgeEl.innerHTML = getAgeAt(dateEl.value);
};


function closeModal() {
    const modal = document.getElementById('item-modal');
    if (modal) modal.style.display = 'none';
}

let currentEditIndex = null;

function openAddItemModal(type, editIndex = null) {
    currentEditIndex = editIndex;
    const modal = document.getElementById('item-modal');
    const title = document.getElementById('modal-title');
    const fields = document.getElementById('modal-body-fields');
    const submitBtn = document.getElementById('modal-submit-btn');
    if (!modal || !title || !fields || !submitBtn) return;
    
    fields.innerHTML = '';
    const isEdit = editIndex !== null;
    submitBtn.textContent = '등록';
    
    if (type === 'monthlyIncome') {
        const item = isEdit ? currentState.monthlyIncome[editIndex] : null;
        title.textContent = isEdit ? '월 정기 수입 수정' : '월 정기 수입 추가';
        fields.innerHTML = `
            <div class="input-group">
                <label>시작월</label>
                <input type="month" id="modal-mi-start" value="${item ? item.start : currentState.startDate}" onchange="updateModalMIPreview()">
            </div>
            <div class="input-group">
                <label>종료월</label>
                <input type="month" id="modal-mi-end" value="${item ? item.end : addMonths(currentState.startDate, 11)}" onchange="updateModalMIPreview()">
            </div>
            <div class="input-group">
                <label>월 수입액 (원)</label>
                <input type="text" inputmode="numeric" id="modal-mi-amount" value="${item ? Number(item.amount).toLocaleString() : '5,000,000'}" style="text-align:right;" oninput="formatInputWithComma(this); updateModalMIPreview()">
            </div>
            <div class="input-group">
                <label>설명 (이름)</label>
                <input type="text" id="modal-mi-label" value="${item ? (item.label || '') : '신규 월 수입'}">
            </div>
            <div style="display:flex; align-items:center; gap:6px; margin-top:12px;">
                <input type="checkbox" id="modal-mi-apply-inflation" style="width:16px; height:16px;" ${item && item.applyInflation ? 'checked' : ''} onchange="updateModalMIPreview()">
                <label for="modal-mi-apply-inflation" style="margin-bottom:0;">물가상승률 반영 (실질 가치 고정)</label>
            </div>
            <div class="input-group" style="margin-top:8px;">
                <label>연 임금인상률 (%)</label>
                <input type="number" step="0.1" id="modal-mi-increase-rate" value="${item ? (item.increaseRate || 0) : '0.0'}" oninput="updateModalMIPreview()">
            </div>
            <div id="modal-mi-inflated-preview" style="font-size:13px; margin-top:12px;"></div>
        `;
        submitBtn.onclick = () => submitModalItem(type);
        setTimeout(updateModalMIPreview, 100);
        
    } else if (type === 'annualIncome') {
        const item = isEdit ? currentState.annualIncome[editIndex] : null;
        title.textContent = isEdit ? '연 정기 수입 수정' : '연 정기 수입 추가';
        const currentYear = new Date(currentState.startDate || new Date()).getFullYear();
        fields.innerHTML = `
            <div class="input-group">
                <label>시작연도 <span id="modal-ai-start-age"></span></label>
                <input type="number" id="modal-ai-start" value="${item ? item.startYear : currentYear}" onchange="updateModalAIPreview()">
            </div>
            <div class="input-group">
                <label>종료연도 <span id="modal-ai-end-age"></span></label>
                <input type="number" id="modal-ai-end" value="${item ? item.endYear : currentYear + 5}" onchange="updateModalAIPreview()">
            </div>
            <div class="input-group">
                <label>연 수입액 (원)</label>
                <input type="text" inputmode="numeric" id="modal-ai-amount" value="${item ? Number(item.amount).toLocaleString() : '10,000,000'}" style="text-align:right;" oninput="formatInputWithComma(this); updateModalAIPreview()">
            </div>
            <div class="input-group">
                <label>설명 (이름)</label>
                <input type="text" id="modal-ai-label" value="${item ? (item.label || '') : '신규 연 수입'}">
            </div>
            <div style="display:flex; align-items:center; gap:6px; margin-top:12px;">
                <input type="checkbox" id="modal-ai-apply-inflation" style="width:16px; height:16px;" ${item && item.applyInflation ? 'checked' : ''} onchange="updateModalAIPreview()">
                <label for="modal-ai-apply-inflation" style="margin-bottom:0;">물가상승률 반영 (실질 가치 고정)</label>
            </div>
            <div class="input-group" style="margin-top:8px;">
                <label>연 임금인상률 (%)</label>
                <input type="number" step="0.1" id="modal-ai-increase-rate" value="${item ? (item.increaseRate || 0) : '0.0'}" oninput="updateModalAIPreview()">
            </div>
            <div id="modal-ai-inflated-preview" style="font-size:13px; margin-top:12px;"></div>
        `;
        submitBtn.onclick = () => submitModalItem(type);
        setTimeout(updateModalAIPreview, 100);
        
    } else if (type === 'monthlyExpense') {
        const item = isEdit ? currentState.monthlyExpense[editIndex] : null;
        title.textContent = isEdit ? '월 정기 지출 수정' : '월 정기 지출 추가';
        fields.innerHTML = `
            <div class="input-group">
                <label>시작월</label>
                <input type="month" id="modal-me-start" value="${item ? item.start : currentState.startDate}" onchange="updateModalMEPreview()">
            </div>
            <div class="input-group">
                <label>종료월</label>
                <input type="month" id="modal-me-end" value="${item ? item.end : addMonths(currentState.startDate, 11)}" onchange="updateModalMEPreview()">
            </div>
            <div class="input-group">
                <label>월 지출액 (원)</label>
                <input type="text" inputmode="numeric" id="modal-me-amount" value="${item ? Number(item.amount).toLocaleString() : '3,000,000'}" style="text-align:right;" oninput="formatInputWithComma(this); updateModalMEPreview()">
            </div>
            <div class="input-group">
                <label>설명 (이름)</label>
                <input type="text" id="modal-me-label" value="${item ? (item.label || '') : '생활비 추가'}">
            </div>
            <div style="display:flex; align-items:center; gap:6px; margin-top:12px;">
                <input type="checkbox" id="modal-me-apply-inflation" style="width:16px; height:16px;" ${item && item.applyInflation ? 'checked' : ''} onchange="updateModalMEPreview()">
                <label for="modal-me-apply-inflation" style="margin-bottom:0;">물가상승률 반영 (실질 가치 고정)</label>
            </div>
            <div id="modal-me-inflated-preview" style="font-size:13px; margin-top:12px;"></div>
        `;
        submitBtn.onclick = () => submitModalItem(type);
        setTimeout(updateModalMEPreview, 100);
        
    } else if (type === 'loan') {
        const item = isEdit ? currentState.loans[editIndex] : null;
        title.textContent = isEdit ? '대출 / 대여 설정 수정' : '대출 / 대여 설정 추가';
        fields.innerHTML = `
            <div class="input-group" style="margin-bottom: 12px;">
                <label>유형</label>
                <select id="modal-loan-type" style="width:100%; padding: 8px; border-radius: 4px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); color: white;">
                    <option value="borrow" ${item && item.type === 'borrow' ? 'selected' : ''}>대출 (자금 차입)</option>
                    <option value="lend" ${item && item.type === 'lend' ? 'selected' : ''}>대여 (자금 대여)</option>
                </select>
            </div>
            <div class="input-group">
                <label>설명 (이름)</label>
                <input type="text" id="modal-loan-label" value="${item ? (item.name || '') : '신규 대출/대여'}">
            </div>
            <div class="input-group">
                <label>금액 (원)</label>
                <input type="text" inputmode="numeric" id="modal-loan-amount" value="${item ? Number(item.amount).toLocaleString() : '100,000,000'}" style="text-align:right;" oninput="formatInputWithComma(this)">
            </div>
            <div class="input-group">
                <label>연 이자율 (%)</label>
                <input type="number" step="0.1" id="modal-loan-rate" value="${item ? item.rate : '3.0'}">
            </div>
            <div class="input-group">
                <label>발생월 (시작일)</label>
                <input type="month" id="modal-loan-borrow-date" value="${item ? item.borrowDate : currentState.startDate}">
            </div>
            <div class="input-group">
                <label>만기월 (종료일)</label>
                <input type="month" id="modal-loan-repay-date" value="${item ? item.repayDate : addMonths(currentState.startDate, 60)}">
            </div>
            <div style="display:flex; align-items:center; gap:6px; margin-top:12px;">
                <input type="checkbox" id="modal-loan-apply-inflation" style="width:16px; height:16px;" ${item && item.applyInflation ? 'checked' : ''}>
                <label for="modal-loan-apply-inflation" style="margin-bottom:0;">물가상승률 반영 (실질 가치 고정)</label>
            </div>
            <div style="display:flex; align-items:center; gap:6px; margin-top:12px;">
                <input type="checkbox" id="modal-loan-is-deferred" style="width:16px; height:16px;" ${item && item.isDeferredInterest ? 'checked' : ''} onchange="window.toggleLoanDeferredOptions()">
                <label for="modal-loan-is-deferred" style="margin-bottom:0; font-weight:600;">이자 후지급 (만기 시 일시 지급/수입)</label>
            </div>
            <div id="modal-loan-deferred-container" style="display:${item && item.isDeferredInterest ? 'block' : 'none'}; margin-top:10px; padding:12px; background:rgba(255,255,255,0.05); border-radius:6px; border:1px solid var(--border-color);">
                <label style="font-size:13px; font-weight:bold; color:var(--text-secondary); margin-bottom:8px; display:block;">후지급 이자 계산 방식</label>
                <div style="display:flex; gap:16px;">
                    <label style="display:flex; align-items:center; gap:6px; font-size:14px; cursor:pointer;">
                        <input type="radio" name="modal-loan-deferred-type" value="simple" ${!item || item.deferredInterestType !== 'compound' ? 'checked' : ''}>
                        <span>단리 (원금 기준)</span>
                    </label>
                    <label style="display:flex; align-items:center; gap:6px; font-size:14px; cursor:pointer;">
                        <input type="radio" name="modal-loan-deferred-type" value="compound" ${item && item.deferredInterestType === 'compound' ? 'checked' : ''}>
                        <span>복리 (이자에 이자 부과)</span>
                    </label>
                </div>
            </div>
            <div id="modal-loan-inflated-preview" style="font-size:13px; margin-top:12px;"></div>
        `;
        submitBtn.onclick = () => submitModalItem(type);
        if (window.updateModalLoanPreview) setTimeout(updateModalLoanPreview, 100);
        
    } else if (type === 'onetimeFlow') {
        const item = isEdit ? currentState.onetimeFlow[editIndex] : null;
        title.textContent = isEdit ? '일회성 현금 흐름 수정' : '일회성 현금 흐름 추가';
        fields.innerHTML = `
            <div class="input-group">
                <label>설명 (이름)</label>
                <input type="text" id="modal-ot-description" value="${item ? (item.description || '') : '비정기 지출/수입'}">
            </div>
            <div class="input-group">
                <label>발생일 (년월)</label>
                <input type="month" id="modal-ot-date" value="${item ? item.date : currentState.startDate}" onchange="updateModalOTPreview()">
            </div>
            <div class="input-group">
                <label>금액 (원)</label>
                <input type="text" inputmode="numeric" id="modal-ot-amount" value="${item ? Number(item.amount).toLocaleString() : '-10,000,000'}" style="text-align:right;" oninput="formatInputWithComma(this); updateModalOTPreview()">
            </div>
            <div style="display:flex; align-items:center; gap:6px; margin-top:12px;">
                <input type="checkbox" id="modal-ot-apply-inflation" style="width:16px; height:16px;" ${item && item.applyInflation ? 'checked' : ''} onchange="updateModalOTPreview()">
                <label for="modal-ot-apply-inflation" style="margin-bottom:0;">물가상승률 반영 (실질 가치 고정)</label>
            </div>
            <div id="modal-ot-inflated-preview" style="font-size:13px; margin-top:12px;"></div>
        `;
        submitBtn.onclick = () => submitModalItem(type);
        if (window.updateModalOTPreview) setTimeout(updateModalOTPreview, 100);
    }
    
    modal.style.display = 'flex';
}

function submitModalItem(type) {
    const isEdit = currentEditIndex !== null;
    
    if (type === 'monthlyIncome') {
        const start = document.getElementById('modal-mi-start').value;
        const end = document.getElementById('modal-mi-end').value;
        const amount = Number(document.getElementById('modal-mi-amount').value.replace(/,/g, ''));
        const label = document.getElementById('modal-mi-label').value;
        if (!start || !end || isNaN(amount)) return alert('필수 항목을 입력하세요.');
        
        const data = {
            id: isEdit ? currentState.monthlyIncome[currentEditIndex].id : "mi-" + Date.now(), 
            start, end, amount, label,
            applyInflation: document.getElementById('modal-mi-apply-inflation').checked,
            increaseRate: Number(document.getElementById('modal-mi-increase-rate').value) || 0
        };
        
        if (isEdit) currentState.monthlyIncome[currentEditIndex] = data;
        else currentState.monthlyIncome.push(data);
        renderMonthlyIncome();
        
    } else if (type === 'annualIncome') {
        const startYear = Number(document.getElementById('modal-ai-start').value);
        const endYear = Number(document.getElementById('modal-ai-end').value);
        const amount = Number(document.getElementById('modal-ai-amount').value.replace(/,/g, ''));
        const label = document.getElementById('modal-ai-label').value;
        if (!startYear || !endYear || isNaN(amount)) return alert('필수 항목을 입력하세요.');
        
        const data = {
            id: isEdit ? currentState.annualIncome[currentEditIndex].id : "ai-" + Date.now(), 
            startYear, endYear, amount, label,
            applyInflation: document.getElementById('modal-ai-apply-inflation').checked,
            increaseRate: Number(document.getElementById('modal-ai-increase-rate').value) || 0
        };
        
        if (isEdit) currentState.annualIncome[currentEditIndex] = data;
        else currentState.annualIncome.push(data);
        renderAnnualIncome();
        
    } else if (type === 'monthlyExpense') {
        const start = document.getElementById('modal-me-start').value;
        const end = document.getElementById('modal-me-end').value;
        const amount = Number(document.getElementById('modal-me-amount').value.replace(/,/g, ''));
        const label = document.getElementById('modal-me-label').value;
        if (!start || !end || isNaN(amount)) return alert('필수 항목을 입력하세요.');
        
        const data = {
            id: isEdit ? currentState.monthlyExpense[currentEditIndex].id : "me-" + Date.now(), 
            start, end, amount, label,
            applyInflation: document.getElementById('modal-me-apply-inflation').checked
        };
        
        if (isEdit) currentState.monthlyExpense[currentEditIndex] = data;
        else currentState.monthlyExpense.push(data);
        renderMonthlyExpense();
        
    } else if (type === 'loan') {
        const borrowDate = document.getElementById('modal-loan-borrow-date').value;
        const repayDate = document.getElementById('modal-loan-repay-date').value;
        const amount = Number(document.getElementById('modal-loan-amount').value.replace(/,/g, ''));
        const rate = Number(document.getElementById('modal-loan-rate').value);
        const name = document.getElementById('modal-loan-label').value;
        const ltype = document.getElementById('modal-loan-type').value;
        if (!borrowDate || !repayDate || isNaN(amount) || isNaN(rate)) return alert('필수 항목을 입력하세요.');
        
        const isDeferredInterest = document.getElementById('modal-loan-is-deferred').checked;
        let deferredInterestType = 'simple';
        const typeRadios = document.getElementsByName('modal-loan-deferred-type');
        for (const r of typeRadios) {
            if (r.checked) {
                deferredInterestType = r.value;
                break;
            }
        }
        
        const data = {
            id: isEdit ? currentState.loans[currentEditIndex].id : "loan-" + Date.now(), 
            type: ltype, name, amount, rate, borrowDate, repayDate,
            applyInflation: document.getElementById('modal-loan-apply-inflation').checked,
            isDeferredInterest,
            deferredInterestType
        };
        
        if (isEdit) currentState.loans[currentEditIndex] = data;
        else currentState.loans.push(data);
        renderLoans();
        
    } else if (type === 'onetimeFlow') {
        const date = document.getElementById('modal-ot-date').value;
        const amount = Number(document.getElementById('modal-ot-amount').value.replace(/,/g, ''));
        const description = document.getElementById('modal-ot-description').value;
        if (!date || isNaN(amount)) return alert('필수 항목을 입력하세요.');
        
        const data = {
            id: isEdit ? currentState.onetimeFlow[currentEditIndex].id : "ot-" + Date.now(), 
            date, amount, description,
            applyInflation: document.getElementById('modal-ot-apply-inflation').checked
        };
        
        if (isEdit) currentState.onetimeFlow[currentEditIndex] = data;
        else currentState.onetimeFlow.push(data);
        renderOneTimeFlows();
    }
    
    closeModal();
    runSimulation();
}
function loadDefaultScenario() {
    currentState = JSON.parse(JSON.stringify(DEFAULT_SCENARIO));
    syncStateToInputs();
    runSimulation();
}

function saveLandingState() {
    const grid = document.getElementById('scenario-cards-grid');
    if (!grid) return;
    const checked = [];
    grid.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
        checked.push(cb.value);
    });
    localStorage.setItem('mbot_life_saved_selection', JSON.stringify(checked));
    alert('현재 선택된 시나리오 비교 상태가 브라우저에 저장되었습니다.\n다음 접속 시에도 이 상태가 유지됩니다.');
}



function renderLandingView() {
    const grid = document.getElementById('scenario-cards-grid');
    if (!grid) return;
    
    const checkedNames = new Set();
    grid.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
        checkedNames.add(cb.value);
    });
    
    let presets = JSON.parse(localStorage.getItem('mbot_life_presets') || '{}');
    const presetNames = Object.keys(presets);
    
    if (checkedNames.size === 0 && presetNames.length >= 2) {
        checkedNames.add(presetNames[0]);
        checkedNames.add(presetNames[1]);
    } else if (checkedNames.size === 0 && presetNames.length === 1) {
        checkedNames.add(presetNames[0]);
    }
    
    grid.innerHTML = '';
    
    if (presetNames.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted); font-size:18px;">등록된 시나리오가 없습니다. "새 시나리오 생성"을 눌러보세요.</div>';
        runLandingComparison();
        return;
    }
    
    presetNames.forEach(name => {
        const state = presets[name];
        const simResult = simulateScenario(state);
        
        const card = document.createElement('div');
        card.className = 'scenario-card';
        card.innerHTML = `
            <div class="scenario-card-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
                <h3 style="margin: 0; padding-right: 10px; word-break: break-all;">${name}</h3>
                <input type="checkbox" value="${name}" id="chk-${name}" ${checkedNames.has(name) ? 'checked' : ''} onchange="runLandingComparison()" style="width: 22px; height: 22px; cursor: pointer; flex-shrink: 0; accent-color: var(--color-indigo);" title="비교 차트에 포함">
            </div>
            <div class="scenario-card-body">
                <div>초기 자본: <strong>${formatKRW(state.initialInvestment)}</strong></div>
                <div>최종 자산: <strong style="color:var(--color-indigo); font-size:16px;">${formatKRW(simResult.metrics.endingAssets)}</strong></div>
                <div style="margin-top:16px; display:flex; justify-content:flex-end; gap:8px;">
                    <button class="btn btn-secondary" style="padding: 6px 14px; font-size: 13px;" onclick="downloadScenario('${name}')">저장</button>
                    <button class="btn btn-secondary" style="padding: 6px 14px; font-size: 13px;" onclick="enterEditMode('${name}')">편집</button>
                    <button class="btn btn-secondary btn-delete" style="padding: 6px 14px; font-size: 13px; width: auto; height: auto; margin: 0; display: inline-block; line-height: normal;" onclick="deleteScenario('${name}')">삭제</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
    
    runLandingComparison();
}

function createNewScenario() {
    const name = prompt("새로운 시나리오의 이름을 입력하세요:");
    if (!name) return;
    let presets = JSON.parse(localStorage.getItem('mbot_life_presets') || '{}');
    if (presets[name]) {
        alert("이미 존재하는 이름입니다.");
        return;
    }
    presets[name] = JSON.parse(JSON.stringify(DEFAULT_SCENARIO));
    localStorage.setItem('mbot_life_presets', JSON.stringify(presets));
    renderLandingView();
}

function copySelectedScenario() {
    const grid = document.getElementById('scenario-cards-grid');
    const checked = grid.querySelectorAll('input[type="checkbox"]:checked');
    if (checked.length !== 1) {
        alert("복사할 시나리오를 1개만 체크해주세요.");
        return;
    }
    
    const srcName = checked[0].value;
    const newName = prompt(srcName + " 의 복사본 이름을 입력하세요:", srcName + " (복사본)");
    if (!newName) return;
    
    let presets = JSON.parse(localStorage.getItem('mbot_life_presets') || '{}');
    if (presets[newName]) {
        alert("이미 존재하는 이름입니다.");
        return;
    }
    
    presets[newName] = JSON.parse(JSON.stringify(presets[srcName]));
    localStorage.setItem('mbot_life_presets', JSON.stringify(presets));
    renderLandingView();
}

function deleteScenario(name) {
    if (!confirm(name + " 시나리오를 정말 삭제하시겠습니까?")) return;
    let presets = JSON.parse(localStorage.getItem('mbot_life_presets') || '{}');
    delete presets[name];
    localStorage.setItem('mbot_life_presets', JSON.stringify(presets));
    renderLandingView();
}

function renameActiveScenarioInline(newName) {
    if (!newName || !activeScenarioName) return;
    if (newName === activeScenarioName) return;
    
    let presets = JSON.parse(localStorage.getItem('mbot_life_presets') || '{}');
    if (presets[newName]) {
        alert("이미 존재하는 이름입니다.");
        const scenarioTitle = document.getElementById('active-scenario-title');
        if (scenarioTitle) scenarioTitle.value = activeScenarioName;
        return;
    }
    
    presets[newName] = presets[activeScenarioName];
    delete presets[activeScenarioName];
    localStorage.setItem('mbot_life_presets', JSON.stringify(presets));
    activeScenarioName = newName;
}

function enterEditMode(name) {
    activeScenarioName = name;
    let presets = JSON.parse(localStorage.getItem('mbot_life_presets') || '{}');
    if (!presets[name]) return;
    currentState = JSON.parse(JSON.stringify(presets[name]));
    
    const container = document.getElementById('app-container');
    if (container) {
        container.classList.remove('mode-landing');
        container.classList.add('mode-editor');
    }
    
    const scenarioTitle = document.getElementById('active-scenario-title');
    if (scenarioTitle) {
        scenarioTitle.value = name;
    }
    
    syncStateToInputs();
    runSimulation();
    renderAllTimelines();
}

function exitEditModeAndSave() {
    saveLandingState();
    activeScenarioName = null;
    
    const container = document.getElementById('app-container');
    if (container) {
        container.classList.remove('mode-editor');
        container.classList.add('mode-landing');
    }
    renderLandingView();
}

function syncStateToInputs() {
    document.getElementById('initial-investment').value = Number(currentState.initialInvestment).toLocaleString();
    document.getElementById('annual-rate').value = currentState.annualRate;
    document.getElementById('inflation-rate').value = currentState.inflationRate;
    document.getElementById('use-real-value').checked = currentState.useRealValue;
    document.getElementById('simulation-period').value = currentState.simulationPeriod;
    document.getElementById('birth-year-month').value = currentState.birthDate;
    document.getElementById('start-year-month').value = currentState.startDate;
    document.getElementById('current-date').value = currentState.currentDate || new Date().toISOString().substring(0,7);
    document.getElementById('current-balance').value = Number(currentState.currentBalance !== undefined ? currentState.currentBalance : currentState.initialInvestment).toLocaleString();

    const initKrw = document.getElementById('initial-investment-krw');
    if (initKrw) initKrw.textContent = formatKRW(currentState.initialInvestment);
    const currKrw = document.getElementById('current-balance-krw');
    if (currKrw) currKrw.textContent = formatKRW(currentState.currentBalance !== undefined ? currentState.currentBalance : currentState.initialInvestment);
}

function runLandingComparison() {
    const grid = document.getElementById('scenario-cards-grid');
    if (!grid) return;
    const checked = [];
    grid.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
        checked.push(cb.value);
    });
    
    // Update copy button state
    const copyBtn = document.getElementById('btn-copy-scenario');
    if (copyBtn) {
        copyBtn.disabled = checked.length !== 1;
    }
    
    const compArea = document.getElementById('landing-comparison-area');
    if (checked.length > 0) {
        if (compArea) compArea.style.display = 'block';
    } else {
        if (compArea) compArea.style.display = 'none';
    }
    
    let presets = JSON.parse(localStorage.getItem('mbot_life_presets') || '{}');
    let compData = [];
    checked.forEach(name => {
        if (presets[name]) {
            const sim = simulateScenario(presets[name]);
            compData.push({
                name: name,
                state: presets[name],
                results: sim.annualResults,
                metrics: sim.metrics
            });
        }
    });
    
    renderLandingComparisonChart(compData);
    renderLandingComparisonTable(compData);
}

function renderLandingComparisonTable(comparisonData) {
    const headersRow = document.getElementById('landing-comparison-headers');
    const tbody = document.querySelector('#landing-comparison-table tbody');
    if (!headersRow || !tbody) return;
    
    headersRow.innerHTML = '<th style="text-align: left;">비교 항목</th>';
    tbody.innerHTML = '';
    
    if (comparisonData.length === 0) return;
    
    comparisonData.forEach(cd => {
        const th = document.createElement('th');
        th.textContent = cd.name;
        headersRow.appendChild(th);
    });
    
    const metricsDef = [
        { label: '초기 자본', getValue: (cd) => formatKRW(cd.state.initialInvestment) },
        { label: '목표 수익률 (YR%)', getValue: (cd) => `${cd.state.annualRate}%` },
        { label: '최종 보유 자산', getValue: (cd) => formatKRW(cd.metrics.endingAssets) },
        { label: '최대 자산 도달 시점', getValue: (cd) => `${formatKRW(cd.metrics.peakAssets)} (만 ${cd.metrics.peakAge}세)` },
        { label: '누적 투자 수익', getValue: (cd) => formatKRW(cd.metrics.totalReturnSum) },
        { label: '누적 자본 순 유입', getValue: (cd) => formatKRW(cd.metrics.totalNetSavings) }
    ];
    
    metricsDef.forEach(metric => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td style="text-align: left; font-weight: 600;">${metric.label}</td>`;
        comparisonData.forEach(cd => {
            const td = document.createElement('td');
            td.innerHTML = metric.getValue(cd);
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

let landingChart = null;
function renderLandingComparisonChart(comparisonData) {
    if (comparisonData.length === 0) {
        if (landingChart) landingChart.updateSeries([]);
        return;
    }
    
    let maxLength = 0;
    let longestResults = [];
    comparisonData.forEach(cd => {
        if (cd.results.length > maxLength) {
            maxLength = cd.results.length;
            longestResults = cd.results;
        }
    });
    
    const yearsLabels = longestResults.map(yr => `${yr.year}년 (만 ${yr.endAge}세)`);
    const series = comparisonData.map(cd => {
        return {
            name: cd.name,
            data: cd.results.map(yr => Math.round(yr.endingBalance))
        };
    });
    
    const opts = {
        series: series,
        chart: { type: 'line', height: 400, foreColor: '#9ca3af', background: 'transparent', toolbar: { show: false } },
        colors: ['#6366f1', '#10b981', '#f43f5e', '#8b5cf6', '#f59e0b', '#06b6d4'],
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3 },
        xaxis: { categories: yearsLabels },
        yaxis: {
            labels: {
                formatter: function(value) { return (value / 100000000).toFixed(1) + ' 억'; }
            }
        },
        grid: { borderColor: 'rgba(255, 255, 255, 0.05)' },
        tooltip: {
            theme: 'dark',
            custom: function({ series, seriesIndex, dataPointIndex, w }) {
                const catLabel = w.globals.categoryLabels[dataPointIndex] || (w.config.xaxis.categories ? w.config.xaxis.categories[dataPointIndex] : '') || '';
                const yrStr = catLabel.split('년')[0];
                const targetYear = parseInt(yrStr, 10);
                
                let html = `<div style="padding: 12px; font-size: 13px; color: #fff; line-height: 1.5;">`;
                html += `<div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 4px; color: #e2e8f0;">📅 ${catLabel}</div>`;
                
                if (w.globals.seriesNames && w.globals.seriesNames.length > 0) {
                    w.globals.seriesNames.forEach((sName, sIdx) => {
                        const color = w.globals.colors[sIdx] || '#6366f1';
                        const val = series[sIdx] ? series[sIdx][dataPointIndex] : 0;
                        html += `<div style="margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">`;
                        html += `<span><span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${color}; margin-right:6px;"></span><strong>${sName}</strong></span>`;
                        html += `<span style="font-weight:bold; color:#f8fafc;">${formatKRW(val)}</span>`;
                        html += `</div>`;
                    });
                }
                
                let allMajorLogs = [];
                if (!isNaN(targetYear) && typeof generateDetailedLogs === 'function') {
                    comparisonData.forEach(cd => {
                        const sState = cd.state || currentState;
                        const logs = generateDetailedLogs(sState);
                        logs.forEach(l => {
                            if (l.year === targetYear && (l.type === '대출/대여' || l.type === '일회성') && Math.abs(l.amount) >= 100000000) {
                                allMajorLogs.push({
                                    scenarioName: cd.name,
                                    name: l.name,
                                    amount: l.amount,
                                    type: l.type
                                });
                            }
                        });
                    });
                }
                
                if (allMajorLogs.length > 0) {
                    html += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.15); font-size: 12px;">`;
                    html += `<div style="font-weight: bold; color: #f59e0b; margin-bottom: 4px;">📌 주요 현금흐름 (1억 이상):</div>`;
                    allMajorLogs.forEach(l => {
                        const sign = l.amount > 0 ? '+' : '-';
                        const color = l.amount > 0 ? '#34d399' : '#f87171';
                        const prefix = comparisonData.length > 1 ? `[${l.scenarioName}] ` : '';
                        html += `<div style="margin-bottom: 2px;">• ${prefix}${l.name}: <span style="color:${color}; font-weight:bold;">${sign}${formatKRW(Math.abs(l.amount))}</span></div>`;
                    });
                    html += `</div>`;
                }
                
                html += `</div>`;
                return html;
            }
        }
    };
    
    if (landingChart) {
        landingChart.updateOptions(opts);
    } else {
        landingChart = new ApexCharts(document.querySelector("#landing-comparison-chart"), opts);
        landingChart.render();
    }
}


// Read DOM inputs into state
function syncInputsToState() {
    currentState.initialInvestment = Number(document.getElementById('initial-investment').value.replace(/,/g, ''));
    currentState.annualRate = Number(document.getElementById('annual-rate').value);
    currentState.inflationRate = Number(document.getElementById('inflation-rate').value);
    currentState.useRealValue = document.getElementById('use-real-value').checked;
    currentState.simulationPeriod = Number(document.getElementById('simulation-period').value);
    currentState.birthDate = document.getElementById('birth-year-month').value;
    currentState.startDate = document.getElementById('start-year-month').value;
    currentState.currentDate = document.getElementById('current-date').value;
    currentState.currentBalance = Number(document.getElementById('current-balance').value.replace(/,/g, ''));
    
    document.getElementById('initial-investment-krw').textContent = formatKRW(currentState.initialInvestment);
    document.getElementById('current-balance-krw').textContent = formatKRW(currentState.currentBalance);
}

function downloadScenario(name) {
    let presets = JSON.parse(localStorage.getItem('mbot_life_presets') || '{}');
    if (!presets[name]) return;
    const dataStr = JSON.stringify(presets[name], null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name + ".json";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
}

function loadScenarioFromFile(event) {
    const input = event.target;
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            // Basic validation
            if (typeof data !== 'object' || data === null) throw new Error("Invalid format");
            
            let baseName = file.name.replace(/\.json$/i, '');
            let presets = JSON.parse(localStorage.getItem('mbot_life_presets') || '{}');
            let finalName = baseName;
            let counter = 1;
            while (presets[finalName]) {
                finalName = baseName + ` (${counter})`;
                counter++;
            }
            presets[finalName] = data;
            localStorage.setItem('mbot_life_presets', JSON.stringify(presets));
            alert(finalName + " 시나리오가 성공적으로 로딩되었습니다.");
            
            // Try to render the landing view
            if (typeof renderLandingView === 'function') {
                renderLandingView();
            }
        } catch (error) {
            console.error(error);
            alert("유효하지 않은 시나리오 파일입니다.");
        } finally {
            input.value = ""; // Reset input
        }
    };
    reader.onerror = function() {
        alert("파일을 읽는 중 오류가 발생했습니다.");
        input.value = "";
    };
    reader.readAsText(file);
}
