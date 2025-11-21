using System;

namespace MassEmailSender
{
    /// <summary>
    /// Thông tin người nhận email
    /// </summary>
    public class Recipient
    {
        public string Email { get; set; }
        public string Name { get; set; }

        public Recipient(string email, string name)
        {
            Email = email;
            Name = name;
        }

        public override string ToString()
        {
            return $"{Email} - {Name}";
        }
    }
}
