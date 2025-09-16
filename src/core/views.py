from django.http import JsonResponse, HttpResponse
from django.db import connection
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django_ratelimit.decorators import ratelimit
import time
import psutil
from datetime import datetime


@csrf_exempt
@ratelimit(key='ip', rate='10/m', method='GET')
@require_http_methods(["GET", "HEAD"])
def health_check(request):
    """
    Health check endpoint with simple HTML UI
    """
    try:
        # Test database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_status = "✅ Healthy"
            db_color = "#28a745"
    except Exception as e:
        db_status = f"❌ Unhealthy: {str(e)}"
        db_color = "#dc3545"

    # Get current timestamp
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")

    # Determine overall status
    overall_status = "✅ Healthy" if "✅" in db_status else "❌ Unhealthy"
    overall_color = "#28a745" if "✅" in db_status else "#dc3545"

    # Check if JSON response is requested
    if request.GET.get('format') == 'json':
        response_data = {
            "status": "healthy" if "✅" in db_status else "unhealthy",
            "timestamp": int(time.time()),
            "service": "infiora-backend",
            "version": "1.0.0",
            "database": db_status,
            "debug": settings.DEBUG,
            "allowed_hosts": list(settings.ALLOWED_HOSTS),
            "host_header": request.get_host(),
        }
        status_code = 200 if "✅" in db_status else 503
        return JsonResponse(response_data, status=status_code)

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Infiora Backend - Health Check</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }}
            .container {{ max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
            h1 {{ color: #333; margin-bottom: 30px; text-align: center; }}
            .status-card {{ background: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid {overall_color}; }}
            .status-value {{ font-size: 24px; font-weight: bold; color: {overall_color}; }}
            .info-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }}
            .info-item {{ background: #f8f9fa; padding: 15px; border-radius: 6px; }}
            .info-label {{ font-weight: bold; color: #666; margin-bottom: 5px; }}
            .info-value {{ color: #333; }}
            .db-status {{ color: {db_color}; font-weight: bold; }}
            .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
            .refresh-btn {{ background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-top: 20px; }}
            .refresh-btn:hover {{ background: #0056b3; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 Infiora Backend Health Check</h1>

            <div class="status-card">
                <div class="info-label">Overall Status</div>
                <div class="status-value">{overall_status}</div>
            </div>

            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Service</div>
                    <div class="info-value">infiora-backend</div>
                </div>

                <div class="info-item">
                    <div class="info-label">Version</div>
                    <div class="info-value">1.0.0</div>
                </div>

                <div class="info-item">
                    <div class="info-label">Last Check</div>
                    <div class="info-value">{current_time}</div>
                </div>

                <div class="info-item">
                    <div class="info-label">Debug Mode</div>
                    <div class="info-value">{'🔧 Enabled' if settings.DEBUG else '🔒 Disabled'}</div>
                </div>

                <div class="info-item">
                    <div class="info-label">Database Status</div>
                    <div class="info-value db-status">{db_status}</div>
                </div>

                <div class="info-item">
                    <div class="info-label">Host Header</div>
                    <div class="info-value">{request.get_host()}</div>
                </div>
            </div>

            <div style="text-align: center;">
                <button class="refresh-btn" onclick="window.location.reload()">🔄 Refresh</button>
                <button class="refresh-btn" onclick="window.location.href='/metrics/'">📊 View Metrics</button>
            </div>

            <div class="footer">
                <p>Infiora Backend API • Timestamp: {int(time.time())}</p>
            </div>
        </div>
    </body>
    </html>
    """

    status_code = 200 if "✅" in db_status else 503
    return HttpResponse(html_content, content_type='text/html', status=status_code)

    except Exception as e:
        error_html = f"""
        <!DOCTYPE html>
        <html>
        <head><title>Health Check Error</title></head>
        <body style="font-family: sans-serif; padding: 20px;">
            <h1>❌ Health Check Error</h1>
            <p><strong>Error:</strong> {str(e)}</p>
            <p><strong>Service:</strong> infiora-backend</p>
        </body>
        </html>
        """
        return HttpResponse(error_html, content_type='text/html', status=500)


@csrf_exempt
@ratelimit(key='ip', rate='5/m', method='GET')
@require_http_methods(["GET"])
def metrics(request):
    """
    Application metrics endpoint with HTML UI
    """
    try:
        # System metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')

        # Database metrics
        db_connections = 0
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT count(*) FROM pg_stat_activity WHERE state = 'active'")
                db_connections = cursor.fetchone()[0]
        except Exception:
            db_connections = -1

        # Get current timestamp
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")

        # Format sizes for display
        def format_bytes(bytes_value):
            for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
                if bytes_value < 1024.0:
                    return f"{bytes_value:.1f} {unit}"
                bytes_value /= 1024.0
            return f"{bytes_value:.1f} PB"

        # Check if JSON response is requested
        if request.GET.get('format') == 'json':
            metrics_data = {
                "timestamp": int(time.time()),
                "service": "infiora-backend",
                "version": "1.0.0",
                "system": {
                    "cpu_percent": cpu_percent,
                    "memory": {
                        "total": memory.total,
                        "available": memory.available,
                        "percent": memory.percent,
                        "used": memory.used
                    },
                    "disk": {
                        "total": disk.total,
                        "used": disk.used,
                        "free": disk.free,
                        "percent": (disk.used / disk.total) * 100
                    }
                },
                "database": {
                    "active_connections": db_connections
                },
                "django": {
                    "debug": settings.DEBUG,
                    "allowed_hosts": list(settings.ALLOWED_HOSTS)
                }
            }
            return JsonResponse(metrics_data)

        # Colors for progress bars
        def get_color(percent):
            if percent < 50:
                return "#28a745"
            elif percent < 80:
                return "#ffc107"
            else:
                return "#dc3545"

        cpu_color = get_color(cpu_percent)
        memory_color = get_color(memory.percent)
        disk_percent = (disk.used / disk.total) * 100
        disk_color = get_color(disk_percent)

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Infiora Backend - Metrics</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }}
                .container {{ max-width: 1000px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                h1 {{ color: #333; margin-bottom: 30px; text-align: center; }}
                .metrics-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }}
                .metric-card {{ background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; }}
                .metric-title {{ font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px; display: flex; align-items: center; }}
                .metric-value {{ font-size: 24px; font-weight: bold; margin-bottom: 10px; }}
                .progress-bar {{ width: 100%; height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; margin-bottom: 10px; }}
                .progress-fill {{ height: 100%; transition: width 0.3s ease; }}
                .metric-details {{ color: #666; font-size: 14px; line-height: 1.4; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
                .refresh-btn {{ background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 0 5px; }}
                .refresh-btn:hover {{ background: #0056b3; }}
                .connection-status {{ padding: 10px; border-radius: 4px; margin-top: 10px; }}
                .connection-good {{ background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }}
                .connection-warning {{ background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }}
                .connection-bad {{ background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📊 Infiora Backend Metrics</h1>

                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-title">🖥️ CPU Usage</div>
                        <div class="metric-value" style="color: {cpu_color}">{cpu_percent:.1f}%</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: {cpu_percent}%; background: {cpu_color};"></div>
                        </div>
                        <div class="metric-details">
                            Current CPU utilization across all cores
                        </div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-title">💾 Memory Usage</div>
                        <div class="metric-value" style="color: {memory_color}">{memory.percent:.1f}%</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: {memory.percent}%; background: {memory_color};"></div>
                        </div>
                        <div class="metric-details">
                            Used: {format_bytes(memory.used)}<br>
                            Available: {format_bytes(memory.available)}<br>
                            Total: {format_bytes(memory.total)}
                        </div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-title">💿 Disk Usage</div>
                        <div class="metric-value" style="color: {disk_color}">{disk_percent:.1f}%</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: {disk_percent}%; background: {disk_color};"></div>
                        </div>
                        <div class="metric-details">
                            Used: {format_bytes(disk.used)}<br>
                            Free: {format_bytes(disk.free)}<br>
                            Total: {format_bytes(disk.total)}
                        </div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-title">🗄️ Database</div>
                        <div class="metric-value">
                            {db_connections if db_connections >= 0 else 'N/A'}
                            {'connection' if db_connections == 1 else 'connections'}
                        </div>
                        <div class="connection-status {'connection-good' if db_connections >= 0 and db_connections < 10 else 'connection-warning' if db_connections < 20 else 'connection-bad'}">
                            {'🟢' if db_connections >= 0 and db_connections < 10 else '🟡' if db_connections < 20 else '🔴'}
                            Active database connections
                            {f'({db_connections} active)' if db_connections >= 0 else '(Unable to query)'}
                        </div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-title">⚙️ Django Settings</div>
                        <div class="metric-details">
                            <strong>Debug Mode:</strong> {'🔧 Enabled' if settings.DEBUG else '🔒 Disabled'}<br>
                            <strong>Version:</strong> 1.0.0<br>
                            <strong>Service:</strong> infiora-backend<br>
                            <strong>Last Updated:</strong> {current_time}
                        </div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-title">🌐 Network Info</div>
                        <div class="metric-details">
                            <strong>Host Header:</strong> {request.get_host()}<br>
                            <strong>Allowed Hosts:</strong> {len(settings.ALLOWED_HOSTS)} configured<br>
                            <strong>Request Method:</strong> {request.method}<br>
                            <strong>User Agent:</strong> {request.META.get('HTTP_USER_AGENT', 'Unknown')[:50]}...
                        </div>
                    </div>
                </div>

                <div style="text-align: center;">
                    <button class="refresh-btn" onclick="window.location.reload()">🔄 Refresh Metrics</button>
                    <button class="refresh-btn" onclick="window.location.href='/health/'">❤️ Health Check</button>
                    <button class="refresh-btn" onclick="window.location.href='?format=json'">📄 JSON Format</button>
                </div>

                <div class="footer">
                    <p>Infiora Backend Metrics • Updated: {current_time} • Timestamp: {int(time.time())}</p>
                </div>
            </div>

            <script>
                // Auto-refresh every 30 seconds
                setTimeout(function() {{
                    window.location.reload();
                }}, 30000);
            </script>
        </body>
        </html>
        """

        return HttpResponse(html_content, content_type='text/html')

    except Exception as e:
        error_html = f"""
        <!DOCTYPE html>
        <html>
        <head><title>Metrics Error</title></head>
        <body style="font-family: sans-serif; padding: 20px;">
            <h1>❌ Metrics Error</h1>
            <p><strong>Error:</strong> {str(e)}</p>
            <p><strong>Service:</strong> infiora-backend</p>
            <a href="/health/">← Back to Health Check</a>
        </body>
        </html>
        """
        return HttpResponse(error_html, content_type='text/html', status=500)