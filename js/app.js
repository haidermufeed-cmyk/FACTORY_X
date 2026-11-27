
/*
  FACTORY-X
  app.js

  Industrial factory simulation controller.
  Intelligent machine monitoring + production analytics.
*/

const App = {
    running: false,
    lastFrame: 0,
    animationId: null,
    activeFault: false,
    alertCount: 0,
    canvas: null,
    ctx: null,
    elements: {},
    simulationSpeed: 1.5,

    initialize() {
        this.canvas = document.getElementById("factoryCanvas");

        if (!this.canvas) {
            console.error("Factory canvas not found");
            return;
        }

        this.ctx = this.canvas.getContext("2d");

        this.findElements();
        this.connectButtons();

        // Initialize machine metrics before dashboard rendering.
        Production.initializeMachineMetrics();

        // Initialize production analytics.
        if (typeof Analytics !== "undefined") {
            Analytics.initialize();
        }

        this.drawFactory();
        this.updateDashboard();
        this.updateClock();

        setInterval(() => this.updateClock(), 1000);

        addEvent("FACTORY-X initialized");
        addEvent("Industrial factory environment loaded");
        addEvent("Autonomous robot fleet registered");
        addEvent("Production machines online");
        addEvent("Machine intelligence monitoring enabled");
        addEvent("Production analytics initialized");
        addEvent("Quality inspection system ready");
        addEvent("Conveyor network initialized");
        addEvent("Parallel production engine ready");

        console.log("FACTORY-X ready");
    },

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
            "inspectedUnits",
            "passRate",
            "rejectRate",
            "qualityProgressText",
            "qualityPassBar",
            "qualityRejectBar",
            "inspectionCount",
            "inspectionHistory"
        ];

        ids.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });
    },

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
    },

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

        // New machines need fresh performance records.
        Production.initializeMachineMetrics();

        // Reset analytics after production data is cleared.
        if (typeof Analytics !== "undefined") {
            Analytics.reset();
        }

        this.activeFault = false;
        this.alertCount = 0;

        addEvent("Factory simulation reset");
        addEvent("Machine performance records reset");
        addEvent("Production analytics reset");

        this.drawFactory();
        this.updateDashboard();
    },

    triggerFault() {
        if (this.activeFault) return;

        this.activeFault = true;
        this.alertCount++;

        Factory.setMachineStatus("M-02", "fault");

        addEvent("WARNING: Simulated fault at M-02");

        this.drawFactory();
        this.updateDashboard();
    },

    recoverMachine() {
        if (!this.activeFault) return;

        this.activeFault = false;
        this.alertCount = Math.max(0, this.alertCount - 1);

        Factory.setMachineStatus("M-02", "operational");

        addEvent("M-02 recovered");
        addEvent("M-02 returned to operational status");

        this.drawFactory();
        this.updateDashboard();
    },

    loop(timestamp) {
        if (!this.running) return;

        const realDelta = this.lastFrame
            ? Math.min((timestamp - this.lastFrame) / 1000, 0.05)
            : 0;

        this.lastFrame = timestamp;

        const deltaTime = realDelta * this.simulationSpeed;

        RobotFleet.update(deltaTime);
        Production.update(deltaTime);

        // Update analytics using simulation time, not wall-clock time.
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

        ctx.clearRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );

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
            0, 0,
            this.canvas.width,
            this.canvas.height
        );

        gradient.addColorStop(0, "#142231");
        gradient.addColorStop(0.5, "#0e1a27");
        gradient.addColorStop(1, "#111d29");

        ctx.fillStyle = gradient;

        ctx.fillRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );

        ctx.strokeStyle = "#536b80";
        ctx.lineWidth = 3;

        ctx.strokeRect(
            2,
            2,
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

                ctx.fillRect(
                    px + 1,
                    py + 1,
                    cell - 2,
                    cell - 2
                );

                ctx.strokeStyle = "rgba(125,155,180,0.18)";
                ctx.lineWidth = 1;

                ctx.strokeRect(
                    px + 3,
                    py + 3,
                    cell - 6,
                    cell - 6
                );
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

            ctx.strokeRect(
                x + 2,
                y + 2,
                cell * 3 - 4,
                cell * 3 - 4
            );

            ctx.restore();
        });

        ctx.save();

        ctx.setLineDash([4, 5]);
        ctx.strokeStyle = "rgba(94,145,177,0.35)";
        ctx.lineWidth = 1;

        ctx.strokeRect(
            8 * cell,
            9 * cell,
            4 * cell,
            5 * cell
        );

        ctx.strokeRect(
            15 * cell,
            9 * cell,
            4 * cell,
            5 * cell
        );

        ctx.restore();
    },

    drawTransportLanes() {
        const ctx = this.ctx;
        const cell = Factory.cellSize;
        const laneY = 16 * cell;

        ctx.fillStyle = "rgba(53,105,132,0.10)";

        ctx.fillRect(
            cell,
            laneY,
            (Factory.cols - 2) * cell,
            cell
        );

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

            ctx.fillRect(
                x * cell,
                laneY + 2,
                8,
                3
            );
        }
    },

    drawFloorLabels() {
        const ctx = this.ctx;
        const cell = Factory.cellSize;

        ctx.save();

        ctx.font = "bold 9px Arial";
        ctx.textAlign = "left";

        ctx.fillStyle = "rgba(151,176,196,0.65)";
        ctx.fillText(
            "AGV TRANSPORT ROUTE",
            12,
            16 * cell - 5
        );

        ctx.fillStyle = "rgba(151,176,196,0.55)";
        ctx.fillText(
            "INDUSTRIAL PRODUCTION AREA",
            12,
            2 * cell + 2
        );

        ctx.restore();
    },

    drawSimulationOverlay() {
        const ctx = this.ctx;

        ctx.save();

        ctx.fillStyle = "rgba(5,12,20,0.82)";
        ctx.fillRect(
            0,
            0,
            this.canvas.width,
            29
        );

        ctx.fillStyle = "#a9bdcf";
        ctx.font = "bold 10px Arial";
        ctx.textAlign = "left";

        ctx.fillText(
            "FACTORY-X / LIVE PRODUCTION FLOOR",
            12,
            18
        );

        ctx.textAlign = "right";

        ctx.fillStyle = this.running
            ? "#4bd6a0"
            : "#e8b15c";

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
                x + 4,
                y + 58,
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

        ctx.fillText(
            fault ? "FAULT" : "OPERATIONAL",
            centerX,
            y + 85
        );

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
            ctx.roundRect(
                startX,
                centerY - 12,
                width,
                24,
                4
            );

            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = conveyor.active
                ? "#263e50"
                : "#1c2b3a";

            ctx.fillRect(
                startX + 5,
                centerY - 7,
                width - 10,
                14
            );

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
                .filter(product =>
                    product.conveyorId === conveyor.id
                )
                .forEach(product => {
                    const productX =
                        startX + 12 +
                        product.progress * (width - 28);

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

                    ctx.fillText(
                        String(product.unitNumber),
                        productX,
                        centerY + 14
                    );
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
        this.setText(
            "completedOrders",
            Production.getCompletedCount()
        );

        this.setText(
            "completedUnits",
            Production.getCompletedUnits()
        );

        this.setText(
            "rejectedUnits",
            Production.getRejectedUnits()
        );

        this.setText(
            "activeRobots",
            RobotFleet.getActiveCount() + " / 2"
        );

        const faultCount = Factory.machines.filter(
            machine => machine.status !== "operational"
        ).length;

        this.setText(
            "machineStatus",
            faultCount ? `${faultCount} FAULT` : "3 / 3"
        );

        this.setText("activeAlerts", this.alertCount);

        this.setText(
            "queueCount",
            Production.orders.filter(
                order => order.status === "Queued"
            ).length
        );

        this.renderOrders();
        this.renderRobots();
        this.renderMachines();
        this.renderMachineSummary();
        this.renderQuality();

        // Refresh analytics values and machine comparison.
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

            const utilization = Math.min(
                100,
                Math.max(0, metrics.utilization || 0)
            );

            const availability = Math.min(
                100,
                Math.max(0, metrics.availability ?? 100)
            );

            const status = machine.status !== "operational"
                ? "FAULT"
                : machine.liveStatus || "IDLE";

            const statusClass = status.toLowerCase();

            const progress = Math.min(
                100,
                Math.max(0, machine.progress || 0)
            );

            return `
                <div class="machine-card machine-intelligence-card">

                    <div class="machine-card-header">
                        <strong>${machine.id}</strong>
                        <span class="machine-live-status ${statusClass}">
                            ${status}
                        </span>
                    </div>

                    <span>${machine.name}</span>

                    <div class="machine-progress-label">
                        <small>Processing progress</small>
                        <small>${progress.toFixed(0)}%</small>
                    </div>

                    <div class="machine-progress-track">
                        <div class="machine-progress-fill"
                             style="width:${progress}%">
                        </div>
                    </div>

                    <div class="machine-metric-grid">
                        <div>
                            <small>Utilization</small>
                            <strong>${utilization.toFixed(1)}%</strong>
                        </div>

                        <div>
                            <small>Availability</small>
                            <strong>${availability.toFixed(1)}%</strong>
                        </div>

                        <div>
                            <small>Queue</small>
                            <strong>${machine.queueLength || 0}</strong>
                        </div>

                        <div>
                            <small>Units processed</small>
                            <strong>${metrics.unitsProcessed || 0}</strong>
                        </div>

                        <div>
                            <small>Downtime</small>
                            <strong>${(metrics.downtime || 0).toFixed(1)}s</strong>
                        </div>

                        <div>
                            <small>Fault events</small>
                            <strong>${metrics.faultCount || 0}</strong>
                        </div>
                    </div>

                    <small class="machine-current-unit">
                        Current unit:
                        ${machine.processingUnitId || "None"}
                    </small>

                    <small>
                        Avg. processing:
                        ${(metrics.averageProcessingTime || 0).toFixed(2)}s
                    </small>

                    <small>
                        Avg. waiting:
                        ${(metrics.averageWaitingTime || 0).toFixed(2)}s
                    </small>

                </div>
            `;
        }).join("");
    },

    renderMachineSummary() {
        const performance = Production.getMachinePerformance();

        this.setText(
            "machineUtilization",
            performance.averageUtilization.toFixed(1) + "%"
        );

        this.setText(
            "machineDowntime",
            performance.totalDowntime.toFixed(1) + "s"
        );

        this.setText(
            "machineUnitsProcessed",
            performance.totalProcessed
        );

        this.setText(
            "machineWaitingTime",
            performance.totalWaiting.toFixed(1) + "s"
        );
    },

    renderQuality() {
        const inspected = Production.getInspectedUnits();
        const passed = Production.getCompletedUnits();
        const rejected = Production.getRejectedUnits();

        const passRate = Production.getPassRate();
        const rejectRate = Production.getRejectRate();

        this.setText("inspectedUnits", inspected);
        this.setText("passRate", passRate.toFixed(1) + "%");
        this.setText("rejectRate", rejectRate.toFixed(1) + "%");

        this.setText(
            "qualityProgressText",
            `${passed} passed / ${inspected} inspected`
        );

        const passBar = this.elements.qualityPassBar;
        const rejectBar = this.elements.qualityRejectBar;

        if (passBar) {
            passBar.style.width = passRate + "%";
        }

        if (rejectBar) {
            rejectBar.style.width = rejectRate + "%";
        }

        this.setText(
            "inspectionCount",
            `${inspected} RECORDS`
        );

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

        historyContainer.innerHTML =
            Production.inspectionHistory.map(record => `
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
        this.setText(
            "clock",
            new Date().toLocaleTimeString()
        );
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

    entry.textContent =
        `[${new Date().toLocaleTimeString()}] ${message}`;

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
