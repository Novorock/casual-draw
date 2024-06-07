import { Translator, LxLinkHead } from "../lib/lexer.js";
import { KKLayout } from "../lib/layout/kamada.js";
import { placeInCenterOfScreen, hasIntersection } from "../lib/math.js";
import { FRLayout } from "../lib/layout/fruchterman.js";
import { Text, Arc, ArrowHead, calculatePositionsForLabel } from "./graphics.js";

const errorContainer = document.getElementById("error-container");
const errorWindow = document.getElementById("error-window");

var error = {
    log: function (line) {
        const errorLine = document.createElement("div");
        errorLine.innerText = line;
        errorWindow.appendChild(errorLine);
    },
    clear: function () {
        while (errorWindow.firstChild) {
            errorWindow.removeChild(errorWindow.lastChild);
        }
    },
    setVisible: function (visible) {
        if (visible) {
            errorWindow.style.visibility = "visible";
            errorContainer.style.visibility = "visible";
        } else {
            errorWindow.style.visibility = "hidden";
            errorContainer.style.visibility = "hidden";
        }
    }
};

class CompileErrorNotification {
    constructor(str, e) {
        const message = e.message;
        this.messages = [message];

        const regex = /position: \d*/;
        const exec = regex.exec(message);

        if (exec != null && exec.length > 0) {
            const right = exec[0].split(" ")[1].trim();
            const position = Number(right);
            let row = 1;
            let col = 0;
            let i = 0;

            while (i != position && i < str.length) {
                if (str[i] === '\n') {
                    row++;
                    col = 0;
                }

                col++;
                i++;
            }

            this.messages.push(`The problem is a sequence, starting from row: ${row}, col: ${col}`);
        }
    }

    show() {
        error.clear();

        for (let msg of this.messages) {
            error.log(msg);
        }

        error.setVisible(true);
    }
}

export function compile(str) {
    error.setVisible(false);

    const traslator = new Translator();

    try {
        traslator.translate(str);

        const vertexPool = traslator.getVertexPool();
        const linkPool = traslator.getLinkPool();

        if (vertexPool.length < 1 || linkPool.length < 1)
            return;

        const l = 650;
        const kklayout = new KKLayout(new AdjacencyMatrix(vertexPool, linkPool).matrix, l, 10);
        kklayout.run();

        const frlayout = new FRLayout(new AdjacencyMatrix(vertexPool, linkPool).matrix, kklayout.getX(), kklayout.getY(), l / 11.1);
        frlayout.run();

        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const layout = frlayout.getLayout();
        const [x, y] = placeInCenterOfScreen(frlayout.getX(), frlayout.getY(), canvas.width, canvas.height);

        const colorResolver = new EdgeColorResolver(vertexPool, linkPool);

        const colored = new Set();
        const vertices = [];

        frlayout.getDummiesIndices().forEach(v => colored.add(v));
        // ctx.setTransform(0.7, 0, 0, 0.7, 0, 0);

        for (let edge of layout) {
            const [i1, i2, i3] = edge;
            const [p1, p2, p3] = [[x[i1], y[i1]], [x[i2], y[i2]], [x[i3], y[i3]]];

            ctx.strokeStyle = colorResolver.resolveColorFor(edge).hex;
            ctx.lineWidth = 2;
            ctx.beginPath();
            new Arc(ctx, [p1, p2, p3]).draw();
            ctx.stroke();

            for (let index of edge) {
                if (!colored.has(index)) {
                    colored.add(index);
                    vertices.push(index);
                }
            }
        }

        const vertToText = new Map();
        const boxes = [];

        while (vertices.length > 0) {
            const index = vertices.pop();

            ctx.font = "20px Sans-Serif";

            if (vertexPool.getVertexByIndex(index).bounded) {
                ctx.lineWidth = 3;
                ctx.strokeStyle = "#000000";
            } else {
                ctx.strokeStyle = "#ffffff";
            }

            const text = vertexPool.getVertexByIndex(index).text;
            const textElement = new Text(ctx, text, x[index], y[index], 150);
            vertToText.set(index, textElement);
            boxes.push(textElement.getBoundingRect());

            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.rect(...textElement.getBoundingRect());
            ctx.stroke();
            ctx.fill();

            ctx.fillStyle = "#000000";
            textElement.draw();
        }

        const polarityResolver = new EdgePolarityResolver(vertexPool, linkPool);

        for (let edge of layout) {
            let [i1, i2, i3] = edge;
            const [p1, p2, p3] = [[x[i1], y[i1]], [x[i2], y[i2]], [x[i3], y[i3]]];
            const textElement = vertToText.get(i3);

            const arrowHead = new ArrowHead(ctx, new Arc(ctx, [p1, p2, p3]), textElement, 15);
            boxes.push(arrowHead.getBoundingRect());

            ctx.fillStyle = ctx.strokeStyle = colorResolver.resolveColorFor(edge).hex;

            ctx.beginPath();
            arrowHead.draw();
            ctx.stroke();
            ctx.fill();

            const symbol = polarityResolver.resolvePolarityFor(edge).symbol;

            if (symbol != null) {
                const attempts = calculatePositionsForLabel(arrowHead);

                for (let i = 0; i < attempts.length; i++) {
                    const newLabel = new Text(ctx, symbol, ...attempts[i], 15);
                    let intersectionFound = false;

                    for (let box of boxes) {
                        const rect = newLabel.getBoundingRect();

                        if (hasIntersection(box, rect)) {
                            intersectionFound = true;
                            break;
                        }
                    }

                    if (!intersectionFound) {
                        ctx.beginPath();
                        newLabel.draw();
                        ctx.stroke();
                        ctx.fill();

                        boxes.push(newLabel.getBoundingRect());
                        break;
                    }

                    if (intersectionFound && i === attempts.length - 1) {
                        ctx.beginPath();
                        const newLabel = new Text(ctx, symbol, ...attempts[i], 15);
                        ctx.stroke();
                        ctx.fill();

                        boxes.push(newLabel.getBoundingRect());
                    }
                }
            }
        }
    } catch (e) {
        const notification = new CompileErrorNotification(str, e);
        notification.show();
    }
}

