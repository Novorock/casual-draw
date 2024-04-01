function point_circle_test(px, py, cx, cy, r) {
    return (px - cx) * (px - cx) + (py - cy) * (py - cy) <= r * r;
}

function norm(x, y) {
    return Math.sqrt(x * x + y * y);
}

function normal(x0, y0, x1, y1) {
    return [y0 - y1, x1 - x0];
}

function normalize(x, y) {
    const n = norm(x, y);
    return [x / n, y / n];
}

function dot(x0, y0, x1, y1) {
    return x0 * x1 + y0 * y1;
}

function smoothstep(s) {
    return s * s * (3.0 - 2.0 * s);
}

function smootherstep(s) {
    return s * s * s * (s * (6 * s - 15) + 10);
}

function lerp(x0, x, s) {
    const fs = smootherstep(s);
    return (1 - fs) * x0 + fs * x;
}

function circumcircleCenter(x1, y1, x2, y2, x3, y3) {
    const x1x1 = x1 * x1;
    const x2x2 = x2 * x2;
    const x3x3 = x3 * x3;

    const y1y1 = y1 * y1;
    const y2y2 = y2 * y2;
    const y3y3 = y3 * y3;

    const tmp1 = x3x3 * (y2 - y1) + x2x2 * (y1 - y3) - (x1x1 + (y1 - y2) * (y1 - y3)) * (y2 - y3);
    const tmp2 = 2 * (x3 * (y2 - y1) + x2 * (y1 - y3) + x1 * (y3 - y2));
    const x0 = tmp1 / tmp2;

    const tmp3 = -x2x2 * x3 + x1x1 * (x3 - x2) + x3 * (y1 - y2) * (y1 + y2) + x1 * (x2x2 - x3x3 + y2y2 - y3y3) + x2 * (x3x3 - y1y1 + y3y3);
    const tmp4 = 2 * (x3 * (y1 - y2) + x1 * (y2 - y3) + x2 * (y3 - y1));
    const y0 = tmp3 / tmp4;

    return [x0, y0];
}

function angleOf(xi, et) {
    let [x, y] = normalize(xi, et);

    if (x >= 0 && y >= 0) {
        return Math.acos(x);
    } else if (x <= 0 && y >= 0) {
        return Math.acos(x);
    } else if (x <= 0 && y <= 0) {
        return Math.PI - Math.asin(y);
    } else {
        return 2 * Math.PI + Math.asin(y);
    }
}
