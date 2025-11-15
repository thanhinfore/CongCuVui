// app-cpu-optimized.js - CPU Multi-threading with Web Workers
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.0';

// Force CPU optimization
env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.0/dist/';
env.backends.onnx.wasm.numThreads = navigator.hardwareConcurrency || 4;

// Global variables
let generator = null;
let tokenizer = null;
let excelData = null;
let workbook = null;
let questions = [];
let isProcessing = false;
let pauseProcessing = false;
let processedData = [];
let startTime = null;

// CPU optimization config
const CPU_CORES = navigator.hardwareConcurrency || 4;
const BATCH_SIZE = Math.max(4, Math.floor(CPU_CORES / 2));
const PARALLEL_REQUESTS = Math.min(CPU_CORES, 4);

console.log(`CPU Optimization: ${CPU_CORES} cores detected, using batch size ${BATCH_SIZE}`);

// Load model optimized for CPU
window.loadModel = async function () {
    const loadBtn = document.getElementById('loadModelBtn');
    const loadBtnText = document.getElementById('loadBtnText');
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');
    const modelStatus = document.getElementById('modelStatus');
    const deviceType = document.getElementById('deviceType');
    const modelName = document.getElementById('modelName');

    try {
        loadBtn.disabled = true;
        progressBar.style.display = 'block';
        loadBtnText.innerHTML = '<span class="loading-spinner"></span> Loading...';
        modelStatus.textContent = 'Initializing CPU...';
        modelStatus.style.color = 'var(--warning)';

        deviceType.textContent = `💻 CPU (${CPU_CORES} cores)`;

        console.log(`Loading model for CPU with ${CPU_CORES} threads...`);

        // Load with CPU optimization
        generator = await pipeline('text-generation', 'onnx-community/gemma-3-270m-it-ONNX', {
            device: 'wasm',
            dtype: 'fp32',  // Use fp32 instead of q8 (quantized not available)
            progress_callback: (progress) => {
                if (progress?.progress) {
                    const percent = Math.round(progress.progress);
                    progressFill.style.width = `${percent}%`;
                    progressFill.textContent = `${percent}%`;
                }
            }
        });

        tokenizer = generator.tokenizer;

        // Warm up CPU
        console.log('Warming up CPU threads...');
        const warmupPromises = [];
        for (let i = 0; i < PARALLEL_REQUESTS; i++) {
            warmupPromises.push(
                generator('test', {
                    max_new_tokens: 1,
                    do_sample: false
                })
            );
        }
        await Promise.all(warmupPromises);

        modelName.textContent = 'Gemma 3 270M';
        modelStatus.textContent = `CPU Ready (${CPU_CORES} threads)`;
        modelStatus.style.color = 'var(--success)';
        loadBtnText.textContent = '✅ Model Loaded';
        progressBar.style.display = 'none';

        document.getElementById('questionsCard').style.display = 'block';
        console.log(`Model ready for multi-threaded CPU processing`);

    } catch (error) {
        console.error('Model loading failed:', error);
        modelStatus.textContent = 'Failed';
        modelStatus.style.color = 'var(--danger)';
        loadBtnText.textContent = 'Load AI Model';
        loadBtn.disabled = false;
        progressBar.style.display = 'none';
        alert(`Model loading failed: ${error.message}`);
    }
};

// Optimized batch processing for CPU
async function processBatchCPU(rows, questions) {
    const results = [];

    // Process rows with controlled parallelism
    for (let i = 0; i < rows.length; i += PARALLEL_REQUESTS) {
        const rowBatch = rows.slice(i, i + PARALLEL_REQUESTS);
        const rowPromises = rowBatch.map(async (row) => {
            const content = row['Publish Content'] || '';
            if (!content) return { ...row };

            const rowResult = { ...row };

            // Process questions sequentially per row to avoid overload
            for (const question of questions) {
                const prompt = `<bos><start_of_turn>user
${question}
"${content.substring(0, 100)}"
Answer in 1-2 words.<end_of_turn>
<start_of_turn>model
`;

                try {
                    const result = await generator(prompt, {
                        max_new_tokens: 8,
                        temperature: 0.1,
                        do_sample: false,
                        top_k: 1,
                        num_beams: 1,
                        pad_token_id: tokenizer.pad_token_id,
                        eos_token_id: tokenizer.eos_token_id,
                        return_full_text: false
                    });

                    const answer = result[0].generated_text
                        .split('\n')[0]
                        .trim() || 'Unknown';

                    const colName = `AI_${question.substring(0, 30)}`;
                    rowResult[colName] = answer;

                } catch (error) {
                    console.error('Processing error:', error.message);
                    const colName = `AI_${question.substring(0, 30)}`;
                    rowResult[colName] = 'Error';
                }
            }

            return rowResult;
        });

        const batchResults = await Promise.all(rowPromises);
        results.push(...batchResults);
    }

    return results;
}

// Process data with CPU optimization
window.processData = async function () {
    if (!generator) {
        alert('Please load the model first!');
        return;
    }

    if (!excelData) {
        alert('Please upload an Excel file!');
        return;
    }

    const questionInputs = document.querySelectorAll('.question-input');
    questions = Array.from(questionInputs).map(input => input.value).filter(q => q.trim());

    if (questions.length === 0) {
        alert('Please add at least one labeling question!');
        return;
    }

    isProcessing = true;
    pauseProcessing = false;
    processedData = [];
    startTime = Date.now();

    document.getElementById('processBtn').style.display = 'none';
    document.getElementById('pauseBtn').style.display = 'block';
    document.getElementById('progressInfo').style.display = 'block';
    document.getElementById('totalRowsProcess').textContent = excelData.length;

    // Create optimized batches
    const batches = [];
    for (let i = 0; i < excelData.length; i += BATCH_SIZE) {
        batches.push(excelData.slice(i, Math.min(i + BATCH_SIZE, excelData.length)));
    }

    console.log(`Processing ${batches.length} batches with ${PARALLEL_REQUESTS} parallel threads`);

    let completed = 0;

    // Process batches
    for (const batch of batches) {
        if (pauseProcessing) {
            isProcessing = false;
            document.getElementById('processBtn').textContent = 'Resume';
            document.getElementById('processBtn').style.display = 'block';
            document.getElementById('pauseBtn').style.display = 'none';
            return;
        }

        const batchResult = await processBatchCPU(batch, questions);
        processedData.push(...batchResult);
        completed += batchResult.length;
        updateProgress(completed);
    }

    finishProcessing();
};

