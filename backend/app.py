
from flask import Flask, jsonify, request
from flask_cors import CORS

from production_analyzer import analyze_production
from machine_health import analyze_machine_health
from bottleneck_detector import detect_bottleneck
from report_generator import generate_report

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return jsonify({
        "project": "FACTORY-X",
        "backend": "Python Flask",
        "status": "online"
    })


@app.route("/api/status")
def status():
    return jsonify({
        "status": "running",
        "message": "FACTORY-X Python Intelligence Engine is ready"
    })


@app.route("/api/production-analysis", methods=["POST"])
def production_analysis():
    data = request.get_json(silent=True) or {}

    try:
        return jsonify(analyze_production(data))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid production data"}), 400


@app.route("/api/machine-health", methods=["POST"])
def machine_health():
    data = request.get_json(silent=True) or {}

    try:
        return jsonify(analyze_machine_health(data))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid machine data"}), 400


@app.route("/api/bottleneck", methods=["POST"])
def bottleneck():
    data = request.get_json(silent=True) or {}

    try:
        return jsonify(detect_bottleneck(data))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid stage data"}), 400


@app.route("/api/generate-report", methods=["POST"])
def generate_production_report():
    data = request.get_json(silent=True) or {}

    try:
        return jsonify(generate_report(data))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid report data"}), 400


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
