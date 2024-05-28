const UNEXPECTED_TOKEN = (str, pos) => new Error(`Unexpected token '${str[pos]}' at position: ${pos}.`);
const ALIAS_DEF_EXPECTED = (str, pos) => new Error(`Expected '@' at position: ${pos}, but '${str[pos]}' 'was met.`);
const CLOSE_PARANTH_EXPECTED = (str, pos) => new Error(`Expected ')' at position: ${pos}, but '${str[pos]}' was met.`);
const CLOSE_BRACK_EXPECTED = (str, pos) => new Error(`Expected ']' at position: ${pos}, but '${str[pos]}' was met.`);
const ARROW_DEF_EXPECTED = (str, pos) => new Error(`Expected arrow definition at position: ${pos}, but '${str[pos]}' was met.`);

export class LxVertex {
    constructor(text) {
        this.text = text;
        this.bounded = false;
    }
}

export class LxVertexPool {
    constructor() {
        this.next = 0;
        this.name2Vertex = new Map();
        this.name2Index = new Map();
        this.index2Vertex = new Map();
    }

    put(name, v) {
        if (this.name2Vertex.has(name))
            throw new Error(`Variable with name '${name}' is already defined.`);

        this.name2Vertex.set(name, v);
        this.name2Index.set(name, this.next);
        this.index2Vertex.set(this.next++, v);
    }

    getVertexByName(name) {
        if (!this.name2Vertex.has(name))
            throw new Error(`Variable with name ${name} is not defined.`);

        return this.name2Vertex.get(name);
    }

    getVertexByIndex(index) {
        if (!this.index2Vertex.has(index))
            throw new Error(`Variable with index ${index} is not defined.`);

        return this.index2Vertex.get(index);
    }

    getIndex(name) {
        if (!this.name2Vertex.has(name))
            throw new Error(`Variable with name ${name} is not defined.`);

        return this.name2Index.get(name);
    }

    getCount() {
        return this.name2Vertex.size;
    }
}

export var LxLinkHead;
(function (LxLinkHead) {
    LxLinkHead[LxLinkHead["DEFAULT"] = 0] = "DEFAULT";
    LxLinkHead[LxLinkHead["POSITIVE"] = 1] = "POSITIVE";
    LxLinkHead[LxLinkHead["NEGATIVE"] = 2] = "NEGATIVE";
})(LxLinkHead || (LxLinkHead = {}));
;

export class LxLink {
    constructor(left, right, head) {
        this.left = left;
        this.right = right;
        this.head = head;
    }

    setDelayed() {
        this.delayed = true;
    }
}

export class LxLinkPool {
    constructor() {
        this.pool = [];
    }

    push(link) {
        this.pool.push(link);
    }

    asArray() {
        return this.pool;
    }
}

class LxName {
    constructor(name) {
        this.name = name;
    }
}

class LxText {
    constructor(text) {
        this.text = text;
    }
}

class LxAlias {
    constructor(pool) {
        this.pool = pool;
    }

    handle(left, right) {
        if (!(left instanceof LxName) || !(right instanceof LxText))
            throw new Error(`Unsupported operand types for alias operation.`);

        const lxVertex = new LxVertex(right.text);

        if (this.bounded)
            lxVertex.bounded = true;

        this.pool.put(left.name, lxVertex);

        return left;
    }

    getPriorityValue() {
        return 2;
    }

    setBounded() {
        this.bounded = true;
    }
}

class LxArrow {
    constructor(head, vertexPool, linkPool) {
        this.head = head;
        this.vertexPool = vertexPool;
        this.linkPool = linkPool;
    }

    handle(left, right) {
        if (!(left instanceof LxName) || !(right instanceof LxName))
            throw new Error(`Unsupported operand types for arrow operation.`);

        const link = new LxLink(left.name, right.name, this.head);

        this.linkPool.push(link);

        if (this.delayed)
            link.setDelayed();

        return left;
    }

    getPriorityValue() {
        return 1;
    }

    setDelayed() {
        this.delayed = true;
    }
}

class SolvingStackMachine {
    constructor() {
        this.holdingStack = [];
        this.output = [];
        this.solvingStack = [];
    }

    solve() {
        while (this.holdingStack.length > 0)
            this.output.push(this.holdingStack.pop());
        for (let token of this.output) {
            if (token instanceof LxAlias || token instanceof LxArrow) {
                const right = this.solvingStack.pop();
                const left = this.solvingStack.pop();
                this.solvingStack.push(token.handle(left, right));
            }
            else
                this.solvingStack.push(token);
        }
    }

    clear() {
        this.holdingStack = [];
        this.output = [];
        this.solvingStack = [];
    }

    push(lex) {
        if (lex instanceof LxName || lex instanceof LxText)
            this.output.push(lex);

        if (lex instanceof LxAlias || lex instanceof LxArrow) {
            let top = this.holdingStack.pop();

            while (top != null && lex.getPriorityValue() < top.getPriorityValue()) {
                this.output.push(top);
                top = this.holdingStack.pop();
            }

            if (top != null)
                this.holdingStack.push(top);

            this.holdingStack.push(lex);
        }
    }
}

