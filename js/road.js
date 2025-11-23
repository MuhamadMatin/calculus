// Elemen DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const clearBtn = document.getElementById('clearBtn');
const randomBtn = document.getElementById('randomBtn');
const drawBtn = document.getElementById('drawBtn');
const restartBtn = document.getElementById('restartBtn');
const velocitySlider = document.getElementById('velocity');
const difficultySlider = document.getElementById('difficulty');
const velocityValue = document.getElementById('velocityValue');
const difficultyValue = document.getElementById('difficultyValue');
const scoreDisplay = document.getElementById('score');
const distanceDisplay = document.getElementById('distance');
const speedDisplay = document.getElementById('speed');
const finalScoreDisplay = document.getElementById('finalScore');
const finalDistanceDisplay = document.getElementById('finalDistance');
const gameOverScreen = document.getElementById('gameOver');
const successPopup = document.getElementById('successPopup');
const roadDamagePopup = document.getElementById('roadDamagePopup');
const roadDamageLightPopup = document.getElementById('roadDamageLightPopup');
const bumpyRoadPopup = document.getElementById('bumpyRoadPopup');
const statusInfo = document.getElementById('status');
const monotonicityInfo = document.getElementById('monotonicity');
const concavityInfo = document.getElementById('concavity');
const slopeInfo = document.getElementById('slope');
const currentSpeedInfo = document.getElementById('currentSpeed');

// Variabel game
let points = [];
let isDrawing = false;
let gameStarted = false;
let animationId = null;
let score = 0;
let distance = 0;
let obstacles = [];
let wheel = {
  x: 0,
  y: 0,
  radius: 15,
  velocity: 0,
  rotation: 0,
};
let gameSpeed = 5;
let difficulty = 5;
let currentMode = 'draw'; // 'draw' or 'random'
let checkpoints = []; // Checkpoint untuk memberikan poin
let wheelStopped = false;
let stopTimeout = null;

// Warna untuk visualisasi
const colors = {
  increasing: '#4CAF50', // Hijau untuk slope positif
  decreasing: '#F44336', // Merah untuk slope negatif
  flat: '#FFC107', // Kuning untuk slope nol
  concaveUp: '#2196F3', // Biru untuk concavity positif
  concaveDown: '#9C27B0', // Ungu untuk concavity negatif
};

// Probabilitas efek jalan rusak
const DAMAGE_PROBABILITIES = {
  pothole: {
    severe: 0.4, // 40% kemungkinan roda bocor
    light: 0.6, // 60% kemungkinan jalan rusak ringan
  },
  bump: {
    severe: 0.3, // 30% kemungkinan shock rusak
    light: 0.7, // 70% kemungkinan hanya memperlambat
  },
};

// Durasi penghentian (dalam milidetik)
const STOP_DURATIONS = {
  pothole: {
    severe: 5000, // 5 detik untuk roda bocor
    light: 2000, // 2 detik untuk jalan rusak ringan
  },
  bump: {
    severe: 3000, // 3 detik untuk shock rusak
    light: 0, // Tidak berhenti, hanya memperlambat
  },
};

// Inisialisasi
function init() {
  // Event listeners
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);

  startBtn.addEventListener('click', startGame);
  clearBtn.addEventListener('click', clearCanvas);
  randomBtn.addEventListener('click', () => {
    currentMode = 'random';
    generateRandomCurve();
  });
  drawBtn.addEventListener('click', () => {
    currentMode = 'draw';
    statusInfo.textContent = 'Klik dan seret untuk menggambar jalan';
  });
  restartBtn.addEventListener('click', restartGame);

  velocitySlider.addEventListener('input', updateVelocity);
  difficultySlider.addEventListener('input', updateDifficulty);

  // Set nilai awal
  updateVelocity();
  updateDifficulty();

  // Gambar canvas awal
  drawGrid();

  // Set mode awal
  drawBtn.classList.add('bg-blue-600');
  randomBtn.classList.remove('bg-blue-600');
}

