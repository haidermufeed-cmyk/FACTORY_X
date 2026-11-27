
/*
  FACTORY-X
  factory3d.js

  3D Factory Visualization
  Uses live Factory, RobotFleet and Production data.
*/

const Factory3D = {

    scene: null,
    camera: null,
    renderer: null,
    container: null,

    machineModels: {},
    robotModels: {},
    stationModels: {},
    conveyorModels: {},
    productModels: {},

    cameraAngle: Math.PI / 4,
    cameraHeight: 23,
    cameraDistance: 30,

    dragging: false,
    pointerX: 0,
    pointerY: 0,

    initialized: false,

    initialize() {

        if (this.initialized) return;

        this.container = document.getElementById("factory3DContainer");

        if (!this.container) {
            console.error("3D container not found.");
            return;
        }

        if (typeof THREE === "undefined") {
            this.showError("Three.js failed to load.");
            return;
        }

        try {

            this.scene = new THREE.Scene();

            this.scene.background = new THREE.Color(0x0b1520);

            this.camera = new THREE.PerspectiveCamera(
                45,
                this.container.clientWidth / this.container.clientHeight,
                0.1,
                200
            );

            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                powerPreference: "high-performance"
            });

            this.renderer.setPixelRatio(
                Math.min(window.devicePixelRatio || 1, 1.5)
            );

            this.renderer.setSize(
                this.container.clientWidth,
                this.container.clientHeight
            );

            this.container.appendChild(this.renderer.domElement);

            this.addLighting();
            this.createFactoryFloor();
            this.createMachines();
            this.createStations();
            this.createConveyors();
            this.createObstacles();
            this.createRobots();

            this.updateCameraPosition();
            this.setupControls();

            window.addEventListener("resize", () => this.resize());

            this.initialized = true;

            const loading = document.getElementById("factory3DLoading");

            if (loading) loading.style.display = "none";

            this.animate();

            console.log("FACTORY-X 3D initialized successfully.");

        } catch (error) {

            console.error("FACTORY-X 3D initialization error:", error);

            this.showError("3D initialization failed. Check the browser console.");
        }
    },

    showError(message) {

        this.container.innerHTML = `
            <div style="
                height:100%;
                display:flex;
                align-items:center;
                justify-content:center;
                color:#f87171;
                font-family:Arial;
                text-align:center;
                padding:20px;
            ">
                ${message}
            </div>
        `;
    },

    addLighting() {

        this.scene.add(
            new THREE.AmbientLight(0xffffff, 1.5)
        );

        const light = new THREE.DirectionalLight(0xffffff, 2);

        light.position.set(10, 25, 15);

        this.scene.add(light);
    },

    getWorldPosition(x, y) {

        return {
            x: x - Factory.cols / 2 + 0.5,
            z: y - Factory.rows / 2 + 0.5
        };
    },

    createBox(parent, width, height, depth, color, x, y, z) {

        const geometry = new THREE.BoxGeometry(
            width,
            height,
            depth
        );

        const material = new THREE.MeshStandardMaterial({
            color,
            roughness: 0.65,
            metalness: 0.25
        });

        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.set(x, y, z);

        parent.add(mesh);

        return mesh;
    },

    createFactoryFloor() {

        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(Factory.cols, Factory.rows),
            new THREE.MeshStandardMaterial({
                color: 0x142231,
                roughness: 0.9
            })
        );

        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.08;

        this.scene.add(floor);

        const grid = new THREE.GridHelper(
            Factory.cols,
            Factory.cols,
            0x38bdf8,
            0x26394c
        );

        grid.position.y = 0.01;

        this.scene.add(grid);

    },

    createLabel(text, color = "#e7eef6") {

        const canvas = document.createElement("canvas");

        canvas.width = 512;
        canvas.height = 128;

        const ctx = canvas.getContext("2d");

        ctx.fillStyle = "rgba(7,16,27,0.9)";
        ctx.fillRect(8, 8, 496, 112);

        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.strokeRect(8, 8, 496, 112);

        ctx.font = "bold 42px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = color;

        ctx.fillText(text, 256, 64);

        const texture = new THREE.CanvasTexture(canvas);

        const sprite = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: texture,
                transparent: true
            })
        );

        sprite.scale.set(3.2, 0.8, 1);

        return sprite;
    },

    createMachines() {

        Factory.machines.forEach(machine => {

            const position = this.getWorldPosition(
                machine.x,
                machine.y
            );

            const group = new THREE.Group();

            this.createBox(
                group, 2.7, 0.45, 2.7,
                0x26394c, 0, 0.25, 0
            );

            this.createBox(
                group, 2.1, 1.8, 2.1,
                machine.color || 0x38bdf8,
                0, 1.35, 0
            );

            this.createBox(
                group, 1.45, 0.55, 1.45,
                0x344b60, 0, 2.5, 0
            );

            const indicator = new THREE.Mesh(
                new THREE.SphereGeometry(0.18, 16, 16),
                new THREE.MeshStandardMaterial({
                    color: 0x34d399,
                    emissive: 0x34d399,
                    emissiveIntensity: 0.8
                })
            );

            indicator.position.set(0, 2.95, 0);

            group.add(indicator);

            const label = this.createLabel(machine.id, "#38bdf8");

            label.position.set(0, 3.7, 0);

            group.add(label);

            group.position.set(position.x, 0, position.z);

            this.scene.add(group);

            this.machineModels[machine.id] = {
                group,
                indicator
            };

        });
    },

    createStations() {

        Factory.stations.forEach(station => {

            const position = this.getWorldPosition(
                station.x,
                station.y
            );

            const group = new THREE.Group();

            this.createBox(
                group, 2.5, 0.35, 2.5,
                0x26394c, 0, 0.2, 0
            );

            this.createBox(
                group, 1.8, 1.1, 1.8,
                station.color || 0xf59e0b,
                0, 0.9, 0
            );

            const label = this.createLabel(
                station.id,
                "#fbbf24"
            );

            label.position.set(0, 1.9, 0);

            group.add(label);

            group.position.set(position.x, 0, position.z);

            this.scene.add(group);

            this.stationModels[station.id] = group;

        });
    },

    createConveyors() {

        Factory.conveyors.forEach(conveyor => {

            // IMPORTANT:
            // factory.js uses conveyor.start and conveyor.end.

            const start = this.getWorldPosition(
                conveyor.start.x,
                conveyor.start.y
            );

            const end = this.getWorldPosition(
                conveyor.end.x,
                conveyor.end.y
            );

            const dx = end.x - start.x;
            const dz = end.z - start.z;

            const length = Math.sqrt(dx * dx + dz * dz) + 1;

            const group = new THREE.Group();

            this.createBox(
                group, length, 0.3, 1.15,
                0x344b60, 0, 0.25, 0
            );

            this.createBox(
                group, length - 0.2, 0.08, 0.85,
                0x172635, 0, 0.45, 0
            );

            this.createBox(
                group, length, 0.25, 0.1,
                0x647b8f, 0, 0.58, -0.52
            );

            this.createBox(
                group, length, 0.25, 0.1,
                0x647b8f, 0, 0.58, 0.52
            );

            group.position.set(
                (start.x + end.x) / 2,
                0,
                (start.z + end.z) / 2
            );

            group.rotation.y = -Math.atan2(dz, dx);

            this.scene.add(group);

            this.conveyorModels[conveyor.id] = {
                group,
                start,
                end
            };

        });
    },

    createObstacles() {

        Factory.obstacles.forEach(obstacle => {

            const position = this.getWorldPosition(
                obstacle.x,
                obstacle.y
            );

            this.createBox(
                this.scene,
                obstacle.width || 0.8,
                0.9,
                obstacle.height || 0.8,
                0x344b60,
                position.x,
                0.45,
                position.z
            );

        });
    },

    createRobots() {

        RobotFleet.robots.forEach(robot => {

            const group = new THREE.Group();

            this.createBox(
                group, 1.25, 0.35, 1.45,
                robot.color || 0x38bdf8,
                0, 0.45, 0
            );

            this.createBox(
                group, 0.85, 0.2, 0.9,
                0x26394c,
                0, 0.72, 0
            );

            const sensor = new THREE.Mesh(
                new THREE.SphereGeometry(0.14, 16, 16),
                new THREE.MeshStandardMaterial({
                    color: 0x34d399,
                    emissive: 0x34d399
                })
            );

            sensor.position.set(0, 0.95, 0);

            group.add(sensor);

            const wheelGeometry = new THREE.CylinderGeometry(
                0.2, 0.2, 0.16, 16
            );

            const wheelMaterial = new THREE.MeshStandardMaterial({
                color: 0x111820
            });

            [
                [-0.62, 0.25, -0.48],
                [0.62, 0.25, -0.48],
                [-0.62, 0.25, 0.48],
                [0.62, 0.25, 0.48]
            ].forEach(position => {

                const wheel = new THREE.Mesh(
                    wheelGeometry,
                    wheelMaterial
                );

                wheel.rotation.z = Math.PI / 2;

                wheel.position.set(...position);

                group.add(wheel);
            });

            const label = this.createLabel(robot.id, "#38bdf8");

            label.position.set(0, 1.45, 0);

            group.add(label);

            this.scene.add(group);

            this.robotModels[robot.id] = {
                group
            };

        });
    },

    updateCameraPosition() {

        const x = Math.sin(this.cameraAngle) * this.cameraDistance;
        const z = Math.cos(this.cameraAngle) * this.cameraDistance;

        this.camera.position.set(x, this.cameraHeight, z);

        this.camera.lookAt(0, 0, 0);
    },

    setupControls() {

        const canvas = this.renderer.domElement;

        canvas.style.cursor = "grab";
        canvas.style.display = "block";
        canvas.style.touchAction = "none";

        canvas.addEventListener("pointerdown", event => {

            this.dragging = true;

            this.pointerX = event.clientX;
            this.pointerY = event.clientY;

            canvas.style.cursor = "grabbing";

            canvas.setPointerCapture(event.pointerId);
        });

        canvas.addEventListener("pointermove", event => {

            if (!this.dragging) return;

            const dx = event.clientX - this.pointerX;
            const dy = event.clientY - this.pointerY;

            this.pointerX = event.clientX;
            this.pointerY = event.clientY;

            this.cameraAngle -= dx * 0.006;

            this.cameraHeight = Math.max(
                8,
                Math.min(35, this.cameraHeight + dy * 0.08)
            );

            this.updateCameraPosition();
        });

        const stopDragging = () => {

            this.dragging = false;
            canvas.style.cursor = "grab";
        };

        canvas.addEventListener("pointerup", stopDragging);
        canvas.addEventListener("pointercancel", stopDragging);

        canvas.addEventListener("wheel", event => {

            event.preventDefault();

            this.cameraDistance = Math.max(
                14,
                Math.min(55, this.cameraDistance + event.deltaY * 0.025)
            );

            this.updateCameraPosition();

        }, { passive: false });
    },

    updateMachines() {

        Factory.machines.forEach(machine => {

            const model = this.machineModels[machine.id];

            if (!model) return;

            const status = String(machine.status || "").toLowerCase();

            const fault = status.includes("fault");

            const processing =
                status.includes("process") ||
                Number(machine.progress || 0) > 0;

            const color = fault
                ? 0xef4444
                : processing
                    ? 0xf59e0b
                    : 0x34d399;

            model.indicator.material.color.setHex(color);
            model.indicator.material.emissive.setHex(color);

        });
    },

    updateRobots() {

        RobotFleet.robots.forEach(robot => {

            const model = this.robotModels[robot.id];

            if (!model) return;

            const position = this.getWorldPosition(
                robot.x,
                robot.y
            );

            model.group.position.set(
                position.x,
                0,
                position.z
            );

            if (
                robot.path &&
                robot.pathIndex < robot.path.length
            ) {

                const next = robot.path[robot.pathIndex];

                if (next) {

                    const dx = next.x - robot.x;
                    const dz = next.y - robot.y;

                    if (Math.abs(dx) + Math.abs(dz) > 0.001) {
                        model.group.rotation.y = Math.atan2(dx, dz);
                    }
                }
            }
        });
    },

    updateProducts() {

        if (
            typeof Production === "undefined" ||
            typeof Production.getConveyorProducts !== "function"
        ) {
            return;
        }

        const products = Production.getConveyorProducts() || [];

        const activeIds = new Set();

        products.forEach(product => {

            const id = `${product.orderId}-${product.unitNumber}`;

            activeIds.add(id);

            let model = this.productModels[id];

            if (!model) {

                model = this.createBox(
                    this.scene,
                    0.45,
                    0.45,
                    0.45,
                    0xf59e0b,
                    0,
                    0.85,
                    0
                );

                this.productModels[id] = model;
            }

            const conveyor = this.conveyorModels[product.conveyorId];

            if (!conveyor) return;

            const progress = Math.max(
                0,
                Math.min(1, Number(product.progress) || 0)
            );

            model.position.set(
                THREE.MathUtils.lerp(
                    conveyor.start.x,
                    conveyor.end.x,
                    progress
                ),
                0.85,
                THREE.MathUtils.lerp(
                    conveyor.start.z,
                    conveyor.end.z,
                    progress
                )
            );
        });

        Object.keys(this.productModels).forEach(id => {

            if (!activeIds.has(id)) {

                const model = this.productModels[id];

                this.scene.remove(model);

                model.geometry.dispose();
                model.material.dispose();

                delete this.productModels[id];
            }
        });
    },

    update() {

        if (!this.initialized) return;

        this.updateMachines();
        this.updateRobots();
        this.updateProducts();
    },

    animate() {

        if (!this.initialized) return;

        this.animationId = requestAnimationFrame(
            () => this.animate()
        );

        this.update();

        this.renderer.render(
            this.scene,
            this.camera
        );
    },

    resize() {

        if (!this.renderer || !this.camera) return;

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        if (!width || !height) return;

        this.camera.aspect = width / height;

        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }
};


window.addEventListener("DOMContentLoaded", () => {

    setTimeout(() => {
        Factory3D.initialize();
    }, 0);

});
