from typing import TYPE_CHECKING, Dict

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

if TYPE_CHECKING:
    from user.models import User as UserType

User = get_user_model()


class UserSimpleSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "role", "password"]
        extra_kwargs = {
            "first_name": {"required": True},
            "last_name": {"required": True},
            "email": {"required": True},
            "password": {"write_only": True},
            "role": {"read_only": True},  # Роль только для чтения
        }

    def create(self, validated_data: Dict) -> "UserType":
        """Create a new user."""
        password = validated_data.pop("password", None)
        user = User.objects.create(
            email=validated_data["email"],
            username=validated_data["email"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            is_active=True,
        )
        if password:
            user.set_password(password)
        else:
            # Set a random password if none provided
            user.set_unusable_password()
        user.save()
        return user

    def update(self, user: "UserType", validated_data: Dict) -> "UserType":
        """Update user data."""
        password = validated_data.pop("password", None)
        
        # Update basic fields
        user.first_name = validated_data.get("first_name", user.first_name)
        user.last_name = validated_data.get("last_name", user.last_name)
        user.email = validated_data.get("email", user.email)
        user.username = user.email  # Keep username in sync with email
        
        # Update password if provided
        if password:
            user.set_password(password)
        
        user.save()
        return user


class UpdatePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(
        write_only=True, allow_blank=False, allow_null=False
    )
    new_password = serializers.CharField(
        write_only=True, allow_blank=False, allow_null=False
    )

    class Meta:
        fields = ["current_password", "new_password"]

    def validate_current_password(self, current_password: str) -> str:
        if not self.instance.check_password(current_password):
            raise serializers.ValidationError("Current password is incorrect")
        return current_password

    @staticmethod
    def validate_new_password(value: str) -> str:
        validate_password(value)
        return value

    @staticmethod
    def update(user: "UserType", validated_data: Dict) -> "UserType":
        user.set_password(validated_data["new_password"])
        user.save()
        return user
