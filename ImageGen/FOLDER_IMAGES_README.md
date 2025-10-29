# 📁 Folder Images Feature - Simple Guide

## Quick Start

### 1. Add Your Images

Put your background images in the `images/` folder:

```bash
cd ImageGen/images
# Copy your images here
cp /path/to/your/backgrounds/* .
```

### 2. Update Config

Edit `images/config.json` and add your image names:

```json
{
  "images": [
    {
      "name": "My Background 1",
      "path": "images/my-bg-1.jpg"
    },
    {
      "name": "My Background 2",
      "path": "images/my-bg-2.png"
    },
    {
      "name": "My Background 3",
      "path": "images/my-bg-3.jpg"
    }
  ]
}
```

### 3. Refresh & Use

Refresh your browser and you'll see the images in the **"Browse Images from Folder"** section!

## Usage

### Browse & Select
- **Gallery View**: See all your images in a beautiful grid
- **Click to Preview**: View full-size before selecting
- **Hover to Select**: Quick select button on hover

### Quick Actions
- **Random 1 Image**: Get 1 random background
- **Random 3 Images**: Get 3 random backgrounds
- **Select All**: Add all images at once

## Config File Format

The `images/config.json` file is simple:

```json
{
  "images": [
    {
      "name": "Display Name",
      "path": "images/filename.jpg"
    }
  ]
}
```

**Fields:**
- `name`: The display name shown in gallery (can be anything)
- `path`: Path to the image file (always starts with `images/`)

## Supported Formats

- `.jpg` / `.jpeg`
- `.png`
- `.gif`
- `.webp`
- `.bmp`
- `.svg`

## Examples

### Example 1: Simple Config

```json
{
  "images": [
    {"name": "Beach", "path": "images/beach.jpg"},
    {"name": "Mountain", "path": "images/mountain.png"},
    {"name": "City", "path": "images/city.jpg"}
  ]
}
```

### Example 2: Organized Names

```json
{
  "images": [
    {"name": "Nature - Forest", "path": "images/forest.jpg"},
    {"name": "Nature - Ocean", "path": "images/ocean.jpg"},
    {"name": "Urban - Street", "path": "images/street.jpg"},
    {"name": "Urban - Building", "path": "images/building.jpg"}
  ]
}
```

### Example 3: Many Images

```json
{
  "images": [
    {"name": "BG 1", "path": "images/bg1.jpg"},
    {"name": "BG 2", "path": "images/bg2.jpg"},
    {"name": "BG 3", "path": "images/bg3.jpg"},
    {"name": "BG 4", "path": "images/bg4.jpg"},
    {"name": "BG 5", "path": "images/bg5.jpg"}
  ]
}
```

## File Structure

```
ImageGen/
├── images/                    # Your image files
│   ├── config.json           # Config file (edit this!)
│   ├── beach.jpg
│   ├── mountain.png
│   └── city.jpg
├── imggen.html               # Main app
└── js/
    └── modules/
        └── imageBrowser.js   # Browser module
```

## Tips

✅ **DO:**
- Use descriptive names for easy identification
- Keep file sizes reasonable (< 5MB per image)
- Use consistent naming convention
- Organize by category in the name field

❌ **DON'T:**
- Don't use special characters in filenames
- Don't put images in subfolders (keep them flat in `images/`)
- Don't forget to update config.json after adding new images

## Troubleshooting

### Images not showing?

1. ✅ Check images are in `ImageGen/images/` folder
2. ✅ Check `images/config.json` exists and is valid JSON
3. ✅ Check file paths match exactly (case-sensitive!)
4. ✅ Refresh the browser (Ctrl+F5)

### Image fails to load?

1. ✅ Check file extension matches actual file type
2. ✅ Check image is not corrupted
3. ✅ Check file permissions
4. ✅ Open browser console to see error messages

### Syntax error in JSON?

Use a JSON validator like [jsonlint.com](https://jsonlint.com) to check your config file.

Common mistakes:
- Missing comma between items
- Extra comma after last item
- Missing quotes around strings
- Wrong brackets `[]` vs `{}`

## Workflow

**Old way (upload every time):**
```
Upload → Select → Process → Repeat
```

**New way (folder + random):**
```
Setup once → Click "Random" → Done! ✨
```

## Advanced Tips

### Quick Config Generator

If you have many images, use this bash one-liner to generate the JSON:

```bash
cd ImageGen/images
for img in *.{jpg,png,gif}; do
  [ -f "$img" ] && echo "    {\"name\": \"$img\", \"path\": \"images/$img\"},"
done
```

Copy the output to your config.json (don't forget to remove last comma and wrap in proper JSON structure).

### Organize by Categories

```json
{
  "images": [
    {"name": "🌅 Sunrise", "path": "images/sunrise.jpg"},
    {"name": "🌅 Sunset", "path": "images/sunset.jpg"},
    {"name": "🏙️ City Day", "path": "images/city-day.jpg"},
    {"name": "🏙️ City Night", "path": "images/city-night.jpg"},
    {"name": "🌊 Ocean", "path": "images/ocean.jpg"}
  ]
}
```

## Support

Having issues? Check:
1. Browser console (F12) for error messages
2. Network tab to see if config.json loads
3. File paths are correct

---

**That's it! Simple and easy to use. Happy creating! 🎨✨**
