from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Authentication
    path('register/', views.register_view),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Blog API endpoints
    path('categories/', views.get_categories, name='get_categories'),
    path('posts/', views.get_posts, name='get_posts'),
    path('posts/<slug:slug>/', views.get_post, name='get_post'),

    # CRUD endpoints for posts
    path('posts/create/', views.create_post, name='create_post'),
    path('posts/<int:pk>/update/', views.update_post, name='update_post'),
    path('posts/<int:pk>/delete/', views.delete_post, name='delete_post'),
]
