from django.contrib import admin
from django.utils.html import format_html
from .models import ServiceCategory, ServicePhoto, HeroContent, Review, Branding


class ServicePhotoInline(admin.TabularInline):
    model = ServicePhoto
    extra = 1
    fields = ("preview", "image", "title", "alt_text", "caption", "order")
    readonly_fields = ("preview",)

    def preview(self, obj):
        if obj and obj.image:
            return format_html('<img src="{}" style="height:50px;border-radius:4px;" />', obj.image.url)
        return "—"
    preview.short_description = "Preview"


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "updated")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "description")
    inlines = [ServicePhotoInline]
    list_per_page = 25
    ordering = ("name",)


@admin.register(ServicePhoto)
class ServicePhotoAdmin(admin.ModelAdmin):
    list_display = ("thumbnail", "title", "category", "order", "updated")
    list_filter = ("category",)
    search_fields = ("title", "alt_text", "caption")
    list_per_page = 25
    autocomplete_fields = ("category",)
    fieldsets = (
        (None, {"fields": ("category", "title", "alt_text")}),
        ("Media", {"fields": ("image",)}),
        ("Details", {"fields": ("caption", "order")}),
    )

    def thumbnail(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="height:40px;border-radius:4px;" />', obj.image.url)
        return "—"
    thumbnail.short_description = "Photo"


@admin.register(HeroContent)
class HeroContentAdmin(admin.ModelAdmin):
    list_display = ("title", "is_active", "updated")
    list_editable = ("is_active",)
    fieldsets = (
        (None, {
            'fields': ("badge", "title", "accent", "lead")
        }),
        ("Buttons", {
            'fields': ("primary_cta_text", "primary_cta_url", "secondary_cta_text", "secondary_cta_url")
        }),
        ("Media", {
            'fields': ("hero_image", "is_active")
        }),
    )
    list_per_page = 25


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "rating", "is_approved", "created")
    list_filter = ("is_approved", "rating", "category")
    search_fields = ("name", "comment")
    list_editable = ("is_approved",)
    date_hierarchy = "created"
    list_per_page = 25

    actions = ("approve_reviews",)

    def approve_reviews(self, request, queryset):
        updated = queryset.update(is_approved=True)
        self.message_user(request, f"Approved {updated} review(s).")
    approve_reviews.short_description = "Approve selected reviews"


@admin.register(Branding)
class BrandingAdmin(admin.ModelAdmin):
    list_display = ("logo_preview", "favicon_preview", "updated")
    readonly_fields = ("logo_preview", "favicon_preview")
    fields = ("logo_preview", "logo", "favicon_preview", "favicon")

    def logo_preview(self, obj):
        if obj and obj.logo:
            return format_html('<img src="{}" style="height:50px;border-radius:4px;" />', obj.logo.url)
        return "—"
    logo_preview.short_description = "Logo"

    def favicon_preview(self, obj):
        if obj and (obj.favicon or obj.logo):
            return format_html('<img src="{}" style="height:32px;border-radius:4px;" />', (obj.favicon or obj.logo).url)
        return "—"
    favicon_preview.short_description = "Favicon"

    def has_add_permission(self, request):
        # Allow only one Branding instance; if exists, disable add
        if Branding.objects.exists():
            return False
        return super().has_add_permission(request)
