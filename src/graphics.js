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