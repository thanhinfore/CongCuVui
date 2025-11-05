#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VideoSilenceTrim - Automatic Silence Removal from Videos
Author: CongCuVui Project
Version: 1.0.0

Chương trình tự động phát hiện và loại bỏ các đoạn im lặng trong video,
giữ lại các phần có âm thanh với margin buffer để chuyển tiếp mượt mà.
"""

import os
import sys
import re
import json
import subprocess
import argparse
from pathlib import Path
from typing import List, Tuple, Dict, Optional
from dataclasses import dataclass
import logging


@dataclass
class SilenceInterval:
    """Đại diện cho một khoảng thời gian im lặng trong video"""
    start: float
    end: float

    def __repr__(self):
        return f"SilenceInterval(start={self.start:.2f}s, end={self.end:.2f}s)"


@dataclass
class KeepSegment:
    """Đại diện cho một đoạn video cần giữ lại"""
    start: float
    end: float

    def duration(self) -> float:
        return self.end - self.start

    def __repr__(self):
        return f"KeepSegment(start={self.start:.2f}s, end={self.end:.2f}s, duration={self.duration():.2f}s)"


class VideoSilenceTrimConfig:
    """Cấu hình cho quá trình trim silence"""

    def __init__(self,
                 silence_threshold: str = '-35dB',
                 min_silence_duration: float = 0.5,
                 margin_seconds: float = 0.5,
                 min_segment_duration: float = 0.05,
                 video_codec: str = 'libx264',
                 video_preset: str = 'veryfast',
                 audio_codec: str = 'aac',
                 audio_bitrate: str = '192k'):
        """
        Args:
            silence_threshold: Ngưỡng âm thanh để coi là im lặng (dB)
            min_silence_duration: Độ dài tối thiểu của đoạn im lặng (giây)
            margin_seconds: Thời gian buffer trước/sau mỗi đoạn âm thanh (giây)
            min_segment_duration: Độ dài tối thiểu của segment để giữ lại (giây)
            video_codec: Codec video để encode
            video_preset: Preset cho encoding video
            audio_codec: Codec audio để encode
            audio_bitrate: Bitrate cho audio
        """
        self.silence_threshold = silence_threshold
        self.min_silence_duration = min_silence_duration
        self.margin_seconds = margin_seconds
        self.min_segment_duration = min_segment_duration
        self.video_codec = video_codec
        self.video_preset = video_preset
        self.audio_codec = audio_codec
        self.audio_bitrate = audio_bitrate

    @classmethod
    def from_file(cls, config_file: str) -> 'VideoSilenceTrimConfig':
        """Load configuration từ file JSON"""
        with open(config_file, 'r', encoding='utf-8') as f:
            config_data = json.load(f)
        return cls(**config_data)

    def to_file(self, config_file: str):
        """Lưu configuration vào file JSON"""
        config_data = {
            'silence_threshold': self.silence_threshold,
            'min_silence_duration': self.min_silence_duration,
            'margin_seconds': self.margin_seconds,
            'min_segment_duration': self.min_segment_duration,
            'video_codec': self.video_codec,
            'video_preset': self.video_preset,
            'audio_codec': self.audio_codec,
            'audio_bitrate': self.audio_bitrate
        }
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(config_data, f, indent=4, ensure_ascii=False)


class VideoSilenceTrim:
    """Class chính để xử lý video trimming"""

    def __init__(self, config: Optional[VideoSilenceTrimConfig] = None):
        """
        Args:
            config: Configuration object, nếu None sẽ dùng config mặc định
        """
        self.config = config or VideoSilenceTrimConfig()
        self.logger = self._setup_logger()
        self._check_ffmpeg()

    def _setup_logger(self) -> logging.Logger:
        """Thiết lập logger"""
        logger = logging.getLogger('VideoSilenceTrim')
        logger.setLevel(logging.INFO)

        if not logger.handlers:
            handler = logging.StreamHandler(sys.stdout)
            handler.setLevel(logging.INFO)
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)

        return logger

    def _check_ffmpeg(self):
        """Kiểm tra FFmpeg có được cài đặt không"""
        try:
            result = subprocess.run(
                ['ffmpeg', '-version'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=True
            )
            self.logger.info("✓ FFmpeg đã được cài đặt")
        except (subprocess.CalledProcessError, FileNotFoundError):
            self.logger.error("✗ FFmpeg chưa được cài đặt!")
            self.logger.error("Vui lòng cài đặt FFmpeg: https://ffmpeg.org/download.html")
            sys.exit(1)

    def get_video_duration(self, video_path: str) -> float:
        """
        Lấy độ dài của video

        Args:
            video_path: Đường dẫn đến file video

        Returns:
            Độ dài video (giây)
        """
        self.logger.info(f"Đang lấy thông tin video: {Path(video_path).name}")

        cmd = [
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            video_path
        ]

        try:
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=True,
                encoding='utf-8'
            )
            duration = float(result.stdout.strip())
            self.logger.info(f"✓ Độ dài video: {duration:.2f}s ({duration/60:.2f} phút)")
            return duration
        except subprocess.CalledProcessError as e:
            self.logger.error(f"Lỗi khi lấy thông tin video: {e.stderr}")
            raise
        except ValueError:
            self.logger.error("Không thể parse độ dài video")
            raise

    def detect_silence(self, video_path: str) -> List[SilenceInterval]:
        """
        Phát hiện các đoạn im lặng trong video

        Args:
            video_path: Đường dẫn đến file video

        Returns:
            List các SilenceInterval
        """
        self.logger.info("Đang phát hiện các đoạn im lặng...")
        self.logger.info(f"  - Ngưỡng: {self.config.silence_threshold}")
        self.logger.info(f"  - Độ dài tối thiểu: {self.config.min_silence_duration}s")

        # FFmpeg command để detect silence
        cmd = [
            'ffmpeg',
            '-i', video_path,
            '-af', f'silencedetect=noise={self.config.silence_threshold}:d={self.config.min_silence_duration}',
            '-f', 'null',
            '-'
        ]

        try:
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                encoding='utf-8'
            )

            # Parse silence intervals từ stderr output
            silence_intervals = self._parse_silence_segments(result.stderr)

            self.logger.info(f"✓ Phát hiện được {len(silence_intervals)} đoạn im lặng")
            for i, interval in enumerate(silence_intervals, 1):
                self.logger.info(f"  {i}. {interval}")

            return silence_intervals

        except subprocess.CalledProcessError as e:
            self.logger.error(f"Lỗi khi phát hiện silence: {e.stderr}")
            raise

    def _parse_silence_segments(self, ffmpeg_log: str) -> List[SilenceInterval]:
        """
        Parse log output từ FFmpeg để lấy silence intervals

        Args:
            ffmpeg_log: Output log từ FFmpeg

        Returns:
            List các SilenceInterval
        """
        silence_intervals = []

        # Regex patterns để match silence_start và silence_end
        start_pattern = re.compile(r'silence_start:\s*(\d+\.?\d*)')
        end_pattern = re.compile(r'silence_end:\s*(\d+\.?\d*)')

        silence_start = None

        for line in ffmpeg_log.split('\n'):
            start_match = start_pattern.search(line)
            if start_match:
                silence_start = float(start_match.group(1))

            end_match = end_pattern.search(line)
            if end_match and silence_start is not None:
                silence_end = float(end_match.group(1))
                silence_intervals.append(SilenceInterval(silence_start, silence_end))
                silence_start = None

        return silence_intervals

    def derive_keep_segments(self,
                            silence_intervals: List[SilenceInterval],
                            video_duration: float) -> List[KeepSegment]:
        """
        Tính toán các segment cần giữ lại dựa trên silence intervals

        Args:
            silence_intervals: List các khoảng im lặng
            video_duration: Độ dài tổng của video

        Returns:
            List các KeepSegment
        """
        self.logger.info("Đang tính toán các segment cần giữ lại...")

        keep_segments = []
        current_time = 0.0

        for silence in silence_intervals:
            # Thêm segment từ current_time đến start của silence (với margin)
            segment_end = max(0, silence.start - self.config.margin_seconds)

            if segment_end > current_time:
                keep_segments.append(KeepSegment(current_time, segment_end))

            # Di chuyển current_time đến sau đoạn silence (với margin)
            current_time = min(video_duration, silence.end + self.config.margin_seconds)

        # Thêm segment cuối cùng nếu còn
        if current_time < video_duration:
            keep_segments.append(KeepSegment(current_time, video_duration))

        # Lọc bỏ các segment quá ngắn
        keep_segments = [
            seg for seg in keep_segments
            if seg.duration() >= self.config.min_segment_duration
        ]

        total_duration = sum(seg.duration() for seg in keep_segments)
        reduction = ((video_duration - total_duration) / video_duration) * 100

        self.logger.info(f"✓ Tìm được {len(keep_segments)} segment để giữ lại")
        self.logger.info(f"  - Độ dài gốc: {video_duration:.2f}s")
        self.logger.info(f"  - Độ dài sau trim: {total_duration:.2f}s")
        self.logger.info(f"  - Giảm: {reduction:.1f}%")

        for i, seg in enumerate(keep_segments, 1):
            self.logger.info(f"  {i}. {seg}")

        return keep_segments

    def trim_video_concat_demuxer(self,
                                   video_path: str,
                                   keep_segments: List[KeepSegment],
                                   output_path: str):
        """
        Trim video sử dụng concat demuxer (cho nhiều segments)
        Phương pháp này ổn định hơn khi có nhiều segments

        Args:
            video_path: Đường dẫn video gốc
            keep_segments: List các segment cần giữ
            output_path: Đường dẫn output
        """
        import tempfile
        import shutil

        temp_dir = None
        try:
            # Tạo thư mục tạm
            temp_dir = tempfile.mkdtemp(prefix='video_trim_')
            self.logger.info(f"Sử dụng concat demuxer (ổn định hơn cho {len(keep_segments)} segments)")

            # Step 1: Trim từng segment ra file riêng
            segment_files = []
            for i, seg in enumerate(keep_segments):
                segment_file = os.path.join(temp_dir, f"segment_{i:04d}.mp4")
                segment_files.append(segment_file)

                # Trim segment này
                cmd = [
                    'ffmpeg',
                    '-i', video_path,
                    '-ss', str(seg.start),
                    '-to', str(seg.end),
                    '-c', 'copy',  # Copy codec (nhanh, không re-encode)
                    '-avoid_negative_ts', 'make_zero',
                    '-y',
                    segment_file
                ]

                if i == 0:
                    self.logger.info(f"Đang tạo {len(keep_segments)} segments tạm...")
                if (i + 1) % 10 == 0:
                    print(f"\r  Đã tạo {i + 1}/{len(keep_segments)} segments...", end='', flush=True)

                result = subprocess.run(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    encoding='utf-8'
                )

                if result.returncode != 0:
                    raise Exception(f"Lỗi khi tạo segment {i}: {result.stderr[-500:]}")

            print()  # New line

            # Step 2: Tạo concat list file
            concat_file = os.path.join(temp_dir, 'concat_list.txt')
            with open(concat_file, 'w', encoding='utf-8') as f:
                for seg_file in segment_files:
                    # Escape single quotes trong path
                    escaped_path = seg_file.replace("'", "'\\''")
                    f.write(f"file '{escaped_path}'\n")

            # Step 3: Concat tất cả segments
            self.logger.info("Đang ghép các segments...")
            cmd = [
                'ffmpeg',
                '-f', 'concat',
                '-safe', '0',
                '-i', concat_file,
                '-c:v', self.config.video_codec,
                '-preset', self.config.video_preset,
                '-c:a', self.config.audio_codec,
                '-b:a', self.config.audio_bitrate,
                '-y',
                output_path
            ]

            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                encoding='utf-8',
                universal_newlines=True
            )

            # Hiển thị progress
            all_output = []
            for line in process.stdout:
                all_output.append(line)
                if 'time=' in line:
                    time_match = re.search(r'time=(\d+:\d+:\d+\.\d+)', line)
                    if time_match:
                        print(f"\r  Tiến trình: {time_match.group(1)}", end='', flush=True)

            print()  # New line
            process.wait()

            if process.returncode == 0:
                output_size = os.path.getsize(output_path) / (1024 * 1024)  # MB
                self.logger.info(f"✓ Trim video thành công!")
                self.logger.info(f"  Output: {output_path}")
                self.logger.info(f"  Kích thước: {output_size:.2f} MB")
            else:
                self.logger.error("Lỗi khi concat segments!")
                self.logger.error("FFmpeg output:")
                for line in all_output[-20:]:
                    self.logger.error(f"  {line.rstrip()}")
                raise Exception("FFmpeg concat failed")

        finally:
            # Cleanup temp directory
            if temp_dir and os.path.exists(temp_dir):
                try:
                    shutil.rmtree(temp_dir)
                    self.logger.debug(f"Đã xóa thư mục tạm: {temp_dir}")
                except Exception as e:
                    self.logger.warning(f"Không thể xóa thư mục tạm: {e}")

    def trim_video(self,
                   video_path: str,
                   keep_segments: List[KeepSegment],
                   output_path: str):
        """
        Trim video theo các keep segments

        Args:
            video_path: Đường dẫn video gốc
            keep_segments: List các segment cần giữ
            output_path: Đường dẫn output
        """
        if not keep_segments:
            self.logger.warning("Không có segment nào để giữ lại!")
            return

        # Nếu có quá nhiều segments (>20), dùng concat demuxer
        if len(keep_segments) > 20:
            self.trim_video_concat_demuxer(video_path, keep_segments, output_path)
            return

        self.logger.info(f"Đang trim video...")

        # Build FFmpeg filter_complex
        filter_parts = []

        for i, seg in enumerate(keep_segments):
            # Video trim
            filter_parts.append(
                f"[0:v]trim=start={seg.start:.3f}:end={seg.end:.3f},"
                f"setpts=PTS-STARTPTS[v{i}]"
            )
            # Audio trim
            filter_parts.append(
                f"[0:a]atrim=start={seg.start:.3f}:end={seg.end:.3f},"
                f"asetpts=PTS-STARTPTS[a{i}]"
            )

        # Concat tất cả segments
        video_inputs = ''.join(f"[v{i}]" for i in range(len(keep_segments)))
        audio_inputs = ''.join(f"[a{i}]" for i in range(len(keep_segments)))

        filter_parts.append(
            f"{video_inputs}{audio_inputs}concat=n={len(keep_segments)}:v=1:a=1[outv][outa]"
        )

        filter_complex = ';'.join(filter_parts)

        # Build FFmpeg command
        cmd = [
            'ffmpeg',
            '-i', video_path,
            '-filter_complex', filter_complex,
            '-map', '[outv]',
            '-map', '[outa]',
            '-c:v', self.config.video_codec,
            '-preset', self.config.video_preset,
            '-c:a', self.config.audio_codec,
            '-b:a', self.config.audio_bitrate,
            '-y',  # Overwrite output file
            output_path
        ]

        try:
            # Run FFmpeg với progress output
            self.logger.info("FFmpeg đang xử lý...")

            # Debug: log filter complex nếu ở debug mode
            if self.logger.level == logging.DEBUG:
                self.logger.debug("Filter complex:")
                self.logger.debug(filter_complex)

            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                encoding='utf-8',
                universal_newlines=True
            )

            # Capture tất cả output
            all_output = []
            for line in process.stdout:
                all_output.append(line)
                if 'time=' in line:
                    # Extract time info để hiển thị progress
                    time_match = re.search(r'time=(\d+:\d+:\d+\.\d+)', line)
                    if time_match:
                        print(f"\r  Tiến trình: {time_match.group(1)}", end='', flush=True)

            print()  # New line sau progress
            process.wait()

            if process.returncode == 0:
                output_size = os.path.getsize(output_path) / (1024 * 1024)  # MB
                self.logger.info(f"✓ Trim video thành công!")
                self.logger.info(f"  Output: {output_path}")
                self.logger.info(f"  Kích thước: {output_size:.2f} MB")
            else:
                self.logger.error("Lỗi khi trim video!")
                self.logger.error("FFmpeg output:")
                # Hiển thị 20 dòng cuối của output để debug
                for line in all_output[-20:]:
                    self.logger.error(f"  {line.rstrip()}")

        except Exception as e:
            self.logger.error(f"Lỗi: {e}")
            raise

    def process_video(self,
                     input_path: str,
                     output_path: Optional[str] = None) -> str:
        """
        Process video hoàn chỉnh: detect silence và trim

        Args:
            input_path: Đường dẫn video input
            output_path: Đường dẫn video output (optional)

        Returns:
            Đường dẫn đến file output
        """
        # Validate input
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"File không tồn tại: {input_path}")

        # Generate output path nếu không được cung cấp
        if output_path is None:
            input_path_obj = Path(input_path)
            output_path = str(input_path_obj.parent / f"{input_path_obj.stem}_trimmed{input_path_obj.suffix}")

        self.logger.info("=" * 60)
        self.logger.info("VIDEO SILENCE TRIM - BẮT ĐẦU XỬ LÝ")
        self.logger.info("=" * 60)
        self.logger.info(f"Input: {input_path}")
        self.logger.info(f"Output: {output_path}")
        self.logger.info("=" * 60)

        try:
            # Bước 1: Lấy độ dài video
            duration = self.get_video_duration(input_path)

            # Bước 2: Detect silence
            silence_intervals = self.detect_silence(input_path)

            if not silence_intervals:
                self.logger.warning("Không tìm thấy đoạn im lặng nào. Video không cần trim.")
                self.logger.info("Đang copy video gốc sang output...")
                import shutil
                shutil.copy2(input_path, output_path)
                return output_path

            # Bước 3: Tính keep segments
            keep_segments = self.derive_keep_segments(silence_intervals, duration)

            if not keep_segments:
                self.logger.warning("Không có segment nào để giữ lại!")
                return None

            # Bước 4: Trim video
            self.trim_video(input_path, keep_segments, output_path)

            self.logger.info("=" * 60)
            self.logger.info("✓ HOÀN TẤT XỬ LÝ VIDEO")
            self.logger.info("=" * 60)

            return output_path

        except Exception as e:
            self.logger.error(f"Lỗi trong quá trình xử lý: {e}")
            raise


def main():
    """Main function để chạy từ command line"""
    parser = argparse.ArgumentParser(
        description='VideoSilenceTrim - Tự động loại bỏ đoạn im lặng trong video',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ví dụ sử dụng:
  %(prog)s input.mp4
  %(prog)s input.mp4 -o output.mp4
  %(prog)s input.mp4 --threshold -30dB --duration 1.0
  %(prog)s input.mp4 --config my_config.json
  %(prog)s --save-config config.json
        """
    )

    parser.add_argument(
        'input',
        nargs='?',
        help='Đường dẫn đến file video input'
    )

    parser.add_argument(
        '-o', '--output',
        help='Đường dẫn đến file video output'
    )

    parser.add_argument(
        '--threshold',
        default='-35dB',
        help='Ngưỡng âm thanh để coi là im lặng (mặc định: -35dB)'
    )

    parser.add_argument(
        '--duration',
        type=float,
        default=0.5,
        help='Độ dài tối thiểu của đoạn im lặng (giây, mặc định: 0.5)'
    )

    parser.add_argument(
        '--margin',
        type=float,
        default=0.5,
        help='Thời gian buffer trước/sau đoạn âm thanh (giây, mặc định: 0.5)'
    )

    parser.add_argument(
        '--config',
        help='Đường dẫn đến file config JSON'
    )

    parser.add_argument(
        '--save-config',
        help='Lưu config hiện tại vào file JSON'
    )

    parser.add_argument(
        '--preset',
        default='veryfast',
        choices=['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow'],
        help='Preset cho encoding video (mặc định: veryfast)'
    )

    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Hiển thị thông tin debug chi tiết'
    )

    args = parser.parse_args()

    # Load hoặc create config
    if args.config and os.path.exists(args.config):
        config = VideoSilenceTrimConfig.from_file(args.config)
    else:
        config = VideoSilenceTrimConfig(
            silence_threshold=args.threshold,
            min_silence_duration=args.duration,
            margin_seconds=args.margin,
            video_preset=args.preset
        )

    # Save config nếu được yêu cầu
    if args.save_config:
        config.to_file(args.save_config)
        print(f"✓ Đã lưu config vào: {args.save_config}")
        if not args.input:
            return

    # Validate input
    if not args.input:
        parser.print_help()
        return

    # Set logging level
    if args.verbose:
        logging.getLogger('VideoSilenceTrim').setLevel(logging.DEBUG)

    # Process video
    trimmer = VideoSilenceTrim(config)
    try:
        output = trimmer.process_video(args.input, args.output)
        if output:
            print(f"\n✓ Thành công! Output: {output}")
    except KeyboardInterrupt:
        print("\n\nĐã hủy bởi người dùng.")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Lỗi: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
