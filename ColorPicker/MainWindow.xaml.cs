using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Input;
using System.Windows.Interop;
using System.Windows.Media;
using System.Windows.Threading;

namespace ColorPicker
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        #region Windows API Imports

        [DllImport("user32.dll")]
        private static extern bool RegisterHotKey(IntPtr hWnd, int id, uint fsModifiers, uint vk);

        [DllImport("user32.dll")]
        private static extern bool UnregisterHotKey(IntPtr hWnd, int id);

        [DllImport("user32.dll")]
        private static extern bool GetCursorPos(out POINT lpPoint);

        [DllImport("user32.dll")]
        private static extern IntPtr GetDC(IntPtr hwnd);

        [DllImport("user32.dll")]
        private static extern int ReleaseDC(IntPtr hwnd, IntPtr hdc);

        [DllImport("gdi32.dll")]
        private static extern uint GetPixel(IntPtr hdc, int nXPos, int nYPos);

        [DllImport("user32.dll")]
        private static extern bool SetProcessDPIAware();

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelMouseProc lpfn, IntPtr hMod, uint dwThreadId);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool UnhookWindowsHookEx(IntPtr hhk);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr GetModuleHandle(string lpModuleName);

        private delegate IntPtr LowLevelMouseProc(int nCode, IntPtr wParam, IntPtr lParam);

        [StructLayout(LayoutKind.Sequential)]
        public struct POINT
        {
            public int X;
            public int Y;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct MSLLHOOKSTRUCT
        {
            public POINT pt;
            public uint mouseData;
            public uint flags;
            public uint time;
            public IntPtr dwExtraInfo;
        }

        #endregion

        #region Constants

        private const int HOTKEY_ID = 9000;
        private const uint MOD_ALT = 0x0001;
        private const uint MOD_CONTROL = 0x0002;
        private const uint VK_C = 0x43;

        private const int WM_HOTKEY = 0x0312;

        private const int WH_MOUSE_LL = 14;
        private const int WM_LBUTTONDOWN = 0x0201;

        #endregion

        #region Fields

        private bool isPickingColor = false;
        private DispatcherTimer? pickTimer;
        private IntPtr hwnd;
        private IntPtr mouseHook = IntPtr.Zero;
        private LowLevelMouseProc? mouseProc;

        #endregion

        public MainWindow()
        {
            InitializeComponent();

            // Enable DPI awareness for accurate pixel picking
            SetProcessDPIAware();

            this.Loaded += MainWindow_Loaded;
            this.Closed += MainWindow_Closed;
        }

        private void MainWindow_Loaded(object sender, RoutedEventArgs e)
        {
            // Register global hotkey (Ctrl+Alt+C)
            WindowInteropHelper helper = new WindowInteropHelper(this);
            hwnd = helper.Handle;

            if (hwnd != IntPtr.Zero)
            {
                HwndSource source = HwndSource.FromHwnd(hwnd);
                source.AddHook(HwndHook);

                // Register hotkey
                RegisterHotKey(hwnd, HOTKEY_ID, MOD_CONTROL | MOD_ALT, VK_C);
            }
        }

        private void MainWindow_Closed(object? sender, EventArgs e)
        {
            // Unregister hotkey
            if (hwnd != IntPtr.Zero)
            {
                UnregisterHotKey(hwnd, HOTKEY_ID);
            }

            // Unhook mouse
            if (mouseHook != IntPtr.Zero)
            {
                UnhookWindowsHookEx(mouseHook);
                mouseHook = IntPtr.Zero;
            }

            pickTimer?.Stop();
        }

        private IntPtr HwndHook(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
        {
            if (msg == WM_HOTKEY)
            {
                if (wParam.ToInt32() == HOTKEY_ID)
                {
                    StartColorPicking();
                    handled = true;
                }
            }
            return IntPtr.Zero;
        }

        private void PickColorButton_Click(object sender, RoutedEventArgs e)
        {
            StartColorPicking();
        }

        private void StartColorPicking()
        {
            if (isPickingColor)
                return;

            isPickingColor = true;

            // Change button text to indicate picking mode
            PickColorButton.Content = "Click anywhere to pick...";
            PickColorButton.IsEnabled = false;

            // Minimize window to not interfere with color picking
            this.WindowState = WindowState.Minimized;

            // Install low-level mouse hook
            mouseProc = MouseHookCallback;
            using (var curProcess = System.Diagnostics.Process.GetCurrentProcess())
            using (var curModule = curProcess.MainModule)
            {
                if (curModule != null)
                {
                    mouseHook = SetWindowsHookEx(WH_MOUSE_LL, mouseProc,
                        GetModuleHandle(curModule.ModuleName), 0);
                }
            }

            // Start timer to check for Escape key
            pickTimer = new DispatcherTimer
            {
                Interval = TimeSpan.FromMilliseconds(50)
            };
            pickTimer.Tick += PickTimer_Tick;
            pickTimer.Start();
        }

        private void PickTimer_Tick(object? sender, EventArgs e)
        {
            // Check for Escape key to cancel
            if (Keyboard.IsKeyDown(Key.Escape))
            {
                CancelColorPicking();
            }
        }

        private IntPtr MouseHookCallback(int nCode, IntPtr wParam, IntPtr lParam)
        {
            if (nCode >= 0 && wParam == (IntPtr)WM_LBUTTONDOWN)
            {
                if (isPickingColor)
                {
                    // Capture color at cursor position
                    Dispatcher.BeginInvoke(new Action(() =>
                    {
                        CaptureColorAtCursor();
                    }));

                    // Block the click from propagating
                    return (IntPtr)1;
                }
            }

            return CallNextHookEx(mouseHook, nCode, wParam, lParam);
        }

        private void CaptureColorAtCursor()
        {
            try
            {
                // Get cursor position
                GetCursorPos(out POINT cursorPos);

                // Get the color at cursor position
                IntPtr hdc = GetDC(IntPtr.Zero);
                uint pixel = GetPixel(hdc, cursorPos.X, cursorPos.Y);
                ReleaseDC(IntPtr.Zero, hdc);

                // Convert pixel to RGB
                byte r = (byte)(pixel & 0x000000FF);
                byte g = (byte)((pixel & 0x0000FF00) >> 8);
                byte b = (byte)((pixel & 0x00FF0000) >> 16);

                // Update UI
                Dispatcher.Invoke(() =>
                {
                    UpdateColorDisplay(r, g, b, cursorPos.X, cursorPos.Y);
                    FinishColorPicking();
                });
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error capturing color: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                Dispatcher.Invoke(() => CancelColorPicking());
            }
        }

        private void UpdateColorDisplay(byte r, byte g, byte b, int x, int y)
        {
            // Update color preview
            ColorPreview.Background = new SolidColorBrush(Color.FromRgb(r, g, b));

            // Update HEX text
            string hexColor = $"#{r:X2}{g:X2}{b:X2}";
            HexTextBox.Text = hexColor;

            // Update RGB text
            RgbTextBox.Text = $"{r}, {g}, {b}";

            // Update position text
            PositionTextBox.Text = $"X: {x}, Y: {y}";
        }

        private void FinishColorPicking()
        {
            pickTimer?.Stop();
            pickTimer = null;

            // Unhook mouse
            if (mouseHook != IntPtr.Zero)
            {
                UnhookWindowsHookEx(mouseHook);
                mouseHook = IntPtr.Zero;
            }

            isPickingColor = false;
            PickColorButton.Content = "🎨 Pick Color";
            PickColorButton.IsEnabled = true;

            // Restore window
            this.WindowState = WindowState.Normal;
            this.Activate();
        }

        private void CancelColorPicking()
        {
            pickTimer?.Stop();
            pickTimer = null;

            // Unhook mouse
            if (mouseHook != IntPtr.Zero)
            {
                UnhookWindowsHookEx(mouseHook);
                mouseHook = IntPtr.Zero;
            }

            isPickingColor = false;
            PickColorButton.Content = "🎨 Pick Color";
            PickColorButton.IsEnabled = true;

            // Restore window
            this.WindowState = WindowState.Normal;
            this.Activate();
        }

        private void CopyHexButton_Click(object sender, RoutedEventArgs e)
        {
            if (!string.IsNullOrEmpty(HexTextBox.Text))
            {
                try
                {
                    Clipboard.SetText(HexTextBox.Text);
                    // Visual feedback
                    var originalContent = CopyHexButton.Content;
                    CopyHexButton.Content = "✓ Copied!";

                    var timer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1) };
                    timer.Tick += (s, args) =>
                    {
                        CopyHexButton.Content = originalContent;
                        timer.Stop();
                    };
                    timer.Start();
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"Error copying to clipboard: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                }
            }
        }
    }
}