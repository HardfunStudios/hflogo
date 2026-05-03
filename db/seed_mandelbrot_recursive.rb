# Mandelbrot recursivo para Juliano
# A iteração z = z²+c é expressa como uma procedure que chama a si mesma
# em vez de um loop while. Mesma imagem, algoritmo genuinamente recursivo.
# Run: docker compose exec app bin/rails runner db/seed_mandelbrot_recursive.rb

require 'json'

# ── Variable IDs (fixos para consistência) ────────────────────────────────────
VID = {
  zr:  "vid_zr",   # parte real de z
  zi:  "vid_zi",   # parte imaginária de z
  cr:  "vid_cr",   # parte real de c (coordenada x do pixel)
  ci:  "vid_ci",   # parte imaginária de c (coordenada y do pixel)
  ng:  "vid_ng",   # contador de iterações
  nzr: "vid_nzr",  # variável auxiliar para o novo zr
}

def uid; SecureRandom.hex(4); end
def num(n) = { "type" => "math_number", "id" => uid, "fields" => { "NUM" => n } }

def var_get(name)
  { "type" => "variables_get", "id" => uid,
    "fields" => { "VAR" => { "id" => VID[name], "name" => name.to_s } } }
end

def var_set(name, value_block)
  { "type" => "variables_set", "id" => uid,
    "fields" => { "VAR" => { "id" => VID[name], "name" => name.to_s } },
    "inputs" => { "VALUE" => { "block" => value_block } } }
end

def math_op(op, a, b)
  { "type" => "math_arithmetic", "id" => uid,
    "fields" => { "OP" => op },
    "inputs" => {
      "A" => { "shadow" => num(1), "block" => a },
      "B" => { "shadow" => num(1), "block" => b }
    } }
end

def add(a, b)   = math_op("ADD",      a, b)
def sub(a, b)   = math_op("MINUS",    a, b)
def mul(a, b)   = math_op("MULTIPLY", a, b)

def compare(op, a, b)
  { "type" => "logic_compare", "id" => uid,
    "fields" => { "OP" => op },
    "inputs" => {
      "A" => { "block" => a },
      "B" => { "block" => b }
    } }
end

def logic_and(a, b)
  { "type" => "logic_operation", "id" => uid,
    "fields" => { "OP" => "AND" },
    "inputs" => { "A" => { "block" => a }, "B" => { "block" => b } } }
end

def math_change(name, delta = 1)
  { "type" => "math_change", "id" => uid,
    "fields" => { "VAR" => { "id" => VID[name], "name" => name.to_s } },
    "inputs" => { "DELTA" => { "shadow" => num(delta) } } }
end

def controls_if(condition, *body)
  b = { "type" => "controls_if", "id" => uid,
        "inputs" => { "IF0" => { "block" => condition } } }
  chain = chain_blocks(*body)
  b["inputs"]["DO0"] = { "block" => chain } if chain
  b
end

def call_proc(name)
  { "type" => "procedures_callnoreturn", "id" => uid,
    "extraState" => { "name" => name } }
end

def chain_blocks(*blocks)
  blocks = blocks.flatten.compact
  return nil if blocks.empty?
  blocks.each_cons(2) { |a, b| a["next"] = { "block" => b } }
  blocks.first
end

def forward(n)
  { "type" => "turtle_forward", "id" => uid,
    "inputs" => { "steps" => { "shadow" => num(n) } } }
end

def setpos(x_block, y_block)
  { "type" => "turtle_setpos", "id" => uid,
    "inputs" => { "x" => { "block" => x_block }, "y" => { "block" => y_block } } }
end

COLOR_HEX = [
  "#000000","#00008b","#0000cd","#0000ff",
  "#0080ff","#00bfff","#00ffff","#00ff80",
  "#00cc00","#80ff00","#ffff00","#ffcc00",
  "#ff8000","#ff4000","#ff0000","#ff00ff"
]

def setcolor_from_var
  # Passa n_g diretamente como input de pen_setpencolor
  { "type" => "pen_setpencolor", "id" => uid,
    "inputs" => { "color" => { "block" => var_get(:ng) } } }
end

def penup  = { "type" => "pen_setpenup",   "id" => uid }
def pendown = { "type" => "pen_setpendown", "id" => uid }

def setwidth(n)
  { "type" => "pen_setpensize", "id" => uid,
    "inputs" => { "size" => { "shadow" => num(n) } } }
end

