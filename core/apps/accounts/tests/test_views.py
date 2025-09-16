from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class AuthTests(APITestCase):

    def test_register(self):
        url = reverse("register")
        data = {"username": "testuser", "password": "password123", "email": "testuser@example.com"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
