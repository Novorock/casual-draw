import { circleCenter, distance, det, arg, isLeftTriple } from "../lib/math.js";

export function drawArc(ctx, points) {
    let [[x1, y1], [x2, y2], [x3, y3]] = points;

    if (y1 === y2 && y2 === y3)
        y2 += 0.5;

    const [ax, ay] = [x2 - x1, y2 - y1];

    if (Math.abs(det([[ax, ay], [x3 - x2, y3 - y2]])) < 0.001) {
        const l = distance([ax, ay]);

        [x2, y2] = [x2 - 5 * ay / l, y2 + 5 * ax / l];
    }

    const [x, y] = circleCenter([[x1, y1], [x2, y2], [x3, y3]]);

    if (Math.abs(x) > 1000000 && Math.abs(y) > 1000000) {
        ctx.moveTo(x1, y1);
        ctx.lineTo(x3, y3);
        return;
    }

    const r = distance([x - x1, y - y1]);
    const counterclockwise = !isLeftTriple([[x1, y1], [x2, y2], [x3, y3]]);

    let theta1 = arg([x3 - x, y3 - y]);
    let theta2 = arg([x1 - x, y1 - y]);

    if (counterclockwise) {
        let t = theta1;
        theta1 = theta2;
        theta2 = t;
    }

    if (theta2 < theta1) {
        theta2 += 2 * Math.PI;
    }

    ctx.arc(x, y, r, theta1, theta2);
}

export function drawArrowHead(ctx, points, l) {
    const [x0, y0] = circleCenter(points);
    const r = distance([x0 - points[0][0], y0 - points[0][1]]);

    const deltaPhi = l / r;
    const sign = isLeftTriple(points) ? 1 : -1;

    const t = arg([points[2][0] - x0, points[2][1] - y0]) + sign * deltaPhi;
    const cost = Math.cos(t);
    const sint = Math.sin(t);
    const [x, y] = [x0 + r * cost, y0 + r * sint];
    const [nx, ny] = [-cost, -sint];

    ctx.lineTo(x - l * nx / 2, y - l * ny / 2);
    ctx.lineTo(x + l * nx / 2, y + l * ny / 2);
    ctx.lineTo(points[2][0], points[2][1]);
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
