module AuthHelpers
  def auth_headers(user)
    token = JsonWebToken.encode(user_id: user.id)
    { 'Authorization' => "Bearer #{token}" }
  end

  def json_response
    JSON.parse(response.body, symbolize_names: true)
  end

  def create_confirmed_user(attributes = {})
    sequence_num = rand(10000..99999)
    create(:user, {
      name: "Test User #{sequence_num}",
      email: "testuser#{sequence_num}@example.com",
      password: 'password123',
      password_confirmation: 'password123',
      confirmed_at: Time.current
    }.merge(attributes))
  end

  def create_unconfirmed_user(attributes = {})
    sequence_num = rand(10000..99999)
    create(:user, {
      name: "Unconfirmed User #{sequence_num}",
      email: "unconfirmed#{sequence_num}@example.com",
      password: 'password123',
      password_confirmation: 'password123',
      confirmed_at: nil
    }.merge(attributes))
  end
end

RSpec.configure do |config|
  config.include AuthHelpers, type: :request
end
