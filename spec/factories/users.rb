FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user#{n}@example.com" }
    sequence(:username) { |n| "user#{n}" }
    password { "password123" }
    display_name { "Test User" }
    date_of_birth { 18.years.ago.to_date }
    locale { "pt-BR" }
    confirmed_at { Time.current }

    trait :admin do
      role { :admin }
    end

    trait :moderator do
      role { :moderator }
    end

    trait :banned do
      banned_at { 1.day.ago }
      banned_reason { "Violação dos termos de uso" }
    end
  end
end
