using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;

namespace ICOConvert.Services
{
    public static class IconProcessingService
    {
        public static ProcessedIconResult Generate(
            Stream imageStream,
            Rectangle requestedCrop,
            Color? overlayColor,
            float overlayOpacity,
            bool protectHighlights,
            byte highlightThreshold,
            IReadOnlyCollection<int> iconSizes)
        {
            if (imageStream == null)
            {
                throw new ArgumentNullException(nameof(imageStream));
            }

            if (iconSizes == null || iconSizes.Count == 0)
            {
                throw new ArgumentException("Cần ít nhất một kích thước icon hợp lệ.", nameof(iconSizes));
            }

            var distinctSizes = iconSizes
                .Where(size => size > 0)
                .Distinct()
                .OrderBy(size => size)
                .ToList();

            if (distinctSizes.Count == 0)
            {
                throw new ArgumentException("Không tìm thấy kích thước icon hợp lệ.", nameof(iconSizes));
            }

            imageStream.Position = 0;

            using (var originalBitmap = new Bitmap(imageStream))
            {
                var cropArea = NormalizeCropRectangle(originalBitmap.Size, requestedCrop);
                using (var croppedBitmap = originalBitmap.Clone(cropArea, PixelFormat.Format32bppArgb))
                using (var tintedBitmap = ApplyOverlay(croppedBitmap, overlayColor, overlayOpacity, protectHighlights, highlightThreshold))
                {
                    var resizedBitmaps = new List<Bitmap>();
                    try
                    {
                        foreach (var size in distinctSizes)
                        {
                            resizedBitmaps.Add(ResizeBitmap(tintedBitmap, size));
                        }

                        var iconData = IcoBuilder.Build(resizedBitmaps);
                        var result = new ProcessedIconResult
                        {
                            IconFile = iconData
                        };

                        foreach (var bitmap in resizedBitmaps)
                        {
                            using (var previewStream = new MemoryStream())
                            {
                                bitmap.Save(previewStream, ImageFormat.Png);
                                result.Previews[bitmap.Width] = Convert.ToBase64String(previewStream.ToArray());
                            }
                        }

                        return result;
                    }
                    finally
                    {
                        foreach (var bitmap in resizedBitmaps)
                        {
                            bitmap.Dispose();
                        }
                    }
                }
            }
        }

        private static Rectangle NormalizeCropRectangle(Size imageSize, Rectangle requestedCrop)
        {
            var width = requestedCrop.Width <= 0 ? imageSize.Width : requestedCrop.Width;
            var height = requestedCrop.Height <= 0 ? imageSize.Height : requestedCrop.Height;
            var x = Math.Max(0, requestedCrop.X);
            var y = Math.Max(0, requestedCrop.Y);

            if (x >= imageSize.Width)
            {
                x = imageSize.Width - 1;
            }

            if (y >= imageSize.Height)
            {
                y = imageSize.Height - 1;
            }

            width = Math.Min(width, imageSize.Width - x);
            height = Math.Min(height, imageSize.Height - y);

            if (width <= 0 || height <= 0)
            {
                x = 0;
                y = 0;
                width = imageSize.Width;
                height = imageSize.Height;
            }

            width = Math.Max(1, width);
            height = Math.Max(1, height);

            return new Rectangle(x, y, width, height);
        }

        private static Bitmap ApplyOverlay(Bitmap source, Color? overlayColor, float overlayOpacity, bool protectHighlights, byte highlightThreshold)
        {
            if (overlayColor == null || overlayOpacity <= 0)
            {
                return (Bitmap)source.Clone();
            }

            var opacity = Math.Max(0f, Math.Min(1f, overlayOpacity));
            var result = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);

