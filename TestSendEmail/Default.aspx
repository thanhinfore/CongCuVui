<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Default.aspx.cs" Inherits="TestSendEmail.Default" %>

<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title>SMTP Email Test - mail.luyenai.vn</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 900px;
            margin: 40px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        h1 {
            color: #667eea;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 25px;
            font-size: 14px;
        }
        .preset-section {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 25px;
        }
        .preset-section h3 {
            margin-top: 0;
            color: #333;
            font-size: 16px;
        }
        .preset-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        .preset-btn {
            background: white;
            border: 2px solid #667eea;
            color: #667eea;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.3s;
            font-weight: 600;
        }
        .preset-btn:hover {
            background: #667eea;
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        .preset-btn.primary {
            background: #667eea;
            color: white;
        }
        .preset-btn.primary:hover {
            background: #5568d3;
        }
        .form-group { margin-bottom: 15px; }
        label { display: block; font-weight: 600; margin-bottom: 5px; color: #333; }
        input[type="text"], input[type="number"], input[type="password"], input[type="email"], textarea {
            width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 6px;
            box-sizing: border-box; font-size: 14px; transition: border-color 0.3s;
        }
        input:focus, textarea:focus {
            outline: none;
            border-color: #667eea;
        }
        textarea { min-height: 120px; resize: vertical; font-family: inherit; }
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.3s;
            width: 100%;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        .message { padding: 15px; margin-top: 20px; border-radius: 8px; }
        .success { background-color: #dff6dd; border: 2px solid #4caf50; color: #2e7d32; }
        .error { background-color: #ffebee; border: 2px solid #f44336; color: #c62828; white-space: pre-wrap; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .divider {
            border: none;
            border-top: 2px solid #e0e0e0;
            margin: 30px 0;
        }
        .section-title {
            font-size: 18px;
            font-weight: 700;
            color: #667eea;
            margin-bottom: 15px;
        }
        .info-text {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
        @media (max-width: 600px) {
            .grid { grid-template-columns: 1fr; }
            .preset-buttons { flex-direction: column; }
            body { margin: 10px; }
            .container { padding: 20px; }
        }
    </style>
    <script type="text/javascript">
        function setPreset(host, port, ssl) {
            document.getElementById('<%= txtSmtpHost.ClientID %>').value = host;
            document.getElementById('<%= txtSmtpPort.ClientID %>').value = port;
            document.getElementById('<%= chkEnableSSL.ClientID %>').checked = ssl;
            return false;
        }
    </script>
</head>
<body>
    <form id="form1" runat="server">
        <div class="container">
            <h1>SMTP Email Test Tool</h1>
            <p class="subtitle">Công cụ kiểm tra gửi email qua SMTP - Tối ưu cho mail.luyenai.vn</p>

            <div class="preset-section">
                <h3>Preset SMTP Servers</h3>
                <div class="preset-buttons">
                    <button type="button" class="preset-btn primary" onclick="return setPreset('mail.luyenai.vn', '587', true);">
                        mail.luyenai.vn (Port 587)
                    </button>
                    <button type="button" class="preset-btn primary" onclick="return setPreset('mail.luyenai.vn', '465', true);">
                        mail.luyenai.vn (Port 465)
                    </button>
                    <button type="button" class="preset-btn" onclick="return setPreset('smtp.gmail.com', '587', true);">
                        Gmail
                    </button>
                    <button type="button" class="preset-btn" onclick="return setPreset('smtp-mail.outlook.com', '587', true);">
                        Outlook
                    </button>
                    <button type="button" class="preset-btn" onclick="return setPreset('smtp.office365.com', '587', true);">
                        Office 365
                    </button>
                </div>
            </div>

            <div class="section-title">SMTP Configuration</div>
            <div class="grid">
                <div class="form-group">
                    <label for="txtSmtpHost">SMTP Host *</label>
                    <asp:TextBox ID="txtSmtpHost" runat="server" Text="mail.luyenai.vn" placeholder="mail.luyenai.vn"></asp:TextBox>
                    <asp:RequiredFieldValidator ID="rfvHost" runat="server" ControlToValidate="txtSmtpHost"
                        ErrorMessage="SMTP Host is required" ForeColor="Red" Display="Dynamic" />
                </div>

                <div class="form-group">
                    <label for="txtSmtpPort">SMTP Port *</label>
                    <asp:TextBox ID="txtSmtpPort" runat="server" TextMode="Number" Text="587"></asp:TextBox>
                    <asp:RequiredFieldValidator ID="rfvPort" runat="server" ControlToValidate="txtSmtpPort"
                        ErrorMessage="Port is required" ForeColor="Red" Display="Dynamic" />
                    <asp:RangeValidator ID="rvPort" runat="server" ControlToValidate="txtSmtpPort"
                        MinimumValue="1" MaximumValue="65535" Type="Integer"
                        ErrorMessage="Port must be 1-65535" ForeColor="Red" Display="Dynamic" />
                    <p class="info-text">Thông thường: 587 (TLS), 465 (SSL), 25 (No SSL)</p>
                </div>
            </div>

            <div class="grid">
                <div class="form-group">
                    <label for="txtUsername">Username (Email) *</label>
                    <asp:TextBox ID="txtUsername" runat="server" placeholder="your-email@luyenai.vn"></asp:TextBox>
                </div>

                <div class="form-group">
                    <label for="txtPassword">Password *</label>
                    <asp:TextBox ID="txtPassword" runat="server" TextMode="Password" placeholder="Mật khẩu SMTP hoặc App Password"></asp:TextBox>
                </div>
            </div>

            <div class="form-group">
                <label>
                    <asp:CheckBox ID="chkEnableSSL" runat="server" Checked="true" />
                    Enable SSL/TLS (khuyến nghị cho port 587, 465)
                </label>
            </div>

            <hr class="divider" />

            <div class="section-title">Email Details</div>
            <div class="grid">
                <div class="form-group">
                    <label for="txtFromName">From Name</label>
                    <asp:TextBox ID="txtFromName" runat="server" placeholder="Tên người gửi (tùy chọn)"></asp:TextBox>
                    <p class="info-text">Tên hiển thị của người gửi</p>
                </div>

                <div class="form-group">
                    <label for="txtFromEmail">From Email *</label>
                    <asp:TextBox ID="txtFromEmail" runat="server" placeholder="sender@luyenai.vn"></asp:TextBox>
                    <asp:RequiredFieldValidator ID="rfvFrom" runat="server" ControlToValidate="txtFromEmail"
                        ErrorMessage="From Email is required" ForeColor="Red" Display="Dynamic" />
                    <asp:RegularExpressionValidator ID="revFrom" runat="server" ControlToValidate="txtFromEmail"
                        ValidationExpression="^[\w\.-]+@[\w\.-]+\.\w+$"
                        ErrorMessage="Invalid email format" ForeColor="Red" Display="Dynamic" />
                </div>
            </div>

            <div class="form-group">
                <label for="txtToEmail">To Email *</label>
                <asp:TextBox ID="txtToEmail" runat="server" placeholder="recipient@domain.com"></asp:TextBox>
                <asp:RequiredFieldValidator ID="rfvTo" runat="server" ControlToValidate="txtToEmail"
                    ErrorMessage="To Email is required" ForeColor="Red" Display="Dynamic" />
                <p class="info-text">Có thể gửi nhiều email, ngăn cách bởi dấu chấm phấy (;)</p>
            </div>

            <div class="grid">
                <div class="form-group">
                    <label for="txtCcEmail">CC (Carbon Copy)</label>
                    <asp:TextBox ID="txtCcEmail" runat="server" placeholder="cc@domain.com"></asp:TextBox>
                    <p class="info-text">Email CC (tùy chọn), ngăn cách bởi dấu chấm phấy (;)</p>
                </div>

                <div class="form-group">
                    <label for="txtBccEmail">BCC (Blind Carbon Copy)</label>
                    <asp:TextBox ID="txtBccEmail" runat="server" placeholder="bcc@domain.com"></asp:TextBox>
                    <p class="info-text">Email BCC (tùy chọn), ngăn cách bởi dấu chấm phấy (;)</p>
                </div>
            </div>

            <div class="form-group">
                <label for="txtSubject">Subject *</label>
                <asp:TextBox ID="txtSubject" runat="server" Text="Test Email từ mail.luyenai.vn" placeholder="Tiêu đề email"></asp:TextBox>
                <asp:RequiredFieldValidator ID="rfvSubject" runat="server" ControlToValidate="txtSubject"
                    ErrorMessage="Subject is required" ForeColor="Red" Display="Dynamic" />
            </div>

            <div class="form-group">
                <label for="txtBody">Body *</label>
                <asp:TextBox ID="txtBody" runat="server" TextMode="MultiLine"
                    Text="Đây là email thử nghiệm được gửi từ công cụ SMTP Test Tool qua mail.luyenai.vn.&#13;&#10;&#13;&#10;Nếu bạn nhận được email này, SMTP server đang hoạt động tốt!"
                    placeholder="Nội dung email"></asp:TextBox>
                <asp:RequiredFieldValidator ID="rfvBody" runat="server" ControlToValidate="txtBody"
                    ErrorMessage="Body is required" ForeColor="Red" Display="Dynamic" />
            </div>

            <div class="form-group">
                <label>
                    <asp:CheckBox ID="chkIsHtml" runat="server" Checked="false" />
                    Gửi dưới dạng HTML (cho phép định dạng, link, hình ảnh)
                </label>
            </div>

            <div class="form-group">
                <asp:Button ID="btnSend" runat="server" Text="Gửi Email Thử Nghiệm" CssClass="btn" OnClick="btnSend_Click" />
            </div>

            <asp:Panel ID="pnlMessage" runat="server" Visible="false" CssClass="message">
                <asp:Label ID="lblMessage" runat="server"></asp:Label>
            </asp:Panel>
        </div>
    </form>
</body>
</html>