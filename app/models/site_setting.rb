class SiteSetting < ApplicationRecord
  CACHE_KEY = "site_setting/ga4_measurement_id"

  def self.instance
    find_or_create_by!(id: 1)
  end

  def self.ga4_measurement_id
    Rails.cache.fetch(CACHE_KEY, expires_in: 10.minutes) do
      instance.ga4_measurement_id.presence
    end
  end

  def self.bust_cache
    Rails.cache.delete(CACHE_KEY)
  end
end
