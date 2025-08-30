from __future__ import annotations

from django.conf import settings
from .models import Branding


def branding(request):
    """Expose branding URLs (logo and favicon) to all templates.
    Fallbacks to static paths if Branding not set yet.
    """
    logo_url = None
    favicon_url = None

    try:
        b = Branding.objects.order_by("-updated").first()
        if b and b.logo:
            logo_url = b.logo.url
        if b and (b.favicon or b.logo):
            favicon_url = (b.favicon or b.logo).url
    except Exception:
        # During migrations or missing tables
        pass

    return {
        "branding": {
            "logo_url": logo_url or settings.STATIC_URL + "img/logo.png",
            "favicon_url": favicon_url or settings.STATIC_URL + "img/favicon.png",
        }
    }
