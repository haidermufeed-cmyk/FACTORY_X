
def analyze_machine_health(data):
    uptime = float(data.get("uptime_seconds", 0))
    downtime = float(data.get("downtime_seconds", 0))

    total_time = uptime + downtime

    availability = (
        uptime / total_time * 100
        if total_time > 0
        else 0
    )

    return {
        "uptime_seconds": round(uptime, 2),
        "downtime_seconds": round(downtime, 2),
        "availability": round(availability, 2),
        "health_status": (
            "Operational" if availability >= 90
            else "Needs Attention" if availability >= 70
            else "Critical"
        )
    }
