# Changelog - TimeSeriesRacing Web Edition

## Version 2.0 - Premium Edition (2024-10-30)

### 🎨 Major Visual Improvements

#### Premium Graphics Engine
- ✨ **Gradient Bars** - Stunning horizontal gradients on all bars
- 🌓 **Drop Shadows** - Subtle shadows for depth and dimension
- 🎯 **High-Quality Rendering** - Anti-aliasing and smooth graphics
- 📐 **Rounded Corners** - Modern 12px border radius on bars
- 🎨 **Enhanced Color Palettes** - 15 colors per palette (up from 10)
- 🔷 **Thicker Borders** - 3px borders with darker shade for definition

#### Typography Overhaul
- 🔤 **Google Fonts Integration** - Inter font family (weights 400-900)
- 📊 **Larger Title** - 56px bold title (up from 42px)
- 📝 **Subtitle Support** - New optional subtitle field
- 💪 **Font Weights** - Proper hierarchy (800 title, 700 labels, 600 ticks)
- 🎯 **Better Sizing** - Entity labels 26px, axis ticks 20px

#### Background & Layout
- 🌈 **Gradient Background** - Subtle gray gradient (#f8f9fa → #e9ecef)
- 📏 **Optimized Padding** - More breathing room (180px top, 120px sides)
- 🎭 **Massive Period Label** - 80px watermark-style period display
- 📐 **Grid Improvements** - Cleaner 2px grid lines, 6% opacity

### 🚀 New Features

#### Stats Panel Overlay
- 📊 **Real-time Statistics** - Total, Leader, Gap, Average
- 🎨 **Beautiful Card Design** - White card with shadow and rounded corners
- 🎯 **Color-Coded Values** - Blue, Green, Orange, Purple
- 📏 **Smart Formatting** - Auto K/M suffixes (1.5K, 2.3M)

#### Value Labels on Bars
- 🏷️ **Inline Labels** - Values displayed directly on bars
- 📦 **White Background** - Semi-transparent box for readability
- 🔢 **Smart Formatting** - Adaptive decimals based on value size
- 💫 **Bold Typography** - 24px Inter bold for clarity

#### Rank Change Indicators
- ↕️ **Visual Arrows** - ↑ (green), ↓ (red), → (gray)
- 📍 **Left Position** - Displayed left of entity names
- 🎯 **28px Font** - Large, clear indicators
- 🔄 **Real-time Tracking** - Updates each frame

#### Growth Rate Display
- 📈 **Percentage Change** - Frame-to-frame growth calculation
- 🎨 **Color Coding** - Green for positive, red for negative
- 📍 **Right Position** - Displayed right of bars
- 🔢 **Smart Display** - Only shows if |growth| > 0.1%

#### Smooth Animations
- 🎬 **Cubic Easing** - easeInOutCubic for natural motion
- 🔄 **Value Interpolation** - Smooth transitions between periods
- ⚡ **GPU Acceleration** - Hardware-accelerated rendering
- 🎯 **Frame-perfect** - Consistent timing at 30/60 fps

### ⚙️ Enhanced Configuration

#### New UI Controls
- 📝 **Subtitle Input** - Optional subtitle field
- 🎨 **Bar Style Selector** - Gradient vs Solid
- ✅ **5 Visual Toggles**:
  - Stats Panel (on/off)
  - Value Labels (on/off)
  - Rank Indicators (on/off)
  - Growth Rate (on/off)
  - Shadows & Effects (on/off)

#### Improved Defaults
- 🎯 **Better Title** - "Programming Languages Popularity"
- 📅 **Subtitle** - "1990 - 2020"
- 🔢 **Top 8** - Show 8 items by default (better for demo)
- 🎨 **Vibrant Palette** - Pre-selected
- ✨ **All Effects On** - Premium look by default

### 🎯 Technical Improvements

#### Rendering Engine
- 🖼️ **Canvas Optimization** - `{ alpha: false }` for better performance
- 🎨 **Image Smoothing** - High-quality anti-aliasing
- 📐 **DPI Awareness** - Retina display support
- 🎯 **No Flicker** - Smooth 'none' update mode

#### Code Quality
- 📦 **Modular Design** - Separated drawing functions
- 🎯 **Clear Naming** - Descriptive method names
- 📝 **Full Documentation** - JSDoc comments
- 🔧 **Configurable** - All features toggle-able

#### Performance
- ⚡ **Efficient Updates** - Only redraw what changed
- 🎯 **Smart Rendering** - Conditional feature drawing
- 💾 **Memory Management** - Proper cleanup and destroy
- 🚀 **Fast Startup** - Lazy font loading

### 📦 Updated Dependencies

- Chart.js 4.4.0 (unchanged)
- GSAP 3.12.2 (unchanged)
- PapaParse 5.4.1 (unchanged)
- **NEW**: Google Fonts CDN (Inter family)

### 🎨 Color Palette Enhancements

All 7 palettes expanded from 10 to 15 colors:
- Vibrant: Added 5 new pastel variants
- Professional: Added business-friendly tones
- Neon: More electric colors
- Gold: Richer gold/bronze range
- Ocean: Deeper blues and teals
- Sunset: Warmer oranges
- Pastel: Softer variations

### 📊 Comparison: v1.0 → v2.0

| Feature | v1.0 | v2.0 Premium |
|---------|------|--------------|
| Bar Style | Solid | **Gradient** |
| Stats Panel | ❌ | ✅ (Total, Leader, Gap, Avg) |
| Value Labels | ❌ | ✅ (Smart formatting) |
| Rank Indicators | ❌ | ✅ (↑↓→ arrows) |
| Growth Rate | ❌ | ✅ (+/- percentages) |
| Subtitle | ❌ | ✅ Optional field |
| Font | System | ✅ **Inter (Google Fonts)** |
| Title Size | 42px | ✅ **56px** |
| Border Width | 2px | ✅ **3px** |
| Border Radius | 8px | ✅ **12px** |
| Background | White | ✅ **Gradient** |
| Easing | Linear | ✅ **Cubic** |
| Period Label | 64px | ✅ **80px** |
| Color Count | 10/palette | ✅ **15/palette** |
| Effects Toggles | 0 | ✅ **5 toggles** |

### 🐛 Bug Fixes

- Fixed gradient creation for multiple bars
- Improved rank tracking accuracy
- Better memory cleanup on chart destroy
- Fixed canvas sizing for retina displays
- Improved text rendering quality

### 📖 Documentation

- Updated README.md with v2.0 features
- Added this CHANGELOG.md
- Improved code comments and JSDoc
- Better inline documentation

---

## Version 1.0 - Initial Release (2024-10-30)

### Core Features
- ✅ CSV upload with drag & drop
- ✅ Auto-detect data format (LONG/WIDE)
- ✅ Bar chart racing animation
- ✅ 7 color palettes
- ✅ WebM video export
- ✅ Real-time preview
- ✅ Responsive design
- ✅ Sample data included

### Tech Stack
- Chart.js 4.4.0
- GSAP 3.12.2
- PapaParse 5.4.1
- Vanilla JavaScript (ES6 modules)

### Configuration Options
- Title customization
- Top N items (5-20)
- FPS (30/60)
- Animation speed (200-3000ms)
- Color palette selection

### Browser Support
- Chrome 90+: Full support
- Firefox 88+: Full support
- Safari 14+: Partial (WebM issues)
- Edge 90+: Full support

---

## Future Roadmap

### v3.0 (Planned)
- 📊 Line chart racing
- 🥧 Pie chart racing
- 📊 Column chart racing
- 🎭 Combo mode (multiple charts)
- 🎥 MP4 export option
- 📱 Mobile-optimized UI

### v4.0 (Future)
- 📊 Excel file support (.xlsx)
- 🎨 Custom color picker
- 🔤 Font family selector
- 💾 Save/load configurations
- 🌐 Real-time data streaming
- 🎬 Animation presets

---

**Made with ❤️ using HTML, JavaScript, and CSS**

For issues or feature requests, please visit:
https://github.com/thanhinfore/CongCuVui/issues
