
var cvs, ctx;
var w, h;
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

var slider;

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

function indecesOf(x, y) {
    let r = (y * w + x) * 4;
    let i = {};
    i.r = r;
    i.g = r + 1;
    i.b = r + 2;
    i.a = r + 3;
    return i;
}

function relativeIndeces(index, dX, dY) {
    let r = (dY * w + dX) * 4
    let i = {};
    i.r = index.r + r;
    i.g = index.g + r;
    i.b = index.b + r;
    i.a = index.a + r;
    return i;
}

function arrayToPixel(arr) {
    return {
        r: arr[0],
        g: arr[1],
        b: arr[2],
        a: arr[3]
    }
}

function pixelAt(x, y) {
    return arrayToPixel(arrayAt(x, y));
}

function arrayAtIndex(i) {
    return [data[i], data[i+1], data[i+2], data[i+3]];
}

function arrayAt(x, y) {
    let i = (y*w + x) * 4;
    return arrayAtIndex(i);
}

function pixelToArray(p) {
    return [p.r, p.g, p.b, p.a];
}

function rgbaToArr(hex) {
    if(isNaN((hex >> 16) & 0xff)) {
        console.log('bad color:', hex);
    }
    return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff, (hex >> 24) & 0xff];
}

function rgbToArr(hex) {
    return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff, 0xff];
}

function colorDiff2(arr1, arr2) {
    // console.log('arr1', arr1, 'arr2', arr2);
    let dR = (arr1[0] - arr2[0]) / 255;
    let dG = (arr1[1] - arr2[1]) / 255;
    let dB = (arr1[2] - arr2[2]) / 255;
    let dA = (arr1[3] - arr2[3]) / 255;

    let dRGB2 = dR*dR + dG*dG + dB*dB;
    // return dA*dA / 2 + dRGB2 * arr1[3] * arr2[3] / (255 * 255);
    // console.log('diff:', dRGB2 + dA*dA)
    return dRGB2 * (arr1[3] + arr2[3]) / (2 * 255) + dA*dA;
}

function colorDiff(arr1, arr2) {
    return Math.sqrt(colorDiff2(arr1, arr2));
}

function dist2(x1, y1, x2, y2) {
    let dX = x1 - x2;
    let dY = y1 - y2;
    return dX*dX + dY*dY;
}

function dist(x1, y1, x2, y2) {
    return Math.sqrt(dist2(x1, y1, x2, y2));
}

function closestPaletteIndex(arr, pal=palette) {
    let index = 0;
    let min = colorDiff2(arr, pal[index]);
    // console.log(arr, pal);
    for(let i = 1; i < pal.length; i++) {
        let diff2 = colorDiff2(arr, pal[i]);
        if(diff2 < min) {
            index = i;
            min = diff2;
        }
    }
    return index;
}

function getError(og, appr) {
    return [og[0] - appr[0], og[1] - appr[1], og[2] - appr[2], og[3] - appr[3]]
}

function floydSteinberg() {
    if(typeof(Worker) === 'undefined') {
        console.log("Workers not supported.");
        return -1;
    }
    var worker = new Worker('floydSteinbergWorker.js');
    worker.onmessage = function(e) {
        if(e.data == 'term') {
            console.log(e.data);
            worker.terminate();
            delete worker;
            afterWorkers();
            return;
        }
        imgData = e.data;
        data = imgData.data;

        ctx.putImageData(imgData, 0, 0);
    }

    worker.postMessage([imgData, palette, w, h]);
}

