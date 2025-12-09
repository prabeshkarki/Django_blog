from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Category, Post, UserProfile

from .models import Category, Post


# -----------------------------
# Category Serializer
# -----------------------------
class CategorySerializer(serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'post_count']
        read_only_fields = ['slug', 'post_count']

    def get_post_count(self, obj):
        return obj.posts.count() if hasattr(obj, 'posts') else 0


# -----------------------------
# Post Serializer
# -----------------------------
class PostSerializer(serializers.ModelSerializer):
    # Author fields
    author = serializers.StringRelatedField(read_only=True)
    # Expose author_id for frontend (read-only)
    author_id = serializers.IntegerField(source='author.id', read_only=True)

    # Category relationship
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        allow_null=True,
        required=False
    )

    # Image support
    image = serializers.ImageField(required=False, allow_null=True)

    # Excerpt (editable by user OR auto-generated)
    excerpt = serializers.CharField(
        max_length=300,
        required=False,
        allow_blank=True
    )

    # Computed / extra fields
    reading_time = serializers.IntegerField(read_only=True)
    image_url = serializers.SerializerMethodField()
    author_profile_picture = serializers.SerializerMethodField()
    author_bio = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'content', 'excerpt',
            'author', 'author_id',
            'category', 'category_id',
            'image', 'image_url',
            'author_profile_picture', 'author_bio',
            'created_at', 'updated_at',
            'published', 'featured', 'views',
            'reading_time',
        ]
        read_only_fields = [
            'slug', 'author', 'author_id',
            'created_at', 'updated_at',
            'views', 'reading_time', 'featured',
            'image_url', 'author_profile_picture', 'author_bio',
        ]

    def get_image_url(self, obj):
        request = self.context.get('request')
        url = obj.image_url  # property on model

        if request is not None and url.startswith('/'):
            return request.build_absolute_uri(url)
        return url

    def get_author_profile_picture(self, obj):
        request = self.context.get('request')
        url = obj.author_profile_picture

        if request is not None and url.startswith('/'):
            return request.build_absolute_uri(url)
        return url

    def get_author_bio(self, obj):
        return obj.author_bio or ''


# -----------------------------
# User Serializer
# -----------------------------
class UserSerializer(serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name',
            'last_name', 'date_joined', 'post_count'
        ]
        read_only_fields = ['date_joined', 'post_count']

    def get_post_count(self, obj):
        return obj.posts.count()


# -----------------------------
# Register Serializer
# -----------------------------
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2',
                  'first_name', 'last_name']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )

        if User.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError({"username": "Username already exists."})

        if attrs.get('email') and User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "Email already registered."})

        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        return User.objects.create_user(**validated_data)


# -----------------------------
# Simplified Post Create Serializer (unused but kept)
# -----------------------------
class PostCreateSerializer(serializers.ModelSerializer):
    category_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = Post
        fields = ['title', 'content', 'excerpt', 'category_id', 'published']
        extra_kwargs = {
            'published': {'required': False, 'default': True}
        }

    def create(self, validated_data):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError({"author": "Authentication required"})

        category_id = validated_data.pop('category_id', None)
        if category_id:
            try:
                validated_data['category'] = Category.objects.get(id=category_id)
            except Category.DoesNotExist:
                raise serializers.ValidationError({"category_id": "Invalid category ID"})

        validated_data['author'] = request.user
        return Post.objects.create(**validated_data)


# -----------------------------
# Login Serializer (if needed)
# -----------------------------
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if not attrs.get('username') or not attrs.get('password'):
            raise serializers.ValidationError("Both username and password are required.")
        return attrs
    
class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(
        source='user.first_name', required=False, allow_blank=True
    )
    last_name = serializers.CharField(
        source='user.last_name', required=False, allow_blank=True
    )
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'bio',
            'profile_picture',
            'profile_picture_url',
        ]
        read_only_fields = ['id', 'username', 'email', 'profile_picture_url']

    def get_profile_picture_url(self, obj):
        request = self.context.get('request')
        if obj.profile_picture:
            url = obj.profile_picture.url
        else:
            url = '/static/images/default_profile.png'
        if request is not None and url.startswith('/'):
            return request.build_absolute_uri(url)
        return url

    def update(self, instance, validated_data):
        # user fields come in nested under 'user'
        user_data = validated_data.pop('user', {})
        user = instance.user
        for attr in ['first_name', 'last_name']:
            if attr in user_data:
                setattr(user, attr, user_data[attr])
        user.save()
        return super().update(instance, validated_data)