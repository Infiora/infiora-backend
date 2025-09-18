from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class UserViewSetTestCase(APITestCase):
    def setUp(self):
        # Create test users
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

        # Create user managed by manager
        self.managed_user = User.objects.create_user(
            username="managed", email="managed@example.com", password="managedpass123", created_by=self.manager_user
        )

        # Create user managed by admin
        self.admin_managed_user = User.objects.create_user(
            username="adminmanaged",
            email="adminmanaged@example.com",
            password="managedpass123",
            created_by=self.admin_user,
        )

        self.user_list_url = "/api/v1/users/"


class UserListViewTests(UserViewSetTestCase):
    def test_admin_can_see_all_users(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.user_list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Admin should see all users (5 total)
        self.assertEqual(len(response.data), 5)

    def test_manager_sees_only_created_users(self):
        self.client.force_authenticate(user=self.manager_user)
        response = self.client.get(self.user_list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Manager should only see users they created (1 user)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["username"], "managed")

    def test_regular_user_forbidden(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(self.user_list_url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_user_unauthorized(self):
        response = self.client.get(self.user_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_list_filtering(self):
        self.client.force_authenticate(user=self.admin_user)

        # Filter by is_staff
        response = self.client.get(self.user_list_url, {"is_staff": "true"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        staff_users = [user for user in response.data if user["is_staff"]]
        self.assertEqual(len(staff_users), len(response.data))

    def test_user_list_search(self):
        self.client.force_authenticate(user=self.admin_user)

        # Search by username
        response = self.client.get(self.user_list_url, {"search": "admin"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(any("admin" in user["username"] for user in response.data))

    def test_user_list_ordering(self):
        self.client.force_authenticate(user=self.admin_user)

        # Order by username
        response = self.client.get(self.user_list_url, {"ordering": "username"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        usernames = [user["username"] for user in response.data]
        self.assertEqual(usernames, sorted(usernames))


class UserCreateViewTests(UserViewSetTestCase):
    def test_admin_can_create_user(self):
        self.client.force_authenticate(user=self.admin_user)
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "NewUser123",
            "first_name": "New",
            "last_name": "User",
            "is_active": True,
        }
        response = self.client.post(self.user_list_url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["username"], "newuser")
        self.assertEqual(response.data["created_by"], self.admin_user.id)

        # Verify user was created in database
        new_user = User.objects.get(username="newuser")
        self.assertEqual(new_user.created_by, self.admin_user)

    def test_manager_can_create_user(self):
        self.client.force_authenticate(user=self.manager_user)
        data = {
            "username": "managercreated",
            "email": "managercreated@example.com",
            "password": "ManagerCreated123",
            "is_active": True,
        }
        response = self.client.post(self.user_list_url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["created_by"], self.manager_user.id)

    def test_regular_user_cannot_create(self):
        self.client.force_authenticate(user=self.regular_user)
        data = {"username": "shouldnotwork", "email": "shouldnotwork@example.com", "password": "ShouldNotWork123"}
        response = self.client.post(self.user_list_url, data)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_user_validation(self):
        self.client.force_authenticate(user=self.admin_user)

        # Test missing required fields
        data = {"username": "incomplete"}
        response = self.client.post(self.user_list_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Test invalid email
        data = {"username": "invalidemail", "email": "not-an-email", "password": "ValidPass123"}
        response = self.client.post(self.user_list_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserDetailViewTests(UserViewSetTestCase):
    def test_admin_can_view_any_user(self):
        self.client.force_authenticate(user=self.admin_user)
        url = f"/api/v1/users/{self.regular_user.pk}/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], self.regular_user.username)

    def test_manager_can_view_created_users(self):
        self.client.force_authenticate(user=self.manager_user)
        url = f"/api/v1/users/{self.managed_user.pk}/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], self.managed_user.username)

    def test_manager_cannot_view_others_users(self):
        self.client.force_authenticate(user=self.manager_user)
        url = f"/api/v1/users/{self.regular_user.pk}/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_regular_user_forbidden(self):
        self.client.force_authenticate(user=self.regular_user)
        url = f"/api/v1/users/{self.regular_user.pk}/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class UserUpdateViewTests(UserViewSetTestCase):
    def test_admin_can_update_any_user(self):
        self.client.force_authenticate(user=self.admin_user)
        url = f"/api/v1/users/{self.regular_user.pk}/"
        data = {"first_name": "Updated", "last_name": "Name"}
        response = self.client.patch(url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["first_name"], "Updated")

    def test_admin_cannot_remove_own_superuser_status(self):
        self.client.force_authenticate(user=self.admin_user)
        url = f"/api/v1/users/{self.admin_user.pk}/"
        data = {"is_superuser": False}
        response = self.client.patch(url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Cannot remove superuser status from your own account", response.data["detail"])

    def test_admin_cannot_deactivate_own_account(self):
        self.client.force_authenticate(user=self.admin_user)
        url = f"/api/v1/users/{self.admin_user.pk}/"
        data = {"is_active": False}
        response = self.client.patch(url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Cannot deactivate your own account", response.data["detail"])

    def test_manager_can_update_created_users(self):
        self.client.force_authenticate(user=self.manager_user)
        url = f"/api/v1/users/{self.managed_user.pk}/"
        data = {"first_name": "Manager Updated"}
        response = self.client.patch(url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["first_name"], "Manager Updated")

    def test_manager_cannot_update_others_users(self):
        self.client.force_authenticate(user=self.manager_user)
        url = f"/api/v1/users/{self.regular_user.pk}/"
        data = {"first_name": "Should Not Work"}
        response = self.client.patch(url, data)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class UserDeleteViewTests(UserViewSetTestCase):
    def test_admin_can_delete_other_users(self):
        self.client.force_authenticate(user=self.admin_user)
        url = f"/api/v1/users/{self.regular_user.pk}/"
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(pk=self.regular_user.pk).exists())

    def test_admin_cannot_delete_own_account(self):
        self.client.force_authenticate(user=self.admin_user)
        url = f"/api/v1/users/{self.admin_user.pk}/"
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Cannot delete your own account", response.data["detail"])

    def test_manager_can_delete_created_users(self):
        self.client.force_authenticate(user=self.manager_user)
        url = f"/api/v1/users/{self.managed_user.pk}/"
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(pk=self.managed_user.pk).exists())

    def test_manager_cannot_delete_others_users(self):
        self.client.force_authenticate(user=self.manager_user)
        url = f"/api/v1/users/{self.regular_user.pk}/"
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class UserCustomActionsTests(UserViewSetTestCase):
    def test_activate_user(self):
        # Deactivate user first
        self.regular_user.is_active = False
        self.regular_user.save()

        self.client.force_authenticate(user=self.admin_user)
        url = f"/api/v1/users/{self.regular_user.pk}/activate/"
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_active"])

        # Verify in database
        self.regular_user.refresh_from_db()
        self.assertTrue(self.regular_user.is_active)

    def test_deactivate_user(self):
        self.client.force_authenticate(user=self.admin_user)
        url = f"/api/v1/users/{self.regular_user.pk}/deactivate/"
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["is_active"])

        # Verify in database
        self.regular_user.refresh_from_db()
        self.assertFalse(self.regular_user.is_active)

    def test_admin_cannot_deactivate_own_account(self):
        self.client.force_authenticate(user=self.admin_user)
        url = f"/api/v1/users/{self.admin_user.pk}/deactivate/"
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Cannot deactivate your own account", response.data["detail"])

    def test_make_staff(self):
        self.client.force_authenticate(user=self.admin_user)
        url = f"/api/v1/users/{self.regular_user.pk}/make_staff/"
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_staff"])

        # Verify in database
        self.regular_user.refresh_from_db()
        self.assertTrue(self.regular_user.is_staff)

    def test_remove_staff(self):
        self.client.force_authenticate(user=self.admin_user)
        url = f"/api/v1/users/{self.manager_user.pk}/remove_staff/"
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["is_staff"])

        # Verify in database
        self.manager_user.refresh_from_db()
        self.assertFalse(self.manager_user.is_staff)

    def test_admin_cannot_remove_own_staff_status(self):
        self.client.force_authenticate(user=self.admin_user)
        url = f"/api/v1/users/{self.admin_user.pk}/remove_staff/"
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Cannot remove staff status from your own account", response.data["detail"])

    def test_reset_password(self):
        self.client.force_authenticate(user=self.admin_user)
        url = f"/api/v1/users/{self.regular_user.pk}/reset_password/"
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("new_password", response.data)
        self.assertIn("detail", response.data)
        self.assertIn("message", response.data)

        # Verify password was changed
        self.regular_user.refresh_from_db()
        self.assertTrue(self.regular_user.check_password(response.data["new_password"]))

    def test_manager_can_use_actions_on_created_users(self):
        self.client.force_authenticate(user=self.manager_user)

        # Test deactivate on managed user
        url = f"/api/v1/users/{self.managed_user.pk}/deactivate/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Test make staff on managed user
        url = f"/api/v1/users/{self.managed_user.pk}/make_staff/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_manager_cannot_use_actions_on_others_users(self):
        self.client.force_authenticate(user=self.manager_user)

        # Try to deactivate user not created by manager
        url = f"/api/v1/users/{self.regular_user.pk}/deactivate/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
