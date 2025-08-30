from django.shortcuts import render, redirect
from django.conf import settings
from django.contrib import messages
from .forms import ContactForm, ReviewForm
from .models import ServiceCategory, HeroContent, Review
from django.db.models import Avg, Count
from .models import ServicePhoto
import requests


def _base_context():
    return {
        'company': settings.COMPANY,
    }


def home(request):
    ctx = _base_context()
    hero = HeroContent.objects.filter(is_active=True).order_by('-updated').first()
    ctx['hero'] = hero
    # Hero carousel photos: use 'hero' category if present, else all photos
    photos_qs = None
    try:
        hero_cat = ServiceCategory.objects.filter(slug='hero').first() or ServiceCategory.objects.filter(name__iexact='hero').first()
        if hero_cat:
            photos_qs = hero_cat.photos.all()
    except Exception:
        photos_qs = None
    if photos_qs is None:
        photos_qs = ServicePhoto.objects.all()
    # Shuffle order for variety while limiting to a small set
    ctx['hero_photos'] = photos_qs.order_by('?')[:8]
    # Approved reviews for homepage testimonials
    try:
        testimonials = Review.objects.filter(is_approved=True).select_related('category').order_by('-created')[:6]
    except Exception:
        testimonials = Review.objects.none()
    ctx['testimonials'] = testimonials
    # All service categories for homepage section
    try:
        ctx['categories'] = ServiceCategory.objects.all().prefetch_related('photos')
    except Exception:
        ctx['categories'] = ServiceCategory.objects.none()
    return render(request, 'home.html', ctx)


def services(request):
    ctx = _base_context()
    categories = ServiceCategory.objects.all().prefetch_related('photos')
    ctx['categories'] = categories
    return render(request, 'services.html', ctx)


def about(request):
    ctx = _base_context()
    return render(request, 'about.html', ctx)


def contact(request):
    ctx = _base_context()
    if request.method == 'POST':
        form = ContactForm(request.POST)
        # reCAPTCHA verification (if configured)
        secret_key = getattr(settings, 'RECAPTCHA_SECRET_KEY', '')
        recaptcha_ok = True
        if secret_key:
            token = request.POST.get('g-recaptcha-response', '')
            if not token:
                recaptcha_ok = False
            else:
                try:
                    resp = requests.post('https://www.google.com/recaptcha/api/siteverify', data={
                        'secret': secret_key,
                        'response': token,
                        'remoteip': request.META.get('REMOTE_ADDR'),
                    }, timeout=5)
                    data = resp.json()
                    recaptcha_ok = bool(data.get('success'))
                except Exception:
                    recaptcha_ok = False

        if form.is_valid() and (recaptcha_ok or not secret_key):
            ok = form.send()
            if ok:
                messages.success(request, 'Thank you! Your message has been sent.')
                return redirect('contact')
            else:
                messages.error(request, 'We could not send your message right now. Please try again in a moment or email us at %s.' % settings.COMPANY.get('email', settings.DEFAULT_FROM_EMAIL))
        else:
            if secret_key and not recaptcha_ok:
                form.add_error(None, 'reCAPTCHA verification failed. Please try again.')
    else:
        form = ContactForm()
    ctx['form'] = form
    ctx['recaptcha_site_key'] = getattr(settings, 'RECAPTCHA_SITE_KEY', '')
    return render(request, 'contact.html', ctx)


def service_electrical(request):
    ctx = _base_context()
    return render(request, 'services_electrical.html', ctx)


def service_solar(request):
    ctx = _base_context()
    return render(request, 'services_solar.html', ctx)


def service_category_detail(request, slug: str):
    ctx = _base_context()
    category = ServiceCategory.objects.prefetch_related('photos').get(slug=slug)
    # Handle review submission
    if request.method == 'POST' and request.POST.get('form') == 'review':
        form = ReviewForm(request.POST)
        # reCAPTCHA check (if configured)
        site_key = getattr(settings, 'RECAPTCHA_SITE_KEY', '')
        secret_key = getattr(settings, 'RECAPTCHA_SECRET_KEY', '')
        recaptcha_ok = True
        if secret_key:
            token = request.POST.get('g-recaptcha-response', '')
            if not token:
                recaptcha_ok = False
            else:
                try:
                    resp = requests.post('https://www.google.com/recaptcha/api/siteverify', data={
                        'secret': secret_key,
                        'response': token,
                        'remoteip': request.META.get('REMOTE_ADDR'),
                    }, timeout=5)
                    data = resp.json()
                    recaptcha_ok = bool(data.get('success'))
                except Exception:
                    recaptcha_ok = False

        if form.is_valid():
            if not recaptcha_ok and secret_key:
                form.add_error(None, 'reCAPTCHA verification failed. Please try again.')
            else:
                review: Review = form.save(commit=False)
                review.category = category
                # Auto-approve reviews by default
                review.is_approved = True
                review.save()
                messages.success(request, 'Thank you for your review! It is now live.')
                return redirect('service_category_detail', slug=slug)
        else:
            messages.error(request, 'Please correct the errors below.')
            ctx['focus_review_form'] = True
    else:
        form = ReviewForm()

    # Approved reviews and stats
    approved_qs = category.reviews.filter(is_approved=True)
    stats = approved_qs.aggregate(avg=Avg('rating'), count=Count('id'))
    ctx['reviews'] = approved_qs
    ctx['rating_avg'] = (stats.get('avg') or 0)
    ctx['rating_count'] = stats.get('count') or 0
    ctx['review_form'] = form
    # Ensure star widget initializes with the current rating value
    try:
        ctx['review_rating_initial'] = int(form['rating'].value() or 5)
    except Exception:
        ctx['review_rating_initial'] = 5
    ctx['category'] = category
    # Pass site key to render client widget if configured
    ctx['recaptcha_site_key'] = getattr(settings, 'RECAPTCHA_SITE_KEY', '')
    return render(request, 'services_category_detail.html', ctx)


def privacy(request):
    ctx = _base_context()
    return render(request, 'privacy.html', ctx)


def terms(request):
    ctx = _base_context()
    return render(request, 'terms.html', ctx)


def faq(request):
    ctx = _base_context()
    return render(request, 'faq.html', ctx)


def projects(request):
    ctx = _base_context()
    photos = ServicePhoto.objects.select_related('category').order_by('-created')
    ctx['photos'] = photos
    return render(request, 'projects.html', ctx)


def custom_404(request, exception=None):
    ctx = _base_context()
    ctx['path'] = request.path
    return render(request, '404.html', ctx, status=404)


def certifications(request):
    ctx = _base_context()
    return render(request, 'certifications.html', ctx)


def custom_404_preview(request):
    """Allows previewing the 404 page while DEBUG=True."""
    return custom_404(request)
