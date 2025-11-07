using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;

namespace ICOConvert.Services
{
    internal static class IcoBuilder
    {
        public static byte[] Build(IReadOnlyList<Bitmap> bitmaps)
        {
            if (bitmaps == null || bitmaps.Count == 0)
            {
                throw new ArgumentException("Danh sách bitmap không được rỗng.", nameof(bitmaps));
            }

            var entries = new List<IconImageEntry>();

            foreach (var bitmap in bitmaps)
            {
                using (var stream = new MemoryStream())
                {
                    bitmap.Save(stream, ImageFormat.Png);
                    entries.Add(new IconImageEntry
                    {
                        Width = bitmap.Width,
                        Height = bitmap.Height,
                        Data = stream.ToArray()
                    });
                }
            }

            using (var output = new MemoryStream())
            using (var writer = new BinaryWriter(output))
            {
                writer.Write((short)0); // reserved
                writer.Write((short)1); // image type (icon)
                writer.Write((short)entries.Count);

                var offset = 6 + (16 * entries.Count);
                foreach (var entry in entries)
                {
                    writer.Write((byte)(entry.Width >= 256 ? 0 : entry.Width));
                    writer.Write((byte)(entry.Height >= 256 ? 0 : entry.Height));
                    writer.Write((byte)0); // color palette count
                    writer.Write((byte)0); // reserved
                    writer.Write((short)1); // color planes
                    writer.Write((short)32); // bits per pixel
                    writer.Write(entry.Data.Length);
                    writer.Write(offset);
                    entry.Offset = offset;
                    offset += entry.Data.Length;
                }

                foreach (var entry in entries)
                {
                    writer.Write(entry.Data);
                }

                writer.Flush();
                return output.ToArray();
            }
        }

        private class IconImageEntry
        {
            public int Width { get; set; }
            public int Height { get; set; }
            public int Offset { get; set; }
            public byte[] Data { get; set; }
        }
    }
}
