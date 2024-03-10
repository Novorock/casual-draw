/* Fruchterman-Reingold */

export function ForceDirectedLayout(graph, k, delta) {
    this.graph = graph;
    this.k = k;
    this.delta = delta;
    this.t = 1;
}

ForceDirectedLayout.prototype.repulsiveForce = function (x) {
    return (this.k * this.k) / x;
};

ForceDirectedLayout.prototype.attractiveForce = function (x) {
    return (x * x) / this.k;
};

ForceDirectedLayout.prototype.cool = function (t) {
    return this.delta * t;
}

ForceDirectedLayout.prototype.go = function () {
    for (let v of this.graph.nodes) {
        v.dispX = 0;
        v.dispY = 0;

        for (let u of this.graph.nodes) {
            if (u != v) {
                let deltaX = v.x - u.x;
                let deltaY = v.y - u.y;
                let delta = norm(deltaX, deltaY);
                let repulsiveF = this.repulsiveForce(delta);

                v.dispX += (deltaX / delta) * repulsiveF;
                v.dispY += (deltaY / delta) * repulsiveF;
            }
        }
    }

    for (let e of this.graph.edges) {
        let deltaX = e.from.x - e.to.x;
        let deltaY = e.from.y - e.to.y;
        let delta = norm(deltaX, deltaY);
        let attractiveF = this.attractiveForce(delta);

        e.from.dispX -= (deltaX / delta) * attractiveF;
        e.from.dispY -= (deltaY / delta) * attractiveF;

        e.to.dispX += (deltaX / delta) * attractiveF;
        e.to.dispY += (deltaY / delta) * attractiveF;
    }

    for (let v of this.graph.nodes) {
        let disp = norm(v.dispX, v.dispY);

        v.dispX = (v.dispX / disp) * Math.min(disp, this.t * this.k * 2);
        v.dispY = (v.dispY / disp) * Math.min(disp, this.t * this.k * 2);

        // v.dispX = (v.dispX / disp);
        // v.dispY = (v.dispY / disp);

        v.x += v.dispX;
        v.y += v.dispY;
    }

    this.t = this.cool(this.t);
}
