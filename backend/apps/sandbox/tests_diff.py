from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.sandbox.services.diff_service import compute_diff

User = get_user_model()


class SandboxDiffServiceTests(APITestCase):
    def test_compute_diff_identical_strings(self):
        expected = "line 1\nline 2"
        submitted = "line 1\nline 2"
        result = compute_diff(expected, submitted)

        self.assertFalse(result["has_changes"])
        self.assertEqual(result["additions_count"], 0)
        self.assertEqual(result["deletions_count"], 0)
        self.assertEqual(len(result["lines"]), 2)
        for line in result["lines"]:
            self.assertEqual(line["type"], "unchanged")

    def test_compute_diff_additions_and_deletions(self):
        expected = "const a = 1;\nconst b = 2;\nconsole.log(a);"
        submitted = "const a = 1;\nconst b = 3;\nconst c = 4;\nconsole.log(a);"
        result = compute_diff(expected, submitted)

        self.assertTrue(result["has_changes"])
        self.assertGreater(result["additions_count"], 0)
        self.assertGreater(result["deletions_count"], 0)
        self.assertIn("expected solution", result["unified_diff"].lower())

    def test_compute_diff_empty_inputs(self):
        result = compute_diff("", "")
        self.assertFalse(result["has_changes"])
        self.assertEqual(result["lines"], [])


class SandboxDiffApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="diffuser", password="password")

    def test_sandbox_diff_endpoint_authenticated(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("sandbox-diff")
        payload = {
            "expected": "function hello() {\n  return 'world';\n}",
            "submitted": "function hello() {\n  return 'universe';\n}",
        }
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("has_changes", response.data)
        self.assertTrue(response.data["has_changes"])
        self.assertIn("lines", response.data)

    def test_sandbox_diff_endpoint_unauthenticated(self):
        url = reverse("sandbox-diff")
        response = self.client.post(url, {"expected": "a", "submitted": "b"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
