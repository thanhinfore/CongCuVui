import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const videoInput = document.getElementById('video-input');
const processBtn = document.getElementById('process-btn');
const statusEl = document.getElementById('status');
const originalVideo = document.getElementById('original-video');
const trimmedVideo = document.getElementById('trimmed-video');
const downloadLink = document.getElementById('download-link');
const fileLabel = document.getElementById('file-label');

const ffmpeg = new FFmpeg();

let isLoaded = false;
let isProcessing = false;
let selectedFile;
let videoDuration = 0;
const logCapture = {
  scope: '',
  buffer: [],
};

const marginSeconds = 0.5;
const silenceThreshold = '-35dB';
const minSilenceDuration = 0.5;

function setStatus(message, append = false) {
  statusEl.textContent = append ? `${statusEl.textContent}\n${message}`.trim() : message;
}

function resetOutputs() {
  trimmedVideo.src = '';
  trimmedVideo.removeAttribute('src');
  downloadLink.classList.remove('active');
  downloadLink.removeAttribute('href');
}

function parseDurationFromLogs(logs) {
  const durationLine = logs.find((line) => line.includes('Duration: '));
  if (!durationLine) return 0;
  const match = durationLine.match(/Duration: (\d\d):(\d\d):(\d\d\.\d+)/);
  if (!match) return 0;
  const [hours, minutes, seconds] = match.slice(1).map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

function parseSilenceSegments(logs) {
  const silenceStarts = [];
  const silenceEnds = [];

  logs.forEach((line) => {
    const startMatch = line.match(/silence_start: ([0-9.]+)/);
    if (startMatch) {
      silenceStarts.push(parseFloat(startMatch[1]));
      return;
    }
    const endMatch = line.match(/silence_end: ([0-9.]+)/);
    if (endMatch) {
      silenceEnds.push(parseFloat(endMatch[1]));
    }
  });

  const intervals = [];
  const count = Math.max(silenceStarts.length, silenceEnds.length);
  for (let i = 0; i < count; i += 1) {
    const start = silenceStarts[i] ?? (i === 0 ? 0 : silenceEnds[i - 1]);
    const end = silenceEnds[i] ?? videoDuration;
    if (end > start) {
      intervals.push({ start, end });
    }
  }
  return intervals;
}

function deriveKeepSegments(silenceIntervals) {
  const segments = [];
  let currentStart = 0;

  if (!silenceIntervals.length) {
    if (videoDuration > 0) {
      segments.push({ start: 0, end: videoDuration });
    }
    return segments;
  }

  silenceIntervals.forEach(({ start, end }) => {
    const keepEnd = Math.max(0, start - marginSeconds);
    if (keepEnd > currentStart) {
      segments.push({ start: currentStart, end: keepEnd });
    }
    currentStart = Math.min(videoDuration, end + marginSeconds);
  });

  if (currentStart < videoDuration) {
    segments.push({ start: currentStart, end: videoDuration });
  }

  return segments.filter(({ end, start }) => end - start > 0.05);
}

ffmpeg.on('log', ({ message }) => {
  if (logCapture.scope) {
    logCapture.buffer.push(message);
  }
});

async function loadWithTimeout(promise, timeoutMs, errorMsg) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(errorMsg)), timeoutMs)
    )
  ]);
}

