from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TestCase

from core.apps.accounts.models import user_image_path

User = get_user_model()


class AccountModelTests(TestCase):

    def test_create_user(self):
        user = User.objects.create_user(username="testuser", email="test@example.com", password="testpass123")
        self.assertEqual(user.username, "testuser")
        self.assertEqual(user.email, "test@example.com")
        self.assertTrue(user.check_password("testpass123"))
        self.assertFalse(user.is_email_verified)
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_superuser(self):
        admin_user = User.objects.create_superuser(
            username="admin", email="admin@example.com", password="adminpass123"
        )
        self.assertEqual(admin_user.username, "admin")
        self.assertEqual(admin_user.email, "admin@example.com")
        self.assertTrue(admin_user.check_password("adminpass123"))
        self.assertTrue(admin_user.is_active)
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)

    def test_email_field_unique(self):
        User.objects.create_user(username="user1", email="test@example.com", password="pass123")
        with self.assertRaises(IntegrityError):
            User.objects.create_user(username="user2", email="test@example.com", password="pass123")

    def test_username_field_unique(self):
        User.objects.create_user(username="testuser", email="test1@example.com", password="pass123")
        with self.assertRaises(IntegrityError):
            User.objects.create_user(username="testuser", email="test2@example.com", password="pass123")

    def test_email_verification_default(self):
        user = User.objects.create_user(username="testuser", email="test@example.com", password="testpass123")
        self.assertFalse(user.is_email_verified)

    def test_email_verification_can_be_set(self):
        user = User.objects.create_user(username="testuser", email="test@example.com", password="testpass123")
        user.is_email_verified = True
        user.save()
        user.refresh_from_db()
        self.assertTrue(user.is_email_verified)

    def test_user_string_representation(self):
        user = User.objects.create_user(username="testuser", email="test@example.com", password="testpass123")
        self.assertEqual(str(user), "testuser")

    def test_user_image_field(self):
        user = User.objects.create_user(username="testuser", email="test@example.com", password="testpass123")
        self.assertIsNone(user.image.name)


class UserImagePathTests(TestCase):

    def test_user_image_path_generation(self):
        user = User.objects.create_user(username="testuser", email="test@example.com", password="testpass123")
        filename = "test_image.jpg"
        path = user_image_path(user, filename)

        self.assertTrue(path.startswith(f"uploads/users/{user.id}/"))
        self.assertTrue(path.endswith(".jpg"))
        self.assertNotEqual(path, f"uploads/users/{user.id}/{filename}")

    def test_user_image_path_preserves_extension(self):
        user = User.objects.create_user(username="testuser", email="test@example.com", password="testpass123")
        filename = "test_image.png"
        path = user_image_path(user, filename)

        self.assertTrue(path.endswith(".png"))

    def test_user_image_path_unique_for_same_filename(self):
        user = User.objects.create_user(username="testuser", email="test@example.com", password="testpass123")
        filename = "test_image.jpg"
        path1 = user_image_path(user, filename)
        path2 = user_image_path(user, filename)

        self.assertNotEqual(path1, path2)

    def test_user_image_path_different_users(self):
        user1 = User.objects.create_user(username="testuser1", email="test1@example.com", password="testpass123")
        user2 = User.objects.create_user(username="testuser2", email="test2@example.com", password="testpass123")
        filename = "test_image.jpg"
        path1 = user_image_path(user1, filename)
        path2 = user_image_path(user2, filename)

        self.assertIn(f"uploads/users/{user1.id}/", path1)
        self.assertIn(f"uploads/users/{user2.id}/", path2)
        self.assertNotEqual(path1, path2)
