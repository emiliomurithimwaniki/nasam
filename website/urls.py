from django.urls import path, re_path
from django.conf import settings
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('services/', views.services, name='services'),
    path('services/<slug:slug>/', views.service_category_detail, name='service_category_detail'),
    path('services/electrical/', views.service_electrical, name='service_electrical'),
    path('services/solar/', views.service_solar, name='service_solar'),
    path('about/', views.about, name='about'),
    path('contact/', views.contact, name='contact'),
    path('privacy/', views.privacy, name='privacy'),
    path('terms/', views.terms, name='terms'),
    path('faq/', views.faq, name='faq'),
    path('projects/', views.projects, name='projects'),
    path('certifications/', views.certifications, name='certifications'),
]

if settings.DEBUG:
    urlpatterns += [
        path('dev/404/', views.custom_404_preview, name='dev_404'),
        # Catch-all (excluding static/media/admin) to preview custom 404 while DEBUG=True
        re_path(r'^(?!static/|media/|admin/).*$', views.custom_404_preview, name='dev_404_catchall'),
    ]
