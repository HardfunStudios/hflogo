class Admin::DashboardController < Admin::BaseController
  def index
    @total_users    = User.count
    @total_projects = Project.count
    @published      = Project.published.count
    @featured       = Project.where(featured: true).count
    @recent_users   = User.order(created_at: :desc).limit(5)
    @recent_projects = Project.includes(:user).order(created_at: :desc).limit(5)
  end
end
