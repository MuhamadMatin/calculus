// Inisialisasi variabel
let chart;
let functionType = 'polynomial';
let polyA = 1,
  polyB = 0,
  polyC = 0;
let sinA = 1,
  sinB = 1;
let expA = 1,
  expB = 0.5;
let logA = 1,
  logB = 1;
let tangentX = 1;
let xMin = -5,
  xMax = 5;

// Fungsi matematika
const functions = {
  polynomial: {
    f: (x) => polyA * x * x + polyB * x + polyC,
    fPrime: (x) => 2 * polyA * x + polyB,
    fDoublePrime: (x) => 2 * polyA,
    expression: () => {
      let expr = '';
      if (polyA !== 0) expr += `${polyA}x²`;
      if (polyB !== 0) expr += (polyB > 0 && expr !== '' ? ' + ' : '') + (polyB === 1 ? 'x' : polyB === -1 ? '-x' : `${polyB}x`);
      if (polyC !== 0) expr += (polyC > 0 && expr !== '' ? ' + ' : '') + polyC;
      return expr || '0';
    },
    firstDerivative: () => {
      let expr = '';
      if (2 * polyA !== 0) expr += `${2 * polyA}x`;
      if (polyB !== 0) expr += (polyB > 0 && expr !== '' ? ' + ' : '') + polyB;
      return expr || '0';
    },
    secondDerivative: () => `${2 * polyA}`,
  },
  sinus: {
    f: (x) => sinA * Math.sin(sinB * x),
    fPrime: (x) => sinA * sinB * Math.cos(sinB * x),
    fDoublePrime: (x) => -sinA * sinB * sinB * Math.sin(sinB * x),
    expression: () => `${sinA} sin(${sinB}x)`,
    firstDerivative: () => `${sinA * sinB} cos(${sinB}x)`,
    secondDerivative: () => `-${sinA * sinB * sinB} sin(${sinB}x)`,
  },
  exponential: {
    f: (x) => expA * Math.exp(expB * x),
    fPrime: (x) => expA * expB * Math.exp(expB * x),
    fDoublePrime: (x) => expA * expB * expB * Math.exp(expB * x),
    expression: () => `${expA} e^(${expB}x)`,
    firstDerivative: () => `${expA * expB} e^(${expB}x)`,
    secondDerivative: () => `${expA * expB * expB} e^(${expB}x)`,
  },
  logarithm: {
    f: (x) => {
      if (logB * x <= 0) return NaN;
      return logA * Math.log(logB * x);
    },
    fPrime: (x) => {
      if (logB * x <= 0) return NaN;
      return (logA * logB) / (logB * x);
    },
    fDoublePrime: (x) => {
      if (logB * x <= 0) return NaN;
      return (-logA * logB * logB) / (logB * x * logB * x);
    },
    expression: () => `${logA} ln(${logB}x)`,
    firstDerivative: () => `${logA}/${logB}x`,
    secondDerivative: () => `-${logA}/(${logB}x)²`,
  },
};

// Fungsi untuk sinkronisasi slider dan input angka
function syncSliderAndNumber(sliderId, numberId) {
  const slider = document.getElementById(sliderId);
  const number = document.getElementById(numberId);

  // Sinkronisasi dari slider ke input angka
  slider.addEventListener('input', function () {
    number.value = this.value;
    updateValues();
  });

  // Sinkronisasi dari input angka ke slider
  number.addEventListener('input', function () {
    let value = parseFloat(this.value);
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);

    // Validasi nilai
    if (isNaN(value)) return;
    if (value < min) value = min;
    if (value > max) value = max;

    slider.value = value;
    updateValues();
  });
}

