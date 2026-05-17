class LocalesController < ApplicationController
  def update
    locale = params[:locale].to_sym
    locale = I18n.default_locale unless I18n.available_locales.include?(locale)

    if user_signed_in?
      current_user.update_column(:locale, locale)
    else
      session[:locale] = locale
    end

    redirect_back fallback_location: root_path
  end
end
