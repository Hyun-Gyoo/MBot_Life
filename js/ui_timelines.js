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
            <div style="margin-bottom: 8px;">
                <input type="text" value="${item.label || ''}" placeholder="설명 (이름)" onchange="updateMonthlyIncome(${index}, 'label', this.value); runSimulation();" style="width: 100%; text-align: left; font-size: 15px; font-weight: bold; height: 38px; box-sizing: border-box; background: transparent; border: none; border-bottom: 1px solid var(--border-color); border-radius: 0; padding: 4px 0; color: white;">
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <input type="month" value="${item.start}" onchange="updateMonthlyIncome(${index}, 'start', this.value); runSimulation();" style="flex: 1; height: 38px; box-sizing: border-box;">
                <span style="color: var(--text-muted); font-weight: bold;">→</span>
                <input type="month" value="${item.end}" onchange="updateMonthlyIncome(${index}, 'end', this.value); runSimulation();" style="flex: 1; height: 38px; box-sizing: border-box;">
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                <input type="text" inputmode="numeric" value="${Number(item.amount).toLocaleString()}" placeholder="월수입 (원)" oninput="formatInputWithComma(this)" onchange="updateMonthlyIncome(${index}, 'amount', this.value); runSimulation();" style="flex: 1; text-align:right; height: 38px; box-sizing: border-box;">
                <div style="display: flex; gap: 6px;">
                    <button class="btn btn-secondary" onclick="openAddItemModal('monthlyIncome', ${index})" style="height: 38px; padding: 0 16px; margin: 0; box-sizing: border-box;">수정</button>
                    <button class="btn btn-secondary btn-delete" onclick="deleteMonthlyIncome(${index})" style="height: 38px; padding: 0 16px; margin: 0; box-sizing: border-box; width: auto; display: flex; align-items: center; justify-content: center;">삭제</button>
                </div>
            </div>
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
            <div style="margin-bottom: 8px;">
                <input type="text" value="${item.label || ''}" placeholder="설명 (이름)" onchange="updateAnnualIncome(${index}, 'label', this.value); runSimulation();" style="width: 100%; text-align: left; font-size: 15px; font-weight: bold; height: 38px; box-sizing: border-box; background: transparent; border: none; border-bottom: 1px solid var(--border-color); border-radius: 0; padding: 4px 0; color: white;">
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <input type="number" value="${item.startYear}" placeholder="시작연도" onchange="updateAnnualIncome(${index}, 'startYear', this.value); runSimulation();" style="flex: 1; height: 38px; box-sizing: border-box;">
                <span style="color: var(--text-muted); font-weight: bold;">→</span>
                <input type="number" value="${item.endYear}" placeholder="종료연도" onchange="updateAnnualIncome(${index}, 'endYear', this.value); runSimulation();" style="flex: 1; height: 38px; box-sizing: border-box;">
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                <input type="text" inputmode="numeric" value="${Number(item.amount).toLocaleString()}" placeholder="연수입 (원)" oninput="formatInputWithComma(this)" onchange="updateAnnualIncome(${index}, 'amount', this.value); runSimulation();" style="flex: 1; text-align:right; height: 38px; box-sizing: border-box;">
                <div style="display: flex; gap: 6px;">
                    <button class="btn btn-secondary" onclick="openAddItemModal('annualIncome', ${index})" style="height: 38px; padding: 0 16px; margin: 0; box-sizing: border-box;">수정</button>
                    <button class="btn btn-secondary btn-delete" onclick="deleteAnnualIncome(${index})" style="height: 38px; padding: 0 16px; margin: 0; box-sizing: border-box; width: auto; display: flex; align-items: center; justify-content: center;">삭제</button>
                </div>
            </div>
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
            <div style="margin-bottom: 8px;">
                <input type="text" value="${item.label || ''}" placeholder="설명 (이름)" onchange="updateMonthlyExpense(${index}, 'label', this.value); runSimulation();" style="width: 100%; text-align: left; font-size: 15px; font-weight: bold; height: 38px; box-sizing: border-box; background: transparent; border: none; border-bottom: 1px solid var(--border-color); border-radius: 0; padding: 4px 0; color: white;">
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <input type="month" value="${item.start}" onchange="updateMonthlyExpense(${index}, 'start', this.value); runSimulation();" style="flex: 1; height: 38px; box-sizing: border-box;">
                <span style="color: var(--text-muted); font-weight: bold;">→</span>
                <input type="month" value="${item.end}" onchange="updateMonthlyExpense(${index}, 'end', this.value); runSimulation();" style="flex: 1; height: 38px; box-sizing: border-box;">
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                <input type="text" inputmode="numeric" value="${Number(item.amount).toLocaleString()}" placeholder="월지출 (원)" oninput="formatInputWithComma(this)" onchange="updateMonthlyExpense(${index}, 'amount', this.value); runSimulation();" style="flex: 1; text-align:right; height: 38px; box-sizing: border-box;">
                <div style="display: flex; gap: 6px;">
                    <button class="btn btn-secondary" onclick="openAddItemModal('monthlyExpense', ${index})" style="height: 38px; padding: 0 16px; margin: 0; box-sizing: border-box;">수정</button>
                    <button class="btn btn-secondary btn-delete" onclick="deleteMonthlyExpense(${index})" style="height: 38px; padding: 0 16px; margin: 0; box-sizing: border-box; width: auto; display: flex; align-items: center; justify-content: center;">삭제</button>
                </div>
            </div>
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
            <div style="margin-bottom: 8px;">
                <input type="text" value="${item.name || ''}" placeholder="설명 (이름)" onchange="updateLoan(${index}, 'name', this.value); runSimulation();" style="width: 100%; text-align: left; font-size: 15px; font-weight: bold; height: 38px; box-sizing: border-box;">
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <input type="month" value="${item.borrowDate}" onchange="updateLoan(${index}, 'borrowDate', this.value); runSimulation();" style="flex: 1; height: 38px; box-sizing: border-box;">
                <span style="color: var(--text-muted); font-weight: bold;">→</span>
                <input type="month" value="${item.repayDate}" onchange="updateLoan(${index}, 'repayDate', this.value); runSimulation();" style="flex: 1; height: 38px; box-sizing: border-box;">
            </div>
            <div class="timeline-row-inputs" style="margin-bottom: 8px;">
                <select onchange="updateLoan(${index}, 'type', this.value); renderLoans(); runSimulation();" style="background: rgba(0,0,0,0.3); color: white; border: 1px solid var(--border-color); border-radius: 4px; padding: 8px 10px; font-size:14px; width: 100%; height: 38px; box-sizing: border-box; appearance: none; -webkit-appearance: none; text-align: center;">
                    <option value="borrow" ${!isLend ? 'selected' : ''}>대출 (자금 차입)</option>
                    <option value="lend" ${isLend ? 'selected' : ''}>대여 (자금 대여)</option>
                </select>
                <input type="text" inputmode="numeric" value="${Number(item.amount).toLocaleString()}" placeholder="금액 (원)" oninput="formatInputWithComma(this)" onchange="updateLoan(${index}, 'amount', this.value); runSimulation();" style="text-align:right; height: 38px; box-sizing: border-box;">
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 6px; flex: 1;">
                    <input type="number" step="0.1" value="${item.rate}" onchange="updateLoan(${index}, 'rate', this.value); runSimulation();" style="width: 80px; height: 38px; box-sizing: border-box; text-align: right;">
                    <span style="color: var(--text-secondary); font-weight: 500;">%</span>
                </div>
                <div style="display: flex; gap: 6px;">
                    <button class="btn btn-secondary" onclick="openAddItemModal('loan', ${index})" style="height: 38px; padding: 0 16px; margin: 0; box-sizing: border-box;">수정</button>
                    <button class="btn btn-secondary btn-delete" onclick="deleteLoan(${index})" style="height: 38px; padding: 0 16px; margin: 0; box-sizing: border-box; width: auto; display: flex; align-items: center; justify-content: center;">삭제</button>
                </div>
            </div>
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
            <div style="margin-bottom: 8px;">
                <input type="text" value="${item.description || ''}" placeholder="설명 (이름)" onchange="updateOnetimeFlow(${index}, 'description', this.value); runSimulation();" style="width: 100%; text-align: left; font-size: 15px; font-weight: bold; height: 38px; box-sizing: border-box; background: transparent; border: none; border-bottom: 1px solid var(--border-color); border-radius: 0; padding: 4px 0; color: white;">
            </div>
            <div style="margin-bottom: 8px;">
                <input type="month" value="${item.date}" onchange="updateOnetimeFlow(${index}, 'date', this.value); runSimulation();" style="width: 100%; height: 38px; box-sizing: border-box;">
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                <input type="text" inputmode="numeric" value="${Number(item.amount).toLocaleString()}" placeholder="금액 (원)" oninput="formatInputWithComma(this)" onchange="updateOnetimeFlow(${index}, 'amount', this.value); runSimulation();" style="flex: 1; text-align:right; height: 38px; box-sizing: border-box;">
                <div style="display: flex; gap: 6px;">
                    <button class="btn btn-secondary" onclick="openAddItemModal('onetimeFlow', ${index})" style="height: 38px; padding: 0 16px; margin: 0; box-sizing: border-box;">수정</button>
                    <button class="btn btn-secondary btn-delete" onclick="deleteOnetimeFlow(${index})" style="height: 38px; padding: 0 16px; margin: 0; box-sizing: border-box; width: auto; display: flex; align-items: center; justify-content: center;">삭제</button>
                </div>
            </div>
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
