from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify
from django.utils import timezone
import uuid  # For unique slugs

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']
    
    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            # Ensure unique slug
            while Category.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name


class Post(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, max_length=255, blank=True)
    author = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name="posts"
    )
    category = models.ForeignKey(
        Category, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="posts"
    )
    content = models.TextField()
    excerpt = models.TextField(max_length=300, blank=True)  # Optional short description
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published = models.BooleanField(default=True)
    featured = models.BooleanField(default=False)  # For featured posts
    views = models.PositiveIntegerField(default=0)  # Track post views
    
    # Optional image field (commented out as per your preference)
    # image = models.ImageField(upload_to='post_images/%Y/%m/%d/', null=True, blank=True)
    # thumbnail = models.ImageField(upload_to='post_thumbnails/%Y/%m/%d/', null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']  # Newest first by default
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['slug']),
            models.Index(fields=['author']),
            models.Index(fields=['category']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.slug:
            # Create unique slug from title
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            
            # Keep trying until we find a unique slug
            while Post.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
                if counter > 100:  # Safety check
                    # Use UUID as fallback
                    slug = f"{base_slug}-{uuid.uuid4().hex[:8]}"
                    break
            
            self.slug = slug
        
        # Auto-generate excerpt if not provided
        if not self.excerpt and self.content:
            self.excerpt = self.content[:297] + "..." if len(self.content) > 300 else self.content
        
        super().save(*args, **kwargs)
    
    def get_absolute_url(self):
        from django.urls import reverse
        return reverse('post-detail', kwargs={'slug': self.slug})
    
    def increment_views(self):
        """Increment view count"""
        self.views += 1
        self.save(update_fields=['views'])
    
    @property
    def reading_time(self):
        """Calculate estimated reading time (words per minute = 200)"""
        words = len(self.content.split())
        return max(1, round(words / 200))  # At least 1 minute
    
    def __str__(self):
        return self.title