# Nghiên cứu: Chuyển TimeSeriesRacing sang Web-Based

## 1. Phân tích Stack hiện tại vs JavaScript Alternative

### Python Stack → JavaScript Stack Mapping

| Python Library | Purpose | JavaScript Alternative | Lý do |
|----------------|---------|------------------------|-------|
| **pandas** | Data manipulation, pivoting | **PapaParse + lodash** | PapaParse: Parse CSV tốt nhất cho web<br>lodash: Data transformation utilities |
| **matplotlib** | Base plotting engine | **Chart.js / D3.js** | Chart.js: Dễ dùng, nhiều chart types<br>D3.js: Mạnh mẽ, custom cao nhưng phức tạp |
| **bar_chart_race** | Bar chart animation | **Custom với Chart.js + GSAP** | GSAP: Animation library tốt nhất cho web<br>Tự code animation logic |
| **numpy** | Numerical operations | **Numeric.js / math.js** | math.js: Phổ biến, dễ dùng<br>Không cần nặng như numpy |
| **FFmpeg** | Video encoding | **WebM/Canvas Recording** | MediaRecorder API (browser native)<br>canvas-to-blob + WebM codec |

### Recommendation: Best Libraries cho Web-Based

```javascript
// Core Stack (Minimal & Easy Deploy)
{
  "data": "PapaParse",           // CSV parsing - 35KB minified
  "charts": "Chart.js",          // Chart rendering - 200KB
  "animation": "GSAP",           // Animation engine - 50KB
  "math": "lodash",              // Data utilities - 71KB (or use native JS)
  "recording": "MediaRecorder"   // Browser native API - 0KB
}

// Total: ~350KB (very lightweight!)
```

---

## 2. Kiến trúc Web-Based Architecture

### 2.1 Single Page Application (SPA) - Pure HTML/JS/CSS

```
┌─────────────────────────────────────────────────────┐
│              index.html (Entry Point)               │
│  ┌──────────────────────────────────────────────┐  │
│  │  Header: Upload CSV + Configuration Panel    │  │
│  ├──────────────────────────────────────────────┤  │
│  │  Preview: Data Table + Chart Preview         │  │
│  ├──────────────────────────────────────────────┤  │
│  │  Canvas: Animated Chart Racing               │  │
│  ├──────────────────────────────────────────────┤  │
│  │  Controls: Play/Pause/Stop/Export Video      │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘

JavaScript Modules:
├── app.js              (Main entry, orchestration)
├── dataHandler.js      (CSV parsing, validation, normalization)
├── chartEngine.js      (Chart.js wrapper, chart types)
├── animationEngine.js  (GSAP animations, timeline control)
├── videoExporter.js    (MediaRecorder, video export)
└── ui.js               (UI interactions, config panel)

CSS:
├── main.css            (Layout, responsive design)
└── themes.css          (Color palettes, light/dark themes)
```

### 2.2 Folder Structure

```
DataVisualization/
├── index.html                  # Main entry point
├── css/
│   ├── main.css               # Core styles
│   └── themes.css             # Palettes (vibrant, neon, gold, etc.)
├── js/
│   ├── app.js                 # Main orchestrator
│   ├── modules/
│   │   ├── dataHandler.js     # CSV → JSON transformation
│   │   ├── chartEngine.js     # Chart.js integration
│   │   ├── animationEngine.js # GSAP timeline management
│   │   ├── videoExporter.js   # Canvas → WebM export
│   │   └── ui.js              # UI state management
│   └── libs/                  # External libraries (optional, or use CDN)
│       ├── papaparse.min.js
│       ├── chart.min.js
│       └── gsap.min.js
├── examples/
│   └── sample.csv             # Demo data files
└── assets/
    └── icons/                 # UI icons
```

---

## 3. Feature Implementation Plan

### Phase 1: Core Features (MVP - Minimum Viable Product)

