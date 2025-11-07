Rails.application.routes.draw do
  # Health check
  get "up" => "rails/health#show", as: :rails_health_check

  # Mount ActionCable
  mount ActionCable.server => "/cable"

  # API routes
  namespace :api do
    namespace :v1 do
      # Authentication
      post "auth/register", to: "auth#register"
      post "auth/login", to: "auth#login"
      post "auth/refresh", to: "auth#refresh"
      get "auth/confirm/:token", to: "auth#confirm_email"
      post "auth/forgot_password", to: "auth#forgot_password"
      post "auth/reset_password", to: "auth#reset_password"
      get "auth/me", to: "auth#me"

      # Posts
      resources :posts do
        # Comments on posts
        resources :comments, only: [ :index, :create ]
        # Reactions on posts
        post "reactions", to: "reactions#toggle"
        get "reactions", to: "reactions#index"
      end

      # Comments
      resources :comments, only: [ :update, :destroy ] do
        # Nested comments (replies)
        resources :comments, only: [ :index, :create ]
        # Reactions on comments
        post "reactions", to: "reactions#toggle"
        get "reactions", to: "reactions#index"
      end

      # Search
      get "search", to: "search#index"

      # Notifications
      resources :notifications, only: [ :index ] do
        member do
          patch "read", to: "notifications#mark_read"
        end
        collection do
          patch "mark_all_read"
          get "unread_count"
        end
      end

      # Users
      resources :users, only: [ :show, :update ] do
        collection do
          get "search"
        end
        member do
          get "posts"
          patch "preferences", to: "users#update_preferences"
        end
      end

      # Tags
      resources :tags, only: [ :index, :show ] do
        member do
          get "posts"
        end
      end
    end
  end
end
