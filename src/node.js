export function Node(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.r = 15;
    this.label = `${id}`;
    this.color = "#aaaaaa";
}

Node.prototype.draw = function(ctx) {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
    ctx.stroke();
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "black";
    ctx.font = "20px serif";
    
    const metrics = ctx.measureText(this.id);
    const w = metrics.width;

    ctx.fillText(this.id, this.x - w / 2, this.y + 5);

    ctx.fillStyle = "#000000";
}

export function DummyNode(id, x, y) {
    this.id ="";
    this.x = x;
    this.y = y;
    this.r = 4;
    this.label = `${id}`;
    this.color = "#ea4335";
}

DummyNode.prototype = new Node();
