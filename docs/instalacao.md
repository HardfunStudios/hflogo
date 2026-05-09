# Instalação e Configuração — HardFun Logo

## Pré-requisitos

- [Docker](https://www.docker.com/) e Docker Compose
- [Node.js](https://nodejs.org/) 20+ (apenas para rebuild do editor)
- Git

---

## 1. Clonar o repositório

```bash
git clone https://github.com/HardfunStudios/hflogo.git
cd hflogo
```

---

## 2. Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com base no exemplo abaixo:

```bash
cp .env.example .env
```

Preencha as variáveis:

```dotenv
# Banco de dados (já configurado para o Docker Compose)
DATABASE_URL=postgres://hflogo:hflogo@db:5432/hflogo_development

# Redis (já configurado para o Docker Compose)
REDIS_URL=redis://redis:6379/0

# Google OAuth (veja seção 4)
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret

# SMTP (veja seção 5)
SMTP_ADDRESS=smtp.seuservidor.com
SMTP_PORT=587
SMTP_USERNAME=seu-usuario
SMTP_PASSWORD=sua-senha
SMTP_DOMAIN=hardfun.com.br
```

---

## 3. Subir o ambiente

```bash
docker compose up
```

Na primeira execução, o Docker irá construir a imagem. Aguarde a conclusão.

A aplicação estará disponível em **http://localhost:3002**.

### Criar o banco e rodar migrations

```bash
docker compose exec app bin/rails db:create db:migrate db:seed
```

Isso também criará o usuário admin padrão (veja seção 6).

---

## 4. Configuração do Google OAuth

O login social usa **Google OAuth 2.0**. Para configurar:

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto (ou selecione um existente)
3. Vá em **APIs e Serviços → Credenciais**
4. Clique em **Criar credenciais → ID do cliente OAuth**
5. Tipo de aplicação: **Aplicativo da Web**
6. Em **Origens JavaScript autorizadas**, adicione:
   - `http://localhost:3002` (desenvolvimento)
   - `https://seudominio.com` (produção)
7. Em **URIs de redirecionamento autorizados**, adicione:
   - `http://localhost:3002/users/auth/google_oauth2/callback` (desenvolvimento)
   - `https://seudominio.com/users/auth/google_oauth2/callback` (produção)
8. Copie o **Client ID** e o **Client Secret** para o `.env`

```dotenv
GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
```

> **Atenção:** ative a API **Google People API** no console para que o acesso ao perfil funcione.

---

## 5. Configuração de SMTP (e-mail)

O e-mail é usado pelo Devise para confirmação de conta, recuperação de senha, etc.

### 5.1 Produção

Edite `config/environments/production.rb` e descomente/ajuste:

```ruby
config.action_mailer.delivery_method = :smtp
config.action_mailer.default_url_options = { host: 'seudominio.com' }
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

### 5.2 Desenvolvimento (opcional)

Para testar e-mails em desenvolvimento, use o [Mailpit](https://mailpit.axllent.org/) ou [Letter Opener](https://github.com/ryanb/letter_opener):

**Mailpit via Docker:**

```yaml
# Adicione ao docker-compose.yml
mailpit:
  image: axllent/mailpit
  ports:
    - "8025:8025"   # interface web
    - "1025:1025"   # SMTP
```

```dotenv
SMTP_ADDRESS=mailpit
SMTP_PORT=1025
```

Acesse a caixa de entrada em **http://localhost:8025**.

### 5.3 Amazon SES (recomendado para produção)

1. Acesse o [console do Amazon SES](https://console.aws.amazon.com/ses/)
2. **Verifique o domínio** em *Verified identities → Create identity → Domain*
   - Adicione os registros DNS (TXT, CNAME para DKIM) informados pelo SES no seu provedor
3. **Crie credenciais SMTP** em *SMTP settings → Create SMTP credentials*
   - Isso gera um usuário IAM com permissão `ses:SendRawEmail`
   - Anote o **SMTP username** e **SMTP password** gerados (só aparecem uma vez)
4. Escolha a região mais próxima. Os endpoints SMTP são:

| Região | Address |
|--------|---------|
| us-east-1 (N. Virginia) | email-smtp.us-east-1.amazonaws.com |
| us-east-2 (Ohio) | email-smtp.us-east-2.amazonaws.com |
| sa-east-1 (São Paulo) | email-smtp.sa-east-1.amazonaws.com |
| eu-west-1 (Irlanda) | email-smtp.eu-west-1.amazonaws.com |

5. Configure o `.env`:

```dotenv
SMTP_ADDRESS=email-smtp.sa-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USERNAME=AKIAxxxxxxxxxxxxxxxxx   # SMTP username gerado pelo SES
SMTP_PASSWORD=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SMTP_DOMAIN=hardfun.com.br
```

> **Sandbox:** contas novas do SES ficam em modo sandbox e só enviam para endereços verificados. Para enviar para qualquer e-mail, solicite a saída do sandbox em *Account dashboard → Request production access*.

### 5.4 Outros provedores

| Provedor | Address | Port |
|----------|---------|------|
| Gmail | smtp.gmail.com | 587 |
| SendGrid | smtp.sendgrid.net | 587 |
| Mailgun | smtp.mailgun.org | 587 |
| Brevo (Sendinblue) | smtp-relay.brevo.com | 587 |

> Para Gmail, use uma [senha de app](https://support.google.com/accounts/answer/185833) (não a senha da conta).

---

## 6. Usuário admin padrão

A migration `20260509010145_create_default_admin_user.rb` cria automaticamente um usuário admin ao rodar `db:migrate`:

| Campo | Valor |
|-------|-------|
| Email | admin@hardfun.com.br |
| Senha | teste1234 |
| Role  | admin |

> **Troque a senha após o primeiro acesso em produção.**

---

## 7. Rebuild do editor (Blockly)

Se modificar arquivos em `editor/js/`, reconstrua o bundle:

```bash
cd editor
npm install
npm run build
```

O bundle compilado é salvo em `app/assets/builds/logo-editor.js` e servido pelo Propshaft.

---

## 8. Variáveis de ambiente resumidas

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | URL de conexão ao PostgreSQL |
| `REDIS_URL` | Sim | URL de conexão ao Redis |
| `GOOGLE_CLIENT_ID` | Sim* | ID do cliente Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Sim* | Secret do cliente Google OAuth |
| `SMTP_ADDRESS` | Produção | Servidor SMTP |
| `SMTP_PORT` | Produção | Porta SMTP (padrão: 587) |
| `SMTP_USERNAME` | Produção | Usuário SMTP |
| `SMTP_PASSWORD` | Produção | Senha SMTP |
| `SMTP_DOMAIN` | Produção | Domínio do remetente |

*Sem o Google OAuth o login social não funciona, mas o cadastro por e-mail/senha continua disponível.

---

## 9. Portas padrão (Docker Compose)

| Serviço | Porta local |
|---------|------------|
| App (Rails) | 3002 |
| PostgreSQL | 5434 |
| Redis | 6381 |
