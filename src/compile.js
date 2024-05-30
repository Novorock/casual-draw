import { Translator, LxLinkHead } from "../lib/lexer.js";
import { KKLayout } from "../lib/layout/kamada.js";
import { arcRectPoint, getTextBoundingRect, getTextPositionAtPoint, placeInCenterOfScreen } from "../lib/math.js";
import { FRLayout } from "../lib/layout/fruchterman.js";
import { Text, drawArc, drawArrowHead } from "./graphics.js";

export function compile(str) {
    const traslator = new Translator();
    traslator.translate(str);

    const vertexPool = traslator.getVertexPool();
    const linkPool = traslator.getLinkPool();
    const adjacency = getAdjacencyMatrix(vertexPool, linkPool);

    const l = 650;
    const kklayout = new KKLayout(adjacency, l, 10);
    kklayout.run();

    const adj = getAdjacencyMatrix(vertexPool, linkPool);
    const frlayout = new FRLayout(adj, kklayout.getX(), kklayout.getY(), l / 7.9);
    frlayout.run();

    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const layout = frlayout.getLayout();
    const [x, y] = placeInCenterOfScreen(frlayout.getX(), frlayout.getY(), canvas.width, canvas.height);

    const colorMap = getColorMap(vertexPool, linkPool);
    const colored = new Set();
    const vertices = [];

    frlayout.getDummiesIndices().forEach(v => colored.add(v));

    for (let edge of layout) {
        const [i1, i2, i3] = edge;
        const [p1, p2, p3] = [[x[i1], y[i1]], [x[i2], y[i2]], [x[i3], y[i3]]];

        ctx.strokeStyle = colorMap.get(`${i1}&${i3}`);
        ctx.lineWidth = 2;
        ctx.beginPath();
        drawArc(ctx, [p1, p2, p3]);
        ctx.stroke();

        for (let index of edge) {
            if (!colored.has(index)) {
                colored.add(index);
                vertices.push(index);
            }
        }
    }

    const vertToText = new Map();

    while (vertices.length > 0) {
        const index = vertices.pop();

        ctx.font = "20px Sans-Serif";
        const text = vertexPool.getVertexByIndex(index).text;

        if (vertexPool.getVertexByIndex(index).bounded) {
            ctx.lineWidth = 3;
            ctx.strokeStyle = "#000000";
        } else {
            ctx.strokeStyle = "#ffffff";
        }

        const textElement = new Text(ctx, text, x[index], y[index], 150);
        vertToText.set(index, textElement);

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.rect(...textElement.getBoundingRect());
        ctx.stroke();
        ctx.fill();

        ctx.fillStyle = "#000000";
        textElement.draw();

        // ctx.fillStyle = "#ffffff";
        // ctx.beginPath();
        // ctx.rect(...getTextBoundingRect(ctx, text, x[index], y[index]));
        // ctx.stroke();
        // ctx.fill();

        // ctx.fillStyle = "#000000";
        // ctx.fillText(text, ...getTextPositionAtPoint(ctx, text, x[index], y[index]));
    }

    for (let edge of layout) {
        let [i1, i2, i3] = edge;
        const [p1, p2, p3] = [[x[i1], y[i1]], [x[i2], y[i2]], [x[i3], y[i3]]];
        // const rect = getTextBoundingRect(ctx, vertexPool.getVertexByIndex(i3).text, ...p3);
        const rect = vertToText.get(i3).getBoundingRect();
        const result = arcRectPoint([p1, p2, p3], rect);

        ctx.fillStyle = ctx.strokeStyle = colorMap.get(`${i1}&${i3}`);

        if (result.length > 0) {
            ctx.beginPath();
            drawArrowHead(ctx, [p1, p2, result], 15);
            ctx.stroke();
            ctx.fill();
        }
    }
}

function getAdjacencyMatrix(vertexPool, linkPool) {
    const n = vertexPool.getCount();

    const adjacency = [...Array(n)].map(() => {
        const row = [...Array(n)];

        for (let col = 0; col < n; col++) {
            row[col] = 0;
        }

        return row;
    });

    for (let link of linkPool.asArray()) {
        const left = vertexPool.getIndex(link.left);
        const right = vertexPool.getIndex(link.right);

        adjacency[left][right] = 1;
    }

    return adjacency;
}

function getColorMap(vertexPool, linkPool) {
    const colorMap = new Map();

    for (let link of linkPool.asArray()) {
        const head = link.head;
        let color = "yellow";

        if (head === LxLinkHead["DEFAULT"])
            color = "#000000";
        else if (head === LxLinkHead["POSITIVE"])
            color = "#08ABED";
        else if (head === LxLinkHead["NEGATIVE"])
            color = "#C73544";

        const left = vertexPool.getIndex(link.left);
        const right = vertexPool.getIndex(link.right);

        colorMap.set(`${left}&${right}`, color);
    }

    return colorMap;
}
