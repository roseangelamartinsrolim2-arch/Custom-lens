# 📸 Custom Lens — IA de Visão com OpenCV + Wikimedia Commons

O **Custom Lens** é um protótipo de inteligência artificial que combina captura de imagens com **OpenCV.js**, análise local de visão computacional e integração com APIs públicas como **Pollination AI** e **Wikimedia Commons**.

---

## 🚀 Funcionalidades

- Captura de foto via **webcam** (HTML5 + getUserMedia).
- Análise local com **OpenCV.js**:
  - Conversão para escala de cinza.
  - Detecção de bordas (Canny).
  - Extração de paleta de cores dominante.
- Integração com **Pollination AI Image API** para gerar legendas automáticas.
- Pesquisa de imagens relacionadas na **Wikimedia Commons API**.
- Exibição dos resultados com miniaturas e metadados.

---

## 🛠️ Tecnologias utilizadas

- **JavaScript / JSX (React)** para interface.
- **OpenCV.js** para visão computacional no navegador.
- **APIs públicas**:
  - Pollination AI (legenda de imagens).
  - Wikimedia Commons (pesquisa de imagens).

---

## 📄 Exemplo de uso

### Captura e análise local

```javascript
const src = cv.imread(canvas);
const gray = new cv.Mat();
cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

const edges = new cv.Mat();
cv.Canny(gray, edges, 50, 150);

cv.imshow("canvasOutput", edges);
