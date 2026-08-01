import math

def simulate_loan(amount, rate_pct, borrow_date, repay_date, is_deferred, deferred_type):
    months = 12
    monthly_rate = (rate_pct / 100) / 12
    
    monthly_interests = []
    
    for m in range(1, months + 1):
        is_repay = (m == 12)
        
        if is_deferred:
            if is_repay:
                if deferred_type == 'compound':
                    tot_interest = amount * ((1 + monthly_rate)**months - 1)
                else:
                    tot_interest = amount * monthly_rate * months
                monthly_interests.append((m, tot_interest))
            else:
                monthly_interests.append((m, 0))
        else:
            interest_amt = amount * monthly_rate
            monthly_interests.append((m, interest_amt))
            
    return monthly_interests

print("=== 1. Regular Monthly ===")
res1 = simulate_loan(100_000_000, 12.0, "2026-01", "2027-01", False, 'simple')
for m, amt in res1:
    print(f"Month {m}: {amt:,.0f} KRW")

print("\n=== 2. Deferred Simple ===")
res2 = simulate_loan(100_000_000, 12.0, "2026-01", "2027-01", True, 'simple')
for m, amt in res2:
    print(f"Month {m}: {amt:,.0f} KRW")

print("\n=== 3. Deferred Compound ===")
res3 = simulate_loan(100_000_000, 12.0, "2026-01", "2027-01", True, 'compound')
for m, amt in res3:
    print(f"Month {m}: {amt:,.0f} KRW")
