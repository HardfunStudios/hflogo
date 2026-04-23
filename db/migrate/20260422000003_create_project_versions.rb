class CreateProjectVersions < ActiveRecord::Migration[8.1]
  def change
    create_table :project_versions do |t|
      t.references :project,        null: false, foreign_key: true
      t.integer    :version_number, null: false
      t.jsonb      :data,           null: false, default: {}
      t.text       :change_note
      t.boolean    :auto_save,      null: false, default: false
      t.timestamps
    end

    add_index :project_versions, [ :project_id, :version_number ], unique: true
    add_index :project_versions, [ :project_id, :auto_save ]
  end
end