function kMeansPalette(k) {
    let newPalette = []; // centers
    let points = [];
    for(let i = 0; i < k; i++) {
        // newPalette.push(arrayAt(Math.floor(Math.random() * w), Math.floor(Math.random() * h)));
        newPalette.push(rgbaToArr(Math.floor(Math.random() * 0xffffffff)));
        points.push([]);
    }
    let changed = true;
    let count = 0;
    while(changed && count < 10 * k) {
        changed = false;
        console.log(JSON.stringify(newPalette));
        for(let x = 0; x < w; x++) {
            for(let y = 0; y < h; y++) {
                let arr = arrayAt(x, y);
                let p = closestPaletteIndex(arr, newPalette);
                points[p].push(arr);
            }
        }
        // console.log(points);
        for(let i = 0; i < k; i++) {
            let sum = [0,0,0,0];
            for(let j = 0; j < points[i].length; j++) {
                for(let m = 0; m < 4; m++) {
                    sum[m] += points[i][j][m];
                }
            }
            for(let m = 0; m < 4; m++) {
                let newColor = sum[m] / points[i].length;
                changed |= Math.abs(newColor - newPalette[i][m]) > 2;
                if(!isNaN(newColor)) {
                    newPalette[i][m] = Math.floor(newColor);
                } else {
                    console.log('randomizing', i)
                    newPalette[i][m] = Math.floor(Math.random() * 0xff);
                    newPalette[i][m] = arrayAt(Math.floor(Math.random() * w), Math.floor(Math.random() * h))[m];
                    changed = true;
                }
            }
        }
        count++;
        // console.log(changed);
    }
    if(count == 10 * k) {
        console.log('timed out');
    }
    for(let i = 0; i < k; i++) {
        palette.push(newPalette[i])
    }
    // palette = newPalette;
}

function myDither() {
    if(typeof(Worker) === 'undefined') {
        console.log("Workers not supported.");
        return -1;
    }
    let worker = new Worker('myDitherWorker.js');
    worker.onmessage = function(e) {
        imgData = e.data;
        data = imgData.data;
        // console.log('imgData.data', imgData.data, 'data', data, 'e.data.data', e.data.data);
        ctx.putImageData(imgData, 0, 0);
    }
    // msg = JSON.parse(JSON.stringify({
    //     data:Array.prototype.slice.call(data),
    //     palette:palette,
    //     w:w,
    //     h:h,
    // }));
    // worker.postMessage(msg);
    worker.postMessage([imgData, palette, w, h]);
}

function normalize() {
    for(let it = 0; it < 10; it++) {
        for(let x = 0; x < w; x++) {
            var r = 0, g = 0, b = 0;
            for(let y = 0; y < h; y++) {
                // console.log('x', x, 'y', y);
                let i = indecesOf(x, y);
                // console.log('i', i, 'i.r', i.r, 'i.g', i.g, 'i.b', i.b, 'i.a', i.a);
                // console.log('[', data[i.r], data[i.g], data[i.b], data[i.a], ']')

                r += data[i.r];
                g += data[i.g];
                b += data[i.b];
            }
            r /= h;
            g /= h;
            b /= h;
            let dR = 127 - r;
            let dG = 127 - g;
            let dB = 127 - b;

            for(let y = 0; y < h; y++) {
                let i = indecesOf(x, y);
                data[i.r] += dR;
                data[i.g] += dG;
                data[i.b] += dB;
            }
        }
        for(let y = 0; y < h; y++) {
            var r = 0, g = 0, b = 0;
            for(let x = 0; x < w; x++) {
                // console.log('x', x, 'y', y);
                let i = indecesOf(x, y);
                // console.log('i', i, 'i.r', i.r, 'i.g', i.g, 'i.b', i.b, 'i.a', i.a);
                // console.log('[', data[i.r], data[i.g], data[i.b], data[i.a], ']')

                r += data[i.r];
                g += data[i.g];
                b += data[i.b];
            }
            r /= w;
            g /= w;
            b /= w;
            let dR = 127 - r;
            let dG = 127 - g;
            let dB = 127 - b;

            for(let x = 0; x < w; x++) {
                let i = indecesOf(x, y);
                data[i.r] += dR;
                data[i.g] += dG;
                data[i.b] += dB;
            }
        }
    }
    ctx.putImageData(imgData, 0, 0);
}

function leastAvgPalette(k) {
    /*
     * as expected, this doesn't work very well.
    */
    let i = 0;
    if(palette.length == 0) {
        // average pixels
        sum = [0,0,0,0];
        for(let x = 0; x < w; x++) {
            for(let y = 0; y < h; y++) {
                let arr = arrayAt(x, y);
                for(let z = 0; z < 4; z++) {
                    sum[z] += arr[z];
                }
            }
        }
        for(let z = 0; z < 4; z++) {
            sum[z] /= w * h;
        }
        // add to palette
        palette.push(sum);
        i++;
    }
    for( ; i < k; i++) {
        // average colors
        avg = [0,0,0,0];
        for(let p = 0; p < palette.length; p++) {
            for(let z = 0; z < 4; z++) {
                avg[z] += palette[p][z];
            }
        }
        for(let z = 0; z < 4; z++) {
            avg[z] /= palette.length;
        }
        // find furthest pixel color
        let farthest = null;
        let maxDist = 0;
        for(let x = 0; x < w; x++) {
            for(let y = 0; y < h; y++) {
                let arr = arrayAt(x, y);
                let dist = colorDiff2(arr, avg);
                if(farthest == null || dist > maxDist) {
                    farthest = arr;
                    maxDist = dist;
                }
            }
        }
        // add to palette
        palette.push(farthest);
    }
}

