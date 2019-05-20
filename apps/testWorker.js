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
  return [data[i], data[i + 1], data[i + 2], data[i + 3]];
}

function arrayAt(x, y) {
  let i = (y * w + x) * 4;
  return arrayAtIndex(i);
}

function colorDiff2(arr1, arr2) {
  // console.log('arr1', arr1, 'arr2', arr2);
  let dR = (arr1[0] - arr2[0]) / 255;
  let dG = (arr1[1] - arr2[1]) / 255;
  let dB = (arr1[2] - arr2[2]) / 255;
  let dA = (arr1[3] - arr2[3]) / 255;

  let dRGB2 = dR * dR + dG * dG + dB * dB;
  // return dA*dA / 2 + dRGB2 * arr1[3] * arr2[3] / (255 * 255);
  // console.log('diff:', dRGB2 + dA*dA)
  return dRGB2 * arr1[3] * arr2[3] / 255 / 255 + dA * dA;
}

function closestPaletteIndex(arr, pal = palette) {
  let index = 0;
  let min = colorDiff2(arr, pal[index]);
  // console.log(arr, pal);
  for (let i = 1; i < pal.length; i++) {
    let diff2 = colorDiff2(arr, pal[i]);
    if (diff2 < min) {
      index = i;
      min = diff2;
    }
  }
  return index;
}

function getError(og, appr) {
  return [og[0] - appr[0], og[1] - appr[1], og[2] - appr[2], og[3] - appr[3]]
}

var x = 0
var y = 0

function w_test() {
  console.log('testWorker started.')
  let count = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let i = indecesOf(x, y);
      data[i.r] = 0xff;
      data[i.g] = 0xff;
      data[i.b] = 0xff;
      data[i.a] = 0xff;
      
      count++
    }
    // console.log("row", y, "complete.")
    postMessage({
      imgData
    })
  }
  // postMessage(imgData);
  postMessage({imgData})
  console.log('testWorker finished.');
  postMessage('term');
}

function w_test2() {
  postMessage({
    imgData
  })
  console.log('testWorker finished.');
  postMessage('term')
}

var cvs, ctx
var imgData, data;
var palette;
var w, h;

onmessage = function(msg) {
  imgData = msg.data.imgData
  data = imgData.data
  w = msg.data.w
  h = msg.data.h

  w_test(); // animation loop
}

console.log('testWorker created.');
