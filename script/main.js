
var cvs, ctx;
var w, h;
var bg;
var imgData, data;
var palette = [
    [0,     0,      0,      255],
    [255,   0,      0,      255],
    [255,   255,    0,      255],
    [0,     255,    0,      255],
    [0,     255,    255,    255],
    [0,     0,      255,    255],
    [255,   0,      255,    255],
    [255,   255,    255,    255],
    [0,     0,      0,      0]


    // [0,     0,      0,      255],
    // [255,   0,      0,      255],
    // [0,     255,    0,      255],
    // [0,     0,      255,    255],
    // [255,   255,    255,    255],
    // [0,     0,      0,      0]
]

Uint32Array.prototype.swap = function (x,y) {
    let b = this[x];
    this[x] = this[y];
    this[y] = b;
    return this;
}

Array.prototype.swap = function (x,y) {
    let b = this[x];
    this[x] = this[y];
    this[y] = b;
    return this;
}

var signature = [
    100, -100,
    50, 100,
    130, 130,
    100, 130,
]

var bad_square = [
    -100, -100,
    -90, -100,
    -80, -100,
    -70, -100,
    -60, -100,
    -50, -100,
    -40, -100,
    -30, -100,
    -20, -100,
    -10, -100,
    0, -100,
    10, -110,
    20, -150,
    30, -200,
    40, -200,
    50, -150,
    60, -110,
    70, -100,
    80, -100,
    90, -100,
    100, -100,
    100, -90,
    100, -80,
    100, -70,
    100, -60,
    100, -50,
    100, -40,
    100, -30,
    100, -20,
    100, -10,
    100, 0,
    100, 10,
    100, 20,
    100, 30,
    100, 40,
    100, 50,
    100, 60,
    100, 70,
    100, 80,
    100, 90,
    100, 100,
    100, 110,
    100, 120,
    100, 130,
    110, 130,
    120, 130,
    130, 130,
    130, 120,
    130, 110,
    130, 100,
    120, 100,
    110, 100,
    100, 100,
    90, 100,
    80, 100,
    70, 100,
    60, 100,
    50, 100,
    40, 100,
    30, 100,
    20, 100,
    10, 100,
    0, 100,
    -10, 100,
    -20, 100,
    -30, 100,
    -40, 100,
    -50, 100,
    -60, 100,
    -70, 100,
    -80, 100,
    -90, 100,
    -100, 100,
    -90, 90,
    -50, 80,
    0, 70,
    0, 60,
    -10, 50,
    -20, 20,
    -30, 0,
    -40, 20,
    -50, 50,
    -90, 40,
    -100, 30,
    -100, 20,
    -100, 10,
    -100, 0,
    -100, -10,
    -100, -20,
    -100, -30,
    -100, -40,
    -100, -50,
    -100, -60,
    -100, -70,
    -100, -80,
    -100, -90,
]

var face = [
    // jaw left
    0, 15,
    -10, 14,
    -20, 10,
    -30, 4,
    -40, -5,
    -50, -15,
    -60, -30,
    -70, -50,
    -75, -65,
    -80, -83,
    -90, -90,
    -95, -97,
    -100, -110,
    -100, -150,
    -95, -155,
    -90, -150,
    -85, -140,
    -85, -132,
    -83, -122,
    -85, -132,
    -97, -117,
    -85, -103,
    -89, -110,
    -89, -118,
    -85, -122,
    -81, -120,
    -75, -170,
    -65, -175,
    -60, -210,

    -82, -180,
    -85, -200,
    -90, -150,
    -93, -170,
    -95, -165,
    -100, -180,
    -100, -200,
    -90, -230,
    -75, -245,
    -80, -220,
    -75, -210,

    -60, -210,
    -50, -225,
    -70, -230,
    -75, -245,
    -35, -275,
    -5, -288,
    40, -290,
    70, -270,
    95, -220,
    60, -270,
    30, -280,
    -5, -270,
    -70, -230,

    -5, -225,
    10, -250,
    30, -260,
    60, -260,
    80, -240,
    100, -200,
    98, -165,
    88, -140,
    92, -170,
    90, -200,
    75, -225,
    60, -240,
    40, -248,
    20, -245,
    -5, -225,

    20, -230,
    23, -235,
    25, -230,
    25, -222,
    38, -200,
    45, -220,
    45, -230,
    55, -205,
    50, -190,
    45, -185,
    50, -185,
    45, -180,
    50, -180,
    53, -175,
    68, -190,
    72, -210,
    60, -240,
    72, -210,
    70, -190,
    80, -155,
    80, -110,

    // ear right
    82, -100,
    87, -108,
    86, -112,
    80, -110,
    85, -130,
    88, -140,
    92, -140,
    92, -120,
    87, -95,
    79, -80,
    73, -75,

    // jaw right
    70, -65,
    65, -49,
    60, -38,
    50, -22,
    40, -10,
    30, 1,
    20, 10,
    10, 14,
]

