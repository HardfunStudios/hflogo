class Api::V1::ProjectsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_project

  def show
    render json: {
      id:          @project.id,
      title:       @project.title,
      description: @project.description,
      data:        @project.data,
      visibility:  @project.visibility,
      published_at: @project.published_at
    }
  end

  def update
    authorize @project
    if @project.update(project_params)
      render json: { ok: true, updated_at: @project.updated_at }
    else
      render json: { errors: @project.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def thumbnail
    authorize @project, :update?
    svg_data = params[:svg]
    return render json: { error: "SVG ausente" }, status: :bad_request if svg_data.blank?

    GenerateThumbnailJob.perform_later(@project.id, svg_data)
    render json: { ok: true }
  end

  private

  def set_project
    @project = current_user.projects.find(params[:project_id] || params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Projeto não encontrado" }, status: :not_found
  end

  def project_params
    params.require(:project).permit(:title, :description, :visibility, data: {})
  end
end
