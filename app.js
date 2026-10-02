const MAX_IMAGES = 10000;

const input = document.getElementById("folderInput");
const spinBtn = document.getElementById("spinBtn");
const againBtn = document.getElementById("againBtn");
const statusEl = document.getElementById("status");
const result = document.getElementById("result");
const resultImage = document.getElementById("resultImage");
const resultName = document.getElementById("resultName");
const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

let images = [];
let currentAngle = 0;
let spinning = false;
let objectUrls = [];

function setStatus(text) {
  statusEl.textContent = text;
}

function clearUrls() {
  for (const url of objectUrls) URL.revokeObjectURL(url);
  objectUrls = [];
}

function drawWheel() {
  const n = images.length;
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(cx, cy) - 8;

  ctx.clearRect(0, 0, w, h);

  if (!n) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#222";
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#555";
    ctx.stroke();

    ctx.fillStyle = "#aaa";
    ctx.font = "bold 28px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Chọn thư mục ảnh", cx, cy);
    return;
  }

  const slice = Math.PI * 2 / n;

  // Với số lượng rất lớn, các ô riêng lẻ không thể nhìn thấy trên màn hình.
  // Vẫn vẽ đủ số phần để vòng quay tương ứng chính xác với toàn bộ dữ liệu.
  for (let i = 0; i < n; i++) {
    const a0 = currentAngle + i * slice;
    const a1 = a0 + slice;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, a0, a1);
    ctx.closePath();

    ctx.fillStyle = `hsl(${(i * 360 / Math.max(n, 1)) % 360} 75% 50%)`;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.18)";
    ctx.lineWidth = n > 1000 ? 0.5 : 1;
    ctx.stroke();
  }

  // Tâm
  ctx.beginPath();
  ctx.arc(cx, cy, 62, 0, Math.PI * 2);
  ctx.fillStyle = "#111";
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#fff";
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.font = "900 18px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("QUAY", cx, cy);
}

function showResult(item) {
  result.hidden = false;
  resultImage.src = item.url;
  resultName.textContent = item.name;
  result.scrollIntoView({ behavior: "smooth", block: "center" });
}

input.addEventListener("change", () => {
  clearUrls();
  result.hidden = true;

  const files = Array.from(input.files || [])
    .filter(file => file.type.startsWith("image/"))
    .slice(0, MAX_IMAGES);

  images = files.map(file => {
    const url = URL.createObjectURL(file);
    objectUrls.push(url);
    return {
      file,
      name: file.webkitRelativePath || file.name,
      url
    };
  });

  if (!images.length) {
    setStatus("Không tìm thấy ảnh.");
    spinBtn.disabled = true;
    drawWheel();
    return;
  }

  setStatus(
    `Đã nạp ${images.length.toLocaleString("vi-VN")} ảnh` +
    (files.length >= MAX_IMAGES ? " (đã giới hạn 10.000)." : ".")
  );
  spinBtn.disabled = false;
  currentAngle = 0;
  drawWheel();
});

function spin() {
  if (spinning || !images.length) return;

  spinning = true;
  spinBtn.disabled = true;
  againBtn.disabled = true;
  result.hidden = true;

  const winnerIndex = Math.floor(Math.random() * images.length);
  const slice = Math.PI * 2 / images.length;

  // Pointer nằm ở góc -90°. Đưa tâm ô winner vào đúng vị trí pointer.
  const pointerAngle = -Math.PI / 2;
  const targetBase = pointerAngle - (winnerIndex + 0.5) * slice;

  let delta = targetBase - currentAngle;
  delta = ((delta % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

  const turns = 8 + Math.floor(Math.random() * 4);
  const targetAngle = currentAngle + turns * Math.PI * 2 + delta;

  const startAngle = currentAngle;
  const duration = 4200 + Math.random() * 700;
  const startTime = performance.now();

  function animate(now) {
    const t = Math.min(1, (now - startTime) / duration);
    // easeOutCubic
    const eased = 1 - Math.pow(1 - t, 3);
    currentAngle = startAngle + (targetAngle - startAngle) * eased;
    drawWheel();

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      currentAngle = targetAngle;
      drawWheel();
      spinning = false;
      spinBtn.disabled = false;
      againBtn.disabled = false;
      showResult(images[winnerIndex]);
      setStatus(`Đã chọn: ${images[winnerIndex].name}`);
    }
  }

  requestAnimationFrame(animate);
}

spinBtn.addEventListener("click", spin);
againBtn.addEventListener("click", () => {
  result.hidden = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
  spin();
});

drawWheel();