function disperatePalette(k) {
    // average pixels (first color)
    let i = 0;
    let avgIdx = -1;
    if(palette.length == 0) {
        // average pixels
        sum = [0,0,0,0];
        for(let x = 0; x < w; x++) {
            for(let y = 0; y < h; y++) {
                let arr = arrayAt(x, y);
                for(let z = 0; z < 4; z++) {
                    sum[z] += arr[z];
                }
            }
        }
        for(let z = 0; z < 4; z++) {
            sum[z] /= w * h;
        }
        avgIdx = palette.length;
        // add to palette
        palette.push(sum);
        // i++;
    }
    // for numColors-1:
    for( ; i < k; i++) {
        // find pixel furthest from all colors
        let farthest = null;
        let maxDist = -1;
        for(let x = 0; x < w; x++) {
            for(let y = 0; y < h; y++) {
                let arr = arrayAt(x, y);
                let minDist = null;
                let prodDist = 1;
                for(let p = 0; p < palette.length; p++) {
                    let dist = colorDiff2(arr, palette[p]);
                    if(minDist == null || dist < minDist) {
                        minDist = dist;
                    }
                    prodDist *= dist;
                }
                if(farthest == null || minDist > maxDist) {
                    farthest = arr;
                    maxDist = minDist;
                }
                // if(farthest == null || prodDist > maxDist) {
                //     farthest = arr;
                //     maxDist = prodDist;
                // }
            }
        }
        // add to palette
        palette.push(farthest);
    }
    if(avgIdx != -1) {
        palette.splice(avgIdx, 1);
    }
}

function r_quadTree(x1, y1, x2, y2, theta) {
    // console.log('(', x1, y1, ')', '(', x2, y2, ')');
    if(x1 == x2 && y1 == y2) {
        console.log('leaf reached');
        return;
    }
    if(x1 > x2 || y1 > y2 || x1 < 0 || y1 < 0 || x2 > w || y2 > h) {
        console.log("quadTree(x1,y1,x2,y2): invalid params");
        console.log(x1, y1, x2, y2);
        return -1;
    }
    // check is should split
    // - get average
    let avg = [0,0,0,0];
    let count = 0;
    for(let x = x1; x < x2; x++) {
        for(let y = y1; y < y2; y++) {
            let arr = arrayAt(x, y);
            for(let z = 0; z < 4; z++) {
                avg[z] += arr[z];
            }
            count++;
        }
    }
    for(let z = 0; z < 4; z++) {
        avg[z] /= count;
    }
    // - calculate average distance to each pixel
    let avgDist = 0;
    for(let x = x1; x < x2; x++) {
        for(let y = y1; y < y2; y++) {
            let arr = arrayAt(x, y);
            avgDist += colorDiff(arr, avg); // might want sqrt here?
        }
    }
    avgDist /= count;
    // - compare to arbitrary threshold
    if(avgDist > theta) {
        // console.log('split!');
        // split
        let midX = Math.floor((x1 + x2) / 2);
        let midY = Math.floor((y1 + y2) / 2);
        // recurse on 4 quadrants
        r_quadTree(x1, y1, midX, midY, theta);
        r_quadTree(midX, y1, x2, midY, theta);
        r_quadTree(x1, midY, midX, y2, theta);
        r_quadTree(midX, midY, x2, y2, theta);
    } else {
        // console.log('consolidate');
        // set all pixels to average
        for( let x = x1; x < x2; x++) {
            for(let y = y1; y < y2; y++) {
                let p = closestPaletteIndex(avg);
                let i = indecesOf(x, y);

                data[i.r] = avg[0];
                data[i.g] = avg[1];
                data[i.b] = avg[2];
                data[i.a] = avg[3];

                // data[i.r] = palette[p][0];
                // data[i.g] = palette[p][1];
                // data[i.b] = palette[p][2];
                // data[i.a] = palette[p][3];
            }
        }
    }
    ctx.putImageData(imgData, 0, 0);
}

