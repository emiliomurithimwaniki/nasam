from django import forms
from django.core.mail import send_mail
from django.conf import settings
from .models import Review


class ContactForm(forms.Form):
    name = forms.CharField(max_length=120, widget=forms.TextInput(attrs={
        'class': 'form-control', 'placeholder': 'Your name'
    }))
    email = forms.EmailField(widget=forms.EmailInput(attrs={
        'class': 'form-control', 'placeholder': 'you@example.com'
    }))
    phone = forms.CharField(max_length=50, required=False, widget=forms.TextInput(attrs={
        'class': 'form-control', 'placeholder': '+254...'
    }))
    message = forms.CharField(widget=forms.Textarea(attrs={
        'class': 'form-control', 'rows': 5, 'placeholder': 'How can we help?'
    }))

    def send(self) -> bool:
        company = getattr(settings, 'COMPANY', {})
        company_name = company.get('name', 'Our Team')
        admin_email = company.get('email', settings.DEFAULT_FROM_EMAIL)

        name = self.cleaned_data['name']
        email = self.cleaned_data['email']
        phone = self.cleaned_data.get('phone', '')
        message = self.cleaned_data['message']

        # 1) Notify admin
        subject_admin = "New quote request from website"
        body_admin = (
            f"A new quote request has been submitted via the website.\n\n"
            f"Name: {name}\n"
            f"Email: {email}\n"
            f"Phone: {phone}\n\n"
            f"Message:\n{message}\n"
        )
        try:
            send_mail(subject_admin, body_admin, settings.DEFAULT_FROM_EMAIL, [admin_email], fail_silently=False)
        except Exception:
            # Surface in server logs; signal failure to caller
            import logging
            logging.exception("Admin email send failed")
            return False

        # 2) Send confirmation to user
        subject_user = f"We've received your quote request — {company_name}"
        body_user = (
            f"Hi {name},\n\n"
            f"Thanks for reaching out to {company_name}! We've received your quote request and our team will get back to you shortly.\n\n"
            f"Summary of your request:\n"
            f"— Name: {name}\n"
            f"— Email: {email}\n"
            f"— Phone: {phone}\n\n"
            f"Message you sent:\n{message}\n\n"
            f"If you need to add anything, simply reply to this email.\n\n"
            f"Best regards,\n{company_name}"
        )
        try:
            send_mail(subject_user, body_user, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
        except Exception:
            import logging
            logging.exception("User confirmation email send failed")
            return False

        return True


class ReviewForm(forms.ModelForm):
    # Honeypot: real users won't see/fill this
    hp = forms.CharField(required=False, widget=forms.TextInput(attrs={
        "autocomplete":"off", "tabindex":"-1", "aria-hidden":"true", "style":"position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden;"
    }))
    class Meta:
        model = Review
        fields = ["name", "rating", "comment", "hp"]
        widgets = {
            "name": forms.TextInput(attrs={"class":"form-control", "placeholder":"Your name"}),
            "rating": forms.NumberInput(attrs={"class":"form-control", "min":1, "max":5, "step":1}),
            "comment": forms.Textarea(attrs={"class":"form-control", "rows":4, "placeholder":"Share your experience (optional)"}),
        }
        help_texts = {
            "rating": "Rate 1 (lowest) to 5 (best)",
        }

    def clean(self):
        cleaned = super().clean()
        # If honeypot has any value, treat as spam
        if cleaned.get("hp"):
            raise forms.ValidationError("Spam detected.")
        # Clamp rating within 1..5
        r = cleaned.get("rating")
        if r is not None:
            cleaned["rating"] = max(1, min(5, int(r)))
        return cleaned
