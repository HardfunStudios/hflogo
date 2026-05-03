# Demo seed: 5 test users + 25 random projects + 5 complex projects for existing user
# Run: docker compose exec app bin/rails runner db/seeds_demo.rb

# ── Block builder helpers ─────────────────────────────────────────────────────
# Block types verified against TurtleBlocks.js:
#   controls_start, turtle_forward (input: "steps"), turtle_right (field: "degrees"),
#   turtle_left (field: "degrees"), pen_setpenup, pen_setpendown,
#   pen_setpencolor (input: "color"), pen_setpensize (input: "width"),
#   pen_colornumber (fields: SWATCH, NUM), controls_repeat_ext (inputs: TIMES, DO)

def id; SecureRandom.hex(4); end

def num_shadow(n)
  { "type" => "math_number", "id" => id, "fields" => { "NUM" => n } }
end

def forward(steps)
  { "type" => "turtle_forward", "id" => id,
    "inputs" => { "steps" => { "shadow" => num_shadow(steps) } } }
end

def right(deg)
  { "type" => "turtle_right", "id" => id, "fields" => { "degrees" => deg.to_s } }
end

def left(deg)
  { "type" => "turtle_left", "id" => id, "fields" => { "degrees" => deg.abs.to_s } }
end

def turn(deg)
  deg >= 0 ? right(deg) : left(-deg)
end

def penup
  { "type" => "pen_setpenup", "id" => id }
end

def pendown
  { "type" => "pen_setpendown", "id" => id }
end

COLOR_HEX = [
  "#000000","#3e999f","#9b59b6","#2ecc71","#e74c3c","#e67e22","#f1c40f","#ffffff",
  "#1abc9c","#2980b9","#8e44ad","#27ae60","#c0392b","#d35400","#f39c12","#95a5a6"
]

def setcolor(idx)
  hex = COLOR_HEX[idx % COLOR_HEX.size]
  { "type" => "pen_setpencolor", "id" => id,
    "inputs" => { "color" => { "block" => {
      "type" => "pen_colornumber", "id" => id,
      "fields" => { "SWATCH" => hex, "NUM" => idx }
    } } } }
end

def setwidth(w)
  { "type" => "pen_setpensize", "id" => id,
    "inputs" => { "size" => { "shadow" => num_shadow(w) } } }
end

def repeat(times, *body)
  { "type" => "controls_repeat_ext", "id" => id,
    "inputs" => {
      "TIMES" => { "shadow" => num_shadow(times) },
      "DO"    => { "block" => chain(*body) }
    } }
end

# Chain blocks by setting next pointers; returns head
def chain(*blocks)
  blocks = blocks.flatten.compact
  blocks.each_cons(2) { |a, b| a["next"] = { "block" => b } }
  blocks.first
end

def hat(*body)
  h = { "type" => "controls_start", "id" => id, "x" => 30, "y" => 30 }
  first = chain(*body)
  h["next"] = { "block" => first } if first
  h
end

def project_data(*body)
  { "blocks" => { "languageVersion" => 0, "blocks" => [hat(*body)] } }.to_json
end

# ── Clean up previous demo data ───────────────────────────────────────────────
demo_emails = %w[alice@demo.test bruno@demo.test carla@demo.test diogo@demo.test eva@demo.test]
User.where(email: demo_emails).destroy_all

main_user = User.find_by!(email: "test@hardfun.ai")
main_user.projects.destroy_all

# ── Create test users ─────────────────────────────────────────────────────────
users_data = [
  { username: "alice_logo",    display_name: "Alice Turing",    email: "alice@demo.test"  },
  { username: "bruno_turtle",  display_name: "Bruno Papert",    email: "bruno@demo.test"  },
  { username: "carla_geo",     display_name: "Carla Geometria", email: "carla@demo.test"  },
  { username: "diogo_fractal", display_name: "Diogo Fractais",  email: "diogo@demo.test"  },
  { username: "eva_espiral",   display_name: "Eva Espiral",     email: "eva@demo.test"    },
]

