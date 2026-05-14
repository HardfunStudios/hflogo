class CreatePages < ActiveRecord::Migration[8.1]
  def change
    create_table :pages do |t|
      t.string :slug, null: false
      t.string :title, null: false
      t.string :nav_label, null: false
      t.integer :position, default: 0, null: false
      t.text :content
      t.boolean :published, default: true, null: false

      t.timestamps
    end
    add_index :pages, :slug, unique: true
    add_index :pages, :position
  end
end
