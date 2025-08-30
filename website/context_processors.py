from __future__ import annotations

from django.conf import settings
from .models import Branding


def branding(request):
    """Expose branding URLs (logo, favicon, and og image) with absolute URLs.
    Fallbacks to static paths if Branding not set yet.
    """
    logo_url_rel = None
    favicon_url_rel = None

    try:
        b = Branding.objects.order_by("-updated").first()
        if b and getattr(b, "logo", None):
            logo_url_rel = b.logo.url
        if b and (getattr(b, "favicon", None) or getattr(b, "logo", None)):
            favicon_url_rel = (b.favicon or b.logo).url
    except Exception:
        # During migrations or missing tables
        pass

    # Relative fallbacks
    logo_url_rel = logo_url_rel or settings.STATIC_URL + "img/logo.png"
    favicon_url_rel = favicon_url_rel or settings.STATIC_URL + "img/favicon.png"

    # Absolute URLs for crawlers/social cards
    logo_url_abs = request.build_absolute_uri(logo_url_rel)
    favicon_url_abs = request.build_absolute_uri(favicon_url_rel)
    # Default OG image to favicon; if a page provides a specific image in a meta block it will override
    og_image_url_abs = favicon_url_abs or logo_url_abs

    return {
        "branding": {
            "logo_url": logo_url_abs,
            "favicon_url": favicon_url_abs,
            "og_image_url": og_image_url_abs,
        }
    }
