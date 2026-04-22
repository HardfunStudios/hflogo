class UserPolicy < ApplicationPolicy
  def show?   = true
  def update? = user == record || user&.admin?
  def destroy? = user == record || user&.admin?

  class Scope < ApplicationPolicy::Scope
    def resolve = scope.all
  end
end
