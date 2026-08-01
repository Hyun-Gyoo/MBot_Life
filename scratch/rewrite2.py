import os

def run():
    base_dir = r"c:\Users\jackm\MBot_Life"
    
    # 2. Update ui_charts.js
    ui_charts_path = os.path.join(base_dir, "js", "ui_charts.js")
    with open(ui_charts_path, "r", encoding="utf-8") as f:
        content = f.read()

    new_render_table = """function renderTable() {
    const tbody = document.querySelector('#simulation-table tbody');
    tbody.innerHTML = '';
    
    if (typeof generateDetailedLogs !== 'function') return;
    
    const logs = generateDetailedLogs(currentState);
    
    // Populate year filter
    const yearFilter = document.getElementById('table-year-filter');
    const selectedYear = yearFilter.value;
    
    // Get unique years
    const years = [...new Set(logs.map(log => log.year))];
    
    // Rebuild options if needed
    if (yearFilter.options.length <= 1 || yearFilter.options.length !== years.length + 1) {
        const currentVal = yearFilter.value;
        yearFilter.innerHTML = '<option value="all">전체 연도</option>';
        years.forEach(yr => {
            const opt = document.createElement('option');
            opt.value = yr;
            opt.textContent = `${yr}년`;
            yearFilter.appendChild(opt);
        });
        yearFilter.value = currentVal;
    }
    
    // Filter logs
    let filteredLogs = logs;
    if (selectedYear !== 'all') {
        const targetYear = parseInt(selectedYear, 10);
        filteredLogs = logs.filter(log => log.year === targetYear);
    }
    
    filteredLogs.forEach(log => {
        const row = document.createElement('tr');
        
        let amountClass = 'val-zero';
        if (log.amount > 0) amountClass = 'val-positive';
        else if (log.amount < 0) amountClass = 'val-negative';
        
        row.innerHTML = `
            <td>${log.date}</td>
            <td>만 ${log.age}세</td>
            <td>${log.type}</td>
            <td>${log.name}</td>
            <td class="${amountClass}">${log.amount > 0 ? '+' : ''}${formatNumber(log.amount)}</td>
            <td class="val-total-assets ${log.balance < 0 ? 'val-negative' : ''}">${formatNumber(log.balance)}</td>
        `;
        
        tbody.appendChild(row);
    });
}"""

    import re
    # Replace function renderTable() { ... }
    new_content = re.sub(r'function renderTable\(\) \{.*?\n\}\n', new_render_table + '\n', content, flags=re.DOTALL)
    
    with open(ui_charts_path, "w", encoding="utf-8") as f:
        f.write(new_content)
        
    print("Done writing ui_charts.js")

if __name__ == "__main__":
    run()
