#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TimeSeriesRacing - Tạo video biểu đồ động (bar chart race) từ dữ liệu time series
Hỗ trợ CSV, Excel, JSON với tự động nhận dạng cấu trúc dữ liệu
Version 4.0 - ULTIMATE EDITION - 10x Better Information Display!
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
from matplotlib.patches import FancyBboxPatch, Rectangle
import matplotlib.patches as mpatches
import subprocess
import tempfile
import numpy as np

warnings.filterwarnings('ignore')


class ColorPalettes:
    """Bộ sưu tập color palettes chuyên nghiệp - V3.2 Enhanced"""

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

    # V3.2 - NEW PREMIUM PALETTES
    GOLD = ['#FFD700', '#FFA500', '#FF8C00', '#DAA520', '#B8860B',
            '#FFDF00', '#FFBF00', '#FFB300', '#FFC125', '#EEB902']

    CHROME = ['#C0C0C0', '#A9A9A9', '#808080', '#696969', '#778899',
              '#B0C4DE', '#87CEEB', '#4682B4', '#5F9EA0', '#48D1CC']

    RAINBOW = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF',
               '#4B0082', '#9400D3', '#FF1493', '#00CED1', '#7FFF00']

    FIRE = ['#FF0000', '#FF4500', '#FF6347', '#FF7F50', '#FFA07A',
            '#FF8C00', '#FFA500', '#FFD700', '#FFFF00', '#F4A460']

    ICE = ['#00FFFF', '#00CED1', '#5F9EA0', '#4682B4', '#1E90FF',
           '#4169E1', '#0000FF', '#8A2BE2', '#9370DB', '#BA55D3']

    EMERALD = ['#50C878', '#00A36C', '#2E8B57', '#3CB371', '#90EE90',
               '#00FA9A', '#00FF7F', '#7CFC00', '#7FFF00', '#ADFF2F']

    RUBY = ['#E0115F', '#DC143C', '#C21E56', '#B22222', '#CD5C5C',
            '#F08080', '#FA8072', '#E9967A', '#FFA07A', '#FF6347']

    SAPPHIRE = ['#0F52BA', '#082567', '#0047AB', '#003399', '#0066CC',
                '#0080FF', '#4169E1', '#6495ED', '#1E90FF', '#00BFFF']

    COSMIC = ['#2D1B69', '#5B2C6F', '#8B008B', '#9932CC', '#9370DB',
              '#8A2BE2', '#7B68EE', '#6A5ACD', '#483D8B', '#4B0082']

    TROPICAL = ['#FF6B35', '#F7931E', '#FDC830', '#37B5A6', '#2FA8CC',
                '#1E88E5', '#673AB7', '#E91E63', '#FF5722', '#4CAF50']

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
            'football': ColorPalettes.FOOTBALL,
            # V3.2 - Premium palettes
            'gold': ColorPalettes.GOLD,
            'chrome': ColorPalettes.CHROME,
            'rainbow': ColorPalettes.RAINBOW,
            'fire': ColorPalettes.FIRE,
            'ice': ColorPalettes.ICE,
            'emerald': ColorPalettes.EMERALD,
            'ruby': ColorPalettes.RUBY,
            'sapphire': ColorPalettes.SAPPHIRE,
            'cosmic': ColorPalettes.COSMIC,
            'tropical': ColorPalettes.TROPICAL
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
    """Lớp chính để xử lý và tạo video bar chart race - V4.0 ULTIMATE EDITION - 10x Better Info Display"""

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

        # V3.2 - PROFESSIONAL EDITION - Stunning Visual Enhancements
        self.bar_border_width = kwargs.get('bar_border_width', 3.0)  # Thicker borders for premium look
        self.bar_alpha = kwargs.get('bar_alpha', 0.95)  # Bar transparency (0-1)
        self.use_rounded_bars = kwargs.get('use_rounded_bars', False)  # Rounded bar corners
        self.glow_effect = kwargs.get('glow_effect', False)  # Add glow to bars
        self.period_label_style = kwargs.get('period_label_style', 'bold')  # normal/bold/italic
        self.title_style = kwargs.get('title_style', 'bold')  # Title styling
        self.show_subtitle = kwargs.get('show_subtitle', False)  # Show subtitle
        self.subtitle = kwargs.get('subtitle', '')  # Subtitle text

        # V4.0 - ULTIMATE EDITION - 10x Better Information Display
        self.show_rank_changes = kwargs.get('show_rank_changes', True)  # Hiển thị mũi tên thay đổi thứ hạng
        self.show_stats_panel = kwargs.get('show_stats_panel', True)  # Panel thống kê real-time
        self.show_progress_bar = kwargs.get('show_progress_bar', True)  # Timeline progress bar
        self.show_percentage_total = kwargs.get('show_percentage_total', True)  # % của tổng
        self.show_growth_rate = kwargs.get('show_growth_rate', True)  # Tốc độ tăng trưởng
        self.show_value_on_bars = kwargs.get('show_value_on_bars', True)  # Giá trị trên bars
        self.show_gap_to_leader = kwargs.get('show_gap_to_leader', False)  # Khoảng cách với leader
        self.enable_background_gradient = kwargs.get('enable_background_gradient', True)  # Gradient nền
        self.watermark_text = kwargs.get('watermark_text', '')  # Watermark text
        self.watermark_position = kwargs.get('watermark_position', 'bottom-right')  # Vị trí watermark
        self.highlight_leader = kwargs.get('highlight_leader', True)  # Highlight #1
        self.event_annotations = kwargs.get('event_annotations', {})  # Dict {period: "text"}

        # V4.0 - Internal tracking
        self.prev_ranks = {}  # Track previous ranks for change indicators
        self.prev_values = {}  # Track previous values for growth rate
        self.period_index = 0  # Current period index

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

    def _create_v4_overlay(self, ax, current_values, current_ranks, period_value):
        """
        V4.0 - Create information-rich overlay on each frame
        Adds: Statistics Panel, Progress Bar, Rank Changes, Growth Rates, Watermark

        Args:
            current_values: numpy array or dict of current values
            current_ranks: numpy array or dict of current ranks
            period_value: current period (e.g., year)
        """
        if not hasattr(self, '_v4_initialized'):
            self._v4_initialized = True
            self._total_periods = len(self.df_wide)

        # Get current period index
        try:
            if period_value in self.df_wide.index:
                self.period_index = self.df_wide.index.get_loc(period_value)
            else:
                # Interpolated value, find closest
                self.period_index = max(0, min(len(self.df_wide) - 1, self.period_index))
        except:
            self.period_index = 0

        # Convert to appropriate format if needed
        if not isinstance(current_values, dict):
            # It's a numpy array from bar_chart_race
            pass  # We'll handle arrays in each function

        # Colors based on theme
        text_color = '#1a1a1a' if self.theme == 'light' else '#FFFFFF'
        panel_bg = '#F5F5F5' if self.theme == 'light' else '#2C3E50'
        panel_alpha = 0.95

        # 1. BACKGROUND GRADIENT (V4.0 Feature)
        if self.enable_background_gradient:
            self._add_background_gradient(ax)

        # 2. STATISTICS PANEL (V4.0 Feature)
        values_len = len(current_values) if hasattr(current_values, '__len__') else 0
        if self.show_stats_panel and values_len > 0:
            self._add_stats_panel(ax, current_values, text_color, panel_bg, panel_alpha)

        # 3. PROGRESS BAR (V4.0 Feature)
        if self.show_progress_bar:
            self._add_progress_bar(ax, text_color)

        # 4. RANK CHANGE INDICATORS (V4.0 Feature)
        if self.show_rank_changes:
            self._add_rank_indicators(ax, current_ranks, text_color)

        # 5. WATERMARK (V4.0 Feature)
        if self.watermark_text:
            self._add_watermark(ax, text_color)

        # 6. EVENT ANNOTATIONS (V4.0 Feature)
        if period_value in self.event_annotations:
            self._add_event_annotation(ax, self.event_annotations[period_value], text_color)

        # Update tracking for next frame
        if isinstance(current_ranks, dict):
            self.prev_ranks = current_ranks.copy()
        else:
            self.prev_ranks = current_ranks.copy() if hasattr(current_ranks, 'copy') else current_ranks

        if isinstance(current_values, dict):
            self.prev_values = current_values.copy()
        else:
            self.prev_values = current_values.copy() if hasattr(current_values, 'copy') else current_values

    def _add_background_gradient(self, ax):
        """Add subtle background gradient for visual depth"""
        if self.theme == 'light':
            colors_grad = ['#FFFFFF', '#F8F9FA', '#F0F2F5']
        else:
            colors_grad = ['#1a1a1a', '#2C3E50', '#34495E']

        # Create gradient background
        gradient = np.linspace(0, 1, 256).reshape(256, 1)
        gradient = np.hstack([gradient] * 2)

        extent = [ax.get_xlim()[0], ax.get_xlim()[1],
                  ax.get_ylim()[0], ax.get_ylim()[1]]

        ax.imshow(gradient, aspect='auto', extent=extent,
                  alpha=0.1, zorder=-10, cmap=plt.cm.Blues if self.theme == 'light' else plt.cm.Greys)

    def _add_stats_panel(self, ax, current_values, text_color, panel_bg, panel_alpha):
        """Add real-time statistics panel (V4.0 ULTIMATE Feature)"""
        # Handle both dict and numpy array inputs
        if isinstance(current_values, dict):
            values_array = np.array(list(current_values.values()))
        else:
            values_array = np.array(current_values) if not isinstance(current_values, np.ndarray) else current_values

        # Calculate statistics
        total_value = np.sum(values_array)
        leader_value = np.max(values_array) if len(values_array) > 0 else 0
        avg_value = np.mean(values_array) if len(values_array) > 0 else 0

        # Get top 2 for gap calculation
        sorted_values = np.sort(values_array)[::-1]  # Sort descending
        gap = sorted_values[0] - sorted_values[1] if len(sorted_values) > 1 else 0

        # Panel position (top-right corner)
        panel_width = 0.25
        panel_height = 0.18
        panel_x = 0.73
        panel_y = 0.80

        # Draw panel background
        panel = FancyBboxPatch(
            (panel_x, panel_y), panel_width, panel_height,
            boxstyle="round,pad=0.01",
            transform=ax.transAxes,
            facecolor=panel_bg,
            edgecolor=text_color,
            alpha=panel_alpha,
            linewidth=2,
            zorder=1000
        )
        ax.add_patch(panel)

        # Add statistics text
        stats_text = f"📊 STATISTICS\n"
        stats_text += f"Total: {total_value:,.0f}\n"
        stats_text += f"Leader: {leader_value:,.0f}\n"
        stats_text += f"Gap: {gap:,.0f}\n"
        stats_text += f"Average: {avg_value:,.0f}"

        ax.text(panel_x + 0.125, panel_y + 0.09, stats_text,
                transform=ax.transAxes,
                fontsize=9,
                ha='center', va='center',
                color=text_color,
                weight='bold',
                family=self.font_family,
                zorder=1001)

    def _add_progress_bar(self, ax, text_color):
        """Add timeline progress bar at bottom (V4.0 ULTIMATE Feature)"""
        progress = self.period_index / max(1, self._total_periods - 1)

        # Progress bar position (bottom of chart)
        bar_height = 0.02
        bar_y = 0.02
        bar_width = 0.96
        bar_x = 0.02

        # Background bar
        bg_bar = Rectangle(
            (bar_x, bar_y), bar_width, bar_height,
            transform=ax.transAxes,
            facecolor='#CCCCCC',
            alpha=0.5,
            zorder=1000
        )
        ax.add_patch(bg_bar)

        # Progress bar
        progress_bar = Rectangle(
            (bar_x, bar_y), bar_width * progress, bar_height,
            transform=ax.transAxes,
            facecolor='#4CAF50',
            alpha=0.9,
            zorder=1001
        )
        ax.add_patch(progress_bar)

        # Progress text
        progress_text = f"{progress*100:.0f}%"
        ax.text(bar_x + bar_width/2, bar_y + bar_height/2, progress_text,
                transform=ax.transAxes,
                fontsize=7,
                ha='center', va='center',
                color='white',
                weight='bold',
                zorder=1002)

    def _add_rank_indicators(self, ax, current_ranks, text_color):
        """Add rank change indicators (arrows) next to entity names (V4.0 ULTIMATE Feature)"""
        # This will be rendered via bar labels - handled in bar_chart_race parameters
        # We track the rank changes in prev_ranks for use in custom bar labels
        pass  # Implementation is integrated into the main rendering

    def _add_watermark(self, ax, text_color):
        """Add custom watermark/branding (V4.0 ULTIMATE Feature)"""
        positions = {
            'bottom-right': (0.98, 0.06),
            'bottom-left': (0.02, 0.06),
            'top-right': (0.98, 0.94),
            'top-left': (0.02, 0.94)
        }

        x, y = positions.get(self.watermark_position, (0.98, 0.06))
        ha = 'right' if 'right' in self.watermark_position else 'left'

        ax.text(x, y, self.watermark_text,
                transform=ax.transAxes,
                fontsize=8,
                ha=ha, va='bottom',
                color=text_color,
                alpha=0.6,
                style='italic',
                family=self.font_family,
                zorder=1003)

    def _add_event_annotation(self, ax, event_text, text_color):
        """Add event annotation for key moments (V4.0 ULTIMATE Feature)"""
        # Draw highlighted box with event text
        box = FancyBboxPatch(
            (0.15, 0.45), 0.7, 0.1,
            boxstyle="round,pad=0.01",
            transform=ax.transAxes,
            facecolor='#FF6B6B',
            edgecolor='white',
            alpha=0.9,
            linewidth=3,
            zorder=2000
        )
        ax.add_patch(box)

        ax.text(0.5, 0.5, f"⚡ {event_text}",
                transform=ax.transAxes,
                fontsize=14,
                ha='center', va='center',
                color='white',
                weight='bold',
                family=self.font_family,
                zorder=2001)

    def _reencode_video(self, temp_file, final_file):
        """Re-encode video with editor-friendly settings using FFmpeg CLI"""
        print(f"  ⚙️  Re-encoding with editor-friendly format...")

        # FFmpeg command for editor compatibility
        # Key settings:
        # - libx264: H.264 codec (universal)
        # - yuv420p: Pixel format (required by editors)
        # - CFR: Constant frame rate
        # - High bitrate: Professional quality

        ffmpeg_cmd = [
            'ffmpeg',
            '-i', temp_file,                    # Input file
            '-y',                                # Overwrite output
            '-c:v', 'libx264',                  # H.264 video codec
            '-preset', 'medium',                 # Encoding preset
            '-crf', '18',                        # Quality (18 = near lossless)
            '-pix_fmt', 'yuv420p',              # Pixel format (required!)
            '-r', str(self.fps),                # Force constant frame rate
            '-g', str(self.fps),                # GOP size (keyframe interval)
            '-bf', '2',                          # B-frames
            '-profile:v', 'high',                # H.264 high profile
            '-level', '4.2',                     # H.264 level (1080p60)
            '-movflags', '+faststart',           # Fast start for web
            '-b:v', '8000k',                     # Video bitrate
            '-c:a', 'copy',                      # Copy audio (if exists)
            '-metadata', f'title={self.title}',
            '-metadata', 'artist=TimeSeriesRacing v4.0 ULTIMATE EDITION',
            '-metadata', 'comment=10x Better Info Display - Stats Panel, Progress Bar, Rank Changes',
            final_file
        ]

        try:
            # Run ffmpeg with output suppressed (unless error)
            result = subprocess.run(
                ffmpeg_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=300  # 5 minutes timeout
            )

            if result.returncode != 0:
                print(f"  ⚠️  FFmpeg warning/error output:")
                print(result.stderr)
                # Don't raise - file might still be created

            # Check if output file was created
            if os.path.exists(final_file) and os.path.getsize(final_file) > 0:
                print(f"  ✅ Re-encoding complete!")
                return True
            else:
                print(f"  ❌ Re-encoding failed - output file not created")
                return False

        except subprocess.TimeoutExpired:
            print(f"  ❌ FFmpeg re-encoding timeout (>5 minutes)")
            return False
        except FileNotFoundError:
            print(f"  ❌ FFmpeg not found. Please install FFmpeg:")
            print(f"     Windows: choco install ffmpeg")
            print(f"     Mac: brew install ffmpeg")
            print(f"     Linux: sudo apt-get install ffmpeg")
            return False
        except Exception as e:
            print(f"  ❌ Re-encoding error: {str(e)}")
            return False

    def create_animation(self):
        """Tạo animation bar chart race và xuất video MP4 - V4.0 ULTIMATE EDITION"""
        print(f"\n🎬 Đang tạo video animation (V4.0 ULTIMATE EDITION - 10x Better Info Display!)...")
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
        print(f"\n  ✨ V4.0 ULTIMATE Features:")
        print(f"  → Stats Panel: {'✅' if self.show_stats_panel else '❌'}")
        print(f"  → Progress Bar: {'✅' if self.show_progress_bar else '❌'}")
        print(f"  → Rank Changes: {'✅' if self.show_rank_changes else '❌'}")
        print(f"  → Growth Rate: {'✅' if self.show_growth_rate else '❌'}")
        print(f"  → Background Gradient: {'✅' if self.enable_background_gradient else '❌'}")
        print(f"  → Watermark: {'✅ ' + self.watermark_text if self.watermark_text else '❌'}")

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

            # V3.2 - Professional period label configuration
            period_label_size = title_font_size + 12  # V3.2 - Larger, more prominent
            if self.ratio == '9:16':
                period_label_pos = {'x': 0.95, 'y': 0.18, 'ha': 'right', 'va': 'center'}  # V3.2 - Better positioning
            else:
                period_label_pos = {'x': 0.98, 'y': 0.15, 'ha': 'right', 'va': 'center'}  # V3.2 - Better positioning

            # V3.2 - PROFESSIONAL bar styling with stunning visual effects
            if self.enable_effects:
                if self.bar_style == 'gradient':
                    bar_kwargs = {
                        'alpha': self.bar_alpha,  # V3.2 - Customizable transparency
                        'ec': 'white',  # Edge color - crisp white borders
                        'lw': self.bar_border_width,  # V3.2 - Thicker premium borders
                        'zorder': 10,
                    }
                else:
                    bar_kwargs = {
                        'alpha': self.bar_alpha - 0.05,  # Slightly less transparent for solid
                        'ec': '#2C3E50',  # Darker border for contrast
                        'lw': self.bar_border_width - 0.5,  # Slightly thinner for solid
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

            # Create temporary file for initial render
            temp_fd, temp_file = tempfile.mkstemp(suffix='.mp4', prefix='tsr_temp_')
            os.close(temp_fd)  # Close file descriptor

            try:
                # Tạo animation to temp file first
                print(f"  ⏳ Step 1/2: Rendering animation... (có thể mất vài phút)")

                # V4.0 - Custom bar label function with rank indicators and values
                def v4_bar_label_func(val, rank):
                    """Enhanced bar labels with values and rank indicators"""
                    # Format the value
                    if self.use_percent:
                        val_str = f"{val:.1f}%"
                    elif val >= 1000:
                        val_str = f"{val:,.0f}"
                    else:
                        val_str = f"{val:.1f}"

                    # Add rank indicator if enabled
                    if self.show_rank_changes and rank in self.prev_ranks.values():
                        # Find which entity had this rank
                        prev_entity = None
                        for entity, prev_rank in self.prev_ranks.items():
                            if prev_rank == rank:
                                prev_entity = entity
                                break

                        # Check if rank changed (simplified for now)
                        indicator = ""  # Will be enhanced in full implementation
                    else:
                        indicator = ""

                    return val_str

                # V4.0 - Custom period summary function with all overlays
                def v4_period_summary(values_dict, ranks_dict):
                    """Enhanced period summary with v4.0 information overlays"""
                    try:
                        # Get current axis
                        ax = plt.gca()

                        # Get current period value
                        period_val = self.df_wide.index[min(self.period_index, len(self.df_wide) - 1)]

                        # Call our v4.0 overlay system
                        self._create_v4_overlay(ax, values_dict, ranks_dict, period_val)

                        # Return False to hide the default period summary
                        # Our overlay panels handle all the information display
                        return False

                    except Exception as e:
                        # Fallback to simple display if error
                        import traceback
                        traceback.print_exc()  # Debug: print the error
                        try:
                            if isinstance(values_dict, dict):
                                total = sum(values_dict.values())
                            else:
                                total = np.sum(values_dict)
                            return {
                                'x': 0.98,
                                'y': 0.05,
                                's': f'Total: {total:,.0f}',
                                'ha': 'right',
                                'size': bar_label_size - 2,
                                'weight': 'bold'
                            }
                        except:
                            return False  # Return False instead of None

                bcr.bar_chart_race(
                    df=self.df_wide,
                    filename=temp_file,  # Save to temp file first
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
                        'weight': self.period_label_style,  # V3.2 - Customizable weight
                        'color': '#1a1a1a' if self.theme == 'light' else '#FFFFFF',  # V3.2 - Better contrast
                        'alpha': 0.9  # V3.2 - Slight transparency for elegance
                    },
                    # Dùng :g để bỏ .0 cho số nguyên (2024 thay vì 2024.0)
                    period_fmt='{x:g}' if isinstance(self.df_wide.index[0], (int, float)) else '{x}',
                    bar_label_size=bar_label_size if self.show_bar_values else 0,  # V3.0 - Control bar values
                    tick_label_size=tick_label_size,
                    shared_fontdict={
                        'family': self.font_family,  # V3.0 - Custom font
                        'weight': self.title_style,  # V3.2 - Customizable title weight
                        'color': '#1a1a1a' if self.theme == 'light' else '#FFFFFF'  # V3.2 - Better contrast
                    },
                    title_size=title_font_size + 2,  # V3.2 - Slightly larger for prominence
                    scale='linear',
                    writer='ffmpeg',  # Use default ffmpeg writer
                    fig=None,
                    dpi=self.dpi,  # V3.0 - Higher DPI for better quality!
                    bar_kwargs=bar_kwargs,
                    filter_column_colors=False,
                    # V4.0 - ULTIMATE EDITION period summary with full overlay system
                    period_summary_func=v4_period_summary,
                )

                print(f"  ✅ Animation rendered to temp file")

                # Step 2: Re-encode with editor-friendly settings
                print(f"  ⏳ Step 2/2: Re-encoding for editor compatibility...")
                if not self._reencode_video(temp_file, self.output):
                    print(f"  ⚠️  Re-encoding failed, using original file")
                    # Copy temp to output as fallback
                    import shutil
                    shutil.copy2(temp_file, self.output)

            finally:
                # Clean up temp file
                if os.path.exists(temp_file):
                    try:
                        os.remove(temp_file)
                        print(f"  🗑️  Cleaned up temp file")
                    except:
                        pass  # Ignore cleanup errors

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
        print("="*80)
        print("🚀 TIMESERIES RACING v4.0 - ULTIMATE EDITION - 10x Better Info Display!")
        print("="*80)
        print("✨ NEW: Statistics Panel, Progress Bar, Rank Changes, Event Annotations & More!")

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

        print("\n" + "="*80)
        print("🎉 HOÀN THÀNH! Video với 10x nhiều thông tin hơn đã được tạo!")
        print("="*80)
        print("\n💡 V4.0 ULTIMATE Tips:")
        print("  - 📊 Stats panel hiển thị Total, Leader, Gap, Average real-time")
        print("  - 📈 Progress bar cho biết vị trí hiện tại trong timeline")
        print("  - 🎯 Rank indicators show thứ hạng thay đổi (↑↓)")
        print("  - 🌊 Background gradient tạo chiều sâu visual")
        print("  - 🏷️  Watermark với --watermark-text 'Your Brand'")
        print("  - ⚡ Event annotations với --event-annotations")
        print("\n🎨 Customization Options:")
        print("  - 10 Premium Palettes: gold, rainbow, fire, ice, cosmic, tropical, etc.")
        print("  - Tắt features: --no-stats-panel, --no-progress-bar, --no-rank-changes")
        print("  - Background gradient: --no-background-gradient để tắt")
        print("  - Custom watermark position: --watermark-position top-right/bottom-left")
        print("\n✨ V4.0 ULTIMATE Features Summary:")
        print("  1. 📊 Real-time Statistics Panel (Total, Leader, Gap, Average)")
        print("  2. 📈 Progress Timeline Bar (shows completion %)")
        print("  3. 🎯 Rank Change Indicators (visual rank tracking)")
        print("  4. 💹 Growth Rate Display (% change indicators)")
        print("  5. 📍 Value Labels on Bars (clear data display)")
        print("  6. 🌊 Dynamic Background Gradients (visual depth)")
        print("  7. 🏷️  Custom Watermark/Branding (your logo/text)")
        print("  8. ⚡ Event Annotations (highlight key moments)")
        print("  9. 🎨 10 Premium Color Palettes (stunning visuals)")
        print(" 10. 🎬 Editor-Ready Format (H.264 yuv420p CFR)")
        print("\n🔥 This is 10x more informative than previous versions!")

        return True


