# Cria projeto Mandelbrot para o usuário Juliano
# Run: docker compose exec app bin/rails runner db/seed_mandelbrot.rb

def uid; SecureRandom.hex(4); end

def num_shadow(n)
  { "type" => "math_number", "id" => uid, "fields" => { "NUM" => n } }
end

def setpos_block(x, y)
  { "type" => "turtle_setpos", "id" => uid,
    "inputs" => {
      "x" => { "shadow" => num_shadow(x) },
      "y" => { "shadow" => num_shadow(y) }
    } }
end

COLOR_MAP = [
  "#000000", "#00008b", "#0000cd", "#0000ff",
  "#0080ff", "#00bfff", "#00ffff", "#00ff80",
  "#00cc00", "#80ff00", "#ffff00", "#ffcc00",
  "#ff8000", "#ff4000", "#ff0000", "#ff00ff"
]

def setcolor_block(idx)
  hex = COLOR_MAP[idx.clamp(0, 15)]
  { "type" => "pen_setpencolor", "id" => uid,
    "inputs" => { "color" => { "block" => {
      "type" => "pen_colornumber", "id" => uid,
      "fields" => { "SWATCH" => hex, "NUM" => idx.clamp(0, 15) }
    } } } }
end

def setwidth_block(w)
  { "type" => "pen_setpensize", "id" => uid,
    "inputs" => { "size" => { "shadow" => num_shadow(w) } } }
end

def penup_block;  { "type" => "pen_setpenup",   "id" => uid }; end
def pendown_block; { "type" => "pen_setpendown", "id" => uid }; end
def forward_block(n)
  { "type" => "turtle_forward", "id" => uid,
    "inputs" => { "steps" => { "shadow" => num_shadow(n) } } }
end

# ── Compute Mandelbrot ────────────────────────────────────────────────────────
# Grid resolution
COLS = 32
ROWS = 22
MAX_ITER = 15

# Mandelbrot coordinate range
MX_MIN = -2.2
MX_MAX =  0.8
MY_MIN = -1.1
MY_MAX =  1.1

# Canvas coordinate range (Logo origin = center, y up)
CX_RANGE = 130.0  # -130 to +130
CY_RANGE =  95.0  # -95  to +95

pixels = []

(0...ROWS).each do |row|
  (0...COLS).each do |col|
    # Mandelbrot c
    cr = MX_MIN + col.to_f / (COLS - 1) * (MX_MAX - MX_MIN)
    ci = MY_MIN + row.to_f / (ROWS - 1) * (MY_MAX - MY_MIN)

    zr, zi = 0.0, 0.0
    iter = 0
    while zr*zr + zi*zi < 4.0 && iter < MAX_ITER
      zr, zi = zr*zr - zi*zi + cr, 2.0*zr*zi + ci
      iter += 1
    end

    color_idx = iter == MAX_ITER ? 0 : (iter % 15) + 1

    # Canvas position
    px = ((col.to_f / (COLS - 1) - 0.5) * 2 * CX_RANGE).round
    py = ((row.to_f / (ROWS - 1) - 0.5) * 2 * CY_RANGE).round

    pixels << { x: px, y: py, color: color_idx }
  end
end

puts "Generated #{pixels.size} pixels"

# ── Build block chain ─────────────────────────────────────────────────────────
# Flatten into a list: setup, then per-pixel [penup, setpos, setcolor, pendown, forward]
all_blocks = []
all_blocks << setwidth_block(5)

prev_color = nil
pixels.each do |p|
  all_blocks << penup_block
  all_blocks << setpos_block(p[:x], p[:y])
  all_blocks << setcolor_block(p[:color]) if p[:color] != prev_color
  all_blocks << pendown_block
  all_blocks << forward_block(5)
  prev_color = p[:color]
end

# Chain by setting next pointers
all_blocks.each_cons(2) { |a, b| a["next"] = { "block" => b } }

hat = {
  "type" => "controls_start", "id" => uid,
  "x" => 20, "y" => 20,
  "next" => { "block" => all_blocks.first }
}

data = JSON.generate({ "blocks" => { "languageVersion" => 0, "blocks" => [hat] } }, max_nesting: false)
puts "JSON size: #{data.bytesize / 1024}KB, blocks: #{all_blocks.size}"

# ── Create project ────────────────────────────────────────────────────────────
user = User.find_by!(email: "test@hardfun.ai")

Project.where(user: user, title: "Conjunto de Mandelbrot").destroy_all

title = "Conjunto de Mandelbrot"
desc  = "O conjunto de Mandelbrot desenhado pixel a pixel com a tartaruga. Para cada ponto c no plano complexo, itera z = z² + c e colore pelo número de iterações até escapar — preto = pertence ao conjunto. Resolução #{COLS}×#{ROWS}, #{MAX_ITER} iterações máximas."
now   = Time.current

conn = ActiveRecord::Base.connection
result = conn.execute(<<~SQL)
  INSERT INTO projects (user_id, title, description, data, visibility, published_at, created_at, updated_at,
                        loves_count, remixes_count, comments_count, views_count)
  VALUES (#{user.id}, #{conn.quote(title)}, #{conn.quote(desc)}, #{conn.quote(data)},
          1, NOW(), NOW(), NOW(), 0, 0, 0, 0)
  RETURNING id
SQL
id = result.first["id"]
puts "Created: #{title} (id=#{id}) → #{user.username}"
