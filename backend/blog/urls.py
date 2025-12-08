from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Authentication
    path('register/', views.register_view, name='register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Categories
    path('categories/', views.get_categories, name='get_categories'),
    path('categories/create/', views.create_category, name='create_category'),
    path('categories/<int:pk>/delete/', views.delete_category, name='delete_category'),

    # Posts
    path('posts/', views.get_posts, name='get_posts'),
    path('posts/<slug:slug>/', views.get_post, name='get_post'),
    path('posts/create/', views.create_post, name='create_post'),
    path('posts/<int:pk>/update/', views.update_post, name='update_post'),
    path('posts/<int:pk>/delete/', views.delete_post, name='delete_post'),
]
