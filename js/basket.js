// Inisialisasi variabel game
let score = 0;
let shots = 0;
let hits = 0;
let isShooting = false;
let animationId = null;
let hitDetected = false;

// Elemen DOM
const angleSlider = document.getElementById('angle');
const velocitySlider = document.getElementById('velocity');
const gravitySlider = document.getElementById('gravity');
const shootBtn = document.getElementById('shootBtn');
const resetBtn = document.getElementById('resetBtn');
const ball = document.getElementById('ball');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const successPopup = document.getElementById('successPopup');

// Nilai display
const angleValue = document.getElementById('angleValue');
const velocityValue = document.getElementById('velocityValue');
const gravityValue = document.getElementById('gravityValue');
const scoreDisplay = document.getElementById('score');
const shotsDisplay = document.getElementById('shots');
const accuracyDisplay = document.getElementById('accuracy');

// Nilai analisis matematika
const trajectoryEq = document.getElementById('trajectoryEq');
const instantVx = document.getElementById('instantVx');
const instantVy = document.getElementById('instantVy');
const tangentSlope = document.getElementById('tangentSlope');
const monotonicity = document.getElementById('monotonicity');
const concavity = document.getElementById('concavity');

// Posisi awal bola
const ballX = 80;
const ballY = canvas.height / 2;
const ballRadius = 20;

// Target properties (ring basket)
let ringX, ringY;
const ringRadius = 30;

// Variabel untuk menyimpan lintasan realtime
let trajectoryPoints = [];

// Event listeners
angleSlider.addEventListener('input', updateAngle);
velocitySlider.addEventListener('input', updateVelocity);
gravitySlider.addEventListener('input', updateGravity);
shootBtn.addEventListener('click', shootBall);
resetBtn.addEventListener('click', resetGame);

// Fungsi untuk menghasilkan posisi ring acak
function generateRandomRing() {
  // Pastikan ring berada di area yang wajar
  const minX = canvas.width * 0.6;
  const maxX = canvas.width - 50;
  const minY = 50 + ringRadius;
  const maxY = canvas.height - 50 - ringRadius;

  ringX = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
  ringY = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
}

// Inisialisasi game
function initGame() {
  generateRandomRing();
  updateDisplays();
  drawStaticElements();
}

// Update nilai slider
function updateAngle() {
  angleValue.textContent = `${angleSlider.value}°`;
  updateBallRotation();
  updateMathInfo();
  drawStaticElements();
}

function updateVelocity() {
  velocityValue.textContent = `${velocitySlider.value} m/s`;
  updateMathInfo();
  drawStaticElements();
}

function updateGravity() {
  gravityValue.textContent = `${gravitySlider.value} m/s²`;
  updateMathInfo();
  drawStaticElements();
}

// Update rotasi bola (sedikit efek visual)
function updateBallRotation() {
  const angle = parseInt(angleSlider.value);
  ball.style.transform = `translateY(-50%) rotate(${-angle * 2}deg)`;
}

