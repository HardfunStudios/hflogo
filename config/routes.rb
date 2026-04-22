Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  # Autenticação
  devise_for :users, controllers: {
    omniauth_callbacks: "users/omniauth_callbacks"
  }

  # Perfis públicos
  get "/u/:username", to: "users#show", as: :user_profile

  # Projetos (fase 1+)
  resources :projects do
    member do
      get  :code
      post :remix
    end
    resources :versions, only: [ :index, :show ] do
      member { post :restore }
    end
  end

  # Galeria e feed (fase 2+)
  get "/explore", to: "explore#index", as: :explore
  get "/feed",    to: "feed#index",    as: :feed

  # Admin (fase 3+)
  namespace :admin do
    root to: "dashboard#index"
    resources :reports, only: [ :index, :show, :update ]
    resources :users,   only: [ :index, :show, :update ]
  end

  # API interna do editor (fase 1+)
  namespace :api do
    namespace :v1 do
      resources :projects, only: [ :show, :update ] do
        member { post :thumbnail }
        resources :versions, only: [ :create ]
      end
    end
  end

  root to: "home#index"
end
