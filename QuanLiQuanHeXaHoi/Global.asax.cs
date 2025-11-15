using System;
using System.Web;
using System.Web.Http;
using QuanLiQuanHeXaHoi.Data;

namespace QuanLiQuanHeXaHoi
{
    public class Global : HttpApplication
    {
        protected void Application_Start(object sender, EventArgs e)
        {
            // Configure Web API
            GlobalConfiguration.Configure(WebApiConfig.Register);

            // Initialize database
            AppDbContext.Initialize();
        }

        protected void Application_BeginRequest(object sender, EventArgs e)
        {
            // Handle CORS preflight requests
            if (HttpContext.Current.Request.HttpMethod == "OPTIONS")
            {
                HttpContext.Current.Response.AddHeader("Access-Control-Allow-Origin", "*");
                HttpContext.Current.Response.AddHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
                HttpContext.Current.Response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
                HttpContext.Current.Response.End();
            }
        }
    }
}