export class Translator {
    constructor(str) {
        this.src = str;
        this.ssm = new SolvingStackMachine();
        this.vertexPool = new LxVertexPool();
        this.linkPool = new LxLinkPool();
    }

    isWord(ch) {
        if (ch.length > 1)
            throw new Error(`Character expected instead of ${ch}`);

        const t = ch.toLowerCase();

        return 'a' <= t && t <= 'z';
    }

    isDigit(ch) {
        if (ch.length > 1)
            throw new Error(`Character expected instead of ${ch}`);

        return '0' <= ch && ch <= '9';
    }

    isSeparator(ch) {
        if (ch.length > 1)
            throw new Error(`Character expected instead of ${ch}`);

        return ' ' === ch || '\n' === ch || '\t' === ch;
    }

    isPunctuation(ch) {
        if (ch.length > 1)
            throw new Error(`Character expected instead of ${ch}`);

        return ',' === ch || '.' === ch || '!' === ch || '?' === ch || ch === '-' || ';' === ch || ':' === ch;
    }

    skipSeparator(str, pos) {
        let next = pos;

        while (next < str.length && this.isSeparator(str[next])) {
            next += 1;
        }

        return next;
    }

    lexName(str, pos) {
        if (!this.isWord(str[pos]))
            throw UNEXPECTED_TOKEN(str, pos);

        let next = pos;
        let name = "";

        do {
            name += str[next];
            next = next + 1;
        } while (this.isWord(str[next]) || this.isDigit(str[next]) || str[next] === '_');

        this.ssm.push(new LxName(name));
        return next;
    }

    lexText(str, pos) {
        let next = pos;
        let text = "";

        while (this.isWord(str[next])
            || this.isDigit(str[next])
            || this.isSeparator(str[next])
            || this.isPunctuation(str[next])) {
            text += str[next];
            next = next + 1;
        }

        this.ssm.push(new LxText(text));
        return next;
    }

    lexAlias(str, pos) {
        if (str[pos] !== '@')
            throw ALIAS_DEF_EXPECTED(str, pos);

        let next = this.lexName(str, pos + 1);
        next = this.skipSeparator(str, next);

        if (str[next] === '(') {
            next = this.lexText(str, next + 1);

            if (str[next] === ')') {
                this.ssm.push(new LxAlias(this.vertexPool));

                return next + 1;
            }

            throw CLOSE_PARANTH_EXPECTED(str, next);
        }
        else if (str[next] === '[') {
            next = this.lexText(str, next + 1);

            if (str[next] === ']') {
                const lxAlias = new LxAlias(this.vertexPool);
                lxAlias.setBounded();
                this.ssm.push(lxAlias);
                return next + 1;
            }

            throw CLOSE_BRACK_EXPECTED(str, next);
        }
        // Text description expected
        throw UNEXPECTED_TOKEN(str, next);
        // Take alias name as text description
    }

    lexArrow(str, pos) {
        let next = pos;
        let head = LxLinkHead.DEFAULT;
        let delayed = false;

        if (str[next] === '|') {
            next = next + 1;
            if (str[next] === '|') {
                delayed = true;
                next = next + 1;
            }
            else
                throw UNEXPECTED_TOKEN(str, next);
        }

        if (str[next] === '+') {
            next = next + 1;
            head = LxLinkHead.POSITIVE;
        }

        else if (str[next] === '-') {
            next = next + 1;
            head = LxLinkHead.NEGATIVE;
        }

        if (str[next] === '>') {
            const operation = new LxArrow(head, this.vertexPool, this.linkPool);
            if (delayed)
                operation.setDelayed();
            this.ssm.push(operation);
            return next + 1;
        }

        throw ARROW_DEF_EXPECTED(str, next);
    }

    lexVert(str, pos) {
        let next = pos;
        try {
            next = this.lexAlias(str, pos);
        }
        catch (e) {
            next = this.lexName(str, pos);
        }
        return next;
    }

    lexExpression(str, pos) {
        let next = this.lexVert(str, pos);
        next = this.skipSeparator(str, next);
        do {
            next = this.lexArrow(str, next);
            next = this.skipSeparator(str, next);
            next = this.lexVert(str, next);
            next = this.skipSeparator(str, next);
        } while (next < str.length && str[next] !== ';');
        return next + 1;
    }

    translate() {
        let next = this.skipSeparator(this.src, 0);
        while (next < this.src.length) {
            next = this.lexExpression(this.src, next);
            this.ssm.solve();
            this.ssm.clear();
            next = this.skipSeparator(this.src, next);
        }
    }

    getVertexPool() {
        return this.vertexPool;
    }

    getLinkPool() {
        return this.linkPool;
    }
}