// Fungsi untuk memperbarui tampilan
function updateValues() {
  functionType = document.getElementById('functionType').value;

  // Perbarui nilai parameter berdasarkan jenis fungsi
  if (functionType === 'polynomial') {
    polyA = parseFloat(document.getElementById('polyA').value);
    polyB = parseFloat(document.getElementById('polyB').value);
    polyC = parseFloat(document.getElementById('polyC').value);

    document.getElementById('polyAValue').textContent = polyA.toFixed(1);
    document.getElementById('polyBValue').textContent = polyB.toFixed(1);
    document.getElementById('polyCValue').textContent = polyC.toFixed(1);
  } else if (functionType === 'sinus') {
    sinA = parseFloat(document.getElementById('sinA').value);
    sinB = parseFloat(document.getElementById('sinB').value);

    document.getElementById('sinAValue').textContent = sinA.toFixed(1);
    document.getElementById('sinBValue').textContent = sinB.toFixed(1);
  } else if (functionType === 'exponential') {
    expA = parseFloat(document.getElementById('expA').value);
    expB = parseFloat(document.getElementById('expB').value);

    document.getElementById('expAValue').textContent = expA.toFixed(1);
    document.getElementById('expBValue').textContent = expB.toFixed(1);
  } else if (functionType === 'logarithm') {
    logA = parseFloat(document.getElementById('logA').value);
    logB = parseFloat(document.getElementById('logB').value);

    document.getElementById('logAValue').textContent = logA.toFixed(1);
    document.getElementById('logBValue').textContent = logB.toFixed(1);
  }

  tangentX = parseFloat(document.getElementById('tangentPoint').value);
  document.getElementById('tangentPointValue').textContent = tangentX.toFixed(1);

  // Perbarui rentang grafik
  xMin = parseFloat(document.getElementById('xMin').value);
  xMax = parseFloat(document.getElementById('xMax').value);

  updateAnalysis();
  updateChart();
}

