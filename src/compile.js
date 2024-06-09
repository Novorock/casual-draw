import { Translator, LxLinkHead } from "../lib/lexer.js";
import { KKLayout } from "../lib/layout/kamada.js";
import { distance, hasIntersection } from "../lib/math.js";
import { FRLayout } from "../lib/layout/fruchterman.js";
import { Text, Arc, ArrowHead, calculatePositionsForLabel, Delay } from "./graphics.js";

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

        const canvas = document.getElementById("canvas");
        const layout = new Layout(vertexPool, linkPool, canvas.width, canvas.height);
        const edges = layout.getEdges();
        const [x, y] = [layout.getX(), layout.getY()];

        const colorResolver = new EdgeColorResolver(vertexPool, linkPool);
        const vertices = new Set();

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const delayResolver = new EdgeDelayResolver(vertexPool, linkPool);

        for (let edge of edges) {
            const causalEdge = new CausalEdge(ctx, colorResolver.resolveColorFor(edge).hex, edge.map(v => [x[v], y[v]]));
            causalEdge.draw();

            if (delayResolver.resolveDelayFor(edge))
                new Delay(ctx, causalEdge.getArc()).draw();

            for (let index of edge) {
                if (!layout.isDummy(index)) {
                    vertices.add(index);
                }
            }
        }

        const vertToText = new Map();
        const labelResolver = new LabelResolver(ctx);

        for (let v of vertices) {
            const text = vertexPool.getVertexByIndex(v).text;
            const causalVertex = new CausalVertex(ctx, text, x[v], y[v]);

            if (vertexPool.getVertexByIndex(v).framed)
                causalVertex.setFramed();

            causalVertex.draw();
            vertToText.set(v, causalVertex.getTextElement());
            labelResolver.registerElement(causalVertex.getTextElement());
        }

        const polarityResolver = new EdgePolarityResolver(vertexPool, linkPool);

        for (let edge of edges) {
            const color = colorResolver.resolveColorFor(edge).hex;
            const causalArrowHead = new CausalArrowHead(ctx, color, edge.map(v => [x[v], y[v]]), vertToText.get(edge[2]))

            causalArrowHead.draw();

            const arrowHead = causalArrowHead.getArrowHead();
            labelResolver.registerElement(arrowHead);

            const symbol = polarityResolver.resolvePolarityFor(edge).symbol;
            const label = labelResolver.resolveLabelFor(arrowHead, symbol, color);

            if (label)
                label.draw();
        }
    } catch (e) {
        const notification = new CompileErrorNotification(str, e);
        notification.show();
    }
}

class Layout {
    constructor(vertexPool, linkPool, screenWidth, screenHeight) {
        const l = 750;
        const kklayout = new KKLayout(new AdjacencyMatrix(vertexPool, linkPool).matrix, l, 10);
        kklayout.run();

        const scale = new Scale(screenWidth, screenHeight, l, l);
        const [kx, ky] = [scale.scaleX(kklayout.getX()), scale.scaleY(kklayout.getY())];

        const matrix = new AdjacencyMatrix(vertexPool, linkPool).matrix;
        let sum = 0;
        let count = 0;

        for (let i = 0; i < matrix.length; i++)
            for (let j = 0; j < matrix.length; j++)
                if (matrix[i][j] != 0 && i != j) {
                    sum += distance([kx[i] - kx[j], ky[i] - ky[j]]);
                    count++;
                }

        const k = sum / count / 3.2;
        const frlayout = new FRLayout(new AdjacencyMatrix(vertexPool, linkPool).matrix, kx, ky, k);
        frlayout.run();

        this.layout = frlayout.getLayout();
        [this.x, this.y] = [frlayout.getX(), frlayout.getY()];
        this.dummies = frlayout.getDummiesIndices();
    }

    getEdges() {
        return this.layout;
    }

    getX() {
        return this.x;
    }

    getY() {
        return this.y;
    }

    isDummy(index) {
        return this.dummies.has(index);
    }
}

