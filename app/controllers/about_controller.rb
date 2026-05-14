class AboutController < ApplicationController
  before_action :load_pages

  def index
    first = @pages.first
    return render :empty unless first
    redirect_to about_page_path(first.slug)
  end

  def show
    @page = @pages.find { |p| p.slug == params[:slug] }
    return redirect_to about_path unless @page
  end

  private

  def load_pages
    @pages = Page.published.ordered
  end
end