// Memperbarui analisis
function updateAnalysis() {
  const func = functions[functionType];
  const fx = func.f(tangentX);
  const fpx = func.fPrime(tangentX);
  const fdpx = func.fDoublePrime(tangentX);

  // Perbarui informasi fungsi
  document.getElementById('functionExpression').textContent = `f(x) = ${func.expression()}`;
  document.getElementById('firstDerivative').textContent = `f'(x) = ${func.firstDerivative()}`;
  document.getElementById('secondDerivative').textContent = `f''(x) = ${func.secondDerivative()}`;
  document.getElementById('functionValue').textContent = `f(${tangentX.toFixed(1)}) = ${isNaN(fx) ? 'Tidak terdefinisi' : fx.toFixed(2)}`;

  // Persamaan garis singgung
  if (!isNaN(fx) && !isNaN(fpx)) {
    const tangentIntercept = fx - fpx * tangentX;
    let tangentLine = '';
    if (fpx !== 0) {
      tangentLine = `${fpx.toFixed(2)}x ${tangentIntercept >= 0 ? '+' : '-'} ${Math.abs(tangentIntercept).toFixed(2)}`;
    } else {
      tangentLine = `${fx.toFixed(2)}`;
    }
    document.getElementById('tangentInfo').textContent = `Persamaan: y = ${tangentLine}`;
    document.getElementById('slopeInfo').textContent = `Kemiringan: ${fpx.toFixed(2)}`;

    // Perbarui perhitungan garis singgung
    document.getElementById('tangentCalculation').innerHTML = `
                    <strong>Perhitungan untuk x = ${tangentX.toFixed(1)}:</strong><br>
                    1. f(${tangentX.toFixed(1)}) = ${fx.toFixed(2)}<br>
                    2. f'(${tangentX.toFixed(1)}) = ${fpx.toFixed(2)}<br>
                    3. Persamaan: y - ${fx.toFixed(2)} = ${fpx.toFixed(2)}(x - ${tangentX.toFixed(1)})<br>
                    4. Sederhanakan: y = ${fpx.toFixed(2)}x ${tangentIntercept >= 0 ? '+' : '-'} ${Math.abs(tangentIntercept).toFixed(2)}
                `;
  } else {
    document.getElementById('tangentInfo').textContent = 'Garis singgung tidak terdefinisi';
    document.getElementById('slopeInfo').textContent = 'Kemiringan: -';
    document.getElementById('tangentCalculation').innerHTML = 'Tidak dapat menghitung garis singgung pada titik ini.';
  }

  // Kemonotonan
  const monotonicityElement = document.getElementById('monotonicityInfo');
  if (!isNaN(fpx)) {
    if (fpx > 0) {
      monotonicityElement.textContent = 'Fungsi naik di sekitar titik ini';
      monotonicityElement.className = 'text-sm text-green-700 mt-1';

      // Perbarui perhitungan kemonotonan
      document.getElementById('monotonicityCalculation').innerHTML = `
                        <strong>Perhitungan:</strong><br>
                        f'(${tangentX.toFixed(1)}) = ${fpx.toFixed(2)} > 0<br>
                        Jadi fungsi <strong>naik</strong> di sekitar x = ${tangentX.toFixed(1)}
                    `;
    } else if (fpx < 0) {
      monotonicityElement.textContent = 'Fungsi turun di sekitar titik ini';
      monotonicityElement.className = 'text-sm text-red-700 mt-1';

      // Perbarui perhitungan kemonotonan
      document.getElementById('monotonicityCalculation').innerHTML = `
                        <strong>Perhitungan:</strong><br>
                        f'(${tangentX.toFixed(1)}) = ${fpx.toFixed(2)} < 0<br>
                        Jadi fungsi <strong>turun</strong> di sekitar x = ${tangentX.toFixed(1)}
                    `;
    } else {
      monotonicityElement.textContent = 'Fungsi stasioner di titik ini';
      monotonicityElement.className = 'text-sm text-yellow-700 mt-1';

      // Perbarui perhitungan kemonotonan
      document.getElementById('monotonicityCalculation').innerHTML = `
                        <strong>Perhitungan:</strong><br>
                        f'(${tangentX.toFixed(1)}) = ${fpx.toFixed(2)} = 0<br>
                        Jadi fungsi <strong>stasioner</strong> di x = ${tangentX.toFixed(1)}
                    `;
    }
  } else {
    monotonicityElement.textContent = 'Kemonotonan tidak terdefinisi';
    monotonicityElement.className = 'text-sm text-gray-700 mt-1';
    document.getElementById('monotonicityCalculation').innerHTML = 'Tidak dapat menentukan kemonotonan pada titik ini.';
  }

  // Kecekungan
  const concavityElement = document.getElementById('concavityInfo');
  if (!isNaN(fdpx)) {
    if (fdpx > 0) {
      concavityElement.textContent = 'Fungsi cekung ke atas di sekitar titik ini';
      concavityElement.className = 'text-sm text-purple-700 mt-1';

      // Perbarui perhitungan kecekungan
      document.getElementById('concavityCalculation').innerHTML = `
                        <strong>Perhitungan:</strong><br>
                        f''(${tangentX.toFixed(1)}) = ${fdpx.toFixed(2)} > 0<br>
                        Jadi fungsi <strong>cekung ke atas</strong> di sekitar x = ${tangentX.toFixed(1)}
                    `;
    } else if (fdpx < 0) {
      concavityElement.textContent = 'Fungsi cekung ke bawah di sekitar titik ini';
      concavityElement.className = 'text-sm text-purple-700 mt-1';

      // Perbarui perhitungan kecekungan
      document.getElementById('concavityCalculation').innerHTML = `
                        <strong>Perhitungan:</strong><br>
                        f''(${tangentX.toFixed(1)}) = ${fdpx.toFixed(2)} < 0<br>
                        Jadi fungsi <strong>cekung ke bawah</strong> di sekitar x = ${tangentX.toFixed(1)}
                    `;
    } else {
      concavityElement.textContent = 'Tidak ada kecekungan di titik ini';
      concavityElement.className = 'text-sm text-gray-700 mt-1';

      // Perbarui perhitungan kecekungan
      document.getElementById('concavityCalculation').innerHTML = `
                        <strong>Perhitungan:</strong><br>
                        f''(${tangentX.toFixed(1)}) = ${fdpx.toFixed(2)} = 0<br>
                        Titik ini mungkin merupakan <strong>titik belok</strong>
                    `;
    }
  } else {
    concavityElement.textContent = 'Kecekungan tidak terdefinisi';
    concavityElement.className = 'text-sm text-gray-700 mt-1';
    document.getElementById('concavityCalculation').innerHTML = 'Tidak dapat menentukan kecekungan pada titik ini.';
  }

  // Kecepatan Sesaat
  const velocityElement = document.getElementById('instantVelocityInfo');
  if (!isNaN(fpx)) {
    velocityElement.textContent = `Kecepatan sesaat: ${fpx.toFixed(2)}`;

    // Perbarui perhitungan kecepatan sesaat
    document.getElementById('velocityCalculation').innerHTML = `
                    <strong>Perhitungan:</strong><br>
                    Kecepatan sesaat = f'(${tangentX.toFixed(1)}) = ${fpx.toFixed(2)}
                `;
  } else {
    velocityElement.textContent = 'Kecepatan sesaat tidak terdefinisi';
    document.getElementById('velocityCalculation').innerHTML = 'Tidak dapat menghitung kecepatan sesaat pada titik ini.';
  }
}

