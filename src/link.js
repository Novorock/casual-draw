function LinkMidpoint(from, to) {
    this.from = from;
    this.to = to;
    this.x = 0;
    this.y = 0;
    this.refine();
}

LinkMidpoint.prototype.refine = function () {
    const mx = (this.from.getX() + this.to.getX()) / 2;
    const my = (this.from.getY() + this.to.getY()) / 2;
    let [nx, ny] = normal(this.to.getX(), this.to.getY(), this.from.getX(), this.from.getY());
    [nx, ny] = normalize(nx, ny);
    this.x = mx + 20 * nx;
    this.y = my + 20 * ny;
}

LinkMidpoint.prototype.getX = function () {
    return this.x;
}

LinkMidpoint.prototype.getY = function () {
    return this.y;
}

export function Link(from, to) {
    this.from = from;
    this.to = to;
    this.midpoint = new LinkMidpoint(from, to);
    [this.jointx1, this.jointy1] = [0, 0];
    [this.jointx2, this.jointy2] = [0, 0];
    [this.pivotx, this.pivoty] = [0, 0];
    this.r = 0;
    this.refineJoint();
    this.refinePivot();
    this.resolveAngles();
}

Link.prototype.refinePivot = function () {
    [this.pivotx, this.pivoty] = circumcircleCenter(
        this.jointx1, this.jointy1,
        this.jointx2, this.jointy2,
        this.midpoint.getX(), this.midpoint.getY()
    );
}

Link.prototype.refineJoint = function () {
    [this.jointx1, this.jointy1] = [this.from.getX(), this.from.getY()];
    [this.jointx2, this.jointy2] = [this.to.getX(), this.to.getY()];
}

Link.prototype.resolveAngles = function () {
    const x1 = this.from.getX();
    const y1 = this.from.getY();
    const x2 = this.to.getX();
    const y2 = this.to.getY();
    const x3 = this.midpoint.getX();
    const y3 = this.midpoint.getY();

    let theta1 = angleOf(x1 - this.pivotx, y1 - this.pivoty);
    let theta2 = angleOf(x2 - this.pivotx, y2 - this.pivoty);
    let theta3 = angleOf(x3 - this.pivotx, y3 - this.pivoty);

    if ((theta1 > theta3 && theta2 > theta3) || (theta3 > theta1 && theta3 > theta2)) {
        [theta1, theta2] = [Math.max(theta1, theta2) - 2 * Math.PI, Math.min(theta1, theta2)];
    }

    this.theta1 = Math.min(theta1, theta2) + Math.PI / 20;
    this.theta2 = Math.max(theta1, theta2) - Math.PI / 20;
}

Link.prototype.draw = function (ctx) {
    ctx.strokeStyle = "#dfe4ec";
    ctx.lineWidth = 2;
    ctx.lineCap = "square";

    ctx.beginPath();
    ctx.moveTo(this.from.getX(), this.from.getY());
    ctx.lineTo(this.to.getX(), this.to.getY());
    ctx.stroke();
    ctx.closePath();

    this.r = norm(this.pivotx - this.jointx1, this.pivoty - this.jointy1);

    ctx.lineWidth = 1;

    ctx.strokeStyle = "#000000";
    ctx.beginPath();
    ctx.arc(this.pivotx, this.pivoty, this.r, this.theta1, this.theta2);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(this.midpoint.getX(), this.midpoint.getY(), 3, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
}