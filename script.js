// Inicialização de variáveis e elementos
const els = {
  video: document.getElementById('video'),
  canvas: document.getElementById('canvas'),
  ctx: document.getElementById('canvas').getContext('2d'),
  photo: document.getElementById('photo'),
  btnInit: document.getElementById('btnInit'),
  btnShot: document.getElementById('btnShot'),
  camStatus: document.getElementById('camStatus'),

  pollEndpoint: document.getElementById('pollEndpoint'),
  pollKey: document.getElementById('pollKey'),
  pollMethod: document.getElementById('pollMethod'),
  pollTimeout: document.getElementById('pollTimeout'),
  btnAnalyze: document.getElementById('btnAnalyze'),
  pollStatus: document.getElementById('pollStatus'),
  pollOut: document.getElementById('pollOut'),

  cvOut: document.getElementById('cvOut'),
  cvStatus: document.getElementById('cvStatus'),
  palette: document.getElementById('palette'),

  searchTerms: document.getElementById('searchTerms'),
  limit: document.getElementById('limit'),
  usePoll: document.getElementById('usePoll'),
  btnSearch: document.getElementById('btnSearch'),
  searchStatus: document.getElementById('searchStatus'),
  results: document.getElementById('results'),
};

let stream = null;
let lastDataURL = null;
let lastCaption = '';

// Iniciar câmera
els.btnInit.addEventListener('click', async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    els.video.srcObject = stream;
    els.camStatus.innerHTML = '<span class="ok">Câmera iniciada.</span>';
  } catch (e) {
    els.camStatus.innerHTML = '<span class="err">Erro ao acessar câmera: ' + e.message + '</span>';
  }
});

// Tirar foto
els.btnShot.addEventListener('click', () => {
  if (!stream) {
    els.camStatus.innerHTML = '<span class="err">Inicie a câmera antes de tirar foto.</span>';
    return;
  }
  const w = els.video.videoWidth || 640;
  const h = els.video.videoHeight || 480;
  els.canvas.width = w;
  els.canvas.height = h;
  els.ctx.drawImage(els.video, 0, 0, w, h);
  lastDataURL = els.canvas.toDataURL('image/jpeg', 0.92);
  els.photo.src = lastDataURL;
  els.camStatus.innerHTML = '<span class="ok">Foto capturada.</span>';
  analyzeLocal();
});

// Função para mostrar paleta de cores
function setPalette(colors) {
  els.palette.innerHTML = '';
  colors.forEach(c => {
    const sw = document.createElement('div');
    sw.className = 'swatch';
    sw.style.background = `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
    els.palette.appendChild(sw);
  });
}

// Análise local com OpenCV
function analyzeLocal() {
  if (!window.cvReady || !cv) {
    els.cvStatus.innerHTML = '<span class="warn">OpenCV ainda não carregou.</span>';
    return;
  }
  if (!lastDataURL) {
    els.cvStatus.innerHTML = '<span class="warn">Nenhuma foto capturada.</span>';
    return;
  }

  const img = new Image();
  img.onload = () => {
    const w = img.width, h = img.height;
    const src = cv.imread(els.canvas);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    const edges = new cv.Mat();
    cv.Canny(gray, edges, 50, 150);

    const hist = new Array(6).fill(0);
    const imageData = els.ctx.getImageData(0, 0, w, h).data;
    for (let i = 0; i < imageData.length; i += 4) {
      const r = imageData[i], g = imageData[i+1], b = imageData[i+2];
      if (r > 128) hist[0]++; else hist[3]++;
      if (g > 128) hist[1]++; else hist[4]++;
      if (b > 128) hist[2]++; else hist[5]++;
    }

    const palette = dominantColors(imageData, w, h, 5);
    setPalette(palette);

    els.cvOut.textContent =
`[LOCAL ANALYSIS]
- Size: ${w}x${h}
- Edges (Canny): OK
- Color histogram: ${JSON.stringify(hist)}
- Dominant palette: ${JSON.stringify(palette)}`;
    els.cvStatus.innerHTML = '<span class="ok">Análise local concluída.</span>';

    src.delete(); gray.delete(); edges.delete();
  };
  img.src = lastDataURL;
}

// Função para extrair cores dominantes
function dominantColors(data, w, h, k = 4) {
  const samples = [];
  for (let i = 0; i < data.length; i += 4 * 200) {
    samples.push([data[i], data[i+1], data[i+2]]);
  }
  const centers = [];
  for (let i = 0; i < k; i++) centers.push(samples[Math.floor(i * samples.length / k)]);

  for (let iter = 0; iter < 8; iter++) {
    const groups = Array.from({ length: k }, () => []);
    for (const p of samples) {
      let best = 0, bestD = 1e9;
      for (let c = 0; c < k; c++) {
        const d = (p[0]-centers[c][0])**2 + (p[1]-centers[c][1])**2 + (p[2]-centers[c][2])**2;
        if (d < bestD) { bestD = d; best = c; }
      }
      groups[best].push(p);
    }
    for (let c = 0; c < k; c++) {
      if (groups[c].length === 0) continue;
      const sum = groups[c].reduce((a,b)=>[a[0]+b[0], a[1]+b[1], a[2]+b[2]], [0,0,0]);
      centers[c] = [Math.round(sum[0]/groups[c].length), Math.round(sum[1]/groups[c].length), Math.round(sum[2]/groups[c].length)];
    }
  }
  return centers;
}

// Função auxiliar para timeout em fetch
function timeoutFetch(url, opts = {}, ms = 20000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(id));
}

// Analisar com Pollination IA
els.btnAnalyze.addEventListener('click', async () => {
  if (!lastDataURL) {
    els.pollStatus.innerHTML = '<span class="warn">Capture uma foto primeiro.</span>';
    return;
  }
  const endpoint = els.pollEndpoint.value.trim();
  const key = els.pollKey.value.trim();
  const method = els.pollMethod.value;
  const ms = parseInt(els.pollTimeout.value || '20000', 10);

  if (!endpoint) {
    els.pollStatus.innerHTML = '<span class="warn">Endpoint da Pollination ausente. Usando termos locais.</span>';
    lastCaption = termsFromLocal();
    els.pollOut.textContent = lastCaption;
    return;
  }

  try {
    els.pollStatus.innerHTML = 'Enviando imagem para Pollination…';
    let res;
    if (method === 'json') {
      const body = JSON.stringify({ image: lastDataURL, prompt: 'Caption this image' });
      res = await timeoutFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': key ? `Bearer ${key}` : '' },
        body
      }, ms);
    } else {
      const blob = dataURLtoBlob(lastDataURL);
      const fd = new FormData();
      fd.append('file', blob, 'photo.jpg');
      fd.append('prompt', 'Caption this image');
      res = await timeoutFetch(endpoint, { method: 'POST', headers: { 'Authorization': key ? `Bearer ${key}` : '' }, body: fd }, ms);
    }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json().catch(()=> ({}));
    lastCaption = data.caption || data.text || data.result || '';
    if (!lastCaption) {
      lastCaption = termsFromLocal();
      els.pollStatus.innerHTML = '<span class="warn">Resposta sem legenda. Usando termos locais.</span>';
    } else {
      els.pollStatus.innerHTML = '<span class="ok">Legenda recebida.</span>';
    }
    els.pollOut.textContent = lastCaption;
