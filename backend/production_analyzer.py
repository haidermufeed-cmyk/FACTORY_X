
def analyze_production(data):
    passed = int(data.get("passed_units", 0))
    rejected = int(data.get("rejected_units", 0))
    total = passed + rejected

    yield_rate = (passed / total * 100) if total else 0
    rejection_rate = (rejected / total * 100) if total else 0

    return {
        "passed_units": passed,
        "rejected_units": rejected,
        "total_delivered": total,
        "quality_yield": round(yield_rate, 2),
        "rejection_rate": round(rejection_rate, 2)
    }