async function ensureFFmpegLoaded() {
  if (isLoaded) return;

  // Luôn thử load từ local trước với timeout dài
  setStatus('Đang tải ffmpeg.wasm từ local... (có thể mất vài giây)');
  try {
    const localBaseURL = './lib/@ffmpeg/core';
    await loadWithTimeout(
      (async () => {
        const coreURL = await toBlobURL(`${localBaseURL}/ffmpeg-core.js`, 'text/javascript');
        const wasmURL = await toBlobURL(`${localBaseURL}/ffmpeg-core.wasm`, 'application/wasm');
        const workerURL = await toBlobURL(`${localBaseURL}/ffmpeg-core.worker.js`, 'text/javascript');
        await ffmpeg.load({ coreURL, wasmURL, workerURL });
      })(),
      30000,  // 30 giây cho file wasm lớn
      'Local load timeout - file wasm quá lớn hoặc không tồn tại'
    );
    isLoaded = true;
    setStatus('✓ Đã tải xong ffmpeg.wasm từ local');
    return;
  } catch (localError) {
    console.warn('Không thể load từ local, chuyển sang CDN...', localError);
    setStatus('Đang tải ffmpeg.wasm từ CDN... (có thể mất vài giây)');
  }

  // Load từ CDN (sử dụng jsDelivr vì hỗ trợ CORS tốt hơn)
  try {
    const cdnBaseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${cdnBaseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${cdnBaseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      workerURL: await toBlobURL(`${cdnBaseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
    });
    isLoaded = true;
    setStatus('✓ Đã tải xong ffmpeg.wasm từ CDN');
  } catch (error) {
    console.error('Failed to load FFmpeg:', error);
    throw new Error('Không thể tải ffmpeg.wasm. Vui lòng kiểm tra kết nối internet hoặc chạy download-ffmpeg-local.sh để tải về local.');
  }
}

async function runWithLogs(scope, args) {
  logCapture.scope = scope;
  logCapture.buffer = [];
  try {
    const result = await ffmpeg.exec(args);
    if (result !== 0) {
      console.warn(`FFmpeg exited with code ${result}`);
    }
    return [...logCapture.buffer];
  } catch (error) {
    console.error('FFmpeg execution error:', error);
    throw error;
  } finally {
    logCapture.scope = '';
    logCapture.buffer = [];
  }
}

async function getVideoDuration() {
  const logs = await runWithLogs('duration', ['-i', 'input.mp4']);
  return parseDurationFromLogs(logs);
}

async function detectSilence() {
  return runWithLogs('detect', [
    '-i',
    'input.mp4',
    '-af',
    `silencedetect=noise=${silenceThreshold}:d=${minSilenceDuration}`,
    '-f',
    'null',
    '-'
  ]);
}

async function trimVideo(segments) {
  if (!segments.length) {
    await ffmpeg.exec(['-i', 'input.mp4', '-c', 'copy', 'output.mp4']);
    return;
  }

  const filterParts = [];
  const concatInputs = [];

  segments.forEach((segment, index) => {
    const start = segment.start.toFixed(3);
    const end = segment.end.toFixed(3);
    filterParts.push(`[0:v]trim=start=${start}:end=${end},setpts=PTS-STARTPTS[v${index}]`);
    filterParts.push(`[0:a]atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS[a${index}]`);
    concatInputs.push(`[v${index}][a${index}]`);
  });

  filterParts.push(`${concatInputs.join('')}concat=n=${segments.length}:v=1:a=1[outv][outa]`);

  await ffmpeg.exec([
    '-i',
    'input.mp4',
    '-filter_complex',
    filterParts.join(';'),
    '-map',
    '[outv]',
    '-map',
    '[outa]',
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '23',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    'output.mp4'
  ]);
}

async function handleProcess() {
  if (!selectedFile || isProcessing) return;

  isProcessing = true;
  try {
    resetOutputs();
    await ensureFFmpegLoaded();
    setStatus('Đang tải video vào bộ nhớ...');

    const fileData = await fetchFile(selectedFile);
    await ffmpeg.writeFile('input.mp4', fileData);

    setStatus('Đang đọc thông tin video...');
    videoDuration = await getVideoDuration();
    if (!videoDuration) {
      throw new Error('Không thể xác định thời lượng video.');
    }

    setStatus('Đang phân tích khoảng lặng...');
    const detectionLogs = await detectSilence();
    const silenceIntervals = parseSilenceSegments(detectionLogs);
    const keepSegments = deriveKeepSegments(silenceIntervals);

    if (!keepSegments.length) {
      setStatus('Không tìm thấy đoạn có tiếng. Video sẽ được giữ nguyên.');
    } else {
      const totalRemoved = silenceIntervals.reduce((acc, { start, end }) => acc + Math.max(0, end - start), 0);
      setStatus(
        `Tìm thấy ${keepSegments.length} đoạn có tiếng. Bắt đầu cắt và ghép...\nĐã bỏ qua tổng cộng ${totalRemoved.toFixed(1)} giây khoảng lặng.`
      );
    }

    await trimVideo(keepSegments);

    setStatus('Hoàn tất! Đang tạo video kết quả...');
    const data = await ffmpeg.readFile('output.mp4');
    const trimmedBlob = new Blob([data.buffer], { type: 'video/mp4' });
    const trimmedUrl = URL.createObjectURL(trimmedBlob);
    trimmedVideo.src = trimmedUrl;
    downloadLink.href = trimmedUrl;
    downloadLink.classList.add('active');

    setStatus('Đã hoàn thành việc loại bỏ khoảng lặng.');
  } catch (error) {
    console.error(error);
    setStatus(`Có lỗi xảy ra: ${error.message}`);
  } finally {
    isProcessing = false;
  }
}

videoInput.addEventListener('change', (event) => {
  resetOutputs();
  const [file] = event.target.files;
  selectedFile = file;
  if (!file) {
    processBtn.disabled = true;
    fileLabel.textContent = 'Chọn tệp MP4';
    originalVideo.removeAttribute('src');
    return;
  }

  if (file.type !== 'video/mp4') {
    setStatus('Vui lòng chọn tệp MP4 hợp lệ.');
    processBtn.disabled = true;
    fileLabel.textContent = 'Chọn tệp MP4';
    return;
  }

  const url = URL.createObjectURL(file);
  originalVideo.src = url;
  fileLabel.textContent = `${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`;
  processBtn.disabled = false;
  setStatus('Sẵn sàng xử lý. Nhấn "Bắt đầu xử lý" để loại bỏ khoảng lặng.');
});

processBtn.addEventListener('click', async () => {
  if (processBtn.disabled || isProcessing) return;
  processBtn.disabled = true;
  setStatus('Đang chuẩn bị xử lý...');
  try {
    await handleProcess();
  } finally {
    processBtn.disabled = false;
  }
});
