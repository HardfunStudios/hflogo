require "rails_helper"

RSpec.describe User, type: :model do
  it { should validate_presence_of(:username) }
  it { should validate_uniqueness_of(:username).case_insensitive }
  it { should validate_length_of(:bio).is_at_most(280) }

  describe "age validation" do
    it "rejects users under 13" do
      user = build(:user, date_of_birth: 12.years.ago.to_date)
      expect(user).not_to be_valid
      expect(user.errors[:date_of_birth]).to be_present
    end

    it "accepts users 13 and older" do
      user = build(:user, date_of_birth: 13.years.ago.to_date)
      expect(user).to be_valid
    end
  end

  describe "#display" do
    it "returns display_name when present" do
      user = build(:user, display_name: "Maria")
      expect(user.display).to eq("Maria")
    end

    it "falls back to username" do
      user = build(:user, display_name: nil)
      expect(user.display).to eq(user.username)
    end
  end
end
