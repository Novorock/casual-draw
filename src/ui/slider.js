function CustomSlider(id, min, max, dx, initialValue) {
    this.sliderElement = $(`#${id}`);
    this.min = min;
    this.max = max;
    this.value = initialValue;
    this.sliderElement.attr("min", min);
    this.sliderElement.attr("max", max);
    this.sliderElement.attr("step", dx);
    this.sliderElement.val(initialValue);
    this.valueElement = $(`#${id}` + "_");
    this.valueElement.text(this.value);
    this.active = false;

    this.sliderElement.on("mousedown", (_) => { this.active = true; });
    this.sliderElement.on("mouseup", (_) => { this.active = false; });
    this.sliderElement.on("pointermove", this.handleChange.bind(this));
}

CustomSlider.prototype.handleChange = function(_) {
    if (!this.active)
        return;

    this.valueElement.text(this.sliderElement.val());
}

CustomSlider.prototype.setValue = function(value) {
    if (value > this.max) {
        this.value = this.max;
    }

    if (value < this.min) {
        this.value = this.min;
    }

    this.valueElement.text(this.value);
}

CustomSlider.prototype.getValue = function() {
    return this.value;
}