            var bitmapData = result.LockBits(new Rectangle(0, 0, result.Width, result.Height), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
            var sourceData = source.LockBits(new Rectangle(0, 0, source.Width, source.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);

            try
            {
                unsafe
                {
                    byte* destPtr = (byte*)bitmapData.Scan0;
                    byte* srcPtr = (byte*)sourceData.Scan0;
                    int pixelCount = source.Width * source.Height;

                    var overlayHsl = RgbToHsl(overlayColor.Value);
                    float thresholdNormalized = highlightThreshold / 255f;

                    for (int i = 0; i < pixelCount; i++)
                    {
                        int idx = i * 4;
                        byte b = srcPtr[idx];
                        byte g = srcPtr[idx + 1];
                        byte r = srcPtr[idx + 2];
                        byte a = srcPtr[idx + 3];

                        // Giữ nguyên pixel trong suốt
                        if (a == 0)
                        {
                            destPtr[idx] = b;
                            destPtr[idx + 1] = g;
                            destPtr[idx + 2] = r;
                            destPtr[idx + 3] = a;
                            continue;
                        }

                        float brightness = Math.Max(r, Math.Max(g, b)) / 255f;

                        // Bỏ qua pixel sáng nếu bật chế độ bảo vệ
                        if (protectHighlights && brightness >= thresholdNormalized)
                        {
                            destPtr[idx] = b;
                            destPtr[idx + 1] = g;
                            destPtr[idx + 2] = r;
                            destPtr[idx + 3] = a;
                            continue;
                        }

                        var originalHsl = RgbToHsl(Color.FromArgb(r, g, b));
                        float newH, newS, newL;

                        // Xử lý đặc biệt cho pixel tối (đen/xám đen) để chuyển màu hiệu quả
                        if (originalHsl.L < 0.2f)
                        {
                            // Pixel rất tối: thay thế hoàn toàn màu sắc
                            newH = overlayHsl.H;
                            newS = overlayHsl.S * opacity;
                            newL = Clamp01(originalHsl.L + overlayHsl.L * opacity * 0.5f);
                        }
                        else if (originalHsl.L < 0.5f)
                        {
                            // Pixel tối-trung bình: blend mạnh
                            newH = overlayHsl.H;
                            newS = Clamp01(originalHsl.S + (overlayHsl.S - originalHsl.S) * opacity);
                            newL = Clamp01(originalHsl.L + (overlayHsl.L - originalHsl.L) * opacity * 0.7f);
                        }
                        else
                        {
                            // Pixel sáng: blend nhẹ
                            newH = overlayHsl.H;
                            newS = Clamp01(originalHsl.S + (overlayHsl.S - originalHsl.S) * opacity * 0.6f);
                            newL = Clamp01(originalHsl.L + (overlayHsl.L - originalHsl.L) * opacity * 0.4f);
                        }

                        var tinted = HslToRgb(newH, newS, newL);
                        destPtr[idx] = tinted.B;
                        destPtr[idx + 1] = tinted.G;
                        destPtr[idx + 2] = tinted.R;
                        destPtr[idx + 3] = a;
                    }
                }
            }
            finally
            {
                result.UnlockBits(bitmapData);
                source.UnlockBits(sourceData);
            }

            return result;
        }

        private static float Clamp01(float value)
        {
            if (value < 0f) return 0f;
            if (value > 1f) return 1f;
            return value;
        }

        private struct HslColor
        {
            public float H;
            public float S;
            public float L;
        }

        private static HslColor RgbToHsl(Color rgb)
        {
            float r = rgb.R / 255f;
            float g = rgb.G / 255f;
            float b = rgb.B / 255f;

            float max = Math.Max(r, Math.Max(g, b));
            float min = Math.Min(r, Math.Min(g, b));
            float delta = max - min;

            float h = 0f;
            if (delta != 0)
            {
                if (max == r)
                {
                    h = ((g - b) / delta) % 6f;
                }
                else if (max == g)
                {
                    h = (b - r) / delta + 2f;
                }
                else
                {
                    h = (r - g) / delta + 4f;
                }
                h /= 6f;
                if (h < 0f) h += 1f;
            }

            float l = (max + min) / 2f;
            float s = 0f;
            if (delta != 0)
            {
                s = delta / (1f - Math.Abs(2f * l - 1f));
            }

            return new HslColor { H = h, S = s, L = l };
        }

        private static Color HslToRgb(float h, float s, float l)
        {
            float r, g, b;

            if (s == 0f)
            {
                r = g = b = l;
            }
            else
            {
                float q = l < 0.5f ? l * (1f + s) : l + s - l * s;
                float p = 2f * l - q;
                r = HueToRgb(p, q, h + 1f / 3f);
                g = HueToRgb(p, q, h);
                b = HueToRgb(p, q, h - 1f / 3f);
            }

            return Color.FromArgb(
                (int)Math.Round(Clamp01(r) * 255),
                (int)Math.Round(Clamp01(g) * 255),
                (int)Math.Round(Clamp01(b) * 255)
            );
        }

        private static float HueToRgb(float p, float q, float t)
        {
            if (t < 0f) t += 1f;
            if (t > 1f) t -= 1f;
            if (t < 1f / 6f) return p + (q - p) * 6f * t;
            if (t < 1f / 2f) return q;
            if (t < 2f / 3f) return p + (q - p) * (2f / 3f - t) * 6f;
            return p;
        }

        private static Bitmap ResizeBitmap(Bitmap source, int size)
        {
            var bitmap = new Bitmap(size, size, PixelFormat.Format32bppArgb);
            using (var graphics = Graphics.FromImage(bitmap))
            {
                graphics.Clear(Color.Transparent);
                graphics.CompositingQuality = System.Drawing.Drawing2D.CompositingQuality.HighQuality;
                graphics.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
                graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;

                var destination = CalculateDestinationRectangle(source.Size, bitmap.Size);
                graphics.DrawImage(source, destination);
            }

            return bitmap;
        }

        private static Rectangle CalculateDestinationRectangle(Size source, Size target)
        {
            var ratio = Math.Min((float)target.Width / source.Width, (float)target.Height / source.Height);
            var width = (int)Math.Round(source.Width * ratio);
            var height = (int)Math.Round(source.Height * ratio);
            var x = (target.Width - width) / 2;
            var y = (target.Height - height) / 2;
            return new Rectangle(x, y, width, height);
        }
    }
}
