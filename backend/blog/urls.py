# blog/urls.py

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views
from .views import CustomTokenObtainPairView, user_profile_view

urlpatterns = [
    # Authentication
    path("register/", views.register_view, name="register"),
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Current user (basic info)
    path("user/me/", views.current_user, name="current_user"),

    # Profile (used by frontend UsersAPI for GET/PUT)
    path("users/me/", user_profile_view, name="user_profile"),

    # Categories
    # GET  /api/categories/          -> list categories
    # POST /api/categories/          -> create category (auth required)
    path("categories/", views.categories_view, name="categories"),
    # DELETE /api/categories/<pk>/   -> delete category (auth required)
    path("categories/<int:pk>/delete/", views.delete_category, name="delete_category"),

    # Posts
    # GET  /api/posts/               -> list published posts
    # GET  /api/posts/?category=<id> -> filter by category
    # GET  /api/posts/?mine=1        -> only current user's posts (auth required)
    # POST /api/posts/               -> create post (auth required)
    path("posts/", views.posts_view, name="posts"),

    # GET /api/posts/<int:pk>/       -> detail, PUT, DELETE (auth, author only)
    path("posts/<int:pk>/", views.post_detail, name="post_detail"),

    # GET /api/posts/<slug:slug>/    -> public detail by slug
    path("posts/<slug:slug>/", views.get_post, name="get_post_by_slug"),
]