test_users = users_data.map do |a|
  u = User.create!(
    email: a[:email], username: a[:username], display_name: a[:display_name],
    password: "Demo1234!", confirmed_at: Time.current,
    date_of_birth: 20.years.ago.to_date, locale: "pt-BR"
  )
  puts "User: #{u.username}"
  u
end

# ── 25 random projects ────────────────────────────────────────────────────────
simple = [
  ["Quadrado simples",       "Quatro lados iguais com viradas de 90°.",
    -> { project_data(repeat(4, forward(100), right(90))) }],

  ["Triângulo equilátero",   "Três lados com ângulo exterior de 120°.",
    -> { project_data(repeat(3, forward(120), right(120))) }],

  ["Pentágono",              "Cinco lados, ângulo exterior 72°.",
    -> { project_data(repeat(5, forward(80), right(72))) }],

  ["Hexágono",               "Seis lados, ângulo exterior 60°.",
    -> { project_data(repeat(6, forward(70), right(60))) }],

  ["Estrela de 5 pontas",    "Clássica estrela pentagonal com viradas de 144°.",
    -> { project_data(repeat(5, forward(150), right(144))) }],

  ["Estrela de 6 pontas",    "Dois triângulos sobrepostos.",
    -> { project_data(repeat(6, forward(100), right(60), forward(100), right(120))) }],

  ["Octógono",               "Oito lados, ângulo exterior 45°.",
    -> { project_data(repeat(8, forward(60), right(45))) }],

  ["Linha reta",             "A tartaruga anda 200 passos em linha reta.",
    -> { project_data(forward(200)) }],

  ["Zigue-zague",            "Movimento em zigue-zague alternando 45° e -90°.",
    -> { project_data(repeat(6, forward(40), right(45), forward(40), left(90), forward(40), right(45))) }],

  ["Escada",                 "Padrão de escada subindo.",
    -> { project_data(repeat(8, forward(30), left(90), forward(30), right(90))) }],

  ["Quadrado colorido",      "Quadrado desenhado com caneta vermelha.",
    -> { project_data(setcolor(4), setwidth(3), repeat(4, forward(100), right(90))) }],

  ["Triângulo azul",         "Triângulo com caneta azul grossa.",
    -> { project_data(setcolor(1), setwidth(4), repeat(3, forward(120), right(120))) }],

  ["Decágono",               "Dez lados, ângulo exterior 36°.",
    -> { project_data(repeat(10, forward(50), right(36))) }],

  ["Diamante",               "Losango com lados de 80.",
    -> { project_data(forward(80), right(60), forward(80), right(120), forward(80), right(60), forward(80)) }],

  ["Espiral quadrada",       "Espiral quadrada com 20 passos de comprimento crescente.",
    -> { project_data(repeat(20, forward(20), right(89))) }],

  ["Círculo aproximado",     "36 passos de 10° formam um círculo.",
    -> { project_data(repeat(36, forward(10), right(10))) }],

  ["Arco",                   "Semicírculo de 18 passos.",
    -> { project_data(repeat(18, forward(8), right(10))) }],

  ["Escada colorida",        "Degraus alternando azul e vermelho.",
    -> { project_data(repeat(6, setcolor(1), forward(30), left(90), setcolor(4), forward(30), right(90))) }],

  ["Espiral triangular",     "Triângulos em espiral — ângulo ligeiramente maior que 120°.",
    -> { project_data(repeat(24, forward(30), right(121))) }],

  ["Retângulo",              "Retângulo 150 × 80.",
    -> { project_data(forward(150), right(90), forward(80), right(90), forward(150), right(90), forward(80), right(90)) }],

  ["Polígono de 12 lados",   "Dodecágono com ângulo exterior 30°.",
    -> { project_data(repeat(12, forward(40), right(30))) }],

  ["Cruz",                   "Forma de cruz com quatro braços.",
    -> { project_data(repeat(4, forward(60), right(90), forward(20), right(90), forward(60), left(90), forward(20), right(90))) }],

  ["Dois quadrados",         "Dois quadrados com espaço entre eles.",
    -> { project_data(
      repeat(4, forward(60), right(90)),
      penup, forward(80), pendown,
      repeat(4, forward(60), right(90))
    ) }],

  ["Estrela de 8 pontas",    "Octograma com viradas de 135°.",
    -> { project_data(repeat(8, forward(100), right(135))) }],

  ["Espiral hexagonal",      "Espiral baseada em hexágonos.",
    -> { project_data(repeat(18, forward(20), right(61))) }],
]