#### ✅ Must Have
1. **CSV Upload & Parsing**
   - Drag & drop upload
   - Auto-detect long/wide format
   - Data preview table

2. **Bar Chart Race (Default)**
   - Horizontal bar animation
   - Top 10 items display
   - Smooth transitions with GSAP

3. **Basic Configuration**
   - Title, subtitle
   - Period length (animation speed)
   - FPS (30/60)
   - Aspect ratio (16:9, 9:16)

4. **Video Export**
   - WebM format (browser native)
   - Download as file

#### ⚠️ Nice to Have (Later Phases)
- Line chart race
- Pie chart race
- Column chart race
- Combo mode
- 18 color palettes
- Stats panel overlay
- Progress bar
- Rank change indicators

### Phase 2: Advanced Features
- Style presets (TikTok, YouTube, Instagram)
- Watermark/branding
- Event annotations
- Growth rate display
- Background gradients

### Phase 3: Premium Features
- Excel file support (.xlsx)
- Multiple data sheets
- Real-time data streaming
- Export to MP4 (via server-side FFmpeg OR client-side WASM)

---

## 4. Technical Implementation Details

### 4.1 CSV Parsing (PapaParse)

```javascript
// dataHandler.js
import Papa from 'papaparse';

function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,              // First row as column names
      dynamicTyping: true,       // Auto-convert numbers
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data;
        const format = detectFormat(data);
        const normalized = normalizeData(data, format);
        resolve(normalized);
      },
      error: (error) => reject(error)
    });
  });
}

function detectFormat(data) {
  const columns = Object.keys(data[0]);
  const numericColumns = columns.filter(col =>
    typeof data[0][col] === 'number'
  );

  if (columns.length === 3 || numericColumns.length === 1) {
    return 'LONG'; // year, entity, value
  } else {
    return 'WIDE'; // year, entity1, entity2, entity3...
  }
}

function normalizeData(data, format) {
  if (format === 'LONG') {
    return pivotLongToWide(data);
  } else {
    return validateWideFormat(data);
  }
}
```

### 4.2 Chart Racing Animation (Chart.js + GSAP)

```javascript
// chartEngine.js
import Chart from 'chart.js/auto';
import { gsap } from 'gsap';

class BarChartRacer {
  constructor(canvasId, config) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.config = config; // title, fps, periodLength, topN
    this.currentFrame = 0;
  }

  initialize(data) {
    // data = { periods: [...], entities: [...], values: [[...]] }
    this.data = data;
    this.totalFrames = data.periods.length * this.config.fps * this.config.periodLength / 1000;

    // Create Chart.js instance
    this.chart = new Chart(this.ctx, {
      type: 'bar',
      data: {
        labels: [], // Will update dynamically
        datasets: [{
          label: 'Value',
          data: [],
          backgroundColor: this.generateColors()
        }]
      },
      options: {
        indexAxis: 'y', // Horizontal bars
        responsive: true,
        animation: false, // We control animation with GSAP
        plugins: {
          title: {
            display: true,
            text: this.config.title,
            font: { size: 32 }
          }
        }
      }
    });
  }

  animate() {
    const timeline = gsap.timeline({ paused: true });

    this.data.periods.forEach((period, index) => {
      timeline.to(this, {
        duration: this.config.periodLength / 1000,
        onUpdate: () => {
          this.updateChart(index);
        }
      });
    });

    return timeline; // Return for play/pause control
  }

  updateChart(periodIndex) {
    const currentData = this.data.values[periodIndex];
    const entities = this.data.entities;

    // Create array of [entity, value] pairs
    const pairs = entities.map((entity, i) => ({
      entity: entity,
      value: currentData[i]
    }));

    // Sort by value descending
    pairs.sort((a, b) => b.value - a.value);

    // Take top N
    const topN = pairs.slice(0, this.config.topN);

    // Update chart
    this.chart.data.labels = topN.map(p => p.entity);
    this.chart.data.datasets[0].data = topN.map(p => p.value);
    this.chart.update('none'); // Update without animation
  }

  generateColors() {
    // Use color palette from config
    const palette = PALETTES[this.config.palette] || PALETTES.vibrant;
    return palette;
  }
}
```

