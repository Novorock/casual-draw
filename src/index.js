import { Graph } from "./graph.js";
import { ForceDirectedLayout, LombardiLayout } from "./layout.js";

var canvas = $("#canvas");
var ctx = canvas.get(0).getContext("2d");
var oldTime = 0;
var elapsedTime = 0;

// const source = [
//     { from: 1, to: 2 },
//     { from: 1, to: 3 },
//     { from: 1, to: 4 },
//     { from: 2, to: 4 },
//     { from: 7, to: 4 },
//     { from: 4, to: 3 },
//     { from: 6, to: 4 },
//     { from: 5, to: 6 },
//     { from: 5, to: 2 },
//     { from: 3, to: 5 },
//     { from: 3, to: 2 }
// ];

const source = [
    { from: 1, to: 2 },
    { from: 2, to: 3 },
    { from: 3, to: 4 },
    { from: 3, to: 10 },
    { from: 4, to: 5 },
    { from: 5, to: 6 },
    { from: 6, to: 7 },
    { from: 7, to: 1 },
    { from: 10, to: 8 },
    { from: 10, to: 9 },
    { from: 9, to: 6 },
    { from: 6, to: 11 },
    { from: 11, to: 5 },
    { from: 6, to: 12 },
    { from: 12, to: 5 },
    { from: 6, to: 13 },
    { from: 13, to: 14 },
    { from: 14, to: 6 },
    { from: 12, to: 14 },
    { from: 11, to: 14 },
    { from: 13, to: 12 }
];

const count = 14;

// const source = [
//     { from: 1, to: 2 },
//     { from: 2, to: 3 },
//     { from: 3, to: 1 }
// ];

const adjacency = [];

for (let i = 0; i < count; i++) {
    const row = [];

    for (let j = 0; j < count; j++) {
        row.push(false);
    }

    adjacency.push(row);
}

for (let s of source) {
    adjacency[s.from - 1][s.to - 1] = true;
}

var G = new Graph(adjacency);

var k = new CustomSlider("k", 50, 500, 5, 130);
var delta = new CustomSlider("delta", 0.02, 0.98, 0.02, 0.94);

// var layout = new ForceDirectedLayout(G, k.getValue(), delta.getValue());
var layout = new ForceDirectedLayout(G, 130, 0.82);
// var lombardi = new LombardiLayout(G, 130, 0.82);

subscribe("button/reset", (_) => {
    // layout.reset(k.getValue(), delta.getValue());
    layout = new LombardiLayout(G, 130 / 2.3, 0.94);
});

subscribe("button/play", (_) => {
    layout.play();
});

subscribe("button/pause", (_) => {
    layout.pause();
});

subscribe("button/forward", (_) => {
    layout.playOnce();
});

function fit() {
    canvas.get(0).width = $(window).width() - $("#sidebar").width();
    canvas.get(0).height = $(window).height();
}

window.onresize = function () {
    fit();
    publish("canvas/resize", [canvas.get(0).width, canvas.get(0).height]);
}

function init() {
    fit();
}

function loop(currentTime) {
    elapsedTime = currentTime - oldTime;
    oldTime = currentTime;

    layout.update(elapsedTime);
    // $("#iteration-count").text(layout.iteration);

    draw(ctx);
    window.requestAnimationFrame(loop);
}

function draw(ctx) {
    ctx.clearRect(0, 0, canvas.width(), canvas.height());
    layout.draw(ctx);

    ctx.save();
    ctx.restore();
}

window.onload = function () {
    init();
    window.requestAnimationFrame(loop);
}
