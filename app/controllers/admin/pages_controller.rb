class Admin::PagesController < Admin::BaseController
  before_action :set_page, only: %i[edit update destroy]

  def index
    @pages = Page.ordered
  end

  def new
    @page = Page.new(position: (Page.maximum(:position) || 0) + 1, published: true)
  end

  def create
    @page = Page.new(page_params)
    if @page.save
      redirect_to admin_pages_path, notice: "Página criada."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit; end

  def update
    if @page.update(page_params)
      redirect_to admin_pages_path, notice: "Página atualizada."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @page.destroy
    redirect_to admin_pages_path, notice: "Página removida."
  end

  private

  def set_page
    @page = Page.find(params[:id])
  end

  def page_params
    params.require(:page).permit(:slug, :title, :nav_label, :position, :content, :published)
  end
end
