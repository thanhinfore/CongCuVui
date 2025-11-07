(function () {
    const fileInput = document.getElementById('ImageUpload');
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    const cropInfo = document.getElementById('cropInfo');
    const resetButton = document.getElementById('resetCropButton');

    const hiddenFields = {
        x: document.getElementById('cropX'),
        y: document.getElementById('cropY'),
        width: document.getElementById('cropWidth'),
        height: document.getElementById('cropHeight'),
        imageWidth: document.getElementById('imageWidth'),
        imageHeight: document.getElementById('imageHeight')
    };

    const intensityRange = document.getElementById('intensityRange');
    const intensityLabel = document.getElementById('intensityLabel');
    const highlightRange = document.getElementById('highlightRange');
    const highlightLabel = document.getElementById('highlightLabel');
    const colorPicker = document.getElementById('colorPicker');
    const protectHighlightsToggle = document.getElementById('protectHighlights');

    let image = null;
    let scale = 1;
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let cropRect = null;

    function updateIntensityLabel() {
        if (intensityLabel && intensityRange) {
            intensityLabel.textContent = `${intensityRange.value}%`;
        }
    }

    function updateHighlightLabel() {
        if (highlightLabel && highlightRange) {
            highlightLabel.textContent = `${highlightRange.value}%`;
        }
    }

    function clamp01(value) {
        if (value < 0) {
            return 0;
        }
        if (value > 1) {
            return 1;
        }
        return value;
    }

    function hexToRgb(hex) {
        if (!hex) {
            return null;
        }
        let normalized = hex.trim();
        if (normalized[0] === '#') {
            normalized = normalized.substring(1);
        }
        if (normalized.length === 3) {
            normalized = normalized.split('').map(function (ch) { return ch + ch; }).join('');
        }
        if (normalized.length !== 6) {
            return null;
        }
        const r = parseInt(normalized.substring(0, 2), 16);
        const g = parseInt(normalized.substring(2, 4), 16);
        const b = parseInt(normalized.substring(4, 6), 16);
        if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
            return null;
        }
        return { r: r, g: g, b: b };
    }

    function rgbToHsl(r, g, b) {
        const rNorm = r / 255;
        const gNorm = g / 255;
        const bNorm = b / 255;

        const max = Math.max(rNorm, gNorm, bNorm);
        const min = Math.min(rNorm, gNorm, bNorm);
        const delta = max - min;

        let h = 0;
        if (delta !== 0) {
            if (max === rNorm) {
                h = ((gNorm - bNorm) / delta) % 6;
            } else if (max === gNorm) {
                h = (bNorm - rNorm) / delta + 2;
            } else {
                h = (rNorm - gNorm) / delta + 4;
            }
            h /= 6;
            if (h < 0) {
                h += 1;
            }
        }

        const l = (max + min) / 2;
        let s = 0;
        if (delta !== 0) {
            s = delta / (1 - Math.abs(2 * l - 1));
        }

        return { h: h, s: s, l: l };
    }

    function hueToRgb(p, q, t) {
        if (t < 0) {
            t += 1;
        }
        if (t > 1) {
            t -= 1;
        }
        if (t < 1 / 6) {
            return p + (q - p) * 6 * t;
        }
        if (t < 1 / 2) {
            return q;
        }
        if (t < 2 / 3) {
            return p + (q - p) * (2 / 3 - t) * 6;
        }
        return p;
    }

    function hslToRgb(h, s, l) {
        let r;
        let g;
        let b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hueToRgb(p, q, h + 1 / 3);
            g = hueToRgb(p, q, h);
            b = hueToRgb(p, q, h - 1 / 3);
        }

        return {
            r: Math.round(clamp01(r) * 255),
            g: Math.round(clamp01(g) * 255),
            b: Math.round(clamp01(b) * 255)
        };
    }

    function applyTintPreview() {
        if (!image || !canvas) {
            return;
        }

        const overlayColor = colorPicker ? hexToRgb(colorPicker.value) : null;
        const opacity = intensityRange ? parseInt(intensityRange.value || '0', 10) / 100 : 0;

        if (!overlayColor || !opacity) {
            return;
        }

        const shouldProtectHighlights = protectHighlightsToggle ? protectHighlightsToggle.checked : false;
        const highlightValue = highlightRange ? parseInt(highlightRange.value || '0', 10) : 0;
        const thresholdNormalized = clamp01(highlightValue / 100);
        const protect = shouldProtectHighlights && highlightValue > 0;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        const overlayHsl = rgbToHsl(overlayColor.r, overlayColor.g, overlayColor.b);

        for (let i = 0; i < pixels.length; i += 4) {
            const alpha = pixels[i + 3];
            if (alpha === 0) {
                continue;
            }

            const red = pixels[i];
            const green = pixels[i + 1];
            const blue = pixels[i + 2];
            const brightness = Math.max(red, Math.max(green, blue)) / 255;

            if (protect && brightness >= thresholdNormalized) {
                continue;
            }

            const originalHsl = rgbToHsl(red, green, blue);
            let newHue, newSaturation, newLuminance;

            // Xử lý đặc biệt cho pixel tối (đen/xám đen) để chuyển màu hiệu quả
            if (originalHsl.l < 0.2) {
                // Pixel rất tối: thay thế hoàn toàn màu sắc
                newHue = overlayHsl.h;
                newSaturation = overlayHsl.s * opacity;
                // Giữ độ sáng gốc nhưng có thể tăng thêm một chút
                newLuminance = clamp01(originalHsl.l + overlayHsl.l * opacity * 0.5);
            } else if (originalHsl.l < 0.5) {
                // Pixel tối-trung bình: blend mạnh
                newHue = overlayHsl.h;
                newSaturation = clamp01(originalHsl.s + (overlayHsl.s - originalHsl.s) * opacity);
                newLuminance = clamp01(originalHsl.l + (overlayHsl.l - originalHsl.l) * opacity * 0.7);
            } else {
                // Pixel sáng: blend nhẹ
                newHue = overlayHsl.h;
                newSaturation = clamp01(originalHsl.s + (overlayHsl.s - originalHsl.s) * opacity * 0.6);
                newLuminance = clamp01(originalHsl.l + (overlayHsl.l - originalHsl.l) * opacity * 0.4);
            }

            const tinted = hslToRgb(newHue, newSaturation, newLuminance);

            pixels[i] = tinted.r;
            pixels[i + 1] = tinted.g;
            pixels[i + 2] = tinted.b;
        }

        ctx.putImageData(imageData, 0, 0);
    }

    function resetHiddenFields() {
        hiddenFields.x.value = '0';
        hiddenFields.y.value = '0';
        hiddenFields.width.value = '0';
        hiddenFields.height.value = '0';
        cropRect = null;
        updateCropInfo();
    }

    function updateCropInfo() {
        if (!image) {
            cropInfo.textContent = 'Vùng crop: chưa có ảnh';
            return;
        }

        if (!cropRect) {
            cropInfo.textContent = 'Vùng crop: toàn bộ ảnh';
        } else {
            cropInfo.textContent = `Vùng crop: x=${Math.round(cropRect.x)}, y=${Math.round(cropRect.y)}, w=${Math.round(cropRect.width)}, h=${Math.round(cropRect.height)}`;
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!image) {
            return;
        }

        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        applyTintPreview();

        if (cropRect) {
            const displayRect = {
                x: cropRect.x / scale,
                y: cropRect.y / scale,
                width: cropRect.width / scale,
                height: cropRect.height / scale
            };

            ctx.save();
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.strokeRect(displayRect.x, displayRect.y, displayRect.width, displayRect.height);
            ctx.restore();
        }
    }

    function fitCanvasToImage() {
        if (!image) {
            return;
        }

        const maxWidth = 500;
        const maxHeight = 400;
        scale = Math.max(image.width / maxWidth, image.height / maxHeight, 1);
        canvas.width = Math.round(image.width / scale);
        canvas.height = Math.round(image.height / scale);
        hiddenFields.imageWidth.value = image.width;
        hiddenFields.imageHeight.value = image.height;
    }

    function setFullCrop() {
        if (!image) {
            resetHiddenFields();
            draw();
            return;
        }

        cropRect = {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height
        };

        hiddenFields.x.value = '0';
        hiddenFields.y.value = '0';
        hiddenFields.width.value = String(image.width);
        hiddenFields.height.value = String(image.height);
        updateCropInfo();
        draw();
    }

    function updateHiddenFieldsFromCrop() {
        if (!cropRect) {
            resetHiddenFields();
            return;
        }

        hiddenFields.x.value = String(Math.max(0, Math.round(cropRect.x)));
        hiddenFields.y.value = String(Math.max(0, Math.round(cropRect.y)));
        hiddenFields.width.value = String(Math.max(1, Math.round(cropRect.width)));
        hiddenFields.height.value = String(Math.max(1, Math.round(cropRect.height)));
        updateCropInfo();
    }

    function handleFileSelection(evt) {
        const file = evt.target.files && evt.target.files[0];
        if (!file) {
            image = null;
            resetHiddenFields();
            draw();
            return;
        }

        const reader = new FileReader();
        reader.onload = function (loadEvt) {
            image = new Image();
            image.onload = function () {
                fitCanvasToImage();
                setFullCrop();
            };
            image.src = loadEvt.target.result;
        };
        reader.readAsDataURL(file);
    }

    function getMousePosition(evt) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    function startDrag(evt) {
        if (!image) {
            return;
        }
        isDragging = true;
        dragStart = getMousePosition(evt);
        cropRect = {
            x: dragStart.x * scale,
            y: dragStart.y * scale,
            width: 0,
            height: 0
        };
    }

    function duringDrag(evt) {
        if (!isDragging || !image) {
            return;
        }

        const currentPos = getMousePosition(evt);
        const x1 = dragStart.x;
        const y1 = dragStart.y;
        const x2 = Math.max(0, Math.min(canvas.width, currentPos.x));
        const y2 = Math.max(0, Math.min(canvas.height, currentPos.y));

        const left = Math.min(x1, x2) * scale;
        const top = Math.min(y1, y2) * scale;
        const right = Math.max(x1, x2) * scale;
        const bottom = Math.max(y1, y2) * scale;

        cropRect = {
            x: left,
            y: top,
            width: Math.max(1, right - left),
            height: Math.max(1, bottom - top)
        };

        draw();
        updateHiddenFieldsFromCrop();
    }

    function endDrag() {
        if (!isDragging) {
            return;
        }
        isDragging = false;
        if (cropRect) {
            cropRect.x = Math.max(0, Math.min(cropRect.x, image.width - 1));
            cropRect.y = Math.max(0, Math.min(cropRect.y, image.height - 1));
            cropRect.width = Math.min(cropRect.width, image.width - cropRect.x);
            cropRect.height = Math.min(cropRect.height, image.height - cropRect.y);
            updateHiddenFieldsFromCrop();
            draw();
        }
    }

    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelection);
    }

    if (resetButton) {
        resetButton.addEventListener('click', function () {
            setFullCrop();
        });
    }

    if (canvas) {
        canvas.addEventListener('mousedown', startDrag);
        canvas.addEventListener('mousemove', duringDrag);
        window.addEventListener('mouseup', endDrag);
        canvas.addEventListener('mouseleave', endDrag);
    }

    if (intensityRange) {
        intensityRange.addEventListener('input', function () {
            updateIntensityLabel();
            draw();
        });
        updateIntensityLabel();
    }

    if (highlightRange) {
        highlightRange.addEventListener('input', function () {
            updateHighlightLabel();
            draw();
        });
        updateHighlightLabel();
    }

    if (colorPicker) {
        colorPicker.addEventListener('input', draw);
    }

    if (protectHighlightsToggle) {
        protectHighlightsToggle.addEventListener('change', draw);
    }
})();