class AdjacencyMatrix {
    constructor(vertexPool, linkPool) {
        const n = vertexPool.getCount();

        this.matrix = [...Array(n)].map(() => {
            const row = [...Array(n)];

            for (let col = 0; col < n; col++) {
                row[col] = 0;
            }

            return row;
        });

        for (let link of linkPool.asArray()) {
            const left = vertexPool.getIndex(link.left);
            const right = vertexPool.getIndex(link.right);

            this.matrix[left][right] = 1;
        }
    }
}

class LinkColor {
    constructor(head) {
        this.hex = "yellow";

        if (head === LxLinkHead["DEFAULT"])
            this.hex = "#000000";
        else if (head === LxLinkHead["POSITIVE"])
            this.hex = "#08ABED";
        else if (head === LxLinkHead["NEGATIVE"])
            this.hex = "#C73544";
    }
}

class EdgeColorResolver {
    constructor(vertexPool, linkPool) {
        this.edge2Color = new Map();

        for (let link of linkPool.asArray()) {
            const left = vertexPool.getIndex(link.left);
            const right = vertexPool.getIndex(link.right);

            this.edge2Color.set(this.hash(left, right), new LinkColor(link.head));
        }
    }

    hash(left, right) {
        return (100 + left) * 100 + right;
    }

    resolveColorFor(edge) {
        const hash = this.hash(edge[0], edge[2]);

        if (this.edge2Color.has(hash))
            return this.edge2Color.get(hash);

        throw new Error(`Unknown color for ${hash}`);
    }
}

class LinkPolarity {
    constructor(head) {
        this.symbol = null;

        if (head === LxLinkHead["POSITIVE"])
            this.symbol = "+";
        if (head === LxLinkHead["NEGATIVE"])
            this.symbol = "-";
    }
}

class EdgePolarityResolver {
    constructor(vertexPool, linkPool) {
        this.edge2Polarity = new Map();

        for (let link of linkPool.asArray()) {
            const left = vertexPool.getIndex(link.left);
            const right = vertexPool.getIndex(link.right);

            this.edge2Polarity.set(this.hash(left, right), new LinkPolarity(link.head));
        }
    }

    hash(left, right) {
        return (100 + left) * 100 + right;
    }

    resolvePolarityFor(edge) {
        const hash = this.hash(edge[0], edge[2]);

        if (this.edge2Polarity.has(hash))
            return this.edge2Polarity.get(hash);

        throw new Error(`Unknown color for ${hash}`);
    }
}
