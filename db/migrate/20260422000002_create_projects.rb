class CreateProjects < ActiveRecord::Migration[8.1]
  def change
    create_table :projects do |t|
      t.references :user,           null: false, foreign_key: true
      t.string     :title,          null: false, default: "Sem título"
      t.text       :description
      t.jsonb      :data,           null: false, default: {}
      t.string     :thumbnail_url
      t.integer    :visibility,     null: false, default: 0
      t.references :parent_project, foreign_key: { to_table: :projects }, null: true
      t.bigint     :forked_from_version_id
      t.integer    :views_count,    null: false, default: 0
      t.integer    :loves_count,    null: false, default: 0
      t.integer    :remixes_count,  null: false, default: 0
      t.integer    :comments_count, null: false, default: 0
      t.datetime   :published_at
      t.timestamps
    end

    add_index :projects, :visibility
    add_index :projects, :published_at
    add_index :projects, :data, using: :gin
  end
end
