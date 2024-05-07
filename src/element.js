export const VARIABLE = 0;
export const EDGE = 1;

function DiagramElement(elementType) {
    this.elementType = elementType;
}

DiagramElement.prototype.ofType = function (elementType) {
    if (elementType != VARIABLE && elementType != EDGE)
        throw new Error("Unknown element type");

    return this.elementType === elementType;
}