from __future__ import annotations

from django.db import models
from django.utils.text import slugify


class TimeStampedModel(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class ServiceCategory(TimeStampedModel):
    name = models.CharField(max_length=140, unique=True)
    slug = models.SlugField(max_length=160, unique=True, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


def service_upload_to(instance: "ServicePhoto", filename: str) -> str:
    return f"services/{instance.category.slug}/{filename}"


class ServicePhoto(TimeStampedModel):
    category = models.ForeignKey(ServiceCategory, related_name="photos", on_delete=models.CASCADE)
    image = models.ImageField(upload_to=service_upload_to)
    title = models.CharField(max_length=140, blank=True)
    alt_text = models.CharField(max_length=160, blank=True, help_text="For accessibility/SEO")
    caption = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self) -> str:
        return self.title or f"Photo #{self.pk}"


class HeroContent(TimeStampedModel):
    badge = models.CharField(max_length=160, blank=True, help_text="Small pill text above the title")
    title = models.CharField(max_length=160, help_text="Main hero heading before the accent")
    accent = models.CharField(max_length=120, blank=True, help_text="Optional accent text shown with gradient")
    lead = models.TextField(blank=True, help_text="Short paragraph under the title")
    primary_cta_text = models.CharField(max_length=60, default="Our Services")
    primary_cta_url = models.CharField(max_length=200, default="/services/")
    secondary_cta_text = models.CharField(max_length=60, blank=True, default="Request a Quote")
    secondary_cta_url = models.CharField(max_length=200, blank=True, default="/contact/")
    hero_image = models.ImageField(upload_to="hero/", blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Hero Content"
        verbose_name_plural = "Hero Content"

    def __str__(self) -> str:
        return f"Hero: {self.title}"


class Review(TimeStampedModel):
    category = models.ForeignKey(ServiceCategory, related_name="reviews", on_delete=models.CASCADE)
    name = models.CharField(max_length=120)
    rating = models.PositiveSmallIntegerField(default=5, help_text="1-5 stars")
    comment = models.TextField(blank=True)
    is_approved = models.BooleanField(default=False, help_text="Only approved reviews are publicly visible")

    class Meta:
        ordering = ["-created"]

    def __str__(self) -> str:
        return f"{self.name} • {self.rating}★ on {self.category.name}"


class Branding(TimeStampedModel):
    """Site branding assets managed via admin.

    Favicon defaults to the same file as logo when not explicitly provided.
    """
    logo = models.ImageField(upload_to="branding/", help_text="Company logo (PNG/SVG recommended)")
    favicon = models.ImageField(upload_to="branding/", blank=True, null=True, help_text="Defaults to logo if not set")

    class Meta:
        verbose_name = "Branding"
        verbose_name_plural = "Branding"

    def __str__(self) -> str:
        return "Site Branding"

    def save(self, *args, **kwargs):
        # If favicon not provided, use logo by default
        if not self.favicon:
            self.favicon = self.logo
        super().save(*args, **kwargs)