var _path = face;

var complex = [
    66.75, -53.07,
    -135.66, -45.57,
    10.72, -18,
    -12.64, 20.9,
    -44.85, -23.71,
]

var circles = [
    14, 0, -.125,
    10, 1, 0,
    50, -1, 0.5,
    20, 2, 0,
    30, -2, 0.5,
];

var count = 0;

var countPerOne = 360;
var paths = [];
var deg = 20;
var numCircles = null;
var drawPath = true;

function circlesLoop() {
    ctx.clearRect(0, 0, w, h);
    // ctx.drawImage(bg, 0, 0, w, h);
    if(numCircles == null) {
        // numCircles = 3;
        numCircles = circles.length/3;
    }
    let x = w/2;
    let y = h/2;
    let angle = 0;
    let joints = []
    for(let i = 0; i < numCircles*3; i+=3) {
        if(paths.length <= i/3) {
            paths.push([]);
        }
        ctx.beginPath();
        ctx.arc(x, y, Math.abs(circles[i]), 0, 2*Math.PI);
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.fill();
        joints.push(x);
        joints.push(y);
        angle = 2*Math.PI * ((count*circles[i+1] / countPerOne) + circles[i+2]);
        x += circles[i] * Math.cos(angle);
        y -= circles[i] * Math.sin(angle);
        if(drawPath) {
            paths[i/3].push(x);
            paths[i/3].push(y);
        }
        ctx.lineTo(x, y);
    }
    joints.push(x, y);

    // for(let i = 0; i < path.length; i+=2) {
    //     ctx.beginPath();
    //     ctx.moveTo(w/2, h/2);
    //     ctx.lineTo(path[i], path[i+1]);
    //     ctx.lineWidth = 1;
    //     ctx.lineJoin = 'round';
    //     ctx.strokeStyle = "rgba(0, 0, 0, 0.01)";
    //     ctx.stroke();
    // }

    if(drawPath) {
        drawPaths(paths, 1);

        // ctx.fillStyle = "#ff0000"
        // drawPathPoints();
    } else {
        drawPaths(paths, 1);

        // ctx.fillStyle = "#ff0000"
        // drawPathPoints();
    }

    ctx.beginPath();
    ctx.moveTo(joints[0], joints[1]);
    for(let i = 2; i < joints.length; i+=2) {
        ctx.lineTo(joints[i], joints[i+1]);
    }
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    if(count == 0 || count % countPerOne != 0) {
        window.requestAnimationFrame(circlesLoop);
    } else {
        ctx.clearRect(0, 0, w, h);

        // for(let i = 0; i < path.length; i+=2) {
        //     ctx.beginPath();
        //     ctx.moveTo(w/2, h/2);
        //     ctx.lineTo(path[i], path[i+1]);
        //     ctx.lineWidth = 1;
        //     ctx.lineJoin = 'round';
        //     ctx.strokeStyle = "rgba(0, 0, 0, 0.01)";
        //     ctx.stroke();
        // }

        drawPaths(paths, 1);

        ctx.fillStyle = "#ff0000"
        if(drawPath) {
            drawPathPoints();
        }

        count = 0;
        // deg--;
        if(numCircles < circles.length/3) {
            // complex = getComplexFromPath(deg, centerPath(paths[paths.length-1]));
            // complex = getComplexFromPath(deg, _path);
            // circles = getCirclesFromComplex(complex, 1);
            // sortCircles();
            paths = [];
            if(numCircles >= 300) {
                numCircles = circles.length/3;
            } else {
                numCircles++;
                // numCircles+=2;
            }
            console.log(numCircles);
            circlesLoop();
        } else {
            if(drawPath) {
                console.log('done');
            }
            drawPath = false;
            circlesLoop();
        }
    }
    count++;
}

