# Installation & Configuration — HardFun Logo

## Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- [Node.js](https://nodejs.org/) 20+ (only needed to rebuild the editor bundle)
- Git

---

## 1. Clone the repository

```bash
git clone https://github.com/HardfunStudios/hflogo.git
cd hflogo
```

---

## 2. Environment variables

Create a `.env` file at the project root based on the example below:

```bash
cp .env.example .env
```

Fill in the variables:

```dotenv
# Database (pre-configured for Docker Compose)
DATABASE_URL=postgres://hflogo:hflogo@db:5432/hflogo_development

# Redis (pre-configured for Docker Compose)
REDIS_URL=redis://redis:6379/0

# Google OAuth (see section 4)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# SMTP (see section 5)
SMTP_ADDRESS=smtp.yourserver.com
SMTP_PORT=587
SMTP_USERNAME=your-username
SMTP_PASSWORD=your-password
SMTP_DOMAIN=hardfun.com.br
```

---

## 3. Start the environment

```bash
docker compose up
```

On the first run Docker will build the image — wait for it to finish.

The app will be available at **http://localhost:3002**.

### Create the database and run migrations

```bash
docker compose exec app bin/rails db:create db:migrate db:seed
```

This also creates the default admin user (see section 6).

---

## 4. Google OAuth configuration

Social login uses **Google OAuth 2.0** via the `omniauth-google-oauth2` gem.

> **Optional:** if `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are not set, the "Continuar com Google" button is still rendered but the OAuth flow will fail with an error. Email/password signup and login continue to work normally.

### 4.1 Create OAuth credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or select an existing one)
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth client ID**
5. Application type: **Web application**
6. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3002` (development)
   - `https://yourdomain.com` (production)
7. Under **Authorized redirect URIs**, add:
   - `http://localhost:3002/users/auth/google_oauth2/callback` (development)
   - `https://yourdomain.com/users/auth/google_oauth2/callback` (production)
8. Copy the **Client ID** and **Client Secret** into your `.env`

```dotenv
GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
```

> **Note:** enable the **Google People API** in the console so that profile access (name, avatar) works correctly.

### 4.2 How it works

- The "Continuar com Google" button submits a **POST** request to `/users/auth/google_oauth2`. This is required by the `omniauth-rails_csrf_protection` gem (GET requests to that path are rejected with 404).
- On callback, `User.from_omniauth` finds or creates the user by `provider` + `uid`. New users are automatically confirmed (no email verification step).
- The user's `display_name` and `avatar_url` are populated from the Google profile.

### 4.3 Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `No route matches [GET] "/users/auth/google_oauth2"` | Button sending GET instead of POST | Ensure the view uses `button_to`, not `link_to` |
| `redirect_uri_mismatch` from Google | Callback URL not registered | Add the exact callback URL in the Google Cloud Console |
| `invalid_client` from Google | Wrong or missing credentials | Double-check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env` |
| User created but not signed in | `confirmed_at` not set | `from_omniauth` sets `confirmed_at: Time.current` — check the migration ran |

---

## 5. SMTP (email) configuration

Email is used by Devise for account confirmation, password recovery, etc.

### 5.1 Production

Edit `config/environments/production.rb` and uncomment/adjust:

```ruby
config.action_mailer.delivery_method = :smtp
config.action_mailer.default_url_options = { host: 'yourdomain.com' }
config.action_mailer.smtp_settings = {
  address:              ENV['SMTP_ADDRESS'],
  port:                 ENV['SMTP_PORT']&.to_i || 587,
  domain:               ENV['SMTP_DOMAIN'],
  user_name:            ENV['SMTP_USERNAME'],
  password:             ENV['SMTP_PASSWORD'],
  authentication:       :plain,
  enable_starttls_auto: true
}
```

### 5.2 Development (optional)

To test emails locally, use [Mailpit](https://mailpit.axllent.org/) or [Letter Opener](https://github.com/ryanb/letter_opener):

**Mailpit via Docker:**

```yaml
# Add to docker-compose.yml
mailpit:
  image: axllent/mailpit
  ports:
    - "8025:8025"   # web UI
    - "1025:1025"   # SMTP
```

```dotenv
SMTP_ADDRESS=mailpit
SMTP_PORT=1025
```

Access the inbox at **http://localhost:8025**.

### 5.3 Amazon SES (recommended for production)

1. Open the [Amazon SES console](https://console.aws.amazon.com/ses/)
2. **Verify your domain** under *Verified identities → Create identity → Domain*
   - Add the DNS records (TXT and CNAME for DKIM) provided by SES to your DNS provider
3. **Create SMTP credentials** under *SMTP settings → Create SMTP credentials*
   - This generates an IAM user with the `ses:SendRawEmail` permission
   - Save the **SMTP username** and **SMTP password** — they are only shown once
4. Pick the region closest to your users. SMTP endpoints:

| Region | Address |
|--------|---------|
| us-east-1 (N. Virginia) | email-smtp.us-east-1.amazonaws.com |
| us-east-2 (Ohio) | email-smtp.us-east-2.amazonaws.com |
| sa-east-1 (São Paulo) | email-smtp.sa-east-1.amazonaws.com |
| eu-west-1 (Ireland) | email-smtp.eu-west-1.amazonaws.com |

5. Set the variables in your `.env`:

```dotenv
SMTP_ADDRESS=email-smtp.sa-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USERNAME=AKIAxxxxxxxxxxxxxxxxx   # SMTP username from SES
SMTP_PASSWORD=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SMTP_DOMAIN=hardfun.com.br
```

> **Sandbox mode:** new SES accounts can only send to verified addresses. To send to any email address, request production access under *Account dashboard → Request production access*.

### 5.4 Other providers

| Provider | Address | Port |
|----------|---------|------|
| Gmail | smtp.gmail.com | 587 |
| SendGrid | smtp.sendgrid.net | 587 |
| Mailgun | smtp.mailgun.org | 587 |
| Brevo (Sendinblue) | smtp-relay.brevo.com | 587 |

> For Gmail, use an [app password](https://support.google.com/accounts/answer/185833) — not your account password.

---

## 6. Default admin user

The migration `20260509010145_create_default_admin_user.rb` automatically creates an admin user when running `db:migrate`:

| Field | Value |
|-------|-------|
| Email | admin@hardfun.com.br |
| Password | teste1234 |
| Role | admin |

> **Change the password after first login in production.**

---

## 7. Rebuilding the editor (Blockly)

If you modify files under `editor/js/`, rebuild the bundle:

```bash
cd editor
npm install
npm run build
```

The compiled bundle is saved to `app/assets/builds/logo-editor.js` and served by Propshaft.

---

## 8. Environment variables summary

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection URL |
| `REDIS_URL` | Yes | Redis connection URL |
| `GOOGLE_CLIENT_ID` | Yes* | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes* | Google OAuth client secret |
| `SMTP_ADDRESS` | Production | SMTP server address |
| `SMTP_PORT` | Production | SMTP port (default: 587) |
| `SMTP_USERNAME` | Production | SMTP username |
| `SMTP_PASSWORD` | Production | SMTP password |
| `SMTP_DOMAIN` | Production | Sender domain |

*Without Google OAuth, social login is unavailable but email/password signup still works.

---

## 9. Default ports (Docker Compose)

| Service | Local port |
|---------|-----------|
| App (Rails) | 3002 |
| PostgreSQL | 5434 |
| Redis | 6381 |
