class CreateDefaultAdminUser < ActiveRecord::Migration[8.1]
  def up
    return if User.exists?(email: 'admin@hardfun.com.br')

    User.create!(
      email:                 'admin@hardfun.com.br',
      password:              'teste1234',
      password_confirmation: 'teste1234',
      username:              'admin',
      display_name:          'Admin',
      role:                  :admin,
      confirmed_at:          Time.current,
      date_of_birth:         Date.new(1990, 1, 1)
    )
  end

  def down
    User.find_by(email: 'admin@hardfun.com.br')&.destroy
  end
end
