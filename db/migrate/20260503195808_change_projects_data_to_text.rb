class ChangeProjectsDataToText < ActiveRecord::Migration[8.1]
  def up
    remove_index :projects, :data if index_exists?(:projects, :data)
    change_column :projects, :data, :text, null: false, default: '{}'
    change_column :project_versions, :data, :text, null: false, default: '{}'
  end

  def down
    change_column :projects, :data, :jsonb, null: false, default: {}, using: 'data::jsonb'
    change_column :project_versions, :data, :jsonb, null: false, default: {}, using: 'data::jsonb'
    add_index :projects, :data, using: :gin
  end
end
