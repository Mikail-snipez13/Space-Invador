class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.length = this.length(this)
    }

    length() {
        return Math.sqrt(Math.abs(this.x*this.x) + Math.abs(this.y*this.y))
    }

    static delta(vectorA, vectorB) {
        return new Vector(vectorB.x - vectorA.x, vectorB.y - vectorA.y)
    }

    static add(vectorA, vectorB) {
        return new Vector(vectorA.x + vectorB.x, vectorA.y + vectorB.y)
    }

    static angle(vectorA, vectorB) {
        return Math.acos(this.dotProduct(vectorA, vectorB) / (vectorA.length * vectorB.length))
    }

    static dotProduct(vectorA, vectorB) {
        return ((vectorA.x * vectorB.x) + (vectorA.y * vectorB.y))
    }

    static rotate(vector, angle) {
        
        var cos = Math.cos(-angle)
        var sin = Math.sin(-angle)
        return new Vector(cos * vector.x - sin * vector.y, sin * vector.x + cos * vector.y)
        
    }

    static multiple(vector, factor) {
        return new Vector(vector.x * factor, vector.y * factor)
    }

    static scale(vector, value) {
        var k = value/vector.length
        return new Vector(vector.x * k, vector.y * k)
    }

}

class Starfighter {
    constructor(pos, size=1) {
        this.pos = pos;
        this.angle = 0;
        this.vectors = [
            new Vector(0*size, -15*size), 
            new Vector(9*size, 15*size), 
            new Vector(0*size, 9*size), 
            new Vector(-9*size, 15*size)]
        this.shots = []
        this.velocity = 1
    }

    render(onlyShots=false) {
        CTX.strokeStyle = "white";
        CTX.lineWidth = 2;

        if (!onlyShots) {
            for (var i = 0; i < this.vectors.length - 1; i++) {
                CTX.beginPath()
                CTX.moveTo(this.pos.x + this.vectors[i].x, this.pos.y + this.vectors[i].y);
                CTX.lineTo(this.pos.x + this.vectors[i+1].x, this.pos.y + this.vectors[i+1].y)
                CTX.stroke()
            }
            CTX.beginPath() 
            CTX.moveTo(this.pos.x + this.vectors[0].x, this.pos.y + this.vectors[0].y);
            CTX.lineTo(this.pos.x + this.vectors[this.vectors.length-1].x, this.pos.y + this.vectors[this.vectors.length-1].y)
            CTX.stroke()
        }
        

        this.shots.forEach(shot => {shot.render(); shot.fly()})
        var newShots = new Array()
        for (var i = 0; i < this.shots.length; i++) {
            if (this.shots[i].pos.x > -10
                && this.shots[i].pos.x < CANVAS.width + 10
                && this.shots[i].pos.y > -10
                && this.shots[i].pos.y < CANVAS.height + 10) {
                    //delete array item by index
                newShots.push(this.shots[i])
            }
        }
        this.shots = newShots
    }

    rotate(angle) {
        this.angle += angle;
        for (var i = 0; i < this.vectors.length; i++){
            this.vectors[i] = Vector.rotate(this.vectors[i], angle)
        }
    }

    shot() {
        this.shots.push(new Shot(Vector.add(this.pos, this.vectors[0]), Vector.scale(this.vectors[0], this.velocity + 3)))
    }

    fly(velocity=1) {
        this.velocity = velocity
        this.pos = Vector.add(this.pos, Vector.scale(this.vectors[0], velocity))
    }

    lookAt(vector) {
        var delta = Vector.delta(starfighter.pos, vector)
        var angle = Vector.angle(delta, this.vectors[0])
        //var lotPoint = Vector.rotate(new Vector(0,-vector.length*Math.cos(angle)), this.angle)
        var tolerance = 2
        var normalV = Vector.rotate(delta, -this.angle)

        if (tolerance < normalV.x) {
            this.rotate(-angle)
        }
        else if (-tolerance > normalV.x) {
            this.rotate(angle)
        }
        
        /* drawVector(this.pos, Vector.rotate(new Vector(0,-vector.length*Math.cos(angle)), this.angle))
        drawVector(Vector.add(this.pos, lotPoint), Vector.delta(lotPoint, vector)) */
    }
}

class Shot {
    constructor(pos, vector) {
        this.pos = pos;
        this.vector = vector;
        this.size = 10;
    }

    fly() {
        this.pos = Vector.add(this.pos,this.vector)
    }

    render() {
        var v = Vector.scale(this.vector, this.size)

        CTX.beginPath() 
        CTX.moveTo(this.pos.x, this.pos.y);
        CTX.lineTo(this.pos.x + v.x, this.pos.y + v.y)
        CTX.stroke()
    }
}

class Stone {
    constructor(x, y, radius, vector) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.vector = vector;
    }

    render() {
        CTX.beginPath();
        CTX.strokeStyle = "white";
        CTX.lineWidth = 3;
        CTX.ellipse(this.x, this.y, this.radius, this.radius, Math.PI, 0, 2 * Math.PI);
        CTX.stroke();
    }

    getVector() {
        return new Vector(this.x, this.y)
    }
}

class Box {
    constructor() {
        this.pos;
        this.width;
        this.height;
    }

    getPos() {return this.pos}
    getWidth() {return this.width}
    getHeight() {return this.height}
    mouseHover() {
        return (this.pos.x <= mouseX 
            && mouseX <= this.pos.x + this.width 
            && this.pos.y < mouseY 
            && mouseY < this.pos.y + this.height)
    }
}

class Radio extends Box {
    constructor(pos, width, height, state, onClick) {
        super(pos, state)
        this.pos = pos;
        this.width = width;
        this.height = height;
        this.state = state;
        this.onClick = onClick;
    }

    render() {
        if (this.mouseHover()) {CTX.strokeStyle = 'red'; CTX.fillStyle = 'red'} 
        if (this.state) {
            CTX.fillRect(this.pos.x, this.pos.y, this.width, this.height)
            CTX.strokeStyle = 'black'
            CTX.lineWidth = 3
            CTX.beginPath()
            CTX.moveTo(this.pos.x, this.pos.y)
            CTX.lineTo(this.pos.x + this.width, this.pos.y + this.height)
            CTX.moveTo(this.pos.x + this.width, this.pos.y)
            CTX.lineTo(this.pos.x, this.pos.y + this.height)
            CTX.stroke()
        }
        else {
            CTX.fillRect(this.pos.x, this.pos.y, this.width, this.height)
        }
        CTX.strokeStyle = 'white';
        CTX.fillStyle = 'white';
    }

    setState(state) {
        this.state = state;
    }
}

class Button extends Box {
    constructor(text, pos, width, height, onClick) {
        super(pos, width, height)
        this.text = text;
        this.pos = pos;
        this.width = width;
        this.height = height;
        this.onClick = onClick;
    }

    render() {
        if (this.mouseHover()) {CTX.strokeStyle = 'red'; CTX.fillStyle = 'red'}
        CTX.fillText(this.text, this.pos.x, this.pos.y)
        CTX.strokeStyle = 'white';
        CTX.fillStyle = 'white';
    }
    
    mouseHover() {
        return (this.pos.x <= mouseX 
            && mouseX <= this.pos.x + this.width
            && mouseY < this.pos.y 
            && this.pos.y - this.height < mouseY)
    }
}