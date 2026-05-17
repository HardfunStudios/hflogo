class SeedAboutPages < ActiveRecord::Migration[8.1]
  IMAGES_DIR = Rails.root.join("db", "seeds", "images")
  PAGES_DIR  = Rails.root.join("db", "seeds", "pages")

  PAGES = [
    { slug: "sobre-a-plataforma",     title: "Sobre a Plataforma",     nav_label: "Sobre a Plataforma",     position: 1, published: true },
    { slug: "o-editor",               title: "O Editor",               nav_label: "O Editor",               position: 2, published: true },
    { slug: "tempo-visivel",          title: "Tempo Visível",          nav_label: "Tempo Visível",          position: 3, published: true },
    { slug: "historia-do-logo",       title: "História do Logo",       nav_label: "História do Logo",       position: 4, published: true },
    { slug: "conceitos-basicos",      title: "Conceitos Básicos",      nav_label: "Conceitos Básicos",      position: 5, published: true },
    { slug: "referencia-de-comandos", title: "Referência de Comandos", nav_label: "Referência de Comandos", position: 6, published: true },
    { slug: "para-educadores",        title: "Para Educadores",        nav_label: "Para Educadores",        position: 7, published: true },
  ].freeze

  def up
    return if Page.exists?

    blobs = upload_images
    PAGES.each { |attrs| create_page(attrs, blobs) }
  end

  def down
    Page.where(slug: PAGES.map { |p| p[:slug] }).destroy_all
  end

  private

  def upload_images
    {
      "yellowturtle2.jpg"  => upload_image("yellowturtle2.jpg",  "image/jpeg"),
      "Seymour_Papert.jpg" => upload_image("Seymour_Papert.jpg", "image/jpeg"),
    }
  end

  def upload_image(filename, content_type)
    path = IMAGES_DIR.join(filename)
    return nil unless path.exist?
    ActiveStorage::Blob.create_and_upload!(
      io:           path.open,
      filename:     filename,
      content_type: content_type
    )
  end

  def create_page(attrs, blobs)
    Page.create!(
      slug:      attrs[:slug],
      title:     attrs[:title],
      nav_label: attrs[:nav_label],
      position:  attrs[:position],
      published: attrs[:published],
      content:   load_content(attrs[:slug], blobs)
    )
  end

  def load_content(slug, blobs)
    path = PAGES_DIR.join("#{slug}.html")
    return nil unless path.exist?
    html = path.read
    blobs.each do |filename, blob|
      next unless blob
      html = html.gsub("BLOB_IMG:#{filename}",
        "/rails/active_storage/blobs/redirect/#{blob.signed_id}/#{filename}")
    end
    html
  end
end
