# 📁 Folder Images Feature

## Overview

The Image Text Generator now supports browsing and selecting images from a local `images/` folder, in addition to the traditional file upload method.

## Features

- ✨ Browse images from the `images/` folder
- 🎲 Random selection (1 or 3 images)
- ✅ Select all images at once
- 👁️ Preview images before selection
- 🖼️ Beautiful gallery grid layout

## Setup

### 1. Add Images to the Folder

Place your background images in the `ImageGen/images/` folder:

```bash
cd ImageGen
mkdir -p images
# Add your images (.jpg, .png, .gif, .webp, etc.)
cp /path/to/your/images/*.jpg images/
```

### 2. Generate Images List

Run the Python script to scan and generate the images list:

```bash
cd ImageGen
python3 generate-images-list.py
```

This will:
- Scan the `images/` folder
- Find all image files
- Generate `js/modules/images-list.js` with the list

**Output example:**
```
🖼️  Image List Generator
==================================================
📁 Scanning: images/
📝 Output:   js/modules/images-list.js
==================================================

  📷 background1.jpg (2.3 MB)
  📷 background2.png (1.8 MB)
  📷 sample1.jpg (3.1 MB)

✅ Successfully generated js/modules/images-list.js
📊 Total: 3 images, 7.2 MB
```

### 3. Refresh the Application

Refresh your browser to see the new images in the gallery.

## Usage

### Browse Images

1. Open the **"Browse Images from Folder"** section
2. You'll see a gallery grid of all available images
3. Hover over an image to see its name and select button

### Random Selection

- **Random 1 Image**: Select 1 random image
- **Random 3 Images**: Select 3 random images

### Select All

Click **"Select All"** to add all images from the folder to your project.

### Preview Images

- Click on any image thumbnail to open a preview modal
- View the full-size image
- Select directly from the preview

## Automation

### Auto-regenerate Images List

You can set up a watch script to automatically regenerate the list when images change:

**Option 1: Using Python watchdog**

```bash
pip install watchdog
python3 -c "
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import subprocess
import time

class ImageHandler(FileSystemEventHandler):
    def on_any_event(self, event):
        if event.src_path.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
            print('Regenerating images list...')
            subprocess.run(['python3', 'generate-images-list.py'])

observer = Observer()
observer.schedule(ImageHandler(), 'images', recursive=False)
observer.start()
print('Watching images/ folder...')
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    observer.stop()
observer.join()
"
```

**Option 2: Using Node.js chokidar**

```javascript
// watch-images.js
const chokidar = require('chokidar');
const { exec } = require('child_process');

chokidar.watch('images/**/*.{jpg,jpeg,png,gif,webp}').on('all', (event, path) => {
  console.log(`Detected ${event} in ${path}`);
  exec('python3 generate-images-list.py', (error, stdout) => {
    if (error) {
      console.error('Error:', error);
      return;
    }
    console.log(stdout);
  });
});

console.log('Watching images/ folder...');
```

## File Structure

```
ImageGen/
├── images/                          # Your image files
│   ├── background1.jpg
│   ├── background2.png
│   └── sample1.jpg
├── generate-images-list.py          # Script to generate images list
├── js/
│   └── modules/
│       ├── imageBrowser.js          # Image browser module
│       └── images-list.js           # Auto-generated images list
├── css/
│   └── gallery.css                  # Gallery styles
└── imggen.html                      # Main HTML file
```

## Supported Image Formats

- `.jpg` / `.jpeg`
- `.png`
- `.gif`
- `.webp`
- `.bmp`
- `.svg`

## Tips

1. **Organize by categories**: Create subfolders in `images/` and modify the script to scan recursively
2. **Optimize images**: Use smaller file sizes for better performance
3. **Naming convention**: Use descriptive names for easy identification
4. **Preview images**: Always preview before selecting to ensure quality

## Troubleshooting

### No images showing

1. Check if images exist in `ImageGen/images/` folder
2. Run `python3 generate-images-list.py`
3. Check browser console for errors
4. Refresh the page

### Images not loading

1. Verify image paths in `js/modules/images-list.js`
2. Check file permissions
3. Make sure images are accessible via HTTP (not blocked by CORS)

### Script errors

```bash
# Make sure Python 3 is installed
python3 --version

# Run the script with verbose output
python3 generate-images-list.py
```

## Advanced Usage

### Custom Image Sources

You can modify `imageBrowser.js` to load images from:
- External URLs
- CDN services
- Backend API endpoints

### Filtering and Search

Add custom filtering logic to show only:
- Specific categories
- Images by date
- Images by size
- Custom metadata

## Future Enhancements

- [ ] Search and filter images
- [ ] Image categories/tags
- [ ] Drag and drop to reorder
- [ ] Bulk image upload to folder
- [ ] Image metadata display (size, dimensions)
- [ ] Lazy loading for large galleries
- [ ] Virtual scrolling for performance

## Support

For issues or questions, please open an issue on the GitHub repository.

---

**Happy creating! 🎨✨**