# ── Recursive procedure definition ───────────────────────────────────────────
#
#  aprenda iter_rec:
#    se (zr*zr + zi*zi < 4) E (ng < 15):
#      nzr = zr*zr - zi*zi + cr
#      zi  = 2 * zr * zi + ci
#      zr  = nzr
#      ng  = ng + 1
#      iter_rec  ← chamada recursiva
#
def iter_rec_procedure
  zr2     = mul(var_get(:zr), var_get(:zr))          # zr*zr
  zi2     = mul(var_get(:zi), var_get(:zi))          # zi*zi
  magnitude = add(zr2, zi2)                          # zr*zr + zi*zi

  # condição: magnitude < 4 AND ng < 15
  cond = logic_and(
    compare("LT", magnitude, num(4)),
    compare("LT", var_get(:ng), num(15))
  )

  # nzr = zr*zr - zi*zi + cr
  new_zr = add(sub(mul(var_get(:zr), var_get(:zr)), mul(var_get(:zi), var_get(:zi))), var_get(:cr))
  # zi = 2*zr*zi + ci
  new_zi = add(mul(mul(num(2), var_get(:zr)), var_get(:zi)), var_get(:ci))

  body = [
    var_set(:nzr, new_zr),
    var_set(:zi,  new_zi),
    var_set(:zr,  var_get(:nzr)),
    math_change(:ng, 1),
    call_proc("iter_rec")
  ]

  {
    "type"   => "procedures_defnoreturn",
    "id"     => uid,
    "x"      => 20, "y" => 20,
    "fields" => { "NAME" => "iter_rec" },
    "inputs" => { "STACK" => { "block" => controls_if(cond, *body) } }
  }
end

# ── Compute pixel grid (positions only, not colors — color computed at runtime) ─
COLS    = 32
ROWS    = 22
MX_MIN  = -2.2; MX_MAX = 0.8
MY_MIN  = -1.1; MY_MAX = 1.1
CX_RANGE = 130.0
CY_RANGE =  95.0

pixels = (0...ROWS).flat_map do |row|
  (0...COLS).map do |col|
    cr_val = MX_MIN + col.to_f / (COLS - 1) * (MX_MAX - MX_MIN)
    ci_val = MY_MIN + row.to_f / (ROWS - 1) * (MY_MAX - MY_MIN)
    px = ((col.to_f / (COLS - 1) - 0.5) * 2 * CX_RANGE).round
    py = ((row.to_f / (ROWS - 1) - 0.5) * 2 * CY_RANGE).round
    { px: px, py: py, cr: cr_val.round(6), ci: ci_val.round(6) }
  end
end

puts "Pixels: #{pixels.size}"

# ── Main body ─────────────────────────────────────────────────────────────────
#  setwidth(5)
#  para cada pixel:
#    set cr = cr_val
#    set ci = ci_val
#    set zr = 0
#    set zi = 0
#    set ng = 0
#    iter_rec          ← aqui acontece a recursão
#    penup
#    setpos(px, py)
#    setcolor(ng)
#    pendown
#    forward(5)

# Build pixel block list as individual JSON strings (shallow objects, no "next")
def block_to_json(b)
  # Remove any "next" key before serializing (we chain manually)
  JSON.generate(b.reject { |k, _| k == "next" }, max_nesting: false)
end

pixel_flat_blocks = pixels.flat_map do |p|
  [
    var_set(:cr, num(p[:cr])),
    var_set(:ci, num(p[:ci])),
    var_set(:zr, num(0)),
    var_set(:zi, num(0)),
    var_set(:ng, num(0)),
    call_proc("iter_rec"),
    penup,
    setpos(num(p[:px]), num(p[:py])),
    setcolor_from_var,
    pendown,
    forward(5)
  ]
end

all_flat = [setwidth(5)] + pixel_flat_blocks

puts "Total blocks in chain: #{all_flat.size}"

# Serialize each block to JSON without "next", then link from last to first
block_jsons = all_flat.map { |b| block_to_json(b) }

# Build chained JSON string from right to left (avoids deep Ruby hash nesting)
chain_json = block_jsons.last
(block_jsons.size - 2).downto(0) do |i|
  chain_json = block_jsons[i].chop + ',"next":{"block":' + chain_json + '}}'
end

hat_id = uid
hat_json = '{"type":"controls_start","id":"' + hat_id + '","x":20,"y":160,"next":{"block":' + chain_json + '}}'

proc_json  = JSON.generate(iter_rec_procedure, max_nesting: false)
vars_json  = JSON.generate(VID.map { |name, vid| { "name" => name.to_s, "id" => vid } })

data = '{"blocks":{"languageVersion":0,"blocks":[' + proc_json + ',' + hat_json + ']},"variables":' + vars_json + '}'
puts "JSON: #{data.bytesize / 1024}KB"

# ── Save project ──────────────────────────────────────────────────────────────
user = User.find_by!(email: "juliano@hardfun.ai")
Project.where(user: user, title: "Mandelbrot Recursivo").destroy_all

title = "Mandelbrot Recursivo"
desc  = "Conjunto de Mandelbrot usando recursão: a procedure `iter_rec` chama a si mesma até z escapar (|z|² ≥ 4) ou atingir 15 iterações — sem nenhum loop while. Mesma imagem que a versão iterativa, mas expresso como recursão pura."

conn   = ActiveRecord::Base.connection
result = conn.execute(<<~SQL)
  INSERT INTO projects (user_id, title, description, data, visibility, published_at, created_at, updated_at,
                        loves_count, remixes_count, comments_count, views_count)
  VALUES (#{user.id}, #{conn.quote(title)}, #{conn.quote(desc)}, #{conn.quote(data)},
          1, NOW(), NOW(), NOW(), 0, 0, 0, 0)
  RETURNING id
SQL
id = result.first["id"]
puts "Created: #{title} (id=#{id}) → #{user.username}"
