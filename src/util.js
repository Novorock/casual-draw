function point_circle_test(px, py, cx, cy, r) {
    return (px - cx) * (px - cx) + (py - cy) * (py - cy) <= r * r;
}

function norm(x, y) {
    return Math.sqrt(x * x + y * y);
}