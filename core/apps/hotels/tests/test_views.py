from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from core.apps.hotels.models import Hotel

User = get_user_model()


class HotelViewSetTest(APITestCase):
    def setUp(self):
        # Create test users
        self.admin_user = User.objects.create_user(
            username="admin", email="admin@test.com", password="adminpass123", is_staff=True, is_superuser=True
        )
        self.staff_user = User.objects.create_user(
            username="staff", email="staff@test.com", password="staffpass123", is_staff=True, is_superuser=False
        )
        self.regular_user = User.objects.create_user(
            username="regular", email="regular@test.com", password="regularpass123", is_staff=False, is_superuser=False
        )

        # Create test hotels
        self.admin_hotel = Hotel.objects.create(name="Admin Hotel", address="123 Admin St", created_by=self.admin_user)
        self.staff_hotel = Hotel.objects.create(name="Staff Hotel", address="456 Staff St", created_by=self.staff_user)

    def test_admin_can_list_all_hotels(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get("/api/v1/hotels/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_staff_can_only_list_own_hotels(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get("/api/v1/hotels/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Staff Hotel")

    def test_regular_user_cannot_list_hotels(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/v1/hotels/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_user_cannot_list_hotels(self):
        response = self.client.get("/api/v1/hotels/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_staff_can_create_hotel(self):
        self.client.force_authenticate(user=self.staff_user)
        data = {
            "name": "New Hotel",
            "description": "A new hotel",
            "address": "789 New St",
            "phone": "123-456-7890",
            "email": "new@hotel.com",
            "website": "https://newhotel.com",
        }
        response = self.client.post("/api/v1/hotels/", data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "New Hotel")
        self.assertEqual(response.data["created_by"], self.staff_user.id)

    def test_regular_user_cannot_create_hotel(self):
        self.client.force_authenticate(user=self.regular_user)
        data = {"name": "New Hotel", "address": "789 New St"}
        response = self.client.post("/api/v1/hotels/", data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_retrieve_any_hotel(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(f"/api/v1/hotels/{self.staff_hotel.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Staff Hotel")

    def test_staff_cannot_retrieve_other_staff_hotel(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get(f"/api/v1/hotels/{self.admin_hotel.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_staff_can_update_own_hotel(self):
        self.client.force_authenticate(user=self.staff_user)
        data = {"name": "Updated Staff Hotel"}
        response = self.client.patch(f"/api/v1/hotels/{self.staff_hotel.id}/", data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Updated Staff Hotel")

    def test_staff_can_delete_own_hotel(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.delete(f"/api/v1/hotels/{self.staff_hotel.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Hotel.objects.filter(id=self.staff_hotel.id).exists())

    def test_duplicate_hotel_name_validation(self):
        self.client.force_authenticate(user=self.staff_user)
        data = {
            "name": "Admin Hotel",  # Same name as existing hotel
            "address": "Different Address",
        }
        response = self.client.post("/api/v1/hotels/", data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.data)