function drawPaths(arr=paths, num=1) {
    if(num > paths.length ||  num < 1) {
        num = paths.length;
    }
    for(let p = paths.length-num; p < paths.length; p++) {
        let path = paths[p];
        ctx.beginPath();
        ctx.moveTo(path[0], path[1]);
        for(let i = 2; i < path.length; i+=2) {
            ctx.lineTo(path[i], path[i+1]);
        }
        ctx.lineWidth = 1;
        ctx.lineJoint = 'round';
        if(p == paths.length-1) {
            ctx.strokeStyle = "#000000";
        } else {
            ctx.strokeStyle = "rgb(0,0,0,"+(0.1-(p/paths.length))+")"
        }
        ctx.stroke();
    }
}

function mag(x, y) {
    return Math.sqrt(x*x + y*y);
}

function ang(x, y) {
    return Math.atan2(y, x)/2/Math.PI;
}

function getCirclesFromComplex(src=complex, chance=1) {
    let dest = [];
    for(let i = 0; i < src.length; i+=2) {
        if(Math.random() < chance) {
            dest.push(mag(src[i], src[i+1]));
            dest.push(i/2 - Math.floor(src.length/4))
            dest.push(ang(src[i], src[i+1]));
        }
    }
    return dest;
}

function getComplexFromPath(deg, src=_path) {
    // console.log(src);
    let dest = [];
    for(let n = -deg; n <= deg; n++) {
        let real = 0;
        let imag = 0;
        for(let j = 0; j < src.length; j+=2) {
            let angle = n * j/src.length * 2*Math.PI;
            // console.log(n, j, angle/Math.PI + 'pi', src[j] * Math.cos(angle));
            real += src[j] * Math.cos(angle) - src[j+1] * Math.sin(angle);
            imag -= src[j] * Math.sin(angle) + src[j+1] * Math.cos(angle);
        }
        // console.log(real/src.length);
        dest.push(real/(src.length/2));
        dest.push(imag/(src.length/2));
    }
    // console.log(dest);
    return dest;
}

function drawPathPoints(src=_path) {
    for(let i = 0; i < src.length; i+=2) {
        ctx.fillRect(w/2 + src[i], h/2 + src[i+1], 1, 1);
    }
}

function sortCircles() {
    for(let i = 0; i < circles.length; i+=3) {
        let j = i;
        while(j > 0 && (circles[j] > circles[j-3] || circles[j+1] == 0) && circles[j-2] != 0) {
        // while(j > 0 && (Math.abs(circles[j+1]) < Math.abs(circles[j-2]) || circles[j+1] == 0)) {
            circles.swap(j, j-3);
            circles.swap(j+1, j-2);
            circles.swap(j+2, j-1);
            j -= 3;
        }
    }
}

