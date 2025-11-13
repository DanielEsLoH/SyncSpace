# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin Ajax requests.

# Read more: https://github.com/cyu/rack-cors

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # Allow frontend origins from environment variables
    # For local development, set CLIENT_URL to comma-separated list: http://localhost:3000,http://localhost:3001
    # For production, set CLIENT_URL to your frontend URL
    client_urls = ENV.fetch("CLIENT_URL", "").split(",").map(&:strip)

    origins(
      *client_urls,
      /\Ahttps:\/\/.*\.vercel\.app\z/   # Any Vercel deployment (for preview deployments)
    )

    resource "*",
      headers: :any,
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ],
      credentials: true,
      expose: [ "Authorization" ]
  end
end
