from django.http import JsonResponse
from django.shortcuts import render
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
    """Health check endpoint with clean template-based UI"""
    try:
        # Test database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_status = "Healthy"
            is_healthy = True
    except Exception as e:
        db_status = f"Unhealthy: {str(e)}"
        is_healthy = False

    try:
        # Check if JSON response is requested
        if request.GET.get('format') == 'json':
            response_data = {
                "status": "healthy" if is_healthy else "unhealthy",
                "timestamp": int(time.time()),
                "service": "infiora-backend",
                "version": "1.0.0",
                "database": db_status,
                "debug": settings.DEBUG,
                "allowed_hosts": list(settings.ALLOWED_HOSTS),
                "host_header": request.get_host(),
            }
            status_code = 200 if is_healthy else 503
            return JsonResponse(response_data, status=status_code)

        # Prepare template context
        context = {
            'overall_status': 'Healthy' if is_healthy else 'Unhealthy',
            'status_class': 'status-healthy' if is_healthy else 'status-unhealthy',
            'status_icon': '✓' if is_healthy else '✗',
            'current_time': datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
            'service': 'infiora-backend',
            'version': '1.0.0',
            'db_status': db_status,
            'debug_mode': 'Enabled' if settings.DEBUG else 'Disabled',
            'host_header': request.get_host(),
        }

        status_code = 200 if is_healthy else 503
        return render(request, 'health.html', context, status=status_code)

    except Exception as e:
        if request.GET.get('format') == 'json':
            return JsonResponse({
                "status": "error",
                "error": str(e),
                "service": "infiora-backend"
            }, status=500)

        context = {'error': str(e)}
        return render(request, 'health.html', context, status=500)


def format_bytes(bytes_value):
    """Helper function to format bytes into human readable format"""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes_value < 1024.0:
            return f"{bytes_value:.1f} {unit}"
        bytes_value /= 1024.0
    return f"{bytes_value:.1f} PB"

def get_color(percent):
    """Helper function to get color based on percentage"""
    if percent < 50:
        return "#34c759"
    elif percent < 80:
        return "#ff9500"
    else:
        return "#ff3b30"

@csrf_exempt
@ratelimit(key='ip', rate='5/m', method='GET')
@require_http_methods(["GET"])
def metrics(request):
    """Application metrics endpoint with clean template-based UI"""
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

        # Calculate values for template
        disk_percent = (disk.used / disk.total) * 100

        # Database status
        if db_connections >= 0 and db_connections < 10:
            db_status_class = 'status-good'
            db_status_text = f'{db_connections} Active'
        elif db_connections < 20:
            db_status_class = 'status-warning'
            db_status_text = f'{db_connections} Active'
        else:
            db_status_class = 'status-critical'
            db_status_text = f'{db_connections} Active' if db_connections >= 0 else 'Unavailable'

        # Prepare template context
        context = {
            'cpu_percent': f"{cpu_percent:.1f}",
            'cpu_color': get_color(cpu_percent),
            'memory_percent': f"{memory.percent:.1f}",
            'memory_color': get_color(memory.percent),
            'memory_used': format_bytes(memory.used),
            'memory_available': format_bytes(memory.available),
            'memory_total': format_bytes(memory.total),
            'disk_percent': f"{disk_percent:.1f}",
            'disk_color': get_color(disk_percent),
            'disk_used': format_bytes(disk.used),
            'disk_free': format_bytes(disk.free),
            'disk_total': format_bytes(disk.total),
            'db_connections': db_connections if db_connections >= 0 else 'N/A',
            'db_status_class': db_status_class,
            'db_status_text': db_status_text,
            'service': 'infiora-backend',
            'version': '1.0.0',
            'debug_mode': 'Enabled' if settings.DEBUG else 'Disabled',
            'current_time': datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
            'host_header': request.get_host(),
            'allowed_hosts_count': len(settings.ALLOWED_HOSTS),
            'request_method': request.method,
            'user_agent': request.META.get('HTTP_USER_AGENT', 'Unknown')[:50] + '...',
        }

        return render(request, 'metrics.html', context)

    except Exception as e:
        if request.GET.get('format') == 'json':
            return JsonResponse({
                "status": "error",
                "error": str(e),
                "service": "infiora-backend"
            }, status=500)

        context = {'error': str(e)}
        return render(request, 'metrics.html', context, status=500)