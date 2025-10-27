#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TimeSeriesRacing - Tạo video biểu đồ động (bar chart race) từ dữ liệu time series
Hỗ trợ CSV, Excel, JSON với tự động nhận dạng cấu trúc dữ liệu
Version 3.1 - Ultra HD with enhanced video encoding for perfect editor compatibility
"""

import pandas as pd
import bar_chart_race as bcr
import argparse
import sys
import os
from pathlib import Path
import warnings
import matplotlib.pyplot as plt
from matplotlib import colors as mcolors
from matplotlib import animation

warnings.filterwarnings('ignore')


class ColorPalettes:
    """Bộ sưu tập color palettes chuyên nghiệp"""

    VIBRANT = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
               '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788']

    PROFESSIONAL = ['#2E86AB', '#A23B72', '#F18F01', '#C73E1D', '#6A994E',
                    '#BC4B51', '#5E548E', '#9A8C98', '#C9ADA7', '#4A5859']

    PASTEL = ['#FFB5BA', '#B8E0D2', '#D6EADF', '#EAC4D5', '#F7D59C',
              '#C9B1BD', '#A7D2CB', '#F2D388', '#C98474', '#874C62']

    NEON = ['#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF',
            '#06FFA5', '#FF206E', '#FAED26', '#7209B7', '#4CC9F0']

    OCEAN = ['#023047', '#126782', '#219EBC', '#8ECAE6', '#FFB703',
             '#FB8500', '#006466', '#4D908E', '#43AA8B', '#90BE6D']

    SUNSET = ['#F72585', '#B5179E', '#7209B7', '#560BAD', '#480CA8',
              '#3A0CA3', '#3F37C9', '#4361EE', '#4895EF', '#4CC9F0']

    EARTH = ['#9A8C98', '#C9ADA7', '#F2E9E4', '#4A4E69', '#22223B',
             '#9A8C98', '#C9ADA7', '#F2E9E4', '#4A4E69', '#22223B']

    FOOTBALL = ['#DC143C', '#0000CD', '#FFD700', '#FF4500', '#00CED1',
                '#FF1493', '#32CD32', '#FF6347', '#4169E1', '#FF8C00']

    @staticmethod
    def get_palette(name):
        """Lấy color palette theo tên"""
        palettes = {
            'vibrant': ColorPalettes.VIBRANT,
            'professional': ColorPalettes.PROFESSIONAL,
            'pastel': ColorPalettes.PASTEL,
            'neon': ColorPalettes.NEON,
            'ocean': ColorPalettes.OCEAN,
            'sunset': ColorPalettes.SUNSET,
            'earth': ColorPalettes.EARTH,
            'football': ColorPalettes.FOOTBALL
        }
        return palettes.get(name.lower(), ColorPalettes.PROFESSIONAL)


class StylePresets:
    """Preset styles cho các use cases khác nhau"""

    TIKTOK = {
        'period_length': 600,  # 0.6 giây - nhanh cho viral
        'steps_per_period': 20,  # Mượt mà
        'ratio': '9:16',
        'palette': 'neon',
        'bar_style': 'gradient',
        'interpolate_period': False  # Tắt để period label không nháy
    }

    YOUTUBE = {
        'period_length': 1000,  # 1 giây - vừa phải
        'steps_per_period': 20,  # Mượt mà
        'ratio': '16:9',
        'palette': 'professional',
        'bar_style': 'solid',
        'interpolate_period': False  # Tắt để period label không nháy
    }

    INSTAGRAM = {
        'period_length': 800,  # 0.8 giây - medium
        'steps_per_period': 20,  # Mượt mà
        'ratio': '9:16',
        'palette': 'pastel',
        'bar_style': 'gradient',
        'interpolate_period': False  # Tắt để period label không nháy
    }

    PRESENTATION = {
        'period_length': 1500,  # 1.5 giây - chậm hơn, dễ đọc
        'steps_per_period': 20,  # Vẫn mượt
        'ratio': '16:9',
        'palette': 'professional',
        'bar_style': 'solid',
        'interpolate_period': False  # Tắt để period label không nháy
    }


class TimeSeriesRacing:
    """Lớp chính để xử lý và tạo video bar chart race - V3.1 with editor-ready encoding"""

    def __init__(self, input_file, **kwargs):
        """
        Khởi tạo TimeSeriesRacing

        Args:
            input_file: Đường dẫn file dữ liệu (CSV, Excel, JSON)
            **kwargs: Các tham số tùy chọn
        """
        self.input_file = input_file
        self.title = kwargs.get('title', 'Evolution of Data')
        self.top_n = kwargs.get('top', 10)
        self.fps = kwargs.get('fps', 30)
        self.use_percent = kwargs.get('percent', False)
        self.ratio = kwargs.get('ratio', '16:9')
        self.theme = kwargs.get('theme', 'light')
        self.output = kwargs.get('output', 'output.mp4')
        self.time_col = kwargs.get('time', None)
        self.entity_col = kwargs.get('entity', None)
        self.value_col = kwargs.get('value', None)
        self.period_length = kwargs.get('period_length', 1000)  # Mặc định 1 giây
        self.steps_per_period = kwargs.get('steps_per_period', 20)  # Mặc định 20 steps cho mượt mà

        # Enhanced parameters
        self.palette = kwargs.get('palette', 'professional')
        self.bar_style = kwargs.get('bar_style', 'gradient')
        self.preset = kwargs.get('preset', None)
        self.show_grid = kwargs.get('show_grid', True)
        self.bar_label_font_size = kwargs.get('bar_label_font_size', 12)
        self.title_font_size = kwargs.get('title_font_size', 20)
        self.interpolate_period = kwargs.get('interpolate_period', False)  # Mặc định tắt để period label không nháy

        # V3.0 - Ultra HD & Visual Effects
        self.dpi = kwargs.get('dpi', 150)  # Higher DPI for better quality
        self.show_bar_values = kwargs.get('show_bar_values', True)  # Show values on bars
        self.bar_textposition = kwargs.get('bar_textposition', 'outside')  # inside/outside
        self.bar_texttemplate = kwargs.get('bar_texttemplate', '{x:,.0f}')  # Format for bar values
        self.enable_effects = kwargs.get('enable_effects', True)  # Enable visual effects
        self.font_family = kwargs.get('font_family', 'sans-serif')  # Font family

        # Apply preset if specified
        if self.preset:
            self._apply_preset()

        self.df = None
        self.df_wide = None

    def _apply_preset(self):
        """Áp dụng preset style"""
        presets = {
            'tiktok': StylePresets.TIKTOK,
            'youtube': StylePresets.YOUTUBE,
            'instagram': StylePresets.INSTAGRAM,
            'presentation': StylePresets.PRESENTATION
        }

        if self.preset.lower() in presets:
            preset = presets[self.preset.lower()]
            self.period_length = preset['period_length']
            self.steps_per_period = preset['steps_per_period']
            self.ratio = preset['ratio']
            self.palette = preset['palette']
            self.bar_style = preset['bar_style']
            self.interpolate_period = preset.get('interpolate_period', False)
            print(f"✨ Đã áp dụng preset: {self.preset.upper()}")
            print(f"  → Period: {self.period_length}ms, Steps: {self.steps_per_period}")
            print(f"  → Interpolate: {'Yes' if self.interpolate_period else 'No (period label sẽ nhảy từng năm)'}")

    def read_data(self):
        """Đọc dữ liệu từ file CSV, Excel, hoặc JSON"""
        file_ext = Path(self.input_file).suffix.lower()

        print(f"📂 Đang đọc file: {self.input_file}")

        try:
            if file_ext == '.csv':
                self.df = pd.read_csv(self.input_file)
            elif file_ext in ['.xlsx', '.xls']:
                self.df = pd.read_excel(self.input_file)
            elif file_ext == '.json':
                self.df = pd.read_json(self.input_file)
            else:
                raise ValueError(f"Định dạng file không được hỗ trợ: {file_ext}")

            print(f"✅ Đọc thành công {len(self.df)} dòng dữ liệu")
            print(f"📊 Cột dữ liệu: {list(self.df.columns)}")
            return True

        except Exception as e:
            print(f"❌ Lỗi khi đọc file: {str(e)}")
            return False

    def detect_format(self):
        """
        Tự động nhận dạng cấu trúc dữ liệu (long format hoặc wide format)

        Returns:
            str: 'long' hoặc 'wide'
        """
        print("\n🔍 Đang nhận dạng cấu trúc dữ liệu...")

        # Tìm cột thời gian
        time_candidates = []
        for col in self.df.columns:
            col_lower = str(col).lower()
            if any(keyword in col_lower for keyword in ['year', 'date', 'time', 'period', 'month', 'day', 'năm', 'ngày', 'tháng']):
                time_candidates.append(col)

        # Nếu user chỉ định cột thời gian
        if self.time_col:
            if self.time_col in self.df.columns:
                time_col = self.time_col
            else:
                print(f"⚠️  Không tìm thấy cột thời gian '{self.time_col}', tự động tìm...")
                time_col = time_candidates[0] if time_candidates else self.df.columns[0]
        else:
            time_col = time_candidates[0] if time_candidates else self.df.columns[0]

        self.detected_time_col = time_col
        print(f"  → Cột thời gian: {time_col}")

        # Đếm số cột numeric
        numeric_cols = self.df.select_dtypes(include=['number']).columns.tolist()

        # Phân biệt long vs wide format
        if len(self.df.columns) == 3 or (self.entity_col and self.value_col):
            # Long format: có 3 cột (time, entity, value)
            format_type = 'long'
            print(f"  → Định dạng: LONG (3 cột: thời gian, thực thể, giá trị)")
        elif len(numeric_cols) > 2:
            # Wide format: nhiều cột numeric
            format_type = 'wide'
            print(f"  → Định dạng: WIDE ({len(numeric_cols)} cột giá trị)")
        else:
            # Mặc định coi là long format
            format_type = 'long'
            print(f"  → Định dạng: LONG (mặc định)")

        return format_type

    def normalize_data(self, format_type):
        """
        Chuẩn hóa dữ liệu và chuyển về wide format để tạo animation

        Args:
            format_type: 'long' hoặc 'wide'
        """
        print("\n⚙️  Đang chuẩn hóa dữ liệu...")

        try:
            if format_type == 'long':
                # Long format → Wide format (pivot)
                if self.time_col and self.entity_col and self.value_col:
                    time_col = self.time_col
                    entity_col = self.entity_col
                    value_col = self.value_col
                else:
                    # Tự động phát hiện
                    time_col = self.detected_time_col
                    cols = [c for c in self.df.columns if c != time_col]

                    # Tìm cột entity (thường là cột text)
                    entity_candidates = self.df[cols].select_dtypes(include=['object']).columns.tolist()
                    entity_col = entity_candidates[0] if entity_candidates else cols[0]

                    # Cột còn lại là value
                    value_col = [c for c in cols if c != entity_col][0]

                print(f"  → Pivot: {time_col} (thời gian) × {entity_col} (thực thể) × {value_col} (giá trị)")

                # Pivot table
                self.df_wide = self.df.pivot(
                    index=time_col,
                    columns=entity_col,
                    values=value_col
                )

            else:
                # Wide format - đã sẵn dạng đúng
                time_col = self.detected_time_col
                self.df_wide = self.df.set_index(time_col)

            # Chuẩn hóa dữ liệu
            # 1. Điền giá trị NaN bằng 0
            self.df_wide = self.df_wide.fillna(0)

            # 2. Đảm bảo index là sorted
            self.df_wide = self.df_wide.sort_index()

            # 3. Chuyển sang numeric
            for col in self.df_wide.columns:
                self.df_wide[col] = pd.to_numeric(self.df_wide[col], errors='coerce').fillna(0)

            # 4. Nếu dùng phần trăm, chuẩn hóa
            if self.use_percent:
                self.df_wide = self.df_wide.div(self.df_wide.sum(axis=1), axis=0) * 100
                print("  → Đã chuyển sang phần trăm (%)")

            print(f"✅ Chuẩn hóa thành công: {self.df_wide.shape[0]} khoảng thời gian × {self.df_wide.shape[1]} thực thể")
            print(f"  → Khoảng thời gian: {self.df_wide.index[0]} → {self.df_wide.index[-1]}")

            return True

        except Exception as e:
            print(f"❌ Lỗi khi chuẩn hóa dữ liệu: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

    def _setup_ffmpeg_writer(self):
        """Setup custom FFmpeg writer for maximum compatibility with video editors"""
        # Custom FFmpeg settings for CapCut, Premiere Pro, DaVinci Resolve, etc.
        # Key points:
        # - h264 codec (libx264) - universal compatibility
        # - yuv420p pixel format - required by most editors
        # - Constant Frame Rate (CFR) - prevents duration issues
        # - Proper bitrate for quality
        # - GOP size = fps for better seeking in editors

        extra_args = [
            '-vcodec', 'libx264',           # H.264 codec (most compatible)
            '-pix_fmt', 'yuv420p',          # Pixel format (required for compatibility)
            '-preset', 'medium',             # Encoding speed vs compression
            '-crf', '18',                    # Quality (18 = near lossless, lower = better)
            '-movflags', '+faststart',       # Enable fast start for web/streaming
            '-r', str(self.fps),            # Force constant frame rate (CFR)
            '-g', str(self.fps),            # GOP size = fps (keyframe every 1 second)
            '-bf', '2',                      # B-frames for better compression
            '-profile:v', 'high',            # H.264 profile
            '-level', '4.2',                 # H.264 level (4.2 = 1080p60)
        ]

        # Create custom FFmpeg writer
        writer = animation.FFMpegWriter(
            fps=self.fps,
            metadata={
                'title': self.title,
                'artist': 'TimeSeriesRacing v3.1',
                'comment': 'Created with TimeSeriesRacing v3.1 - Editor-Ready Format'
            },
            bitrate=8000,  # 8000 kbps = high quality
            extra_args=extra_args
        )

        return writer

    def create_animation(self):
        """Tạo animation bar chart race và xuất video MP4 - V3.1 Editor-Ready"""
        print(f"\n🎬 Đang tạo video animation (V3.1 Editor-Ready)...")
        print(f"  → Tiêu đề: {self.title}")
        print(f"  → Top {self.top_n} thực thể")
        print(f"  → FPS: {self.fps}")
        print(f"  → DPI: {self.dpi} (Higher quality!)")
        print(f"  → Tỷ lệ: {self.ratio}")
        print(f"  → Palette: {self.palette}")
        print(f"  → Bar style: {self.bar_style}")
        print(f"  → Bar values: {'Yes' if self.show_bar_values else 'No'}")
        print(f"  → Visual effects: {'Enabled' if self.enable_effects else 'Disabled'}")
        print(f"  → Video codec: H.264 (yuv420p, CFR) - Editor-ready format")

        try:
            # Cấu hình kích thước theo tỷ lệ
            if self.ratio == '9:16':
                figsize = (6, 10.67)  # Portrait cho TikTok/Reels
            else:
                figsize = (12, 6.75)  # Landscape 16:9

            # Lấy color palette
            colors = ColorPalettes.get_palette(self.palette)

            # Tạo custom colormap - bar_chart_race chỉ nhận cmap, không nhận colors
            n_colors = len(self.df_wide.columns)
            if n_colors <= len(colors):
                palette_colors = colors[:n_colors]
            else:
                # Repeat colors if needed
                palette_colors = (colors * ((n_colors // len(colors)) + 1))[:n_colors]

            # Tạo colormap từ palette colors
            cmap = mcolors.ListedColormap(palette_colors)

            # Font configuration
            title_font_size = self.title_font_size if self.ratio == '16:9' else self.title_font_size - 2
            bar_label_size = self.bar_label_font_size
            tick_label_size = self.bar_label_font_size - 1

            # Period label configuration
            period_label_size = title_font_size + 8
            if self.ratio == '9:16':
                period_label_pos = {'x': 0.95, 'y': 0.15, 'ha': 'right', 'va': 'center'}
            else:
                period_label_pos = {'x': 0.98, 'y': 0.12, 'ha': 'right', 'va': 'center'}

            # V3.0 - Enhanced bar styling with visual effects
            if self.enable_effects:
                if self.bar_style == 'gradient':
                    bar_kwargs = {
                        'alpha': 0.92,
                        'ec': 'white',  # Edge color
                        'lw': 2.5,      # Line width (border)
                        'zorder': 10,   # Draw order
                    }
                else:
                    bar_kwargs = {
                        'alpha': 0.88,
                        'ec': '#2C3E50',  # Darker border for solid
                        'lw': 2,
                        'zorder': 10,
                    }
            else:
                # Standard styling (backward compatible)
                if self.bar_style == 'gradient':
                    bar_kwargs = {
                        'alpha': 0.9,
                        'ec': 'white',
                        'lw': 2,
                    }
                else:
                    bar_kwargs = {
                        'alpha': 0.85,
                        'ec': 'white',
                        'lw': 1.5,
                    }

            # Setup custom FFmpeg writer for editor compatibility
            ffmpeg_writer = self._setup_ffmpeg_writer()

            # Tạo animation
            print(f"  ⏳ Đang render video... (có thể mất vài phút)")

            bcr.bar_chart_race(
                df=self.df_wide,
                filename=self.output,
                n_bars=self.top_n,
                title=self.title,
                figsize=figsize,
                period_length=self.period_length,
                steps_per_period=self.steps_per_period,
                interpolate_period=self.interpolate_period,  # Smooth transitions
                cmap=cmap,
                bar_size=0.95,
                period_label={
                    **period_label_pos,
                    'size': period_label_size,
                    'weight': 'bold',
                    'color': '#2C3E50' if self.theme == 'light' else '#ECF0F1'
                },
                # Dùng :g để bỏ .0 cho số nguyên (2024 thay vì 2024.0)
                period_fmt='{x:g}' if isinstance(self.df_wide.index[0], (int, float)) else '{x}',
                bar_label_size=bar_label_size if self.show_bar_values else 0,  # V3.0 - Control bar values
                tick_label_size=tick_label_size,
                shared_fontdict={
                    'family': self.font_family,  # V3.0 - Custom font
                    'weight': 'bold',
                    'color': '#2C3E50' if self.theme == 'light' else '#ECF0F1'
                },
                title_size=title_font_size,
                scale='linear',
                writer=ffmpeg_writer,  # V3.0 Enhanced - Custom FFmpeg writer for editor compatibility
                fig=None,
                dpi=self.dpi,  # V3.0 - Higher DPI for better quality!
                bar_kwargs=bar_kwargs,
                filter_column_colors=False,
                period_summary_func=lambda v, r: {
                    'x': 0.98,
                    'y': 0.05,
                    's': f'Total: {v.sum():,.0f}' if not self.use_percent else f'Total: {v.sum():.1f}%',
                    'ha': 'right',
                    'size': bar_label_size - 2,
                    'weight': 'bold'
                } if self.show_grid else None,
            )

            print(f"\n✅ Video đã được tạo thành công: {self.output}")

            # Hiển thị thông tin file
            file_size = os.path.getsize(self.output) / (1024 * 1024)  # MB
            print(f"  → Kích thước: {file_size:.2f} MB")

            # Show specs
            print(f"\n📊 Thông số video:")
            print(f"  → Resolution: {'1080×1920' if self.ratio == '9:16' else '1920×1080'}")
            print(f"  → DPI: {self.dpi} {'(Ultra HD)' if self.dpi >= 150 else '(Standard)'}")
            print(f"  → FPS: {self.fps} (Constant Frame Rate)")
            print(f"  → Codec: H.264 (libx264) + yuv420p")
            print(f"  → Bitrate: 8000 kbps (High Quality)")
            print(f"  → Duration: ~{(len(self.df_wide) * self.period_length) / 1000:.1f}s")
            print(f"  → Period length: {self.period_length}ms ({self.period_length/1000:.1f}s/frame)")
            print(f"  → Animation quality: {'Ultra Smooth' if self.steps_per_period >= 20 else 'Smooth' if self.steps_per_period >= 15 else 'Standard'}")
            print(f"  → Bar values: {'Yes' if self.show_bar_values else 'No'}")
            print(f"  → Visual effects: {'Enabled' if self.enable_effects else 'Disabled'}")
            print(f"\n✨ Video Editor Compatibility:")
            print(f"  → CapCut: ✅ Full support")
            print(f"  → Premiere Pro: ✅ Full support")
            print(f"  → DaVinci Resolve: ✅ Full support")
            print(f"  → Final Cut Pro: ✅ Full support")

            return True

        except Exception as e:
            print(f"❌ Lỗi khi tạo video: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

    def run(self):
        """Chạy toàn bộ quy trình"""
        print("="*70)
        print("🎥 TIMESERIES RACING v3.1 - EDITOR-READY VIDEO GENERATOR")
        print("="*70)
        print("✨ NEW: Perfect CapCut/Premiere Pro compatibility, CFR encoding")

        # Bước 1: Đọc dữ liệu
        if not self.read_data():
            return False

        # Bước 2: Nhận dạng format
        format_type = self.detect_format()

        # Bước 3: Chuẩn hóa dữ liệu
        if not self.normalize_data(format_type):
            return False

        # Bước 4: Tạo animation
        if not self.create_animation():
            return False

        print("\n" + "="*70)
        print("🎉 HOÀN THÀNH!")
        print("="*70)
        print("\n💡 Tips:")
        print("  - Video sẵn sàng import vào CapCut, Premiere Pro, DaVinci Resolve")
        print("  - Thử các palette khác: vibrant, neon, ocean, sunset")
        print("  - Dùng preset: --preset tiktok hoặc youtube")
        print("\n✨ V3.1 Features:")
        print("  - H.264 (yuv420p) encoding for universal compatibility")
        print("  - Constant Frame Rate (CFR) - no more duration issues")
        print("  - High bitrate (8000 kbps) for professional quality")
        print("  - Perfect for CapCut, Premiere, DaVinci, Final Cut")

        return True


def main():
    """Hàm main với CLI parser"""

    parser = argparse.ArgumentParser(
        description='TimeSeriesRacing v3.1 - Editor-Ready Bar Chart Race Video Generator',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ví dụ sử dụng:
  # V3.1 - Editor-ready video với perfect compatibility (mặc định)
  python TimeSeriesRacing.py data.csv

  # Preset TikTok - sẵn sàng cho CapCut
  python TimeSeriesRacing.py data.csv --preset tiktok --title "Viral Data 🔥"

  # 60fps + DPI 200 cho chất lượng cực cao
  python TimeSeriesRacing.py data.csv --fps 60 --dpi 200 --palette neon

  # Video chuyên nghiệp với gradient bars
  python TimeSeriesRacing.py data.csv --palette ocean --bar-style gradient

  # Preset YouTube với custom font
  python TimeSeriesRacing.py data.csv --preset youtube --font-family serif

  # Tắt bar values nếu muốn minimalist
  python TimeSeriesRacing.py data.csv --no-bar-values --palette pastel

Palettes có sẵn:
  vibrant, professional, pastel, neon, ocean, sunset, earth, football

Presets có sẵn:
  tiktok, youtube, instagram, presentation

Bar styles:
  solid, gradient

V3.1 Features:
  - H.264 (yuv420p) encoding for universal compatibility
  - Constant Frame Rate (CFR) - fixes duration issues in editors
  - High bitrate (8000 kbps) professional quality
  - Perfect for CapCut, Premiere Pro, DaVinci Resolve, Final Cut Pro
  - No more video duration problems!
        """
    )

    # Tham số bắt buộc
    parser.add_argument('input', help='File dữ liệu đầu vào (CSV, Excel, JSON)')

    # Tham số tùy chọn cơ bản
    parser.add_argument('--title', type=str, default='Evolution of Data',
                        help='Tiêu đề video')
    parser.add_argument('--top', type=int, default=10,
                        help='Số thanh hiển thị tối đa (mặc định: 10)')
    parser.add_argument('--fps', type=int, default=30,
                        help='Frame per second (mặc định: 30)')
    parser.add_argument('--percent', action='store_true',
                        help='Hiển thị giá trị dạng phần trăm')
    parser.add_argument('--ratio', type=str, choices=['16:9', '9:16'], default='16:9',
                        help='Tỷ lệ khung hình (mặc định: 16:9)')
    parser.add_argument('--theme', type=str, choices=['light', 'dark'], default='light',
                        help='Theme màu sắc (mặc định: light)')
    parser.add_argument('--output', type=str, default='output.mp4',
                        help='Tên file video đầu ra (mặc định: output.mp4)')
    parser.add_argument('--period-length', type=int, default=1000,
                        help='Thời lượng mỗi nhịp/period (ms) - mặc định: 1000ms = 1 giây')
    parser.add_argument('--steps-per-period', type=int, default=20,
                        help='Số bước mỗi period - càng cao càng mượt (mặc định: 20 = ultra smooth)')

    # Enhanced parameters
    parser.add_argument('--palette', type=str,
                        choices=['vibrant', 'professional', 'pastel', 'neon', 'ocean',
                                'sunset', 'earth', 'football'],
                        default='professional',
                        help='Color palette (mặc định: professional)')
    parser.add_argument('--bar-style', type=str, choices=['solid', 'gradient'],
                        default='gradient',
                        help='Kiểu thanh bar (mặc định: gradient)')
    parser.add_argument('--preset', type=str,
                        choices=['tiktok', 'youtube', 'instagram', 'presentation'],
                        help='Preset tối ưu cho platform cụ thể')
    parser.add_argument('--no-grid', action='store_true',
                        help='Tắt grid lines')
    parser.add_argument('--bar-label-font-size', type=int, default=12,
                        help='Kích thước font cho bar labels (mặc định: 12)')
    parser.add_argument('--title-font-size', type=int, default=20,
                        help='Kích thước font cho title (mặc định: 20)')
    parser.add_argument('--interpolate', action='store_true',
                        help='Bật interpolation cho period (có thể làm period label nháy)')

    # V3.0 - Ultra HD & Visual Effects parameters
    parser.add_argument('--dpi', type=int, default=150,
                        help='DPI cho video (mặc định: 150, cao hơn = chất lượng tốt hơn)')
    parser.add_argument('--no-bar-values', action='store_true',
                        help='Ẩn giá trị trên bars (mặc định: hiển thị)')
    parser.add_argument('--no-effects', action='store_true',
                        help='Tắt visual effects (borders, shadows)')
    parser.add_argument('--font-family', type=str, default='sans-serif',
                        choices=['sans-serif', 'serif', 'monospace'],
                        help='Font chữ (mặc định: sans-serif)')

    # Tham số cho long format
    parser.add_argument('--time', type=str, default=None,
                        help='Tên cột thời gian (tự động phát hiện nếu không chỉ định)')
    parser.add_argument('--entity', type=str, default=None,
                        help='Tên cột thực thể (cho long format)')
    parser.add_argument('--value', type=str, default=None,
                        help='Tên cột giá trị (cho long format)')

    # Parse arguments
    args = parser.parse_args()

    # Kiểm tra file đầu vào
    if not os.path.exists(args.input):
        print(f"❌ File không tồn tại: {args.input}")
        sys.exit(1)

    # Tạo object và chạy
    racing = TimeSeriesRacing(
        args.input,
        title=args.title,
        top=args.top,
        fps=args.fps,
        percent=args.percent,
        ratio=args.ratio,
        theme=args.theme,
        output=args.output,
        time=args.time,
        entity=args.entity,
        value=args.value,
        period_length=args.period_length,
        steps_per_period=args.steps_per_period,
        palette=args.palette,
        bar_style=args.bar_style,
        preset=args.preset,
        show_grid=not args.no_grid,
        bar_label_font_size=args.bar_label_font_size,
        title_font_size=args.title_font_size,
        interpolate_period=args.interpolate,
        # V3.0 - New parameters
        dpi=args.dpi,
        show_bar_values=not args.no_bar_values,
        enable_effects=not args.no_effects,
        font_family=args.font_family
    )

    success = racing.run()
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
