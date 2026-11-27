
def detect_bottleneck(data):
    stages = data.get("stages", {})

    if not stages:
        return {
            "bottleneck": None,
            "severity": "Awaiting Data",
            "message": "No production stage data available",
            "recommendation": "Run the factory simulation to collect production data."
        }

    try:
        processing_times = {
            stage: float(time)
            for stage, time in stages.items()
        }

        if not processing_times:
            raise ValueError

        if any(
            not isinstance(time, (int, float)) or
            not float("-inf") < time < float("inf") or
            time < 0
            for time in processing_times.values()
        ):
            raise ValueError

        bottleneck = max(
            processing_times,
            key=processing_times.get
        )

        bottleneck_time = processing_times[bottleneck]

        average_time = (
            sum(processing_times.values()) /
            len(processing_times)
        )

        difference = (
            ((bottleneck_time - average_time) / average_time) * 100
            if average_time > 0 else 0
        )

        if difference >= 50:
            severity = "Critical"
            recommendation = (
                f"{bottleneck} is taking significantly longer than "
                "the average stage. Investigate workflow delays, "
                "task distribution and machine performance."
            )

        elif difference >= 25:
            severity = "Warning"
            recommendation = (
                f"Review {bottleneck} operations and investigate "
                "possible workflow inefficiencies."
            )

        else:
            severity = "Normal"
            recommendation = (
                f"{bottleneck} is currently the slowest stage, "
                "but no significant delay has been detected. "
                "Continue monitoring production."
            )

        stage_comparison = {
            stage: {
                "processing_time": round(time, 2),
                "difference_from_average": round(
                    ((time - average_time) / average_time) * 100,
                    2
                ) if average_time > 0 else 0
            }
            for stage, time in processing_times.items()
        }

        return {
            "bottleneck": bottleneck,
            "processing_time": round(bottleneck_time, 2),
            "average_stage_time": round(average_time, 2),
            "difference_from_average": round(difference, 2),
            "severity": severity,
            "all_stages": stage_comparison,
            "message": f"{bottleneck} is the slowest production stage",
            "recommendation": recommendation
        }

    except (ValueError, TypeError, OverflowError):
        raise ValueError("Invalid production stage data")
