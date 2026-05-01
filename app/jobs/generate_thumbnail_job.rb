class GenerateThumbnailJob < ApplicationJob
  queue_as :default

  # No MVP: apenas salva o SVG como data URI no thumbnail_url.
  # Fase 2+: converter SVG→PNG via ImageProcessing e armazenar no S3.
  def perform(project_id, data_uri)
    project = Project.find_by(id: project_id)
    return unless project

    # Aceita data URI de PNG (canvas.toDataURL) ou SVG escapado (legado)
    uri = data_uri.start_with?("data:") ? data_uri
                                         : "data:image/svg+xml;charset=utf-8,#{CGI.escape(data_uri)}"
    project.update_column(:thumbnail_url, uri)
  end
end
