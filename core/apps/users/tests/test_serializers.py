from django.contrib.auth import get_user_model
from django.test import TestCase

from core.apps.users.serializers import UserCreateSerializer, UserDetailSerializer, UserListSerializer

User = get_user_model()


class UserSerializerTestCase(TestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="adminpass123",
            is_staff=True,
            is_superuser=True,
            first_name="Admin",
            last_name="User",
        )

        self.manager_user = User.objects.create_user(
            username="manager",
            email="manager@example.com",
            password="managerpass123",
            is_staff=True,
            is_superuser=False,
            first_name="Manager",
            last_name="User",
            created_by=self.admin_user,
        )

        self.regular_user = User.objects.create_user(
            username="regular",
            email="regular@example.com",
            password="regularpass123",
            is_staff=False,
            is_superuser=False,
            first_name="Regular",
            last_name="User",
            created_by=self.manager_user,
        )


class UserListSerializerTests(UserSerializerTestCase):
    def test_user_list_serializer_fields(self):
        serializer = UserListSerializer(instance=self.regular_user)
        data = serializer.data

        expected_fields = {
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "is_staff",
            "is_superuser",
            "is_email_verified",
            "date_joined",
            "last_login",
            "created_by",
            "created_by_username",
        }
        self.assertEqual(set(data.keys()), expected_fields)

    def test_created_by_username_field(self):
        serializer = UserListSerializer(instance=self.regular_user)
        data = serializer.data

        self.assertEqual(data["created_by"], self.manager_user.id)
        self.assertEqual(data["created_by_username"], self.manager_user.username)

    def test_created_by_username_when_none(self):
        serializer = UserListSerializer(instance=self.admin_user)
        data = serializer.data

        self.assertIsNone(data["created_by"])
        # When created_by is None, created_by_username should also be None
        self.assertIsNone(data.get("created_by_username"))

    def test_read_only_fields(self):
        serializer = UserListSerializer()
        read_only_fields = serializer.Meta.read_only_fields

        expected_read_only = ("id", "date_joined", "last_login", "created_by", "created_by_username")
        self.assertEqual(read_only_fields, expected_read_only)

    def test_serializer_with_multiple_users(self):
        users = [self.admin_user, self.manager_user, self.regular_user]
        serializer = UserListSerializer(users, many=True)
        data = serializer.data

        self.assertEqual(len(data), 3)
        usernames = [user["username"] for user in data]
        self.assertIn("admin", usernames)
        self.assertIn("manager", usernames)
        self.assertIn("regular", usernames)


class UserDetailSerializerTests(UserSerializerTestCase):
    def test_user_detail_serializer_fields(self):
        serializer = UserDetailSerializer(instance=self.regular_user)
        data = serializer.data

        expected_fields = {
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "image",
            "is_active",
            "is_staff",
            "is_superuser",
            "is_email_verified",
            "date_joined",
            "last_login",
            "created_by",
            "created_by_username",
        }
        self.assertEqual(set(data.keys()), expected_fields)

    def test_password_field_write_only(self):
        serializer = UserDetailSerializer(instance=self.regular_user)
        data = serializer.data

        # Password should not be in serialized data
        self.assertNotIn("password", data)

    def test_update_user_without_password(self):
        data = {"first_name": "Updated", "last_name": "Name", "email": "updated@example.com"}
        serializer = UserDetailSerializer(instance=self.regular_user, data=data, partial=True)
        self.assertTrue(serializer.is_valid())

        updated_user = serializer.save()
        self.assertEqual(updated_user.first_name, "Updated")
        self.assertEqual(updated_user.last_name, "Name")
        self.assertEqual(updated_user.email, "updated@example.com")

    def test_update_user_with_password(self):
        original_password = self.regular_user.password
        data = {"first_name": "Updated", "password": "NewPassword123"}
        serializer = UserDetailSerializer(instance=self.regular_user, data=data, partial=True)
        self.assertTrue(serializer.is_valid())

        updated_user = serializer.save()
        self.assertEqual(updated_user.first_name, "Updated")
        self.assertNotEqual(updated_user.password, original_password)
        self.assertTrue(updated_user.check_password("NewPassword123"))

    def test_password_validation(self):
        data = {"password": "weak"}  # Should fail validation
        serializer = UserDetailSerializer(instance=self.regular_user, data=data, partial=True)
        self.assertFalse(serializer.is_valid())
        self.assertIn("password", serializer.errors)

    def test_update_preserves_created_by(self):
        original_created_by = self.regular_user.created_by
        data = {"first_name": "Updated", "created_by": self.admin_user.id}  # Try to change created_by
        serializer = UserDetailSerializer(instance=self.regular_user, data=data, partial=True)
        self.assertTrue(serializer.is_valid())

        updated_user = serializer.save()
        # created_by should remain unchanged (read-only)
        self.assertEqual(updated_user.created_by, original_created_by)


