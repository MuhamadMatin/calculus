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
const arrow = document.getElementById('arrow');
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

// Posisi awal panah
const arrowX = 80;
const arrowY = canvas.height / 2;

// Target properties
let targetX, targetY;
const targetRadius = 30; // Radius target untuk deteksi tabrakan

// Variabel untuk menyimpan lintasan realtime
let trajectoryPoints = [];

// Event listeners
angleSlider.addEventListener('input', updateAngle);
velocitySlider.addEventListener('input', updateVelocity);
gravitySlider.addEventListener('input', updateGravity);
shootBtn.addEventListener('click', shootArrow);
resetBtn.addEventListener('click', resetGame);

// Fungsi untuk menghasilkan posisi target acak
function generateRandomTarget() {
  // Pastikan target berada di area yang wajar (tidak terlalu dekat dengan panah)
  const minX = canvas.width * 0.6; // Minimal 60% dari lebar canvas
  const maxX = canvas.width - 50; // Maksimal 50px dari tepi kanan
  const minY = targetRadius + 20; // Minimal 20px dari tepi atas
  const maxY = canvas.height - targetRadius - 20; // Maksimal 20px dari tepi bawah

  targetX = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
  targetY = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
}

// Inisialisasi game
function initGame() {
  generateRandomTarget();
  updateDisplays();
  drawStaticElements();
}

// Update nilai slider
function updateAngle() {
  angleValue.textContent = `${angleSlider.value}°`;
  updateArrowRotation();
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

// Update rotasi anak panah
function updateArrowRotation() {
  const angle = parseInt(angleSlider.value);
  arrow.style.transform = `translateY(-50%) rotate(${-angle}deg)`;
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
  const targetDistance = targetX - arrowX;
  const tangentSlopeValue = tanTheta - (gravity * targetDistance) / (velocity * velocity * cosSqTheta);
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

  // Gambar target
  drawTarget();
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

// Gambar target
function drawTarget() {
  ctx.save();
  ctx.translate(targetX, targetY);

  // Lingkaran luar
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(0, 0, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fecaca';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Lingkaran tengah
  ctx.fillStyle = '#f87171';
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fecaca';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Lingkaran dalam
  ctx.fillStyle = '#fca5a5';
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fecaca';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Titik pusat
  ctx.fillStyle = '#fee2e2';
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
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
  ctx.moveTo(arrowX, arrowY);

  for (let t = 0; t < 5; t += 0.1) {
    const x = arrowX + vx * t;
    const y = arrowY - (vy * t - 0.5 * gravity * t * t);

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

// Tembak anak panah
function shootArrow() {
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
  let x = arrowX;
  let y = arrowY;

  function animate() {
    // Update posisi berdasarkan waktu
    t += 0.05;
    x = arrowX + vx * t;
    y = arrowY - (vy * t - 0.5 * gravity * t * t);

    // Simpan titik lintasan untuk realtime
    trajectoryPoints.push({ x, y });

    // Clear canvas dan gambar ulang
    drawStaticElements();

    // Gambar lintasan realtime
    drawRealtimeTrajectory();

    // Hitung posisi ujung depan panah (mata panah)
    const arrowTipX = x + 50 * Math.cos(angleRad);
    const arrowTipY = y - 50 * Math.sin(angleRad);

    // Gambar anak panah
    drawArrow(x, y, angle, arrowTipX, arrowTipY);

    // Gambar garis singgung di posisi saat ini
    drawTangentAtPoint(x, y, angle, velocity, gravity, t);

    // Cek jika panah mengenai target - Hanya gunakan ujung depan panah untuk deteksi
    const distanceToTarget = Math.sqrt((arrowTipX - targetX) * (arrowTipX - targetX) + (arrowTipY - targetY) * (arrowTipY - targetY));

    if (!hitDetected && distanceToTarget < targetRadius) {
      // Tepat sasaran!
      hitDetected = true;
      hits++;
      score += 10;
      updateDisplays();

      // Tampilkan efek hit pada target
      drawHitEffect(arrowTipX, arrowTipY);

      // Tampilkan popup sukses
      successPopup.classList.remove('hidden');
      setTimeout(() => {
        successPopup.classList.add('hidden');
      }, 2000);

      // Hentikan animasi setelah mengenai target
      isShooting = false;
      cancelAnimationFrame(animationId);
      return;
    }

    // Cek jika panah mengenai batas canvas - PERBAIKAN: Deteksi batas yang lebih akurat
    const hitBoundary = checkBoundaryCollision(x, y, arrowTipX, arrowTipY);

    if (!hitDetected && hitBoundary) {
      // Panah mengenai batas canvas
      hitDetected = true;

      // Tampilkan efek batas
      drawBoundaryEffect(hitBoundary);

      // Hentikan animasi setelah mengenai batas
      isShooting = false;
      cancelAnimationFrame(animationId);
      return;
    }

    // Cek jika panah keluar dari layar atau waktu terlalu lama
    if (x > canvas.width + 50 || y < -50 || y > canvas.height + 50 || t > 10) {
      isShooting = false;
      cancelAnimationFrame(animationId);
      return;
    }

    animationId = requestAnimationFrame(animate);
  }

  animate();
}

// Fungsi untuk mendeteksi tabrakan dengan batas canvas
function checkBoundaryCollision(x, y, arrowTipX, arrowTipY) {
  // Batas kanan
  if (arrowTipX >= canvas.width - 1) {
    return { type: 'right', x: canvas.width, y: arrowTipY };
  }

  // Batas kiri (tidak mungkin karena panah bergerak ke kanan)
  if (arrowTipX <= 1) {
    return { type: 'left', x: 0, y: arrowTipY };
  }

  // Batas atas
  if (arrowTipY <= 1) {
    return { type: 'top', x: arrowTipX, y: 0 };
  }

  // Batas bawah
  if (arrowTipY >= canvas.height - 1) {
    return { type: 'bottom', x: arrowTipX, y: canvas.height };
  }

  return null;
}

// Gambar efek ketika panah mengenai batas canvas
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
    const angle = parseInt(angleSlider.value);
    const lastPoint = trajectoryPoints[trajectoryPoints.length - 1];
    const angleRad = (angle * Math.PI) / 180;
    const arrowTipX = lastPoint.x + 50 * Math.cos(angleRad);
    const arrowTipY = lastPoint.y - 50 * Math.sin(angleRad);
    drawArrow(lastPoint.x, lastPoint.y, angle, arrowTipX, arrowTipY);
  }, 500);
}

// Gambar efek hit pada target
function drawHitEffect(x, y) {
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
    const angle = parseInt(angleSlider.value);
    const lastPoint = trajectoryPoints[trajectoryPoints.length - 1];
    const angleRad = (angle * Math.PI) / 180;
    const arrowTipX = lastPoint.x + 50 * Math.cos(angleRad);
    const arrowTipY = lastPoint.y - 50 * Math.sin(angleRad);
    drawArrow(lastPoint.x, lastPoint.y, angle, arrowTipX, arrowTipY);
  }, 300);
}

