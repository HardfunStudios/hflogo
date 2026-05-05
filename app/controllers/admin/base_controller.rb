class Admin::BaseController < ApplicationController
  before_action :require_admin_or_moderator

  layout "admin"

  private

  def require_admin_or_moderator
    unless user_signed_in? && (current_user.admin? || current_user.moderator?)
      redirect_to root_path, alert: t("errors.not_authorized")
    end
  end
end
