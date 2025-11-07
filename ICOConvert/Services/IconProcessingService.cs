using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;

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

        private static Bitmap ApplyOverlay(
            Bitmap source,
            Color? overlayColor,
            float overlayOpacity,
            bool protectHighlights,
            byte highlightThreshold)
        {
            if (overlayColor == null || overlayOpacity <= 0)
            {
                return (Bitmap)source.Clone();
            }

            var opacity = Math.Max(0f, Math.Min(1f, overlayOpacity));
            var result = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);

            var overlay = overlayColor.Value;
            RgbToHsl(overlay, out var overlayHue, out var overlaySaturation, out var overlayLuminance);

            var shouldProtectHighlights = protectHighlights && highlightThreshold > 0;
            var thresholdNormalized = Math.Max(0d, Math.Min(1d, highlightThreshold / 255d));

            var rect = new Rectangle(0, 0, source.Width, source.Height);
            var sourceData = source.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            var resultData = result.LockBits(rect, ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);

            try
            {
                var stride = Math.Abs(sourceData.Stride);
                var bufferLength = stride * source.Height;
                var sourceBuffer = new byte[bufferLength];
                var resultBuffer = new byte[bufferLength];

                Marshal.Copy(sourceData.Scan0, sourceBuffer, 0, bufferLength);

                for (var index = 0; index < bufferLength; index += 4)
                {
                    var blue = sourceBuffer[index];
                    var green = sourceBuffer[index + 1];
                    var red = sourceBuffer[index + 2];
                    var alpha = sourceBuffer[index + 3];

                    if (alpha == 0)
                    {
                        resultBuffer[index] = blue;
                        resultBuffer[index + 1] = green;
                        resultBuffer[index + 2] = red;
                        resultBuffer[index + 3] = alpha;
                        continue;
                    }

                    var brightness = Math.Max(red, Math.Max(green, blue)) / 255d;
                    if (shouldProtectHighlights && brightness >= thresholdNormalized)
                    {
                        resultBuffer[index] = blue;
                        resultBuffer[index + 1] = green;
                        resultBuffer[index + 2] = red;
                        resultBuffer[index + 3] = alpha;
                        continue;
                    }

                    RgbToHsl(red, green, blue, out var hue, out var saturation, out var luminance);

                    var newHue = overlayHue;
                    var newSaturation = Clamp01(saturation + (overlaySaturation - saturation) * opacity * 0.95d);
                    var newLuminance = Clamp01(luminance + (overlayLuminance - luminance) * opacity * 0.8d);

                    var tinted = HslToColor(newHue, newSaturation, newLuminance);

                    resultBuffer[index] = tinted.B;
                    resultBuffer[index + 1] = tinted.G;
                    resultBuffer[index + 2] = tinted.R;
                    resultBuffer[index + 3] = alpha;
                }

                Marshal.Copy(resultBuffer, 0, resultData.Scan0, bufferLength);
            }
            finally
            {
                source.UnlockBits(sourceData);
                result.UnlockBits(resultData);
            }

            return result;
        }

        private static void RgbToHsl(Color color, out double h, out double s, out double l)
        {
            RgbToHsl(color.R, color.G, color.B, out h, out s, out l);
        }

        private static void RgbToHsl(byte r, byte g, byte b, out double h, out double s, out double l)
        {
            var rNorm = r / 255d;
            var gNorm = g / 255d;
            var bNorm = b / 255d;

            var max = Math.Max(rNorm, Math.Max(gNorm, bNorm));
            var min = Math.Min(rNorm, Math.Min(gNorm, bNorm));
            var delta = max - min;

            h = 0d;
            if (delta > 0d)
            {
                if (max.Equals(rNorm))
                {
                    h = ((gNorm - bNorm) / delta) % 6d;
                }
                else if (max.Equals(gNorm))
                {
                    h = ((bNorm - rNorm) / delta) + 2d;
                }
                else
                {
                    h = ((rNorm - gNorm) / delta) + 4d;
                }

                h /= 6d;
                if (h < 0d)
                {
                    h += 1d;
                }
            }

            l = (max + min) / 2d;

            if (delta.Equals(0d))
            {
                s = 0d;
            }
            else
            {
                s = delta / (1d - Math.Abs(2d * l - 1d));
            }
        }

        private static Color HslToColor(double h, double s, double l)
        {
            if (s <= 0d)
            {
                var value = (byte)Math.Round(Clamp01(l) * 255d);
                return Color.FromArgb(value, value, value);
            }

            var q = l < 0.5d ? l * (1d + s) : (l + s) - (l * s);
            var p = 2d * l - q;

            var r = HueToRgb(p, q, h + 1d / 3d);
            var g = HueToRgb(p, q, h);
            var b = HueToRgb(p, q, h - 1d / 3d);

            return Color.FromArgb(
                (byte)Math.Round(r * 255d),
                (byte)Math.Round(g * 255d),
                (byte)Math.Round(b * 255d));
        }

        private static double HueToRgb(double p, double q, double t)
        {
            if (t < 0d)
            {
                t += 1d;
            }

            if (t > 1d)
            {
                t -= 1d;
            }

            if (t < 1d / 6d)
            {
                return p + (q - p) * 6d * t;
            }

            if (t < 1d / 2d)
            {
                return q;
            }

            if (t < 2d / 3d)
            {
                return p + (q - p) * (2d / 3d - t) * 6d;
            }

            return p;
        }

        private static double Clamp01(double value)
        {
            if (value < 0d)
            {
                return 0d;
            }

            if (value > 1d)
            {
                return 1d;
            }

            return value;
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
