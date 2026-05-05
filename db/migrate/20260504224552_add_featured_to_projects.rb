class AddFeaturedToProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :projects, :featured, :boolean, default: false, null: false
  end
end
