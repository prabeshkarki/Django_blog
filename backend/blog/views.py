# blog/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Category, Post, UserProfile
from .serializers import (
    CategorySerializer,
    PostSerializer,
    RegisterSerializer,
    UserSerializer,
    UserProfileSerializer,
)


# -----------------------------
# Custom JWT to include username
# -----------------------------
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Extra claims for frontend (used in utils/auth.js)
        token["username"] = user.username
        token["email"] = user.email
        return token


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


# -----------------------------
# Categories (list + create)
# -----------------------------
@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def categories_view(request):
    """
    GET  /api/categories/  -> list all categories
    POST /api/categories/  -> create category (requires auth)
    """
    if request.method == "GET":
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # POST: create category
    if not request.user.is_authenticated:
        return Response(
            {"detail": "Authentication required"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    serializer = CategorySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_category(request, pk):
    try:
        category = Category.objects.get(pk=pk)
        category.delete()
        return Response(
            {"detail": "Category deleted"}, status=status.HTTP_204_NO_CONTENT
        )
    except Category.DoesNotExist:
        return Response(
            {"detail": "Category not found"}, status=status.HTTP_404_NOT_FOUND
        )


# -----------------------------
# Posts (list + create)
# -----------------------------
@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def posts_view(request):
    """
    GET  /api/posts/               -> public list of published posts
    GET  /api/posts/?category=<id> -> filter by category
    GET  /api/posts/?mine=1        -> only current user's posts (auth required)
    POST /api/posts/               -> create post (auth required)
    """

    # -------------------------
    # GET → list posts
    # -------------------------
    if request.method == "GET":
        category_id = request.GET.get("category")
        mine = request.GET.get("mine")

        # If ?mine=1 and user is authenticated → return only that user's posts
        if mine and request.user.is_authenticated:
            posts = Post.objects.filter(author=request.user).order_by("-created_at")
            if category_id:
                posts = posts.filter(category_id=category_id)
        else:
            # Public listing: only published posts
            posts = Post.objects.filter(published=True).order_by("-created_at")
            if category_id:
                posts = posts.filter(category_id=category_id)

        serializer = PostSerializer(
            posts, many=True, context={"request": request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    # -------------------------
    # POST → create post
    # -------------------------
    if not request.user.is_authenticated:
        return Response(
            {"detail": "Authentication required"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    data = request.data.copy()

    serializer = PostSerializer(data=data, context={"request": request})
    if serializer.is_valid():
        # Author is always the current user
        serializer.save(author=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# -----------------------------
# Get single post by slug (public)
# -----------------------------
@api_view(["GET"])
@permission_classes([AllowAny])
def get_post(request, slug):
    """
    GET /api/posts/<slug:slug>/ -> public detail by slug (only published)
    """
    try:
        post = Post.objects.get(slug=slug, published=True)
        serializer = PostSerializer(post, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Post.DoesNotExist:
        return Response(
            {"detail": "Post not found"}, status=status.HTTP_404_NOT_FOUND
        )


# -----------------------------
# Single post by ID (edit/delete)
# -----------------------------
@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def post_detail(request, pk):
    """
    GET    /api/posts/<int:pk>/ -> detail (auth required, typically for edit UI)
    PUT    /api/posts/<int:pk>/ -> update (author only)
    DELETE /api/posts/<int:pk>/ -> delete (author only)
    """
    try:
        post = Post.objects.get(pk=pk)
    except Post.DoesNotExist:
        return Response(
            {"detail": "Post not found"}, status=status.HTTP_404_NOT_FOUND
        )

    # -------------------------
    # GET → return post
    # -------------------------
    if request.method == "GET":
        serializer = PostSerializer(post, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    # -------------------------
    # PUT → update post
    # -------------------------
    if request.method == "PUT":
        if post.author != request.user:
            return Response(
                {"detail": "Not authorized"},
                status=status.HTTP_403_FORBIDDEN,
            )

        data = request.data.copy()

        serializer = PostSerializer(
            post, data=data, partial=True, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # -------------------------
    # DELETE → delete post
    # -------------------------
    if request.method == "DELETE":
        if post.author != request.user:
            return Response(
                {"detail": "Not authorized"},
                status=status.HTTP_403_FORBIDDEN,
            )

        post.delete()
        return Response(
            {"detail": "Post deleted"}, status=status.HTTP_204_NO_CONTENT
        )


# -----------------------------
# Register User
# -----------------------------
@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    """
    POST /api/register/ -> create a new user
    """
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(
            {
                "message": "User created successfully",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# -----------------------------
# Current User Info
# -----------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    """
    GET /api/user/me/ or /api/users/me/ -> current authenticated user info
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def user_profile_view(request):
    """
    GET  /api/users/me/ -> profile + user info
    PUT  /api/users/me/ -> update profile (first/last name, bio, picture)
    """
    profile, created = UserProfile.objects.get_or_create(user=request.user)

    if request.method == "GET":
        serializer = UserProfileSerializer(
            profile, context={"request": request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    if request.method == "PUT":
        serializer = UserProfileSerializer(
            profile,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)