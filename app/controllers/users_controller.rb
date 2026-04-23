class UsersController < ApplicationController
  def show
    @user = User.find_by!(username: params[:username])
    @projects = @user.projects.published.recent.limit(12)
  rescue ActiveRecord::RecordNotFound
    redirect_to root_path, alert: t("errors.not_found")
  end
end
