
from datetime import datetime

from production_analyzer import analyze_production
from machine_health import analyze_machine_health
from bottleneck_detector import detect_bottleneck


def generate_report(data):
    production_data = data.get("production", {})
    machine_data = data.get("machine", {})

    production = analyze_production(production_data)
    machine = analyze_machine_health(machine_data)

    # Pass the complete data so the detector can read "stages".
    bottleneck = detect_bottleneck(data)

    return {
        "project": "FACTORY-X",
        "report_generated": datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        ),
        "production_analysis": production,
        "machine_health": machine,
        "bottleneck_analysis": bottleneck,
        "overall_summary": {
            "total_units": production["total_delivered"],
            "quality_yield": production["quality_yield"],
            "machine_availability": machine["availability"],
            "slowest_stage": bottleneck["bottleneck"]
        }
    }
