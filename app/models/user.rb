class User < ApplicationRecord
  has_many :projects, dependent: :destroy

  devise :database_authenticatable, :registerable, :recoverable,
         :rememberable, :validatable, :confirmable, :trackable,
         :omniauthable, omniauth_providers: [ :google_oauth2 ]

  before_create :skip_confirmation_if_mail_unconfigured

  enum :role, { user: 0, moderator: 1, admin: 2 }

  validates :username, presence: true, uniqueness: { case_sensitive: false },
            format: { with: /\A[a-z0-9_]{3,30}\z/, message: :invalid_username }
  validates :bio, length: { maximum: 280 }, allow_blank: true
  validates :date_of_birth, presence: true, on: :create

  validate :must_be_at_least_13, if: :date_of_birth?

  def self.from_omniauth(auth)
    find_or_create_by(provider: auth.provider, uid: auth.uid) do |user|
      user.email        = auth.info.email
      user.password     = Devise.friendly_token[0, 20]
      user.display_name = auth.info.name
      user.avatar_url   = auth.info.image
      user.confirmed_at = Time.current
      user.username     = generate_username(auth.info.email)
    end
  end

  def self.complete_omniauth(auth, date_of_birth, username = nil)
    find_or_initialize_by(provider: auth[:provider], uid: auth[:uid]).tap do |user|
      user.email         = auth.dig(:info, :email)
      user.password      = Devise.friendly_token[0, 20]
      user.display_name  = auth.dig(:info, :name)
      user.avatar_url    = auth.dig(:info, :image)
      user.confirmed_at  = Time.current
      user.username      = username.presence || generate_username(auth.dig(:info, :email).to_s)
      user.date_of_birth = date_of_birth
      user.save
    end
  end

  def banned?
    banned_at.present?
  end

  def display
    display_name.presence || username
  end

  private

  def skip_confirmation_if_mail_unconfigured
    skip_confirmation! if ActionMailer::Base.delivery_method == :test
  end

  def must_be_at_least_13
    if date_of_birth > 13.years.ago.to_date
      errors.add(:date_of_birth, :too_young)
    end
  end

  def self.generate_username(email)
    base = email.split("@").first.downcase.gsub(/[^a-z0-9_]/, "_").first(25)
    candidate = base
    n = 1
    while exists?(username: candidate)
      candidate = "#{base}#{n}"
      n += 1
    end
    candidate
  end
end