simple.each_with_index do |(title, desc, data_fn), i|
  owner = test_users[i % test_users.size]
  p = owner.projects.create!(
    title: title, description: desc,
    data: data_fn.call,
    visibility: :published,
    published_at: rand(60).days.ago
  )
  puts "  #{p.title} → #{owner.username}"
end

# ── 5 complex projects for main user (Turtle Geometry inspired) ───────────────
complex = [
  ["Polígonos aninhados",
   "Cinco polígonos regulares concêntricos com cores diferentes — explora como o ângulo exterior de um polígono regular é 360/n (Turtle Geometry, cap. 1).",
   -> { project_data(
     setcolor(9),  repeat(4, forward(90),  right(90)),
     setcolor(2),  repeat(5, forward(75),  right(72)),
     setcolor(3),  repeat(6, forward(65),  right(60)),
     setcolor(4),  repeat(7, forward(55),  right(51)),
     setcolor(5),  repeat(8, forward(50),  right(45))
   ) }],

  ["Espiral poligonal crescente",
   "Lados que crescem 8 unidades a cada passo — espiral que nunca se fecha, demonstrando divergência (Turtle Geometry, cap. 1).",
   -> { project_data(
     *( (1..16).map { |i| [forward(i * 8), right(90)] }.flatten )
   ) }],

  ["Roseta de pentágonos",
   "Um pentágono girado 36 vezes em passos de 10° — demonstra que simetria rotacional total = 360° produz uma roseta (Turtle Geometry, cap. 4).",
   -> { project_data(
     setcolor(1), setwidth(1),
     repeat(36,
       repeat(5, forward(50), right(72)),
       right(10)
     )
   ) }],

  ["Curva do dragão nível 4",
   "16 segmentos com a sequência de dobras L/R da curva do dragão — cada nível dobra a sequência anterior, gerando um fractal auto-similar (Turtle Geometry, fractais).",
   -> {
     seq = [90,-90,-90,90,90,-90,90,90,90,-90,-90,90,-90,90,90,-90]
     blocks = seq.flat_map { |deg| [forward(20), turn(deg)] }
     project_data(setcolor(2), setwidth(2), *blocks)
   }],

  ["Floco de neve de Koch nível 2",
   "Cada lado do triângulo é subdividido com a regra F→F+F--F+F, produzindo a curva de Koch — explora auto-similaridade e comprimento infinito (Turtle Geometry, cap. 5).",
   -> {
     # Koch edge level-2: move, -60, move, +120, move, -60, move
     def koch_edge(size)
       [forward(size), left(60), forward(size), right(120), forward(size), left(60), forward(size)]
     end
     project_data(
       setcolor(9), setwidth(1),
       *koch_edge(15), right(120),
       *koch_edge(15), right(120),
       *koch_edge(15), right(120)
     )
   }],
]

complex.each do |(title, desc, data_fn)|
  data = data_fn.call
  p = main_user.projects.create!(
    title: title, description: desc,
    data: data,
    visibility: :published,
    published_at: rand(30).days.ago
  )
  puts "  Complex: #{p.title} → #{main_user.username}"
end

puts "\nDone! #{Project.count} projects, #{User.count} users."
