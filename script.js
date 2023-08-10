const numEpicycles = 101;
const secPerCycle = 10;

let state = 0; // 0: user draws, 1: fourier draws
let drawing = []; // user's drawing

let points; // complex numbers
let epicycles;
let time = 0;
let path = []; // fourier's drawing

let canvas, ctx, canvasRect;
const body = document.body;
let mouseDown = false;
let keysDown = [];
let stopDraw = false;

function Start() {
  CreateCanvas();
  Update();
}

function Update() {
  Background();

  if (state == 0) UserDraws();
  else FourierDraws();

  if (!stopDraw) requestAnimationFrame(Update);
}

function Background() {
  ctx.fillStyle = "rgb(0, 0, 0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function CreateCanvas() {
  canvas = document.createElement("canvas");
  body.appendChild(canvas);
  canvas.id = "TheCanvas";

  canvas.style.margin = `0px`;
  canvas.style.padding = `0px`;
  canvas.style.display = "block";
  body.style.margin = `0px`;
  body.style.padding = `0px`;
  body.style.background = "black";

  canvas.width = innerWidth;
  canvas.height = innerHeight;

  ctx = canvas.getContext("2d");
  canvasRect = canvas.getBoundingClientRect();
}

function UserDraws() {
  if (keysDown.includes(" ")) UserDone();

  if (drawing.length == 0) return;
  ctx.beginPath();
  ctx.strokeStyle = "rgb(255, 255, 255)";
  ctx.lineWidth = 2;
  ctx.moveTo(drawing[0].x, drawing[0].y);
  for (let i = 1; i < drawing.length; i++)
    ctx.lineTo(drawing[i].x, drawing[i].y);
  ctx.stroke();
  ctx.closePath();
}

function UserDone() {
  state = 1;
  points = CreatePoints();
  epicycles = Fourier(points, numEpicycles);
  epicycles.sort((a, b) => b.amp - a.amp);
}

function CreatePoints() {
  let p = [];

  drawing.forEach((point, i) => {
    p[i] = { re: point.x, im: point.y };
  });

  return p;
}

function Fourier(data, K) {
  let C = [];
  const start = Math.floor(-(K - 1) / 2);
  const end = Math.floor(K) + start - 1;
  const N = data.length;

  for (let k = start; k <= end; k++) {
    let re = 0;
    let im = 0;

    for (let n = 0; n < N; n++) {
      const phi = (2 * Math.PI * k * n) / N; // value that goes into cos and sin
      const q = { re: Math.cos(phi), im: -Math.sin(phi) }; // other complex number in equation
      const p = data[n]; // point as complex number

      // (a + bi) (c + di) = ac + adi + bci + bdii = (ac - bd) + (ad + bc)i
      re += p.re * q.re - p.im * q.im;
      im += p.re * q.im + p.im * q.re;
    }

    re /= N;
    im /= N;

    const c = {
      re: re,
      im: im,
      amp: Math.sqrt(re ** 2 + im ** 2), // magnitude of complex number
      phs: Math.atan2(im, re), // angle of complex number
      frq: k,
    };

    C.push(c);
  }

  return C;
}

function FourierDraws() {
  DrawPoints();
  DrawPath();
  DrawEpicycles();

  time += (2 * Math.PI) / (60 * secPerCycle);
  if (time >= 2 * Math.PI) {
    time = 0;
    path = [];
  }
}

function DrawPoints() {
  for (const p of points) {
    ctx.beginPath();
    ctx.fillStyle = "rgba(251, 133, 0, 0.8)";
    ctx.arc(p.re, p.im, 1, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
  }
}

function DrawEpicycles() {
  let pos = [{ x: 0, y: 0 }];

  let num = false;
  for (let n = 1; n <= 9; n++) {
    if (keysDown.includes(n.toString())) {
      num = keysDown[0];
      break;
    }
  }

  epicycles.forEach((c, i) => {
    const p = pos[i];
    const a = c.phs + c.frq * time;
    const nextP = {
      x: p.x + c.amp * Math.cos(a),
      y: p.y + c.amp * Math.sin(a),
    };
    if (i > 0 && (!num || i <= num)) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(251, 133, 0, 0.4)";
      ctx.lineWidth = 1;
      ctx.arc(p.x, p.y, c.amp, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.closePath();

      ctx.beginPath();
      ctx.fillStyle = "rgba(251, 133, 0, 0.8)";
      ctx.arc(p.x, p.y, 1, 0, 2 * Math.PI);
      ctx.fill();
      ctx.closePath();

      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(251, 133, 0, 0.8)";
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(nextP.x, nextP.y);
      ctx.stroke();
      ctx.closePath();
    }
    pos.push(nextP);
  });

  path.push(pos[pos.length - 1]);
}

function DrawPath() {
  if (path.length == 0) return;
  ctx.beginPath();
  ctx.strokeStyle = "rgb(255, 255, 255)";
  ctx.lineWidth = 2;
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
  ctx.stroke();
  ctx.closePath();
}

document.addEventListener("mousedown", (e) => {
  mouseDown = true;
  if (state == 0) drawing.push({ x: e.clientX, y: e.clientY });
});
document.addEventListener("mouseup", () => (mouseDown = false));
document.addEventListener("mousemove", (e) => {
  if (mouseDown && state === 0) {
    drawing.push({ x: e.clientX, y: e.clientY });
  }
});
document.addEventListener("keydown", (e) => {
  if (!keysDown.includes(e.key)) keysDown.push(e.key);
  if (e.key == "x") stopDraw = true;
  if (e.key == "y") {
    stopDraw = false;
    Update();
  }
});
document.addEventListener("keyup", (e) =>
  keysDown.splice(keysDown.indexOf(e.key), 1)
);

Start();