### 4.3 Video Export (MediaRecorder API)

```javascript
// videoExporter.js
class VideoExporter {
  constructor(canvas, fps = 30) {
    this.canvas = canvas;
    this.fps = fps;
    this.chunks = [];
  }

  startRecording() {
    const stream = this.canvas.captureStream(this.fps);
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 8000000 // 8 Mbps (high quality)
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      this.download();
    };

    this.mediaRecorder.start();
  }

  stopRecording() {
    this.mediaRecorder.stop();
  }

  download() {
    const blob = new Blob(this.chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chart-race.webm';
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

### 4.4 Main App Orchestration

```javascript
// app.js
class TimeSeriesRacingApp {
  constructor() {
    this.data = null;
    this.chartRacer = null;
    this.videoExporter = null;
    this.timeline = null;

    this.initUI();
  }

  initUI() {
    // File upload
    document.getElementById('fileInput').addEventListener('change', (e) => {
      this.handleFileUpload(e.target.files[0]);
    });

    // Play button
    document.getElementById('playBtn').addEventListener('click', () => {
      this.play();
    });

    // Export button
    document.getElementById('exportBtn').addEventListener('click', () => {
      this.export();
    });
  }

  async handleFileUpload(file) {
    try {
      // Parse CSV
      this.data = await parseCSV(file);

      // Show preview
      this.showDataPreview(this.data);

      // Initialize chart
      const config = this.getConfig();
      this.chartRacer = new BarChartRacer('chartCanvas', config);
      this.chartRacer.initialize(this.data);

      // Create animation timeline
      this.timeline = this.chartRacer.animate();

    } catch (error) {
      alert('Error parsing file: ' + error.message);
    }
  }

  play() {
    if (this.timeline) {
      this.timeline.play();
    }
  }

  export() {
    if (!this.timeline) return;

    // Start recording
    this.videoExporter = new VideoExporter(
      document.getElementById('chartCanvas'),
      this.config.fps
    );
    this.videoExporter.startRecording();

    // Play animation
    this.timeline.restart();

    // Stop recording when animation completes
    this.timeline.eventCallback('onComplete', () => {
      this.videoExporter.stopRecording();
    });
  }

  getConfig() {
    return {
      title: document.getElementById('titleInput').value || 'Data Evolution',
      topN: parseInt(document.getElementById('topNInput').value) || 10,
      fps: parseInt(document.getElementById('fpsInput').value) || 30,
      periodLength: parseInt(document.getElementById('periodLengthInput').value) || 1000,
      palette: document.getElementById('paletteSelect').value || 'vibrant'
    };
  }
}