// Gambar anak panah di canvas
function drawArrow(x, y, angle, arrowTipX, arrowTipY) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((-angle * Math.PI) / 180);

  // Batang panah
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, -2, 40, 4);

  // Mata panah
  ctx.beginPath();
  ctx.moveTo(40, -6);
  ctx.lineTo(50, 0);
  ctx.lineTo(40, 6);
  ctx.closePath();
  ctx.fill();

  // Bulu panah
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.lineTo(-10, -6);
  ctx.lineTo(0, 0);
  ctx.lineTo(-10, 6);
  ctx.lineTo(0, 4);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// Gambar garis singgung di titik tertentu
function drawTangentAtPoint(x, y, angle, velocity, gravity, time) {
  if (time < 0.1) return;

  const angleRad = (angle * Math.PI) / 180;
  const vx = velocity * Math.cos(angleRad);

  // Hitung kemiringan garis singgung
  const slope = Math.tan(angleRad) - (gravity * (x - arrowX)) / (velocity * velocity * Math.cos(angleRad) * Math.cos(angleRad));
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

  // Generate target baru
  generateRandomTarget();

  updateDisplays();
  drawStaticElements();
  successPopup.classList.add('hidden');
}

// Inisialisasi game saat halaman dimuat
window.onload = function () {
  initGame();
  updateArrowRotation();
  updateMathInfo();
};