// Fungsi menggambar grid
function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Grid background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid lines
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.lineWidth = 1;

  // Garis vertikal
  for (let x = 0; x <= canvas.width; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Garis horizontal
  for (let y = 0; y <= canvas.height; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Garis tengah (sumbu x)
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();
}

// Fungsi menggambar jalan
function drawRoad() {
  if (points.length < 2) return;

  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Gambar jalan dengan warna berdasarkan slope
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    // Hitung slope (turunan pertama)
    const slope = (p2.y - p1.y) / (p2.x - p1.x);

    // Tentukan warna berdasarkan slope
    if (slope > 0.1) {
      ctx.strokeStyle = colors.increasing; // Naik
    } else if (slope < -0.1) {
      ctx.strokeStyle = colors.decreasing; // Turun
    } else {
      ctx.strokeStyle = colors.flat; // Datar
    }

    // Gambar segmen jalan
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Gambar indikator kecekungan
    if (i > 0 && i < points.length - 2) {
      // Hitung turunan kedua (perkiraan)
      const p0 = points[i - 1];
      const p3 = points[i + 2];
      const slope1 = (p2.y - p1.y) / (p2.x - p1.x);
      const slope2 = (p3.y - p2.y) / (p3.x - p2.x);
      const secondDerivative = (slope2 - slope1) / ((p3.x - p1.x) / 2);

      // Gambar titik kecil untuk kecekungan
      ctx.fillStyle = secondDerivative > 0 ? colors.concaveUp : colors.concaveDown;
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Gambar checkpoint
  drawCheckpoints();
}

// Fungsi menggambar checkpoint
function drawCheckpoints() {
  checkpoints.forEach((checkpoint) => {
    if (!checkpoint.passed) {
      ctx.fillStyle = '#10B981'; // Hijau untuk checkpoint
      ctx.beginPath();
      ctx.arc(checkpoint.x, checkpoint.y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(checkpoint.x, checkpoint.y, 8, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
}

// Fungsi menggambar hambatan
function drawObstacles() {
  obstacles.forEach((obstacle) => {
    if (obstacle.type === 'bump') {
      // Gambar lingkaran coklat untuk jalan bergelombang
      ctx.fillStyle = '#8B4513'; // Coklat
      ctx.beginPath();
      ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
      ctx.fill();

      // Tambahkan detail untuk efek bergelombang
      ctx.strokeStyle = '#A0522D';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(obstacle.x, obstacle.y, obstacle.radius - 3, 0, Math.PI * 2);
      ctx.stroke();

      // Gambar efek retakan untuk jalan bergelombang
      ctx.strokeStyle = '#5D4037';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(obstacle.x - obstacle.radius / 2, obstacle.y - obstacle.radius / 2);
      ctx.lineTo(obstacle.x + obstacle.radius / 2, obstacle.y + obstacle.radius / 2);
      ctx.moveTo(obstacle.x + obstacle.radius / 2, obstacle.y - obstacle.radius / 2);
      ctx.lineTo(obstacle.x - obstacle.radius / 2, obstacle.y + obstacle.radius / 2);
      ctx.stroke();
    } else {
      // Gambar lingkaran hitam untuk jalan berlubang
      ctx.fillStyle = '#000000'; // Hitam
      ctx.beginPath();
      ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
      ctx.fill();

      // Tambahkan detail untuk efek lubang
      ctx.fillStyle = '#333333';
      ctx.beginPath();
      ctx.arc(obstacle.x, obstacle.y, obstacle.radius - 3, 0, Math.PI * 2);
      ctx.fill();

      // Gambar efek retakan untuk jalan rusak
      ctx.strokeStyle = '#555555';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        const startX = obstacle.x + Math.cos(angle) * (obstacle.radius - 5);
        const startY = obstacle.y + Math.sin(angle) * (obstacle.radius - 5);
        const endX = obstacle.x + Math.cos(angle) * (obstacle.radius + 2);
        const endY = obstacle.y + Math.sin(angle) * (obstacle.radius + 2);
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
      }
      ctx.stroke();
    }
  });
}

// Fungsi menggambar roda
function drawWheel() {
  // Roda utama
  ctx.fillStyle = '#333333';
  ctx.beginPath();
  ctx.arc(wheel.x, wheel.y, wheel.radius, 0, Math.PI * 2);
  ctx.fill();

  // Ban
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(wheel.x, wheel.y, wheel.radius, 0, Math.PI * 2);
  ctx.stroke();

  // Jari-jari roda
  ctx.strokeStyle = '#CCCCCC';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 + wheel.rotation;
    const innerX = wheel.x + Math.cos(angle) * (wheel.radius * 0.3);
    const innerY = wheel.y + Math.sin(angle) * (wheel.radius * 0.3);
    const outerX = wheel.x + Math.cos(angle) * (wheel.radius * 0.9);
    const outerY = wheel.y + Math.sin(angle) * (wheel.radius * 0.9);

    ctx.beginPath();
    ctx.moveTo(innerX, innerY);
    ctx.lineTo(outerX, outerY);
    ctx.stroke();
  }

  // Pusat roda
  ctx.fillStyle = '#FF5722';
  ctx.beginPath();
  ctx.arc(wheel.x, wheel.y, wheel.radius * 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Efek bayangan
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

// Fungsi untuk mulai menggambar
function startDrawing(e) {
  if (gameStarted || currentMode !== 'draw') return;
  isDrawing = true;
  points = [];
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  points.push({ x, y });

  statusInfo.textContent = 'Menggambar jalan...';
}

// Fungsi menggambar saat mouse bergerak
function draw(e) {
  if (!isDrawing || currentMode !== 'draw') return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  points.push({ x, y });

  drawGrid();
  drawRoad();
  updateInfoPanel();
}

// Fungsi berhenti menggambar
function stopDrawing() {
  if (!isDrawing) return;
  isDrawing = false;

  if (points.length > 1) {
    statusInfo.textContent = "Jalan siap! Tekan 'Mulai' untuk memulai permainan";
  } else {
    statusInfo.textContent = 'Gambar jalan untuk memulai';
  }

  updateInfoPanel();
}

// Fungsi memperbarui panel info
function updateInfoPanel() {
  if (points.length < 2) {
    monotonicityInfo.textContent = '-';
    concavityInfo.textContent = '-';
    slopeInfo.textContent = '-';
    return;
  }

  // Hitung karakteristik jalan
  let increasing = 0;
  let decreasing = 0;
  let concaveUp = 0;
  let concaveDown = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    // Hitung slope
    const slope = (p2.y - p1.y) / (p2.x - p1.x);
    if (slope > 0.1) increasing++;
    else if (slope < -0.1) decreasing++;

    // Hitung concavity (jika ada cukup titik)
    if (i > 0 && i < points.length - 2) {
      const p0 = points[i - 1];
      const p3 = points[i + 2];
      const slope1 = (p2.y - p1.y) / (p2.x - p1.x);
      const slope2 = (p3.y - p2.y) / (p3.x - p2.x);
      const secondDerivative = (slope2 - slope1) / ((p3.x - p1.x) / 2);

      if (secondDerivative > 0) concaveUp++;
      else if (secondDerivative < 0) concaveDown++;
    }
  }

  // Update info panel
  monotonicityInfo.textContent = increasing > decreasing ? 'Naik' : decreasing > increasing ? 'Turun' : 'Bervariasi';
  concavityInfo.textContent = concaveUp > concaveDown ? 'Cekung Atas' : concaveDown > concaveUp ? 'Cekung Bawah' : 'Bervariasi';

  // Tampilkan slope rata-rata
  const avgSlope = (increasing - decreasing) / (points.length - 1);
  slopeInfo.textContent = avgSlope.toFixed(2);
}

// Fungsi memulai game
function startGame() {
  if (points.length < 10) {
    Swal.fire({
      icon: 'warning',
      title: 'Gambar jalan terlebih dahulu',
      timer: 3000,
      timerProgressBar: true,
      confirmButtonColor: '#2b7fff',
    });
    return;
  }

  if (gameStarted) return;

  gameStarted = true;
  score = 0;
  distance = 0;
  scoreDisplay.textContent = score;
  distanceDisplay.textContent = distance;

  // Reset roda
  wheel.x = points[0].x;
  wheel.y = points[0].y;
  wheel.velocity = gameSpeed / 10;
  wheel.rotation = 0;

  // Generate hambatan dan checkpoint
  generateObstacles();
  generateCheckpoints();

  // Mulai animasi
  animate();

  statusInfo.textContent = 'Permainan berlangsung!';
}

// Fungsi animasi utama
function animate() {
  // Hapus canvas
  drawGrid();

  // Gambar elemen game
  drawRoad();
  drawObstacles();
  drawWheel();

  // Update posisi roda
  updateWheelPosition();

  // Cek tabrakan dan checkpoint
  checkCollisions();
  checkCheckpoints();

  // Cek jika game selesai
  if (wheel.x > canvas.width || wheel.y > canvas.height || wheel.y < 0) {
    endGame();
    return;
  }

  // Lanjutkan animasi
  animationId = requestAnimationFrame(animate);
}

// Fungsi memperbarui posisi roda
function updateWheelPosition() {
  if (points.length < 2 || wheelStopped) return;

  // Cari segmen jalan yang sesuai dengan posisi x roda
  let segmentIndex = -1;
  for (let i = 0; i < points.length - 1; i++) {
    if (wheel.x >= points[i].x && wheel.x <= points[i + 1].x) {
      segmentIndex = i;
      break;
    }
  }

  // Jika roda di luar jalan, cari segmen terdekat
  if (segmentIndex === -1) {
    if (wheel.x < points[0].x) segmentIndex = 0;
    else segmentIndex = points.length - 2;
  }

  const p1 = points[segmentIndex];
  const p2 = points[segmentIndex + 1];

  // Interpolasi linear untuk mendapatkan y
  const t = (wheel.x - p1.x) / (p2.x - p1.x);
  wheel.y = p1.y + t * (p2.y - p1.y);

  // Hitung slope untuk segmen ini
  const slope = (p2.y - p1.y) / (p2.x - p1.x);

  // Pengaruh slope terhadap kecepatan yang lebih realistis
  wheel.velocity += slope * 0.02;

  // Batasi kecepatan
  wheel.velocity = Math.max(0.3, Math.min(wheel.velocity, gameSpeed / 3));

  // Update posisi x berdasarkan kecepatan
  wheel.x += wheel.velocity * (gameSpeed / 5);

  // Update rotasi roda berdasarkan kecepatan
  wheel.rotation += wheel.velocity * 0.1;

  // Update jarak
  distance = Math.floor(wheel.x / 10);
  distanceDisplay.textContent = distance;

  // Update kecepatan display
  speedDisplay.textContent = (wheel.velocity * 20).toFixed(1);

  // Update info berdasarkan posisi saat ini
  updateCurrentInfo(segmentIndex);
}

// Fungsi memperbarui info berdasarkan posisi roda saat ini
function updateCurrentInfo(segmentIndex) {
  if (segmentIndex < 0 || segmentIndex >= points.length - 1) return;

  const p1 = points[segmentIndex];
  const p2 = points[segmentIndex + 1];

  // Hitung slope
  const slope = (p2.y - p1.y) / (p2.x - p1.x);

  // Hitung concavity (jika memungkinkan)
  let concavity = 0;
  if (segmentIndex > 0 && segmentIndex < points.length - 2) {
    const p0 = points[segmentIndex - 1];
    const p3 = points[segmentIndex + 2];
    const slope1 = (p2.y - p1.y) / (p2.x - p1.x);
    const slope2 = (p3.y - p2.y) / (p3.x - p2.x);
    concavity = (slope2 - slope1) / ((p3.x - p1.x) / 2);
  }

  // Update info panel
  monotonicityInfo.textContent = slope > 0.1 ? 'Naik' : slope < -0.1 ? 'Turun' : 'Datar';
  concavityInfo.textContent = concavity > 0 ? 'Cekung Atas' : concavity < 0 ? 'Cekung Bawah' : 'Linear';
  slopeInfo.textContent = slope.toFixed(2);
  currentSpeedInfo.textContent = (wheel.velocity * 20).toFixed(1);
}

// Fungsi menghasilkan hambatan
function generateObstacles() {
  obstacles = [];
  const obstacleCount = 5 + Math.floor(difficulty / 2);

  for (let i = 0; i < obstacleCount; i++) {
    // Posisi acak di sepanjang jalan
    const segmentIndex = Math.floor(Math.random() * (points.length - 1));
    const p1 = points[segmentIndex];
    const p2 = points[segmentIndex + 1];

    const t = Math.random();
    const x = p1.x + t * (p2.x - p1.x);
    const y = p1.y + t * (p2.y - p1.y);

    // Tentukan jenis hambatan berdasarkan slope
    const slope = (p2.y - p1.y) / (p2.x - p1.x);
    let type, radius;

    if (slope > 0.1) {
      // Slope positif - jalan bergelombang (bump)
      type = 'bump';
      radius = 15;
    } else if (slope < -0.1) {
      // Slope negatif - jalan berlubang (pothole)
      type = 'pothole';
      radius = 12;
    } else {
      // Slope datar - acak antara bump dan pothole
      type = Math.random() > 0.5 ? 'bump' : 'pothole';
      radius = type === 'bump' ? 15 : 12;
    }

    obstacles.push({
      x,
      y,
      radius,
      type,
      passed: false,
    });
  }
}

// Fungsi menghasilkan checkpoint
function generateCheckpoints() {
  checkpoints = [];
  const checkpointCount = 3 + Math.floor(difficulty / 3);

  for (let i = 0; i < checkpointCount; i++) {
    // Posisi acak di sepanjang jalan (setelah bagian awal)
    const segmentIndex = Math.floor(Math.random() * (points.length - 10)) + 5;
    const p1 = points[segmentIndex];
    const p2 = points[segmentIndex + 1];

    const t = Math.random();
    const x = p1.x + t * (p2.x - p1.x);
    const y = p1.y + t * (p2.y - p1.y);

    checkpoints.push({
      x,
      y,
      passed: false,
    });
  }
}

// Fungsi cek tabrakan
function checkCollisions() {
  for (let i = 0; i < obstacles.length; i++) {
    const obstacle = obstacles[i];

    // Hitung jarak antara roda dan hambatan
    const dx = wheel.x - obstacle.x;
    const dy = wheel.y - obstacle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Jika terjadi tabrakan dan belum diproses
    if (distance < wheel.radius + obstacle.radius && !obstacle.passed) {
      obstacle.passed = true;

      // Tentukan efek berdasarkan jenis hambatan
      if (obstacle.type === 'pothole') {
        handlePotholeCollision();
      } else if (obstacle.type === 'bump') {
        handleBumpCollision();
      }

      // Efek partikel
      createParticles(obstacle.x, obstacle.y, obstacle.type === 'bump' ? '#8B4513' : '#000000');
    }
  }
}

// Fungsi menangani tabrakan dengan jalan berlubang (pothole)
function handlePotholeCollision() {
  const randomValue = Math.random();

  if (randomValue < DAMAGE_PROBABILITIES.pothole.severe) {
    // Roda bocor (40% kemungkinan)
    stopWheel(STOP_DURATIONS.pothole.severe, roadDamagePopup);
  } else {
    // Jalan rusak ringan (60% kemungkinan)
    stopWheel(STOP_DURATIONS.pothole.light, roadDamageLightPopup);
  }
}

// Fungsi menangani tabrakan dengan jalan bergelombang (bump)
function handleBumpCollision() {
  const randomValue = Math.random();

  if (randomValue < DAMAGE_PROBABILITIES.bump.severe) {
    // Shock rusak (30% kemungkinan)
    stopWheel(STOP_DURATIONS.bump.severe, bumpyRoadPopup);
  } else {
    // Hanya memperlambat tanpa berhenti (70% kemungkinan)
    wheel.velocity *= 0.5;
  }
}

// Fungsi menghentikan roda sementara
function stopWheel(duration, popupElement) {
  wheelStopped = true;
  const originalVelocity = wheel.velocity;
  wheel.velocity = 0;

  // Tampilkan popup
  popupElement.style.display = 'block';

  // Sembunyikan popup setelah 2 detik
  setTimeout(() => {
    popupElement.style.display = 'none';
  }, 2000);

  // Mulai timeout untuk mengembalikan roda
  if (stopTimeout) clearTimeout(stopTimeout);
  stopTimeout = setTimeout(() => {
    wheelStopped = false;
    wheel.velocity = originalVelocity * 0.7; // Kembalikan dengan kecepatan yang sedikit berkurang
  }, duration);
}

// Fungsi cek checkpoint
function checkCheckpoints() {
  for (let i = 0; i < checkpoints.length; i++) {
    const checkpoint = checkpoints[i];

    if (!checkpoint.passed) {
      // Hitung jarak antara roda dan checkpoint
      const dx = wheel.x - checkpoint.x;
      const dy = wheel.y - checkpoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Jika roda melewati checkpoint
      if (distance < wheel.radius + 10) {
        checkpoint.passed = true;
        score += 10 * difficulty;
        scoreDisplay.textContent = score;

        // Tampilkan popup sukses
        showSuccessPopup();

        // Efek partikel
        createParticles(checkpoint.x, checkpoint.y, '#10B981');
      }
    }
  }
}

// Fungsi menampilkan popup sukses
function showSuccessPopup() {
  successPopup.classList.remove('hidden');
  setTimeout(() => {
    successPopup.classList.add('hidden');
  }, 1000);
}

// Fungsi membuat partikel efek
function createParticles(x, y, color) {
  for (let i = 0; i < 10; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.width = '5px';
    particle.style.height = '5px';
    particle.style.backgroundColor = color;
    particle.style.position = 'absolute';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;

    document.querySelector('.relative').appendChild(particle);

    // Animasi partikel
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 3;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    let opacity = 1;
    const animateParticle = () => {
      opacity -= 0.02;
      particle.style.opacity = opacity;
      particle.style.left = `${parseFloat(particle.style.left) + vx}px`;
      particle.style.top = `${parseFloat(particle.style.top) + vy}px`;

      if (opacity > 0) {
        requestAnimationFrame(animateParticle);
      } else {
        particle.remove();
      }
    };

    animateParticle();
  }
}

// Fungsi menghasilkan jalan acak yang lebih halus
function generateRandomCurve() {
  points = [];

  // Gunakan fungsi matematika untuk menghasilkan jalan acak yang lebih halus
  const curveType = Math.floor(Math.random() * 3);
  let baseY = canvas.height / 2;

  switch (curveType) {
    case 0: // Polinomial lembut
      // Koefisien yang lebih kecil untuk kurva yang lebih halus
      const a = (Math.random() - 0.5) * 0.00005;
      const b = (Math.random() - 0.5) * 0.005;
      const c = baseY;

      for (let x = 0; x < canvas.width; x += 10) {
        // Tambahkan sedikit variasi acak untuk membuatnya lebih natural
        const randomVariation = (Math.random() - 0.5) * 10;
        const y = a * x * x + b * x + c + randomVariation;
        points.push({ x, y });
      }
      break;

    case 1: // Sinusoidal dengan amplitudo terbatas
      // Amplitudo dan frekuensi yang lebih kecil
      const amplitude = Math.random() * 30 + 20; // 20-50
      const frequency = Math.random() * 0.02 + 0.01; // 0.01-0.03
      const phase = Math.random() * Math.PI * 2;

      for (let x = 0; x < canvas.width; x += 10) {
        const y = baseY + amplitude * Math.sin(frequency * x + phase);
        points.push({ x, y });
      }
      break;

    case 2: // Kurva berbasis noise/perlin (disimulasikan)
      let currentY = baseY;
      const maxChange = 15; // Perubahan maksimum per segmen

      for (let x = 0; x < canvas.width; x += 10) {
        // Simulasi noise dengan perubahan bertahap
        const change = (Math.random() - 0.5) * maxChange;
        currentY += change;

        // Batasi agar tidak keluar dari canvas
        currentY = Math.max(50, Math.min(canvas.height - 50, currentY));

        points.push({ x, y: currentY });
      }
      break;
  }

  // Pastikan jalan dimulai dari kiri canvas
  if (points.length > 0) {
    points[0].x = 0;
  }

  drawGrid();
  drawRoad();
  updateInfoPanel();

  statusInfo.textContent = "Jalan acak siap! Tekan 'Mulai' untuk memulai permainan";
}

// Fungsi mengosongkan canvas
function clearCanvas() {
  if (gameStarted) {
    cancelAnimationFrame(animationId);
    gameStarted = false;
  }

  if (stopTimeout) {
    clearTimeout(stopTimeout);
    stopTimeout = null;
  }

  wheelStopped = false;
  points = [];
  obstacles = [];
  checkpoints = [];
  drawGrid();
  updateInfoPanel();

  statusInfo.textContent = 'Gambar jalan untuk memulai';
  scoreDisplay.textContent = '0';
  distanceDisplay.textContent = '0';
  speedDisplay.textContent = '0';

  // Sembunyikan semua popup
  roadDamagePopup.style.display = 'none';
  roadDamageLightPopup.style.display = 'none';
  bumpyRoadPopup.style.display = 'none';
}

// Fungsi mengakhiri game
function endGame() {
  gameStarted = false;
  cancelAnimationFrame(animationId);

  if (stopTimeout) {
    clearTimeout(stopTimeout);
    stopTimeout = null;
  }

  finalScoreDisplay.textContent = score;
  finalDistanceDisplay.textContent = distance;
  gameOverScreen.classList.remove('hidden');
}

// Fungsi memulai ulang game
function restartGame() {
  gameOverScreen.classList.add('hidden');
  clearCanvas();
}

// Fungsi memperbarui kecepatan
function updateVelocity() {
  gameSpeed = parseInt(velocitySlider.value);
  velocityValue.textContent = gameSpeed;
}

// Fungsi memperbarui kesulitan
function updateDifficulty() {
  difficulty = parseInt(difficultySlider.value);
  difficultyValue.textContent = difficulty;
}

// Inisialisasi game
init();
