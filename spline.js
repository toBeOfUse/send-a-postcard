function lerp(v1, v2, t){
    return v1*(1-t)+v2*t;
}

function pointLerp(p1, p2, t){
    return [lerp(p1[0], p2[0], t), lerp(p1[1], p2[1], t)];
}

function spline(t, splinePoints){
    let points = splinePoints;
    while (points.length>1){
        const iteration = [];
        for (let i=0; i<points.length-1;i++){
            const segment = points.slice(i, i+2);
            iteration.push(pointLerp(segment[0], segment[1], t));
        }
        points = iteration;
    }
    return points[0][1];
}

class Keyframe {
    constructor(time, value, spline){
        this.time = time;
        this.value = value;
        this.spline = spline;
    }
}

class Track {
    constructor(keyframes){
        this.keyframes = keyframes;
    }
    get start(){
        return this.keyframes[0].time;
    }
    get length() {
        return this.keyframes[this.keyframes.length-1].time-this.start;
    }
    get end(){
        return this.start+this.length;
    }
    getValue(time){
        if (time <= this.start){
            return this.keyframes[0].value;
        } else if (time >= this.end){
            return this.keyframes[this.keyframes.length-1].value;
        } else {
            const afterIndex = this.keyframes.findIndex(v=>v.time>=time);
            const after = this.keyframes[afterIndex];
            if (after.time == time){
                return after.value;
            }
            const before = this.keyframes[afterIndex-1];
            const weight = (time-before.time)/(after.time-before.time);
            if (after.spline){
                const metaWeight = spline(weight, after.spline);
                return lerp(before.value, after.value, metaWeight);
            } else {
                return lerp(before.value, after.value, weight);
            }
        }
    }
}

class Animation {
    constructor(rx, ry, rz, tx, ty, tz){
        this.rx = rx;
        this.ry = ry;
        this.rz = rz;
        this.tx = tx;
        this.ty = ty;
        this.tz = tz;
    }
}

// function testSpline(){
//     for (let j=0; j<=1; j+=0.1){
//         console.log(spline(j));
//     }
// }

// testSpline();

export {Animation, Track, Keyframe};
