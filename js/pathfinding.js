
/*
  FACTORY-X
  pathfinding.js
  A* pathfinding with obstacle avoidance.
*/

function findPath(grid, start, goal) {
    if (!grid || !grid.length || !grid[0]) return [];

    const rows = grid.length;
    const cols = grid[0].length;

    const key = (x, y) => `${x},${y}`;

    const valid = (x, y) =>
        x >= 0 &&
        y >= 0 &&
        x < cols &&
        y < rows &&
        grid[y][x] === 0;

    if (!valid(start.x, start.y) || !valid(goal.x, goal.y)) {
        return [];
    }

    const heuristic = (a, b) =>
        Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

    const startKey = key(start.x, start.y);
    const goalKey = key(goal.x, goal.y);

    const open = [startKey];
    const openSet = new Set([startKey]);
    const closed = new Set();

    const cameFrom = new Map();
    const positions = new Map();

    const gScore = new Map([[startKey, 0]]);
    const fScore = new Map([[startKey, heuristic(start, goal)]]);

    positions.set(startKey, { x: start.x, y: start.y });

    const directions = [
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: -1, y: 0 }
    ];

    while (open.length) {
        open.sort(
            (a, b) => (fScore.get(a) ?? Infinity) -
                      (fScore.get(b) ?? Infinity)
        );

        const currentKey = open.shift();
        openSet.delete(currentKey);

        if (closed.has(currentKey)) continue;

        const current = positions.get(currentKey);

        if (currentKey === goalKey) {
            const path = [current];
            let step = currentKey;

            while (cameFrom.has(step)) {
                step = cameFrom.get(step);
                path.unshift(positions.get(step));
            }

            return path;
        }

        closed.add(currentKey);

        for (const direction of directions) {
            const next = {
                x: current.x + direction.x,
                y: current.y + direction.y
            };

            if (!valid(next.x, next.y)) continue;

            const nextKey = key(next.x, next.y);
            if (closed.has(nextKey)) continue;

            const tentativeG = (gScore.get(currentKey) ?? Infinity) + 1;

            if (tentativeG < (gScore.get(nextKey) ?? Infinity)) {
                cameFrom.set(nextKey, currentKey);
                positions.set(nextKey, next);
                gScore.set(nextKey, tentativeG);
                fScore.set(nextKey, tentativeG + heuristic(next, goal));

                if (!openSet.has(nextKey)) {
                    open.push(nextKey);
                    openSet.add(nextKey);
                }
            }
        }
    }

    return [];
}
