export function distance(A) {
    if (A.length > 2)
        throw new Error("Unsupported operation exception.");
    return Math.sqrt(Math.pow(A[0], 2)
        + Math.pow(A[1], 2));
}

export function arg(v) {
    if (v.length > 2)
        throw new Error("Unsupported operation exception.");

    const d = distance(v);
    let [x, y] = v;
    x /= d;
    y /= d;

    if (x >= 0 && y >= 0)
        return Math.acos(x);

    if (x <= 0 && y >= 0)
        return Math.acos(x);

    if (x <= 0 && y <= 0)
        return -Math.acos(x);

    if (x >= 0 && y <= 0)
        return Math.asin(y);
}

export function normal(A, B) {
    if (A.length > 2 || B.length > 2)
        throw new Error("Unsupported operation exception.");
    const a1 = B[0] - A[0];
    const a2 = B[1] - A[1];
    const l = distance([a1, a2]);
    return [-a2 / l, a1 / l];
}

export function dot(v, u) {
    return v.reduce((accumulator, _, i) => accumulator + v[i] * u[i], 0);
}

export function linearSolve(A, b) {
    if (A.length > 2 || A[0].length > 2)
        throw new Error("Unsupported operation exception.");
    if (b.length !== A.length)
        throw new Error(`Incompatible shapes. (${A.length}, ${A[0].length}) and (${b.length})`);
    return [
        -(A[1][1] * b[0] - A[0][1] * b[1])
        / (A[0][1] * A[1][0] - A[0][0] * A[1][1]),
        -(-A[1][0] * b[0] + A[0][0] * b[1])
        / (A[0][1] * A[1][0] - A[0][0] * A[1][1])
    ];
}

const INF = 1000;

export function floyd(w) {
    const n = w.length;
    let d = [...Array(n)].map((_, row) => {
        return w[row].map((el, col) => col === row || el === 0 ? INF : el);
    });
    for (let k = 0; k < n; k++)
        for (let i = 0; i < n; i++)
            for (let j = 0; j < n; j++)
                d[i][j] = Math.min(d[i][j], d[i][k] + d[k][j]);
    return d;
}

export function isLeftTriple(points) {
    if (points.length > 3)
        throw new Error("Unsupported operation exception.");

    const [x, y, z] = points;
    const ax = z[0] - x[0];
    const ay = z[1] - x[1];

    return dot([y[0] - x[0], y[1] - x[1]], [ay, -ax]) < 0;
}

export function circleCenter(points) {
    if (points.length > 3)
        throw new Error("Unsupported operation exception.");

    let [[x1, y1], [x2, y2], [x3, y3]] = points;

    if (x2 - x1 === 0 || x3 - x2 === 0)
        x2 += 0.1;

    let ma = (y2 - y1) / (x2 - x1);
    const mb = (y3 - y2) / (x3 - x2);

    if (ma === 0)
        ma = 0.01;

    let x = 0;

    if (mb - ma !== 0)
        x = (ma * mb * (y1 - y3)
            + mb * (x1 + x2)
            - ma * (x2 + x3))
            / (2 * (mb - ma));

    return [
        x,
        (x - (x1 + x2) / 2) / (-ma)
        + (y1 + y2) / 2
    ];
}

export function arcSegmentPoint(points, line) {
    const [x0, y0] = circleCenter(points);
    const r = distance([x0 - points[2][0], y0 - points[2][1]]);
    const leftQ1 = isLeftTriple(points);
    const [[xa, ya], [xb, yb]] = line;

    const d = Math.pow(xa - xb, 2) + Math.pow(ya - yb, 2);
    const sqr = Math.pow(r, 2) * d
        - Math.pow(
            - xb * y0
            - x0 * ya
            + xb * ya
            + xa * (y0 - yb)
            + x0 * yb,
            2)

    if (sqr < 0)
        return [];

    const t1 = ((xa - x0) * (xa - xb)
        + Math.pow(ya, 2)
        + y0 * yb
        - ya * (y0 + yb)
        - Math.sqrt(sqr)
    ) / d;

    if (0 <= t1 && t1 <= 1) {
        let [x, y] = [(1 - t1) * xa + t1 * xb, (1 - t1) * ya + t1 * yb];

        let leftQ2 = isLeftTriple([
            [points[0][0], points[0][1]],
            [x, y],
            [points[2][0], points[2][1]]
        ]);

        if (leftQ1 === leftQ2)
            return [x, y];
    }

    const t2 = ((xa - x0) * (xa - xb)
        + Math.pow(ya, 2)
        + y0 * yb
        - ya * (y0 + yb)
        + Math.sqrt(sqr)
    ) / d;

    if (0 <= t2 && t2 <= 1) {
        let [x, y] = [(1 - t2) * xa + t2 * xb, (1 - t2) * ya + t2 * yb];

        let leftQ2 = isLeftTriple([
            [points[0][0], points[0][1]],
            [x, y],
            [points[2][0], points[2][1]]
        ]);

        if (leftQ1 === leftQ2)
            return [x, y];
    }

    return [];
}

export function arcRectPoint(arc, rect) {
    const [x0, y0, width, height] = rect;
    const lines = [
        [[x0, y0], [x0, y0 + height]],
        [[x0, y0], [x0 + width, y0]],
        [[x0 + width, y0], [x0 + width, y0 + height]],
        [[x0, y0 + height], [x0 + width, y0 + height]]
    ]

    for (let line of lines) {
        const result = arcSegmentPoint(arc, line);

        if (result.length > 0)
            return result
    }

    return [];
}

export function placeInCenterOfScreen(x, y, width, height) {
    const x0 = width / 2;
    const minX = Math.min(...x);
    const originX = minX + (Math.max(...x) - minX) / 2;
    const offsetX = x0 - originX;

    const y0 = height / 2;
    const minY = Math.min(...y);
    const originY = minY + (Math.max(...y) - minY) / 2;
    const offsetY = y0 - originY;

    return [
        x.map(el => el + offsetX),
        y.map(el => el + offsetY)
    ]
}

export function getTextPositionAtPoint(ctx, text, x0, y0) {
    const metrics = ctx.measureText(text);
    const width = metrics.width;
    const height = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
    const tx = x0 - width / 2;
    const ty = y0 + height / 2;

    return [tx, ty];
}

export function getTextBoundingRect(ctx, text, x0, y0) {
    const metrics = ctx.measureText(text);
    const width = metrics.width;
    const height = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
    const tx = x0 - width / 2;
    const ty = y0 + height / 2;

    return [tx - 10, ty - 22.5, width + 20, height + 10];
}
