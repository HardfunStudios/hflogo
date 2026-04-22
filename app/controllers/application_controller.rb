class ApplicationController < ActionController::Base
  include Pundit::Authorization

  before_action :set_locale
  before_action :configure_permitted_parameters, if: :devise_controller?

  rescue_from Pundit::NotAuthorizedError, with: :handle_unauthorized

  allow_browser versions: :modern
  stale_when_importmap_changes

  private

  def set_locale
    I18n.locale = current_user&.locale&.to_sym || browser_locale || I18n.default_locale
  end

  def browser_locale
    request.env["HTTP_ACCEPT_LANGUAGE"]
      &.scan(/[a-z]{2}(?:-[A-Z]{2})?/)
      &.map { |l| l.downcase.sub("-", "_").to_sym }
      &.find { |l| I18n.available_locales.include?(l) }
  end

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [
      :username, :display_name, :date_of_birth, :country, :locale
    ])
    devise_parameter_sanitizer.permit(:account_update, keys: [
      :display_name, :bio, :country, :locale, :avatar_url
    ])
  end

  def handle_unauthorized
    respond_to do |format|
      format.html { redirect_to root_path, alert: t("errors.not_authorized") }
      format.json { render json: { error: "Not authorized" }, status: :forbidden }
    end
  end
end
