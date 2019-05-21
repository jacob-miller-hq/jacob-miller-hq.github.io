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

var count = 0
const PERIOD = 1000 / 60 // ms
let dt = new Date()
let last = dt.getTime()
var hasChanged = false
var x = 0
var y = 0

function w_loop() {
  // console.log('testWorker started.')
  for (; y < h; y++) {
    for (; x < w; x++) {
      // for(let z = 0; z < 100000; z++) {}
      let i = indecesOf(x, y);
      data[i.r] = 0xff;
      data[i.g] = 0xff;
      data[i.b] = 0xff;
      data[i.a] = 0xff;

      count++
      hasChanged = true

      dt = new Date()
      let now = dt.getTime()
      // console.log(now, last, PERIOD)
      if (now > last + PERIOD) {
        last = now
        setTimeout(w_loop, 10)
        // console.log('testWorker paused.')
        return
      }
    }
    x = 0
    // postMessage(imgData)
  }
  postMessage(imgData)
  // console.log('testWorker finished.');
  postMessage('term');
}

var cvs, ctx
var imgData, data;
var palette;
var w, h;

onmessage = function(msg) {
  if (msg.data == "prog") {
    if (hasChanged) {
      hasChanged = false
      perc = 100 * count / (w * h)
      postMessage({
        'tag': "prog",
        perc
      })
      postMessage(imgData)
      return
    } else {
      return
    }
  }
  imgData = msg.data.imgData
  data = imgData.data
  w = msg.data.w
  h = msg.data.h

  w_loop(); // animation loop
}

console.log('testWorker created.');
