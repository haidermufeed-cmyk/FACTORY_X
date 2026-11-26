
/*
  FACTORY-X
  factory.js
  Factory layout + conveyor belt system
  0 = walkable, 1 = blocked
*/

const Factory = {
    rows: 19,
    cols: 30,
    cellSize: 30,

    grid: [],
    machines: [],
    stations: [],
    obstacles: [],
    conveyors: [],

    initialize() {
        this.grid = Array.from(
            { length: this.rows },
            () => Array(this.cols).fill(0)
        );

        this.machines = [
            {
                id: "M-01",
                name: "Raw Material Processing",
                x: 5,
                y: 4,
                status: "operational",
                progress: 0,
                color: "#38bdf8"
            },
            {
                id: "M-02",
                name: "Assembly Station",
                x: 14,
                y: 4,
                status: "operational",
                progress: 0,
                color: "#a78bfa"
            },
            {
                id: "M-03",
                name: "Quality Inspection",
                x: 23,
                y: 4,
                status: "operational",
                progress: 0,
                color: "#34d399"
            }
        ];

        this.stations = [
            {
                id: "WAREHOUSE",
                name: "Raw Material Store",
                x: 2,
                y: 13,
                color: "#f59e0b"
            },
            {
                id: "PACKING",
                name: "Finished Goods",
                x: 25,
                y: 13,
                color: "#fb7185"
            },
            {
                id: "REJECTION",
                name: "Rejection Zone",
                x: 27,
                y: 7,
                color: "#ef4444"
            }
        ];

        this.obstacles = [];

        // Conveyor layout: visual paths, separate from robot navigation.
        this.conveyors = [
            {
                id: "CV-01",
                name: "Processing to Assembly",
                start: { x: 7, y: 8 },
                end: { x: 12, y: 8 },
                direction: 1,
                speed: 1,
                active: false,
                offset: 0
            },
            {
                id: "CV-02",
                name: "Assembly to Inspection",
                start: { x: 16, y: 8 },
                end: { x: 21, y: 8 },
                direction: 1,
                speed: 1,
                active: false,
                offset: 0
            }
        ];

        // Block machine footprints.
        for (const machine of this.machines) {
            this.blockArea(
                machine.x - 1,
                machine.y - 1,
                3,
                3
            );
        }

        // Block station footprints.
        for (const station of this.stations) {
            this.blockArea(
                station.x - 1,
                station.y - 1,
                3,
                3
            );
        }

        // Factory boundary walls.
        for (let x = 0; x < this.cols; x++) {
            this.setBlocked(x, 0);
            this.setBlocked(x, this.rows - 1);
        }

        for (let y = 0; y < this.rows; y++) {
            this.setBlocked(0, y);
            this.setBlocked(this.cols - 1, y);
        }

        // Internal storage shelves.
        this.blockArea(9, 10, 2, 3);
        this.blockArea(16, 10, 2, 3);

        // Safety barriers.
        this.blockArea(12, 15, 2, 1);
        this.blockArea(20, 15, 2, 1);
    },

    setBlocked(x, y) {
        if (
            x >= 0 &&
            x < this.cols &&
            y >= 0 &&
            y < this.rows
        ) {
            this.grid[y][x] = 1;
        }
    },

    blockArea(x, y, width, height) {
        for (let row = y; row < y + height; row++) {
            for (let col = x; col < x + width; col++) {
                this.setBlocked(col, row);
            }
        }
    },

    getMachine(id) {
        return this.machines.find(
            machine => machine.id === id
        );
    },

    getStation(id) {
        return this.stations.find(
            station => station.id === id
        );
    },

    setMachineStatus(id, status) {
        const machine = this.getMachine(id);

        if (machine) {
            machine.status = status;
        }
    },

    setConveyorsActive(active) {
        this.conveyors.forEach(conveyor => {
            conveyor.active = active;
        });
    },

    updateConveyors(deltaTime) {
        this.conveyors.forEach(conveyor => {
            if (!conveyor.active) return;

            const length = conveyor.end.x - conveyor.start.x;

            conveyor.offset +=
                conveyor.speed * deltaTime * 2;

            if (conveyor.offset >= 1) {
                conveyor.offset -= 1;
            }

            conveyor.visualLength = length;
        });
    },

    getGrid() {
        return this.grid;
    }
};

Factory.initialize();
