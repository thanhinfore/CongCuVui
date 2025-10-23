<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Default.aspx.cs" Inherits="TestSendEmail.Default" %>

<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title>SMTP Email Test</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; font-weight: 600; margin-bottom: 5px; }
        input[type="text"], input[type="number"], input[type="password"], textarea {
            width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;
        }
        textarea { min-height: 100px; resize: vertical; }
        .btn { background-color: #0078d4; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
        .btn:hover { background-color: #106ebe; }
        .message { padding: 15px; margin-top: 20px; border-radius: 4px; }
        .success { background-color: #dff6dd; border: 1px solid #4caf50; color: #2e7d32; }
        .error { background-color: #ffebee; border: 1px solid #f44336; color: #c62828; white-space: pre-wrap; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <form id="form1" runat="server">
        <h1>SMTP Email Test Tool</h1>
        
        <div class="grid">
            <div class="form-group">
                <label for="txtSmtpHost">SMTP Host *</label>
                <asp:TextBox ID="txtSmtpHost" runat="server" placeholder="smtp.gmail.com"></asp:TextBox>
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
            </div>
        </div>
        
        <div class="grid">
            <div class="form-group">
                <label for="txtUsername">Username *</label>
                <asp:TextBox ID="txtUsername" runat="server" placeholder="your-email@domain.com"></asp:TextBox>
            </div>
            
            <div class="form-group">
                <label for="txtPassword">Password *</label>
                <asp:TextBox ID="txtPassword" runat="server" TextMode="Password" placeholder="App password or SMTP password"></asp:TextBox>
            </div>
        </div>
        
        <div class="form-group">
            <label>
                <asp:CheckBox ID="chkEnableSSL" runat="server" Checked="true" />
                Enable SSL/TLS (khuyến nghị cho port 587, 465)
            </label>
        </div>
        
        <hr style="margin: 30px 0;" />
        
        <div class="grid">
            <div class="form-group">
                <label for="txtFromEmail">From Email *</label>
                <asp:TextBox ID="txtFromEmail" runat="server" placeholder="sender@domain.com"></asp:TextBox>
                <asp:RequiredFieldValidator ID="rfvFrom" runat="server" ControlToValidate="txtFromEmail" 
                    ErrorMessage="From Email is required" ForeColor="Red" Display="Dynamic" />
                <asp:RegularExpressionValidator ID="revFrom" runat="server" ControlToValidate="txtFromEmail" 
                    ValidationExpression="^[\w\.-]+@[\w\.-]+\.\w+$" 
                    ErrorMessage="Invalid email format" ForeColor="Red" Display="Dynamic" />
            </div>
            
            <div class="form-group">
                <label for="txtToEmail">To Email *</label>
                <asp:TextBox ID="txtToEmail" runat="server" placeholder="recipient@domain.com"></asp:TextBox>
                <asp:RequiredFieldValidator ID="rfvTo" runat="server" ControlToValidate="txtToEmail" 
                    ErrorMessage="To Email is required" ForeColor="Red" Display="Dynamic" />
                <asp:RegularExpressionValidator ID="revTo" runat="server" ControlToValidate="txtToEmail" 
                    ValidationExpression="^[\w\.-]+@[\w\.-]+\.\w+$" 
                    ErrorMessage="Invalid email format" ForeColor="Red" Display="Dynamic" />
            </div>
        </div>
        
        <div class="form-group">
            <label for="txtSubject">Subject *</label>
            <asp:TextBox ID="txtSubject" runat="server" placeholder="Test Email from SMTP Tool"></asp:TextBox>
            <asp:RequiredFieldValidator ID="rfvSubject" runat="server" ControlToValidate="txtSubject" 
                ErrorMessage="Subject is required" ForeColor="Red" Display="Dynamic" />
        </div>
        
        <div class="form-group">
            <label for="txtBody">Body *</label>
            <asp:TextBox ID="txtBody" runat="server" TextMode="MultiLine" 
                placeholder="This is a test email sent from ASP.NET Web Forms SMTP Test Tool."></asp:TextBox>
            <asp:RequiredFieldValidator ID="rfvBody" runat="server" ControlToValidate="txtBody" 
                ErrorMessage="Body is required" ForeColor="Red" Display="Dynamic" />
        </div>
        
        <div class="form-group">
            <asp:Button ID="btnSend" runat="server" Text="Send Test Email" CssClass="btn" OnClick="btnSend_Click" />
        </div>
        
        <asp:Panel ID="pnlMessage" runat="server" Visible="false" CssClass="message">
            <asp:Label ID="lblMessage" runat="server"></asp:Label>
        </asp:Panel>
    </form>
</body>
</html>