// Initialize app
const app = new TimeSeriesRacingApp();
```

---

## 5. HTML Interface (MVP)

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TimeSeriesRacing - Web Edition</title>
  <link rel="stylesheet" href="css/main.css">
</head>
<body>
  <div class="container">
    <!-- Header -->
    <header>
      <h1>📊 TimeSeriesRacing - Web Edition</h1>
      <p>Create animated racing charts directly in your browser</p>
    </header>

    <!-- Upload Section -->
    <section class="upload-section">
      <div class="upload-box">
        <input type="file" id="fileInput" accept=".csv">
        <label for="fileInput">
          <span>📁 Upload CSV File</span>
          <small>Drag & drop or click to browse</small>
        </label>
      </div>
    </section>

    <!-- Configuration Panel -->
    <section class="config-panel">
      <h2>⚙️ Configuration</h2>
      <div class="config-grid">
        <div class="config-item">
          <label>Title:</label>
          <input type="text" id="titleInput" value="Data Evolution">
        </div>
        <div class="config-item">
          <label>Top N items:</label>
          <input type="number" id="topNInput" value="10" min="5" max="20">
        </div>
        <div class="config-item">
          <label>FPS:</label>
          <select id="fpsInput">
            <option value="30">30 fps</option>
            <option value="60">60 fps</option>
          </select>
        </div>
        <div class="config-item">
          <label>Animation Speed (ms):</label>
          <input type="number" id="periodLengthInput" value="1000" step="100">
        </div>
        <div class="config-item">
          <label>Color Palette:</label>
          <select id="paletteSelect">
            <option value="vibrant">Vibrant</option>
            <option value="professional">Professional</option>
            <option value="neon">Neon</option>
            <option value="gold">Gold</option>
            <option value="ocean">Ocean</option>
          </select>
        </div>
      </div>
    </section>

    <!-- Preview Section -->
    <section class="preview-section">
      <h2>👀 Data Preview</h2>
      <div id="dataPreview">
        <p class="placeholder">Upload a CSV file to see preview...</p>
      </div>
    </section>

    <!-- Chart Canvas -->
    <section class="chart-section">
      <h2>🎬 Chart Animation</h2>
      <canvas id="chartCanvas" width="1920" height="1080"></canvas>
    </section>

    <!-- Controls -->
    <section class="controls">
      <button id="playBtn" class="btn btn-primary">▶️ Play</button>
      <button id="pauseBtn" class="btn btn-secondary">⏸️ Pause</button>
      <button id="resetBtn" class="btn btn-secondary">⏮️ Reset</button>
      <button id="exportBtn" class="btn btn-success">💾 Export Video</button>
    </section>
  </div>

  <!-- Scripts -->
  <script src="https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.2/dist/gsap.min.js"></script>
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

---

## 6. Deployment Strategy

### Option 1: Static Hosting (Recommended - Easiest)

**Platforms:**
- **GitHub Pages** (Free, automatic deployment)
- **Netlify** (Free tier, drag & drop)
- **Vercel** (Free tier, automatic from Git)
- **Cloudflare Pages** (Free, fast CDN)

**Steps:**
1. Push code to GitHub repository
2. Enable GitHub Pages in settings
3. Access at: `https://username.github.io/repository-name`

**Pros:**
- 100% free
- No server management
- Automatic SSL/HTTPS
- Fast CDN delivery

