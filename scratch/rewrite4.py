import os
import re

def run():
    base_dir = r"c:\Users\jackm\MBot_Life"
    
    # 1. Update export.js
    export_js_path = os.path.join(base_dir, "js", "export.js")
    with open(export_js_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace header string
    content = content.replace(
        'csvContent += "발생년월,나이,구분,항목명,금액,금액(물가반영),평가자산,평가자산(물가반영)\\n";',
        'csvContent += "발생년월,나이,구분,항목명,금액,평가자산,금액(물가반영),평가자산(물가반영)\\n";'
    )
    
    # Replace initial investment row
    content = content.replace(
        'csvContent += `${currentState.startDate},${Math.floor(Number(currentState.startDate.split(\'-\')[0]) - Number(currentState.birthDate.split(\'-\')[0]))},초기자본,투자원금,${Math.round(currentState.initialInvestment)},${Math.round(currentState.initialInvestment)},${Math.round(currentState.initialInvestment)},${Math.round(currentState.initialInvestment)}\\n`;',
        'csvContent += `${currentState.startDate},${Math.floor(Number(currentState.startDate.split(\'-\')[0]) - Number(currentState.birthDate.split(\'-\')[0]))},초기자본,투자원금,${Math.round(currentState.initialInvestment)},${Math.round(currentState.initialInvestment)},${Math.round(currentState.initialInvestment)},${Math.round(currentState.initialInvestment)}\\n`;'
    ) # actually this doesn't change since all values are the same
    
    # Replace log row
    content = content.replace(
        'csvContent += `${log.date},만 ${log.age}세,${log.type},"${log.name}",${Math.round(log.amountReal)},${Math.round(log.amount)},${Math.round(log.balanceReal)},${Math.round(log.balance)}\\n`;',
        'csvContent += `${log.date},만 ${log.age}세,${log.type},"${log.name}",${Math.round(log.amountReal)},${Math.round(log.balanceReal)},${Math.round(log.amount)},${Math.round(log.balance)}\\n`;'
    )
    
    with open(export_js_path, "w", encoding="utf-8") as f:
        f.write(content)
        
    # 2. Update ui_charts.js
    ui_charts_path = os.path.join(base_dir, "js", "ui_charts.js")
    with open(ui_charts_path, "r", encoding="utf-8") as f:
        content = f.read()

    new_tds = """            <td class="${amountRealClass}">${log.amountReal > 0 ? '+' : ''}${formatNumber(log.amountReal)}</td>
            <td class="val-total-assets ${log.balanceReal < 0 ? 'val-negative' : ''}">${formatNumber(log.balanceReal)}</td>
            <td class="${amountClass}">${log.amount > 0 ? '+' : ''}${formatNumber(log.amount)}</td>
            <td class="val-total-assets ${log.balance < 0 ? 'val-negative' : ''}">${formatNumber(log.balance)}</td>"""

    old_tds = """            <td class="${amountRealClass}">${log.amountReal > 0 ? '+' : ''}${formatNumber(log.amountReal)}</td>
            <td class="${amountClass}">${log.amount > 0 ? '+' : ''}${formatNumber(log.amount)}</td>
            <td class="val-total-assets ${log.balanceReal < 0 ? 'val-negative' : ''}">${formatNumber(log.balanceReal)}</td>
            <td class="val-total-assets ${log.balance < 0 ? 'val-negative' : ''}">${formatNumber(log.balance)}</td>"""
    
    content = content.replace(old_tds, new_tds)

    with open(ui_charts_path, "w", encoding="utf-8") as f:
        f.write(content)
        
    print("Done writing export.js and ui_charts.js")

if __name__ == "__main__":
    run()
