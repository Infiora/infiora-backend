from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class RegisterViewTests(APITestCase):

    def test_register_success(self):
        url = reverse("register")
        data = {"username": "testuser", "email": "test@example.com", "password": "testpass123"}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("username", response.data)
        self.assertIn("email", response.data)
        self.assertEqual(response.data["username"], "testuser")
        self.assertEqual(response.data["email"], "test@example.com")

        # Verify user was created in database
        user = User.objects.get(username="testuser")
        self.assertEqual(user.email, "test@example.com")

    def test_register_missing_fields(self):
        url = reverse("register")
        data = {}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)
        self.assertIn("email", response.data)
        self.assertIn("password", response.data)

    def test_register_invalid_email(self):
        url = reverse("register")
        data = {"username": "testuser", "email": "invalid-email", "password": "testpass123"}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_register_invalid_password(self):
        url = reverse("register")
        data = {"username": "testuser", "email": "test@example.com", "password": "weak"}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)


class LoginViewTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="testuser", email="test@example.com", password="testpass123")
        self.inactive_user = User.objects.create_user(
            username="inactive", email="inactive@example.com", password="testpass123", is_active=False
        )

    def test_login_with_username_success(self):
        url = reverse("login")
        data = {"login": "testuser", "password": "testpass123"}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access_token", response.data)
        self.assertIn("refresh_token", response.data)
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["username"], "testuser")

    def test_login_with_email_success(self):
        url = reverse("login")
        data = {"login": "test@example.com", "password": "testpass123"}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access_token", response.data)
        self.assertIn("refresh_token", response.data)
        self.assertIn("user", response.data)

    def test_login_invalid_credentials(self):
        url = reverse("login")
        data = {"login": "testuser", "password": "wrongpass123"}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("error", response.data)

    def test_login_inactive_user(self):
        url = reverse("login")
        data = {"login": "inactive", "password": "testpass123"}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("error", response.data)

    def test_login_missing_fields(self):
        url = reverse("login")
        data = {}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("login", response.data)
        self.assertIn("password", response.data)


class LogoutViewTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="testuser", email="test@example.com", password="testpass123")
        self.refresh = RefreshToken.for_user(self.user)

    def test_logout_success(self):
        url = reverse("logout")
        data = {"refresh_token": str(self.refresh)}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)

    def test_logout_invalid_token(self):
        url = reverse("logout")
        data = {"refresh_token": "invalid-token"}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)

    def test_logout_missing_token(self):
        url = reverse("logout")
        data = {}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("refresh_token", response.data)

    def test_logout_already_blacklisted_token(self):
        # First logout
        url = reverse("logout")
        data = {"refresh_token": str(self.refresh)}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Try to logout again with same token
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class RefreshTokenViewTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="testuser", email="test@example.com", password="testpass123")
        self.inactive_user = User.objects.create_user(
            username="inactive", email="inactive@example.com", password="testpass123", is_active=False
        )
        self.refresh = RefreshToken.for_user(self.user)
        self.inactive_refresh = RefreshToken.for_user(self.inactive_user)

    def test_refresh_token_success(self):
        url = reverse("refresh-token")
        data = {"refresh_token": str(self.refresh)}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access_token", response.data)
        self.assertIn("refresh_token", response.data)
        # New tokens should be different from old ones
        self.assertNotEqual(response.data["refresh_token"], str(self.refresh))

    def test_refresh_token_inactive_user(self):
        url = reverse("refresh-token")
        data = {"refresh_token": str(self.inactive_refresh)}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("message", response.data)

    def test_refresh_invalid_token(self):
        url = reverse("refresh-token")
        data = {"refresh_token": "invalid-token"}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_missing_token(self):
        url = reverse("refresh-token")
        data = {}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("refresh_token", response.data)

    def test_refresh_blacklisted_token(self):
        # First blacklist the token
        url = reverse("logout")
        data = {"refresh_token": str(self.refresh)}
        self.client.post(url, data, format="json")

        # Try to refresh with blacklisted token
        url = reverse("refresh-token")
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ForgotPasswordViewTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="testuser", email="test@example.com", password="testpass123")

    def test_forgot_password_success(self):
        url = reverse("forgot-password")
        data = {"email": "test@example.com"}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)

    def test_forgot_password_nonexistent_email(self):
        url = reverse("forgot-password")
        data = {"email": "nonexistent@example.com"}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_forgot_password_invalid_email(self):
        url = reverse("forgot-password")
        data = {"email": "invalid-email"}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_forgot_password_missing_email(self):
        url = reverse("forgot-password")
        data = {}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)


class ResetPasswordViewTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="testuser", email="test@example.com", password="testpass123")
        self.reset_token = RefreshToken.for_user(self.user)

    def test_reset_password_success(self):
        url = reverse("reset-password")
        data = {"token": str(self.reset_token), "password": "newpass123"}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)

        # Verify password was changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("newpass123"))
        self.assertFalse(self.user.check_password("testpass123"))

    def test_reset_password_invalid_token(self):
        url = reverse("reset-password")
        data = {"token": "invalid-token", "password": "newpass123"}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_reset_password_weak_password(self):
        url = reverse("reset-password")
        data = {"token": str(self.reset_token), "password": "weak"}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_reset_password_missing_fields(self):
        url = reverse("reset-password")
        data = {}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("token", response.data)
        self.assertIn("password", response.data)


class SendVerificationEmailViewTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="testuser", email="test@example.com", password="testpass123")
        self.verified_user = User.objects.create_user(
            username="verified", email="verified@example.com", password="testpass123", is_email_verified=True
        )

    def test_send_verification_email_success(self):
        url = reverse("send-verification-email")
        data = {"email": "test@example.com"}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)

    def test_send_verification_email_already_verified(self):
        url = reverse("send-verification-email")
        data = {"email": "verified@example.com"}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("message", response.data)

    def test_send_verification_email_nonexistent_user(self):
        url = reverse("send-verification-email")
        data = {"email": "nonexistent@example.com"}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)


class VerifyEmailViewTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="testuser", email="test@example.com", password="testpass123")
        self.verification_token = RefreshToken.for_user(self.user)

    def test_verify_email_success(self):
        url = reverse("verify-email")
        data = {"token": str(self.verification_token)}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)

        # Verify email was verified
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_email_verified)

    def test_verify_email_invalid_token(self):
        url = reverse("verify-email")
        data = {"token": "invalid-token"}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_verify_email_missing_token(self):
        url = reverse("verify-email")
        data = {}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("token", response.data)


class UserViewTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="testuser", email="test@example.com", password="testpass123")
        self.refresh = RefreshToken.for_user(self.user)
        self.access_token = self.refresh.access_token

    def test_get_user_profile_success(self):
        url = reverse("user")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "testuser")
        self.assertEqual(response.data["email"], "test@example.com")

    def test_get_user_profile_unauthorized(self):
        url = reverse("user")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_user_profile_put_success(self):
        url = reverse("user")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        data = {"first_name": "John", "last_name": "Doe"}
        response = self.client.put(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["first_name"], "John")
        self.assertEqual(response.data["last_name"], "Doe")

    def test_update_user_profile_patch_success(self):
        url = reverse("user")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        data = {"first_name": "Jane"}
        response = self.client.patch(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["first_name"], "Jane")

    def test_update_user_profile_unauthorized(self):
        url = reverse("user")
        data = {"first_name": "John"}
        response = self.client.patch(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_readonly_fields(self):
        url = reverse("user")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        data = {"username": "newusername", "email": "new@example.com", "is_email_verified": True, "first_name": "John"}
        response = self.client.patch(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Read-only fields should not change
        self.assertEqual(response.data["username"], "testuser")
        self.assertEqual(response.data["email"], "test@example.com")
        self.assertFalse(response.data["is_email_verified"])
        # Non read-only fields should change
        self.assertEqual(response.data["first_name"], "John")


class TokenSecurityTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="testuser", email="test@example.com", password="testpass123")

    def test_token_rotation_on_refresh(self):
        # Get initial tokens
        refresh = RefreshToken.for_user(self.user)
        old_refresh_token = str(refresh)

        # Refresh token
        url = reverse("refresh-token")
        data = {"refresh_token": old_refresh_token}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        new_refresh_token = response.data["refresh_token"]
        self.assertNotEqual(old_refresh_token, new_refresh_token)

        # Try to use old token again - should fail
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_blacklisted_token_cannot_be_used(self):
        refresh = RefreshToken.for_user(self.user)

        # Logout to blacklist token
        logout_url = reverse("logout")
        data = {"refresh_token": str(refresh)}
        self.client.post(logout_url, data, format="json")

        # Try to refresh with blacklisted token
        refresh_url = reverse("refresh-token")
        response = self.client.post(refresh_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_multiple_refresh_tokens_independent(self):
        # Create two refresh tokens for same user
        refresh1 = RefreshToken.for_user(self.user)
        refresh2 = RefreshToken.for_user(self.user)

        # Use first token
        url = reverse("refresh-token")
        data1 = {"refresh_token": str(refresh1)}
        response1 = self.client.post(url, data1, format="json")
        self.assertEqual(response1.status_code, status.HTTP_200_OK)

        # Second token should still work
        data2 = {"refresh_token": str(refresh2)}
        response2 = self.client.post(url, data2, format="json")
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