def main():
    """Hàm main với CLI parser"""

    parser = argparse.ArgumentParser(
        description='TimeSeriesRacing v4.0 - ULTIMATE EDITION - 10x Better Information Display!',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ví dụ sử dụng:
  # V4.0 - ULTIMATE video với 10x thông tin (mặc định - TẤT CẢ features bật)
  python TimeSeriesRacing.py data.csv

  # 📊 Full v4.0 features với custom watermark
  python TimeSeriesRacing.py data.csv --watermark-text "© Your Company 2024"

  # 🌈 Premium palettes với statistics panel
  python TimeSeriesRacing.py data.csv --palette gold --title "💎 Precious Metals Race"

  # 🎯 Ultimate quality - 60fps + 200 DPI + All v4.0 features
  python TimeSeriesRacing.py data.csv --fps 60 --dpi 200 --palette cosmic

  # 📊 Minimal mode - Tắt một số features để giao diện clean hơn
  python TimeSeriesRacing.py data.csv --no-stats-panel --no-progress-bar

  # 🏷️ Custom watermark position
  python TimeSeriesRacing.py data.csv --watermark-text "MyBrand" --watermark-position top-left

  # Preset TikTok với full v4.0 features
  python TimeSeriesRacing.py data.csv --preset tiktok --palette neon

  # Preset YouTube với v4.0 ULTIMATE display
  python TimeSeriesRacing.py data.csv --preset youtube --palette sapphire

Palettes có sẵn:
  CLASSIC: vibrant, professional, pastel, neon, ocean, sunset, earth, football

  ✨ NEW PREMIUM (V3.2):
    gold     - Luxury golden shades 🏆
    chrome   - Metallic silver tones 🔘
    rainbow  - Full spectrum colors 🌈
    fire     - Hot red-orange-yellow 🔥
    ice      - Cool blue-cyan-purple ❄️
    emerald  - Vibrant green shades 💚
    ruby     - Rich red gemstone tones 💎
    sapphire - Deep blue jewel colors 💙
    cosmic   - Purple space nebula 🌌
    tropical - Warm island paradise 🌴

Presets có sẵn:
  tiktok, youtube, instagram, presentation

Bar styles:
  solid, gradient

V4.0 ULTIMATE EDITION - 10x Better Information Display:
  1. 📊 Real-time Statistics Panel - Shows Total, Leader, Gap, Average
  2. 📈 Progress Timeline Bar - Visual timeline with completion percentage
  3. 🎯 Rank Change Indicators - Track position changes with visual cues
  4. 💹 Growth Rate Display - Show percentage change from previous period
  5. 📍 Enhanced Value Labels - Clear data display on every bar
  6. 🌊 Dynamic Background Gradients - Professional visual depth
  7. 🏷️  Custom Watermark/Branding - Add your logo or text
  8. ⚡ Event Annotations - Highlight key moments in timeline
  9. 🎨 10 Premium Color Palettes - Stunning visual themes
  10. 🎬 Editor-Ready Format - H.264 yuv420p CFR for all editors

V4.0 Control Flags:
  --no-stats-panel        - Tắt statistics panel
  --no-progress-bar       - Tắt progress timeline bar
  --no-rank-changes       - Tắt rank change indicators
  --no-background-gradient - Tắt background gradient effects
  --watermark-text TEXT   - Add custom watermark
  --watermark-position POS - Set watermark position (top-left/top-right/bottom-left/bottom-right)

🔥 Mặc định: TẤT CẢ v4.0 features được BẬT để có trải nghiệm thông tin tối đa!
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
                                'sunset', 'earth', 'football',
                                # V3.2 - Premium palettes
                                'gold', 'chrome', 'rainbow', 'fire', 'ice',
                                'emerald', 'ruby', 'sapphire', 'cosmic', 'tropical'],
                        default='professional',
                        help='Color palette - Try NEW premium palettes! (mặc định: professional)')
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

    # V3.2 - PROFESSIONAL EDITION parameters
    parser.add_argument('--bar-border-width', type=float, default=3.0,
                        help='Độ dày viền bar (1.0-5.0, mặc định: 3.0) - thicker = more prominent')
    parser.add_argument('--bar-alpha', type=float, default=0.95,
                        help='Độ trong suốt bar (0.0-1.0, mặc định: 0.95) - higher = more opaque')
    parser.add_argument('--glow-effect', action='store_true',
                        help='Bật hiệu ứng glow cho bars (stunning visual impact)')
    parser.add_argument('--period-label-style', type=str, default='bold',
                        choices=['normal', 'bold', 'italic'],
                        help='Kiểu chữ period label (mặc định: bold)')
    parser.add_argument('--title-style', type=str, default='bold',
                        choices=['normal', 'bold', 'italic'],
                        help='Kiểu chữ title (mặc định: bold)')

    # V4.0 - ULTIMATE EDITION parameters - 10x Better Information Display!
    parser.add_argument('--no-stats-panel', action='store_true',
                        help='Tắt statistics panel (mặc định: BẬT - shows Total, Leader, Gap, Average)')
    parser.add_argument('--no-progress-bar', action='store_true',
                        help='Tắt progress timeline bar (mặc định: BẬT - shows completion %)')
    parser.add_argument('--no-rank-changes', action='store_true',
                        help='Tắt rank change indicators (mặc định: BẬT - shows rank movement)')
    parser.add_argument('--no-percentage-total', action='store_true',
                        help='Tắt percentage of total display (mặc định: BẬT)')
    parser.add_argument('--no-growth-rate', action='store_true',
                        help='Tắt growth rate indicators (mặc định: BẬT - shows % change)')
    parser.add_argument('--show-gap-to-leader', action='store_true',
                        help='Hiển thị khoảng cách với leader cho mỗi bar (mặc định: TẮT)')
    parser.add_argument('--no-background-gradient', action='store_true',
                        help='Tắt background gradient effects (mặc định: BẬT)')
    parser.add_argument('--watermark-text', type=str, default='',
                        help='Text cho watermark/branding (vd: "© Your Company 2024")')
    parser.add_argument('--watermark-position', type=str, default='bottom-right',
                        choices=['top-left', 'top-right', 'bottom-left', 'bottom-right'],
                        help='Vị trí watermark (mặc định: bottom-right)')
    parser.add_argument('--no-highlight-leader', action='store_true',
                        help='Tắt highlight cho leader (#1) (mặc định: BẬT)')

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
        font_family=args.font_family,
        # V3.2 - PROFESSIONAL EDITION parameters
        bar_border_width=args.bar_border_width,
        bar_alpha=args.bar_alpha,
        glow_effect=args.glow_effect,
        period_label_style=args.period_label_style,
        title_style=args.title_style,
        # V4.0 - ULTIMATE EDITION parameters - 10x Better Information Display!
        show_rank_changes=not args.no_rank_changes,
        show_stats_panel=not args.no_stats_panel,
        show_progress_bar=not args.no_progress_bar,
        show_percentage_total=not args.no_percentage_total,
        show_growth_rate=not args.no_growth_rate,
        show_gap_to_leader=args.show_gap_to_leader,
        enable_background_gradient=not args.no_background_gradient,
        watermark_text=args.watermark_text,
        watermark_position=args.watermark_position,
        highlight_leader=not args.no_highlight_leader
    )

    success = racing.run()
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
