export function Edge(id, fromNode, toNode) {
    this.id = id;
    this.from = fromNode;
    this.to = toNode;
    this.color = "#dfe4ec";
}

Edge.prototype.draw = function(ctx) {
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.lineCap = "square";

    ctx.beginPath();
    ctx.moveTo(this.from.x, this.from.y);
    ctx.lineTo(this.to.x, this.to.y);
    ctx.stroke();
    ctx.closePath();
};