// Memperbarui grafik
function updateChart() {
  const func = functions[functionType];

  // Data untuk fungsi utama
  const data = [];
  const step = (xMax - xMin) / 200;

  for (let x = xMin; x <= xMax; x += step) {
    const y = func.f(x);
    if (!isNaN(y) && isFinite(y)) {
      data.push({
        x: x,
        y: y,
      });
    }
  }

  // Data untuk garis singgung
  const tangentData = [];
  const fx = func.f(tangentX);
  const fpx = func.fPrime(tangentX);

  if (!isNaN(fx) && !isNaN(fpx)) {
    // Rentang garis singgung (2 satuan di kiri dan kanan titik)
    const tangentRange = 2;
    const tangentStep = (2 * tangentRange) / 20;

    for (let x = tangentX - tangentRange; x <= tangentX + tangentRange; x += tangentStep) {
      const y = fpx * (x - tangentX) + fx;
      if (!isNaN(y) && isFinite(y)) {
        tangentData.push({
          x: x,
          y: y,
        });
      }
    }
  }

  // Konfigurasi ApexCharts
  const options = {
    series: [
      {
        name: `Fungsi f(x) = ${func.expression()}`,
        data: data,
        type: 'line',
      },
      {
        name: 'Garis Singgung',
        data: tangentData,
        type: 'line',
      },
      {
        name: 'Titik Analisis',
        data: !isNaN(fx) && isFinite(fx) ? [{ x: tangentX, y: fx }] : [],
        type: 'scatter',
      },
    ],
    chart: {
      height: '100%',
      type: 'line',
      zoom: {
        enabled: false,
      },
      animations: {
        enabled: true,
        easing: 'linear',
        dynamicAnimation: {
          speed: 500,
        },
      },
      toolbar: {
        show: false,
      },
    },
    colors: ['#3b82f6', '#ef4444', '#10b981'],
    stroke: {
      width: [3, 2, 0],
      dashArray: [0, 5, 0],
    },
    markers: {
      size: [0, 0, 6],
      colors: ['#10b981'],
    },
    xaxis: {
      type: 'numeric',
      min: xMin,
      max: xMax,
      tickAmount: 10,
      labels: {
        formatter: function (val) {
          return val.toFixed(1);
        },
      },
    },
    yaxis: {
      tickAmount: 10,
      labels: {
        formatter: function (val) {
          return val.toFixed(1);
        },
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      x: {
        formatter: function (val) {
          return 'x: ' + val.toFixed(2);
        },
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'center',
    },
    grid: {
      borderColor: '#e7e7e7',
      row: {
        colors: ['#f3f4f6', 'transparent'],
        opacity: 0.5,
      },
    },
  };

  // Render atau perbarui grafik
  if (!chart) {
    chart = new ApexCharts(document.querySelector('#chart'), options);
    chart.render();
  } else {
    chart.updateOptions(options);
  }
}

// Fungsi untuk menampilkan parameter yang sesuai
function showFunctionParams() {
  const functionType = document.getElementById('functionType').value;

  // Sembunyikan semua parameter
  document.querySelectorAll('.function-param').forEach((param) => {
    param.classList.add('hidden');
  });

  // Tampilkan parameter yang sesuai
  document.querySelectorAll(`.function-param.${functionType}`).forEach((param) => {
    param.classList.remove('hidden');
  });

  updateValues();
}

// Fungsi untuk toggle penjelasan
function setupExplanationToggles() {
  document.querySelectorAll('.explanation-toggle').forEach((toggle) => {
    toggle.addEventListener('click', function () {
      const targetId = this.getAttribute('data-target');
      const target = document.getElementById(targetId);
      target.classList.toggle('expanded');

      // Ubah teks tombol
      if (target.classList.contains('expanded')) {
        this.textContent = this.textContent.replace('▼', '▲');
      } else {
        this.textContent = this.textContent.replace('▲', '▼');
      }
    });
  });
}

// Setup sinkronisasi slider dan input angka
function setupSliderNumberSync() {
  // Polinomial
  syncSliderAndNumber('polyA', 'polyANum');
  syncSliderAndNumber('polyB', 'polyBNum');
  syncSliderAndNumber('polyC', 'polyCNum');

  // Sinus
  syncSliderAndNumber('sinA', 'sinANum');
  syncSliderAndNumber('sinB', 'sinBNum');

  // Eksponensial
  syncSliderAndNumber('expA', 'expANum');
  syncSliderAndNumber('expB', 'expBNum');

  // Logaritma
  syncSliderAndNumber('logA', 'logANum');
  syncSliderAndNumber('logB', 'logBNum');

  // Titik garis singgung
  syncSliderAndNumber('tangentPoint', 'tangentPointNum');
}

// Event listeners
document.getElementById('functionType').addEventListener('change', showFunctionParams);

// Event listeners untuk rentang grafik
document.getElementById('xMin').addEventListener('change', updateValues);
document.getElementById('xMax').addEventListener('change', updateValues);

// Event listener untuk tombol reset
document.getElementById('resetBtn').addEventListener('click', function () {
  document.getElementById('functionType').value = 'polynomial';

  // Reset nilai default untuk setiap fungsi
  document.getElementById('polyA').value = 1;
  document.getElementById('polyB').value = 0;
  document.getElementById('polyC').value = 0;

  document.getElementById('sinA').value = 1;
  document.getElementById('sinB').value = 1;

  document.getElementById('expA').value = 1;
  document.getElementById('expB').value = 0.5;

  document.getElementById('logA').value = 1;
  document.getElementById('logB').value = 1;

  document.getElementById('tangentPoint').value = 1;
  document.getElementById('xMin').value = -5;
  document.getElementById('xMax').value = 5;

  // Update nilai input angka juga
  document.getElementById('polyANum').value = 1;
  document.getElementById('polyBNum').value = 0;
  document.getElementById('polyCNum').value = 0;

  document.getElementById('sinANum').value = 1;
  document.getElementById('sinBNum').value = 1;

  document.getElementById('expANum').value = 1;
  document.getElementById('expBNum').value = 0.5;

  document.getElementById('logANum').value = 1;
  document.getElementById('logBNum').value = 1;

  document.getElementById('tangentPointNum').value = 1;

  showFunctionParams();
});

// Inisialisasi
showFunctionParams();
setupExplanationToggles();
setupSliderNumberSync();
