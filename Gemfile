source "https://rubygems.org"

gem "rails", "~> 8.1.3"
gem "rails-i18n"
gem "propshaft"
gem "pg", "~> 1.1"
gem "puma", ">= 5.0"
gem "importmap-rails"
gem "turbo-rails"
gem "stimulus-rails"
gem "tailwindcss-rails"
gem "jbuilder"

# Autenticação
gem "devise"
gem "omniauth-google-oauth2"
gem "omniauth-rails_csrf_protection"

# Autorização
gem "pundit"

# Rate limiting
gem "rack-attack"

# Storage e processamento de imagem
gem "image_processing", "~> 1.2"

# Jobs assíncronos
gem "solid_cache"
gem "solid_queue"
gem "solid_cable"

gem "bootsnap", require: false
gem "kamal", require: false
gem "thruster", require: false
gem "tzinfo-data", platforms: %i[ windows jruby ]

group :development, :test do
  gem "debug", platforms: %i[ mri windows ], require: "debug/prelude"
  gem "rspec-rails"
  gem "factory_bot_rails"
  gem "shoulda-matchers"
  gem "bundler-audit", require: false
  gem "brakeman", require: false
  gem "rubocop-rails-omakase", require: false
end

group :development do
  gem "web-console"
end

group :test do
  gem "capybara"
  gem "selenium-webdriver"
end
