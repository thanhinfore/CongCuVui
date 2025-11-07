using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using ICOConvert.Services;

namespace ICOConvert
{
    public partial class _Default : Page
    {
        private const string IcoDataViewStateKey = "GeneratedIcoData";

        protected void Page_Load(object sender, EventArgs e)
        {
            if (!IsPostBack)
            {
                StatusLiteral.Text = string.Empty;
            }
        }

        protected void ConvertButton_Click(object sender, EventArgs e)
        {
            StatusLiteral.Text = string.Empty;
            ResultPanel.Visible = false;

            if (!ImageUpload.HasFile)
            {
                RenderStatus("Vui lòng chọn ảnh trước khi chuyển đổi.", isError: true);
                return;
            }

            var selectedSizes = SizeOptions.Items
                .Cast<ListItem>()
                .Where(item => item.Selected)
                .Select(item => int.TryParse(item.Value, out var size) ? size : 0)
                .Where(size => size > 0)
                .Distinct()
                .OrderBy(size => size)
                .ToList();

            if (!selectedSizes.Any())
            {
                RenderStatus("Hãy chọn ít nhất một kích thước favicon.", isError: true);
                return;
            }

            try
            {
                using (var memoryStream = new MemoryStream())
                {
                    ImageUpload.PostedFile.InputStream.CopyTo(memoryStream);
                    memoryStream.Position = 0;

                    var cropRectangle = ReadCropRectangle();
                    var overlaySettings = ReadOverlaySettings();

                    var result = IconProcessingService.Generate(
                        memoryStream,
                        cropRectangle,
                        overlaySettings.Color,
                        overlaySettings.Opacity,
                        selectedSizes);

                    var iconBase64 = Convert.ToBase64String(result.IconFile);
                    ViewState[IcoDataViewStateKey] = iconBase64;

                    ResultPanel.Visible = true;
                    PreviewRepeater.DataSource = result.Previews
                        .OrderBy(entry => entry.Key)
                        .Select(entry => new PreviewItem
                        {
                            Title = $"{entry.Key} x {entry.Key}px",
                            DataUrl = $"data:image/png;base64,{entry.Value}"
                        });
                    PreviewRepeater.DataBind();

                    RenderStatus("Chuyển đổi thành công! Bạn có thể tải favicon bên dưới.", isError: false);
                }
            }
            catch (Exception ex)
            {
                RenderStatus($"Không thể xử lý ảnh: {Server.HtmlEncode(ex.Message)}", isError: true);
            }
        }

        protected void DownloadButton_Click(object sender, EventArgs e)
        {
            if (!(ViewState[IcoDataViewStateKey] is string iconBase64) || string.IsNullOrEmpty(iconBase64))
            {
                RenderStatus("Vui lòng tạo favicon trước khi tải xuống.", isError: true);
                return;
            }

            var data = Convert.FromBase64String(iconBase64);
            var response = HttpContext.Current.Response;

            response.Clear();
            response.ContentType = "image/x-icon";
            response.AddHeader("Content-Disposition", "attachment; filename=favicon.ico");
            response.BinaryWrite(data);
            response.Flush();
            response.SuppressContent = true;
            HttpContext.Current.ApplicationInstance.CompleteRequest();
        }

        private Rectangle ReadCropRectangle()
        {
            int imageWidth = ReadFormInt("imageWidth");
            int imageHeight = ReadFormInt("imageHeight");
            int x = ReadFormInt("cropX");
            int y = ReadFormInt("cropY");
            int width = ReadFormInt("cropWidth");
            int height = ReadFormInt("cropHeight");

            if (width <= 0 || height <= 0 || imageWidth <= 0 || imageHeight <= 0)
            {
                return new Rectangle(0, 0, 0, 0);
            }

            x = Math.Max(0, x);
            y = Math.Max(0, y);
            width = Math.Max(1, width);
            height = Math.Max(1, height);

            if (x + width > imageWidth)
            {
                width = imageWidth - x;
            }

            if (y + height > imageHeight)
            {
                height = imageHeight - y;
            }

            width = Math.Max(1, width);
            height = Math.Max(1, height);

            return new Rectangle(x, y, width, height);
        }

        private OverlaySettings ReadOverlaySettings()
        {
            var intensityValue = ReadFormInt("overlayIntensity");
            intensityValue = Math.Max(0, Math.Min(100, intensityValue));
            var opacity = intensityValue / 100f;

            var highlightValue = ReadFormInt("highlightThreshold");
            highlightValue = Math.Max(0, Math.Min(100, highlightValue));
            var highlightThreshold = (byte)Math.Round(highlightValue / 100f * 255);

            var protectHighlightsRaw = Request.Form["protectHighlights"];
            var protectHighlights = string.Equals(protectHighlightsRaw, "on", StringComparison.OrdinalIgnoreCase)
                || string.Equals(protectHighlightsRaw, "true", StringComparison.OrdinalIgnoreCase);

            Color? color = null;
            var colorValue = Request.Form["overlayColor"];

            if (!string.IsNullOrWhiteSpace(colorValue) && opacity > 0)
            {
                try
                {
                    color = ColorTranslator.FromHtml(colorValue);
                }
                catch
                {
                    color = null;
                }
            }

            return new OverlaySettings
            {
                Color = color,
                Opacity = opacity,
                ProtectHighlights = protectHighlights,
                HighlightThreshold = highlightThreshold
            };
        }

        private int ReadFormInt(string key)
        {
            var raw = Request.Form[key];
            if (int.TryParse(raw, out var value))
            {
                return value;
            }

            return 0;
        }

        private void RenderStatus(string message, bool isError)
        {
            var cssClass = isError ? "status-message error" : "status-message success";
            StatusLiteral.Text = $"<div class=\"{cssClass}\">{message}</div>";
        }

        private class OverlaySettings
        {
            public Color? Color { get; set; }
            public float Opacity { get; set; }
            public bool ProtectHighlights { get; set; }
            public byte HighlightThreshold { get; set; }
        }

        private class PreviewItem
        {
            public string Title { get; set; }
            public string DataUrl { get; set; }
        }
    }
}
