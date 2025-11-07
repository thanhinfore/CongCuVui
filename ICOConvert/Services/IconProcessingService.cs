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
                using (var tintedBitmap = ApplyOverlay(croppedBitmap, overlayColor, overlayOpacity))
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

        private static Bitmap ApplyOverlay(Bitmap source, Color? overlayColor, float overlayOpacity)
        {
            if (overlayColor == null || overlayOpacity <= 0)
            {
                return (Bitmap)source.Clone();
            }

            var opacity = Math.Max(0f, Math.Min(1f, overlayOpacity));
            var alpha = (int)Math.Round(255 * opacity);

            var result = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
            using (var graphics = Graphics.FromImage(result))
            {
                graphics.CompositingQuality = System.Drawing.Drawing2D.CompositingQuality.HighQuality;
                graphics.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
                graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
                graphics.DrawImage(source, 0, 0, source.Width, source.Height);

                using (var brush = new SolidBrush(Color.FromArgb(alpha, overlayColor.Value)))
                {
                    graphics.FillRectangle(brush, new Rectangle(Point.Empty, source.Size));
                }
            }

            return result;
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
