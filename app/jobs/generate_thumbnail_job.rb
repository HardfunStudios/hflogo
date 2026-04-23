class GenerateThumbnailJob < ApplicationJob
  queue_as :default

  # No MVP: apenas salva o SVG como data URI no thumbnail_url.
  # Fase 2+: converter SVG→PNG via ImageProcessing e armazenar no S3.
  def perform(project_id, svg_data)
    project = Project.find_by(id: project_id)
    return unless project

    data_uri = "data:image/svg+xml;charset=utf-8,#{CGI.escape(svg_data)}"
    project.update_column(:thumbnail_url, data_uri)
  end
end
