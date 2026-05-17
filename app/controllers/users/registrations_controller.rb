class Users::RegistrationsController < Devise::RegistrationsController
  def new
    super do |resource|
      prefill_from_google(resource) if google_session_data
    end
  end

  def create
    if google_session_data
      auth = google_session_data.deep_symbolize_keys
      @user = User.complete_omniauth(auth, params[:user][:date_of_birth], params[:user][:username])

      if @user.persisted?
        session.delete("devise.google_data")
        set_flash_message(:notice, :success, kind: "Google") if is_navigational_format?
        sign_in_and_redirect @user, event: :authentication
      else
        build_resource
        prefill_from_google(resource)
        resource.errors.merge!(@user.errors)
        render :new, status: :unprocessable_entity
      end
    else
      super
    end
  end

  private

  def google_session_data
    session["devise.google_data"]
  end

  def prefill_from_google(resource)
    auth = google_session_data.deep_symbolize_keys
    resource.email        = auth.dig(:info, :email)
    resource.display_name = auth.dig(:info, :name)
    resource.username   ||= User.send(:generate_username, auth.dig(:info, :email).to_s)
  end
end