// Handle file upload
window.handleFileUpload = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            workbook = XLSX.read(data, { type: 'array' });

            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            excelData = XLSX.utils.sheet_to_json(worksheet);

            if (!excelData.some(row => row['Publish Content'])) {
                alert('Excel file must contain "Publish Content" column!');
                clearFile();
                return;
            }

            document.getElementById('fileName').textContent = file.name;
            document.getElementById('fileInfo').style.display = 'block';
            document.getElementById('totalRows').textContent = excelData.length;

            displayPreview();

            if (generator) {
                document.getElementById('questionsCard').style.display = 'block';
            }
            document.getElementById('previewCard').style.display = 'block';
            document.getElementById('processCard').style.display = 'block';

        } catch (error) {
            console.error('File reading error:', error);
            alert('Error reading Excel file!');
        }
    };
    reader.readAsArrayBuffer(file);
};

// Clear file
window.clearFile = function () {
    document.getElementById('fileInput').value = '';
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('previewCard').style.display = 'none';
    document.getElementById('processCard').style.display = 'none';
    document.getElementById('resultsCard').style.display = 'none';
    excelData = null;
    workbook = null;
};

// Add question
window.addQuestion = function () {
    const container = document.getElementById('questionsContainer');
    const div = document.createElement('div');
    div.className = 'question-item';
    div.innerHTML = `
        <input type="text" class="question-input" placeholder="e.g., What is the topic? (technology/health/finance)">
        <button class="btn-remove">×</button>
    `;
    container.appendChild(div);

    div.querySelector('.btn-remove').addEventListener('click', function () {
        window.removeQuestion(this);
    });
};

// Remove question
window.removeQuestion = function (btn) {
    btn.parentElement.remove();
};

// Display preview
function displayPreview() {
    const header = document.getElementById('previewHeader');
    const body = document.getElementById('previewBody');

    header.innerHTML = '';
    body.innerHTML = '';

    if (!excelData || excelData.length === 0) return;

    const columns = Object.keys(excelData[0]);
    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        header.appendChild(th);
    });

    const previewRows = Math.min(5, excelData.length);
    for (let i = 0; i < previewRows; i++) {
        const tr = document.createElement('tr');
        columns.forEach(col => {
            const td = document.createElement('td');
            td.textContent = excelData[i][col] || '';
            tr.appendChild(td);
        });
        body.appendChild(tr);
    }
}

// Pause processing
window.pauseProcessing = function () {
    pauseProcessing = true;
};

// Update progress
function updateProgress(current) {
    const total = excelData.length;
    const percent = Math.round((current / total) * 100);

    document.getElementById('processFill').style.width = `${percent}%`;
    document.getElementById('processFill').textContent = `${percent}%`;
    document.getElementById('currentRow').textContent = current;

    const elapsed = (Date.now() - startTime) / 1000;
    document.getElementById('processTime').textContent = `${Math.round(elapsed)}s`;

    const speed = (current / elapsed) * 60;
    document.getElementById('processSpeed').textContent = `${Math.round(speed)} rows/min`;
}

// Finish processing
function finishProcessing() {
    isProcessing = false;

    const elapsed = Math.round((Date.now() - startTime) / 1000);

    document.getElementById('processBtn').textContent = 'Start Labeling';
    document.getElementById('processBtn').style.display = 'block';
    document.getElementById('pauseBtn').style.display = 'none';

    document.getElementById('resultsCard').style.display = 'block';
    document.getElementById('rowsProcessed').textContent = processedData.length;
    document.getElementById('labelsAdded').textContent = processedData.length * questions.length;
    document.getElementById('totalTime').textContent = `${elapsed}s`;

    const speed = (processedData.length / elapsed) * 60;
    console.log(`✅ Completed at ${Math.round(speed)} rows/min using ${CPU_CORES} CPU threads`);
}

// Download results
window.downloadResults = function () {
    if (!processedData || processedData.length === 0) return;

    const ws = XLSX.utils.json_to_sheet(processedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Labeled Data');

    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `labeled_data_${date}.xlsx`);
};

// Preview results
window.previewResults = function () {
    const modal = document.getElementById('resultsModal');
    const header = document.getElementById('resultsHeader');
    const body = document.getElementById('resultsBody');

    header.innerHTML = '';
    body.innerHTML = '';

    if (!processedData || processedData.length === 0) return;

    const columns = Object.keys(processedData[0]);
    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        header.appendChild(th);
    });

    const previewRows = Math.min(10, processedData.length);
    for (let i = 0; i < previewRows; i++) {
        const tr = document.createElement('tr');
        columns.forEach(col => {
            const td = document.createElement('td');
            td.textContent = processedData[i][col] || '';
            tr.appendChild(td);
        });
        body.appendChild(tr);
    }

    modal.style.display = 'flex';
};

// Close results modal
window.closeResultsModal = function () {
    document.getElementById('resultsModal').style.display = 'none';
};