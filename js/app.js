
/*
  FACTORY-X
  app.js

  Industrial factory simulation controller.
  Python Intelligence Engine integration.
*/

const App = {
    running: false,
    lastFrame: 0,
    animationId: null,

    activeFault: false,
    activeFaults: {},
    faultHistory: [],
    alertCount: 0,

    canvas: null,
    ctx: null,
    elements: {},

    simulationSpeed: 1.5,

    pythonConnected: false,
    pythonAnalyzing: false,
    pythonApi: "http://127.0.0.1:5000",

    initialize() {
        this.canvas = document.getElementById("factoryCanvas");

        if (!this.canvas) {
            console.error("Factory canvas not found");
            return;
        }

        this.ctx = this.canvas.getContext("2d");

        this.findElements();
        this.connectButtons();

        Production.initializeMachineMetrics();

        if (typeof Analytics !== "undefined") {
            Analytics.initialize();
        }

        this.drawFactory();
        this.updateDashboard();
        this.updateClock();

        this.checkPythonEngine();

        setInterval(() => this.updateClock(), 1000);

        addEvent("FACTORY-X initialized");
        addEvent("Industrial factory environment loaded");
        addEvent("Autonomous robot fleet registered");
        addEvent("Production machines online");
        addEvent("Machine intelligence monitoring enabled");
        addEvent("Advanced fault simulation enabled");
        addEvent("Production analytics initialized");
        addEvent("Quality inspection system ready");
        addEvent("Conveyor network initialized");
        addEvent("Parallel production engine ready");

        console.log("FACTORY-X ready");
    },

    // =========================================
    // ELEMENT REFERENCES
    // =========================================

    findElements() {
        const ids = [
            "completedOrders",
            "completedUnits",
            "rejectedUnits",
            "activeRobots",
            "machineStatus",
            "activeAlerts",
            "queueCount",
            "orderList",
            "robotList",
            "machineList",
            "eventLog",
            "clock",
            "startBtn",
            "pauseBtn",
            "resetBtn",
            "createOrderBtn",
            "faultBtn",
            "recoverBtn",
            "faultMachineSelect",
            "faultTypeSelect",
            "faultDurationSelect",
            "faultStatus",
            "faultEventCount",
            "faultActiveCount",
            "faultRecoveredCount",
            "faultHistoryCount",
            "faultHistoryList",
            "inspectedUnits",
            "passRate",
            "rejectRate",
            "qualityProgressText",
            "qualityPassBar",
            "qualityRejectBar",
            "inspectionCount",
            "inspectionHistory",

            "pythonEngineStatus",
            "pythonAnalysisMessage",
            "pythonAnalysisBtn",
            "pythonQualityYield",
            "pythonRejectionRate",
            "pythonAvailability",
            "pythonHealthStatus",
            "pythonBottleneck",
            "pythonBottleneckTime",
            "pythonAnalysisTime",
            "pythonBottleneckMessage",
            "pythonBottleneckRecommendation",
            "pythonBottleneckSeverity",
            "pythonStageComparison"
        ];

        ids.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });
    },

    // =========================================
    // BUTTON CONNECTIONS
    // =========================================

    connectButtons() {
        const bind = (id, callback) => {
            const element = this.elements[id];

            if (element) {
                element.onclick = callback;
            }
        };

        bind("startBtn", () => this.start());
        bind("pauseBtn", () => this.pause());
        bind("resetBtn", () => this.reset());

        bind("createOrderBtn", () => {
            Production.createOrder();
            this.updateDashboard();
        });

        bind("faultBtn", () => this.triggerFault());
        bind("recoverBtn", () => this.recoverMachine());

        bind("pythonAnalysisBtn", () => {
            this.runPythonAnalysis();
        });
    },

    // =========================================
    // PYTHON INTELLIGENCE ENGINE
    // =========================================

    async checkPythonEngine() {
        const statusElement = this.elements.pythonEngineStatus;
        const messageElement = this.elements.pythonAnalysisMessage;

        if (statusElement) {
            statusElement.textContent = "CONNECTING...";
            statusElement.className = "analyzing";
        }

        try {
            const response = await fetch(`${this.pythonApi}/api/status`);

            if (!response.ok) {
                throw new Error("Python server returned an error");
            }

            const result = await response.json();

            this.pythonConnected = result.status === "running";

            if (!this.pythonConnected) {
                throw new Error("Python engine is not running");
            }

            if (statusElement) {
                statusElement.textContent = "CONNECTED";
                statusElement.className = "connected";
            }

            if (messageElement) {
                messageElement.textContent =
                    "Python Intelligence Engine connected. Ready for live production analysis.";
            }

            console.log("Python Intelligence Engine connected");

        } catch (error) {
            this.pythonConnected = false;

            if (statusElement) {
                statusElement.textContent = "OFFLINE";
                statusElement.className = "offline";
            }

            if (messageElement) {
                messageElement.textContent =
                    "Python backend unavailable. Start backend/app.py and try again.";
            }

            console.warn("Python engine connection failed:", error.message);
        }
    },

    collectPythonAnalysisData() {
        const machines = Factory.machines || [];

        let totalUptime = 0;
        let totalDowntime = 0;

        const stages = {};

        const machineStageNames = {
            "M-01": "Raw Material Processing",
            "M-02": "Product Assembly",
            "M-03": "Quality Inspection"
        };

        machines.forEach(machine => {
            const metrics = machine.metrics || {};

            totalUptime += Number(metrics.operationalTime || 0);
            totalDowntime += Number(metrics.downtime || 0);

            const stageName = machineStageNames[machine.id];

            const averageTime = Number(metrics.averageProcessingTime || 0);
            const unitsProcessed = Number(metrics.unitsProcessed || 0);

            if (
                stageName &&
                unitsProcessed > 0 &&
                Number.isFinite(averageTime) &&
                averageTime > 0
            ) {
                stages[stageName] = averageTime;
            }
        });

        return {
            production: {
                passed_units: Production.getCompletedUnits(),
                rejected_units: Production.getRejectedUnits()
            },

            machine: {
                uptime_seconds: totalUptime,
                downtime_seconds: totalDowntime
            },

            stages
        };
    },

    async runPythonAnalysis() {
        if (this.pythonAnalyzing) return;

        const button = this.elements.pythonAnalysisBtn;
        const statusElement = this.elements.pythonEngineStatus;
        const messageElement = this.elements.pythonAnalysisMessage;

        this.pythonAnalyzing = true;

        if (button) {
            button.disabled = true;
            button.textContent = "ANALYZING...";
        }

        if (statusElement) {
            statusElement.textContent = "ANALYZING...";
            statusElement.className = "analyzing";
        }

        if (messageElement) {
            messageElement.textContent =
                "Sending live factory production data to Python...";
        }

        try {
            const payload = this.collectPythonAnalysisData();

            const response = await fetch(
                `${this.pythonApi}/api/generate-report`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Python analysis failed");
            }

            this.displayPythonAnalysis(result);

            this.pythonConnected = true;

            if (statusElement) {
                statusElement.textContent = "CONNECTED";
                statusElement.className = "connected";
            }

            if (messageElement) {
                messageElement.textContent =
                    "Python analysis completed successfully using live factory simulation data.";
            }

            addEvent("Python Intelligence Engine completed production analysis");

        } catch (error) {
            this.pythonConnected = false;

            if (statusElement) {
                statusElement.textContent = "OFFLINE";
                statusElement.className = "offline";
            }

            if (messageElement) {
                messageElement.textContent =
                    `Analysis failed: ${error.message}. Check that the Python backend is running.`;
            }

            addEvent(`Python analysis failed: ${error.message}`);

            console.error("Python analysis error:", error);

        } finally {
            this.pythonAnalyzing = false;

            if (button) {
                button.disabled = false;
                button.textContent = "RUN PYTHON ANALYSIS";
            }
        }
    },

    // =========================================
    // PYTHON REPORT DISPLAY
    // =========================================

    displayPythonAnalysis(result) {
        const production = result.production_analysis || {};
        const machine = result.machine_health || {};
        const bottleneck = result.bottleneck_analysis || {};
        const summary = result.overall_summary || {};

        const hasMachineRuntime =
            Number(machine.uptime_seconds || 0) +
            Number(machine.downtime_seconds || 0) > 0;

        this.setText(
            "pythonQualityYield",
            `${Number(production.quality_yield || 0).toFixed(2)}%`
        );

        this.setText(
            "pythonRejectionRate",
            `${Number(production.rejection_rate || 0).toFixed(2)}%`
        );

        this.setText(
            "pythonAvailability",
            hasMachineRuntime
                ? `${Number(machine.availability || 0).toFixed(2)}%`
                : "--"
        );

        this.setText(
            "pythonHealthStatus",
            hasMachineRuntime
                ? machine.health_status || "Unknown"
                : "Awaiting simulation data"
        );

        const hasBottleneck =
            bottleneck.bottleneck &&
            bottleneck.processing_time !== undefined;

        this.setText(
            "pythonBottleneck",
            hasBottleneck ? bottleneck.bottleneck : "Awaiting data"
        );

        this.setText(
            "pythonBottleneckTime",
            hasBottleneck
                ? `${Number(bottleneck.processing_time).toFixed(2)}s`
                : "--"
        );

        this.setText(
            "pythonBottleneckMessage",
            bottleneck.message ||
            "No production bottleneck information available."
        );

        this.setText(
            "pythonBottleneckRecommendation",
            bottleneck.recommendation ||
            "Run the simulation to generate a recommendation."
        );

        this.renderBottleneckSeverity(
            bottleneck.severity || "Awaiting Data"
        );

        this.renderStageComparison(
            bottleneck.all_stages || {},
            bottleneck.bottleneck
        );

        this.setText(
            "pythonAnalysisTime",
            result.report_generated || new Date().toLocaleTimeString()
        );

        const messageElement = this.elements.pythonAnalysisMessage;

        if (messageElement) {
            messageElement.textContent =
                `Analysis complete. ${summary.total_units || 0} units processed. ` +
                `Quality yield: ${Number(summary.quality_yield || 0).toFixed(2)}%.`;
        }
    },

    // =========================================
    // BOTTLENECK SEVERITY DISPLAY
    // =========================================

    renderBottleneckSeverity(severity) {
        const element = this.elements.pythonBottleneckSeverity;

        if (!element) return;

        const normalized = String(severity).toLowerCase();

        element.textContent = String(severity).toUpperCase();

        element.classList.remove(
            "severity-normal",
            "severity-warning",
            "severity-critical",
            "severity-awaiting",
            "severity-awaiting-data"
        );

        if (normalized === "normal") {
            element.classList.add("severity-normal");
        } else if (normalized === "warning") {
            element.classList.add("severity-warning");
        } else if (normalized === "critical") {
            element.classList.add("severity-critical");
        } else {
            element.classList.add("severity-awaiting");
        }
    },

    // =========================================
    // STAGE PERFORMANCE COMPARISON
    // =========================================

    renderStageComparison(stages, bottleneckName) {
        const container = this.elements.pythonStageComparison;

        if (!container) return;

        container.replaceChildren();

        if (
            !stages ||
            typeof stages !== "object" ||
            Array.isArray(stages) ||
            Object.keys(stages).length === 0
        ) {
            const empty = document.createElement("p");
            empty.className = "empty-message";
            empty.textContent = "No production stage data available yet.";
            container.appendChild(empty);
            return;
        }

        const table = document.createElement("div");
        table.className = "stage-comparison-table";

        // Separate header from data rows.
        const header = document.createElement("div");
        header.className = "stage-comparison-header";

        [
            "PRODUCTION STAGE",
            "PROCESSING TIME",
            "VS. AVERAGE"
        ].forEach(label => {
            const cell = document.createElement("span");
            cell.textContent = label;
            header.appendChild(cell);
        });

        table.appendChild(header);

        Object.entries(stages).forEach(([stageName, values]) => {
            const processingTime = Number(values.processing_time);
            const difference = Number(values.difference_from_average);

            if (
                !Number.isFinite(processingTime) ||
                !Number.isFinite(difference)
            ) {
                return;
            }

            const row = document.createElement("div");
            row.className = "stage-comparison-row";

            if (stageName === bottleneckName) {
                row.classList.add("stage-bottleneck");
            }

            const name = document.createElement("span");
            name.className = "stage-name";
            name.textContent = stageName;

            if (stageName === bottleneckName) {
                const marker = document.createElement("small");
                marker.className = "stage-slowest";
                marker.textContent = "SLOWEST";
                name.appendChild(marker);
            }

            const time = document.createElement("span");
            time.className = "stage-time";
            time.textContent = `${processingTime.toFixed(2)}s`;

            const differenceElement = document.createElement("span");
            differenceElement.className = "stage-difference";

            differenceElement.textContent =
                `${difference > 0 ? "+" : ""}${difference.toFixed(2)}%`;

            if (difference > 0) {
                differenceElement.classList.add("stage-positive");
            } else if (difference < 0) {
                differenceElement.classList.add("stage-negative");
            }

            row.appendChild(name);
            row.appendChild(time);
            row.appendChild(differenceElement);

            table.appendChild(row);
        });

        if (table.children.length === 1) {
            const empty = document.createElement("p");
            empty.className = "empty-message";
            empty.textContent = "No valid production stage measurements available.";
            container.appendChild(empty);
            return;
        }

        container.appendChild(table);
    },

    // =========================================
    // SIMULATION CONTROL
    // =========================================

    start() {
        if (this.running) return;

        this.running = true;
        this.lastFrame = 0;

        Factory.setConveyorsActive(true);

        addEvent("Simulation started");
        addEvent("Conveyor belts activated");

        this.animationId = requestAnimationFrame(
            time => this.loop(time)
        );
    },

    pause() {
        this.running = false;

        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        Factory.setConveyorsActive(false);

        this.drawFactory();
        this.updateDashboard();

        addEvent("Simulation paused");
        addEvent("Conveyor belts stopped");
    },

    reset() {
        this.pause();

        Factory.initialize();
        RobotFleet.initialize();

        Production.orders = [];
        Production.nextOrderId = 1001;
        Production.inspectionHistory = [];

        Production.initializeMachineMetrics();

        if (typeof Analytics !== "undefined") {
            Analytics.reset();
        }

        this.activeFaults = {};
        this.faultHistory = [];
        this.activeFault = false;
        this.alertCount = 0;

        this.updateFaultStatus();

        addEvent("Factory simulation reset");
        addEvent("Machine performance records reset");
        addEvent("Fault history cleared");
        addEvent("Production analytics reset");

        this.drawFactory();
        this.updateDashboard();
    },

    // =========================================
    // ADVANCED FAULT SIMULATION
    // =========================================

    triggerFault() {
        const machineSelect = this.elements.faultMachineSelect;
        const typeSelect = this.elements.faultTypeSelect;
        const durationSelect = this.elements.faultDurationSelect;

        if (!machineSelect || !typeSelect || !durationSelect) {
            addEvent("Fault control error: selection controls unavailable");
            return;
        }

        const machineId = machineSelect.value;
        const faultType = typeSelect.value;
        const duration = Number(durationSelect.value);

        const machine = Factory.getMachine(machineId);

        if (!machine) {
            addEvent("Fault rejected: selected machine not found");
            return;
        }

        if (this.activeFaults[machineId]) {
            addEvent(`${machineId} already has an active fault`);
            return;
        }

        if (machine.status === "fault") {
            addEvent(`${machineId} is already faulted`);
            return;
        }

        if (!Number.isFinite(duration) || duration <= 0) {
            addEvent("Fault rejected: invalid recovery duration");
            return;
        }

        const fault = {
            machineId,
            machineName: machine.name,
            type: faultType,
            duration,
            remaining: duration,
            startedAt: new Date().toLocaleTimeString(),
            status: "ACTIVE"
        };

        this.activeFaults[machineId] = fault;

        Factory.setMachineStatus(machineId, "fault");

        this.updateFaultCounters();

        this.faultHistory.unshift({
            machineId,
            machineName: machine.name,
            type: faultType,
            duration,
            event: "FAULT TRIGGERED",
            time: fault.startedAt
        });

        addEvent(`WARNING: ${faultType} triggered at ${machineId}`);

        addEvent(
            `${machineId} entered fault state. Auto-recovery in ${duration} simulation seconds`
        );

        this.drawFactory();
        this.updateDashboard();
    },

    recoverMachine() {
        const machineSelect = this.elements.faultMachineSelect;

        if (!machineSelect) return;

        const machineId = machineSelect.value;

        if (!this.activeFaults[machineId]) {
            addEvent(`${machineId} has no active fault to recover`);
            return;
        }

        this.recoverFault(machineId, "MANUAL RECOVERY");
    },

    recoverFault(machineId, recoveryReason) {
        const fault = this.activeFaults[machineId];

        if (!fault) return;

        const machine = Factory.getMachine(machineId);

        if (!machine) return;

        const recoveryTime = new Date().toLocaleTimeString();

        Factory.setMachineStatus(machineId, "operational");

        fault.status = "RECOVERED";
        fault.recoveredAt = recoveryTime;
        fault.recoveryReason = recoveryReason;

        this.faultHistory.unshift({
            machineId,
            machineName: fault.machineName,
            type: fault.type,
            duration: fault.duration,
            remaining: Math.max(0, fault.remaining),
            event: recoveryReason,
            time: recoveryTime
        });

        delete this.activeFaults[machineId];

        this.updateFaultCounters();

        addEvent(`${machineId} recovered from ${fault.type}`);

        addEvent(
            `${machineId} returned to operational status (${recoveryReason})`
        );

        this.drawFactory();
        this.updateDashboard();
    },

    updateFaultCounters() {
        this.alertCount = Object.keys(this.activeFaults).length;
        this.activeFault = this.alertCount > 0;
    },

    updateFaultTimers(deltaTime) {
        const machineIds = Object.keys(this.activeFaults);

        machineIds.forEach(machineId => {
            const fault = this.activeFaults[machineId];

            if (!fault) return;

            fault.remaining -= deltaTime;

            if (fault.remaining <= 0) {
                fault.remaining = 0;
                this.recoverFault(machineId, "AUTOMATIC RECOVERY");
            }
        });
    },

    updateFaultStatus() {
        const statusElement = this.elements.faultStatus;

        if (!statusElement) return;

        const active = Object.values(this.activeFaults);

        if (active.length === 0) {
            const latest = this.faultHistory[0];

            statusElement.textContent = latest
                ? `ALL MACHINES OPERATIONAL | Last event: ${latest.machineId} - ${latest.event}`
                : "All machines operational";

            return;
        }

        const messages = active.map(fault => {
            return `${fault.machineId}: ${fault.type} | Recovery: ${Math.ceil(fault.remaining)}s`;
        });

        statusElement.textContent =
            `${active.length} ACTIVE FAULT(S) | ${messages.join(" | ")}`;
    },

    // =========================================
    // FAULT HISTORY RENDERING
    // =========================================

    renderFaultHistory() {
        const historyContainer = this.elements.faultHistoryList;

        const triggerEvents = this.faultHistory.filter(
            record => record.event === "FAULT TRIGGERED"
        );

        const recoveryEvents = this.faultHistory.filter(
            record => record.event !== "FAULT TRIGGERED"
        );

        const activeCount = Object.keys(this.activeFaults).length;

        this.setText("faultEventCount", triggerEvents.length);
        this.setText("faultActiveCount", activeCount);
        this.setText("faultRecoveredCount", recoveryEvents.length);

        this.setText(
            "faultHistoryCount",
            `${this.faultHistory.length} RECORDS`
        );

        if (!historyContainer) return;

        if (this.faultHistory.length === 0) {
            historyContainer.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-message">
                        No machine faults recorded yet.
                    </td>
                </tr>
            `;
            return;
        }

        historyContainer.innerHTML = this.faultHistory.map(record => {
            const isTrigger = record.event === "FAULT TRIGGERED";

            const eventClass = isTrigger
                ? "result-reject"
                : "result-pass";

            const durationText = isTrigger
                ? `${record.duration}s`
                : `${record.duration}s configured`;

            return `
                <tr>
                    <td>${record.time || "--"}</td>
                    <td>
                        <strong>${record.machineId}</strong>
                        <br>
                        <small>${record.machineName || ""}</small>
                    </td>
                    <td>${record.type}</td>
                    <td class="${eventClass}">${record.event}</td>
                    <td>${durationText}</td>
                </tr>
            `;
        }).join("");
    },

    // =========================================
    // SIMULATION LOOP
    // =========================================

    loop(timestamp) {
        if (!this.running) return;

        const realDelta = this.lastFrame
            ? Math.min((timestamp - this.lastFrame) / 1000, 0.05)
            : 0;

        this.lastFrame = timestamp;

        const deltaTime = realDelta * this.simulationSpeed;

        RobotFleet.update(deltaTime);
        this.updateFaultTimers(deltaTime);
        Production.update(deltaTime);

        if (typeof Analytics !== "undefined") {
            Analytics.update(deltaTime);
        }

        Factory.updateConveyors(deltaTime);

        this.drawFactory();
        this.updateDashboard();

        this.animationId = requestAnimationFrame(
            time => this.loop(time)
        );
    },

    // =========================================
    // FACTORY FLOOR RENDERING
    // =========================================

    drawFactory() {
        const ctx = this.ctx;
        const cell = Factory.cellSize;

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawFloor();
        this.drawFloorGrid();
        this.drawObstacles();
        this.drawSafetyZones();
        this.drawTransportLanes();
        this.drawConveyors();

        Factory.machines.forEach(machine => {
            this.drawMachine(machine);
        });

        Factory.stations.forEach(station => {
            this.drawStation(station);
        });

        RobotFleet.draw(ctx, cell);

        this.drawFloorLabels();
        this.drawSimulationOverlay();
    },

    drawFloor() {
        const ctx = this.ctx;

        const gradient = ctx.createLinearGradient(
            0, 0, this.canvas.width, this.canvas.height
        );

        gradient.addColorStop(0, "#142231");
        gradient.addColorStop(0.5, "#0e1a27");
        gradient.addColorStop(1, "#111d29");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.strokeStyle = "#536b80";
        ctx.lineWidth = 3;

        ctx.strokeRect(
            2, 2,
            this.canvas.width - 4,
            this.canvas.height - 4
        );
    },

    drawFloorGrid() {
        const ctx = this.ctx;
        const cell = Factory.cellSize;

        ctx.save();
        ctx.strokeStyle = "rgba(125,155,180,0.09)";
        ctx.lineWidth = 1;

        for (let x = 0; x <= Factory.cols; x++) {
            ctx.beginPath();
            ctx.moveTo(x * cell, 0);
            ctx.lineTo(x * cell, Factory.rows * cell);
            ctx.stroke();
        }

        for (let y = 0; y <= Factory.rows; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * cell);
            ctx.lineTo(Factory.cols * cell, y * cell);
            ctx.stroke();
        }

        ctx.restore();
    },

    drawObstacles() {
        const ctx = this.ctx;
        const cell = Factory.cellSize;

        for (let y = 0; y < Factory.rows; y++) {
            for (let x = 0; x < Factory.cols; x++) {
                if (Factory.grid[y][x] !== 1) continue;

                const px = x * cell;
                const py = y * cell;

                ctx.fillStyle = "#263747";
                ctx.fillRect(px + 1, py + 1, cell - 2, cell - 2);

                ctx.strokeStyle = "rgba(125,155,180,0.18)";
                ctx.lineWidth = 1;
                ctx.strokeRect(px + 3, py + 3, cell - 6, cell - 6);
            }
        }
    },

    drawSafetyZones() {
        const ctx = this.ctx;
        const cell = Factory.cellSize;

        Factory.machines.forEach(machine => {
            const x = (machine.x - 1) * cell;
            const y = (machine.y - 1) * cell;

            ctx.save();
            ctx.setLineDash([5, 4]);
            ctx.lineWidth = 1.5;

            ctx.strokeStyle = machine.status === "fault"
                ? "#e65c62"
                : "rgba(245,180,75,0.7)";

            ctx.strokeRect(x + 2, y + 2, cell * 3 - 4, cell * 3 - 4);
            ctx.restore();
        });

        ctx.save();
        ctx.setLineDash([4, 5]);
        ctx.strokeStyle = "rgba(94,145,177,0.35)";
        ctx.lineWidth = 1;

        ctx.strokeRect(8 * cell, 9 * cell, 4 * cell, 5 * cell);
        ctx.strokeRect(15 * cell, 9 * cell, 4 * cell, 5 * cell);

        ctx.restore();
    },

    drawTransportLanes() {
        const ctx = this.ctx;
        const cell = Factory.cellSize;
        const laneY = 16 * cell;

        ctx.fillStyle = "rgba(53,105,132,0.10)";
        ctx.fillRect(cell, laneY, (Factory.cols - 2) * cell, cell);

        ctx.save();
        ctx.setLineDash([12, 10]);
        ctx.strokeStyle = "rgba(99,169,198,0.4)";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(cell, laneY + cell / 2);
        ctx.lineTo((Factory.cols - 1) * cell, laneY + cell / 2);
        ctx.stroke();

        ctx.restore();

        for (let x = 2; x < Factory.cols - 2; x += 2) {
            ctx.fillStyle = "rgba(241,176,72,0.5)";
            ctx.fillRect(x * cell, laneY + 2, 8, 3);
        }
    },

    drawFloorLabels() {
        const ctx = this.ctx;
        const cell = Factory.cellSize;

        ctx.save();
        ctx.font = "bold 9px Arial";
        ctx.textAlign = "left";

        ctx.fillStyle = "rgba(151,176,196,0.65)";
        ctx.fillText("AGV TRANSPORT ROUTE", 12, 16 * cell - 5);

        ctx.fillStyle = "rgba(151,176,196,0.55)";
        ctx.fillText("INDUSTRIAL PRODUCTION AREA", 12, 2 * cell + 2);

        ctx.restore();
    },

    drawSimulationOverlay() {
        const ctx = this.ctx;

        ctx.save();
        ctx.fillStyle = "rgba(5,12,20,0.82)";
        ctx.fillRect(0, 0, this.canvas.width, 29);

        ctx.fillStyle = "#a9bdcf";
        ctx.font = "bold 10px Arial";
        ctx.textAlign = "left";

        ctx.fillText("FACTORY-X / LIVE PRODUCTION FLOOR", 12, 18);

        ctx.textAlign = "right";
        ctx.fillStyle = this.running ? "#4bd6a0" : "#e8b15c";

        ctx.fillText(
            this.running ? "SYSTEM RUNNING" : "SYSTEM STANDBY",
            this.canvas.width - 12,
            18
        );

        ctx.restore();
    },

    // =========================================
    // MACHINE VISUALS
    // =========================================

    drawMachine(machine) {
        const ctx = this.ctx;
        const cell = Factory.cellSize;

        const centerX = machine.x * cell + cell / 2;
        const centerY = machine.y * cell + cell / 2;

        const x = centerX - 33;
        const y = centerY - 25;

        const fault = machine.status === "fault";
        const color = fault ? "#ef626b" : machine.color;

        ctx.save();

        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(x + 4, y + 5, 70, 57);

        ctx.fillStyle = fault ? "#40252c" : "#1c3042";
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.roundRect(x, y, 66, 54, 5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#0b1622";
        ctx.fillRect(x + 5, y + 5, 56, 11);

        ctx.beginPath();
        ctx.arc(x + 55, y + 10, 3, 0, Math.PI * 2);
        ctx.fillStyle = fault ? "#ff555e" : "#42d69a";
        ctx.fill();

        ctx.fillStyle = color;
        ctx.font = "bold 10px Arial";
        ctx.textAlign = "center";
        ctx.fillText(machine.id, centerX, y + 27);

        ctx.fillStyle = "#c6d5e2";
        ctx.font = "bold 17px Arial";
        ctx.fillText(fault ? "!" : "⚙", centerX, y + 45);

        ctx.fillStyle = "#263b4e";
        ctx.fillRect(x + 4, y + 58, 58, 4);

        if (machine.progress > 0) {
            ctx.fillStyle = color;
            ctx.fillRect(
                x + 4, y + 58,
                58 * Math.min(100, machine.progress) / 100,
                4
            );
        }

        ctx.fillStyle = "#d9e5ef";
        ctx.font = "bold 8px Arial";

        const label = machine.id === "M-01"
            ? "RAW PROCESSING"
            : machine.id === "M-02"
                ? "ASSEMBLY"
                : "QUALITY CHECK";

        ctx.fillText(label, centerX, y + 75);

        ctx.fillStyle = fault ? "#ff777e" : "#70d8a8";
        ctx.font = "bold 7px Arial";
        ctx.fillText(fault ? "FAULT" : "OPERATIONAL", centerX, y + 85);

        ctx.restore();
    },

    // =========================================
    // STATION VISUALS
    // =========================================

    drawStation(station) {
        const ctx = this.ctx;
        const cell = Factory.cellSize;

        const centerX = station.x * cell + cell / 2;
        const centerY = station.y * cell + cell / 2;

        const x = centerX - 33;
        const y = centerY - 25;

        let symbol = "▦";

        if (station.id === "WAREHOUSE") symbol = "▤";
        if (station.id === "PACKING") symbol = "▣";
        if (station.id === "REJECTION") symbol = "✕";

        ctx.save();
        ctx.fillStyle = "#172638";
        ctx.strokeStyle = station.color;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.roundRect(x, y, 66, 54, 5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#0b1622";
        ctx.fillRect(x + 6, y + 6, 54, 41);

        ctx.fillStyle = station.color;
        ctx.font = "bold 23px Arial";
        ctx.textAlign = "center";
        ctx.fillText(symbol, centerX, y + 33);

        ctx.fillStyle = "#dce6ef";
        ctx.font = "bold 8px Arial";
        ctx.fillText(station.id, centerX, y + 75);

        ctx.fillStyle = station.color;
        ctx.font = "7px Arial";

        const label = station.id === "WAREHOUSE"
            ? "RAW MATERIALS"
            : station.id === "PACKING"
                ? "FINISHED GOODS"
                : "REJECTED UNITS";

        ctx.fillText(label, centerX, y + 85);
        ctx.restore();
    },

    // =========================================
    // CONVEYOR NETWORK
    // =========================================

    drawConveyors() {
        const ctx = this.ctx;
        const cell = Factory.cellSize;

        if (!Factory.conveyors) return;

        const products = Production.getConveyorProducts();

        Factory.conveyors.forEach(conveyor => {
            const startX = conveyor.start.x * cell;
            const endX = conveyor.end.x * cell;
            const centerY = conveyor.start.y * cell;
            const width = endX - startX;

            ctx.save();

            ctx.fillStyle = "#101e2c";
            ctx.strokeStyle = "#667b8e";
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.roundRect(startX, centerY - 12, width, 24, 4);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = conveyor.active ? "#263e50" : "#1c2b3a";
            ctx.fillRect(startX + 5, centerY - 7, width - 10, 14);

            ctx.fillStyle = "#71879a";
            ctx.fillRect(startX + 4, centerY - 11, width - 8, 2);
            ctx.fillRect(startX + 4, centerY + 9, width - 8, 2);

            const rollerGap = 15;
            const rollerOffset = conveyor.active
                ? (conveyor.offset || 0) * 15
                : 0;

            for (
                let x = startX + 9 - rollerOffset;
                x < endX - 5;
                x += rollerGap
            ) {
                ctx.beginPath();
                ctx.arc(x, centerY, 3, 0, Math.PI * 2);
                ctx.fillStyle = "#a3b3c2";
                ctx.fill();
            }

            products
                .filter(product => product.conveyorId === conveyor.id)
                .forEach(product => {
                    const productX =
                        startX + 12 + product.progress * (width - 28);

                    ctx.fillStyle = "rgba(0,0,0,0.4)";
                    ctx.fillRect(productX - 8, centerY - 5, 18, 14);

                    ctx.fillStyle = "#e99a32";
                    ctx.fillRect(productX - 8, centerY - 9, 16, 12);

                    ctx.strokeStyle = "#ffd083";
                    ctx.lineWidth = 1;
                    ctx.strokeRect(productX - 8, centerY - 9, 16, 12);

                    ctx.fillStyle = "#633e16";
                    ctx.fillRect(productX - 3, centerY - 6, 6, 2);

                    ctx.fillStyle = "#ffffff";
                    ctx.font = "bold 8px Arial";
                    ctx.textAlign = "center";

                    ctx.fillText(String(product.unitNumber), productX, centerY + 14);
                });

            ctx.fillStyle = conveyor.active ? "#48d59d" : "#71869a";

            ctx.beginPath();
            ctx.moveTo(endX - 5, centerY);
            ctx.lineTo(endX - 12, centerY - 5);
            ctx.lineTo(endX - 12, centerY + 5);
            ctx.closePath();
            ctx.fill();

            ctx.font = "bold 8px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = conveyor.active ? "#69ddb0" : "#9aabba";

            ctx.fillText(
                `${conveyor.id} / ${conveyor.active ? "RUNNING" : "STOPPED"}`,
                startX + width / 2,
                centerY - 18
            );

            ctx.restore();
        });
    },

    // =========================================
    // DASHBOARD
    // =========================================

    updateDashboard() {
        this.setText("completedOrders", Production.getCompletedCount());
        this.setText("completedUnits", Production.getCompletedUnits());
        this.setText("rejectedUnits", Production.getRejectedUnits());
        this.setText("activeRobots", RobotFleet.getActiveCount() + " / 2");

        const faultCount = Factory.machines.filter(
            machine => machine.status !== "operational"
        ).length;

        this.setText("machineStatus", faultCount ? `${3 - faultCount} / 3` : "3 / 3");

        this.updateFaultCounters();
        this.setText("activeAlerts", this.alertCount);

        this.updateFaultStatus();
        this.renderFaultHistory();

        this.setText(
            "queueCount",
            Production.orders.filter(order => order.status === "Queued").length
        );

        this.renderOrders();
        this.renderRobots();
        this.renderMachines();
        this.renderMachineSummary();
        this.renderQuality();

        if (typeof Analytics !== "undefined") {
            Analytics.render();
        }
    },

    setText(id, value) {
        const element = this.elements[id];

        if (element) {
            element.textContent = value;
        }
    },

    renderOrders() {
        const container = this.elements.orderList;

        if (!container) return;

        if (!Production.orders.length) {
            container.innerHTML =
                '<p class="empty-message">No production orders yet.</p>';
            return;
        }

        container.innerHTML = Production.orders.map(order => `
            <div class="order-card">
                <strong>${order.id}</strong>
                <span>${order.product}</span>
                <small>Status: ${order.status}</small>
                <small>Stage: ${order.currentStage}</small>
                <small>Passed: ${order.completed}</small>
                <small>Rejected: ${order.rejected}</small>
                <small>Inspected: ${order.inspected}/${order.quantity}</small>
                <small>Time: ${order.elapsedTime.toFixed(1)} sec</small>
                <div class="progress-track">
                    <div class="progress-fill"
                         style="width:${Math.round(order.inspected / order.quantity * 100)}%">
                    </div>
                </div>
            </div>
        `).join("");
    },

    renderRobots() {
        const container = this.elements.robotList;

        if (!container) return;

        container.innerHTML = RobotFleet.robots.map(robot => `
            <div class="robot-card">
                <strong>${robot.id}</strong>
                <span>${robot.name}</span>
                <small>Status: ${robot.status}</small>
                <small>Position: ${robot.x.toFixed(1)}, ${robot.y.toFixed(1)}</small>
                <small>Completed tasks: ${robot.completedTasks || 0}</small>
            </div>
        `).join("");
    },

    renderMachines() {
        const container = this.elements.machineList;

        if (!container) return;

        container.innerHTML = Factory.machines.map(machine => {
            const metrics = machine.metrics || {};

            const utilization = Math.min(100, Math.max(0, metrics.utilization || 0));
            const availability = Math.min(100, Math.max(0, metrics.availability ?? 100));

            const fault = this.activeFaults[machine.id];

            const status = machine.status !== "operational"
                ? "FAULT"
                : machine.liveStatus || "IDLE";

            const statusClass = status.toLowerCase();

            const progress = Math.min(100, Math.max(0, machine.progress || 0));

            return `
                <div class="machine-card machine-intelligence-card">
                    <div class="machine-card-header">
                        <strong>${machine.id}</strong>
                        <span class="machine-live-status ${statusClass}">
                            ${status}
                        </span>
                    </div>

                    <span>${machine.name}</span>

                    ${fault ? `
                        <small class="machine-fault-detail">
                            ${fault.type} | Recovery in ${Math.ceil(fault.remaining)}s
                        </small>
                    ` : ""}

                    <div class="machine-progress-label">
                        <small>Processing progress</small>
                        <small>${progress.toFixed(0)}%</small>
                    </div>

                    <div class="machine-progress-track">
                        <div class="machine-progress-fill" style="width:${progress}%"></div>
                    </div>

                    <div class="machine-metric-grid">
                        <div><small>Utilization</small><strong>${utilization.toFixed(1)}%</strong></div>
                        <div><small>Availability</small><strong>${availability.toFixed(1)}%</strong></div>
                        <div><small>Queue</small><strong>${machine.queueLength || 0}</strong></div>
                        <div><small>Units processed</small><strong>${metrics.unitsProcessed || 0}</strong></div>
                        <div><small>Downtime</small><strong>${(metrics.downtime || 0).toFixed(1)}s</strong></div>
                        <div><small>Fault events</small><strong>${metrics.faultCount || 0}</strong></div>
                    </div>

                    <small class="machine-current-unit">
                        Current unit: ${machine.processingUnitId || "None"}
                    </small>

                    <small>
                        Avg. processing: ${(metrics.averageProcessingTime || 0).toFixed(2)}s
                    </small>

                    <small>
                        Avg. waiting: ${(metrics.averageWaitingTime || 0).toFixed(2)}s
                    </small>
                </div>
            `;
        }).join("");
    },

    renderMachineSummary() {
        const performance = Production.getMachinePerformance();

        this.setText("machineUtilization", performance.averageUtilization.toFixed(1) + "%");
        this.setText("machineDowntime", performance.totalDowntime.toFixed(1) + "s");
        this.setText("machineUnitsProcessed", performance.totalProcessed);
        this.setText("machineWaitingTime", performance.totalWaiting.toFixed(1) + "s");
    },

    renderQuality() {
        const inspected = Production.getInspectedUnits();
        const passed = Production.getCompletedUnits();
        const passRate = Production.getPassRate();
        const rejectRate = Production.getRejectRate();

        this.setText("inspectedUnits", inspected);
        this.setText("passRate", passRate.toFixed(1) + "%");
        this.setText("rejectRate", rejectRate.toFixed(1) + "%");

        this.setText("qualityProgressText", `${passed} passed / ${inspected} inspected`);

        const passBar = this.elements.qualityPassBar;
        const rejectBar = this.elements.qualityRejectBar;

        if (passBar) passBar.style.width = passRate + "%";
        if (rejectBar) rejectBar.style.width = rejectRate + "%";

        this.setText("inspectionCount", `${inspected} RECORDS`);

        const historyContainer = this.elements.inspectionHistory;

        if (!historyContainer) return;

        if (!Production.inspectionHistory.length) {
            historyContainer.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-message">
                        No inspections performed yet.
                    </td>
                </tr>
            `;
            return;
        }

        historyContainer.innerHTML = Production.inspectionHistory.map(record => `
            <tr>
                <td>${record.orderId}</td>
                <td>Unit ${record.unitNumber}</td>
                <td class="${record.result === "PASS" ? "result-pass" : "result-reject"}">
                    ${record.result}
                </td>
                <td>${record.reason}</td>
            </tr>
        `).join("");
    },

    updateClock() {
        this.setText("clock", new Date().toLocaleTimeString());
    }
};

// =========================================
// EVENT LOG
// =========================================

function addEvent(message) {
    const container = document.getElementById("eventLog");

    if (!container) {
        console.log(message);
        return;
    }

    const entry = document.createElement("div");
    entry.className = "event-entry";
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;

    container.prepend(entry);

    while (container.children.length > 30) {
        container.lastElementChild.remove();
    }
}

// =========================================
// INITIALIZATION
// =========================================

document.addEventListener("DOMContentLoaded", () => {
    App.initialize();
});
