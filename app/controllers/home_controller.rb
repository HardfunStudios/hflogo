class HomeController < ApplicationController
  def index
    @featured_projects = Project.published.featured.includes(:user).order(updated_at: :desc).limit(8)
  end
end
