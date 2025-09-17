from django.contrib.auth import get_user_model
from django.test import TestCase

from core.apps.accounts.serializers import (
    AccountSerializer,
    ForgotPasswordSerializer,
    LoginSerializer,
    LogoutSerializer,
    RefreshTokenSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    SendVerificationEmailSerializer,
    VerifyEmailSerializer,
)

User = get_user_model()


class AccountSerializerTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="testuser", email="test@example.com", password="testpass123")

    def test_serialization(self):
        serializer = AccountSerializer(self.user)
        data = serializer.data

        self.assertEqual(data["username"], "testuser")
        self.assertEqual(data["email"], "test@example.com")
        self.assertFalse(data["is_email_verified"])
        self.assertIn("id", data)
        self.assertIn("date_joined", data)

    def test_read_only_fields(self):
        serializer = AccountSerializer(
            self.user,
            data={
                "id": 999,
                "username": "newuser",
                "email": "new@example.com",
                "is_email_verified": True,
                "first_name": "John",
            },
        )
        self.assertTrue(serializer.is_valid())
        updated_user = serializer.save()

        # Read-only fields should not change
        self.assertEqual(updated_user.username, "testuser")
        self.assertEqual(updated_user.email, "test@example.com")
        self.assertFalse(updated_user.is_email_verified)

        # Non read-only fields should change
        self.assertEqual(updated_user.first_name, "John")

    def test_partial_update(self):
        serializer = AccountSerializer(self.user, data={"first_name": "Jane"}, partial=True)
        self.assertTrue(serializer.is_valid())
        updated_user = serializer.save()
        self.assertEqual(updated_user.first_name, "Jane")


class RegisterSerializerTests(TestCase):

    def test_valid_registration_data(self):
        data = {"username": "newuser", "email": "new@example.com", "password": "testpass123"}
        serializer = RegisterSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_create_user(self):
        data = {"username": "newuser", "email": "new@example.com", "password": "testpass123"}
        serializer = RegisterSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        user = serializer.save()

        self.assertEqual(user.username, "newuser")
        self.assertEqual(user.email, "new@example.com")
        self.assertTrue(user.check_password("testpass123"))

    def test_required_fields(self):
        data = {}
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)
        self.assertIn("email", serializer.errors)
        self.assertIn("password", serializer.errors)

    def test_email_validation(self):
        data = {"username": "newuser", "email": "invalid-email", "password": "testpass123"}
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)

    def test_username_validation(self):
        data = {"username": "invalid@username", "email": "new@example.com", "password": "testpass123"}
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)

    def test_password_validation(self):
        data = {"username": "newuser", "email": "new@example.com", "password": "weak"}
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("password", serializer.errors)


class LoginSerializerTests(TestCase):

    def test_valid_login_data(self):
        data = {"login": "testuser", "password": "testpass123"}
        serializer = LoginSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_required_fields(self):
        data = {}
        serializer = LoginSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("login", serializer.errors)
        self.assertIn("password", serializer.errors)

    def test_password_validation(self):
        data = {"login": "testuser", "password": "weak"}
        serializer = LoginSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("password", serializer.errors)


class TokenSerializerTests(TestCase):

    def test_logout_serializer(self):
        data = {"refresh_token": "some-token"}
        serializer = LogoutSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_refresh_token_serializer(self):
        data = {"refresh_token": "some-token"}
        serializer = RefreshTokenSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_reset_password_serializer(self):
        data = {"token": "some-token", "password": "newpass123"}
        serializer = ResetPasswordSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_verify_email_serializer(self):
        data = {"token": "some-token"}
        serializer = VerifyEmailSerializer(data=data)
        self.assertTrue(serializer.is_valid())


class ForgotPasswordSerializerTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="testuser", email="test@example.com", password="testpass123")

    def test_valid_email(self):
        data = {"email": "test@example.com"}
        serializer = ForgotPasswordSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_nonexistent_email(self):
        data = {"email": "nonexistent@example.com"}
        serializer = ForgotPasswordSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)

    def test_invalid_email_format(self):
        data = {"email": "invalid-email"}
        serializer = ForgotPasswordSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)


class SendVerificationEmailSerializerTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="testuser", email="test@example.com", password="testpass123")

    def test_valid_email(self):
        data = {"email": "test@example.com"}
        serializer = SendVerificationEmailSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_nonexistent_email(self):
        data = {"email": "nonexistent@example.com"}
        serializer = SendVerificationEmailSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)
