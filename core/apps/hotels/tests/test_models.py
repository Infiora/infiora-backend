from django.contrib.auth import get_user_model
from django.test import TestCase

from core.apps.hotels.models import Hotel

User = get_user_model()


class HotelModelTest(TestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="admin", email="admin@test.com", password="testpass123", is_staff=True, is_superuser=True
        )

    def test_create_hotel(self):
        hotel = Hotel.objects.create(
            name="Test Hotel",
            description="A test hotel",
            address="123 Test St",
            phone="123-456-7890",
            email="test@hotel.com",
            website="https://testhotel.com",
            created_by=self.admin_user,
        )

        self.assertEqual(hotel.name, "Test Hotel")
        self.assertEqual(hotel.description, "A test hotel")
        self.assertEqual(hotel.address, "123 Test St")
        self.assertEqual(hotel.phone, "123-456-7890")
        self.assertEqual(hotel.email, "test@hotel.com")
        self.assertEqual(hotel.website, "https://testhotel.com")
        self.assertTrue(hotel.is_active)
        self.assertEqual(hotel.created_by, self.admin_user)
        self.assertIsNotNone(hotel.created_at)
        self.assertIsNotNone(hotel.updated_at)

    def test_hotel_str_method(self):
        hotel = Hotel.objects.create(name="Test Hotel", address="123 Test St", created_by=self.admin_user)
        self.assertEqual(str(hotel), "Test Hotel")

    def test_hotel_ordering(self):
        hotel1 = Hotel.objects.create(name="Hotel A", address="123 Test St", created_by=self.admin_user)
        hotel2 = Hotel.objects.create(name="Hotel B", address="456 Test St", created_by=self.admin_user)

        hotels = Hotel.objects.all()
        self.assertEqual(hotels[0], hotel2)  # Most recent first
        self.assertEqual(hotels[1], hotel1)
