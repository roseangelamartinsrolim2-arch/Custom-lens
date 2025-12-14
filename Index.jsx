import React, { useRef, useState } from "react";

// Certifique-se de incluir o script do OpenCV.js no index.html:
// <script async src="https://docs.opencv.org/4.x/opencv.js"></script>

export default function CustomLens() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [analysis, setAnalysis] = useState("");
  const [caption, setCaption] = useState("");
  const [results, setResults] = useState([]);

  // Iniciar câmera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
    }
  };

  // Tirar foto
  const takePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataURL = canvas.toDataURL("image/jpeg");
    setPhoto(dataURL);
    analyzeLocal(canvas);
  };

  // Análise local com OpenCV
  const analyzeLocal = (canvas) => {
    if (!window.cv) {
      setAnalysis("OpenCV.js não carregado.");
      return;
    }
    const src = cv.imread(canvas);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    const edges = new cv.Mat();
    cv.Canny(gray, edges, 50, 150);
    setAnalysis("Análise local concluída: bordas detectadas.");
    src.delete(); gray.delete(); edges.delete();
  };

  // Pollination IA (exemplo fictício)
  const analyzePollination = async () => {
    if (!photo) return;
    try {
      const res = await fetch("https://api.pollination.ai/image/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: photo })
      });
      const data = await res.json();
      setCaption(data.caption || "Legenda não encontrada.");
    } catch (err) {
      console.error(err);
      setCaption("Erro ao consultar Pollination.");
    }
  };

  // Pesquisa na Wikimedia Commons
  const searchCommons = async () => {
    const query = caption || "nature";
    const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=imageinfo&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=5&iiprop=url`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      const pages = data?.query?.pages || {};
      setResults(Object.values(pages));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Custom Lens (React + OpenCV)</h1>
      <video ref={videoRef} autoPlay playsInline style={{ width: "320px" }} />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <div style={{ marginTop: "1rem" }}>
        <button onClick={startCamera}>Iniciar câmera</button>
        <button onClick={takePhoto}>Tirar foto</button>
        <button onClick={analyzePollination}>Analisar com Pollination</button>
        <button onClick={searchCommons}>Pesquisar na Wikimedia Commons</button>
      </div>

      {photo && (
        <div>
          <h2>Foto capturada</h2>
          <img src={photo} alt="captura" style={{ width: "320px" }} />
        </div>
      )}

      <h2>Análise local</h2>
      <pre>{analysis}</pre>

      <h2>Legenda Pollination</h2>
      <p>{caption}</p>

      <h2>Resultados Wikimedia Commons</h2>
      <ul>
        {results.map((r) => (
          <li key={r.pageid}>
            <img src={r.imageinfo?.[0]?.url} alt={r.title} width="120" />
            <span>{r.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
