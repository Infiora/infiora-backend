from django.contrib.auth import get_user_model
from django.test import TestCase

from core.apps.accounts.authentication import EmailOrUsernameModelBackend

User = get_user_model()


class EmailOrUsernameModelBackendTests(TestCase):

    def setUp(self):
        self.backend = EmailOrUsernameModelBackend()
        self.user = User.objects.create_user(username="testuser", email="test@example.com", password="testpass123")
        self.inactive_user = User.objects.create_user(
            username="inactive", email="inactive@example.com", password="testpass123", is_active=False
        )

    def test_authenticate_with_username_success(self):
        user = self.backend.authenticate(request=None, username="testuser", password="testpass123")
        self.assertEqual(user, self.user)

    def test_authenticate_with_email_success(self):
        user = self.backend.authenticate(request=None, username="test@example.com", password="testpass123")
        self.assertEqual(user, self.user)

    def test_authenticate_with_wrong_password(self):
        user = self.backend.authenticate(request=None, username="testuser", password="wrongpassword")
        self.assertIsNone(user)

    def test_authenticate_with_nonexistent_user(self):
        user = self.backend.authenticate(request=None, username="nonexistent", password="testpass123")
        self.assertIsNone(user)

    def test_authenticate_with_inactive_user(self):
        user = self.backend.authenticate(request=None, username="inactive", password="testpass123")
        # Backend should return the user even if inactive
        # (Django will check is_active later)
        self.assertEqual(user, self.inactive_user)

    def test_authenticate_case_insensitive_email(self):
        user = self.backend.authenticate(request=None, username="TEST@EXAMPLE.COM", password="testpass123")
        # This should fail since our backend is case-sensitive
        self.assertIsNone(user)

    def test_authenticate_partial_email_match(self):
        user = self.backend.authenticate(request=None, username="test@", password="testpass123")
        self.assertIsNone(user)

    def test_authenticate_partial_username_match(self):
        user = self.backend.authenticate(request=None, username="test", password="testpass123")
        self.assertIsNone(user)

    def test_authenticate_with_no_username(self):
        user = self.backend.authenticate(request=None, username=None, password="testpass123")
        self.assertIsNone(user)

    def test_authenticate_with_no_password(self):
        user = self.backend.authenticate(request=None, username="testuser", password=None)
        self.assertIsNone(user)

    def test_authenticate_with_empty_username(self):
        user = self.backend.authenticate(request=None, username="", password="testpass123")
        self.assertIsNone(user)

    def test_authenticate_with_empty_password(self):
        user = self.backend.authenticate(request=None, username="testuser", password="")
        self.assertIsNone(user)

    def test_duplicate_email_constraint_prevents_creation(self):
        # Test that unique constraint on email works
        from django.db import IntegrityError

        with self.assertRaises(IntegrityError):
            User.objects.create_user(username="testuser2", email="test@example.com", password="testpass123")

    def test_normal_authentication_after_failed_creation(self):
        # Normal authentication should work
        user = self.backend.authenticate(request=None, username="test@example.com", password="testpass123")
        self.assertEqual(user, self.user)
