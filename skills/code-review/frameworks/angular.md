# Angular Framework Patterns

Security and quality patterns specific to Angular applications.

---

## Security Patterns

### XSS Prevention

| Pattern | Risk | Detection |
|---------|------|-----------|
| `innerHTML` binding | High | `[innerHTML]="userInput"` without sanitization |
| `bypassSecurityTrust*` | Critical | Bypassing Angular sanitizer |
| Template injection | High | Dynamic template construction |

**Safe Pattern:**
```typescript
// BAD
@Component({
  template: `<div [innerHTML]="userComment"></div>`
})

// GOOD - Angular sanitizes by default for interpolation
@Component({
  template: `<div>{{userComment}}</div>`
})

// If HTML is needed, sanitize explicitly
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  template: `<div [innerHTML]="sanitizedContent"></div>`
})
export class CommentComponent {
  sanitizedContent: SafeHtml;

  constructor(private sanitizer: DomSanitizer) {}

  setContent(html: string) {
    // Only use when HTML is from trusted source
    this.sanitizedContent = this.sanitizer.sanitize(SecurityContext.HTML, html);
  }
}
```

### URL Safety

| Pattern | Risk | Detection |
|---------|------|-----------|
| Dynamic href | High | `[href]="userUrl"` |
| Router navigate with user input | Medium | `router.navigate([userInput])` |

**Safe Pattern:**
```typescript
// Validate URLs before using
validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}
```

### HTTP Security

```typescript
// Always use HttpClient (includes XSRF protection)
import { HttpClient } from '@angular/common/http';

// Configure XSRF
@NgModule({
  imports: [
    HttpClientModule,
    HttpClientXsrfModule.withOptions({
      cookieName: 'XSRF-TOKEN',
      headerName: 'X-XSRF-TOKEN'
    })
  ]
})
```

---

## Type Safety Patterns

### Component Inputs/Outputs

```typescript
// BAD
@Input() data: any;
@Output() changed = new EventEmitter<any>();

// GOOD
interface UserData {
  id: string;
  name: string;
}

@Input() data!: UserData;
@Output() changed = new EventEmitter<UserData>();
```

### Observable Typing

```typescript
// BAD
users$: Observable<any>;

// GOOD
users$: Observable<User[]>;

// With error handling
users$ = this.http.get<User[]>('/api/users').pipe(
  catchError(error => {
    console.error('Failed to fetch users:', error);
    return of([]);
  })
);
```

### Form Typing

```typescript
// BAD
form = new FormGroup({
  name: new FormControl(''),
  email: new FormControl('')
});

// GOOD - Typed forms (Angular 14+)
interface UserForm {
  name: FormControl<string>;
  email: FormControl<string>;
}

form = new FormGroup<UserForm>({
  name: new FormControl('', { nonNullable: true }),
  email: new FormControl('', { nonNullable: true })
});
```

---

## Linting Patterns

### Component Size

| Metric | Threshold | Action |
|--------|-----------|--------|
| Template lines | >100 | Split to sub-components |
| Component methods | >10 | Extract to service |
| Constructor params | >5 | Review dependencies |

### Subscription Management

```typescript
// BAD - Memory leak
ngOnInit() {
  this.service.getData().subscribe(data => this.data = data);
}

// GOOD - Automatic cleanup
data$ = this.service.getData();
// Use async pipe in template: {{ data$ | async }}

// Or manual cleanup
private destroy$ = new Subject<void>();

ngOnInit() {
  this.service.getData()
    .pipe(takeUntil(this.destroy$))
    .subscribe(data => this.data = data);
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

---

## Coding Standards

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Component | PascalCase + Component suffix | `UserProfileComponent` |
| Service | PascalCase + Service suffix | `AuthService` |
| Directive | PascalCase + Directive suffix | `HighlightDirective` |
| Pipe | PascalCase + Pipe suffix | `CurrencyPipe` |

### File Organization

```
feature/
  feature.component.ts
  feature.component.html
  feature.component.scss
  feature.component.spec.ts
  feature.module.ts
  feature-routing.module.ts
  services/
  models/
```

---

## What to Skip

- Angular CLI generated code
- Zone.js related patterns
- Test bed setup boilerplate
- Module declarations
