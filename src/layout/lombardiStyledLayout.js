/* Dummy-node drawing approach */

import { DummyNode } from "../node.js";

export function LombardiStyledLayout(ForceDirectedLayout) {
    this.ForceDirectedLayout = ForceDirectedLayout;
    this.dummy = [];

    for (let e of this.ForceDirectedLayout.graph.edges) {
        const from = e.from;
        const to = e.to;

        let v = new DummyNode("", (from.x + to.x) / 2, (from.y + to.y) / 2);
        this.dummy.push(v);
    }
}

LombardiStyledLayout.prototype.applyRepulsiveForce = function (u, v) {
    if (u != v) {
        let deltaX = v.x - u.x;
        let deltaY = v.y - u.y;
        let delta = norm(deltaX, deltaY);
        let repulsiveF = this.ForceDirectedLayout.repulsiveForce(delta);

        v.dispX += (deltaX / delta) * repulsiveF;
        v.dispY += (deltaY / delta) * repulsiveF;
    }
}

LombardiStyledLayout.prototype.go = function () {
    for (let v of this.graph.nodes) {
        v.dispX = 0;
        v.dispY = 0;
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

        // v.dispX = (v.dispX / disp) * Math.min(disp, this.t * this.k * 2);
        // v.dispY = (v.dispY / disp) * Math.min(disp, this.t * this.k * 2);

        v.dispX = (v.dispX / disp);
        v.dispY = (v.dispY / disp);

        v.x += v.dispX;
        v.y += v.dispY;
    }
}