function quadTree(theta=0.1) {
    r_quadTree(0, 0, w, h, theta);
}

/* cluster:
 * - x, y
 * - color
 * - weight (number of points)
 * - indexes of points contained
 * - child clusters
 * - threshold distance
 */
var clusters;

function clusterInit() {
    clusters = [];
    for(let x = 0; x < w; x++) {
        for(let y = 0; y < h; y++) {
            let c = {
                x:x,
                y:y,
                color:arrayAt(x, y),
                weight:1,
                indeces:[indecesOf(x, y)],
                children:[],
                theta:0
            }
            clusters.push(c);
        }
    }
}

/*
 * gamma: weight of color distance
 * delta: weight of euclidian distance
 */
function clusterDist(c1, c2, gamma, delta) {
    if(c1.color == undefined || c2.color == undefined) {
        console.log(c1.color, c2.color);
        console.log('(', c1.x, c1.y, ')', '(', c2.x, c2.y, ')');
    }
    let colorDist = colorDiff(c1.color, c2.color) / 3;
    let euclidDist = dist(c1.x, c1.y, c2.x, c2.y) / dist(0, 0, w, h);

    return gamma*colorDist + delta*euclidDist;
}

/*
 * theta: merge distance
 */
function clusterMerge(c1, c2, theta) {
    let newWeight = c1.weight + c2.weight;
    let newColor = [];
    for(let i = 0; i < 4; i++) {
        newColor.push((c1.weight*c1.color[i] + c2.weight*c2.color[i]) / newWeight);
    }

    let c = {
        x:(c1.weight*c1.x + c2.weight*c2.x) / newWeight,
        y:(c1.weight*c1.y + c2.weight*c2.y) / newWeight,
        color:newColor,
        weight:newWeight,
        indeces:c1.indeces.concat(c2.indeces),
        children:[c1, c2],
        theta:theta
    }
    return c;
}

function heirarchicalCluster(gamma=0.1, delta=0.9) {
    clusterInit();
    let S = [];
    while(clusters.length > 1) {
        if(clusters.length % 1000 == 0) {
            console.log(clusters.length);
        }
        if(S.length == 0) {
            // start with random cluster
            S.push(clusters[Math.floor(Math.random() * clusters.length)]);
        }
        let C = S.pop();
        // find closest active cluster
        let D = null;
        let minDist;
        for(let i = 0; i < clusters.length; i++) {
            if(clusters[i] != C) {
                cluster = clusters[i];
                if(C == undefined || cluster == undefined) {
                    console.log(C, cluster);
                    console.log(i);
                }
                let dist = clusterDist(C, cluster, gamma, delta);
                if(D == null || dist < minDist) {
                    D = cluster;
                    minDist = dist;
                }
            }
        }
        if(S.includes(D)) {
            // then D is immediate predecessor
            S.pop();
            clusters.splice(clusters.indexOf(C), 1);
            clusters.splice(clusters.indexOf(D), 1);
            let merged = clusterMerge(C, D, minDist);
            clusters.push(merged);
        } else {
            S.push(C);
            S.push(D);
        }
    }
    slider.step = clusters[0].theta / 1000;
    slider.max = clusters[0].theta;
}

function colorClusters(theta=2, C=clusters) {
    // console.log('coloring clusters', theta);
    for(let i = 0; i < C.length; i++) {
        let cluster = C[i];
        if(cluster.theta < theta) {
            for(let j = 0; j < cluster.indeces.length; j++) {
                let idx = cluster.indeces[j];
                for(let k = 0; k < 4; k++) {
                    data[idx.r+k] = cluster.color[k];
                }
            }
        } else {
            colorClusters(theta, cluster.children);
        }
    }
    ctx.putImageData(imgData, 0, 0);
}

function sortAtPixel(p, arr=pixels, alpha=1, mask=0xffffffff) {
    // let shouldSwap = (0xff & arr[p]) < (0xff & arr[p-1]);
    let values = new Uint32Array(2);
    values[0] = arr[p] & mask;
    values[1] = arr[p-1] & mask;
    while(p > 0 && Math.random() < alpha && values[0] < values[1]) {
        // console.log(arr[p].toString(16), arr[p-1].toString(16));
        arr.swap(p, p-1);
        p--;
        values[0] = arr[p] & mask;
        values[1] = arr[p-1] & mask;
    }
}

