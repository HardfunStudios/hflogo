class DeviseCreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      # Devise database_authenticatable
      t.string :email,              null: false, default: ""
      t.string :encrypted_password, null: false, default: ""

      # Devise recoverable
      t.string   :reset_password_token
      t.datetime :reset_password_sent_at

      # Devise rememberable
      t.datetime :remember_created_at

      # Devise confirmable
      t.string   :confirmation_token
      t.datetime :confirmed_at
      t.datetime :confirmation_sent_at
      t.string   :unconfirmed_email

      # Devise trackable
      t.integer  :sign_in_count, default: 0, null: false
      t.datetime :current_sign_in_at
      t.datetime :last_sign_in_at
      t.string   :current_sign_in_ip
      t.string   :last_sign_in_ip

      # OmniAuth
      t.string :provider
      t.string :uid

      # Perfil público
      t.string  :username,      null: false
      t.string  :display_name
      t.text    :bio
      t.string  :avatar_url
      t.date    :date_of_birth
      t.string  :country
      t.string  :locale,        default: "pt-BR", null: false

      # Papéis e moderação
      t.integer :role,          default: 0, null: false
      t.datetime :banned_at
      t.string   :banned_reason

      t.timestamps null: false
    end

    add_index :users, :email,                unique: true
    add_index :users, :username,             unique: true
    add_index :users, :reset_password_token, unique: true
    add_index :users, :confirmation_token,   unique: true
    add_index :users, [ :provider, :uid ],   unique: true
  end
end
