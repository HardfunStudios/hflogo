class Page < ApplicationRecord
  validates :slug, presence: true, uniqueness: true, format: { with: /\A[a-z0-9\-]+\z/ }
  validates :title, presence: true
  validates :nav_label, presence: true

  scope :published, -> { where(published: true) }
  scope :ordered, -> { order(:position) }

  before_validation :set_slug_from_title, if: -> { slug.blank? && title.present? }

  private

  def set_slug_from_title
    self.slug = title.downcase.gsub(/[^a-z0-9\s\-]/, "").gsub(/\s+/, "-").gsub(/-+/, "-").strip
  end
end
