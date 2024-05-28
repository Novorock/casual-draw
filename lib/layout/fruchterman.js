import { distance, normal, dot } from "../math.js";

class FRVertex {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class FRDummyVertex extends FRVertex {
    constructor(x, y, nx, ny) {
        super(x, y);
        const l = distance([nx, ny]);
        this.nx = nx / l;
        this.ny = ny / l;
    }
}

class FREdge {
    constructor(from, to) {
        this.from = from;
        this.to = to;
    }
}

export class FRLayout {
    constructor(adjacency, x, y, k) {
        this.maxIterations = 250;
        this.k = k;
        this.vertices = [];
        this.edges = [];
        this.layout = [];
        this.dummiesIndices = new Set();
        const n = adjacency.length;

        let lastVertexIndex = 0;

        for (let i = 0; i < n; i++) {
            const v = new FRVertex(x[i], y[i]);
            this.vertices.push(v);
            lastVertexIndex += 1;
        }

        for (let i = 0; i < n; i++) {
            const v = this.vertices[i];
            for (let j = 0; j < n; j++) {
                if (adjacency[i][j] !== 0 && i !== j) {
                    const u = this.vertices[j];

                    const dummy = new FRDummyVertex(
                        (v.x + u.x) / 2,
                        (v.y + u.y) / 2,
                        ...normal([v.x, v.y], [u.x, u.y])
                    );

                    this.edges.push(new FREdge(v, dummy), new FREdge(dummy, u));
                    this.vertices.push(dummy);
                    this.dummiesIndices.add(lastVertexIndex);
                    this.layout.push([i, lastVertexIndex++, j]);

                    if (adjacency[j][i] !== 0) {
                        const [nx, ny] = normal([u.x, u.y], [v.x, v.y]);
                        const d = new FRDummyVertex(
                            (v.x + u.x) / 2 + 5 * nx,
                            (v.y + u.y) / 2 + 5 * ny,
                            nx, ny
                        );

                        this.edges.push(new FREdge(v, d), new FREdge(d, u));
                        this.vertices.push(d);
                        this.dummiesIndices.add(lastVertexIndex);
                        this.layout.push([j, lastVertexIndex++, i]);

                        adjacency[j][i] = 0;
                    }
                }
            }
        }
    }

    run() {
        let temperature = 1.5;

        for (let i = 0; i < this.maxIterations; i++) {
            this.calculateRepulsiveForces();
            this.calculateAttractiveForces();

            for (let v of this.vertices) {
                if (v instanceof FRDummyVertex) {
                    const disp = distance([v.dispX, v.dispY]);
                    v.dispX = (v.dispX / disp) * Math.min(disp, temperature * this.k);
                    v.dispY = (v.dispY / disp) * Math.min(disp, temperature * this.k);
                    const p = dot([v.dispX, v.dispY], [v.nx, v.ny]);
                    v.x += p * v.nx;
                    v.y += p * v.ny;
                }
            }

            temperature = 0.95 * temperature;
        }
    }

    attrativeForce(x) {
        return Math.pow(x, 2) / this.k;
    }

    repulsiveForce(x) {
        return Math.pow(this.k, 2) / x;
    }

    calculateRepulsiveForces() {
        for (let v of this.vertices) {
            v.dispX = 0;
            v.dispY = 0;
            for (let u of this.vertices) {
                if (v == u)
                    continue;

                const deltaX = v.x - u.x;
                const deltaY = v.y - u.y;
                const delta = distance([deltaX, deltaY]);
                const repulsiveF = this.repulsiveForce(delta);
                v.dispX += (deltaX / delta) * repulsiveF;
                v.dispY += (deltaY / delta) * repulsiveF;
            }
        }
    }

    calculateAttractiveForces() {
        for (let edge of this.edges) {
            const v = edge.from;
            const u = edge.to;

            const deltaX = v.x - u.x;
            const deltaY = v.y - u.y;

            const delta = distance([deltaX, deltaY]);
            const attractiveF = this.attrativeForce(delta);

            v.dispX -= (deltaX / delta) * attractiveF;
            v.dispY -= (deltaY / delta) * attractiveF;
            u.dispX += (deltaX / delta) * attractiveF;
            u.dispY += (deltaY / delta) * attractiveF;
        }
    }

    getX() {
        return this.vertices.map(v => v.x);
    }

    getY() {
        return this.vertices.map(v => v.y);
    }

    getLayout() {
        return this.layout;
    }

    getDummiesIndices() {
        return this.dummiesIndices;
    }
}
