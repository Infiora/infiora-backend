"""
Health check views for monitoring application status
"""

import time
from datetime import datetime

from django.core.cache import cache
from django.db import connection
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods


@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    """
    Health check endpoint with HTML UI for browser viewing.

    Returns HTTP 200 if healthy, HTTP 503 if unhealthy.
    """
    checks = {}
    overall_status = True

    # Database connectivity check
    db_status = check_database()
    checks["database"] = db_status
    if not db_status["healthy"]:
        overall_status = False

    # Cache connectivity check (if Redis/cache is configured)
    cache_status = check_cache()
    checks["cache"] = cache_status
    if not cache_status["healthy"]:
        overall_status = False

    # Storage check (if S3 is configured)
    storage_status = check_storage()
    checks["storage"] = storage_status
    if not storage_status["healthy"]:
        overall_status = False

    # Return JSON if requested via Accept header or query param
    if request.META.get("HTTP_ACCEPT", "").find("application/json") != -1 or request.GET.get("format") == "json":
        response_data = {
            "status": "healthy" if overall_status else "unhealthy",
            "timestamp": int(time.time()),
            "checks": checks,
        }
        status_code = 200 if overall_status else 503
        return JsonResponse(response_data, status=status_code)

    # Return HTML template
    context = {
        "checks": checks,
        "overall_status": overall_status,
        "status": "healthy" if overall_status else "unhealthy",
        "timestamp": datetime.now(),
    }
    status_code = 200 if overall_status else 503
    response = render(request, "health/check.html", context)
    response.status_code = status_code
    return response


@csrf_exempt
@require_http_methods(["GET"])
def readiness_check(request):
    """
    Readiness check for Kubernetes/container orchestration.

    Indicates if the application is ready to receive traffic.
    """
    status = "ready"
    reason = None

    # Check database connectivity (critical for readiness)
    db_status = check_database()
    if not db_status["healthy"]:
        status = "not_ready"
        reason = "database_unavailable"

    # Return JSON if requested
    if request.META.get("HTTP_ACCEPT", "").find("application/json") != -1 or request.GET.get("format") == "json":
        response_data = {"status": status, "timestamp": int(time.time())}
        if reason:
            response_data["reason"] = reason
        status_code = 200 if status == "ready" else 503
        return JsonResponse(response_data, status=status_code)

    # Return HTML template
    context = {
        "status": status,
        "reason": reason,
        "check_type": "readiness",
        "timestamp": datetime.now(),
    }
    status_code = 200 if status == "ready" else 503
    response = render(request, "health/simple.html", context)
    response.status_code = status_code
    return response


@csrf_exempt
@require_http_methods(["GET"])
def liveness_check(request):
    """
    Liveness check for Kubernetes/container orchestration.

    Indicates if the application is alive and should not be restarted.
    """
    status = "alive"

    # Return JSON if requested
    if request.META.get("HTTP_ACCEPT", "").find("application/json") != -1 or request.GET.get("format") == "json":
        response_data = {"status": status, "timestamp": int(time.time())}
        return JsonResponse(response_data, status=200)

    # Return HTML template
    context = {
        "status": status,
        "check_type": "liveness",
        "timestamp": datetime.now(),
    }
    response = render(request, "health/simple.html", context)
    return response


def check_database():
    """Check database connectivity and basic operations."""
    try:
        # Test default database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()

        # Check if we can perform a basic query
        if result[0] == 1:
            return {
                "healthy": True,
                "message": "Database connection successful",
                "response_time_ms": None,  # Could add timing if needed
            }
        else:
            return {
                "healthy": False,
                "message": "Database query returned unexpected result",
                "error": f"Expected 1, got {result[0]}",
            }

    except Exception as e:
        return {"healthy": False, "message": "Database connection failed", "error": str(e)}


def check_cache():
    """Check cache connectivity if configured."""
    try:
        # Test cache connection by setting and getting a test value
        test_key = "health_check_test"
        test_value = "test_value"

        cache.set(test_key, test_value, timeout=60)
        retrieved_value = cache.get(test_key)

        if retrieved_value == test_value:
            # Clean up test key
            cache.delete(test_key)
            return {"healthy": True, "message": "Cache connection successful"}
        else:
            return {
                "healthy": False,
                "message": "Cache test failed",
                "error": f"Expected {test_value}, got {retrieved_value}",
            }

    except Exception as e:
        # Cache might not be configured, which is okay
        return {"healthy": True, "message": "Cache not configured or unavailable", "error": str(e)}


def check_storage():
    """Check storage connectivity (S3 or local)."""
    try:
        from django.core.files.storage import default_storage

        # Test if we can access storage
        # This is a lightweight check - doesn't actually write files
        if hasattr(default_storage, "bucket_name"):
            # S3 storage
            return {"healthy": True, "message": "S3 storage configured", "storage_type": "s3"}
        else:
            # Local storage
            return {"healthy": True, "message": "Local storage configured", "storage_type": "local"}

    except Exception as e:
        return {"healthy": False, "message": "Storage check failed", "error": str(e)}
