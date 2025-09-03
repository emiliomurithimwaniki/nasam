from pathlib import Path
import os
import sys

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'dev-secret-key-change-in-production'
# Toggle DEBUG via environment variable for easy local switching
# Usage (PowerShell):  $env:DJANGO_DEBUG = 'False'
# Defaults to True if not provided
DEBUG = os.getenv('DJANGO_DEBUG', 'True').lower() == 'true'
# Hosts and CSRF origins (configurable for Railway via env)
# DJANGO_ALLOWED_HOSTS: space-separated list, e.g. "yourapp.up.railway.app example.com"
ALLOWED_HOSTS: list[str] = os.getenv(
    'DJANGO_ALLOWED_HOSTS', 'localhost 127.0.0.1 0.0.0.0 nasam-2iqm.onrender.com web-production-10948.up.railway.app .up.railway.app'
).split()

# DJANGO_CSRF_TRUSTED_ORIGINS: space-separated, full origins e.g. "https://yourapp.up.railway.app https://example.com"
CSRF_TRUSTED_ORIGINS = os.getenv(
    'DJANGO_CSRF_TRUSTED_ORIGINS', 'http://localhost http://127.0.0.1 https://*.up.railway.app'
).split()

INSTALLED_APPS = [
    'jazzmin',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'website',
]

MIDDLEWARE = [
    'django.middleware.cache.UpdateCacheMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.cache.FetchFromCacheMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'website.context_processors.branding',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'
ASGI_APPLICATION = 'core.asgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.getenv('SQLITE_PATH', str(BASE_DIR / 'db.sqlite3')),
    }
}

# If DATABASE_URL is provided (e.g., Railway Postgres), use it
DATABASE_URL = os.getenv('DATABASE_URL')
if DATABASE_URL:
    try:
        import dj_database_url  # type: ignore
    except Exception as e:
        print("Warning: dj-database-url not installed; falling back to SQLite", file=sys.stderr)
    else:
        DATABASES['default'] = dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=int(os.getenv('DB_CONN_MAX_AGE', '600')),
            ssl_require=(os.getenv('DB_DISABLE_SSL', 'False').lower() != 'true'),
        )

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Nairobi'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'
# WhiteNoise compressed storage (non-manifest) to avoid strict failures on missing sourcemaps
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'

# Media (user uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Jazzmin admin configuration
JAZZMIN_SETTINGS = {
    "site_title": "NASAM Admin",
    "site_header": "NASAM HI-TECH ELECTRICALS",
    "site_brand": "NASAM Admin",
    "welcome_sign": "Welcome to NASAM admin",
    "copyright": "NASAM HI-TECH ELECTRICALS",
    "show_ui_builder": False,
    # Organize the sidebar with friendly labels and only needed apps
    "order_with_respect_to": [
        "website",
        "auth",
    ],
    "icons": {
        "website": "fas fa-plug",
        "website.ServiceCategory": "fas fa-folder-tree",
        "website.ServicePhoto": "far fa-images",
        "website.HeroContent": "fas fa-bullhorn",
        "website.Review": "fas fa-star",
    },
    # Top quick links
    "topmenu_links": [
        {"name": "Dashboard", "url": "admin:index", "permissions": ["auth.view_user"]},
        {"app": "website"},
        {"name": "Site", "url": "/", "new_window": True},
        {"name": "Contact", "url": "/contact/", "new_window": True},
    ],
}

# Gentle UI tweaks (bigger fonts, clearer accents)
JAZZMIN_UI_TWEAKS = {
    "theme": "default",
    "dark_mode_theme": None,
    "navbar": "navbar-white navbar-light",
    "footer_fixed": False,
    "navbar_small_text": False,
    "brand_small_text": False,
    "sidebar_small_text": False,
    "sidebar_nav_compact_style": True,
    "sidebar_fixed": True,
    "actions_sticky_top": True,
}

# Email configuration
# Use Gmail SMTP if credentials are provided via environment variables; otherwise use console backend.
if os.getenv('EMAIL_HOST_USER') and os.getenv('EMAIL_HOST_PASSWORD'):
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = 'smtp.gmail.com'
    EMAIL_PORT = 587
    EMAIL_USE_TLS = True
    EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
    EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
else:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Default "from" address
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'emiliomurithi4@gmail.com')

# Company details (used in templates)
COMPANY = {
    'name': 'NASAM HI-TECH ELECTRICALS',
    'tagline': 'Electrical Contractor',
    'phones': ['+254 722 52 17 52', '+254 722 31 92 92'],
    'email': 'emiliomurithi4@gmail.com',
    'locations': [
        'Samnima House, Nairobi, Kenya',
        'Marua A Building, Opp. Samrat Supermarket, Nyeri',
    ],
}

# reCAPTCHA settings (v2 Checkbox)
# Configure via environment variables in production
# RECAPTCHA_SITE_KEY and RECAPTCHA_SECRET_KEY
RECAPTCHA_SITE_KEY = os.getenv('RECAPTCHA_SITE_KEY', '')
RECAPTCHA_SECRET_KEY = os.getenv('RECAPTCHA_SECRET_KEY', '')

# Caching (per-site cache via middleware)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'nasam-local-cache',
    }
}
CACHE_MIDDLEWARE_SECONDS = int(os.getenv('CACHE_SECONDS', '600'))  # 10 minutes default
CACHE_MIDDLEWARE_KEY_PREFIX = 'nasam'

# Cookie settings (can be hardened in production)
SESSION_COOKIE_AGE = int(os.getenv('SESSION_COOKIE_AGE', str(60 * 60 * 24 * 14)))  # 2 weeks
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'False').lower() == 'true'
CSRF_COOKIE_SECURE = os.getenv('CSRF_COOKIE_SECURE', 'False').lower() == 'true'

# Behind proxy (Railway)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True
