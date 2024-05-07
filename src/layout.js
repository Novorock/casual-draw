import { Node, Edge } from "./graph.js";

export function LayoutNode(x, y) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.goalX = x;
    this.goalY = y;
}

LayoutNode.prototype.reset = function (x, y) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.goalX = x;
    this.goalY = y;
}

LayoutNode.prototype.update = function (s) {
    if (s >= 1) {
        s = 1;
        this.x = this.goalX;
        this.y = this.goalY;
    }

    if (s <= 0) {
        s = 0;
        this.x = this.startX;
        this.y = this.startY;
    }

    this.x = lerp(this.startX, this.goalX, s);
    this.y = lerp(this.startY, this.goalY, s);
}

LayoutNode.prototype.setX = function (x) {
    this.startX = this.x;
    this.goalX = x;
}

LayoutNode.prototype.setY = function (y) {
    this.startY = this.y;
    this.goalY = y;
}

LayoutNode.prototype.getX = function () {
    return this.x;
}

LayoutNode.prototype.getY = function () {
    return this.y;
}

function Layout() {
    this.animationSpeedScale = 250;
    this.s = 0;
    this.playing = false;
    this.playingOnce = false;
}

Layout.prototype.go = function () {
    return;
}

Layout.prototype.play = function () {
    this.s = 0;
    this.playing = true;
}

Layout.prototype.playOnce = function () {
    this.s = 0;
    this.go();
    this.playingOnce = true;
}

Layout.prototype.pause = function () {
    this.playing = false;
}

/* Fruchterman-Reingold */
export function ForceDirectedLayout(G, k, delta) {
    this.G = G;

    for (let v of this.G.nodes) {
        const u = new LayoutNode(v.x, v.y);
        Object.assign(v, u);
        Object.assign(v.__proto__, u.__proto__);
    }

    this.k = k;
    this.delta = delta;
    this.t = 5;

    this.iteration = 0;
    this.animationSpeedScale = 250;
    this.s = 0;
}

ForceDirectedLayout.prototype = Object.create(Layout.prototype);

ForceDirectedLayout.prototype.reset = function (k, delta) {
    this.iteration = 0;
    this.k = k;
    this.delta = delta;
    this.t = 1.75;

    for (let v of this.G.nodes) {
        v.reset(250 * Math.random() + 350, 250 * Math.random() + 300);
    }
}

ForceDirectedLayout.prototype.repulsiveForce = function (x) {
    return (this.k * this.k) / x;
};

ForceDirectedLayout.prototype.attractiveForce = function (x) {
    return (x * x) / this.k;
};

ForceDirectedLayout.prototype.cool = function (t) {
    return t > 1.75 ? 1.75 : Math.max(this.delta * t, 0.05);

    // const x = 1 - this.iteration * this.iteration / 2500;

    // return x > 0 ? Math.sqrt(x) : 0;

    // const x = 1 - this.iteration / 40;

    // const x = Math.pow(0.85, this.iteration);

    // return x > 0 ? x : 0;
}

ForceDirectedLayout.prototype.center = function (screenWidth, screenHeight) {
    let minX = screenWidth;
    let minY = screenHeight;
    let maxX = 0;
    let maxY = 0;

    for (let v of this.G.nodes) {
        const x = v.getX();
        const y = v.getY();

        minX = Math.min(x, minX);
        minY = Math.min(y, minY);

        maxX = Math.max(x, maxX);
        maxY = Math.max(y, maxY);
    }

    let w = maxX - minX;
    let h = maxY - minY;
    let x0 = screenWidth / 2;
    let y0 = screenHeight / 2;

    let offsetX = (x0 - w / 2) - minX;
    let offsetY = (y0 - h / 2) - minY;

    for (let v of this.G.nodes) {
        v.goalX += offsetX;
        v.goalY += offsetY;
    }
}

ForceDirectedLayout.prototype.go = function () {
    for (let v of this.G.nodes) {
        v.dispX = 0;
        v.dispY = 0;

        for (let u of this.G.nodes) {
            if (u != v) {
                let deltaX = v.getX() - u.getX();
                let deltaY = v.getY() - u.getY();
                let delta = norm(deltaX, deltaY);
                let repulsiveF = this.repulsiveForce(delta);

                v.dispX += (deltaX / delta) * repulsiveF;
                v.dispY += (deltaY / delta) * repulsiveF;
            }
        }
    }

    for (let e of this.G.edges) {
        let deltaX = e.from.getX() - e.to.getX();
        let deltaY = e.from.getY() - e.to.getY();
        let delta = norm(deltaX, deltaY);
        let attractiveF = this.attractiveForce(delta);

        e.from.dispX -= (deltaX / delta) * attractiveF;
        e.from.dispY -= (deltaY / delta) * attractiveF;

        e.to.dispX += (deltaX / delta) * attractiveF;
        e.to.dispY += (deltaY / delta) * attractiveF;
    }

    for (let v of this.G.nodes) {
        let disp = norm(v.dispX, v.dispY);

        v.dispX = (v.dispX / disp) * Math.min(disp, this.t * this.k);
        v.dispY = (v.dispY / disp) * Math.min(disp, this.t * this.k);

        v.setX(v.getX() + v.dispX);
        v.setY(v.getY() + v.dispY);
    }

    this.center(1300, 950);
    this.t = this.cool(this.t);
    this.iteration += 1;
}

ForceDirectedLayout.prototype.update = function (dt) {
    if (this.playing && this.s > 1) {
        this.go();
        this.s = 0;
    } else if (this.playingOnce && this.s > 1) {
        this.playingOnce = false;
        this.s = 1;
    }

    if (this.playing || this.playingOnce) {
        for (let v of this.G.nodes) {
            v.update(this.s);
        }

        this.s += dt / this.animationSpeedScale;
    }
}

