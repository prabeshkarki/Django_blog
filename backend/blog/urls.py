# api/urls.py - UPDATED TO MATCH MERGED VIEWS
from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Authentication
    path('register/', views.register_view, name='register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('user/me/', views.current_user, name='current_user'),  # Added

    # Categories
    path('categories/', views.get_categories, name='get_categories'),
    path('categories/create/', views.create_category, name='create_category'),
    path('categories/<int:pk>/delete/', views.delete_category, name='delete_category'),

    # Posts - UPDATED to match merged views
    path('posts/', views.posts_view, name='posts'),  # Combined GET (list) + POST (create)
    path('posts/<int:pk>/', views.post_detail, name='post_detail'),  # GET/PUT/DELETE by ID
    path('posts/<slug:slug>/', views.get_post, name='get_post_by_slug'),  # GET by slug
]