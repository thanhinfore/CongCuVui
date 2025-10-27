#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TimeSeriesRacing - Tạo video biểu đồ động (bar chart race) từ dữ liệu time series
Hỗ trợ CSV, Excel, JSON với tự động nhận dạng cấu trúc dữ liệu
"""

import pandas as pd
import bar_chart_race as bcr
import argparse
import sys
import os
from pathlib import Path
import warnings

warnings.filterwarnings('ignore')


class TimeSeriesRacing:
    """Lớp chính để xử lý và tạo video bar chart race"""

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
        self.period_length = kwargs.get('period_length', 500)
        self.steps_per_period = kwargs.get('steps_per_period', 10)

        self.df = None
        self.df_wide = None

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

    def create_animation(self):
        """Tạo animation bar chart race và xuất video MP4"""
        print(f"\n🎬 Đang tạo video animation...")
        print(f"  → Tiêu đề: {self.title}")
        print(f"  → Top {self.top_n} thực thể")
        print(f"  → FPS: {self.fps}")
        print(f"  → Tỷ lệ: {self.ratio}")

        try:
            # Cấu hình kích thước theo tỷ lệ
            if self.ratio == '9:16':
                figsize = (5, 8.89)  # Portrait cho TikTok/Reels
            else:
                figsize = (10, 5.625)  # Landscape 16:9

            # Chọn colormap theo theme
            if self.theme == 'dark':
                cmap = 'plasma'
                colors = None
            else:
                cmap = 'tab20'
                colors = None

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
                cmap=cmap,
                bar_size=0.95,
                period_label={
                    'x': 0.98,
                    'y': 0.1,
                    'ha': 'right',
                    'va': 'center',
                    'size': 24,
                    'weight': 'bold'
                },
                period_fmt='{x:.0f}' if isinstance(self.df_wide.index[0], (int, float)) else '{x}',
                bar_label_size=10,
                tick_label_size=10,
                shared_fontdict={'family': 'sans-serif', 'weight': 'bold'},
                scale='linear',
                writer='ffmpeg',
                fig=None,
                bar_kwargs={'alpha': 0.8, 'ec': 'white', 'lw': 1.5},
                filter_column_colors=False
            )

            print(f"\n✅ Video đã được tạo thành công: {self.output}")

            # Hiển thị thông tin file
            file_size = os.path.getsize(self.output) / (1024 * 1024)  # MB
            print(f"  → Kích thước: {file_size:.2f} MB")

            return True

        except Exception as e:
            print(f"❌ Lỗi khi tạo video: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

    def run(self):
        """Chạy toàn bộ quy trình"""
        print("="*60)
        print("🎥 TIMESERIES RACING - TẠO VIDEO BIỂU ĐỒ ĐỘNG")
        print("="*60)

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

        print("\n" + "="*60)
        print("🎉 HOÀN THÀNH!")
        print("="*60)

        return True


def main():
    """Hàm main với CLI parser"""

    parser = argparse.ArgumentParser(
        description='TimeSeriesRacing - Tạo video biểu đồ động từ dữ liệu time series',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ví dụ sử dụng:
  # Cách đơn giản nhất
  python TimeSeriesRacing.py data.csv

  # Với các tùy chọn
  python TimeSeriesRacing.py data.csv --title "Evolution of Coding" --top 10 --fps 30

  # Chỉ định cột cụ thể (long format)
  python TimeSeriesRacing.py data.csv --time year --entity language --value popularity

  # Xuất video dạng portrait cho TikTok/Reels
  python TimeSeriesRacing.py data.csv --ratio 9:16 --output tiktok.mp4

  # Hiển thị dữ liệu dạng phần trăm
  python TimeSeriesRacing.py data.csv --percent --title "Market Share Evolution"

Định dạng dữ liệu được hỗ trợ:
  - CSV (.csv)
  - Excel (.xlsx, .xls)
  - JSON (.json)

Cấu trúc dữ liệu:
  1. Long format (3 cột):
     year, language, popularity
     1992, C, 71.41
     1992, C++, 20.36

  2. Wide format (nhiều cột):
     year, C, C++, Java, JS
     1992, 71.4, 20.3, 0, 0
     1996, 59.1, 17.2, 12, 11
        """
    )

    # Tham số bắt buộc
    parser.add_argument('input', help='File dữ liệu đầu vào (CSV, Excel, JSON)')

    # Tham số tùy chọn
    parser.add_argument('--title', type=str, default='Evolution of Data',
                        help='Tiêu đề video (mặc định: "Evolution of Data")')
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
    parser.add_argument('--period-length', type=int, default=500,
                        help='Độ dài mỗi period (ms) (mặc định: 500)')
    parser.add_argument('--steps-per-period', type=int, default=10,
                        help='Số bước mỗi period (mặc định: 10)')

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
        steps_per_period=args.steps_per_period
    )

    success = racing.run()
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
