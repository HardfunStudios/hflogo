class Admin::ProjectsController < Admin::BaseController
  before_action :set_project, only: %i[show feature unfeature destroy]

  def index
    @projects = Project.includes(:user).order(created_at: :desc)
    @projects = @projects.where("projects.title ILIKE ?", "%#{params[:q]}%") if params[:q].present?
    @projects = @projects.where(featured: true) if params[:featured] == "1"
    @projects = @projects.limit(100)
  end

  def show
  end

  def feature
    @project.update!(featured: true)
    redirect_to admin_projects_path, notice: "Projeto destacado."
  end

  def unfeature
    @project.update!(featured: false)
    redirect_to admin_projects_path, notice: "Destaque removido."
  end

  def destroy
    @project.destroy!
    redirect_to admin_projects_path, notice: "Projeto excluído."
  end

  private

  def set_project
    @project = Project.find(params[:id])
  end
end