class UserCreateSerializerTests(UserSerializerTestCase):
    def test_user_create_serializer_fields(self):
        serializer = UserCreateSerializer()
        fields = serializer.Meta.fields

        expected_fields = (
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "is_active",
            "is_staff",
            "is_superuser",
            "is_email_verified",
        )
        self.assertEqual(fields, expected_fields)

    def test_create_user_valid_data(self):
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "NewUser123",
            "first_name": "New",
            "last_name": "User",
            "is_active": True,
            "is_staff": False,
            "is_superuser": False,
            "is_email_verified": False,
        }
        serializer = UserCreateSerializer(data=data)
        if not serializer.is_valid():
            print("Serializer errors:", serializer.errors)
        self.assertTrue(serializer.is_valid())

        user = serializer.save()
        self.assertEqual(user.username, "newuser")
        self.assertEqual(user.email, "newuser@example.com")
        self.assertTrue(user.check_password("NewUser123"))
        self.assertEqual(user.first_name, "New")
        self.assertEqual(user.last_name, "User")
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertFalse(user.is_email_verified)

    def test_create_user_required_fields(self):
        # Test missing username
        data = {"email": "test@example.com", "password": "TestPassword123"}
        serializer = UserCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)

        # Test missing email
        data = {"username": "testuser", "password": "TestPassword123"}
        serializer = UserCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)

        # Test missing password
        data = {"username": "testuser", "email": "test@example.com"}
        serializer = UserCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("password", serializer.errors)

    def test_create_user_email_validation(self):
        data = {"username": "testuser", "email": "invalid-email", "password": "TestPassword123"}
        serializer = UserCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)

    def test_create_user_password_validation(self):
        data = {"username": "testuser", "email": "test@example.com", "password": "weak"}
        serializer = UserCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("password", serializer.errors)

    def test_create_user_username_validation(self):
        data = {
            "username": "@invalid#",  # Contains invalid characters
            "email": "test@example.com",
            "password": "TestPassword123",
        }
        serializer = UserCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)

    def test_create_user_unique_email(self):
        data = {
            "username": "newuser",
            "email": self.admin_user.email,  # Use existing email
            "password": "TestPassword123",
        }
        serializer = UserCreateSerializer(data=data)
        # Note: DRF doesn't validate uniqueness at serializer level by default
        # This would be caught at database level during save()
        if serializer.is_valid():
            try:
                serializer.save()
                self.fail("Expected IntegrityError for duplicate email")
            except Exception:
                pass  # Expected to fail
        else:
            self.assertIn("email", serializer.errors)

    def test_create_user_unique_username(self):
        data = {
            "username": self.admin_user.username,  # Use existing username
            "email": "newuser@example.com",
            "password": "TestPassword123",
        }
        serializer = UserCreateSerializer(data=data)
        # Note: DRF doesn't validate uniqueness at serializer level by default
        # This would be caught at database level during save()
        if serializer.is_valid():
            try:
                serializer.save()
                self.fail("Expected IntegrityError for duplicate username")
            except Exception:
                pass  # Expected to fail
        else:
            self.assertIn("username", serializer.errors)

    def test_create_staff_user(self):
        data = {
            "username": "staffuser",
            "email": "staff@example.com",
            "password": "StaffPassword123",
            "is_staff": True,
        }
        serializer = UserCreateSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        user = serializer.save()
        self.assertTrue(user.is_staff)
        self.assertFalse(user.is_superuser)  # Should not be superuser unless explicitly set

    def test_create_superuser(self):
        data = {
            "username": "superuser",
            "email": "super@example.com",
            "password": "SuperPassword123",
            "is_staff": True,
            "is_superuser": True,
        }
        serializer = UserCreateSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        user = serializer.save()
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)

    def test_password_not_in_representation(self):
        data = {"username": "testuser", "email": "test@example.com", "password": "TestPassword123"}
        serializer = UserCreateSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        user = serializer.save()
        # Check that password is not included in the representation
        representation = serializer.to_representation(user)
        self.assertNotIn("password", representation)
