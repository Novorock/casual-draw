import { circleCenter, distance, det, arg, isLeftTriple, arcRectPoint } from "../lib/math.js";

export class Arc {
    constructor(ctx, cascade) {
        this.ctx = ctx;

        let [[x1, y1], [x2, y2], [x3, y3]] = cascade;
        const [ax, ay] = [x2 - x1, y2 - y1];

        if (Math.abs(det([[ax, ay], [x3 - x2, y3 - y2]])) < 0.08) {
            const l = distance([ax, ay]);

            [x2, y2] = [x2 + 8 * ay / l, y2 - 8 * ax / l];
        }

        [this.x, this.y] = circleCenter([[x1, y1], [x2, y2], [x3, y3]]);
        this.isNearStraightLine = Math.abs(this.x) > 1000000 && Math.abs(this.y) > 1000000;

        if (!this.isNearStraightLine) {
            this.r = distance([this.x - x1, this.y - y1]);
            this.counterclockwise = !isLeftTriple([[x1, y1], [x2, y2], [x3, y3]]);

            this.theta1 = arg([x3 - this.x, y3 - this.y]);
            this.theta2 = arg([x1 - this.x, y1 - this.y]);

            if (this.counterclockwise) {
                let t = this.theta1;
                this.theta1 = this.theta2;
                this.theta2 = t;
            }

            if (this.theta2 < this.theta1) {
                this.theta2 += 2 * Math.PI;
            }
        }

        this.cascade = [[x1, y1], [x2, y2], [x3, y3]];
    }

    draw() {
        if (this.isNearStraightLine) {
            this.ctx.moveTo(this.cascade[0][0], this.cascade[0][1]);
            this.ctx.lineTo(this.cascade[1][0], this.cascade[1][1]);
        } else {
            this.ctx.arc(this.x, this.y, this.r, this.theta1, this.theta2);
        }
    }
}

export class ArrowHead {
    constructor(ctx, arc, text, l) {
        this.ctx = ctx;
        this.arc = arc;
        this.l = l;

        const [x0, y0] = [arc.x, arc.y];
        const r = arc.r;

        const deltaPhi = l / r;
        const sign = arc.counterclockwise ? -1 : 1;

        const [jx, jy] = this.joint(text);

        const t = arg([jx - x0, jy - y0]) + sign * deltaPhi;
        const cost = Math.cos(t);
        const sint = Math.sin(t);
        const [x, y] = [x0 + r * cost, y0 + r * sint];
        const [nx, ny] = [-cost, -sint];

        [this.A, this.B, this.C] = [
            [x - l * nx / 2, y - l * ny / 2],
            [x + l * nx / 2, y + l * ny / 2],
            [jx, jy]
        ];

        this.arcX = x;
        this.arcY = y;
    }

    joint(text) {
        const rect = text.getBoundingRect();
        const intersection = arcRectPoint(this.arc.cascade, rect);

        return intersection.length > 0 ? intersection : [this.arc.cascade[2][0], this.arc.cascade[2][1]];
    }

    getBoundingRect() {
        const minX = Math.min(this.A[0], this.B[0], this.C[0]);
        const maxX = Math.max(this.A[0], this.B[0], this.C[0]);
        const minY = Math.min(this.A[1], this.B[1], this.C[1]);
        const maxY = Math.max(this.A[1], this.B[1], this.C[1]);

        return [minX, minY, maxX - minX, maxY - minY];
    }

    draw() {
        this.ctx.lineTo(...this.A);
        this.ctx.lineTo(...this.B);
        this.ctx.lineTo(...this.C);
    }
}

export class Text {
    constructor(ctx, text, x, y, expectedWidth) {
        const words = text.trim().split(" ").map(w => w.trim());
        const lines = [];

        if (words.length < 1)
            lines.push("");
        else
            lines.push(words[0]);

        for (let i = 1; i < words.length; i++) {
            const line = lines.pop();
            const newLine = line + " " + words[i];
            let width = ctx.measureText(newLine).width;

            if (width <= expectedWidth) {
                lines.push(newLine);
            } else {
                lines.push(line, words[i]);
            }
        }

        this.widths = lines.map(line => ctx.measureText(line).width);
        const metrics = ctx.measureText(lines[0]);
        this.lineHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent
        this.height = lines.length * this.lineHeight + 5 * (lines.length - 2);

        const maxWidth = Math.max(...this.widths);

        this.rect = [x - maxWidth / 2 - 10, y - this.height / 2 - 10, maxWidth + 20, this.height + 20];

        this.ctx = ctx;
        this.lines = lines;
        this.x = x;
        this.y = y;
    }

    getBoundingRect() {
        return this.rect;
    }

    draw() {
        const maxWidth = Math.max(...this.widths);

        for (let i = 0; i < this.lines.length; i++) {
            const width = this.widths[i];
            const x = this.x - maxWidth / 2 + (maxWidth - width) / 2;
            const y = this.y - this.height / 2 + i * this.lineHeight + i * 5 + 15;
            this.ctx.fillText(this.lines[i], x, y);
        }
    }
}

export function calculatePositionsForLabel(arrowHead) {
    const [ax1, ay1] = [arrowHead.A[0] - arrowHead.C[0], arrowHead.A[1] - arrowHead.C[1]];
    const [ax2, ay2] = [arrowHead.B[0] - arrowHead.C[0], arrowHead.B[1] - arrowHead.C[1]];

    const [x, y] = [arrowHead.arcX, arrowHead.arcY];
    const [ax3, ay3] = [arrowHead.B[0] - x, arrowHead.B[1] - y];
    const [ax4, ay4] = [arrowHead.B[0] - x, arrowHead.B[1] - y];

    return [
        [arrowHead.C[0] + 2.5 * ax1, arrowHead.C[1] + 2.5 * ay1],
        [arrowHead.C[0] + 2.5 * ax2, arrowHead.C[1] + 2.5 * ay2],
        [x + 3.5 * ax3, y + 3.5 * ay3],
        [x + 3.5 * ax4, y + 3.5 * ay4]
    ]
}