class CausalEdge {
    constructor(ctx, color, cascade) {
        this.ctx = ctx;
        this.color = color;
        this.arc = new Arc(ctx, cascade);
    }

    getArc() {
        return this.arc;
    }

    draw() {
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = 2;
        this.arc.draw();
    }
}

class CausalArrowHead {
    constructor(ctx, color, cascade, stickTo) {
        this.ctx = ctx;
        this.color = color;
        this.arrowHead = new ArrowHead(ctx, new Arc(ctx, cascade), stickTo, 15);
    }

    getArrowHead() {
        return this.arrowHead;
    }

    draw() {
        this.ctx.fillStyle = this.ctx.strokeStyle = this.color;
        this.arrowHead.draw();
    }
}

class CausalVertex {
    constructor(ctx, text, x, y) {
        this.ctx = ctx;
        this.textElement = new Text(ctx, text, x, y, 150);
    }

    getTextElement() {
        return this.textElement;
    }

    setFramed() {
        this.isFramed = true;
    }

    draw() {
        this.ctx.font = "20px Sans-Serif";

        if (this.isFramed) {
            this.ctx.lineWidth = 3;
            this.ctx.strokeStyle = "#000000";
        } else {
            this.ctx.strokeStyle = "#ffffff";
        }

        this.ctx.fillStyle = "#ffffff";
        this.ctx.beginPath();
        this.ctx.rect(...this.textElement.getBoundingRect());
        this.ctx.stroke();
        this.ctx.fill();

        this.ctx.fillStyle = "#000000";
        this.textElement.draw();
    }
}

class LabelResolver {
    constructor(ctx) {
        this.ctx = ctx;
        this.elements = [];
    }

    registerElement(element) {
        this.elements.push(element);
    }

    resolveLabelFor(arrowHead, symbol, color) {
        this.ctx.strokeStyle = color;

        if (symbol != null) {
            const attempts = calculatePositionsForLabel(arrowHead);

            for (let i = 0; i < attempts.length; i++) {
                const newLabel = new Text(this.ctx, symbol, ...attempts[i], 15);
                let intersectionFound = false;

                for (let element of this.elements) {
                    const rect1 = element.getBoundingRect();
                    const rect2 = newLabel.getBoundingRect();

                    if (hasIntersection(rect1, rect2)) {
                        intersectionFound = true;
                        break;
                    }
                }

                if (!intersectionFound) {
                    this.registerElement(newLabel);
                    return newLabel;
                }
            }

            const newLabel = new Text(this.ctx, symbol, ...attempts[0], 15);
            this.registerElement(newLabel);

            return newLabel;
        }
    }
}

class Scale {
    constructor(screenWidth, screenHeight, width, height) {
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        this.width = width;
        this.height = height;
    }

    scale(x, w, W) {
        const x0 = Math.min(...x);
        const k = w / (Math.max(...x) - x0);
        const X0 = (W - w) / 2;
        const dx = X0 - x0;

        return x.map(xx => x0 + k * (xx - x0) + dx);
    }

    scaleX(x) {
        return this.scale(x, this.width, this.screenWidth);
    }

    scaleY(y) {
        return this.scale(y, this.height, this.screenHeight);
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

        throw new Error(`Unknown polarity for ${hash}`);
    }
}

class EdgeDelayResolver {
    constructor(vertexPool, linkPool) {
        this.edge2Delay = new Map();

        for (let link of linkPool.asArray()) {
            const left = vertexPool.getIndex(link.left);
            const right = vertexPool.getIndex(link.right);

            this.edge2Delay.set(this.hash(left, right), link.delayed);
        }
    }

    hash(left, right) {
        return (100 + left) * 100 + right;
    }

    resolveDelayFor(edge) {
        const hash = this.hash(edge[0], edge[2]);

        if (this.edge2Delay.has(hash))
            return this.edge2Delay.get(hash);

        throw new Error(`Unknown delay for ${hash}`);
    }
}
