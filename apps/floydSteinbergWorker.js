var imgData, data;
var palette;
var w, h;

function indecesOf(x, y) {
    let r = (y * w + x) * 4;
    let i = {};
    i.r = r;
    i.g = r + 1;
    i.b = r + 2;
    i.a = r + 3;
    return i;
}

function arrayAtIndex(i) {
    return [data[i], data[i+1], data[i+2], data[i+3]];
}

function arrayAt(x, y) {
    let i = (y*w + x) * 4;
    return arrayAtIndex(i);
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
    return dRGB2 * arr1[3] * arr2[3] / 255 / 255 + dA*dA;
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

function w_floydSteinberg() {
    let count = 0;
    for(let y = 0; y < h; y++) {
        for(let x = 0; x < w; x++) {
            let i = indecesOf(x, y);
            let arr = arrayAt(x, y);
            let p = closestPaletteIndex(arr);
            data[i.r] = palette[p][0];
            data[i.g] = palette[p][1];
            data[i.b] = palette[p][2];
            data[i.a] = palette[p][3];

            let err = getError(arr, palette[p]);

            // standard error dissapation values
            let f1 = 7/16;
            let f2 = 3/16;
            let f3 = 5/16;
            let f4 = 1/16;

            // experimental values
            // let f1 = 0;
            // let f2 = 0;
            // let f3 = 0;
            // let f4 = 0;

            let i1 = indecesOf(x+1, y);
            data[i1.r] += err[0] * f1;
            data[i1.g] += err[1] * f1;
            data[i1.b] += err[2] * f1;
            data[i1.a] += err[3] * f1;
            let i2 = indecesOf(x+1, y+1);
            data[i2.r] += err[0] * f2;
            data[i2.g] += err[1] * f2;
            data[i2.b] += err[2] * f2;
            data[i2.a] += err[3] * f2;
            let i3 = indecesOf(x, y+1);
            data[i3.r] += err[0] * f3;
            data[i3.g] += err[1] * f3;
            data[i3.b] += err[2] * f3;
            data[i3.a] += err[3] * f3;
            let i4 = indecesOf(x-1, y+1);
            data[i4.r] += err[0] * f4;
            data[i4.g] += err[1] * f4;
            data[i4.b] += err[2] * f4;
            data[i4.a] += err[3] * f4;

            count++;
        }
    }
    console.log('worker finished.');
    postMessage(imgData);
    postMessage('term');
}

onmessage = function(e) {
    imgData = e.data[0];
    data = imgData.data;
    palette = e.data[1];
    w = e.data[2];
    h = e.data[3];

    w_floydSteinberg();
}

console.log('worker started.');
