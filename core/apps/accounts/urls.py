from django.urls import path

from .views import (
    ForgotPasswordView,
    LoginView,
    LogoutView,
    RefreshTokenView,
    RegisterView,
    ResetPasswordView,
    SendVerificationEmailView,
    VerifyEmailView,
)

urlpatterns = [
    path("auth/register", RegisterView.as_view(), name="register"),
    path("auth/login", LoginView.as_view(), name="login"),
    path("auth/logout", LogoutView.as_view(), name="logout"),
    path("auth/refresh-tokens", RefreshTokenView.as_view(), name="refresh-tokens"),
    path("auth/forgot-password", ForgotPasswordView.as_view(), name="forgot-password"),
    path("auth/reset-password", ResetPasswordView.as_view(), name="reset-password"),
    path(
        "auth/send-verification-email",
        SendVerificationEmailView.as_view(),
        name="send-verification-email",
    ),
    path("auth/verify-email", VerifyEmailView.as_view(), name="verify-email"),
]
