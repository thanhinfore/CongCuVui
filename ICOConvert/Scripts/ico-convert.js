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

    let image = null;
    let scale = 1;
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let cropRect = null;

    function updateIntensityLabel() {
        intensityLabel.textContent = `${intensityRange.value}%`;
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
        intensityRange.addEventListener('input', updateIntensityLabel);
        updateIntensityLabel();
    }
})();
