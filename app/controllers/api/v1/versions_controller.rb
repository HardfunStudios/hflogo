class Api::V1::VersionsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_project

  def create
    authorize @project, :update?
    version = @project.versions.create!(
      data:           @project.data,
      auto_save:      false,
      change_note:    params[:change_note],
      version_number: @project.next_version_number
    )
    render json: { id: version.id, version_number: version.version_number }, status: :created
  end

  private

  def set_project
    @project = current_user.projects.find(params[:project_id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Projeto não encontrado" }, status: :not_found
  end
end
