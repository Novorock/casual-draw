import { Node } from "./node.js";
import { Edge } from "./edge.js";

export function Graph(count) {
    this.nodes = [];
    this.edges = [];

    // count = 8;
    // const src = [
    //     { from: 1, to: 2 },
    //     { from: 1, to: 3 },
    //     { from: 1, to: 4 },
    //     { from: 1, to: 5 },
    //     { from: 2, to: 4 },
    //     { from: 2, to: 8 },
    //     { from: 3, to: 6 },
    //     { from: 3, to: 8 },
    //     { from: 4, to: 6 },
    //     { from: 4, to: 7 }
    // ];
    
    count = 7;
    const src = [
        { from: 1, to: 2 },
        { from: 1, to: 3 },
        { from: 1, to: 4 },
        { from: 2, to: 4 },
        { from: 7, to: 4 },
        { from: 4, to: 3 },
        { from: 6, to: 4 },
        { from: 5, to: 6 },
        { from: 5, to: 2 },
        { from: 3, to: 5 },
        { from: 3, to: 2}
    ];

    this.adjacency = [...Array(8)].map((v1, i) => {
        return [...Array(8)].map((v2, j) => { return false; });
    });

    for (let i = 0; i < count; i++) {
        this.nodes.push(
            new Node(`${i}`, 250 * Math.random() + 350, 250 * Math.random() + 300)
        );
    }

    for (let s of src) {
        this.adjacency[s.from - 1][s.to - 1] = true;
    }

    for (let i = 0; i < count; i++) {
        for (let j = 0; j < count; j++) {
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