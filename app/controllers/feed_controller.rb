class FeedController < ApplicationController
  before_action :authenticate_user!

  def index
    @projects = Project.published.recent.limit(24)
  end
end
