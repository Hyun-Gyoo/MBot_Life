import re

def refactor_ui_modals():
    file_path = r'c:\Users\jackm\MBot_Life\js\ui_modals.js'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find openAddItemModal
    start_open = content.find('function openAddItemModal(type) {')
    end_open = content.find('function submitModalItem(type) {')
    end_submit = content.find('function loadDefaultScenario() {')

    if start_open == -1 or end_open == -1 or end_submit == -1:
        print("Could not find boundaries")
        return

    new_open_and_submit = """let currentEditIndex = null;

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
        
        const data = {
            id: isEdit ? currentState.loans[currentEditIndex].id : "loan-" + Date.now(), 
            type: ltype, name, amount, rate, borrowDate, repayDate,
            applyInflation: document.getElementById('modal-loan-apply-inflation').checked
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
"""

    new_content = content[:start_open] + new_open_and_submit + content[end_submit:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully refactored ui_modals.js")

refactor_ui_modals()