// non-stable sort
function quickSortPixels(lo, hi, mask=0xffffffff) {
  if(lo >= hi) {
    return
  }
  sorted = true
  for(let i = lo; i < hi-1; i++) {
    if(pixels[i] > pixels[i+1]) {
      sorted = false
      break
    }
  }
  if(sorted) {
    return
  }
  // console.log(lo + " " + hi)
  idx = Math.floor(Math.random() * (hi - lo) + lo)
  let values = new Uint32Array(2); // must use uint to ensure integrity
  values[0] = pixels[idx] & mask // pivot
  pixels.swap(lo, idx)
  idx = lo
  for(let i = idx; i < hi; i++) {
    values[1] = pixels[i] & mask
    if(values[1] < values[0]) {
      pixels.swap(i, idx+1)
      idx = idx+1
    }
  }
  pixels.swap(lo, idx)
  quickSortPixels(lo, idx)
  quickSortPixels(idx+1, hi)
}

function sortPixels() {
    console.log('Sorting pixels');
    // for(let p = 0; p < pixels.length; p++) {
    //     if(p % 1000 == 0) {
    //         console.log(p + " / " + pixels.length);
    //     }
    //     sortAtPixel(p);
    // }
    quickSortPixels(0, pixels.length);
    console.log('complete')
}

function sortRows(strength=1) {
    for(let y = 0; y < h; y++) {
        arr = pixels.slice(y*w, (y+1)*w);
        // console.log(arr)
        for(let x = 0; x < w; x++) {
            sortAtPixel(x, arr, strength);
        }
        for(let x = 0; x < w; x++) {
            pixels[y*w + x] = arr[x];
        }
    }
}

function sortCols(strength=1) {
    for(let x = 0; x < w; x++) {
        let arr = new Uint32Array(h);
        for(let y = 0; y < h; y++) {
            arr[y] = pixels[x + y*w];
        }
        for(let y = 0; y < h; y++) {
            sortAtPixel(y, arr, strength);
        }
        for(let y = 0; y < h; y++) {
            pixels[x + y*w] = arr[y];
        }
    }
}

function sortDiagonal(strength=1) {
    let d = 0;
    while(d < w + h) {
        let x;
        let y;
        if(d < w) {
            x = d;
            y = 0;
        } else {
            x = w;
            y = d - w;
        }
        let arr = new Uint32Array(x);
        if(h - y < x) {
            arr = new Uint32Array(h - y);
        }
        // console.log(d, arr.length);
        for(let i = 0; i < arr.length; i++) {
            arr[i] = pixels[(y+i)*w + (x-i)];
        }
        for(let i = 0; i < arr.length; i++) {
            sortAtPixel(i, arr, strength, 0xffffff);
        }
        for(let i = 0; i < arr.length; i++) {
            pixels[(y+i)*w + (x-i)] = arr[i];
        }
        d++;
    }
}

function sortOtherDiagonal(strength=1) {
    let d = 0;
    while(d < w + h) {
        let x;
        let y;
        if(d < w) {
            x = d;
            y = 0;
        } else {
            x = w;
            y = d - w;
        }
        let arr = new Uint32Array(x);
        if(h - y < x) {
            arr = new Uint32Array(h - y);
        }
        // console.log(d, arr.length);
        for(let i = 0; i < arr.length; i++) {
            arr[i] = pixels[(y+i)*w + w-(x-i)];
        }
        for(let i = 0; i < arr.length; i++) {
            sortAtPixel(i, arr, strength, 0xffffff);
        }
        for(let i = 0; i < arr.length; i++) {
            pixels[(y+i)*w + w-(x-i)] = arr[i];
        }
        d++;
    }
}

Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

var grayscale;

function toGrayscale() {
    grayscale = new Array(w*h);
    for(let g = 0; g < data.length/4; g++) {
        let i = g*4;
        let linR = gammaExpand(data[i]/255);
        let linG = gammaExpand(data[i+1]/255);
        let linB = gammaExpand(data[i+2]/255);
        grayscale[g] = 2*gammaCompress(0.2126*linR + 0.7152*linG + 0.0722*linB)-1;
    }
}

