from django.contrib.auth import get_user_model
from django.test import TestCase

from core.general.permissions import CanCreateUsers, CanManageUsers, IsAdminUser

User = get_user_model()


class PermissionTestCase(TestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="admin", email="admin@example.com", password="adminpass123", is_staff=True, is_superuser=True
        )

        self.manager_user = User.objects.create_user(
            username="manager",
            email="manager@example.com",
            password="managerpass123",
            is_staff=True,
            is_superuser=False,
        )

        self.regular_user = User.objects.create_user(
            username="regular",
            email="regular@example.com",
            password="regularpass123",
            is_staff=False,
            is_superuser=False,
        )

        self.managed_user = User.objects.create_user(
            username="managed", email="managed@example.com", password="managedpass123", created_by=self.manager_user
        )


class IsAdminUserPermissionTests(PermissionTestCase):
    def setUp(self):
        super().setUp()
        self.permission = IsAdminUser()

    def test_admin_user_has_permission(self):
        from unittest.mock import Mock

        request = Mock()
        request.user = self.admin_user
        view = Mock()

        self.assertTrue(self.permission.has_permission(request, view))
        self.assertTrue(self.permission.has_object_permission(request, view, self.regular_user))

    def test_manager_user_no_permission(self):
        from unittest.mock import Mock

        request = Mock()
        request.user = self.manager_user
        view = Mock()

        self.assertFalse(self.permission.has_permission(request, view))
        self.assertFalse(self.permission.has_object_permission(request, view, self.regular_user))

    def test_regular_user_no_permission(self):
        from unittest.mock import Mock

        request = Mock()
        request.user = self.regular_user
        view = Mock()

        self.assertFalse(self.permission.has_permission(request, view))
        self.assertFalse(self.permission.has_object_permission(request, view, self.regular_user))

    def test_unauthenticated_user_no_permission(self):
        from unittest.mock import Mock

        from django.contrib.auth.models import AnonymousUser

        request = Mock()
        request.user = AnonymousUser()
        view = Mock()

        self.assertFalse(self.permission.has_permission(request, view))
        self.assertFalse(self.permission.has_object_permission(request, view, self.regular_user))


class CanCreateUsersPermissionTests(PermissionTestCase):
    def setUp(self):
        super().setUp()
        self.permission = CanCreateUsers()

    def test_admin_user_can_create(self):
        from unittest.mock import Mock

        request = Mock()
        request.user = self.admin_user
        view = Mock()

        self.assertTrue(self.permission.has_permission(request, view))

    def test_manager_user_can_create(self):
        from unittest.mock import Mock

        request = Mock()
        request.user = self.manager_user
        view = Mock()

        self.assertTrue(self.permission.has_permission(request, view))

    def test_regular_user_cannot_create(self):
        from unittest.mock import Mock

        request = Mock()
        request.user = self.regular_user
        view = Mock()

        self.assertFalse(self.permission.has_permission(request, view))

    def test_unauthenticated_user_cannot_create(self):
        from unittest.mock import Mock

        from django.contrib.auth.models import AnonymousUser

        request = Mock()
        request.user = AnonymousUser()
        view = Mock()

        self.assertFalse(self.permission.has_permission(request, view))


class CanManageUsersPermissionTests(PermissionTestCase):
    def setUp(self):
        super().setUp()
        self.permission = CanManageUsers()

    def test_admin_user_can_manage_all(self):
        from unittest.mock import Mock

        request = Mock()
        request.user = self.admin_user
        view = Mock()

        self.assertTrue(self.permission.has_permission(request, view))
        self.assertTrue(self.permission.has_object_permission(request, view, self.regular_user))
        self.assertTrue(self.permission.has_object_permission(request, view, self.managed_user))
        self.assertTrue(self.permission.has_object_permission(request, view, self.manager_user))

    def test_manager_user_can_manage_own_created(self):
        from unittest.mock import Mock

        request = Mock()
        request.user = self.manager_user
        view = Mock()

        self.assertTrue(self.permission.has_permission(request, view))
        self.assertTrue(self.permission.has_object_permission(request, view, self.managed_user))

    def test_manager_user_cannot_manage_others(self):
        from unittest.mock import Mock

        request = Mock()
        request.user = self.manager_user
        view = Mock()

        self.assertTrue(self.permission.has_permission(request, view))
        self.assertFalse(self.permission.has_object_permission(request, view, self.regular_user))
        self.assertFalse(self.permission.has_object_permission(request, view, self.admin_user))

    def test_regular_user_cannot_manage(self):
        from unittest.mock import Mock

        request = Mock()
        request.user = self.regular_user
        view = Mock()

        self.assertFalse(self.permission.has_permission(request, view))

    def test_object_without_created_by_returns_false(self):
        from unittest.mock import Mock

        request = Mock()
        request.user = self.manager_user
        view = Mock()

        # Object without created_by field
        obj = Mock()
        del obj.created_by  # Simulate object without created_by

        self.assertFalse(self.permission.has_object_permission(request, view, obj))


class HierarchicalRelationshipTests(TestCase):
    def test_created_by_relationship(self):
        admin = User.objects.create_user(
            username="admin", email="admin@example.com", password="adminpass123", is_staff=True, is_superuser=True
        )

        manager = User.objects.create_user(
            username="manager", email="manager@example.com", password="managerpass123", is_staff=True, created_by=admin
        )

        user = User.objects.create_user(
            username="user", email="user@example.com", password="userpass123", created_by=manager
        )

        # Test forward relationship
        self.assertEqual(manager.created_by, admin)
        self.assertEqual(user.created_by, manager)

        # Test reverse relationship
        admin_created_users = admin.created_users.all()
        manager_created_users = manager.created_users.all()

        self.assertIn(manager, admin_created_users)
        self.assertIn(user, manager_created_users)
        self.assertEqual(admin_created_users.count(), 1)
        self.assertEqual(manager_created_users.count(), 1)

    def test_created_by_can_be_null(self):
        user = User.objects.create_user(
            username="independent", email="independent@example.com", password="userpass123"
        )

        self.assertIsNone(user.created_by)

    def test_cascade_behavior_on_delete(self):
        admin = User.objects.create_user(
            username="admin", email="admin@example.com", password="adminpass123", is_staff=True, is_superuser=True
        )

        user = User.objects.create_user(
            username="user", email="user@example.com", password="userpass123", created_by=admin
        )

        admin_id = admin.id
        user.refresh_from_db()
        self.assertEqual(user.created_by_id, admin_id)

        # Delete admin user
        admin.delete()

        # User should still exist but created_by should be null
        user.refresh_from_db()
        self.assertIsNone(user.created_by)
