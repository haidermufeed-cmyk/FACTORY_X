
/*
  FACTORY-X
  robots.js
  Coordinated AGV fleet with stationary-robot avoidance.
*/

const RobotFleet = {
    robots: [],
    nextRobotIndex: 0,

    initialize() {
        this.nextRobotIndex = 0;

        this.robots = [
            {
                id: "AGV-01",
                name: "Transport Robot 01",
                x: 4, y: 8,
                speed: 4.5,
                color: "#38bdf8",
                status: "Idle",
                path: [],
                target: null,
                pathIndex: 0,
                waitTime: 0,
                completedTasks: 0
            },
            {
                id: "AGV-02",
                name: "Transport Robot 02",
                x: 25, y: 8,
                speed: 4.5,
                color: "#a78bfa",
                status: "Idle",
                path: [],
                target: null,
                pathIndex: 0,
                waitTime: 0,
                completedTasks: 0
            }
        ];
    },

    getRobot(id) {
        return this.robots.find(robot => robot.id === id);
    },

    getNavigationGrid(robot) {
        const original = Factory.getGrid();
        const grid = original.map(row => row.slice());

        // Treat every other robot as a fixed obstacle.
        for (const other of this.robots) {
            if (other === robot) continue;

            const x = Math.round(other.x);
            const y = Math.round(other.y);

            if (
                y >= 0 && y < grid.length &&
                x >= 0 && x < grid[y].length
            ) {
                grid[y][x] = 1;
            }
        }

        return grid;
    },

    assignTask(robotId, targetX, targetY) {
        const robot = this.getRobot(robotId);
        if (!robot) return false;

        if (
            robot.target &&
            robot.target.x === targetX &&
            robot.target.y === targetY &&
            (robot.status === "Moving" || robot.status === "Waiting")
        ) {
            return true;
        }

        if (robot.status === "Moving" || robot.status === "Waiting") {
            return false;
        }

        const start = {
            x: Math.round(robot.x),
            y: Math.round(robot.y)
        };

        const goal = { x: targetX, y: targetY };

        const grid = this.getNavigationGrid(robot);

        // The robot's current cell must remain traversable.
        if (grid[start.y] && grid[start.y][start.x] !== undefined) {
            grid[start.y][start.x] = 0;
        }

        const path = findPath(grid, start, goal);

        if (!path || path.length === 0) {
            robot.status = "Idle";
            robot.path = [];
            robot.target = null;
            return false;
        }

        robot.path = path;
        robot.pathIndex = path.length > 1 ? 1 : 0;
        robot.target = goal;
        robot.waitTime = 0;

        if (path.length <= 1) {
            robot.status = "Idle";
            robot.path = [];
            robot.target = null;
            return true;
        }

        robot.status = "Moving";
        return true;
    },

    assignNearestRobot(targetX, targetY) {
        const count = this.robots.length;

        for (let offset = 0; offset < count; offset++) {
            const index = (this.nextRobotIndex + offset) % count;
            const robot = this.robots[index];

            if (robot.status !== "Idle") continue;

            if (this.assignTask(robot.id, targetX, targetY)) {
                this.nextRobotIndex = (index + 1) % count;
                return robot.id;
            }
        }

        return null;
    },

    isCellOccupied(x, y, currentRobot) {
        return this.robots.some(robot => {
            if (robot === currentRobot) return false;
            return Math.hypot(robot.x - x, robot.y - y) < 0.72;
        });
    },

    recalculatePath(robot) {
        if (!robot.target) return false;

        const start = {
            x: Math.round(robot.x),
            y: Math.round(robot.y)
        };

        const grid = this.getNavigationGrid(robot);

        if (grid[start.y] && grid[start.y][start.x] !== undefined) {
            grid[start.y][start.x] = 0;
        }

        const path = findPath(grid, start, robot.target);

        if (!path || path.length === 0) {
            robot.status = "Waiting";
            return false;
        }

        robot.path = path;
        robot.pathIndex = path.length > 1 ? 1 : 0;
        robot.waitTime = 0;

        if (path.length <= 1) {
            this.completeTask(robot);
        } else {
            robot.status = "Moving";
        }

        return true;
    },

    update(deltaTime = 0) {
        if (!Number.isFinite(deltaTime) || deltaTime <= 0) return;

        // Only one AGV is allowed to move at a time.
        // Production also grants only one transport assignment at a time.
        const active = this.robots.find(robot =>
            robot.status === "Moving" || robot.status === "Waiting"
        );

        if (!active) return;

        if (!active.target || active.path.length === 0) {
            active.status = "Idle";
            active.target = null;
            active.path = [];
            active.pathIndex = 0;
            return;
        }

        if (active.pathIndex >= active.path.length) {
            this.completeTask(active);
            return;
        }

        const next = active.path[active.pathIndex];

        if (this.isCellOccupied(next.x, next.y, active)) {
            active.status = "Waiting";
            active.waitTime += deltaTime;

            if (active.waitTime >= 1.5) {
                this.recalculatePath(active);
            }

            return;
        }

        active.status = "Moving";
        active.waitTime = 0;

        let movement = active.speed * Math.min(deltaTime, 0.05);

        while (movement > 0 && active.pathIndex < active.path.length) {
            const point = active.path[active.pathIndex];

            const dx = point.x - active.x;
            const dy = point.y - active.y;
            const distance = Math.hypot(dx, dy);

            if (distance < 0.0001) {
                active.x = point.x;
                active.y = point.y;
                active.pathIndex++;
                continue;
            }

            if (distance <= movement) {
                active.x = point.x;
                active.y = point.y;
                movement -= distance;
                active.pathIndex++;
            } else {
                active.x += (dx / distance) * movement;
                active.y += (dy / distance) * movement;
                movement = 0;
            }
        }

        if (active.pathIndex >= active.path.length) {
            this.completeTask(active);
        }
    },

    completeTask(robot) {
        if (robot.target) {
            robot.x = robot.target.x;
            robot.y = robot.target.y;
        }

        robot.status = "Idle";
        robot.path = [];
        robot.pathIndex = 0;
        robot.target = null;
        robot.waitTime = 0;
        robot.completedTasks++;
    },

    draw(ctx, cellSize) {
        for (const robot of this.robots) {
            const px = robot.x * cellSize + cellSize / 2;
            const py = robot.y * cellSize + cellSize / 2;

            ctx.save();

            if (robot.path.length > 1) {
                ctx.strokeStyle = robot.color;
                ctx.globalAlpha = 0.3;
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 6]);
                ctx.beginPath();

                const startIndex = Math.max(0, robot.pathIndex - 1);

                for (let i = startIndex; i < robot.path.length; i++) {
                    const point = robot.path[i];
                    const x = point.x * cellSize + cellSize / 2;
                    const y = point.y * cellSize + cellSize / 2;

                    if (i === startIndex) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }

                ctx.stroke();
            }

            ctx.setLineDash([]);
            ctx.globalAlpha = 1;

            ctx.fillStyle = "rgba(0,0,0,0.35)";
            ctx.beginPath();
            ctx.ellipse(px, py + 5, 13, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = robot.color;
            ctx.beginPath();
            ctx.roundRect(px - 12, py - 12, 24, 24, 7);
            ctx.fill();

            ctx.fillStyle = "#102033";
            ctx.beginPath();
            ctx.roundRect(px - 7, py - 7, 14, 14, 4);
            ctx.fill();

            let statusColor = "#fbbf24";
            if (robot.status === "Moving") statusColor = "#4ade80";
            if (robot.status === "Waiting") statusColor = "#fb923c";

            ctx.fillStyle = statusColor;
            ctx.beginPath();
            ctx.arc(px + 8, py - 8, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#e2e8f0";
            ctx.font = "bold 10px Arial";
            ctx.textAlign = "center";
            ctx.fillText(robot.id, px, py - 19);

            ctx.restore();
        }
    },

    getActiveCount() {
        return this.robots.filter(robot =>
            robot.status === "Moving" || robot.status === "Waiting"
        ).length;
    },

    getIdleCount() {
        return this.robots.filter(robot => robot.status === "Idle").length;
    },

    getFleetStatus() {
        return this.robots.map(robot => ({
            id: robot.id,
            status: robot.status,
            target: robot.target,
            completedTasks: robot.completedTasks
        }));
    }
};

RobotFleet.initialize();
