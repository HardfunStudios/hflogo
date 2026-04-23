class VersionsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_project
  before_action :set_version, only: [ :show, :restore ]

  def index
    authorize @project, :show?
    @versions = @project.versions.recent.limit(50)
  end

  def show
    authorize @project, :show?
  end

  def restore
    authorize @project, :update?
    @project.update!(data: @version.data)
    redirect_to edit_project_path(@project), notice: t("versions.restored")
  end

  private

  def set_project
    @project = Project.find(params[:project_id])
  end

  def set_version
    @version = @project.versions.find(params[:id])
  end
end
