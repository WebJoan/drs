import logging
from typing import Any

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django_prometheus.models import ExportModelOperationsMixin

LOGGER = logging.getLogger("default")


class User(ExportModelOperationsMixin("user"), AbstractUser):  # ty: ignore
    profile: "Profile"

    class RoleChoices(models.TextChoices):
        PRODUCT_MANAGER = 'product', 'Product Manager'
        SALES_MANAGER = 'sales', 'Sales Manager'
        ADMIN = 'admin', 'Admin'
        USER = 'user', 'User'

    email = models.EmailField(unique=True, null=False, blank=False)
    role = models.CharField(
        max_length=20,
        choices=RoleChoices.choices,
        default=RoleChoices.USER,
        verbose_name="Role",
        help_text="User role in the system",
    )

    def save(self, *args: Any, **kwargs: Any) -> None:
        created = self.pk is None
        if self.username != self.email:
            self.username = self.email
        super().save(*args, **kwargs)
        if created:
            Profile.objects.create(user=self)

    class Meta:
        ordering = ["id"]
        permissions = [
            ("is_product_manager", "Can manage products"),
            ("is_sales_manager", "Can manage sales"),
        ]

    def __str__(self) -> str:
        return self.email

    @property
    def indexed_name(self) -> str:
        return f"user_{self.id}"

    @property
    def is_product_manager(self) -> bool:
        """Check if user is a product manager"""
        return self.role == self.RoleChoices.PRODUCT_MANAGER

    @property
    def is_sales_manager(self) -> bool:
        """Check if user is a sales manager"""
        return self.role == self.RoleChoices.SALES_MANAGER


class Profile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
        primary_key=True,
    )

    class Meta:
        ordering = ["user"]

    def __str__(self) -> str:
        return f"Profile of {self.user.email}"