function main() {
    imgData = ctx.getImageData(0, 0, w, h);
    data = imgData.data;
    // console.log(data);

    // palette.push(rgbToArr(0x31E9BB));
    // palette.push(rgbToArr(0x4BF058));
    // palette.push(rgbToArr(0x8031F6));
    // palette.push(rgbToArr(0xAB2A61));
    // palette.push(rgbToArr(0x4A3B33));

    // for(let i = 0; i < 5; i++) {
    //     palette.push(rgbToArr(Math.floor(Math.random() * 0xffffff)))
    // }
    // for(let i = 0; i < 5; i++) {
    //     palette.push(rgbaToArr(Math.floor(Math.random() * 0xffffffff)));
    // }

    // palette = [[0,0,0,0],[0,0,0,0]];
    // palette = [];
    // kMeansPalette(8);
    // leastAvgPalette(8);
    // disperatePalette(16);
    // console.log(palette);

    // normalize();

    // myDither();

    // floydSteinberg();

    // quadTree(0.1);

    // heirarchicalCluster(0.2, 0.8);
    // console.log(clusters);
    // colorClusters(slider.value);

    // toGrayscale();
    //
    // // addWave();
    // // addWave(45, 32, 2);
    //
    // fourier = ctx.createImageData(imgData.width, imgData.height);
    // f_grayscale = new Array(w*h);
    // f_grayscale.fill(0);
    //
    // // fromFourier();
    // //
    // // // addWave(45, 32, 15, f_grayscale);
    // //
    // // fromGrayscale(fourier.data, f_grayscale, false);
    // // ctx.putImageData(fourier, 0, 0);
    //
    // // fromFourierLoop();
    // // fromGrayscale();
    // toFourierLoop();

    // toPixels();

    // sortPixels();
    // sortCols();
    // sortRows();

    // justAlpha();
    // heavyColor();

    // fromPixels();

    // drawLoop();

    // floydSteinberg();
    // ctx.putImageData(imgData, 0, 0);

    // console.log(data);

    // w = cvs.width = 480;
    // h = cvs.height = 480;

    // circlesLoop();

    // randomizePath(3);
    linearizePath(1);
    epicycles();
}

function linearizePath(pointsPer) {
    for(let i = 0; i < _path.length; i+=2) {
        let x1 = _path[i];
        let y1 = _path[i + 1];
        let x2 = _path[i + 2];
        let y2 = _path[i + 3];
        if(isNaN(x2) || isNaN(y2)) {
            x2 = _path[0];
            y2 = _path[1];
        }
        for(let j = 0; j < pointsPer; j++) {
            let x = x1 * (1-(j+1)/(pointsPer+1)) + x2 * ((j+1)/(pointsPer+1));
            let y = y1 * (1-(j+1)/(pointsPer+1)) + y2 * ((j+1)/(pointsPer+1));
            _path.splice(i+2, 0, x, y);
            i += 2;
        }
    }
}

function epicycles(deg=null, path=_path) {
    if(deg == null) {
        deg = path.length/4;
    }
    for(let i = 0; i < path.length; i++) {
      path[i] *= 0.8
    }
    complex = getComplexFromPath(deg, path);
    circles = getCirclesFromComplex(complex);
    sortCircles();
    circles.splice(0, 3)
    circlesLoop();
}

function init() {
    console.log("loaded.");

    cvs = document.getElementById('fourier');
    ctx = cvs.getContext('2d');

    // bg = new Image(50, 50);

    // bg = new Image(1067, 1600);
    bg = new Image(800, 300);
    // bg = new Image(266, 400);
    // bg = new Image(133, 200);
    // bg = new Image(66, 100);
    // bg.src = 'portrait-small.jpg';
    bg.src = '../home_specs_launcher.png';

    // bg = new Image(400, 400);
    // bg = new Image(100, 100);
    // bg.src = 'alpha-gradient.png';

    // bg = new Image();
    // bg.src = 'bouquet.png';

    // bg = new Image();
    // bg.src = 'fire.png';

    // bg.src = 'splotch-portrait.png'

    bg.onload = function() {
        w = cvs.width = bg.width;
        h = cvs.height = bg.height;
        ctx.drawImage(bg, 0, 0, w, h);
        main();
    }
}

window.onload = init
