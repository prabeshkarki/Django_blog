from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
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
# Post Serializer (FIXED)
# -----------------------------
class PostSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    author_id = serializers.PrimaryKeyRelatedField(
        source='author',
        queryset=User.objects.all(),
        write_only=True,
        required=False
    )
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False,
        allow_null=True
    )
    excerpt = serializers.CharField(read_only=True)
    reading_time = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'content', 'excerpt',
            'author', 'author_id', 'category', 'category_id',
            'created_at', 'updated_at', 'published', 'featured',
            'views', 'reading_time'
        ]
        read_only_fields = [
            'slug', 'author', 'created_at', 'updated_at', 
            'excerpt', 'views', 'reading_time', 'featured'
        ]
    
    def create(self, validated_data):
        # Get the request user from context (set in views.py)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['author'] = request.user
        
        # Remove category from validated_data if it exists (it will be set via category_id)
        validated_data.pop('category', None)
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Remove category from validated_data if it exists
        validated_data.pop('category', None)
        return super().update(instance, validated_data)


# -----------------------------
# User Serializer
# -----------------------------
class UserSerializer(serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'post_count']
        read_only_fields = ['date_joined', 'post_count']
    
    def get_post_count(self, obj):
        return obj.posts.count() if hasattr(obj, 'posts') else 0


# -----------------------------
# Register Serializer (IMPROVED)
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
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        # Check if username exists
        if User.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError({"username": "Username already exists."})
        
        # Check if email exists
        if attrs.get('email') and User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "Email already registered."})
        
        return attrs
    
    def create(self, validated_data):
        # Remove password2 from validated data
        validated_data.pop('password2')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user


# -----------------------------
# Post Create Serializer (Optional - for simplified POST)
# -----------------------------
class PostCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for POST requests only"""
    category_id = serializers.IntegerField(required=False, allow_null=True)
    
    class Meta:
        model = Post
        fields = ['title', 'content', 'category_id', 'published']
        extra_kwargs = {
            'published': {'required': False, 'default': True}
        }
    
    def create(self, validated_data):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError({"author": "Authentication required"})
        
        # Get category if category_id provided
        category_id = validated_data.pop('category_id', None)
        if category_id:
            try:
                category = Category.objects.get(id=category_id)
                validated_data['category'] = category
            except Category.DoesNotExist:
                raise serializers.ValidationError({"category_id": "Invalid category ID"})
        
        # Set author to current user
        validated_data['author'] = request.user
        
        return Post.objects.create(**validated_data)


# -----------------------------
# Login Serializer (For JWT)
# -----------------------------
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if not username or not password:
            raise serializers.ValidationError("Both username and password are required.")
        
        return attrs