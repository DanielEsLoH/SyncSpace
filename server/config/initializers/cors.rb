# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin Ajax requests.

# Read more: https://github.com/cyu/rack-cors

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # Allow both local development and deployed frontend origins
    origins(
      "http://localhost:3000",           # Local development
      "http://localhost:3001",           # Local development (alternative port)
      ENV.fetch("CLIENT_URL", ""),       # Deployed frontend (from environment variable)
      /\Ahttps:\/\/.*\.vercel\.app\z/   # Any Vercel deployment
    )

    resource "*",
      headers: :any,
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ],
      credentials: true,
      expose: [ "Authorization" ]
  end
end
