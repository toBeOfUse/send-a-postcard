function lerp(p1, p2, t){
    return [p1[0]*(1-t)+p2[0]*(t), p1[1]*(1-t)+p2[1]*t];
}

function spline(t){
    let points = [[0,0], [0.15, 0.8], [0.8, 0.15], [1,1]];
    while (points.length>1){
        const iteration = [];
        for (let i=0; i<points.length-1;i++){
            const segment = points.slice(i, i+2);
            iteration.push(lerp(segment[0], segment[1], t));
        }
        points = iteration;
    }
    return points[0][1];
}

// function test(){
//     for (let j=0; j<=1; j+=0.1){
//         console.log(spline(j));
//     }
// }

// test();

export default spline;
