// Hello Masha :)

function Ball(r, p, v) {
    this.radius = r;
    this.erased = false;
    this.point = p;
    this.prevvector = v;
    this.vector = v;
    this.placed = true;
    this.maxVec = 7;
    this.numSegment = Math.floor(r / 3 + 6);
    this.boundOffset = [];
    this.boundOffsetBuff = [];
    this.sidePoints = [];
    this.path = new Path({
        fillColor: {
            hue: Math.random() * 360,
            saturation: 1,
            brightness: 1
        },
        blendMode: 'lighter'
    });

    for (var i = 0; i < this.numSegment; i ++) {
        var rad = 0;//this.radius;
        this.boundOffset.push(rad);
        this.boundOffsetBuff.push(rad);
        this.path.add(new Point());
        this.sidePoints.push(new Point({
            angle: 360 / this.numSegment * i,
            length: 1
        }));
    }
}

Ball.prototype = {
    iterate: function() {
        if (!this.checkBorders()) return;
        if (this.vector.length > this.maxVec)
            this.vector.length*=0.95;
        this.vector *= 0.993;
        if (this.vector.length.toFixed(2) === this.prevvector.length.toFixed(2))
            this.vector.length = 0;
        if (!this.placed)
            this.point += this.vector;
        this.updateShape();
    },

    checkBorders: function() {
        var size = view.size;

        if (balls.length > maxBalls){
            if (this.point.x < -this.radius ||
                this.point.x > size.width + this.radius ||
                this.point.y < -this.radius ||
                this.point.y > size.height + this.radius) {
                this.remove();
                return false;
            }
        }

        if (this.point.x < -this.radius)
            this.point.x = size.width + this.radius;
        if (this.point.x > size.width + this.radius)
            this.point.x = -this.radius;
        if (this.point.y < -this.radius)
            this.point.y = size.height + this.radius;
        if (this.point.y > size.height + this.radius)
            this.point.y = -this.radius;
        return true;
    },

    updateShape: function() {
        var segments = this.path.segments;
        for (var i = 0; i < this.numSegment; i ++)
            segments[i].point = this.getSidePoint(i);

        this.path.smooth();
        for (var i = 0; i < this.numSegment; i ++) {
            if (this.boundOffset[i] < this.radius / 4)
                this.boundOffset[i] = this.radius / 4;
            var next = (i + 1) % this.numSegment;
            var prev = (i > 0) ? i - 1 : this.numSegment - 1;
            var offset = this.boundOffset[i];
            offset += (this.radius - offset) / 15;
            offset += ((this.boundOffset[next] + this.boundOffset[prev]) / 2 - offset) / 3;
            this.boundOffsetBuff[i] = this.boundOffset[i] = offset;
        }
    },

    react: function(b) {
        if (b.erased) return;
        var dist = this.point.getDistance(b.point);
        if (dist < this.radius + b.radius && dist != 0) {
            var overlap = this.radius + b.radius - dist;
            var direc = (this.point - b.point).normalize(overlap * 0.01);
            this.vector += direc/2;
            b.vector -= direc/2;

            this.calcBounds(b);
            b.calcBounds(this);
            this.updateBounds();
            b.updateBounds();
        /*    if (this.radius > b.radius*1.4){
                this.radius+=b.radius;

                b.remove();
           }*/
    }

    },

    getBoundOffset: function(b) {
        var diff = this.point - b;
        var angle = (diff.angle + 180) % 360;
        return this.boundOffset[Math.floor(angle / 360 * this.boundOffset.length)];
    },

    calcBounds: function(b) {
        for (var i = 0; i < this.numSegment; i ++) {
            var tp = this.getSidePoint(i);
            var bLen = b.getBoundOffset(tp);
            var td = tp.getDistance(b.point);
            if (td < bLen) {
                this.boundOffsetBuff[i] -= (bLen  - td) / 2;
            }
        }
    },

    getSidePoint: function(index) {
        return this.point + this.sidePoints[index] * this.boundOffset[index];
    },

    updateBounds: function() {
        for (var i = 0; i < this.numSegment; i ++)
            this.boundOffset[i] = this.boundOffsetBuff[i];
    },
    remove: function(){
        this.radius = 1;
        this.erased = true;
        this.path.removeSegments();
        balls.erase(this);
    }
};

Array.prototype.erase = function(item){
    var index = this.indexOf(item);
    log("Ball index: " + index + ". Erased.");
    if (this.indexOf(item)>=0){
        this.splice(index,1);
    }
}

// var Wall = function(r, a){
//     this.path = r;
//     this.solid = true;
// }
//--------------------- jelly ---------------------

var balls = [];
var maxBalls = 10;
var cball;
function onMouseDown(e){
    var position = e.point;
    for (var obj in balls){
        if (balls[obj].path)
            if (balls[obj].path.contains(position)){
                cball = balls[obj];
                cball.placed = true;
                return;
            }
    }
    var vector = new Point({
        angle: 360 * Math.random(),
        length: 0
    });
    var radius = Math.random() * 100 + 50;
    balls.push(new Ball(radius, position, vector));
    if (balls.length)
        cball = balls[balls.length-1];
    log("x: " + e.point.x + ",  y: " + e.point.y);
}

function onMouseDrag(e) {
    if (cball){
        cball.point = e.point.clone();
        cball.vector = new Point({
            angle: 0,
            length: 0
        });
    }
};
function onMouseUp(e){
    if (cball){
        cball.placed = false;
        cball.vector.length = e.delta.length/5;
        cball.vector.angle = e.delta.angle;
    }


}
function onFrame() {
    for (var i = 0; i < balls.length - 1; i++) {
        for (var j = i + 1; j < balls.length; j++) {
            balls[i].react(balls[j]);
        }
    }
    for (var i = 0; i < balls.length; i++) {
        balls[i].iterate();
    }
}

var maintext = "mironov.link - physic ball test";
var logArray = [];
var logs = "";
var logtext = new PointText(new Point(20,30));
logtext.fillColor = 'white';
logtext.content = maintext + logs;

function log(text){
    if (!window.log) return;
    if (logArray.length < 10){
        logArray.push(text);
    } else {
        logArray.shift(text);
        logArray.push(text);
    }
    logs = "";
    for (var i = 0; i < logArray.length; i++){
        logs += "\n"+logArray[i];
    }
    logtext.content = maintext + logs;
}