// Update informasi matematika
function updateMathInfo() {
  const angle = parseInt(angleSlider.value);
  const velocity = parseInt(velocitySlider.value);
  const gravity = parseFloat(gravitySlider.value);

  // Konversi sudut ke radian
  const angleRad = (angle * Math.PI) / 180;

  // Komponen kecepatan
  const vx = velocity * Math.cos(angleRad);
  const vy = velocity * Math.sin(angleRad);

  // Persamaan lintasan (y sebagai fungsi x)
  // y = x * tan(θ) - (g * x²) / (2 * v₀² * cos²(θ))
  const tanTheta = Math.tan(angleRad);
  const cosSqTheta = Math.cos(angleRad) * Math.cos(angleRad);
  const denominator = 2 * velocity * velocity * cosSqTheta;

  // Update display
  trajectoryEq.textContent = `y = ${tanTheta.toFixed(2)}x - ${(gravity / denominator).toFixed(4)}x²`;
  instantVx.textContent = `${vx.toFixed(2)} m/s`;
  instantVy.textContent = `${vy.toFixed(2)} m/s`;

  // Hitung kemiringan garis singgung di target
  const ringDistance = ringX - ballX;
  const tangentSlopeValue = tanTheta - (gravity * ringDistance) / (velocity * velocity * cosSqTheta);
  tangentSlope.textContent = `m = ${tangentSlopeValue.toFixed(2)}`;

  // Tentukan kemonotonan dan kecekungan
  monotonicity.textContent = tangentSlopeValue > 0 ? 'Naik' : tangentSlopeValue < 0 ? 'Turun' : 'Konstan';
  monotonicity.className = tangentSlopeValue > 0 ? 'font-medium text-green-600' : tangentSlopeValue < 0 ? 'font-medium text-red-600' : 'font-medium text-yellow-600';

  // Kecekungan selalu negatif untuk gerak parabola (karena gravitasi)
  concavity.textContent = 'Cekung Bawah';
  concavity.className = 'font-medium text-purple-600';
}

// Update statistik game
function updateDisplays() {
  scoreDisplay.textContent = score;
  shotsDisplay.textContent = shots;
  accuracyDisplay.textContent = shots > 0 ? `${Math.round((hits / shots) * 100)}%` : '0%';
}

// Gambar elemen statis di canvas
function drawStaticElements() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Gambar grid background
  drawGrid();

  // Gambar lintasan prediksi
  drawPredictedTrajectory();

  // Gambar ring basket
  drawRing();
}

