/**
 * recieves the imgData, w, h, as well as the name of the filter
 */

const PERIOD = 1000 / 60 // ms
var last
var hasChanged = false

function w_loop() {
  let dt = new Date()
  last = dt.getTime()
  while (filter.step() == 0) {
    // for(let z = 0; z < 100000; z++) {} // artificial delay
    hasChanged = true

    dt = new Date()
    let now = dt.getTime()
    if (now > last + PERIOD) {
      last = now
      setTimeout(w_loop, 10)
      return
    }
  }
  postMessage(imgData)
  let perc = filter.perc()
  postMessage({
    'tag': "prog",
    perc
  })
  console.log('poly-worker finished.');
  postMessage('term');
}

var imgData, data
var filter

onmessage = function(msg) {
  if (msg.data == "prog") {
    if (hasChanged) {
      hasChanged = false
      let perc = filter.perc()
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
  let w = msg.data.w
  let h = msg.data.h
  switch (msg.data.filter) {
    case "test":
      filter = testFilter(w, h)
      break
    case "fs":
      filter = fsFilter(w, h, msg.data.palette)
      break
    case "qt":
    case "quad":
      filter = qtFilter(w, h, msg.data.maxSplits, imgData, msg.data.maxDepth)
      break
  }
  console.log(filter)

  console.log('poly-worker started')
  w_loop(); // animation loop
}

console.log('poly-worker created.');

//// Filter definitions ////
/*
 * filter:
 *     step(data) - performs one step of the filter, returns non-zero on complete
 *     getPerc() - returns the percentage complete
 */

function testFilter(w, h) {
  this.x = 0
  this.y = 0
  this.step = function() {
    // for(let z = 0; z < 100000; z++) // artificial delay
    if (this.x > w) {
      this.x = 0
      this.y++
    }
    if (this.y > h) {
      return -1
    }
    let i = indecesOf(this.x, this.y, w)
    data[i.r] = 0xff;
    data[i.g] = 0xff;
    data[i.b] = 0xff;
    data[i.a] = 0xff;

    this.x++
    return 0
  }
  this.perc = function() {
    return 100 * (y * w + x) / (w * h)
  }
  return this
}

function fsFilter(w, h, palette) {
  this.x = 0
  this.y = 0
  this.palette = palette
  this.step = function() {
    if (this.x > w) {
      this.x = 0
      this.y++
    }
    if (this.y > h) {
      return -1
    }

    let i = indecesOf(x, y, w);
    let arr = arrayAt(x, y, w, data);
    let p = closestPaletteIndex(arr, palette);

    data[i.r] = palette[p][0];
    data[i.g] = palette[p][1];
    data[i.b] = palette[p][2];
    data[i.a] = palette[p][3];

    let err = getError(arr, palette[p]);

    // standard error dissapation values
    let f1 = 7 / 16;
    let f2 = 3 / 16;
    let f3 = 5 / 16;
    let f4 = 1 / 16;

    let i1 = indecesOf(x + 1, y, w);
    data[i1.r] += err[0] * f1;
    data[i1.g] += err[1] * f1;
    data[i1.b] += err[2] * f1;
    data[i1.a] += err[3] * f1;
    let i2 = indecesOf(x + 1, y + 1, w);
    data[i2.r] += err[0] * f2;
    data[i2.g] += err[1] * f2;
    data[i2.b] += err[2] * f2;
    data[i2.a] += err[3] * f2;
    let i3 = indecesOf(x, y + 1, w);
    data[i3.r] += err[0] * f3;
    data[i3.g] += err[1] * f3;
    data[i3.b] += err[2] * f3;
    data[i3.a] += err[3] * f3;
    let i4 = indecesOf(x - 1, y + 1, w);
    data[i4.r] += err[0] * f4;
    data[i4.g] += err[1] * f4;
    data[i4.b] += err[2] * f4;
    data[i4.a] += err[3] * f4;

    this.x++
    return 0
  }
  this.perc = function() {
    return 100 * (y * w + x) / (w * h)
  }
  return this
}

// TODO allow for other splitting heuristics than random
// ^ will mean changing perc() which is broken currently
function qtFilter(w, h, maxSplits, ogImgData, maxDepth=8) {
  let maxGrowable = (4 ** (maxDepth+1) - 1) / 3
  console.log(maxGrowable)
  this.ctx = new OffscreenCanvas(w, h).getContext("2d")
  this.ctx.putImageData(ogImgData, 0, 0)
  this.splits = 0
  this.root = {
    x1: 0,
    y1: 0,
    x2: w,
    y2: h,
    grown: false,
    split: true,
    color: undefined,
    depth: 0,
    branches: []
  }
  this.numGrown = 0
  this.queue = [this.root]
  this.step = function() {

    if(this.numGrown < maxGrowable - maxSplits && this.grow(this.root) == 0) {
      this.numGrown++
      return 0
    }
    if(this.cleanTree(this.root) == 0) {
      return 0
    }
    return -1
    // TODO: allow for editing after filter (maintain tree structure)
  }
  // TODO: make this work right
  this.perc = function() {
    // console.log(numGrown, this.splits, maxGrown, maxSplits)
    return 100 * numGrown / Math.min(maxGrowable, maxGrowable - maxSplits)
  }
  this.grow = function(n) {

    if (n.grown) { // already grown
      return -1
    }
    if (n.x2 - n.x1 <= 1 && n.y2 - n.y1 <= 1) { // is a leaf
      n.color = arrayAt(n.x1, n.y1, w, ogImgData.data)
      n.split = false
      n.grown = true
      return 1
    }
    if (n.depth >= maxDepth) {
      colors = []
      for(let x = n.x1; x < n.x2; x++) {
        for(let y = n.y1; y < n.y2; y++) {
          colors.push(arrayAt(x, y, w, ogImgData.data))
        }
      }
      // console.log(colors.map(c => cToRgbaStr(c)))
      n.color = avgColor(colors)
      // console.log(n.color)
      n.split = false
      n.grown = true
      this.drawNode(this.ctx, n)
      return 0
    }
    if (n.branches.length == 0) { // doesn't have branches yet
      n.split = true
      n.branches = this.genBranches(n.x1, n.y1, n.x2, n.y2, n.depth+1)
      drawNode(this.ctx, n) // takes a long time, but a cool visual
    }
    // randomly select ungrown child
    // TODO: something might be wrong with this?
    let ungrown = n.branches.filter(b => !b.grown)
    while(ungrown.length > 0) {
      let idx = Math.floor(Math.random() * ungrown.length)
      b = ungrown.splice(idx, 1)[0]
      if(grow(b) == 0) { // leaves (return 1) don't count
        return 0
      }
    }
    // all branches are grown already, grow yourself
    n.color = avgColor(n.branches.map(b => b.color),
                       n.branches.map(b => (b.x2 - b.x1) * (b.y2 - b.y1)))
    n.split = false
    n.grown = true
    drawNode(this.ctx, n)
    return 0
  }

  this.split = function() {
    while(this.queue.length > 0) {
      // console.log(this.queue.length)
      idx = Math.floor(Math.random() * this.queue.length)
      // console.log(idx)
      // console.log(n)
      n = this.queue.splice(idx, 1)[0]
      if(n.branches.length > 0) {
        n.split = true
        for(let b = 0; b < n.branches.length; b++) {
          this.queue.push(n.branches[b])
          // console.log(this.queue.length)
        }
        this.drawNode(this.ctx, n)
        return 0
      }
    }
    return -1
  }
  this.genBranches = function(x1, y1, x2, y2, d) {
    let xMid = Math.floor((x1 + x2) / 2)
    let yMid = Math.floor((y1 + y2) / 2)
    return [this.newNode(x1, y1, xMid, yMid, d), this.newNode(xMid, y1, x2, yMid, d),
            this.newNode(x1, yMid, xMid, y2, d), this.newNode(xMid, yMid, x2, y2, d)]
  }
  this.newNode = function(x1, y1, x2, y2, d) {
    return {
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
      grown: false,
      split: false,
      color: undefined,
      depth: d,
      branches: []
    }
  }
  this.drawNode = function(ctx, n) {
    if(!n.split || n.branches.length == 0) {
      let rw = n.x2 - n.x1
      let rh = n.y2 - n.y1
      if(n.grown) {
        cStr = cToRgbaStr(n.color)
        // console.log(cStr)
        ctx.fillStyle = cStr
        ctx.clearRect(n.x1, n.y1, rw, rh)
        ctx.fillRect(n.x1, n.y1, rw, rh)
      }

      // TODO: add as option
      // ctx.beginPath()
      // ctx.lineWidth = "1"
      // ctx.strokeStyle = "rgba(0, 0, 0, 1.0)"
      // ctx.rect(n.x1 + 0.5, n.y1 + 0.5, rw - 1, rh - 1)
      // ctx.stroke()

      imgData = ctx.getImageData(0, 0, w, h)
      data = imgData.data
      return
    }
    for(let i = 0; i < n.branches.length; i++) {
      this.drawNode(ctx, n.branches[i])
    }
  }
  this.cleanTree = function(n) {
    if(n.grown) {
      return 0
    }
    if(!n.split) {
      colors = []
      for(let x = n.x1; x < n.x2; x++) {
        for(let y = n.y1; y < n.y2; y++) {
          colors.push(arrayAt(x, y, w, ogImgData.data))
        }
      }
      // console.log(colors.map(c => cToRgbaStr(c)))
      n.color = avgColor(colors)
      // console.log(n.color)
      n.split = false
      n.grown = true
      this.drawNode(this.ctx, n)
      return 0
    }
    let ungrown = n.branches.filter(b => !b.grown)
    while(ungrown.length > 0) {
      let idx = Math.floor(Math.random() * ungrown.length)
      b = ungrown.splice(idx, 1)[0]
      if(cleanTree(b) == 0) { // leaves (return 1) don't count
        return 0
      }
    }
    return -1
  }
  return this
}

// filter helper functions

function cToRgbaStr(c) {
 return "rgba(" + c[0] + ", " + c[1] + ", " + c[2] + ", " + (c[3]/255).toFixed(4) + ")"
}

function indecesOf(x, y, w) {
  let r = (y * w + x) * 4;
  let i = {};
  i.r = r;
  i.g = r + 1;
  i.b = r + 2;
  i.a = r + 3;
  return i;
}

function arrayAtIndex(i, data) {
  return [data[i], data[i + 1], data[i + 2], data[i + 3]];
}

function arrayAt(x, y, w, data) {
  let i = (y * w + x) * 4;
  return arrayAtIndex(i, data);
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

// TODO: add weighting
function avgColor(colors, weights=null) {
  if(!weights) {
    weights = new Array(colors.length).fill(1 / colors.length)
  } else {
    let totalWeight = weights.reduce((acc, val) => acc + val)
    weights = weights.map(val => val / totalWeight)
  }
  avg = [0, 0, 0, 0]
  for(let c = 0; c < colors.length; c++) {
    avg[0] += weights[c] * colors[c][3] * colors[c][0]
    avg[1] += weights[c] * colors[c][3] * colors[c][1]
    avg[2] += weights[c] * colors[c][3] * colors[c][2]
    avg[3] += weights[c] * colors[c][3]
  }
  if(avg[3] != 0) {
    avg[0] /= avg[3]
    avg[1] /= avg[3]
    avg[2] /= avg[3]
  }
  return avg
}

function closestPaletteIndex(arr, pal) {
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
