# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_04_22_000003) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "project_versions", force: :cascade do |t|
    t.boolean "auto_save", default: false, null: false
    t.text "change_note"
    t.datetime "created_at", null: false
    t.jsonb "data", default: {}, null: false
    t.bigint "project_id", null: false
    t.datetime "updated_at", null: false
    t.integer "version_number", null: false
    t.index ["project_id", "auto_save"], name: "index_project_versions_on_project_id_and_auto_save"
    t.index ["project_id", "version_number"], name: "index_project_versions_on_project_id_and_version_number", unique: true
    t.index ["project_id"], name: "index_project_versions_on_project_id"
  end

  create_table "projects", force: :cascade do |t|
    t.integer "comments_count", default: 0, null: false
    t.datetime "created_at", null: false
    t.jsonb "data", default: {}, null: false
    t.text "description"
    t.bigint "forked_from_version_id"
    t.integer "loves_count", default: 0, null: false
    t.bigint "parent_project_id"
    t.datetime "published_at"
    t.integer "remixes_count", default: 0, null: false
    t.string "thumbnail_url"
    t.string "title", default: "Sem título", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.integer "views_count", default: 0, null: false
    t.integer "visibility", default: 0, null: false
    t.index ["data"], name: "index_projects_on_data", using: :gin
    t.index ["parent_project_id"], name: "index_projects_on_parent_project_id"
    t.index ["published_at"], name: "index_projects_on_published_at"
    t.index ["user_id"], name: "index_projects_on_user_id"
    t.index ["visibility"], name: "index_projects_on_visibility"
  end

  create_table "users", force: :cascade do |t|
    t.string "avatar_url"
    t.datetime "banned_at"
    t.string "banned_reason"
    t.text "bio"
    t.datetime "confirmation_sent_at"
    t.string "confirmation_token"
    t.datetime "confirmed_at"
    t.string "country"
    t.datetime "created_at", null: false
    t.datetime "current_sign_in_at"
    t.string "current_sign_in_ip"
    t.date "date_of_birth"
    t.string "display_name"
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.datetime "last_sign_in_at"
    t.string "last_sign_in_ip"
    t.string "locale", default: "pt-BR", null: false
    t.string "provider"
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.integer "role", default: 0, null: false
    t.integer "sign_in_count", default: 0, null: false
    t.string "uid"
    t.string "unconfirmed_email"
    t.datetime "updated_at", null: false
    t.string "username", null: false
    t.index ["confirmation_token"], name: "index_users_on_confirmation_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["provider", "uid"], name: "index_users_on_provider_and_uid", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["username"], name: "index_users_on_username", unique: true
  end

  add_foreign_key "project_versions", "projects"
  add_foreign_key "projects", "projects", column: "parent_project_id"
  add_foreign_key "projects", "users"
end
