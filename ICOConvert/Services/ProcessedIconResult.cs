using System.Collections.Generic;

namespace ICOConvert.Services
{
    public class ProcessedIconResult
    {
        public byte[] IconFile { get; set; }

        public IDictionary<int, string> Previews { get; } = new Dictionary<int, string>();
    }
}
