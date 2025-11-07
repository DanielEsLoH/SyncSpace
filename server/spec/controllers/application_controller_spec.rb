require 'rails_helper'
require 'ostruct'

# Create a test controller to test ApplicationController methods
class TestController < ApplicationController
  skip_before_action :authenticate_request, only: [ :public_action, :optional_auth_action ]
  before_action :authenticate_optional, only: [ :optional_auth_action ]

  def public_action
    render json: { message: 'public' }
  end

  def protected_action
    render json: { message: 'protected', user_id: current_user.id }
  end

  def optional_auth_action
    if current_user
      render json: { message: 'authenticated', user_id: current_user.id }
    else
      render json: { message: 'anonymous' }
    end
  end

  def action_requiring_authorization
    resource = OpenStruct.new(user_id: params[:resource_user_id].to_i)
    authorize_user!(resource)
    render json: { message: 'authorized' }
  end
end

RSpec.describe ApplicationController, type: :controller do
  controller(TestController) do
    def public_action
      render json: { message: 'public' }
    end

    def protected_action
      render json: { message: 'protected', user_id: current_user.id }
    end

    def optional_auth_action
      if current_user
        render json: { message: 'authenticated', user_id: current_user.id }
      else
        render json: { message: 'anonymous' }
      end
    end

    def action_requiring_authorization
      resource = OpenStruct.new(user_id: params[:resource_user_id].to_i)
      authorize_user!(resource)
      render json: { message: 'authorized' } unless performed?
    end
  end

  let(:user) { create(:user) }
  let(:token) { JsonWebToken.encode(user_id: user.id) }

  before do
    routes.draw do
      get 'public_action' => 'test#public_action'
      get 'protected_action' => 'test#protected_action'
      get 'optional_auth_action' => 'test#optional_auth_action'
      get 'action_requiring_authorization' => 'test#action_requiring_authorization'
    end
  end

  describe '#authenticate_request' do
    context 'with valid token' do
      it 'sets current_user' do
        request.headers['Authorization'] = "Bearer #{token}"
        get :protected_action

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)['user_id']).to eq(user.id)
      end
    end

    context 'with invalid token' do
      it 'returns unauthorized' do
        request.headers['Authorization'] = 'Bearer invalid_token'
        get :protected_action

        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)['error']).to eq('Unauthorized')
      end
    end

    context 'with no token' do
      it 'returns unauthorized' do
        get :protected_action

        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)['error']).to eq('Unauthorized')
      end
    end

    context 'when user not found' do
      let(:invalid_user_token) { JsonWebToken.encode(user_id: 99999) }

      it 'returns user not found error' do
        request.headers['Authorization'] = "Bearer #{invalid_user_token}"
        get :protected_action

        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)['error']).to eq('User not found')
      end
    end

    context 'when Authorization header has Bearer prefix' do
      it 'extracts token correctly' do
        request.headers['Authorization'] = "Bearer #{token}"
        get :protected_action

        expect(response).to have_http_status(:ok)
      end
    end

    context 'when Authorization header has no Bearer prefix' do
      it 'uses the header value directly' do
        request.headers['Authorization'] = token
        get :protected_action

        expect(response).to have_http_status(:ok)
      end
    end
  end

  describe '#authenticate_optional' do
    context 'with valid token' do
      it 'sets current_user' do
        request.headers['Authorization'] = "Bearer #{token}"
        get :optional_auth_action

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)['message']).to eq('authenticated')
        expect(JSON.parse(response.body)['user_id']).to eq(user.id)
      end
    end

    context 'without token' do
      it 'allows access without setting current_user' do
        get :optional_auth_action

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)['message']).to eq('anonymous')
      end
    end

    context 'with invalid token' do
      it 'allows access without setting current_user' do
        request.headers['Authorization'] = 'Bearer invalid_token'
        get :optional_auth_action

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)['message']).to eq('anonymous')
      end
    end

    context 'when user not found' do
      let(:invalid_user_token) { JsonWebToken.encode(user_id: 99999) }

      it 'sets current_user to nil' do
        request.headers['Authorization'] = "Bearer #{invalid_user_token}"
        get :optional_auth_action

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)['message']).to eq('anonymous')
      end
    end
  end

  describe '#authorize_user!' do
    before do
      request.headers['Authorization'] = "Bearer #{token}"
    end

    context 'when user owns the resource' do
      it 'allows the action' do
        get :action_requiring_authorization, params: { resource_user_id: user.id }

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)['message']).to eq('authorized')
      end
    end

    context 'when user does not own the resource' do
      let(:other_user) { create(:user) }

      it 'returns forbidden' do
        get :action_requiring_authorization, params: { resource_user_id: other_user.id }

        expect(response).to have_http_status(:forbidden)
        expect(JSON.parse(response.body)['error']).to eq('Forbidden')
      end
    end
  end
end
