from django.urls import path

from .views import (
    ForgotPasswordView,
    LoginView,
    LogoutView,
    RefreshTokenView,
    RegisterView,
    ResetPasswordView,
    SendVerificationEmailView,
    UserView,
    VerifyEmailView,
)

urlpatterns = [
    # Authentication endpoints
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/refresh-token/", RefreshTokenView.as_view(), name="refresh-token"),
    # Password management
    path("auth/forgot-password/", ForgotPasswordView.as_view(), name="forgot-password"),
    path("auth/reset-password/", ResetPasswordView.as_view(), name="reset-password"),
    # Email verification
    path("auth/send-verification-email/", SendVerificationEmailView.as_view(), name="send-verification-email"),
    path("auth/verify-email/", VerifyEmailView.as_view(), name="verify-email"),
    # User endpoints
    path("auth/user/", UserView.as_view(), name="user"),
]
