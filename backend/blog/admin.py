from django.contrib import admin
from .models import Category, Post  # Only blog models

# Register blog models for admin dashboard
admin.site.register(Category)
admin.site.register(Post)