function fromGrayscale(dest=data, src=grayscale, alpha=true) {
    for(let g = 0; g < data.length/4; g++) {
        let i = 4*g;
        let gray = (src[g].clamp(-1, 1)+1)/2*255;
        dest[i] = gray;
        dest[i+1] = gray;
        dest[i+2] = gray;
        if(!alpha) {
            dest[i+3] = 255;
        }
    }
}

function gammaExpand(value) {
    if(value > 0.04045) {
        return Math.pow((value + 0.055)/1.055, 2.4);
    } else {
        return value/12.92;
    }
}

function gammaCompress(value) {
    if(value > 0.0031308) {
        return 1.055 * Math.pow(value, 1/2.4) - 0.055;
    } else {
        return 12.92 * value;
    }
}

var pixels;

function toPixels() {
    pixels = new Uint32Array(w*h);
    for(let p = 0; p < data.length/4; p++) {
        let i = p*4
        pixels[p] |= data[i+3] << 24;
        pixels[p] |= data[i] << 16;
        pixels[p] |= data[i+1] << 8;
        pixels[p] |= data[i+2];
    }
}

function fromPixels() {
    for(let p = 0; p < data.length/4; p++) {
        let i = 4*p;
        data[i] = (pixels[p] >> 16) & 0xff;
        data[i+1] = (pixels[p] >> 8) & 0xff;
        data[i+2] = (pixels[p]) & 0xff;
        data[i+3] = (pixels[p] >> 24) & 0xff;
    }
}

function heavyColor() {
    for(let p = 0; p < pixels.length; p++) {
        pixels[p] &= 0xffc0c0c0
    }
}

function justAlpha() {
    for(let p = 0; p < pixels.length; p++) {
        pixels[p] &= 0xff000000
    }
}

function toRadians(value) {
    return value * Math.PI / 180;
}

function addWave(theta=0, amp=64, lambda=15, arr=grayscale) {
    for(let x = 0; x < w; x++) {
        for(let y = 0; y < h; y++) {
            let g = y*w + x;
            let xx = x - w/2;
            let yy = y - h/2;
            let dist = Math.cos(Math.atan2(yy, xx) - toRadians(theta)) * Math.sqrt(xx*xx + yy*yy);
            arr[g] = (arr[g] + amp * Math.sin(dist * 2 * Math.PI / lambda));
        }
    }
}

function matchWave(theta=0, lambda=15, arr=grayscale) {
    let strength = 0
    for(let x = 0; x < w; x++) {
        for(let y = 0; y < h; y++) {
            let g = y*w + x;
            let xx = x - w/2;
            let yy = y - h/2;
            let dist = Math.cos(Math.atan2(yy, xx) - toRadians(theta)) * Math.sqrt(xx*xx + yy*yy);
            strength += arr[g] * Math.sin(dist * 2 * Math.PI / lambda);
        }
    }
    return strength/w/h;
}

var fourier;
var f_grayscale;


var x = 0;
var y = 0;
function toFourierLoop() {
    let g = y*w + x;
    let xx = x - w/2;
    let yy = y - h/2;
    let dist = Math.sqrt(xx*xx + yy*yy);
    if(dist != 0) {
        f_grayscale[g] = matchWave(Math.atan2(yy, xx), h/2/dist, grayscale);
    }

    fromGrayscale(fourier.data, f_grayscale, false);
    ctx.putImageData(fourier, 0, 0);

    y++;
    if(y >= h) {
        y = 0;
        x++;
    }
    if(x < w) {
        window.requestAnimationFrame(toFourierLoop);
    } else {
        console.log('done');
        grayscale.fill(0);
        x = 0;
        y = 0;
        window.requestAnimationFrame(fromFourierLoop);
    }
}

function fromFourier() {
    for(let x = w/2 - 20; x < w/2 + 20; x++) {
        for(let y = h/2 - 20; y < h/2 + 20; y++) {
            let g = y*w + x;
            let xx = x - w/2;
            let yy = y - h/2;
            let dist = Math.sqrt(xx*xx + yy*yy);
            if(dist != 0) {
                addWave(Math.atan2(yy, xx), f_grayscale[g], h/2/dist, grayscale);
                // addWave(Math.atan2(yy, xx), 2, h/dist, f_grayscale);
            }
        }
    }
}

