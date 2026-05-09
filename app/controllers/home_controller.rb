class HomeController < ApplicationController
  def index
    @featured_projects = Project.published.featured.includes(:user).order(updated_at: :desc).limit(8)
    @recent_projects   = Project.published.includes(:user).order(published_at: :desc).limit(12)
  end
end
