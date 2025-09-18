from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TestCase

from core.shared.storage.uploads import generate_upload_path

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
        upload_func = generate_upload_path("users", "image")
        path = upload_func(user, filename)

        self.assertTrue(path.startswith(f"uploads/users/{user.id}/"))
        self.assertTrue(path.endswith(".jpg"))
        # New behavior: uses field name instead of original filename
        self.assertEqual(path, f"uploads/users/{user.id}/image.jpg")

    def test_user_image_path_preserves_extension(self):
        user = User.objects.create_user(username="testuser", email="test@example.com", password="testpass123")
        filename = "test_image.png"
        upload_func = generate_upload_path("users", "image")
        path = upload_func(user, filename)

        self.assertTrue(path.endswith(".png"))

    def test_user_image_path_consistent_for_same_filename(self):
        user = User.objects.create_user(username="testuser", email="test@example.com", password="testpass123")
        filename = "test_image.jpg"
        upload_func = generate_upload_path("users", "image")
        path1 = upload_func(user, filename)
        path2 = upload_func(user, filename)

        # Both paths should be the same (new behavior uses field name)
        self.assertEqual(path1, path2)
        # Both should end with .jpg
        self.assertTrue(path1.endswith(".jpg"))
        self.assertTrue(path2.endswith(".jpg"))
        # Both should contain the user ID and field name
        self.assertEqual(path1, f"uploads/users/{user.id}/image.jpg")
        self.assertEqual(path2, f"uploads/users/{user.id}/image.jpg")

    def test_user_image_path_different_users(self):
        user1 = User.objects.create_user(username="testuser1", email="test1@example.com", password="testpass123")
        user2 = User.objects.create_user(username="testuser2", email="test2@example.com", password="testpass123")
        filename = "test_image.jpg"
        upload_func = generate_upload_path("users", "image")
        path1 = upload_func(user1, filename)
        path2 = upload_func(user2, filename)

        self.assertEqual(path1, f"uploads/users/{user1.id}/image.jpg")
        self.assertEqual(path2, f"uploads/users/{user2.id}/image.jpg")
        self.assertNotEqual(path1, path2)
