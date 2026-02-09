# Django Framework Patterns

Security and quality patterns specific to Django applications.

---

## Security Patterns

### SQL Injection

| Pattern | Risk | Detection |
|---------|------|-----------|
| `.raw()` with string format | Critical | `Model.objects.raw(f"SELECT...")` |
| `.extra()` with user input | Critical | `.extra(where=[user_input])` |
| Cursor with string concat | Critical | `cursor.execute(query % params)` |

**Safe Pattern:**
```python
# BAD
User.objects.raw(f"SELECT * FROM users WHERE id = {user_id}")

# GOOD - Parameterized query
User.objects.raw("SELECT * FROM users WHERE id = %s", [user_id])

# BEST - Use ORM
User.objects.filter(id=user_id)
```

### XSS Prevention

| Pattern | Risk | Detection |
|---------|------|-----------|
| `|safe` filter | High | `{{ user_input|safe }}` |
| `mark_safe()` | High | `mark_safe(user_content)` |
| `{% autoescape off %}` | High | Block disabling autoescape |

**Safe Pattern:**
```html
<!-- BAD -->
{{ user_comment|safe }}

<!-- GOOD - Django auto-escapes by default -->
{{ user_comment }}

<!-- If HTML needed, sanitize first -->
{% load bleach_tags %}
{{ user_comment|bleach }}
```

### CSRF Protection

```python
# Ensure CSRF middleware is enabled
MIDDLEWARE = [
    'django.middleware.csrf.CsrfViewMiddleware',
    # ...
]

# In templates
<form method="post">
    {% csrf_token %}
    ...
</form>

# For AJAX
const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
```

### Authentication/Authorization

```python
# BAD - No permission check
def get_document(request, doc_id):
    return Document.objects.get(id=doc_id)

# GOOD - Check ownership
from django.core.exceptions import PermissionDenied

def get_document(request, doc_id):
    doc = Document.objects.get(id=doc_id)
    if doc.owner_id != request.user.id:
        raise PermissionDenied
    return doc

# BEST - Use built-in permissions
from django.contrib.auth.decorators import permission_required

@permission_required('app.view_document')
def get_document(request, doc_id):
    return Document.objects.get(id=doc_id)
```

### Secret Management

```python
# BAD
SECRET_KEY = 'django-insecure-abc123'
DATABASE_PASSWORD = 'password123'

# GOOD
import os
SECRET_KEY = os.environ['DJANGO_SECRET_KEY']
DATABASE_PASSWORD = os.environ['DB_PASSWORD']

# Or use django-environ
import environ
env = environ.Env()
SECRET_KEY = env('SECRET_KEY')
```

---

## Type Safety Patterns

### Model Typing

```python
# BAD - No type hints
class User(models.Model):
    name = models.CharField(max_length=100)

    def get_display_name(self):
        return self.name.title()

# GOOD - With type hints
from typing import Optional

class User(models.Model):
    name: models.CharField[str] = models.CharField(max_length=100)

    def get_display_name(self) -> str:
        return self.name.title()

    def get_email(self) -> Optional[str]:
        return self.email if self.email else None
```

### View Typing

```python
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.views import View

# Function-based view
def user_detail(request: HttpRequest, user_id: int) -> HttpResponse:
    user = get_object_or_404(User, id=user_id)
    return render(request, 'user_detail.html', {'user': user})

# Class-based view
class UserDetailView(View):
    def get(self, request: HttpRequest, user_id: int) -> HttpResponse:
        user = get_object_or_404(User, id=user_id)
        return render(request, 'user_detail.html', {'user': user})
```

### Form Typing

```python
from django import forms
from typing import Any, Dict

class UserForm(forms.Form):
    name = forms.CharField(max_length=100)
    email = forms.EmailField()

    def clean(self) -> Dict[str, Any]:
        cleaned_data = super().clean()
        # Type-safe access to cleaned data
        name: str = cleaned_data.get('name', '')
        return cleaned_data
```

---

## Linting Patterns

### Query Optimization

```python
# BAD - N+1 query problem
users = User.objects.all()
for user in users:
    print(user.profile.avatar)  # Query per user

# GOOD - Prefetch related
users = User.objects.select_related('profile').all()
for user in users:
    print(user.profile.avatar)  # No additional queries
```

### View Complexity

| Metric | Threshold | Action |
|--------|-----------|--------|
| View function lines | >50 | Extract to service layer |
| Business logic in view | Any | Move to model or service |
| Multiple model operations | >3 | Create service class |

---

## Coding Standards

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Model | PascalCase | `UserProfile` |
| View function | snake_case | `user_detail` |
| View class | PascalCase + View suffix | `UserDetailView` |
| URL name | snake_case with dashes | `user-detail` |

### File Organization

```
app/
  models/
    __init__.py
    user.py
  views/
    __init__.py
    user.py
  services/
    user_service.py
  tests/
    test_user.py
```

---

## What to Skip

- Django admin customization
- Management commands
- Migration files
- Settings for different environments
