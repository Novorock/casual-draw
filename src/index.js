import { Graph } from "./graph.js";
import { ForceDirectedLayout } from "./layout/forceDirectedLayout.js";
import { LombardiStyledLayout } from "./layout/lombardiStyledLayout.js";

window.onload = function () {
    application.init();
    application.run();
}

window.onresize = function () {
    application._refineCanvasSize();
}

var application = {
    canvas: document.getElementById("canvas"),
    sidebar: document.getElementById("sidebar"),
    playBtn: document.getElementById("play-btn"),
    pauseBtn: document.getElementById("pause-btn"),
    forwardBtn: document.getElementById("forward-btn"),
    kInput: document.getElementById("k-input"),
    kValue: document.getElementById("k-value"),
    deltaInput: document.getElementById("delta-input"),
    deltaValue: document.getElementById("delta-value"),
    iterationCount: document.getElementById("iteration-count"),

    context: {
        play: false,
        iteration: 0,
        k: 300,
        delta: 0.75
    },

    init() {
        this._refineCanvasSize();
        this.pauseBtn.disabled = true;

        // algo parameters
        this.kInput.min = 50;
        this.kInput.max = 450;
        this.kInput.value = this.context.k;
        this.kValue.innerText = this.context.k;

        this.deltaInput.min = 0.1;
        this.deltaInput.max = 1;
        this.deltaInput.step = 0.05;
        this.deltaInput.value = this.context.delta;
        this.deltaValue.innerText = this.context.delta;

        this.iterationCount.innerText = this.context.iteration;
        this.restart();
    },
    restart() {
        this.graph = new Graph(8);

        this.context.iteration = 0;
        this.layout = new ForceDirectedLayout(this.graph, this.context.k, this.context.delta);
        // this.lombardi = new LombardiStyledLayout(this.layout);
    },
    run() {
        const ctx = this.canvas.getContext("2d");

        setInterval(() => {
            if (this.context.play) {
                this.tick();
            }

            this.draw(ctx);
        }, 1000 / 10);
    },
    tick() {
        this.layout.go()
        this.context.iteration += 1;
        this.iterationCount.innerText = this.context.iteration;
    },
    draw(ctx) {
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.save();

        this.graph.draw(ctx);

        for (let dummy of this.dummies) {
            dummy.draw(ctx);
        }

        ctx.restore();
    }
}

application._refineCanvasSize = (function () {
    this.canvas.width = window.innerWidth - this.sidebar.clientWidth;
    this.canvas.height = window.innerHeight;
}).bind(application);

application.canvas.addEventListener("mousedown", (event) => {
    publish("mouse/down", [event]);
});

application.canvas.addEventListener("mousemove", (event) => {
    publish("mouse/move", [event]);
});

application.canvas.addEventListener("mouseup", (event) => {
    publish("mouse/up", [event]);
});

application.playBtn.onclick = function (e) {
    application.playBtn.disabled = true;
    application.forwardBtn.disabled = true;
    application.pauseBtn.disabled = false;
    // application.kInput.disabled = true;
    // application.deltaInput.disabled = true;
    application.context.play = true;
    application.restart();
};

application.pauseBtn.onclick = function (e) {
    application.playBtn.disabled = false;
    application.forwardBtn.disabled = false;
    application.pauseBtn.disabled = true;
    application.context.play = false;
};

application.forwardBtn.onclick = function (e) {
    application.tick();
}

application.kInput.onpointermove = function (e) {
    application.context.k = e.target.value;
    application.kValue.innerText = e.target.value;
}

application.deltaInput.onpointermove = function (e) {
    application.context.delta = e.target.value;
    application.deltaValue.innerText = e.target.value;
}
