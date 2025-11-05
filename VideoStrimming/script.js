const ffmpegLib = window.FFmpeg;

if (!ffmpegLib) {
  throw new Error('Không thể tải thư viện ffmpeg.wasm. Vui lòng kiểm tra kết nối mạng.');
}

const { createFFmpeg, fetchFile } = ffmpegLib;

const videoInput = document.getElementById('video-input');
const processBtn = document.getElementById('process-btn');
const statusEl = document.getElementById('status');
const originalVideo = document.getElementById('original-video');
const trimmedVideo = document.getElementById('trimmed-video');
const downloadLink = document.getElementById('download-link');
const fileLabel = document.getElementById('file-label');

const ffmpeg = createFFmpeg({
  log: true,
  corePath: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js',
});

let isLoaded = false;
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

async function ensureFFmpegLoaded() {
  if (isLoaded) return;
  setStatus('Đang tải ffmpeg.wasm (lần đầu tiên có thể mất vài giây)...');
  await ffmpeg.load();
  isLoaded = true;
}

async function runWithLogs(scope, args) {
  logCapture.scope = scope;
  logCapture.buffer = [];
  try {
    await ffmpeg.exec(args);
    return [...logCapture.buffer];
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
  if (!selectedFile) return;
  try {
    resetOutputs();
    await ensureFFmpegLoaded();
    setStatus('Đang tải video vào bộ nhớ...');
    await ffmpeg.writeFile('input.mp4', await fetchFile(selectedFile));

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

processBtn.addEventListener('click', () => {
  if (processBtn.disabled) return;
  processBtn.disabled = true;
  setStatus('Đang chuẩn bị xử lý...');
  handleProcess().finally(() => {
    processBtn.disabled = false;
  });
});
