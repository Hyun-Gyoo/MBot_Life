import re

def fix_onclicks():
    file_path = r'c:\Users\jackm\MBot_Life\js\ui_timelines.js'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    content = re.sub(
        r'<button class="btn btn-secondary" onclick="runSimulation\(\)" style="([^"]+)">수정</button>',
        lambda m: f'<button class="btn btn-secondary" onclick="openAddItemModal(\'monthlyIncome\', ${{index}})" style="{m.group(1)}">수정</button>' if 'updateMonthlyIncome' in content[:m.start()] and 'updateAnnualIncome' not in content[m.start()-500:m.start()] else m.group(0),
        content
    )

    # We need a more robust way to distinguish.
    # Actually we can just find them in the functions.
    funcs = [
        ('renderMonthlyIncome', 'monthlyIncome'),
        ('renderAnnualIncome', 'annualIncome'),
        ('renderMonthlyExpense', 'monthlyExpense'),
        ('renderLoans', 'loan')
    ]
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    for func, type_name in funcs:
        start = content.find(f'function {func}()')
        if start == -1: continue
        end = content.find('function', start + 10)
        if end == -1: end = len(content)
        
        block = content[start:end]
        
        if func == 'renderLoans':
            block = block.replace('<button class="btn btn-secondary" onclick="runSimulation()">수정</button>',
                                  f'<button class="btn btn-secondary" onclick="openAddItemModal(\'{type_name}\', ${{index}})">수정</button>')
        else:
            block = re.sub(r'<button class="btn btn-secondary" onclick="runSimulation\(\)" style="([^"]+)">수정</button>',
                           f'<button class="btn btn-secondary" onclick="openAddItemModal(\'{type_name}\', ${{index}})" style="\\1">수정</button>',
                           block)
        content = content[:start] + block + content[end:]

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

fix_onclicks()
