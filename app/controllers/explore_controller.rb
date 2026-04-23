class ExploreController < ApplicationController
  def index
    @projects = Project.published.recent.limit(24)
  end
end
