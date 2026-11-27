
/*
  FACTORY-X
  analytics.js

  Production Analytics Engine
  - Live throughput
  - Quality yield
  - Order cycle time
  - Machine bottleneck detection
  - Production output trend
  - Machine utilization comparison
*/

const Analytics = {
    simulationTime: 0,
    lastSampleTime: 0,
    lastDeliveredCount: 0,
    trend: [],
    sampleInterval: 10,

    initialize() {
        this.simulationTime = 0;
        this.lastSampleTime = 0;
        this.lastDeliveredCount = 0;
        this.trend = [];

        this.addSample(0, 0);
        this.render();
    },

    reset() {
        this.initialize();
    },

    getDeliveredCount() {
        return Production.orders.reduce((total, order) => {
            return total + (order.units || []).filter(
                unit => unit.phase === "delivered"
            ).length;
        }, 0);
    },

    getQualityData() {
        const inspected = Production.getInspectedUnits();
        const passed = Production.getCompletedUnits();
        const rejected = Production.getRejectedUnits();

        return {
            inspected,
            passed,
            rejected,
            yield: inspected > 0
                ? (passed / inspected) * 100
                : 0,
            rejectionRate: inspected > 0
                ? (rejected / inspected) * 100
                : 0
        };
    },

    getAverageCycleTime() {
        const completedOrders = Production.orders.filter(
            order => order.status === "Completed"
        );

        if (!completedOrders.length) return 0;

        const totalTime = completedOrders.reduce(
            (sum, order) => sum + order.elapsedTime,
            0
        );

        return totalTime / completedOrders.length;
    },

    getThroughput() {
        if (this.simulationTime <= 0) return 0;

        return this.getDeliveredCount() /
            (this.simulationTime / 60);
    },

    getMachineData() {
        const machines = Production.getMachineMetrics();

        return machines.map(machine => ({
            id: machine.id,
            name: machine.name,
            utilization: Math.max(
                0,
                Math.min(100, machine.utilization || 0)
            ),
            availability: machine.availability || 0,
            downtime: machine.downtime || 0,
            processed: machine.unitsProcessed || 0,
            status: machine.liveStatus || "Idle"
        }));
    },

    getBottleneck() {
        const machines = this.getMachineData();

        if (!machines.length) return null;

        const activeMachines = machines.filter(
            machine => machine.processed > 0 ||
                       machine.status === "Processing" ||
                       machine.status === "Waiting"
        );

        if (!activeMachines.length) return null;

        return activeMachines.reduce((highest, machine) =>
            machine.utilization > highest.utilization
                ? machine
                : highest
        );
    },

    addSample(time, delivered) {
        this.trend.push({
            time,
            delivered
        });

        if (this.trend.length > 20) {
            this.trend.shift();
        }
    },

    update(deltaTime) {
        if (!Number.isFinite(deltaTime) || deltaTime <= 0) {
            return;
        }

        this.simulationTime += deltaTime;

        if (
            this.simulationTime - this.lastSampleTime >=
            this.sampleInterval
        ) {
            const delivered = this.getDeliveredCount();

            this.addSample(
                this.simulationTime,
                delivered
            );

            this.lastSampleTime = this.simulationTime;
            this.lastDeliveredCount = delivered;
        }
    },

    getSummary() {
        const quality = this.getQualityData();
        const machines = this.getMachineData();

        return {
            throughput: this.getThroughput(),
            delivered: this.getDeliveredCount(),
            yield: quality.yield,
            rejectionRate: quality.rejectionRate,
            averageCycleTime: this.getAverageCycleTime(),
            bottleneck: this.getBottleneck(),
            machines,
            simulationTime: this.simulationTime
        };
    },

    render() {
        const data = this.getSummary();

        this.setText(
            "analyticsThroughput",
            data.throughput.toFixed(2)
        );

        this.setText(
            "analyticsYield",
            data.yield.toFixed(1) + "%"
        );

        this.setText(
            "analyticsCycleTime",
            data.averageCycleTime.toFixed(1) + "s"
        );

        this.setText(
            "analyticsDelivered",
            data.delivered
        );

        this.setText(
            "analyticsBottleneck",
            data.bottleneck
                ? data.bottleneck.id
                : "None"
        );

        this.setText(
            "analyticsSimulationTime",
            this.formatTime(data.simulationTime)
        );

        this.renderMachineComparison(data.machines);
        this.renderTrend();
    },

    renderMachineComparison(machines) {
        const container = document.getElementById(
            "analyticsMachineList"
        );

        if (!container) return;

        if (!machines.length) {
            container.innerHTML =
                '<p class="empty-message">No machine data available.</p>';
            return;
        }

        container.innerHTML = machines.map(machine => `
            <div class="analytics-machine-row">
                <div class="analytics-machine-heading">
                    <strong>${machine.id}</strong>
                    <span>${machine.utilization.toFixed(1)}%</span>
                </div>

                <div class="analytics-bar-track">
                    <div class="analytics-bar-fill"
                         style="width:${machine.utilization}%">
                    </div>
                </div>

                <small>
                    ${machine.processed} processed
                    · ${machine.downtime.toFixed(1)}s downtime
                </small>
            </div>
        `).join("");
    },

    renderTrend() {
        const canvas = document.getElementById(
            "productionTrendChart"
        );

        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        const width = canvas.clientWidth || 600;
        const height = 180;
        const ratio = window.devicePixelRatio || 1;

        canvas.width = width * ratio;
        canvas.height = height * ratio;

        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, width, height);

        const points = this.trend;

        ctx.strokeStyle = "rgba(130,150,170,0.2)";
        ctx.lineWidth = 1;

        for (let i = 0; i < 4; i++) {
            const y = 15 + i * 45;

            ctx.beginPath();
            ctx.moveTo(35, y);
            ctx.lineTo(width - 12, y);
            ctx.stroke();
        }

        if (points.length < 2) {
            ctx.fillStyle = "#8296aa";
            ctx.font = "11px Arial";
            ctx.fillText(
                "Production trend will appear as units are delivered.",
                42,
                height / 2
            );
            return;
        }

        const maxValue = Math.max(
            1,
            ...points.map(point => point.delivered)
        );

        const plotWidth = width - 55;
        const plotHeight = height - 40;

        ctx.strokeStyle = "#43d5df";
        ctx.lineWidth = 2;
        ctx.beginPath();

        points.forEach((point, index) => {
            const x = 40 + (
                index / Math.max(1, points.length - 1)
            ) * plotWidth;

            const y = 15 + plotHeight -
                (point.delivered / maxValue) * plotHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        points.forEach((point, index) => {
            const x = 40 + (
                index / Math.max(1, points.length - 1)
            ) * plotWidth;

            const y = 15 + plotHeight -
                (point.delivered / maxValue) * plotHeight;

            ctx.fillStyle = "#43d5df";
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.fillStyle = "#8296aa";
        ctx.font = "9px Arial";
        ctx.fillText("DELIVERED UNITS", 8, 11);
        ctx.fillText("TIME →", width - 48, height - 5);
    },

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        return `${minutes}m ${remainingSeconds}s`;
    },

    setText(id, value) {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    }
};
