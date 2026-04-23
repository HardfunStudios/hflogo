class ProjectPolicy < ApplicationPolicy
  def show?
    record.published? || record.unlisted? || owned_by_user?
  end

  def create?  = user.present?
  def edit?    = owned_by_user?
  def update?  = owned_by_user?
  def destroy? = owned_by_user? || user&.admin?
  def remix?   = user.present? && (record.published? || record.unlisted?)

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user&.admin?
        scope.all
      elsif user
        scope.where(user: user).or(scope.published)
      else
        scope.published
      end
    end
  end

  private

  def owned_by_user?
    user.present? && record.user_id == user.id
  end
end
