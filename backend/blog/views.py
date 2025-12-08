from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import Category, Post
from .serializers import CategorySerializer, PostSerializer, RegisterSerializer, UserSerializer

# -----------------------------
# Categories
# -----------------------------
@api_view(['GET'])
@permission_classes([AllowAny])
def get_categories(request):
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_category(request):
    serializer = CategorySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_category(request, pk):
    try:
        category = Category.objects.get(pk=pk)
        category.delete()
        return Response({"detail": "Category deleted"}, status=status.HTTP_204_NO_CONTENT)
    except Category.DoesNotExist:
        return Response({"detail": "Category not found"}, status=status.HTTP_404_NOT_FOUND)

# -----------------------------
# Posts - FIXED WITH ERROR HANDLING
# -----------------------------
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def posts_view(request):
    try:
        if request.method == 'GET':
            # Handle GET request (list posts)
            category_id = request.GET.get('category')
            posts = Post.objects.filter(published=True).order_by('-created_at')
            if category_id:
                posts = posts.filter(category_id=category_id)
            serializer = PostSerializer(posts, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        elif request.method == 'POST':
            # Handle POST request (create post)
            if not request.user.is_authenticated:
                return Response(
                    {"detail": "Authentication required"}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Pass request context to serializer
            serializer = PostSerializer(
                data=request.data, 
                context={'request': request}  # IMPORTANT: Pass request context
            )
            
            if serializer.is_valid():
                # Don't pass author here - let serializer handle it
                serializer.save()  # Author will be auto-set from request.user
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        # Log the error for debugging
        import traceback
        print(f"Error in posts_view: {str(e)}")
        print(traceback.format_exc())
        
        return Response(
            {
                "detail": "Internal server error",
                "error": str(e) if request.user.is_staff else None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# -----------------------------
# Single Post by Slug
# -----------------------------
@api_view(['GET'])
@permission_classes([AllowAny])
def get_post(request, slug):
    try:
        post = Post.objects.get(slug=slug, published=True)
        serializer = PostSerializer(post)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Post.DoesNotExist:
        return Response(
            {"detail": "Post not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )

# -----------------------------
# Single Post by ID (for update/delete)
# -----------------------------
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def post_detail(request, pk):
    try:
        post = Post.objects.get(pk=pk)
    except Post.DoesNotExist:
        return Response(
            {"detail": "Post not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        serializer = PostSerializer(post)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method == 'PUT':
        # Check ownership
        if post.author != request.user:
            return Response(
                {"detail": "Not authorized to edit this post"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = PostSerializer(
            post, 
            data=request.data, 
            partial=True,
            context={'request': request}  # Pass context for updates
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Check ownership
        if post.author != request.user:
            return Response(
                {"detail": "Not authorized to delete this post"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        post.delete()
        return Response(
            {"detail": "Post deleted successfully"}, 
            status=status.HTTP_204_NO_CONTENT
        )

# -----------------------------
# User Registration
# -----------------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(
            {
                "message": "User created successfully", 
                "user": UserSerializer(user).data
            },
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# -----------------------------
# Get Current User
# -----------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)