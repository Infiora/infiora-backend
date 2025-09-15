from django.http import JsonResponse
from django.db import connection
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import time


@csrf_exempt
@require_http_methods(["GET", "HEAD"])
def health_check(request):
    """
    Health check endpoint that verifies:
    - Django is running
    - Database connection is working
    - Basic system information
    """
    try:
        # Test database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    # Get current timestamp
    timestamp = int(time.time())

    try:
        response_data = {
            "status": "healthy" if db_status == "healthy" else "unhealthy",
            "timestamp": timestamp,
            "service": "infiora-backend",
            "version": "1.0.0",
            "database": db_status,
            "debug": settings.DEBUG,
            "allowed_hosts": list(settings.ALLOWED_HOSTS),
            "host_header": request.get_host(),
        }

        # Return 200 if healthy, 503 if unhealthy
        status_code = 200 if response_data["status"] == "healthy" else 503

        return JsonResponse(response_data, status=status_code)

    except Exception as e:
        # Fallback response if there's any issue
        return JsonResponse({
            "status": "error",
            "error": str(e),
            "service": "infiora-backend"
        }, status=500)