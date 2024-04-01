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

export function Graph(adjacency) {
    this.adjacency = adjacency;
    this.nodes = [];
    this.edges = [];
    this.count = adjacency.length;

    for (let i = 0; i < this.count; i++) {
        this.nodes.push(
            new Node(`${i + 1}`, 1000 * Math.random(), 900 * Math.random())
        );
    }

    for (let i = 0; i < this.count; i++) {
        for (let j = 0; j < this.count; j++) {
            if (this.adjacency[i][j]) {
                this.edges.push(new Edge(`${i}->${j}`, this.nodes[i], this.nodes[j]));
            }
        }
    }
}

Graph.prototype.draw = function (ctx) {
    for (let edge of this.edges) {
        edge.draw(ctx);
    }

    for (let node of this.nodes) {
        node.draw(ctx);
    }
}