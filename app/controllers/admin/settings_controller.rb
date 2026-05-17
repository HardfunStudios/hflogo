class Admin::SettingsController < Admin::BaseController
  def edit
    @setting = SiteSetting.instance
  end

  def update
    @setting = SiteSetting.instance
    if @setting.update(setting_params)
      SiteSetting.bust_cache
      redirect_to edit_admin_settings_path, notice: "Configurações salvas."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  private

  def setting_params
    params.require(:site_setting).permit(:ga4_measurement_id)
  end
end
