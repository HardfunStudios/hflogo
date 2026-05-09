class Admin::ImageUploadsController < Admin::BaseController
  def create
    blob = ActiveStorage::Blob.create_and_upload!(
      io: params[:file],
      filename: params[:file].original_filename,
      content_type: params[:file].content_type
    )
    render json: { url: url_for(blob) }
  rescue => e
    render json: { error: e.message }, status: :unprocessable_entity
  end
end
