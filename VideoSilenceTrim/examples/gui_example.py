#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple GUI Example for VideoSilenceTrim using tkinter
Yêu cầu: Python 3.7+ với tkinter (thường được cài sẵn)
"""

import tkinter as tk
from tkinter import filedialog, messagebox, ttk
from pathlib import Path
import threading
import sys
import os

# Import module chính
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from video_silence_trim import VideoSilenceTrim, VideoSilenceTrimConfig


class VideoSilenceTrimGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("VideoSilenceTrim - GUI")
        self.root.geometry("700x600")
        self.root.resizable(True, True)

        self.input_file = None
        self.output_file = None
        self.processing = False

        self.setup_ui()

    def setup_ui(self):
        # Main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)

        # Title
        title_label = ttk.Label(main_frame, text="VideoSilenceTrim", font=('Arial', 20, 'bold'))
        title_label.grid(row=0, column=0, columnspan=3, pady=10)

        subtitle_label = ttk.Label(main_frame, text="Tự động loại bỏ đoạn im lặng trong video", font=('Arial', 10))
        subtitle_label.grid(row=1, column=0, columnspan=3, pady=(0, 20))

        # Input file
        ttk.Label(main_frame, text="File đầu vào:").grid(row=2, column=0, sticky=tk.W, pady=5)
        self.input_entry = ttk.Entry(main_frame, width=50)
        self.input_entry.grid(row=2, column=1, padx=5, pady=5)
        ttk.Button(main_frame, text="Chọn file...", command=self.select_input).grid(row=2, column=2, pady=5)

        # Output file
        ttk.Label(main_frame, text="File đầu ra:").grid(row=3, column=0, sticky=tk.W, pady=5)
        self.output_entry = ttk.Entry(main_frame, width=50)
        self.output_entry.grid(row=3, column=1, padx=5, pady=5)
        ttk.Button(main_frame, text="Chọn file...", command=self.select_output).grid(row=3, column=2, pady=5)

        # Separator
        ttk.Separator(main_frame, orient='horizontal').grid(row=4, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=20)

        # Settings
        settings_label = ttk.Label(main_frame, text="Cấu hình:", font=('Arial', 12, 'bold'))
        settings_label.grid(row=5, column=0, columnspan=3, sticky=tk.W, pady=(0, 10))

        # Threshold
        ttk.Label(main_frame, text="Ngưỡng im lặng (dB):").grid(row=6, column=0, sticky=tk.W, pady=5)
        self.threshold_var = tk.StringVar(value="-35")
        threshold_frame = ttk.Frame(main_frame)
        threshold_frame.grid(row=6, column=1, sticky=tk.W, pady=5)
        ttk.Entry(threshold_frame, textvariable=self.threshold_var, width=10).pack(side=tk.LEFT)
        ttk.Label(threshold_frame, text="dB (càng âm càng nghiêm ngặt)").pack(side=tk.LEFT, padx=5)

        # Duration
        ttk.Label(main_frame, text="Độ dài im lặng tối thiểu (s):").grid(row=7, column=0, sticky=tk.W, pady=5)
        self.duration_var = tk.StringVar(value="0.5")
        duration_frame = ttk.Frame(main_frame)
        duration_frame.grid(row=7, column=1, sticky=tk.W, pady=5)
        ttk.Entry(duration_frame, textvariable=self.duration_var, width=10).pack(side=tk.LEFT)
        ttk.Label(duration_frame, text="giây").pack(side=tk.LEFT, padx=5)

        # Margin
        ttk.Label(main_frame, text="Margin buffer (s):").grid(row=8, column=0, sticky=tk.W, pady=5)
        self.margin_var = tk.StringVar(value="0.5")
        margin_frame = ttk.Frame(main_frame)
        margin_frame.grid(row=8, column=1, sticky=tk.W, pady=5)
        ttk.Entry(margin_frame, textvariable=self.margin_var, width=10).pack(side=tk.LEFT)
        ttk.Label(margin_frame, text="giây").pack(side=tk.LEFT, padx=5)

        # Preset
        ttk.Label(main_frame, text="Preset encoding:").grid(row=9, column=0, sticky=tk.W, pady=5)
        self.preset_var = tk.StringVar(value="veryfast")
        preset_combo = ttk.Combobox(main_frame, textvariable=self.preset_var, width=15)
        preset_combo['values'] = ('ultrafast', 'veryfast', 'fast', 'medium', 'slow')
        preset_combo.grid(row=9, column=1, sticky=tk.W, pady=5)

        # Separator
        ttk.Separator(main_frame, orient='horizontal').grid(row=10, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=20)

        # Progress
        self.progress_label = ttk.Label(main_frame, text="Sẵn sàng xử lý", font=('Arial', 10))
        self.progress_label.grid(row=11, column=0, columnspan=3, pady=5)

        self.progress_bar = ttk.Progressbar(main_frame, mode='indeterminate', length=600)
        self.progress_bar.grid(row=12, column=0, columnspan=3, pady=10)

        # Log output
        log_label = ttk.Label(main_frame, text="Log:", font=('Arial', 10, 'bold'))
        log_label.grid(row=13, column=0, columnspan=3, sticky=tk.W, pady=(10, 5))

        # Log text widget with scrollbar
        log_frame = ttk.Frame(main_frame)
        log_frame.grid(row=14, column=0, columnspan=3, sticky=(tk.W, tk.E, tk.N, tk.S), pady=5)
        main_frame.rowconfigure(14, weight=1)

        self.log_text = tk.Text(log_frame, height=10, width=80, wrap=tk.WORD)
        scrollbar = ttk.Scrollbar(log_frame, orient='vertical', command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=scrollbar.set)

        self.log_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        scrollbar.grid(row=0, column=1, sticky=(tk.N, tk.S))
        log_frame.columnconfigure(0, weight=1)
        log_frame.rowconfigure(0, weight=1)

        # Buttons
        button_frame = ttk.Frame(main_frame)
        button_frame.grid(row=15, column=0, columnspan=3, pady=20)

        self.process_button = ttk.Button(button_frame, text="Xử lý Video", command=self.process_video)
        self.process_button.pack(side=tk.LEFT, padx=5)

        ttk.Button(button_frame, text="Xóa Log", command=self.clear_log).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="Thoát", command=self.root.quit).pack(side=tk.LEFT, padx=5)

    def select_input(self):
        filename = filedialog.askopenfilename(
            title="Chọn video đầu vào",
            filetypes=[
                ("Video files", "*.mp4 *.avi *.mkv *.mov *.wmv *.flv"),
                ("All files", "*.*")
            ]
        )
        if filename:
            self.input_file = filename
            self.input_entry.delete(0, tk.END)
            self.input_entry.insert(0, filename)

            # Auto-generate output filename
            if not self.output_file:
                input_path = Path(filename)
                output_path = input_path.parent / f"{input_path.stem}_trimmed{input_path.suffix}"
                self.output_entry.delete(0, tk.END)
                self.output_entry.insert(0, str(output_path))

    def select_output(self):
        filename = filedialog.asksaveasfilename(
            title="Chọn vị trí lưu video",
            defaultextension=".mp4",
            filetypes=[
                ("MP4 files", "*.mp4"),
                ("AVI files", "*.avi"),
                ("MKV files", "*.mkv"),
                ("All files", "*.*")
            ]
        )
        if filename:
            self.output_file = filename
            self.output_entry.delete(0, tk.END)
            self.output_entry.insert(0, filename)

    def log(self, message):
        self.log_text.insert(tk.END, message + "\n")
        self.log_text.see(tk.END)
        self.root.update()

    def clear_log(self):
        self.log_text.delete(1.0, tk.END)

    def process_video(self):
        if self.processing:
            messagebox.showwarning("Cảnh báo", "Đang xử lý video, vui lòng đợi!")
            return

        input_file = self.input_entry.get()
        output_file = self.output_entry.get()

        if not input_file or not os.path.exists(input_file):
            messagebox.showerror("Lỗi", "Vui lòng chọn file đầu vào!")
            return

        if not output_file:
            messagebox.showerror("Lỗi", "Vui lòng chọn file đầu ra!")
            return

        try:
            threshold = float(self.threshold_var.get())
            duration = float(self.duration_var.get())
            margin = float(self.margin_var.get())
        except ValueError:
            messagebox.showerror("Lỗi", "Giá trị tham số không hợp lệ!")
            return

        # Start processing in thread
        self.processing = True
        self.process_button.config(state='disabled')
        self.progress_bar.start()
        self.progress_label.config(text="Đang xử lý...")

        def process_thread():
            try:
                self.log("=" * 60)
                self.log("BẮT ĐẦU XỬ LÝ VIDEO")
                self.log("=" * 60)
                self.log(f"Input: {input_file}")
                self.log(f"Output: {output_file}")
                self.log("")

                # Create config
                config = VideoSilenceTrimConfig(
                    silence_threshold=f"{threshold}dB",
                    min_silence_duration=duration,
                    margin_seconds=margin,
                    video_preset=self.preset_var.get()
                )

                # Create trimmer
                trimmer = VideoSilenceTrim(config)

                # Redirect logger to GUI
                import logging
                class GUIHandler(logging.Handler):
                    def __init__(self, gui):
                        super().__init__()
                        self.gui = gui

                    def emit(self, record):
                        msg = self.format(record)
                        self.gui.log(msg)

                gui_handler = GUIHandler(self)
                trimmer.logger.addHandler(gui_handler)

                # Process
                result = trimmer.process_video(input_file, output_file)

                self.log("")
                self.log("=" * 60)
                self.log("✓ HOÀN THÀNH!")
                self.log("=" * 60)

                self.root.after(0, lambda: messagebox.showinfo("Thành công", f"Đã xử lý video thành công!\n\nOutput: {result}"))

            except Exception as e:
                self.log(f"\n✗ LỖI: {str(e)}")
                self.root.after(0, lambda: messagebox.showerror("Lỗi", f"Lỗi khi xử lý video:\n{str(e)}"))

            finally:
                self.processing = False
                self.root.after(0, lambda: self.process_button.config(state='normal'))
                self.root.after(0, lambda: self.progress_bar.stop())
                self.root.after(0, lambda: self.progress_label.config(text="Sẵn sàng xử lý"))

        thread = threading.Thread(target=process_thread, daemon=True)
        thread.start()


def main():
    root = tk.Tk()
    app = VideoSilenceTrimGUI(root)
    root.mainloop()


if __name__ == '__main__':
    main()
