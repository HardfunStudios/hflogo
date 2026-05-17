class CreateSiteSettings < ActiveRecord::Migration[8.1]
  def change
    create_table :site_settings do |t|
      t.string :ga4_measurement_id

      t.timestamps
    end
  end
end
