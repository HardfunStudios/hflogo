class Project < ApplicationRecord
  belongs_to :user
  belongs_to :parent_project, class_name: "Project", optional: true
  has_many   :versions, class_name: "ProjectVersion", dependent: :destroy
  has_many   :remixes,  class_name: "Project", foreign_key: :parent_project_id, dependent: :nullify

  # "private" conflita com método Ruby — prefixado com instance_method: false
  enum :visibility, { draft: 0, unlisted: 1, published: 2 }

  validates :title, presence: true, length: { maximum: 100 }
  validates :description, length: { maximum: 500 }, allow_blank: true
  validates :data, exclusion: { in: [ nil ], message: :blank }

  scope :published,     -> { where(visibility: :published).where.not(published_at: nil) }
  scope :featured,      -> { where(featured: true) }
  scope :by_popularity, -> { order(Arel.sql("loves_count + remixes_count * 2 DESC")) }
  scope :recent,        -> { order(published_at: :desc) }

  after_save :create_auto_version, if: :saved_change_to_data?

  def publish!
    update!(visibility: :published, published_at: published_at || Time.current)
  end

  def unpublish!
    update!(visibility: :draft)
  end

  def fork_for(user)
    user.projects.create!(
      title:                   "[Remix] #{title}",
      description:             description,
      data:                    data,
      parent_project:          self,
      forked_from_version_id:  versions.last&.id,
      visibility:              :draft
    ).tap { increment!(:remixes_count) }
  end

  def next_version_number
    (versions.maximum(:version_number) || 0) + 1
  end

  private

  def create_auto_version
    versions.create!(
      data:           data,
      auto_save:      true,
      version_number: next_version_number
    )
    purge_old_auto_saves
  end

  def purge_old_auto_saves
    auto_saves = versions.where(auto_save: true).order(created_at: :desc).offset(10)
    auto_saves.delete_all if auto_saves.exists?
  end
end