function fromFourierLoop() {
    let g = y*w + x;
    let xx = x - w/2;
    let yy = y - h/2;
    let dist = Math.sqrt(xx*xx + yy*yy);
    if(dist != 0) {
        addWave(Math.atan2(yy, xx), f_grayscale[g], h/2/dist, grayscale);
        // addWave(Math.atan2(yy, xx), 2, h/dist, grayscale);
    }

    fromGrayscale(data, grayscale, false);
    ctx.putImageData(imgData, 0, 0);

    y++;
    if(y >= h) {
        y = 0;
        x++;
    }
    if(x < w) {
        window.requestAnimationFrame(fromFourierLoop);
    } else {
        console.log('done');
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

function centerPath(path) {
    for(let i = 0; i < path.length; i+=2) {
        path[i] -= w/2;
        path[i+1] -= h/2;
    }
    return path;
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

var countPerOne = 360;
var paths = [];
var deg = 20;
var numCircles = null;
var drawPath = true;

function circlesLoop() {
    ctx.clearRect(0, 0, w, h);
    // ctx.drawImage(img, 0, 0, w, h);
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

    palette = [[0,0,0,0],[0,0,0,0]];
    // palette = [];
    // kMeansPalette(8);
    // leastAvgPalette(8);
    disperatePalette(16);
    // console.log(palette);

    // normalize();

    // myDither();

    // floydSteinberg();

    quadTree(0.1);

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
    ctx.putImageData(imgData, 0, 0);

    // console.log(data);

    // w = cvs.width = 480;
    // h = cvs.height = 480;

    // circlesLoop();

    // randomizePath(3);
    // linearizePath(1);
    // epicycles();
    console.log("complete.")
}

function randomizePath(numPoints) {
    _path = []
    for(let i = 0; i < numPoints; i++) {
        // let mag = (Math.random() * w/2);
        // _path.push(mag * Math.cos(i/numPoints * 2*Math.PI));
        // _path.push(mag * Math.sin(i/numPoints * 2*Math.PI));

        _path.push(Math.random() * w - w/2);
        _path.push(Math.random() * h - h/2);
    }
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
    complex = getComplexFromPath(deg, path);
    circles = getCirclesFromComplex(complex);
    sortCircles();
    circlesLoop();
}

function afterWorkers() {
    // toGrayscale();
    // fromGrayscale();
    toPixels();
    // drawLoop();
}

var count = 0;

function drawLoop() {
    toPixels();
    // sortRows(Math.tanh(count/160));
    // sortCols(Math.tanh(count/160));
    sortDiagonal(Math.tanh(count/80));
    sortOtherDiagonal(Math.tanh(count/80));
    fromPixels();

    ctx.putImageData(imgData, 0, 0);

    if(true || count < 35) {
        window.requestAnimationFrame(drawLoop);
    }
    count++;
}

function init() {
    console.log("loaded.");

    cvs = document.getElementById('canvas');
    ctx = cvs.getContext('2d');

    // slider = document.getElementById("slider");
    //
    // if(slider) {
    //     slider.oninput = function() {
    //         colorClusters(this.value);
    //     }
    // }
}

window.onload = init

var img

window.addEventListener('submit', function() {
  document.querySelector('input[type="file"]').addEventListener('change', function() {
      if (this.files && this.files[0]) {
          var img = document.querySelector('img');  // $('img')[0]
          img.src = URL.createObjectURL(this.files[0]); // set src to file url
          img.onload = imageIsLoaded; // optional onload event listener
      }
  });
});

function imageIsLoaded(e) {
  var modal = document.querySelector('div#modal').style.display = "none";
  console.log(e);
  w = window.innerWidth;
  h = window.innerHeight;
  var factor = 1;
  if(img.width > w) {
    factor = w/img.width
  }
  if(img.height*factor > h) {
    factor = h/img.height
  }
  w = cvs.width = img.width * factor
  h = cvs.height = img.height * factor
  // w = cvs.width = img.width;
  // h = cvs.height = img.height;
  ctx.drawImage(img, 0, 0, w, h);
  cvs.style.display = "block"
  main();
}

function uploadImage() {
  files = document.querySelector('input[type="file"]').files
  if (files && files[0]) {
    console.log("uploading image")
    img = document.querySelector('img');
    img.src = URL.createObjectURL(files[0]);
    img.onload = imageIsLoaded;
  } else {
    console.log("no file selected")
    alert("No File Selected.");
  }
}
