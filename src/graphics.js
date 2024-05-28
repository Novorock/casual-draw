import { circleCenter, distance, arg, isLeftTriple } from "../lib/math.js";

export function drawArc(ctx, points) {
    if (points[0][1] === points[1][1] && points[1][1] === points[2][1])
        points[1][1] += 0.5;

    const [x, y] = circleCenter(points);
    const r = distance([x - points[0][0], y - points[0][1]]);
    const counterclockwise = !isLeftTriple(points);

    let theta1 = arg([
        points[2][0] - x,
        points[2][1] - y
    ]);

    let theta2 = arg([
        points[0][0] - x,
        points[0][1] - y
    ]);

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