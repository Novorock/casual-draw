export function Variable(text, originX, originY) {
    this.text = text === null ? "" : text;
    this.captured = false;
    this.originX = originX === null ? 0 : originX;
    this.originY = originY === null ? 0 : originY;
    this.fontSize = 20;
    this.textColor = "#000000";
    this.backgroundColor = null;
}

Variable.prototype.setX = function (x) {
    this.originX = x;
}

Variable.prototype.setY = function (y) {
    this.originY = this.y;
}

Variable.prototype.getX = function (x) {
    return this.originX;
}

Variable.prototype.getY = function (y) {
    return this.originY;
}

Variable.prototype.setCaptured = function () {
    this.captured = true;
    this.backgroundColor = "rgba(0, 200, 83, 0.2)";
}

Variable.prototype.setUncaptured = function () {
    this.captured = false;
    this.backgroundColor = null;
}

Variable.prototype.setText = function (text) {

}

Variable.prototype.draw = function (ctx) {
    ctx.font = `500 ${this.fontSize}px serif`;
    const metrics = ctx.measureText(this.text);
    const w = metrics.width;

    if (this.backgroundColor != undefined) {
        ctx.fillStyle = this.backgroundColor;
        ctx.rect(this.originX - (w + 15) / 2, this.originY - 7 * this.fontSize / 8 - 7, w + 15, this.fontSize + 15);
        ctx.fill();
    }

    ctx.fillStyle = this.textColor;
    ctx.fillText(this.text, this.originX - w / 2, this.originY);
}