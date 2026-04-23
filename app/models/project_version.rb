class ProjectVersion < ApplicationRecord
  belongs_to :project

  validates :version_number, presence: true, uniqueness: { scope: :project_id }
  validates :data, presence: true

  scope :manual, -> { where(auto_save: false) }
  scope :recent, -> { order(created_at: :desc) }
end
