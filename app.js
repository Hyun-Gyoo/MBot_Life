// MBot_Life - Application Logic

// --- Scenarios & Initial State ---
const DEFAULT_SCENARIO = {
    initialInvestment: 350000000,
    annualRate: 15,
    inflationRate: 3.2,
    useRealValue: true,
    simulationPeriod: 20,
    birthDate: "1970-06",
    startDate: "2026-07",
    
    // 월 정기 수입
    monthlyIncome: [],
    
    // 연 정기 수입 (년단위 적용)
    annualIncome: [],
    
    // 월 정기 지출
    monthlyExpense: [],
    
    // 대출금 설정 (유입, 이자율, 상환)
    loans: [],
    
    // 일회성 현금 흐름
    onetimeFlow: []
};

let currentState = JSON.parse(JSON.stringify(DEFAULT_SCENARIO));
let simulationResults = [];
let assetChart = null;
let cashflowChart = null;
let activeScenarioName = "";
let landingComparisonChart = null;

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

// --- Tabs Management ---
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Find the button and trigger active
    event.currentTarget.classList.add('active');
    document.getElementById(`tab-${tabId}`).classList.add('active');
}

// --- Render Timeline Lists ---

function renderAllTimelines() {
    renderMonthlyIncome();
    renderAnnualIncome();
    renderMonthlyExpense();
    renderLoans();
    renderOneTimeFlows();
}

function renderMonthlyIncome() {
    const list = document.getElementById('monthly-income-list');
    if (!list) return;
    list.innerHTML = '';
    currentState.monthlyIncome.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        div.innerHTML = `
            <div class="timeline-row-inputs" style="margin-bottom: 6px;">
                <div style="flex:1;">
                    <label>설명 (이름)</label>
                    <input type="text" value="${item.label || ''}" onchange="updateMonthlyIncome(${index}, 'label', this.value); runSimulation();">
                </div>
            </div>
            <div class="timeline-row-inputs">
                <div>
                    <label>시작월</label>
                    <input type="month" value="${item.start}" onchange="updateMonthlyIncome(${index}, 'start', this.value); runSimulation();">
                </div>
                <div>
                    <label>종료월</label>
                    <input type="month" value="${item.end}" onchange="updateMonthlyIncome(${index}, 'end', this.value); runSimulation();">
                </div>
            </div>
            <div class="timeline-row-bottom">
                <div>
                    <label>월수입 (원)</label>
                    <input type="text" inputmode="numeric" value="${Number(item.amount).toLocaleString()}" oninput="formatInputWithComma(this)" onchange="updateMonthlyIncome(${index}, 'amount', this.value); runSimulation();" style="text-align:right;">
                </div>
                <button class="btn-delete" onclick="deleteMonthlyIncome(${index})">✕</button>
            </div>
            <div class="helper-text">${formatKRW(item.amount)}</div>
        `;
        list.appendChild(div);
    });
}


function renderAnnualIncome() {
    const list = document.getElementById('annual-income-list');
    if (!list) return;
    list.innerHTML = '';
    currentState.annualIncome.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        div.innerHTML = `
            <div class="timeline-row-inputs" style="margin-bottom: 6px;">
                <div style="flex:1;">
                    <label>설명 (이름)</label>
                    <input type="text" value="${item.label || ''}" onchange="updateAnnualIncome(${index}, 'label', this.value); runSimulation();">
                </div>
            </div>
            <div class="timeline-row-inputs">
                <div>
                    <label>시작연도</label>
                    <input type="number" value="${item.startYear}" onchange="updateAnnualIncome(${index}, 'startYear', this.value); runSimulation();">
                </div>
                <div>
                    <label>종료연도</label>
                    <input type="number" value="${item.endYear}" onchange="updateAnnualIncome(${index}, 'endYear', this.value); runSimulation();">
                </div>
            </div>
            <div class="timeline-row-bottom">
                <div>
                    <label>연수입 (원)</label>
                    <input type="text" inputmode="numeric" value="${Number(item.amount).toLocaleString()}" oninput="formatInputWithComma(this)" onchange="updateAnnualIncome(${index}, 'amount', this.value); runSimulation();" style="text-align:right;">
                </div>
                <button class="btn-delete" onclick="deleteAnnualIncome(${index})">✕</button>
            </div>
            <div class="helper-text">${formatKRW(item.amount)}</div>
        `;
        list.appendChild(div);
    });
}

function renderMonthlyExpense() {
    const list = document.getElementById('monthly-expense-list');
    if (!list) return;
    list.innerHTML = '';
    currentState.monthlyExpense.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        div.innerHTML = `
            <div class="timeline-row-inputs" style="margin-bottom: 6px;">
                <div style="flex:1;">
                    <label>설명 (이름)</label>
                    <input type="text" value="${item.label || ''}" onchange="updateMonthlyExpense(${index}, 'label', this.value); runSimulation();">
                </div>
            </div>
            <div class="timeline-row-inputs">
                <div>
                    <label>시작월</label>
                    <input type="month" value="${item.start}" onchange="updateMonthlyExpense(${index}, 'start', this.value); runSimulation();">
                </div>
                <div>
                    <label>종료월</label>
                    <input type="month" value="${item.end}" onchange="updateMonthlyExpense(${index}, 'end', this.value); runSimulation();">
                </div>
            </div>
            <div class="timeline-row-bottom">
                <div>
                    <label>월지출 (원)</label>
                    <input type="text" inputmode="numeric" value="${Number(item.amount).toLocaleString()}" oninput="formatInputWithComma(this)" onchange="updateMonthlyExpense(${index}, 'amount', this.value); runSimulation();" style="text-align:right;">
                </div>
                <button class="btn-delete" onclick="deleteMonthlyExpense(${index})">✕</button>
            </div>
            <div class="helper-text">${formatKRW(item.amount)}</div>
        `;
        list.appendChild(div);
    });
}

