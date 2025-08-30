from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'dev-secret-key-change-in-production'
# Toggle DEBUG via environment variable for easy local switching
# Usage (PowerShell):  $env:DJANGO_DEBUG = 'False'
# Defaults to True if not provided
DEBUG = os.getenv('DJANGO_DEBUG', 'True').lower() == 'true'
ALLOWED_HOSTS: list[str] = ['localhost', '127.0.0.1', 'a1ef3ee75902.ngrok-free.app']
CSRF_TRUSTED_ORIGINS = [
    'http://localhost',
    'http://127.0.0.1',
    'https://a1ef3ee75902.ngrok-free.app'
]

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
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
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
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Nairobi'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'

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
    'phones': ['+254 722 52 17 52', '+254 722 60 68 84'],
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
