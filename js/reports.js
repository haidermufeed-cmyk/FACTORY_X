
/*
  FACTORY-X
  reports.js
  Production Reporting and CSV Export.
*/

const Reports = {

    generateReportData() {
        const orders = Production.orders || [];
        const inspections = Production.inspectionHistory || [];
        const machines = Production.getMachineMetrics();

        const inspected = Production.getInspectedUnits();
        const passed = Production.getCompletedUnits();
        const rejected = Production.getRejectedUnits();

        return {
            generatedAt: new Date().toLocaleString(),

            summary: {
                totalOrders: orders.length,
                completedOrders: Production.getCompletedCount(),
                activeOrders: Production.getActiveCount(),
                queuedOrders: orders.filter(
                    order => order.status === "Queued"
                ).length,
                totalUnits: Production.getTotalUnits(),
                inspected,
                passed,
                rejected,
                passRate: inspected ? passed / inspected * 100 : 0,
                rejectRate: inspected ? rejected / inspected * 100 : 0
            },

            orders: orders.map(order => ({
                id: order.id,
                product: order.product,
                status: order.status,
                quantity: order.quantity,
                inspected: order.inspected,
                passed: order.completed,
                rejected: order.rejected,
                productionTime: Number(order.elapsedTime || 0).toFixed(2)
            })),

            machines: machines.map(machine => ({
                id: machine.id,
                name: machine.name,
                status: machine.liveStatus,
                utilization: Number(machine.utilization || 0).toFixed(2),
                availability: Number(machine.availability || 0).toFixed(2),
                processed: machine.unitsProcessed,
                downtime: Number(machine.downtime || 0).toFixed(2),
                faults: machine.faultCount,
                averageProcessingTime:
                    Number(machine.averageProcessingTime || 0).toFixed(2),
                averageWaitingTime:
                    Number(machine.averageWaitingTime || 0).toFixed(2)
            })),

            inspections: inspections.map(record => ({
                orderId: record.orderId,
                unitNumber: record.unitNumber,
                result: record.result,
                reason: record.reason,
                time: record.time
            }))
        };
    },

    escapeCSV(value) {
        return `"${String(value ?? "").replace(/"/g, '""')}"`;
    },

    addSection(rows, title, headers, records) {
        rows.push([title]);
        rows.push(headers);

        records.forEach(record => rows.push(record));
        rows.push([]);
    },

    createCSV(report) {
        const rows = [];

        rows.push(["FACTORY-X PRODUCTION REPORT"]);
        rows.push(["Generated At", report.generatedAt]);
        rows.push([]);

        this.addSection(
            rows,
            "PRODUCTION SUMMARY",
            ["Metric", "Value"],
            Object.entries(report.summary)
        );

        this.addSection(
            rows,
            "ORDER DETAILS",
            [
                "Order ID", "Product", "Status", "Quantity",
                "Inspected", "Passed", "Rejected", "Production Time (s)"
            ],
            report.orders.map(order => [
                order.id,
                order.product,
                order.status,
                order.quantity,
                order.inspected,
                order.passed,
                order.rejected,
                order.productionTime
            ])
        );

        this.addSection(
            rows,
            "MACHINE PERFORMANCE",
            [
                "Machine ID", "Machine Name", "Status",
                "Utilization (%)", "Availability (%)",
                "Units Processed", "Downtime (s)", "Fault Count",
                "Avg Processing Time (s)", "Avg Waiting Time (s)"
            ],
            report.machines.map(machine => [
                machine.id,
                machine.name,
                machine.status,
                machine.utilization,
                machine.availability,
                machine.processed,
                machine.downtime,
                machine.faults,
                machine.averageProcessingTime,
                machine.averageWaitingTime
            ])
        );

        this.addSection(
            rows,
            "QUALITY INSPECTION HISTORY",
            ["Order ID", "Unit Number", "Result", "Reason", "Time"],
            report.inspections.map(record => [
                record.orderId,
                record.unitNumber,
                record.result,
                record.reason,
                record.time
            ])
        );

        return rows.map(row =>
            row.map(value => this.escapeCSV(value)).join(",")
        ).join("\r\n");
    },

    downloadCSV() {
        const report = this.generateReportData();
        const csv = "\uFEFF" + this.createCSV(report);

        const blob = new Blob(
            [csv],
            { type: "text/csv;charset=utf-8;" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        const timestamp = new Date()
            .toISOString()
            .replace(/[:.]/g, "-");

        link.href = url;
        link.download = `FACTORY-X-Production-Report-${timestamp}.csv`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1000);

        Production.log("Production report exported successfully");

        console.log("FACTORY-X Report:", report);
    }
};