function renderLoans() {
    const list = document.getElementById('loans-list');
    if (!list) return;
    list.innerHTML = '';
    currentState.loans.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        const isLend = item.type === 'lend';
        const badgeColor = isLend ? 'background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); color: #a7f3d0;' : '';
        
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span class="loan-badge" style="${badgeColor}">${isLend ? '대여금' : '대출금'}</span>
                <span style="font-size: 14px; font-weight: 600; color: var(--text-secondary);">${item.name || '신규 대출/대여'}</span>
            </div>
            <div class="timeline-row-inputs">
                <div>
                    <label>유형 구분</label>
                    <select onchange="updateLoan(${index}, 'type', this.value); renderLoans(); runSimulation();" style="background: rgba(0,0,0,0.3); color: white; border: 1px solid var(--border-color); border-radius: 4px; padding: 4px; font-size:14px; width: 100%;">
                        <option value="borrow" ${!isLend ? 'selected' : ''}>대출 (자금 차입)</option>
                        <option value="lend" ${isLend ? 'selected' : ''}>대여 (자금 대여)</option>
                    </select>
                </div>
                <div>
                    <label>${isLend ? '대여 금액' : '대출 금액'} (원)</label>
                    <input type="text" inputmode="numeric" value="${Number(item.amount).toLocaleString()}" oninput="formatInputWithComma(this)" onchange="updateLoan(${index}, 'amount', this.value); runSimulation();" style="text-align:right;">
                </div>
            </div>
            <div class="timeline-row-inputs" style="margin-top: 6px;">
                <div>
                    <label>${isLend ? '대여 시작월' : '대출 발생월'}</label>
                    <input type="month" value="${item.borrowDate}" onchange="updateLoan(${index}, 'borrowDate', this.value); runSimulation();">
                </div>
                <div>
                    <label>${isLend ? '원금 회수월' : '만기 상환월'}</label>
                    <input type="month" value="${item.repayDate}" onchange="updateLoan(${index}, 'repayDate', this.value); runSimulation();">
                </div>
            </div>
            <div class="timeline-row-inputs" style="margin-top: 6px;">
                <div>
                    <label>연 이자율 (%)</label>
                    <input type="number" step="0.1" value="${item.rate}" onchange="updateLoan(${index}, 'rate', this.value); runSimulation();">
                </div>
                <div style="display: flex; align-items: center; gap: 6px; padding-top: 24px;">
                    <input type="checkbox" id="loan-inf-${index}" ${item.applyInflation ? 'checked' : ''} onchange="updateLoan(${index}, 'applyInflation', this.checked); runSimulation();" style="width: 14px; height: 14px; cursor: pointer; accent-color: var(--color-indigo);">
                    <label for="loan-inf-${index}" style="margin-bottom: 0; font-size: 11px; cursor: pointer; color: var(--text-secondary);">물가반영 (실질가치)</label>
                </div>
            </div>
            <div class="timeline-row-bottom" style="margin-top: 6px;">
                <div style="flex:1;">
                    <label>설명 (이름)</label>
                    <input type="text" value="${item.name || ''}" onchange="updateLoan(${index}, 'name', this.value); runSimulation();">
                </div>
                <button class="btn-delete" onclick="deleteLoan(${index})" style="margin-top: 22px;">✕</button>
            </div>
            <div class="helper-text">${formatKRW(item.amount)}</div>
        `;
        list.appendChild(div);
    });
}

function renderOneTimeFlows() {
    const list = document.getElementById('onetime-flow-list');
    if (!list) return;
    list.innerHTML = '';
    currentState.onetimeFlow.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        div.innerHTML = `
            <div class="timeline-row-inputs" style="margin-bottom: 6px;">
                <div style="flex:1;">
                    <label>설명 (이름)</label>
                    <input type="text" value="${item.description || ''}" onchange="updateOnetimeFlow(${index}, 'description', this.value); runSimulation();">
                </div>
            </div>
            <div class="timeline-row-inputs">
                <div>
                    <label>발생일 (년월)</label>
                    <input type="month" value="${item.date}" onchange="updateOnetimeFlow(${index}, 'date', this.value); runSimulation();">
                </div>
            </div>
            <div class="timeline-row-bottom" style="margin-top: 6px;">
                <div>
                    <label>금액 (원)</label>
                    <input type="text" inputmode="numeric" value="${Number(item.amount).toLocaleString()}" oninput="formatInputWithComma(this)" onchange="updateOnetimeFlow(${index}, 'amount', this.value); runSimulation();" style="text-align:right;">
                </div>
                <button class="btn-delete" onclick="deleteOnetimeFlow(${index})">✕</button>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; margin-top: 8px;">
                <input type="checkbox" id="ot-inf-${index}" ${item.applyInflation ? 'checked' : ''} onchange="updateOnetimeFlow(${index}, 'applyInflation', this.checked); runSimulation();" style="width: 14px; height: 14px; cursor: pointer; accent-color: var(--color-indigo);">
                <label for="ot-inf-${index}" style="margin-bottom: 0; font-size: 11px; cursor: pointer; color: var(--text-secondary);">물가반영 (실질가치 고정)</label>
            </div>
            <div class="helper-text">${formatKRW(item.amount)}</div>
        `;
        list.appendChild(div);
    });
}

function updateMonthlyIncome(index, key, val) {
    if (key === 'amount') val = Number(val.replace(/,/g, ''));
    if (key === 'applyInflation') val = val === true;
    currentState.monthlyIncome[index][key] = val;
}

function deleteMonthlyIncome(index) {
    currentState.monthlyIncome.splice(index, 1);
    renderMonthlyIncome();
    runSimulation();
}

function updateAnnualIncome(index, key, val) {
    if (key === 'amount' || key === 'startYear' || key === 'endYear' || key === 'increaseRate') val = Number(String(val).replace(/,/g, ''));
    if (key === 'applyInflation') val = val === true;
    currentState.annualIncome[index][key] = val;
}

function deleteAnnualIncome(index) {
    currentState.annualIncome.splice(index, 1);
    renderAnnualIncome();
    runSimulation();
}

function updateMonthlyExpense(index, key, val) {
    if (key === 'amount') val = Number(val.replace(/,/g, ''));
    if (key === 'applyInflation') val = val === true;
    currentState.monthlyExpense[index][key] = val;
}

function deleteMonthlyExpense(index) {
    currentState.monthlyExpense.splice(index, 1);
    renderMonthlyExpense();
    runSimulation();
}

function updateLoan(index, key, val) {
    if (key === 'amount' || key === 'rate') val = Number(String(val).replace(/,/g, ''));
    if (key === 'applyInflation') val = val === true;
    currentState.loans[index][key] = val;
}

function deleteLoan(index) {
    currentState.loans.splice(index, 1);
    renderLoans();
    runSimulation();
}

function updateOnetimeFlow(index, key, val) {
    if (key === 'amount') val = Number(String(val).replace(/,/g, ''));
    if (key === 'applyInflation') val = val === true;
    currentState.onetimeFlow[index][key] = val;
}

function deleteOnetimeFlow(index) {
    currentState.onetimeFlow.splice(index, 1);
    renderOneTimeFlows();
    runSimulation();
}




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

function openAddItemModal(type) {
    const modal = document.getElementById('item-modal');
    const title = document.getElementById('modal-title');
    const fields = document.getElementById('modal-body-fields');
    const submitBtn = document.getElementById('modal-submit-btn');
    if (!modal || !title || !fields || !submitBtn) return;
    
    fields.innerHTML = '';
    
    if (type === 'monthlyIncome') {
        title.textContent = '월 정기 수입 추가';
        fields.innerHTML = `
            <div class="input-group">
                <label>시작월</label>
                <input type="month" id="modal-mi-start" value="${currentState.startDate}" onchange="updateModalMIPreview()">
            </div>
            <div class="input-group">
                <label>종료월</label>
                <input type="month" id="modal-mi-end" value="${addMonths(currentState.startDate, 11)}" onchange="updateModalMIPreview()">
            </div>
            <div class="input-group">
                <label>월 수입액 (원)</label>
                <input type="text" inputmode="numeric" id="modal-mi-amount" value="5,000,000" style="text-align:right;" oninput="formatInputWithComma(this); updateModalMIPreview()">
            </div>
            <div class="input-group">
                <label>설명 (이름)</label>
                <input type="text" id="modal-mi-label" value="신규 월 수입">
            </div>
            <div style="display:flex; align-items:center; gap:6px; margin-top:12px;">
                <input type="checkbox" id="modal-mi-apply-inflation" style="width:16px; height:16px;" onchange="updateModalMIPreview()">
                <label for="modal-mi-apply-inflation" style="margin-bottom:0;">물가상승률 반영 (실질 가치 고정)</label>
            </div>
            <div class="input-group" style="margin-top:8px;">
                <label>연 임금인상률 (%)</label>
                <input type="number" step="0.1" id="modal-mi-increase-rate" value="0.0" oninput="updateModalMIPreview()">
            </div>
            <div id="modal-mi-inflated-preview" style="font-size:13px; margin-top:12px;"></div>
        `;
        submitBtn.onclick = () => submitModalItem(type);
        setTimeout(updateModalMIPreview, 100);
        
    } else if (type === 'annualIncome') {
        title.textContent = '연 정기 수입 추가';
        const currentYear = new Date(currentState.startDate || new Date()).getFullYear();
        fields.innerHTML = `
            <div class="input-group">
                <label>시작연도 <span id="modal-ai-start-age"></span></label>
                <input type="number" id="modal-ai-start" value="${currentYear}" onchange="updateModalAIPreview()">
            </div>
            <div class="input-group">
                <label>종료연도 <span id="modal-ai-end-age"></span></label>
                <input type="number" id="modal-ai-end" value="${currentYear + 5}" onchange="updateModalAIPreview()">
            </div>
            <div class="input-group">
                <label>연 수입액 (원)</label>
                <input type="text" inputmode="numeric" id="modal-ai-amount" value="10,000,000" style="text-align:right;" oninput="formatInputWithComma(this); updateModalAIPreview()">
            </div>
            <div class="input-group">
                <label>설명 (이름)</label>
                <input type="text" id="modal-ai-label" value="신규 연 수입">
            </div>
            <div style="display:flex; align-items:center; gap:6px; margin-top:12px;">
                <input type="checkbox" id="modal-ai-apply-inflation" style="width:16px; height:16px;" onchange="updateModalAIPreview()">
                <label for="modal-ai-apply-inflation" style="margin-bottom:0;">물가상승률 반영 (실질 가치 고정)</label>
            </div>
            <div class="input-group" style="margin-top:8px;">
                <label>연 임금인상률 (%)</label>
                <input type="number" step="0.1" id="modal-ai-increase-rate" value="0.0" oninput="updateModalAIPreview()">
            </div>
            <div id="modal-ai-inflated-preview" style="font-size:13px; margin-top:12px;"></div>
        `;
        submitBtn.onclick = () => submitModalItem(type);
        setTimeout(updateModalAIPreview, 100);
        
    } else if (type === 'monthlyExpense') {
        title.textContent = '월 정기 지출 추가';
        fields.innerHTML = `
            <div class="input-group">
                <label>시작월</label>
                <input type="month" id="modal-me-start" value="${currentState.startDate}" onchange="updateModalMEPreview()">
            </div>
            <div class="input-group">
                <label>종료월</label>
                <input type="month" id="modal-me-end" value="${addMonths(currentState.startDate, 11)}" onchange="updateModalMEPreview()">
            </div>
            <div class="input-group">
                <label>월 지출액 (원)</label>
                <input type="text" inputmode="numeric" id="modal-me-amount" value="3,000,000" style="text-align:right;" oninput="formatInputWithComma(this); updateModalMEPreview()">
            </div>
            <div class="input-group">
                <label>설명 (이름)</label>
                <input type="text" id="modal-me-label" value="생활비 추가">
            </div>
            <div style="display:flex; align-items:center; gap:6px; margin-top:12px;">
                <input type="checkbox" id="modal-me-apply-inflation" style="width:16px; height:16px;" onchange="updateModalMEPreview()">
                <label for="modal-me-apply-inflation" style="margin-bottom:0;">물가상승률 반영 (실질 가치 고정)</label>
            </div>
            <div id="modal-me-inflated-preview" style="font-size:13px; margin-top:12px;"></div>
        `;
        submitBtn.onclick = () => submitModalItem(type);
        setTimeout(updateModalMEPreview, 100);
        
    } else if (type === 'loan') {
        title.textContent = '대출 / 대여 설정 추가';
        fields.innerHTML = `
            <div class="input-group" style="margin-bottom: 12px;">
                <label>유형</label>
                <select id="modal-loan-type" style="width:100%; padding: 8px; border-radius: 4px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); color: white;">
                    <option value="borrow">대출 (자금 차입)</option>
                    <option value="lend">대여 (자금 대여)</option>
                </select>
            </div>
            <div class="input-group">
                <label>설명 (이름)</label>
                <input type="text" id="modal-loan-label" value="신규 대출/대여">
            </div>
            <div class="input-group">
                <label>금액 (원)</label>
                <input type="text" inputmode="numeric" id="modal-loan-amount" value="100,000,000" style="text-align:right;" oninput="formatInputWithComma(this)">
            </div>
            <div class="input-group">
                <label>연 이자율 (%)</label>
                <input type="number" step="0.1" id="modal-loan-rate" value="3.0">
            </div>
            <div class="input-group">
                <label>발생월 (시작일)</label>
                <input type="month" id="modal-loan-borrow-date" value="${currentState.startDate}">
            </div>
            <div class="input-group">
                <label>만기월 (종료일)</label>
                <input type="month" id="modal-loan-repay-date" value="${addMonths(currentState.startDate, 60)}">
            </div>
            <div style="display:flex; align-items:center; gap:6px; margin-top:12px;">
                <input type="checkbox" id="modal-loan-apply-inflation" style="width:16px; height:16px;">
                <label for="modal-loan-apply-inflation" style="margin-bottom:0;">물가상승률 반영 (실질 가치 고정)</label>
            </div>
            <div id="modal-loan-inflated-preview" style="font-size:13px; margin-top:12px;"></div>
        `;
        submitBtn.onclick = () => submitModalItem(type);
        if (window.updateModalLoanPreview) setTimeout(updateModalLoanPreview, 100);
        
    } else if (type === 'onetimeFlow') {
        title.textContent = '일회성 현금 흐름 추가';
        fields.innerHTML = `
            <div class="input-group">
                <label>설명 (이름)</label>
                <input type="text" id="modal-ot-description" value="비정기 지출/수입">
            </div>
            <div class="input-group">
                <label>발생일 (년월)</label>
                <input type="month" id="modal-ot-date" value="${currentState.startDate}" onchange="updateModalOTPreview()">
            </div>
            <div class="input-group">
                <label>금액 (원)</label>
                <input type="text" inputmode="numeric" id="modal-ot-amount" value="-10,000,000" style="text-align:right;" oninput="formatInputWithComma(this); updateModalOTPreview()">
            </div>
            <div style="display:flex; align-items:center; gap:6px; margin-top:12px;">
                <input type="checkbox" id="modal-ot-apply-inflation" style="width:16px; height:16px;" onchange="updateModalOTPreview()">
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
    if (type === 'monthlyIncome') {
        const start = document.getElementById('modal-mi-start').value;
        const end = document.getElementById('modal-mi-end').value;
        const amount = Number(document.getElementById('modal-mi-amount').value.replace(/,/g, ''));
        const label = document.getElementById('modal-mi-label').value;
        if (!start || !end || isNaN(amount)) return alert('필수 항목을 입력하세요.');
        currentState.monthlyIncome.push({
            id: "mi-" + Date.now(), start, end, amount, label,
            applyInflation: document.getElementById('modal-mi-apply-inflation').checked,
            increaseRate: Number(document.getElementById('modal-mi-increase-rate').value) || 0
        });
        renderMonthlyIncome();
    } else if (type === 'annualIncome') {
        const startYear = Number(document.getElementById('modal-ai-start').value);
        const endYear = Number(document.getElementById('modal-ai-end').value);
        const amount = Number(document.getElementById('modal-ai-amount').value.replace(/,/g, ''));
        const label = document.getElementById('modal-ai-label').value;
        if (!startYear || !endYear || isNaN(amount)) return alert('필수 항목을 입력하세요.');
        currentState.annualIncome.push({
            id: "ai-" + Date.now(), startYear, endYear, amount, label,
            applyInflation: document.getElementById('modal-ai-apply-inflation').checked,
            increaseRate: Number(document.getElementById('modal-ai-increase-rate').value) || 0
        });
        renderAnnualIncome();
    } else if (type === 'monthlyExpense') {
        const start = document.getElementById('modal-me-start').value;
        const end = document.getElementById('modal-me-end').value;
        const amount = Number(document.getElementById('modal-me-amount').value.replace(/,/g, ''));
        const label = document.getElementById('modal-me-label').value;
        if (!start || !end || isNaN(amount)) return alert('필수 항목을 입력하세요.');
        currentState.monthlyExpense.push({
            id: "me-" + Date.now(), start, end, amount, label,
            applyInflation: document.getElementById('modal-me-apply-inflation').checked
        });
        renderMonthlyExpense();
    } else if (type === 'loan') {
        const borrowDate = document.getElementById('modal-loan-borrow-date').value;
        const repayDate = document.getElementById('modal-loan-repay-date').value;
        const amount = Number(document.getElementById('modal-loan-amount').value.replace(/,/g, ''));
        const rate = Number(document.getElementById('modal-loan-rate').value);
        const name = document.getElementById('modal-loan-label').value;
        const ltype = document.getElementById('modal-loan-type').value;
        if (!borrowDate || !repayDate || isNaN(amount) || isNaN(rate)) return alert('필수 항목을 입력하세요.');
        currentState.loans.push({
            id: "loan-" + Date.now(), type: ltype, name, amount, rate, borrowDate, repayDate,
            applyInflation: document.getElementById('modal-loan-apply-inflation').checked
        });
        renderLoans();
    } else if (type === 'onetimeFlow') {
        const date = document.getElementById('modal-ot-date').value;
        const amount = Number(document.getElementById('modal-ot-amount').value.replace(/,/g, ''));
        const description = document.getElementById('modal-ot-description').value;
        if (!date || isNaN(amount)) return alert('필수 항목을 입력하세요.');
        currentState.onetimeFlow.push({
            id: "ot-" + Date.now(), date, amount, description,
            applyInflation: document.getElementById('modal-ot-apply-inflation').checked
        });
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
            <div class="scenario-card-header">
                <h3>${name}</h3>
                <div class="scenario-actions">
                    <button class="btn btn-secondary" onclick="enterEditMode('${name}')">편집</button>
                    <button class="btn btn-secondary btn-delete" onclick="deleteScenario('${name}')">삭제</button>
                </div>
            </div>
            <div class="scenario-card-body">
                <div>초기 자본: <strong>${formatKRW(state.initialInvestment)}</strong></div>
                <div>최종 자산: <strong style="color:var(--color-indigo); font-size:16px;">${formatKRW(simResult.metrics.endingAssets)}</strong></div>
                <div style="margin-top:12px; display:flex; align-items:center; gap:6px;">
                    <input type="checkbox" value="${name}" id="chk-${name}" ${checkedNames.has(name) ? 'checked' : ''} onchange="runLandingComparison()">
                    <label for="chk-${name}">비교 차트에 포함</label>
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
            y: { formatter: function(value) { return formatKRW(value); } }
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
    document.getElementById('initial-investment-krw').textContent = formatKRW(currentState.initialInvestment);
}

// --- Simulation Engine ---

// Pure simulation function that takes a state and returns results and metrics
function simulateScenario(state) {
    const YR = state.simulationPeriod;
    const initialAsset = state.initialInvestment;
    const annualRate = state.annualRate;
    const startYM = state.startDate;
    const birthYM = state.birthDate;
    
    const monthlyCompoundingRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
    
    let monthlyDetails = [];
    let currentBalance = initialAsset;
    
    const totalMonths = YR * 12;
    
    for (let m = 0; m < totalMonths; m++) {
        const currentYM = addMonths(startYM, m);
        const [yearStr, monthStr] = currentYM.split('-');
        const currentYear = Number(yearStr);
        const currentMonth = Number(monthStr);
        
        // Calculate age
        const [bYear, bMonth] = birthYM.split('-').map(Number);
        const ageYears = currentYear - bYear;
        const ageMonths = currentMonth - bMonth;
        const exactAge = ageYears + ageMonths / 12;
        
        const startingBalance = currentBalance;
        
        let regMonthlyIncome = 0;
        let regAnnualIncome = 0;
        let loanInflow = 0;
        let onetimeInflow = 0;
        
        const inflationFactor = Math.pow(1 + state.inflationRate / 100, m / 12);
        
        // 1. Regular Monthly Income (grows with inflation ONLY if applyInflation is true, else flat)
        state.monthlyIncome.forEach(item => {
            if (currentYM >= item.start && currentYM <= item.end) {
                const applyInf = item.applyInflation !== false; // default true for backward compatibility
                const infFactor = applyInf ? inflationFactor : 1;
                
                let incFactor = 1;
                if (item.increaseRate) {
                    const monthsSinceStart = diffMonths(item.start, currentYM);
                    if (monthsSinceStart > 0) {
                        incFactor = Math.pow(1 + item.increaseRate / 100, monthsSinceStart / 12);
                    }
                }
                
                regMonthlyIncome += item.amount * infFactor * incFactor;
            }
        });
        
        // 2. Regular Annual Income (Apply in December, grows with inflation ONLY if applyInflation is true)
        if (currentMonth === 12) {
            state.annualIncome.forEach(item => {
                if (currentYear >= item.startYear && currentYear <= item.endYear) {
                    const applyInf = item.applyInflation !== false;
                    const infFactor = applyInf ? inflationFactor : 1;
                    
                    let incFactor = 1;
                    if (item.increaseRate) {
                        const yearsSinceStart = currentYear - item.startYear;
                        if (yearsSinceStart > 0) {
                            incFactor = Math.pow(1 + item.increaseRate / 100, yearsSinceStart);
                        }
                    }
                    
                    regAnnualIncome += item.amount * infFactor * incFactor;
                }
            });
        }
        
        // 3. Loans Borrow/Lend Inflow (grows with inflation ONLY if applyInflation is checked)
        state.loans.forEach(loan => {
            const factor = loan.applyInflation ? inflationFactor : 1;
            const isLend = loan.type === 'lend';
            
            if (currentYM === loan.borrowDate) {
                if (!isLend) {
                    loanInflow += loan.amount * factor; // 대출: 발생 시 자금 유입
                }
            }
            if (currentYM === loan.repayDate) {
                if (isLend) {
                    loanInflow += loan.amount * factor; // 대여: 만기 시 원금 회수(유입)
                }
            }
        });
        
        // 4. One-time Flows (Inflow portion, grows with inflation ONLY if applyInflation is checked)
        state.onetimeFlow.forEach(flow => {
            if (currentYM === flow.date && flow.amount > 0) {
                const factor = flow.applyInflation ? inflationFactor : 1;
                onetimeInflow += flow.amount * factor;
            }
        });
        
        // Outflows
        let regMonthlyExpense = 0;
        let loanInterest = 0;
        let loanRepayment = 0;
        let onetimeOutflow = 0;
        
        // 1. Regular Monthly Expenditure (grows with inflation ONLY if applyInflation is true)
        state.monthlyExpense.forEach(item => {
            if (currentYM >= item.start && currentYM <= item.end) {
                const applyInf = item.applyInflation !== false;
                const factor = applyInf ? inflationFactor : 1;
                regMonthlyExpense += item.amount * factor;
            }
        });
        
        // 2. Loan & Lend Interest and Repayment/Lend Outflow
        state.loans.forEach(loan => {
            const factor = loan.applyInflation ? inflationFactor : 1;
            const isLend = loan.type === 'lend';
            const principal = loan.amount * factor;
            
            // Interest condition: active while borrowed/lent (exclusive of borrow date, inclusive of repay date)
            if (currentYM > loan.borrowDate && currentYM <= loan.repayDate) {
                const interestAmount = principal * (loan.rate / 100) / 12;
                if (isLend) {
                    loanInterest -= interestAmount; // 대여 이자: 유입이므로 이자지출에서 차감 (음수 지출)
                } else {
                    loanInterest += interestAmount; // 대출 이자: 지출로 가산
                }
            }
            
            // Repayment / Lend Outflow condition
            if (currentYM === loan.borrowDate) {
                if (isLend) {
                    loanRepayment += principal; // 대여: 발생 시점에 자금 대여(지출로 가산)
                }
            }
            if (currentYM === loan.repayDate) {
                if (!isLend) {
                    loanRepayment += principal; // 대출: 만기 시점에 상환(지출로 가산)
                }
            }
        });
        
        // 3. One-time Flows (Outflow portion, represented as positive outflow here, grows with inflation ONLY if applyInflation is checked)
        state.onetimeFlow.forEach(flow => {
            if (currentYM === flow.date && flow.amount < 0) {
                const factor = flow.applyInflation ? inflationFactor : 1;
                onetimeOutflow += Math.abs(flow.amount) * factor;
            }
        });
        
        const totalInflow = regMonthlyIncome + regAnnualIncome + loanInflow + onetimeInflow;
        const totalOutflow = regMonthlyExpense + loanInterest + loanRepayment + onetimeOutflow;
        const netCashFlow = totalInflow - totalOutflow;
        const investmentReturn = startingBalance * monthlyCompoundingRate;
        currentBalance = startingBalance + investmentReturn + netCashFlow;
        
        const discountFactor = state.useRealValue ? inflationFactor : 1;
        
        monthlyDetails.push({
            monthIndex: m,
            ym: currentYM,
            year: currentYear,
            month: currentMonth,
            age: exactAge,
            startingBalance: startingBalance / discountFactor,
            regMonthlyIncome: regMonthlyIncome / discountFactor,
            regAnnualIncome: regAnnualIncome / discountFactor,
            loanInflow: loanInflow / discountFactor,
            onetimeInflow: onetimeInflow / discountFactor,
            regMonthlyExpense: regMonthlyExpense / discountFactor,
            loanInterest: loanInterest / discountFactor,
            loanRepayment: loanRepayment / discountFactor,
            onetimeOutflow: onetimeOutflow / discountFactor,
            totalInflow: totalInflow / discountFactor,
            totalOutflow: totalOutflow / discountFactor,
            netCashFlow: netCashFlow / discountFactor,
            investmentReturn: investmentReturn / discountFactor,
            endingBalance: currentBalance / discountFactor
        });
    }
    
    // Aggregate to Annual Results
    let annualMap = {};
    monthlyDetails.forEach(mDetail => {
        const yr = mDetail.year;
        if (!annualMap[yr]) {
            annualMap[yr] = {
                year: yr,
                endAge: 0,
                startingBalance: mDetail.startingBalance,
                endingBalance: 0,
                regMonthlyIncome: 0,
                regAnnualIncome: 0,
                loanInflow: 0,
                onetimeInflow: 0,
                regMonthlyExpense: 0,
                loanInterest: 0,
                loanRepayment: 0,
                onetimeOutflow: 0,
                totalInflow: 0,
                totalOutflow: 0,
                netCashFlow: 0,
                investmentReturn: 0,
                monthsCount: 0
            };
        }
        
        const yrData = annualMap[yr];
        yrData.endAge = Math.floor(mDetail.age);
        yrData.regMonthlyIncome += mDetail.regMonthlyIncome;
        yrData.regAnnualIncome += mDetail.regAnnualIncome;
        yrData.loanInflow += mDetail.loanInflow;
        yrData.onetimeInflow += mDetail.onetimeInflow;
        yrData.regMonthlyExpense += mDetail.regMonthlyExpense;
        yrData.loanInterest += mDetail.loanInterest;
        yrData.loanRepayment += mDetail.loanRepayment;
        yrData.onetimeOutflow += mDetail.onetimeOutflow;
        yrData.totalInflow += mDetail.totalInflow;
        yrData.totalOutflow += mDetail.totalOutflow;
        yrData.netCashFlow += mDetail.netCashFlow;
        yrData.investmentReturn += mDetail.investmentReturn;
        yrData.endingBalance = mDetail.endingBalance;
        yrData.monthsCount++;
    });
    
    const annualResults = Object.values(annualMap);
    for (let i = 0; i < annualResults.length; i++) {
        if (i === 0) {
            annualResults[i].startingBalance = monthlyDetails[0].startingBalance;
        } else {
            annualResults[i].startingBalance = annualResults[i-1].endingBalance;
        }
    }
    
    // Calculate summary metrics
    const lastYear = annualResults[annualResults.length - 1];
    const endingAssets = lastYear.endingBalance;
    
    let peakAssets = 0;
    let peakYear = 0;
    let peakAge = 0;
    annualResults.forEach(yr => {
        if (yr.endingBalance > peakAssets) {
            peakAssets = yr.endingBalance;
            peakYear = yr.year;
            peakAge = yr.endAge;
        }
    });
    
    let totalReturnSum = 0;
    annualResults.forEach(yr => {
        totalReturnSum += yr.investmentReturn;
    });
    
    let totalNetSavings = 0;
    annualResults.forEach(yr => {
        totalNetSavings += yr.netCashFlow;
    });
    
    return {
        annualResults,
        metrics: {
            endingAssets,
            peakAssets,
            peakYear,
            peakAge,
            totalReturnSum,
            totalNetSavings
        }
    };
}

function runSimulation() {
    syncInputsToState();
    
    const sim = simulateScenario(currentState);
    simulationResults = sim.annualResults;
    
    updateSummaryMetrics(sim.metrics);
    renderTable();
    renderActiveCashflowChart();
    
    // Render the active scenario's asset projection line chart in editor view
    renderComparisonChart([{
        name: activeScenarioName || "현재 시나리오",
        results: simulationResults,
        metrics: sim.metrics,
        state: currentState
    }]);
    
    // Auto-save edited state to localStorage in real-time
    if (activeScenarioName) {
        let presets = JSON.parse(localStorage.getItem('mbot_life_presets') || '{}');
        presets[activeScenarioName] = JSON.parse(JSON.stringify(currentState));
        localStorage.setItem('mbot_life_presets', JSON.stringify(presets));
    }
}

// --- Initialize Default Presets ---
function initializeDefaultPresets() {
    const CURRENT_VERSION = 'v4_empty_no_samples';
    const version = localStorage.getItem('mbot_life_presets_version');
    
    if (version !== CURRENT_VERSION) {
        localStorage.removeItem('mbot_life_presets');
        localStorage.setItem('mbot_life_presets_version', CURRENT_VERSION);
    }
    
    let presets = JSON.parse(localStorage.getItem('mbot_life_presets') || '{}');
    if (Object.keys(presets).length === 0) {
        // 사용자의 요청에 따라 시작 시 주어지는 샘플 시나리오를 모두 제거했습니다.
        // 완전히 빈 화면에서 사용자가 직접 "+ 새 시나리오 생성"을 통해 시작하게 됩니다.
        localStorage.setItem('mbot_life_presets', JSON.stringify(presets));
    }
}

// --- Update Summary Dashboard Metrics ---

function updateSummaryMetrics(metrics) {
    const initialInvestment = currentState.initialInvestment;
    
    // 1. Ending Asset
    const endingAssets = metrics.endingAssets;
    const endingAssetsElem = document.getElementById('metric-ending-assets');
    endingAssetsElem.textContent = formatKRW(endingAssets);
    if (endingAssets < 0) {
        endingAssetsElem.classList.add('trend-negative');
    } else {
        endingAssetsElem.classList.remove('trend-negative');
    }
    
    // Growth Trend
    const growthPercent = ((endingAssets - initialInvestment) / initialInvestment * 100).toFixed(0);
    const endingGrowthElem = document.getElementById('metric-ending-growth');
    endingGrowthElem.textContent = `원금 대비 ${growthPercent >= 0 ? '+' : ''}${growthPercent}%`;
    endingGrowthElem.className = `metric-trend ${growthPercent >= 0 ? 'trend-positive' : 'trend-negative'}`;
    
    // 2. Peak Assets
    document.getElementById('metric-peak-assets').textContent = formatKRW(metrics.peakAssets);
    document.getElementById('metric-peak-age').textContent = `${metrics.peakYear}년 (만 ${metrics.peakAge}세)`;
    
    // 3. Total Investment Return
    const totalReturnElem = document.getElementById('metric-total-returns');
    totalReturnElem.textContent = formatKRW(metrics.totalReturnSum);
    
    const returnShare = endingAssets > 0 ? ((metrics.totalReturnSum / endingAssets) * 100).toFixed(0) : 0;
    document.getElementById('metric-return-share').textContent = `최종 자산의 ${returnShare}% 기여`;
    
    // 4. Net Savings (Cumulative Net Cash Flows)
    const netSavingsElem = document.getElementById('metric-net-savings');
    netSavingsElem.textContent = formatKRW(metrics.totalNetSavings);
    if (metrics.totalNetSavings < 0) {
        netSavingsElem.classList.add('trend-negative');
        document.getElementById('metric-savings-status').textContent = "누적 자본 순 유출";
        document.getElementById('metric-savings-status').className = "metric-trend trend-negative";
    } else {
        netSavingsElem.classList.remove('trend-negative');
        document.getElementById('metric-savings-status').textContent = "누적 자본 순 유입";
        document.getElementById('metric-savings-status').className = "metric-trend trend-positive";
    }
}

// --- Render Table ---

function renderTable() {
    const tbody = document.querySelector('#simulation-table tbody');
    tbody.innerHTML = '';
    
    // Update table headers based on inflation option
    const tableHeaders = document.querySelectorAll('#simulation-table th');
    if (tableHeaders.length >= 11) {
        if (currentState.useRealValue) {
            const realRate = (currentState.annualRate - currentState.inflationRate).toFixed(1);
            tableHeaders[9].textContent = `실질 투자 수익 (${realRate}%)`;
            tableHeaders[10].textContent = `기말 평가자산 (현재가치)`;
        } else {
            tableHeaders[9].textContent = `명목 투자 수익 (${currentState.annualRate}%)`;
            tableHeaders[10].textContent = `기말 평가자산 (명목가치)`;
        }
    }
    
    simulationResults.forEach(yr => {
        const row = document.createElement('tr');
        
        const netLoans = yr.loanInflow - yr.loanRepayment;
        const netOnetime = yr.onetimeInflow - yr.onetimeOutflow;
        const regIncome = yr.regMonthlyIncome + yr.regAnnualIncome;
        
        row.innerHTML = `
            <td>${yr.year}년</td>
            <td>만 ${yr.endAge}세</td>
            <td>${formatNumber(yr.startingBalance)}</td>
            <td class="val-positive">+${formatNumber(regIncome)}</td>
            <td class="val-negative">-${formatNumber(yr.regMonthlyExpense)}</td>
            <td class="${yr.loanInterest > 0 ? 'val-negative' : (yr.loanInterest < 0 ? 'val-positive' : 'val-zero')}">${yr.loanInterest > 0 ? '-' + formatNumber(yr.loanInterest) : (yr.loanInterest < 0 ? '+' + formatNumber(Math.abs(yr.loanInterest)) : '0원')}</td>
            <td class="${netLoans > 0 ? 'val-positive' : (netLoans < 0 ? 'val-negative' : 'val-zero')}">${netLoans > 0 ? '+' + formatNumber(netLoans) : (netLoans < 0 ? '-' + formatNumber(Math.abs(netLoans)) : '0원')}</td>
            <td class="${netOnetime > 0 ? 'val-positive' : (netOnetime < 0 ? 'val-negative' : 'val-zero')}">${netOnetime > 0 ? '+' : ''}${formatNumber(netOnetime)}</td>
            <td class="${yr.netCashFlow > 0 ? 'val-positive' : (yr.netCashFlow < 0 ? 'val-negative' : 'val-zero')}">${yr.netCashFlow > 0 ? '+' : ''}${formatNumber(yr.netCashFlow)}</td>
            <td class="val-positive">+${formatNumber(yr.investmentReturn)}</td>
            <td class="val-total-assets ${yr.endingBalance < 0 ? 'val-negative' : ''}">${formatNumber(yr.endingBalance)}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// --- Render Charts with ApexCharts ---

// Renders inflow vs outflow bar chart for currently edited scenario
function renderActiveCashflowChart() {
    const totalInflowData = simulationResults.map(yr => Math.round(yr.regMonthlyIncome + yr.regAnnualIncome + yr.loanInflow + yr.onetimeInflow));
    const totalOutflowData = simulationResults.map(yr => Math.round(yr.regMonthlyExpense + yr.loanInterest + yr.loanRepayment + yr.onetimeOutflow));
    
    const cashflowChartOptions = {
        series: [{
            name: '총 유입액',
            data: totalInflowData
        }, {
            name: '총 유출액',
            data: totalOutflowData
        }],
        chart: {
            type: 'bar',
            height: 350,
            foreColor: '#9ca3af',
            background: 'transparent',
            toolbar: { show: false }
        },
        colors: ['#10b981', '#f43f5e'],
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                endingShape: 'rounded'
            },
        },
        dataLabels: { enabled: false },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent']
        },
        xaxis: {
            categories: simulationResults.map(yr => `${yr.year}년`),
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: {
                formatter: function (value) {
                    return (value / 10000).toFixed(0) + ' 만';
                }
            }
        },
        grid: {
            borderColor: 'rgba(255, 255, 255, 0.05)',
            yaxis: { lines: { show: true } }
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right'
        },
        tooltip: {
            theme: 'dark',
            y: {
                formatter: function (value) {
                    return formatKRW(value);
                }
            }
        }
    };

    if (cashflowChart) {
        cashflowChart.updateOptions(cashflowChartOptions);
    } else {
        cashflowChart = new ApexCharts(document.querySelector("#cashflow-chart"), cashflowChartOptions);
        cashflowChart.render();
    }
}

// Renders the main line chart showing comparison of selected asset trajectories
function renderComparisonChart(comparisonData) {
    if (comparisonData.length === 0) {
        if (assetChart) assetChart.updateSeries([]);
        return;
    }
    
    // Find the scenario with the max length to construct categories
    let maxLength = 0;
    let longestResults = [];
    comparisonData.forEach(cd => {
        if (cd.results.length > maxLength) {
            maxLength = cd.results.length;
            longestResults = cd.results;
        }
    });
    
    const yearsLabels = longestResults.map(yr => `${yr.year}년 (만 ${yr.endAge}세)`);
    
    // Construct series data
    const series = comparisonData.map(cd => {
        return {
            name: cd.name,
            data: cd.results.map(yr => Math.round(yr.endingBalance))
        };
    });
    
    // Dynamic chart card title based on inflation settings
    const chartTitle = document.querySelector('.chart-card.large-chart h3');
    if (chartTitle) {
        chartTitle.textContent = currentState.useRealValue 
            ? `평가 자산 추이(현재가치기준, 물가반영 ${currentState.inflationRate}%)`
            : `평가 자산 추이(명목 가치 기준)`;
    }

    const assetChartOptions = {
        series: series,
        chart: {
            type: 'line',
            height: 350,
            foreColor: '#9ca3af',
            background: 'transparent',
            toolbar: { show: false },
            zoom: { enabled: false }
        },
        colors: ['#6366f1', '#10b981', '#f43f5e', '#8b5cf6', '#f59e0b', '#06b6d4'],
        dataLabels: { enabled: false },
        stroke: {
            curve: 'smooth',
            width: 3
        },
        xaxis: {
            categories: yearsLabels,
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: {
                formatter: function (value) {
                    return (value / 100000000).toFixed(1) + ' 억';
                }
            }
        },
        grid: {
            borderColor: 'rgba(255, 255, 255, 0.05)',
            yaxis: { lines: { show: true } },
            xaxis: { lines: { show: false } }
        },
        tooltip: {
            theme: 'dark',
            x: { show: true },
            y: {
                formatter: function (value) {
                    return formatKRW(value);
                }
            }
        },
        legend: {
            position: 'top',
            horizontalAlign: 'left'
        }
    };

    if (assetChart) {
        assetChart.updateOptions(assetChartOptions);
    } else {
        assetChart = new ApexCharts(document.querySelector("#assets-chart"), assetChartOptions);
        assetChart.render();
    }
}



// --- Excel/CSV Data Exporter ---

function exportToCSV() {
    if (simulationResults.length === 0) return;
    
    // Define dynamic headers
    const returnHeader = currentState.useRealValue 
        ? `실질 투자 수익 (${(currentState.annualRate - currentState.inflationRate).toFixed(1)}%)`
        : `명목 투자 수익 (${currentState.annualRate}%)`;
    const endingHeader = currentState.useRealValue 
        ? "기말 평가자산 (현재가치)"
        : "기말 평가자산 (명목가치)";
        
    let csvContent = "\ufeff"; // UTF-8 BOM for Excel compatibility in Korean
    csvContent += `연도,나이,기초 평가자산,정기 수입 (월+연),정기 지출 (월),대출 이자,대출 원금 (유입/상환),일회성 흐름,순현금흐름,${returnHeader},${endingHeader}\n`;
    
    simulationResults.forEach(yr => {
        const regIncome = yr.regMonthlyIncome + yr.regAnnualIncome;
        const netLoans = yr.loanInflow - yr.loanRepayment;
        const netOnetime = yr.onetimeInflow - yr.onetimeOutflow;
        
        csvContent += `${yr.year}년,` +
                      `만 ${yr.endAge}세,` +
                      `"${Math.round(yr.startingBalance)}",` +
                      `"${Math.round(regIncome)}",` +
                      `"${Math.round(yr.regMonthlyExpense)}",` +
                      `"${Math.round(yr.loanInterest)}",` +
                      `"${Math.round(netLoans)}",` +
                      `"${Math.round(netOnetime)}",` +
                      `"${Math.round(yr.netCashFlow)}",` +
                      `"${Math.round(yr.investmentReturn)}",` +
                      `"${Math.round(yr.endingBalance)}"\n`;
    });
    
    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `투자_Life_시뮬레이션_결과_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- App Initialization ---
window.addEventListener('DOMContentLoaded', () => {
    // Initialize default presets if local storage is empty
    initializeDefaultPresets();
    
    // Fill scenario grid on the landing view
    renderLandingView();
    
    // Listen to Enter/FocusOut on basic inputs to refresh
    const inputs = ['initial-investment', 'annual-rate', 'inflation-rate', 'use-real-value', 'simulation-period', 'birth-year-month', 'start-year-month'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener('change', () => {
            runSimulation();
        });
    });
});
