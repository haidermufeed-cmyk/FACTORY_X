# FACTORY-X | Intelligent Industrial Factory Simulator

An interactive industrial factory simulation platform featuring real-time production monitoring, a 3D factory digital twin, machine fault simulation, and a Python-powered intelligence engine for production analysis.

FACTORY-X demonstrates how simulation, industrial monitoring, and data-driven analysis can work together to improve factory operations.

## Overview

FACTORY-X is a software-based industrial simulation project designed to model factory production workflows and monitor machine performance.

It combines a JavaScript-based simulation dashboard with a Python Flask intelligence engine to analyze production data, identify bottlenecks, monitor machine health, and generate production reports.

## Key Features

### 1. Factory Simulation
- Interactive 2D factory environment.
- Production workflow visualization.
- Conveyor belt and machine-stage simulation.
- Live production monitoring.

### 2. 3D Factory Digital Twin
- Interactive 3D factory visualization using Three.js.
- 3D representation of factory equipment and production areas.
- Visual monitoring of the simulated factory environment.

### 3. Machine Monitoring
- Machine performance monitoring.
- Machine fault simulation.
- Fault detection and recovery workflows.
- Machine health analysis.

### 4. Production Analytics
- Production performance analysis.
- Quality and production yield monitoring.
- Machine availability analysis.
- Production-stage comparison.

### 5. Python Intelligence Engine
The Python Flask backend provides analytical capabilities:

- Production analysis.
- Machine health evaluation.
- Automated bottleneck detection.
- Performance recommendations.
- Production report generation.

### 6. Bottleneck Detection
FACTORY-X analyzes production-stage processing times to identify slower stages.

It evaluates performance differences and classifies bottlenecks into severity levels:
- Normal
- Warning
- Critical

The system also provides recommendations to help improve production flow.

## Technology Stack

| Technology | Purpose |
|---|---|
| Python | Intelligence and analytics engine |
| Flask | Backend API |
| JavaScript | Simulation logic and dashboard |
| HTML5 | Dashboard structure |
| CSS3 | Dashboard styling |
| Three.js | 3D factory visualization |
| Git & GitHub | Version control |

## System Architecture

FACTORY-X uses a hybrid architecture.

**Frontend — JavaScript**
- Factory simulation.
- Dashboard interface.
- 2D and 3D visualization.
- User interactions and simulation controls.

**Backend — Python**
- Production analysis.
- Machine health evaluation.
- Bottleneck detection.
- Report generation.

**Communication**

The frontend communicates with the Python Flask backend through HTTP API requests.

## Project Structure

```text
FACTORY_X/
│
├── backend/
│   ├── app.py
│   ├── bottleneck_detector.py
│   ├── machine_health.py
│   ├── production_analyzer.py
│   └── report_generator.py
│
├── css/
│   └── style.css
│
├── js/
│   ├── app.js
│   └── factory3d.js
│
├── index.html
├── .gitignore
└── README.md
```

## Installation and Setup

### Requirements
- Python 3.10 or later
- Visual Studio Code
- A modern web browser

### 1. Clone the repository

```bash
git clone https://github.com/haidermufeed-cmyk/FACTORY_X.git
```

### 2. Open the project folder

```bash
cd FACTORY_X
```

### 3. Create a virtual environment

```bash
python -m venv venv
```

### 4. Activate the environment

**Windows PowerShell:**

```powershell
.\venv\Scripts\Activate.ps1
```

### 5. Install backend dependencies

```bash
pip install flask flask-cors
```

### 6. Start the Python backend

From the project root:

```bash
python backend/app.py
```

The backend runs locally at:

```text
http://127.0.0.1:5000
```

### 7. Launch the dashboard

Open `index.html` using the VS Code Live Server extension or another local web server.

Keep the Python backend running while using the dashboard.

## Python API

The backend provides the following analytical endpoints:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/status` | GET | Backend status |
| `/api/production-analysis` | POST | Production analysis |
| `/api/machine-health` | POST | Machine health evaluation |
| `/api/bottleneck` | POST | Bottleneck analysis |
| `/api/generate-report` | POST | Production report generation |

Base URL:

```text
http://127.0.0.1:5000
```

## Project Objectives

- Demonstrate industrial production workflows through simulation.
- Visualize factory operations using 2D and 3D environments.
- Monitor machine performance and simulated faults.
- Apply Python-based analytics to production data.
- Identify production bottlenecks.
- Generate reports to support operational decision-making.

## Future Improvements

- Advanced predictive maintenance.
- More detailed production optimization.
- Additional machine-performance metrics.
- Enhanced digital twin capabilities.
- Historical production data visualization.

## Author

**Haider Mufeed**

GitHub: [haidermufeed-cmyk](https://github.com/haidermufeed-cmyk)

Project: [FACTORY-X](https://github.com/haidermufeed-cmyk/FACTORY_X)

---

*FACTORY-X — Intelligent Industrial Factory Simulation and Analytics Platform.*