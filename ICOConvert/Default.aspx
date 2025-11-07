<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Default.aspx.cs" Inherits="ICOConvert._Default" %>
<!DOCTYPE html>
<html lang="vi">
<head runat="server">
    <meta charset="utf-8" />
    <title>ICOConvert - Trình tạo favicon trực tuyến</title>
    <link rel="stylesheet" type="text/css" href="Content/site.css" />
</head>
<body>
    <form id="form1" runat="server" enctype="multipart/form-data">
        <div class="container">
            <header>
                <h1>ICOConvert</h1>
                <p>Chuyển đổi ảnh của bạn thành tệp <strong>favicon.ico</strong> nhiều kích thước với khả năng crop và phủ màu đơn giản.</p>
            </header>

            <section class="section">
                <label for="ImageUpload">1. Chọn ảnh nguồn</label>
                <asp:FileUpload ID="ImageUpload" runat="server" CssClass="file-upload" />
                <p class="hint">Hỗ trợ PNG, JPG, GIF với kích thước lên tới 4MB.</p>
            </section>

            <section class="section preview-wrapper">
                <div class="preview-left">
                    <h2>Xem trước &amp; vùng crop</h2>
                    <canvas id="previewCanvas" width="480" height="320"></canvas>
                    <div class="preview-actions">
                        <button type="button" id="resetCropButton" class="secondary-btn">Đặt lại vùng crop</button>
                        <span id="cropInfo">Vùng crop: toàn bộ ảnh</span>
                    </div>
                </div>
                <div class="preview-right">
                    <h2>2. Tùy chỉnh màu</h2>
                    <div class="field-row">
                        <label for="colorPicker">Màu phủ</label>
                        <input type="color" id="colorPicker" name="overlayColor" value="#ffffff" />
                    </div>
                    <div class="field-row">
                        <label for="intensityRange">Độ đậm</label>
                        <input type="range" id="intensityRange" name="overlayIntensity" min="0" max="100" value="0" />
                        <span id="intensityLabel">0%</span>
                    </div>
                    <div class="field-row checkbox-row">
                        <label class="checkbox-label">
                            <input type="checkbox" id="protectHighlights" name="protectHighlights" checked="checked" />
                            Giữ nguyên vùng nền sáng
                        </label>
                    </div>
                    <div class="field-row">
                        <label for="highlightRange">Ngưỡng nền sáng</label>
                        <input type="range" id="highlightRange" name="highlightThreshold" min="0" max="100" value="90" />
                        <span id="highlightLabel">90%</span>
                    </div>
                    <p class="hint">Phủ màu mới lên phần hình chính trong khi vẫn giữ nguyên nền sáng hoặc màu trắng.</p>

                    <h2>3. Chọn kích thước favicon</h2>
                    <asp:CheckBoxList ID="SizeOptions" runat="server" RepeatColumns="2" CssClass="size-options">
                        <asp:ListItem Text="16 x 16" Value="16" Selected="True"></asp:ListItem>
                        <asp:ListItem Text="32 x 32" Value="32" Selected="True"></asp:ListItem>
                        <asp:ListItem Text="48 x 48" Value="48" Selected="True"></asp:ListItem>
                        <asp:ListItem Text="64 x 64" Value="64" Selected="True"></asp:ListItem>
                    </asp:CheckBoxList>
                </div>
            </section>

            <section class="section">
                <asp:Button ID="ConvertButton" runat="server" CssClass="primary-btn" Text="Chuyển đổi" OnClick="ConvertButton_Click" />
                <asp:Literal ID="StatusLiteral" runat="server"></asp:Literal>
            </section>

            <asp:Panel ID="ResultPanel" runat="server" Visible="false" CssClass="section result-panel">
                <h2>Kết quả favicon</h2>
                <p>Nhấn nút tải về để nhận tệp <code>favicon.ico</code>.</p>
                <asp:Repeater ID="PreviewRepeater" runat="server">
                    <ItemTemplate>
                        <div class="preview-item">
                            <img src="<%# Eval("DataUrl") %>" alt="<%# Eval("Title") %>" />
                            <span><%# Eval("Title") %></span>
                        </div>
                    </ItemTemplate>
                </asp:Repeater>
                <asp:LinkButton ID="DownloadButton" runat="server" CssClass="primary-btn" OnClick="DownloadButton_Click">Tải favicon.ico</asp:LinkButton>
            </asp:Panel>
        </div>

        <input type="hidden" id="cropX" name="cropX" value="0" />
        <input type="hidden" id="cropY" name="cropY" value="0" />
        <input type="hidden" id="cropWidth" name="cropWidth" value="0" />
        <input type="hidden" id="cropHeight" name="cropHeight" value="0" />
        <input type="hidden" id="imageWidth" name="imageWidth" value="0" />
        <input type="hidden" id="imageHeight" name="imageHeight" value="0" />
    </form>

    <script src="Scripts/ico-convert.js"></script>
</body>
</html>
