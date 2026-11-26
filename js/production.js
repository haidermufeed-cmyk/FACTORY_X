
/*
  FACTORY-X
  production.js
  Coordinated Production and AGV Transport Engine.
*/

const Production = {
    orders: [],
    nextOrderId: 1001,
    inspectionHistory: [],

    rejectionTarget: { x: 27, y: 9 },
    packingTarget: { x: 27, y: 13 },
    warehouseTarget: { x: 4, y: 13 },

    warehouseReservedBy: null,
    transportReservedBy: null,

    conveyorTravelTime: 3.5,

    conveyorRoutes: {
        0: "CV-01",
        1: "CV-02"
    },

    stages: [
        { name: "Raw Material Processing", machineId: "M-01", duration: 4 },
        { name: "Product Assembly", machineId: "M-02", duration: 5 },
        { name: "Quality Inspection", machineId: "M-03", duration: 3 }
    ],

    defectReasons: [
        "Dimensional tolerance error",
        "Assembly alignment fault",
        "Material surface defect",
        "Component fitting error"
    ],

    initializeMachineMetrics() {
        for (const machine of Factory.machines) {
            if (!machine.metrics) {
                machine.metrics = {
                    operationalTime: 0,
                    busyTime: 0,
                    downtime: 0,
                    processingTime: 0,
                    waitingTime: 0,
                    unitsProcessed: 0,
                    faultCount: 0,
                    wasFaulted: false
                };
            }

            if (machine.processingUnitId === undefined) {
                machine.processingUnitId = null;
            }

            if (machine.progress === undefined) {
                machine.progress = 0;
            }

            machine.queueLength = 0;
            machine.liveStatus = "Idle";
        }
    },

    createOrder() {
        const order = {
            id: "ORD-" + this.nextOrderId++,
            product: "Smart Industrial Component",
            quantity: 5,
            completed: 0,
            rejected: 0,
            inspected: 0,
            status: "Queued",
            currentStage: "Queued",
            elapsedTime: 0,
            units: []
        };

        this.orders.push(order);
        this.log(`${order.id} created: ${order.quantity} units`);

        this.startNextOrder();
        return order;
    },

    createUnits(order) {
        order.units = Array.from({ length: order.quantity }, (_, index) => ({
            id: `${order.id}-U${index + 1}`,
            unitNumber: index + 1,
            phase: "warehouse",
            stageIndex: 0,
            processTimer: 0,
            conveyorId: null,
            conveyorProgress: 0,
            assignedRobot: null,
            robotDestination: null,
            inspected: false,
            result: null,
            defectReason: "None",
            waitingTime: 0,
            currentStage: "Waiting for raw materials"
        }));
    },

    startNextOrder() {
        if (this.orders.some(order => order.status === "In Production")) {
            return;
        }

        const order = this.orders.find(item => item.status === "Queued");
        if (!order) return;

        this.warehouseReservedBy = null;
        this.transportReservedBy = null;

        this.createUnits(order);

        order.status = "In Production";
        order.currentStage = "Starting parallel production";

        this.log(`${order.id}: ${order.quantity} units released into production`);
        this.log(`${order.id}: Parallel production system activated`);
    },

    getRobot(unit) {
        if (!unit.assignedRobot) return null;

        return RobotFleet.getRobot(unit.assignedRobot);
    },

    robotArrived(unit) {
        const robot = this.getRobot(unit);
        const destination = unit.robotDestination;

        if (!robot || !destination || robot.status !== "Idle") {
            return false;
        }

        return (
            Math.abs(robot.x - destination.x) < 0.15 &&
            Math.abs(robot.y - destination.y) < 0.15
        );
    },

    assignUnitRobot(unit, x, y) {
        // Another unit currently owns the transport task.
        if (
            this.transportReservedBy &&
            this.transportReservedBy !== unit.id
        ) {
            return false;
        }

        let robot = this.getRobot(unit);

        // Continue an existing assignment.
        if (robot) {
            if (
                robot.status === "Moving" ||
                robot.status === "Waiting"
            ) {
                return (
                    robot.target &&
                    Math.abs(robot.target.x - x) < 0.05 &&
                    Math.abs(robot.target.y - y) < 0.05
                );
            }

            if (
                robot.status === "Idle" &&
                Math.abs(robot.x - x) < 0.05 &&
                Math.abs(robot.y - y) < 0.05
            ) {
                unit.robotDestination = { x, y };
                this.transportReservedBy = unit.id;
                return true;
            }
        } else {
            // Alternate between the two AGVs.
            const robotId = RobotFleet.assignNearestRobot(x, y);
            if (!robotId) return false;

            robot = RobotFleet.getRobot(robotId);
            if (!robot) return false;

            unit.assignedRobot = robot.id;
            unit.robotDestination = { x, y };
            this.transportReservedBy = unit.id;
            return true;
        }

        const success = RobotFleet.assignTask(robot.id, x, y);

        if (!success) {
            unit.assignedRobot = null;
            unit.robotDestination = null;
            return false;
        }

        unit.robotDestination = { x, y };
        this.transportReservedBy = unit.id;
        return true;
    },

    releaseUnitRobot(unit) {
        const robot = this.getRobot(unit);

        if (this.transportReservedBy === unit.id) {
            this.transportReservedBy = null;
        }

        unit.assignedRobot = null;
        unit.robotDestination = null;

        // Keep the AGV at its destination.
        // It will be routed around the other AGV on its next task.
        if (robot && robot.status === "Idle") {
            robot.path = [];
            robot.target = null;
            robot.pathIndex = 0;
            robot.waitTime = 0;
        }
    },

    getMachine(stageIndex) {
        const stage = this.stages[stageIndex];
        if (!stage) return null;

        return Factory.getMachine(stage.machineId);
    },

    acquireMachine(unit, machine) {
        if (!machine.processingUnitId) {
            machine.processingUnitId = unit.id;
            machine.progress = 0;
            machine.liveStatus = "Processing";
            return true;
        }

        return machine.processingUnitId === unit.id;
    },

    releaseMachine(unit, machine) {
        if (machine.processingUnitId === unit.id) {
            machine.processingUnitId = null;
            machine.progress = 0;
            machine.metrics.unitsProcessed++;
            machine.liveStatus = "Idle";
        }
    },

    beginConveyorTransfer(unit, order) {
        const conveyorId = this.conveyorRoutes[unit.stageIndex];

        const conveyor = Factory.conveyors.find(
            item => item.id === conveyorId
        );

        if (!conveyor) {
            unit.currentStage = "Conveyor unavailable";
            this.log(`${order.id}: ${conveyorId} not found`);
            return;
        }

        unit.phase = "conveyor";
        unit.conveyorId = conveyorId;
        unit.conveyorProgress = 0;
        unit.currentStage = `Travelling on ${conveyorId}`;

        this.log(`${order.id}: Unit ${unit.unitNumber} entered ${conveyorId}`);
    },

    finishConveyorTransfer(unit, order) {
        unit.stageIndex++;
        unit.phase = "processing";

        unit.conveyorId = null;
        unit.conveyorProgress = 0;
        unit.processTimer = 0;

        const nextStage = this.stages[unit.stageIndex];
        if (!nextStage) return;

        unit.currentStage = nextStage.name;

        this.log(
            `${order.id}: Unit ${unit.unitNumber} arrived at ${nextStage.machineId}`
        );
    },

    shouldReject(unit) {
        return unit.unitNumber % 5 === 3;
    },

    getDefectReason(unit) {
        return this.defectReasons[
            (unit.unitNumber - 1) % this.defectReasons.length
        ];
    },

    recordInspection(order, unit, result, reason = "None") {
        this.inspectionHistory.unshift({
            orderId: order.id,
            unitNumber: unit.unitNumber,
            result,
            reason,
            time: new Date().toLocaleTimeString()
        });

        this.log(
            `${order.id}: Unit ${unit.unitNumber} inspection: ${result}` +
            (result === "REJECT" ? ` - ${reason}` : "")
        );
    },

    finishInspection(order, unit) {
        if (unit.inspected) return;

        unit.inspected = true;
        order.inspected++;

        if (this.shouldReject(unit)) {
            unit.result = "REJECT";
            unit.defectReason = this.getDefectReason(unit);
            unit.phase = "rejecting";
            order.rejected++;

            this.recordInspection(
                order,
                unit,
                "REJECT",
                unit.defectReason
            );

            unit.currentStage = "Delivering to rejection zone";
            return;
        }

        unit.result = "PASS";
        unit.phase = "packing";
        order.completed++;

        this.recordInspection(order, unit, "PASS");
        unit.currentStage = "Delivering finished product";
    },

    updateUnit(order, unit, deltaTime) {
        // PHASE 1: Warehouse pickup.
        if (unit.phase === "warehouse") {
            unit.currentStage = "Waiting for warehouse pickup";

            if (
                this.warehouseReservedBy &&
                this.warehouseReservedBy !== unit.id
            ) {
                return;
            }

            this.warehouseReservedBy = unit.id;

            if (!this.robotArrived(unit)) {
                this.assignUnitRobot(
                    unit,
                    this.warehouseTarget.x,
                    this.warehouseTarget.y
                );
                return;
            }

            this.warehouseReservedBy = null;

            // Keep the same transport lock and AGV for the M-01 trip.
            unit.phase = "delivery";
            unit.currentStage = "Delivering raw materials to M-01";

            this.log(
                `${order.id}: Unit ${unit.unitNumber} collected raw materials`
            );
            return;
        }

        // PHASE 2: Delivery to M-01.
        if (unit.phase === "delivery") {
            const firstMachine = this.getMachine(0);
            if (!firstMachine) return;

            unit.currentStage = "Delivering to M-01";

            const target = {
                x: firstMachine.x,
                y: firstMachine.y + 2
            };

            if (!this.robotArrived(unit)) {
                this.assignUnitRobot(unit, target.x, target.y);
                return;
            }

            this.releaseUnitRobot(unit);

            unit.phase = "processing";
            unit.currentStage = this.stages[0].name;

            this.log(
                `${order.id}: Unit ${unit.unitNumber} delivered to M-01`
            );
            return;
        }

        // PHASE 3: Conveyor transfer.
        if (unit.phase === "conveyor") {
            const conveyor = Factory.conveyors.find(
                item => item.id === unit.conveyorId
            );

            if (!conveyor || !conveyor.active) return;

            unit.conveyorProgress += deltaTime / this.conveyorTravelTime;
            unit.conveyorProgress = Math.min(1, unit.conveyorProgress);

            if (unit.conveyorProgress >= 1) {
                this.finishConveyorTransfer(unit, order);
            }
            return;
        }

        // PHASE 4: Machine processing.
        if (unit.phase === "processing") {
            const stage = this.stages[unit.stageIndex];
            const machine = this.getMachine(unit.stageIndex);

            if (!stage || !machine) return;

            if (machine.status !== "operational") {
                unit.currentStage = `${stage.name} - Fault / Waiting`;
                unit.waitingTime += deltaTime;
                machine.metrics.waitingTime += deltaTime;
                return;
            }

            if (!this.acquireMachine(unit, machine)) {
                unit.currentStage = `Waiting for ${machine.id}`;
                unit.waitingTime += deltaTime;
                machine.metrics.waitingTime += deltaTime;
                return;
            }

            unit.currentStage = stage.name;
            unit.processTimer += deltaTime;

            machine.progress = Math.min(
                100,
                (unit.processTimer / stage.duration) * 100
            );

            machine.metrics.processingTime += deltaTime;

            if (unit.processTimer < stage.duration) return;

            machine.progress = 100;

            this.log(
                `${order.id}: Unit ${unit.unitNumber} completed ${stage.name}`
            );

            this.releaseMachine(unit, machine);
            unit.processTimer = 0;

            if (unit.stageIndex < this.stages.length - 1) {
                this.beginConveyorTransfer(unit, order);
                return;
            }

            this.finishInspection(order, unit);
            return;
        }

        // PHASE 5: Rejected product delivery.
        if (unit.phase === "rejecting") {
            unit.currentStage = "Delivering to rejection zone";

            if (!this.robotArrived(unit)) {
                this.assignUnitRobot(
                    unit,
                    this.rejectionTarget.x,
                    this.rejectionTarget.y
                );
                return;
            }

            this.releaseUnitRobot(unit);

            unit.phase = "delivered";
            unit.currentStage = "Rejected product delivered";

            this.log(
                `${order.id}: Unit ${unit.unitNumber} delivered to rejection zone`
            );
            return;
        }

        // PHASE 6: Finished product delivery.
        if (unit.phase === "packing") {
            unit.currentStage = "Delivering finished goods";

            if (!this.robotArrived(unit)) {
                this.assignUnitRobot(
                    unit,
                    this.packingTarget.x,
                    this.packingTarget.y
                );
                return;
            }

            this.releaseUnitRobot(unit);

            unit.phase = "delivered";
            unit.currentStage = "Finished goods delivered";

            this.log(
                `${order.id}: Unit ${unit.unitNumber} delivered to packing`
            );
        }
    },

    updateMachineMetrics(deltaTime) {
        for (const machine of Factory.machines) {
            const metrics = machine.metrics;
            const faulted = machine.status !== "operational";

            if (faulted) {
                metrics.downtime += deltaTime;

                if (!metrics.wasFaulted) {
                    metrics.faultCount++;
                }
            } else {
                metrics.operationalTime += deltaTime;

                if (machine.processingUnitId) {
                    metrics.busyTime += deltaTime;
                }
            }

            metrics.wasFaulted = faulted;

            const queuedUnits = this.orders.reduce((total, order) => {
                if (order.status !== "In Production") return total;

                return total + order.units.filter(unit => {
                    const stage = this.stages[unit.stageIndex];

                    return (
                        unit.phase === "processing" &&
                        stage &&
                        stage.machineId === machine.id &&
                        unit.id !== machine.processingUnitId
                    );
                }).length;
            }, 0);

            machine.queueLength = queuedUnits;

            if (faulted) {
                machine.liveStatus = "Fault";
            } else if (machine.processingUnitId) {
                machine.liveStatus = "Processing";
            } else if (queuedUnits > 0) {
                machine.liveStatus = "Waiting";
            } else {
                machine.liveStatus = "Idle";
            }

            machine.metrics.utilization = metrics.operationalTime > 0
                ? (metrics.busyTime / metrics.operationalTime) * 100
                : 0;

            machine.metrics.availability =
                metrics.operationalTime + metrics.downtime > 0
                    ? (
                        metrics.operationalTime /
                        (metrics.operationalTime + metrics.downtime)
                    ) * 100
                    : 100;

            machine.metrics.averageProcessingTime =
                metrics.unitsProcessed > 0
                    ? metrics.processingTime / metrics.unitsProcessed
                    : 0;

            machine.metrics.averageWaitingTime =
                metrics.unitsProcessed > 0
                    ? metrics.waitingTime / metrics.unitsProcessed
                    : 0;
        }
    },

    update(deltaTime = 0) {
        if (!Number.isFinite(deltaTime) || deltaTime < 0) {
            deltaTime = 0;
        }

        this.initializeMachineMetrics();

        const order = this.orders.find(
            item => item.status === "In Production"
        );

        if (!order) {
            this.updateMachineMetrics(deltaTime);
            this.startNextOrder();
            return;
        }

        order.elapsedTime += deltaTime;

        for (const unit of order.units) {
            if (unit.phase === "delivered") continue;
            this.updateUnit(order, unit, deltaTime);
        }

        this.updateMachineMetrics(deltaTime);

        const activeUnit = order.units.find(
            unit => unit.phase !== "delivered"
        );

        if (activeUnit) {
            order.currentStage = activeUnit.currentStage;
        }

        const allDelivered = order.units.every(
            unit => unit.phase === "delivered"
        );

        if (allDelivered) {
            order.status = "Completed";
            order.currentStage = "All products delivered";

            this.warehouseReservedBy = null;
            this.transportReservedBy = null;

            this.log(
                `${order.id}: Order completed. Passed ${order.completed}, rejected ${order.rejected}`
            );

            this.log(
                `${order.id}: Total production time ${order.elapsedTime.toFixed(1)} seconds`
            );

            this.startNextOrder();
        }
    },

    getMachineMetrics() {
        this.initializeMachineMetrics();

        return Factory.machines.map(machine => ({
            id: machine.id,
            name: machine.name,
            status: machine.status,
            liveStatus: machine.liveStatus,
            progress: machine.progress,
            queueLength: machine.queueLength,
            processingUnitId: machine.processingUnitId,
            ...machine.metrics
        }));
    },

    getMachinePerformance() {
        const machines = this.getMachineMetrics();

        const totalProcessed = machines.reduce(
            (sum, machine) => sum + machine.unitsProcessed,
            0
        );

        const averageUtilization = machines.length
            ? machines.reduce(
                (sum, machine) => sum + machine.utilization,
                0
            ) / machines.length
            : 0;

        const totalDowntime = machines.reduce(
            (sum, machine) => sum + machine.downtime,
            0
        );

        const totalWaiting = machines.reduce(
            (sum, machine) => sum + machine.waitingTime,
            0
        );

        return {
            totalProcessed,
            averageUtilization,
            totalDowntime,
            totalWaiting
        };
    },

    getConveyorProducts() {
        const products = [];

        for (const order of this.orders) {
            if (order.status !== "In Production") continue;

            for (const unit of order.units) {
                if (unit.phase !== "conveyor" || !unit.conveyorId) continue;

                products.push({
                    orderId: order.id,
                    unitNumber: unit.unitNumber,
                    conveyorId: unit.conveyorId,
                    progress: Math.max(
                        0,
                        Math.min(1, unit.conveyorProgress)
                    )
                });
            }
        }

        return products;
    },

    getActiveUnits() {
        return this.orders.reduce(
            (total, order) =>
                total + order.units.filter(
                    unit => unit.phase !== "delivered"
                ).length,
            0
        );
    },

    log(message) {
        if (typeof addEvent === "function") {
            addEvent(message);
        } else {
            console.log(message);
        }
    },

    getCompletedCount() {
        return this.orders.filter(
            order => order.status === "Completed"
        ).length;
    },

    getActiveCount() {
        return this.orders.filter(
            order => order.status === "In Production"
        ).length;
    },

    getTotalUnits() {
        return this.orders.reduce(
            (total, order) => total + order.quantity,
            0
        );
    },

    getCompletedUnits() {
        return this.orders.reduce(
            (total, order) => total + order.completed,
            0
        );
    },

    getRejectedUnits() {
        return this.orders.reduce(
            (total, order) => total + order.rejected,
            0
        );
    },

    getInspectedUnits() {
        return this.inspectionHistory.length;
    },

    getPassRate() {
        const total = this.getInspectedUnits();

        return total
            ? (this.getCompletedUnits() / total) * 100
            : 0;
    },

    getRejectRate() {
        const total = this.getInspectedUnits();

        return total
            ? (this.getRejectedUnits() / total) * 100
            : 0;
    }
};
