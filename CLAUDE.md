# CLAUDE.md — hflogo

Plataforma social de programação visual para crianças (Logo @ HardFun). Rails 8.1 + Hotwire + Tailwind + PostgreSQL. Editor Blockly embedado como bundle Vite.

## Ambiente de desenvolvimento

```bash
docker compose up          # inicia app + postgres + redis
docker compose run app rails db:create db:migrate
docker compose run app bundle exec rspec
```

> **Nota:** O Docker Desktop precisa estar rodando. Se `docker compose` falhar com "Internal Server Error", reinicie o Docker Desktop.

## Stack

- **Backend:** Ruby 3.3.11, Rails 8.1.3
- **Views:** ERB + Hotwire (Turbo + Stimulus)
- **CSS:** Tailwind CSS com tokens HardFun (ver `tailwind.config.js`)
- **Banco:** PostgreSQL 16 com jsonb para projetos
- **Auth:** Devise + OmniAuth Google
- **Autorização:** Pundit
- **Jobs:** Solid Queue
- **Storage:** ActiveStorage + S3-compatível (fase 1+)
- **Testes:** RSpec + FactoryBot + Shoulda-matchers

## Arquitetura

### Editor Blockly

O editor visual vive em `~/Code/hardfun/lp-visible-flow-prototype` e é compilado como bundle Vite para `app/assets/builds/`. **Não reescreva o editor** — apenas a API de comunicação Rails↔editor é mantida aqui.

A API pública do editor é `window.LogoEditor` (exposta em `main.js`). O Stimulus controller `editor_controller.js` é a cola entre Rails e o editor.

### Modelo de dados

- `User` — autenticação + perfil público
- `Project` — workspace Blockly serializado como jsonb em `data`
- `ProjectVersion` — histórico imutável de versões
- `Comment`, `Love`, `Follow`, `Report` — camada social (fase 2+)

### Execução de projetos

**NUNCA** use `eval`, `new Function` ou `<script>` injetado para executar código de projeto. Todo código roda via JS-Interpreter (sandbox). Ver spec `§8.3`.

### Segurança

- Pundit em todos os controllers — `authorize` antes de qualquer ação que acessa dados do usuário
- Rack::Attack configurado em `config/initializers/rack_attack.rb`
- Sanitização de markdown em comments e bio (allow-list)

## Padrões de código

- Seguir o mesmo padrão do CPQ (hardfun-cpq)
- Request specs obrigatórias para todos os endpoints
- System specs para fluxos críticos (criar projeto, publicar, remix)
- Pundit policies em `app/policies/`
- I18n obrigatório — nenhum texto hardcoded em views

## Tokens de design

```
Cor primária:  #0081A6 (hf-blue)
Fonte:         Montserrat
Paleta lúdica: hf-orange #F07D00, hf-green #2ECC71, hf-purple #8B5CF6
```

Ver `tailwind.config.js` e `app/assets/stylesheets/application.tailwind.css`.

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — OAuth Google
- `DATABASE_URL` — já configurado no docker-compose para dev

## Fases de desenvolvimento

- **Fase 0 (atual):** Fundação — Rails, auth, User, Docker ✅
- **Fase 1:** Editor na nuvem — Projeto, auto-save, versões, API
- **Fase 2:** Comunidade — galeria, remix, loves, comments, follow
- **Fase 3:** Moderação, polish, LGPD
- **Fase 4:** Launch
