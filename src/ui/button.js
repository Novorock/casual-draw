const playButton = $("#play-btn");
const pauseButton = $("#pause-btn");
pauseButton.attr("disabled", true);
const forwardButton = $("#forward-btn");
const resetButton = $("#reset-btn");

playButton.on("click", (event) => {
    publish("button/play", [event]);
    playButton.attr("disabled", true);
    pauseButton.attr("disabled", false);
    forwardButton.attr("disabled", true);
});

pauseButton.on("click", (event) => {
    publish("button/pause", [event]);
    playButton.attr("disabled", false);
    pauseButton.attr("disabled", true);
    forwardButton.attr("disabled", false);
});

forwardButton.on("click", (event) => {
    publish("button/forward", [event]);
});

resetButton.on("click", (event) => {
    publish("button/reset", [event]);
});





