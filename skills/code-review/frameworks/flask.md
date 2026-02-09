# Flask Framework Patterns

Security and quality patterns specific to Flask applications.

---

## Security Patterns

### SQL Injection

| Pattern | Risk | Detection |
|---------|------|-----------|
| String formatting in query | Critical | `f"SELECT...{user_input}"` |
| `text()` with concat | Critical | `text("SELECT..." + user_input)` |
| Raw cursor with % format | Critical | `cursor.execute(query % params)` |

**Safe Pattern:**
```python
# BAD
db.execute(f"SELECT * FROM users WHERE id = {user_id}")

# GOOD - SQLAlchemy ORM
User.query.filter_by(id=user_id).first()

# GOOD - Parameterized query
db.execute(text("SELECT * FROM users WHERE id = :id"), {"id": user_id})
```

### XSS Prevention

| Pattern | Risk | Detection |
|---------|------|-----------|
| `|safe` filter | High | `{{ user_input|safe }}` |
| `Markup()` | High | `Markup(user_content)` |
| `render_template_string` | Critical | With user input |

**Safe Pattern:**
```html
<!-- BAD -->
{{ user_comment|safe }}

<!-- GOOD - Jinja2 auto-escapes by default -->
{{ user_comment }}

<!-- If HTML needed -->
{% import 'macros.html' as macros %}
{{ macros.sanitized_html(user_comment) }}
```

```python
# In macros.py
import bleach

def sanitize_html(html):
    return Markup(bleach.clean(html, tags=['p', 'br', 'strong']))
```

### CSRF Protection

```python
from flask_wtf.csrf import CSRFProtect

csrf = CSRFProtect()
csrf.init_app(app)

# In templates
<form method="post">
    <input type="hidden" name="csrf_token" value="{{ csrf_token() }}"/>
    ...
</form>
```

### Session Security

```python
# BAD
app.secret_key = 'dev'

# GOOD
import os
app.secret_key = os.environ['SECRET_KEY']

# Session configuration
app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
)
```

### Authentication

```python
from flask_login import login_required, current_user
from functools import wraps

# BAD - No auth check
@app.route('/admin')
def admin_panel():
    return render_template('admin.html')

# GOOD - Login required
@app.route('/admin')
@login_required
def admin_panel():
    return render_template('admin.html')

# GOOD - Role check
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_admin:
            abort(403)
        return f(*args, **kwargs)
    return decorated_function

@app.route('/admin')
@login_required
@admin_required
def admin_panel():
    return render_template('admin.html')
```

### File Upload

```python
from werkzeug.utils import secure_filename

# BAD
@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['file']
    file.save(f'/uploads/{file.filename}')  # Path traversal risk

# GOOD
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['file']
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
```

---

## Type Safety Patterns

### Route Typing

```python
from flask import Flask, Request, Response
from typing import Union

# BAD
@app.route('/users/<user_id>')
def get_user(user_id):
    return User.query.get(user_id)

# GOOD
@app.route('/users/<int:user_id>')
def get_user(user_id: int) -> Union[Response, tuple[dict, int]]:
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())
```

### Request Data Typing

```python
from pydantic import BaseModel, ValidationError
from typing import Optional

class UserCreate(BaseModel):
    name: str
    email: str
    age: Optional[int] = None

@app.route('/users', methods=['POST'])
def create_user() -> tuple[dict, int]:
    try:
        data = UserCreate(**request.json)
    except ValidationError as e:
        return {'error': e.errors()}, 400

    user = User(name=data.name, email=data.email, age=data.age)
    db.session.add(user)
    db.session.commit()
    return {'id': user.id}, 201
```

### Model Typing

```python
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional

class User(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
        }
```

---

## Linting Patterns

### Application Factory

```python
# BAD - Global app
app = Flask(__name__)
db = SQLAlchemy(app)

# GOOD - Application factory
def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)

    from app.routes import main
    app.register_blueprint(main)

    return app
```

### Blueprint Organization

```python
# routes/users.py
from flask import Blueprint

users_bp = Blueprint('users', __name__, url_prefix='/users')

@users_bp.route('/')
def list_users():
    ...

@users_bp.route('/<int:user_id>')
def get_user(user_id: int):
    ...

# app/__init__.py
from routes.users import users_bp
app.register_blueprint(users_bp)
```

---

## Coding Standards

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Blueprint | snake_case | `users_bp` |
| Route function | snake_case | `get_user` |
| Model | PascalCase | `UserProfile` |
| Config class | PascalCase | `ProductionConfig` |

### File Organization

```
app/
  __init__.py
  models/
    user.py
  routes/
    users.py
    auth.py
  services/
    user_service.py
  templates/
  static/
config.py
run.py
```

---

## What to Skip

- Flask-Admin configuration
- Development server settings
- CLI commands
- Test fixtures with test client