ForceDirectedLayout.prototype.draw = function (ctx) {
    for (let edge of this.G.edges) {
        edge.draw(ctx);
    }

    for (let v of this.G.nodes) {
        v.draw(ctx);
    }
}

function LombardiNode(dummy) {
    this.dummy = dummy;
    this.nx = 0;
    this.ny = 0;

    if (dummy) {
        this.r = 3;
        this.color = "red";
    }
}

export function LombardiEdge(from, mid, to) {
    this.init(from, mid, to);
}

LombardiEdge.prototype.init = function (from, mid, to) {
    this.from = from;
    this.mid = mid;
    this.to = to;
}

LombardiEdge.prototype.draw = function (ctx) {
    const x1 = this.from.x;
    const y1 = this.from.y;
    const x2 = this.to.x;
    const y2 = this.to.y;
    const x3 = this.mid.x;
    const y3 = this.mid.y;

    let [x0, y0] = circumcircleCenter(x1, y1, x2, y2, x3, y3);

    let theta1 = angleOf(x1 - x0, y1 - y0);
    let theta2 = angleOf(x2 - x0, y2 - y0);
    let theta3 = angleOf(x3 - x0, y3 - y0);

    if ((theta1 > theta3 && theta2 > theta3) || (theta3 > theta1 && theta3 > theta2)) {
        [theta1, theta2] = [Math.max(theta1, theta2) - 2 * Math.PI, Math.min(theta1, theta2)];
    }

    this.x0 = x0;
    this.y0 = y0;
    this.r = norm(x1 - x0, y1 - y0);
    this.theta1 = Math.min(theta1, theta2);
    this.theta2 = Math.max(theta1, theta2);

    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(this.x0, this.y0, this.r, this.theta1, this.theta2);
    ctx.stroke();
    ctx.closePath();
}

/* Near Lombardi-style */
export function LombardiLayout(G, k, delta) {
    ForceDirectedLayout.call(this, G, k, delta);

    this.nodes = [];
    this.edges = [];
    this.curves = [];

    for (let v of this.G.nodes) {
        Object.assign(v, new LombardiNode(false));
        this.nodes.push(v);
    }

    for (let edge of this.G.edges) {
        const x = (edge.from.getX() + edge.to.getX()) / 2;
        const y = (edge.from.getY() + edge.to.getY()) / 2;

        const v = new Node("", x, y);
        Object.assign(v, new LombardiNode(true));
        [v.nx, v.ny] = normal(edge.from.getX(), edge.from.getY(), edge.to.getX(), edge.to.getY());
        [v.nx, v.ny] = normalize(v.nx, v.ny);

        const u = new LayoutNode(x, y);
        Object.assign(v, u);
        Object.assign(v.__proto__, u.__proto__);

        this.edges.push(new Edge("", edge.from, v), new Edge("", v, edge.to));
        this.nodes.push(v);
        this.curves.push(new LombardiEdge(edge.from, v, edge.to));
    }
}

LombardiLayout.prototype = Object.create(ForceDirectedLayout.prototype);

LombardiLayout.prototype.go = function () {
    for (let v of this.nodes) {
        v.dispX = 0;
        v.dispY = 0;

        for (let u of this.nodes) {
            if (u != v) {
                let deltaX = v.getX() - u.getX();
                let deltaY = v.getY() - u.getY();
                let delta = norm(deltaX, deltaY);
                let repulsiveF = this.repulsiveForce(delta);

                v.dispX += (deltaX / delta) * repulsiveF;
                v.dispY += (deltaY / delta) * repulsiveF;
            }
        }
    }

    for (let e of this.edges) {
        let deltaX = e.from.getX() - e.to.getX();
        let deltaY = e.from.getY() - e.to.getY();
        let delta = norm(deltaX, deltaY);
        let attractiveF = this.attractiveForce(delta);

        e.from.dispX -= (deltaX / delta) * attractiveF;
        e.from.dispY -= (deltaY / delta) * attractiveF;

        e.to.dispX += (deltaX / delta) * attractiveF;
        e.to.dispY += (deltaY / delta) * attractiveF;
    }

    for (let v of this.nodes) {
        if (v.dummy) {
            let disp = norm(v.dispX, v.dispY);

            v.dispX = (v.dispX / disp) * Math.min(disp, this.t * this.k);
            v.dispY = (v.dispY / disp) * Math.min(disp, this.t * this.k);

            // find projection on normal
            const scale = dot(v.dispX, v.dispY, v.nx, v.ny);
            v.dispX = scale * v.nx;
            v.dispY = scale * v.ny;

            v.setX(v.getX() + v.dispX);
            v.setY(v.getY() + v.dispY);
        }
    }

    this.t = 0.85 * this.t;
    this.iteration += 1;
}

LombardiLayout.prototype.update = function (dt) {
    if (this.playing && this.s > 1) {
        this.go();
        this.s = 0;
    } else if (this.playingOnce && this.s > 1) {
        this.playingOnce = false;
        this.s = 1;
    }

    if (this.playing || this.playingOnce) {
        for (let v of this.nodes) {
            v.update(this.s);
        }

        this.s += dt / this.animationSpeedScale;
    }
}

LombardiLayout.prototype.draw = function (ctx) {
    for (let curve of this.curves) {
        curve.draw(ctx);
    }

    for (let edge of this.edges) {
        edge.draw(ctx);
    }

    for (let v of this.nodes) {
        if (!v.dummy) {
            v.draw(ctx);
        }
    }
}
