class ProjectsController < ApplicationController
  before_action :authenticate_user!, except: [ :show, :code ]
  before_action :authenticate_user!, only: [ :index ]
  before_action :set_project, only: [ :show, :code, :edit, :update, :destroy, :remix, :versions ]

  def index
    @projects = current_user.projects.order(updated_at: :desc)
  end

  def new
    @project = current_user.projects.create!(
      title:      t("projects.default_title"),
      data:       {},
      visibility: :draft
    )
    redirect_to edit_project_path(@project)
  end

  def edit
    authorize @project
    render layout: "editor"
  end

  def show
    authorize @project
    @project.increment!(:views_count)
  end

  def code
    authorize @project, :show?
    redirect_to @project
  end

  def update
    authorize @project
    if @project.update(project_params)
      redirect_to edit_project_path(@project), notice: t("projects.saved")
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @project
    @project.destroy!
    redirect_to root_path, notice: t("projects.deleted")
  end

  def remix
    authorize @project
    remix = @project.fork_for(current_user)
    redirect_to edit_project_path(remix), notice: t("projects.remixed")
  end

  def versions
    authorize @project, :show?
    @versions = @project.versions.recent.limit(50)
  end

  private

  def set_project
    @project = Project.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    redirect_to root_path, alert: t("projects.not_found")
  end

  def project_params
    params.require(:project).permit(:title, :description, :visibility)
  end
end