**Cons:**
- No server-side processing (but we don't need it!)
- WebM video format only (no MP4 without server)

### Option 2: Self-Hosted (Full Control)

**Requirements:**
- Any web server (Apache, Nginx, IIS)
- Just serve static files

**Setup:**
```bash
# Copy files to web root
cp -r DataVisualization/* /var/www/html/

# No build process needed!
# Just serve the files
```

### Option 3: Hybrid (Static + Optional Backend)

If you want MP4 export later, add a simple Node.js backend:

```
Frontend (Static HTML/JS/CSS) → User interaction
    ↓ (WebM video file)
Backend (Node.js + FFmpeg) → Convert WebM → MP4
    ↓
Return MP4 file to user
```

---

## 7. Pros & Cons: Web vs Python Desktop

### Web-Based (HTML/JS/CSS)

**✅ Pros:**
1. **No installation required** - Run in any browser
2. **Cross-platform** - Windows, Mac, Linux, mobile
3. **Easy sharing** - Send URL to anyone
4. **Easy deployment** - GitHub Pages, Netlify (free)
5. **Real-time preview** - See results immediately
6. **No Python dependencies** - Just a browser
7. **Mobile-friendly** - Can work on tablets/phones
8. **Auto-updates** - Update code → everyone gets it

**❌ Cons:**
1. **WebM format only** - Need server for MP4 conversion
2. **Browser limitations** - Memory, canvas size limits
3. **Slower for huge datasets** - 10,000+ rows might lag
4. **No native file system** - Can't auto-save to folders
5. **Limited by JavaScript** - Not as powerful as Python for complex math

### Python Desktop (Current)

**✅ Pros:**
1. **Full control** - FFmpeg, MP4, any codec
2. **Powerful libraries** - pandas, numpy, matplotlib
3. **Batch processing** - Can run on 100+ files automatically
4. **No file size limits** - Process gigabytes of data
5. **Command-line automation** - Scriptable workflows

**❌ Cons:**
1. **Installation required** - Python, pip, FFmpeg, dependencies
2. **Platform-specific** - Different setup for Windows/Mac/Linux
3. **Not shareable** - Can't send to users easily
4. **No GUI** - Command-line only (intimidating for non-tech users)
5. **Manual updates** - Users must download new versions

---

## 8. Recommendation: Hybrid Approach

### Phase 1: Web MVP (This Project)
Create web-based version for:
- **Easy access**: Anyone can use via browser
- **Quick demos**: Share URL with clients/friends
- **Mobile usage**: View charts on phones
- **Prototyping**: Fast iteration on new features

### Phase 2: Keep Python CLI for Power Users
Maintain Python version for:
- **Batch processing**: Automate 100s of files
- **High-quality MP4**: FFmpeg encoding
- **Large datasets**: 10,000+ rows
- **Server-side rendering**: Generate videos on server

### Integration:
```
Web UI (DataVisualization)
    ↓
User uploads CSV + configures
    ↓
Option A: Generate in browser (WebM, quick preview)
Option B: Send to server → Python CLI → Return MP4
    ↓
User downloads video
```

---

## 9. Next Steps

### Immediate (Sprint 1 - This Week)
1. ✅ Create basic HTML interface
2. ✅ Implement CSV upload + parsing
3. ✅ Create simple bar chart race animation
4. ✅ Add play/pause controls

### Short-term (Sprint 2 - Next Week)
1. Add video export (WebM)
2. Implement color palettes
3. Add configuration panel
4. Test with sample datasets

### Medium-term (Sprint 3-4)
1. Add line chart, pie chart, column chart
2. Implement combo mode
3. Add stats panel, progress bar
4. Style presets (TikTok, YouTube)

### Long-term (Future)
1. Excel file support
2. Server-side MP4 conversion
3. Real-time data streaming
4. Mobile app (React Native / PWA)

---

## 10. Estimated Effort

| Task | Time | Complexity |
|------|------|------------|
| Basic HTML/CSS layout | 2 hours | Easy |
| CSV parsing integration | 3 hours | Medium |
| Bar chart racing animation | 8 hours | Hard |
| Video export (WebM) | 4 hours | Medium |
| Configuration UI | 3 hours | Easy |
| Color palettes | 2 hours | Easy |
| Testing + bug fixes | 4 hours | Medium |
| **Total MVP** | **~26 hours** | **~3-4 days** |

---

## 11. Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 90+ | ✅ Full | Best performance |
| Firefox 88+ | ✅ Full | Good performance |
| Safari 14+ | ⚠️ Partial | WebM export might not work (needs WebKit MediaRecorder polyfill) |
| Edge 90+ | ✅ Full | Chromium-based |
| Mobile Chrome | ✅ Full | Works on Android |
| Mobile Safari | ⚠️ Partial | iOS limitations on MediaRecorder |

**Fallback for Safari/iOS:**
- Use canvas.toBlob() → Save frames as images
- Or use server-side conversion

---

## Conclusion

Chuyển TimeSeriesRacing sang web-based với HTML/JS/CSS là **hoàn toàn khả thi** và **dễ deploy**.

**Recommended stack:**
- PapaParse (CSV)
- Chart.js (Charts)
- GSAP (Animation)
- MediaRecorder (Video export)

**Deployment:** GitHub Pages (free, automatic)

**Timeline:** 3-4 days for MVP, 2-3 weeks for full feature parity

Bắt đầu với bar chart race MVP, sau đó mở rộng thêm các tính năng khác.