// Gambar grid
function drawGrid() {
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.lineWidth = 1;

  // Garis vertikal
  for (let x = 0; x < canvas.width; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Garis horizontal
  for (let y = 0; y < canvas.height; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

// Gambar ring basket
function drawRing() {
  ctx.save();
  ctx.translate(ringX, ringY);

  // Ring utama
  ctx.strokeStyle = '#FF0000';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Lingkaran dalam (untuk efek kedalaman)
  ctx.strokeStyle = '#CC0000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, ringRadius - 4, 0, Math.PI * 2);
  ctx.stroke();

  // Tanda tengah (opsional)
  ctx.fillStyle = '#FF0000';
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Gambar lintasan prediksi
function drawPredictedTrajectory() {
  const angle = parseInt(angleSlider.value);
  const velocity = parseInt(velocitySlider.value);
  const gravity = parseFloat(gravitySlider.value);

  const angleRad = (angle * Math.PI) / 180;
  const vx = velocity * Math.cos(angleRad);
  const vy = velocity * Math.sin(angleRad);

  ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(ballX, ballY);

  for (let t = 0; t < 5; t += 0.1) {
    const x = ballX + vx * t;
    const y = ballY - (vy * t - 0.5 * gravity * t * t);

    if (x > canvas.width || y < 0 || y > canvas.height) break;

    ctx.lineTo(x, y);
  }

  ctx.stroke();
  ctx.setLineDash([]);
}

// Gambar lintasan realtime
function drawRealtimeTrajectory() {
  if (trajectoryPoints.length < 2) return;

  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(trajectoryPoints[0].x, trajectoryPoints[0].y);

  for (let i = 1; i < trajectoryPoints.length; i++) {
    ctx.lineTo(trajectoryPoints[i].x, trajectoryPoints[i].y);
  }

  ctx.stroke();

  // Gambar titik-titik pada lintasan
  ctx.fillStyle = '#3b82f6';
  for (let i = 0; i < trajectoryPoints.length; i += 5) {
    ctx.beginPath();
    ctx.arc(trajectoryPoints[i].x, trajectoryPoints[i].y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Gambar bola basket di canvas
function drawBasketball(x, y) {
  ctx.save();
  ctx.translate(x, y);

  // Bola basket
  ctx.fillStyle = '#FF8C00';
  ctx.beginPath();
  ctx.arc(0, 0, ballRadius, 0, Math.PI * 2);
  ctx.fill();

  // Garis-garis pada bola basket
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;

  // Garis vertikal
  ctx.beginPath();
  ctx.moveTo(0, -ballRadius);
  ctx.lineTo(0, ballRadius);
  ctx.stroke();

  // Garis horizontal
  ctx.beginPath();
  ctx.moveTo(-ballRadius, 0);
  ctx.lineTo(ballRadius, 0);
  ctx.stroke();

  // Garis melengkung
  ctx.beginPath();
  ctx.arc(0, 0, ballRadius, 0, Math.PI);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, ballRadius, Math.PI, 0);
  ctx.stroke();

  ctx.restore();
}

// Gambar garis singgung di titik tertentu
function drawTangentAtPoint(x, y, angle, velocity, gravity, time) {
  if (time < 0.1) return;

  const angleRad = (angle * Math.PI) / 180;
  const vx = velocity * Math.cos(angleRad);

  // Hitung kemiringan garis singgung
  const slope = Math.tan(angleRad) - (gravity * (x - ballX)) / (velocity * velocity * Math.cos(angleRad) * Math.cos(angleRad));
  const tangentLength = 50;

  // Gambar garis singgung
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 3]);
  ctx.beginPath();
  ctx.moveTo(x - tangentLength, y - slope * tangentLength);
  ctx.lineTo(x + tangentLength, y + slope * tangentLength);
  ctx.stroke();
  ctx.setLineDash([]);

  // Gambar titik di mana garis singgung berada
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
}

// Lempar bola
function shootBall() {
  if (isShooting) return;

  isShooting = true;
  hitDetected = false;
  shots++;
  trajectoryPoints = []; // Reset lintasan
  updateDisplays();

  const angle = parseInt(angleSlider.value);
  const velocity = parseInt(velocitySlider.value);
  const gravity = parseFloat(gravitySlider.value);

  const angleRad = (angle * Math.PI) / 180;
  const vx = velocity * Math.cos(angleRad);
  const vy = velocity * Math.sin(angleRad);

  let t = 0;
  let x = ballX;
  let y = ballY;

  function animate() {
    // Update posisi berdasarkan waktu
    t += 0.05;
    x = ballX + vx * t;
    y = ballY - (vy * t - 0.5 * gravity * t * t);

    // Simpan titik lintasan untuk realtime
    trajectoryPoints.push({ x, y });

    // Clear canvas dan gambar ulang
    drawStaticElements();

    // Gambar lintasan realtime
    drawRealtimeTrajectory();

    // Gambar bola basket
    drawBasketball(x, y);

    // Gambar garis singgung di posisi saat ini
    drawTangentAtPoint(x, y, angle, velocity, gravity, t);

    // Cek jika bola masuk ke ring
    const distanceToRing = Math.sqrt((x - ringX) * (x - ringX) + (y - ringY) * (y - ringY));

    // Deteksi jika bola melewati ring (dengan toleransi)
    const inRingArea = distanceToRing < ringRadius + ballRadius;

    if (!hitDetected && inRingArea) {
      // Bola masuk!
      hitDetected = true;
      hits++;
      score += 10;
      updateDisplays();

      // Tampilkan efek bola masuk
      drawScoreEffect(x, y);

      // Tampilkan animasi "SWISH"
      createSwishAnimation(ringX, ringY);

      // Tampilkan popup sukses
      successPopup.classList.remove('hidden');
      setTimeout(() => {
        successPopup.classList.add('hidden');
      }, 2000);

      // Hentikan animasi setelah bola masuk
      isShooting = false;
      cancelAnimationFrame(animationId);
      return;
    }

    // Cek jika bola mengenai batas canvas
    const hitBoundary = checkBoundaryCollision(x, y);

    if (!hitDetected && hitBoundary) {
      // Bola mengenai batas canvas
      hitDetected = true;

      // Tampilkan efek batas
      drawBoundaryEffect(hitBoundary);

      // Hentikan animasi setelah mengenai batas
      isShooting = false;
      cancelAnimationFrame(animationId);
      return;
    }

    // Cek jika bola keluar dari layar atau waktu terlalu lama
    if (x > canvas.width + 50 || y < -50 || y > canvas.height + 50 || t > 10) {
      isShooting = false;
      cancelAnimationFrame(animationId);
      return;
    }

    animationId = requestAnimationFrame(animate);
  }

  animate();
}

// Buat animasi "SWISH"
function createSwishAnimation(x, y) {
  const swish = document.createElement('div');
  swish.className = 'swish';
  swish.textContent = 'SWISH!';
  swish.style.left = `${x}px`;
  swish.style.top = `${y}px`;

  const canvasContainer = document.querySelector('.bg-gray-100');
  canvasContainer.appendChild(swish);

  // Hapus elemen setelah animasi selesai
  setTimeout(() => {
    canvasContainer.removeChild(swish);
  }, 1500);
}

// Fungsi untuk mendeteksi tabrakan dengan batas canvas
function checkBoundaryCollision(x, y) {
  // Batas kanan
  if (x + ballRadius >= canvas.width - 1) {
    return { type: 'right', x: canvas.width, y: y };
  }

  // Batas kiri
  if (x - ballRadius <= 1) {
    return { type: 'left', x: 0, y: y };
  }

  // Batas atas
  if (y - ballRadius <= 1) {
    return { type: 'top', x: x, y: 0 };
  }

  // Batas bawah
  if (y + ballRadius >= canvas.height - 1) {
    return { type: 'bottom', x: x, y: canvas.height };
  }

  return null;
}

// Gambar efek ketika bola mengenai batas canvas
function drawBoundaryEffect(boundary) {
  ctx.save();

  // Gambar efek berdasarkan jenis batas
  switch (boundary.type) {
    case 'right':
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.fillRect(canvas.width - 10, 0, 10, canvas.height);
      break;
    case 'top':
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.fillRect(0, 0, canvas.width, 10);
      break;
    case 'bottom':
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.fillRect(0, canvas.height - 10, canvas.width, 10);
      break;
  }

  ctx.restore();

  // Tambahkan animasi pada canvas container
  const canvasContainer = document.querySelector('.bg-gray-100');
  canvasContainer.classList.add('boundary-hit');
  setTimeout(() => {
    canvasContainer.classList.remove('boundary-hit');
  }, 500);

  // Set timeout untuk menghapus efek setelah 500ms
  setTimeout(() => {
    drawStaticElements();
    drawRealtimeTrajectory();
    drawBasketball(trajectoryPoints[trajectoryPoints.length - 1].x, trajectoryPoints[trajectoryPoints.length - 1].y);
  }, 500);
}

// Gambar efek ketika bola masuk ke ring
function drawScoreEffect(x, y) {
  ctx.save();
  ctx.translate(x, y);

  // Gambar efek ledakan/kena
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(0, 0, 40, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(0, 0, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Set timeout untuk menghapus efek setelah 300ms
  setTimeout(() => {
    drawStaticElements();
    drawRealtimeTrajectory();
    drawBasketball(trajectoryPoints[trajectoryPoints.length - 1].x, trajectoryPoints[trajectoryPoints.length - 1].y);
  }, 300);
}

// Reset game
function resetGame() {
  score = 0;
  shots = 0;
  hits = 0;
  isShooting = false;
  hitDetected = false;
  trajectoryPoints = [];

  if (animationId) {
    cancelAnimationFrame(animationId);
  }

  // Reset slider ke nilai default
  angleSlider.value = 45;
  velocitySlider.value = 50;
  gravitySlider.value = 10;

  // Update tampilan slider
  updateAngle();
  updateVelocity();
  updateGravity();

  // Generate ring baru
  generateRandomRing();

  updateDisplays();
  drawStaticElements();
  successPopup.classList.add('hidden');
}

// Inisialisasi game saat halaman dimuat
window.onload = function () {
  initGame();
  updateBallRotation();
  updateMathInfo();
};
