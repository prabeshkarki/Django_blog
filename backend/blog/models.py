from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify
import uuid


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
            while Category.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class UserProfile(models.Model):
    """Simple user profile with profile picture"""
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile"
    )
    profile_picture = models.ImageField(
        upload_to='profile_pics/%Y/%m/%d/',
        blank=True,
        null=True
    )
    bio = models.TextField(max_length=500, blank=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

    def get_profile_picture(self):
        """Return profile picture URL or default"""
        if self.profile_picture:
            return self.profile_picture.url
        return '/static/images/default_profile.png'


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
    excerpt = models.TextField(max_length=300, blank=True)

    image = models.ImageField(
        upload_to='post_images/%Y/%m/%d/',
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    published = models.BooleanField(default=True)
    featured = models.BooleanField(default=False)
    views = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['slug']),
            models.Index(fields=['author']),
            models.Index(fields=['category']),
        ]

    def save(self, *args, **kwargs):
        # Auto-generate slug
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1

            while Post.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
                if counter > 100:
                    slug = f"{base_slug}-{uuid.uuid4().hex[:8]}"
                    break

            self.slug = slug

        # Auto-generate excerpt if empty
        if not self.excerpt and self.content:
            self.excerpt = (
                self.content[:297] + "..."
                if len(self.content) > 300
                else self.content
            )

        super().save(*args, **kwargs)

    def get_absolute_url(self):
        """
        Return URL by slug (used e.g. in admin or templates).
        Matches urlpattern name 'get_post_by_slug'.
        """
        from django.urls import reverse
        return reverse('get_post_by_slug', kwargs={'slug': self.slug})

    def increment_views(self):
        self.views += 1
        self.save(update_fields=['views'])

    @property
    def reading_time(self):
        words = len(self.content.split())
        return max(1, round(words / 200))

    def get_image_url(self):
        if self.image:
            return self.image.url
        return '/static/images/default_post.jpg'

    @property
    def image_url(self):
        """Convenience property used by API / frontend."""
        return self.get_image_url()

    @property
    def author_profile_picture(self):
        profile = getattr(self.author, 'profile', None)
        if profile and profile.profile_picture:
            return profile.profile_picture.url
        return '/static/images/default_profile.png'

    @property
    def author_bio(self):
        profile = getattr(self.author, 'profile', None)
        if profile and profile.bio:
            return profile.bio
        return ''

    def __str__(self):
        return self.title


# Signals to auto-create user profile
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    # Ensure profile exists before saving
    if hasattr(instance, 'profile'):
        instance.profile.save()