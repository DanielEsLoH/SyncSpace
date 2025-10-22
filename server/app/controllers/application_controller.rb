class ApplicationController < ActionController::API
  before_action :authenticate_request

  attr_reader :current_user

  private

  def authenticate_request
    header = request.headers['Authorization']
    header = header.split(' ').last if header

    begin
      decoded = JsonWebToken.decode(header)
      @current_user = User.find(decoded[:user_id]) if decoded
    rescue ActiveRecord::RecordNotFound
      render json: { error: 'User not found' }, status: :unauthorized
      return
    end

    render json: { error: 'Unauthorized' }, status: :unauthorized unless @current_user
  end

  def authenticate_optional
    header = request.headers['Authorization']
    header = header.split(' ').last if header

    return unless header

    begin
      decoded = JsonWebToken.decode(header)
      @current_user = User.find(decoded[:user_id]) if decoded
    rescue ActiveRecord::RecordNotFound
      @current_user = nil
    end
  end

  def authorize_user!(resource)
    unless resource.user_id == current_user.id
      render json: { error: 'Forbidden' }, status: :forbidden
    end
  end
end
