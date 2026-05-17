class Admin::UsersController < Admin::BaseController
  before_action :set_user, only: %i[show update ban unban destroy]

  def index
    @users = User.order(created_at: :desc)
    @users = @users.where("username ILIKE ? OR email ILIKE ?", "%#{params[:q]}%", "%#{params[:q]}%") if params[:q].present?
    @users = @users.limit(100)
  end

  def show
    @projects = @user.projects.order(created_at: :desc)
  end

  def update
    if params[:user][:password].present?
      if @user.update(password: params[:user][:password])
        redirect_to admin_user_path(@user), notice: "Senha alterada com sucesso."
      else
        redirect_to admin_user_path(@user), alert: @user.errors.full_messages.to_sentence
      end
    elsif params[:user][:role].present?
      @user.update!(role: params[:user][:role])
      redirect_to admin_user_path(@user), notice: "Papel atualizado."
    else
      redirect_to admin_user_path(@user)
    end
  end

  def ban
    @user.update!(banned_at: Time.current, banned_reason: params[:reason])
    redirect_to admin_user_path(@user), notice: "Usuário banido."
  end

  def unban
    @user.update!(banned_at: nil, banned_reason: nil)
    redirect_to admin_user_path(@user), notice: "Ban removido."
  end

  def destroy
    if @user.projects.any?
      redirect_to admin_user_path(@user), alert: "Não é possível apagar um usuário com projetos. Apague os projetos primeiro."
      return
    end
    @user.destroy!
    redirect_to admin_users_path, notice: "Usuário #{@user.display} apagado."
  end

  private

  def set_user
    @user = User.find(params[:id])
  end
end
