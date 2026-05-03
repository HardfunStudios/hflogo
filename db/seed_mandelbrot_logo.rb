# Mandelbrot recursivo estilo Logo puro
# - Todos os loops são recursão (sem repeat/while)
# - Procedures com parâmetros têm escopo local correto
# - O inteiro algoritmo cabe em ~90 blocos
#
# Estrutura:
#   mandel(cr, ci, zr, zi, n)     → retorna iteração (recursiva)
#   desenha_coluna(col, py, cy)   → varre colunas recursivamente
#   desenha_linha(row)            → varre linhas recursivamente
#   Início → desenha_linha(0)
#
# Run: docker compose exec app bin/rails runner db/seed_mandelbrot_logo.rb

require 'json'

# ── IDs fixos para variáveis/parâmetros ──────────────────────────────────────
P = {
  cr:  "pid_cr",   # param mandel
  ci:  "pid_ci",
  zr:  "pid_zr",
  zi:  "pid_zi",
  n:   "pid_n",
  col: "pid_col",  # param desenha_coluna
  py:  "pid_py",
  cy:  "pid_cy",
  row: "pid_row",  # param desenha_linha
  cx:  "vid_cx",   # variável local (global, sobrescrita a cada chamada)
  px:  "vid_px",
  cor: "vid_cor",
}

def uid; SecureRandom.hex(4); end
def num(v)  = { "type" => "math_number",   "id" => uid, "fields" => { "NUM" => v } }
def var(name) = { "type" => "variables_get", "id" => uid,
                  "fields" => { "VAR" => { "id" => P[name], "name" => name.to_s } } }
def setvar(name, val) = { "type" => "variables_set", "id" => uid,
                           "fields" => { "VAR" => { "id" => P[name], "name" => name.to_s } },
                           "inputs" => { "VALUE" => { "block" => val } } }

def arith(op, a, b)
  { "type" => "math_arithmetic", "id" => uid, "fields" => { "OP" => op },
    "inputs" => { "A" => { "shadow" => num(1), "block" => a },
                  "B" => { "shadow" => num(1), "block" => b } } }
end
def add(a,b)  = arith("ADD",      a, b)
def sub(a,b)  = arith("MINUS",    a, b)
def mul(a,b)  = arith("MULTIPLY", a, b)
def div(a,b)  = arith("DIVIDE",   a, b)

def cmp(op, a, b)
  { "type" => "logic_compare", "id" => uid, "fields" => { "OP" => op },
    "inputs" => { "A" => { "block" => a }, "B" => { "block" => b } } }
end
def logic_or(a, b)
  { "type" => "logic_operation", "id" => uid, "fields" => { "OP" => "OR" },
    "inputs" => { "A" => { "block" => a }, "B" => { "block" => b } } }
end

def if_block(cond, *body)
  blk = { "type" => "controls_if", "id" => uid,
           "inputs" => { "IF0" => { "block" => cond } } }
  first = chain(*body)
  blk["inputs"]["DO0"] = { "block" => first } if first
  blk
end

def stop_block = { "type" => "controls_stop", "id" => uid }

def penup    = { "type" => "pen_setpenup",   "id" => uid }
def pendown  = { "type" => "pen_setpendown", "id" => uid }
def setwidth(n) = { "type" => "pen_setpensize", "id" => uid,
                     "inputs" => { "size" => { "shadow" => num(n) } } }
def setpos(x, y) = { "type" => "turtle_setpos", "id" => uid,
                      "inputs" => { "x" => { "block" => x }, "y" => { "block" => y } } }
def setcolor(v) = { "type" => "pen_setpencolor", "id" => uid,
                     "inputs" => { "color" => { "block" => v } } }
def forward(n) = { "type" => "turtle_forward", "id" => uid,
                    "inputs" => { "steps" => { "shadow" => num(n) } } }

# procedures_ifreturn — early return with value
def if_return(cond, val)
  { "type" => "procedures_ifreturn", "id" => uid,
    "extraState" => "<mutation value=\"1\"/>",
    "inputs" => { "CONDITION" => { "block" => cond },
                  "VALUE"     => { "block" => val  } } }
end

# procedures_defreturn — define function that returns a value
def defreturn(name, params, stack_block, return_block)
  { "type" => "procedures_defreturn", "id" => uid, "x" => 20, "y" => 20,
    "fields" => { "NAME" => name },
    "extraState" => { "params" => params.map { |nm| { "name" => nm.to_s, "id" => P[nm] } } },
    "inputs" => { "STACK" => { "block" => stack_block },
                  "RETURN" => { "block" => return_block } } }
end

# procedures_defnoreturn — define void function
def defnoreturn(name, params, *body)
  first = chain(*body)
  b = { "type" => "procedures_defnoreturn", "id" => uid, "x" => 20, "y" => 20,
        "fields" => { "NAME" => name },
        "extraState" => { "params" => params.map { |nm| { "name" => nm.to_s, "id" => P[nm] } } } }
  b["inputs"] = { "STACK" => { "block" => first } } if first
  b
end

# call function that returns value
def callreturn(name, params, *args)
  b = { "type" => "procedures_callreturn", "id" => uid,
        "extraState" => { "name" => name,
                          "params" => params.map(&:to_s) } }
  args.each_with_index { |a, i| b["inputs"] ||= {}; b["inputs"]["ARG#{i}"] = { "block" => a } }
  b
end

# call void function
def callvoid(name, params, *args)
  b = { "type" => "procedures_callnoreturn", "id" => uid,
        "extraState" => { "name" => name,
                          "params" => params.map(&:to_s) } }
  args.each_with_index { |a, i| b["inputs"] ||= {}; b["inputs"]["ARG#{i}"] = { "block" => a } }
  b
end

# chain blocks via "next"
def chain(*blocks)
  blocks = blocks.flatten.compact
  return nil if blocks.empty?
  blocks.each_cons(2) { |a, b| a["next"] = { "block" => b } }
  blocks.first
end

# ── Constantes do Mandelbrot ──────────────────────────────────────────────────
COLS     = 32
ROWS     = 22
COLS_1   = COLS - 1  # 31
ROWS_1   = ROWS - 1  # 21
MX_RANGE = 3.0       # -2.2 a 0.8
MY_RANGE = 2.2       # -1.1 a 1.1
CX_SPAN  = 260.0     # largura canvas em unidades Logo
CY_SPAN  = 190.0     # altura canvas
PIXEL    = 8         # tamanho de cada pixel
MAX_ITER = 15

# ── Procedure 1: mandel(cr, ci, zr, zi, n) → Number ─────────────────────────
#
#   se (zr*zr + zi*zi >= 4) OU (n >= MAX_ITER): retorne n
#   retorne mandel(cr, ci, zr*zr - zi*zi + cr, 2*zr*zi + ci, n + 1)

mandel_params = [:cr, :ci, :zr, :zi, :n]

escape_cond = logic_or(
  cmp("GTE", add(mul(var(:zr), var(:zr)), mul(var(:zi), var(:zi))), num(4)),
  cmp("GTE", var(:n), num(MAX_ITER))
)

new_zr = add(sub(mul(var(:zr), var(:zr)), mul(var(:zi), var(:zi))), var(:cr))
new_zi = add(mul(mul(num(2), var(:zr)), var(:zi)), var(:ci))
n_plus = add(var(:n), num(1))

mandel_proc = defreturn("mandel", mandel_params,
  if_return(escape_cond, var(:n)),
  callreturn("mandel", mandel_params, var(:cr), var(:ci), new_zr, new_zi, n_plus)
)

# ── Procedure 2: desenha_coluna(col, py, cy) ──────────────────────────────────
#
#   se col >= COLS: pare
#   cx  = -2.2 + (col / COLS_1) * MX_RANGE
#   px  = (col / COLS_1 - 0.5) * CX_SPAN
#   cor = mandel(cx, cy, 0, 0, 0)
#   penup → setpos(px, py) → setcolor(cor) → pendown → frente(PIXEL)
#   desenha_coluna(col + 1, py, cy)

col_params = [:col, :py, :cy]

cx_expr  = add(num(-2.2), mul(div(var(:col), num(COLS_1)), num(MX_RANGE)))
px_expr  = mul(sub(div(var(:col), num(COLS_1)), num(0.5)), num(CX_SPAN))
cor_expr = callreturn("mandel", mandel_params, var(:cx), var(:cy), num(0), num(0), num(0))

col_proc = defnoreturn("desenha_coluna", col_params,
  if_block(cmp("GTE", var(:col), num(COLS)), stop_block),
  setvar(:cx, cx_expr),
  setvar(:px, px_expr),
  setvar(:cor, cor_expr),
  penup,
  setpos(var(:px), var(:py)),
  setcolor(var(:cor)),
  pendown,
  forward(PIXEL),
  callvoid("desenha_coluna", col_params, add(var(:col), num(1)), var(:py), var(:cy))
)

# ── Procedure 3: desenha_linha(row) ──────────────────────────────────────────
#
#   se row >= ROWS: pare
#   cy = -1.1 + (row / ROWS_1) * MY_RANGE
#   py = (row / ROWS_1 - 0.5) * CY_SPAN
#   desenha_coluna(0, py, cy)
#   desenha_linha(row + 1)

row_params = [:row]

cy_expr = add(num(-1.1), mul(div(var(:row), num(ROWS_1)), num(MY_RANGE)))
py_expr = mul(sub(div(var(:row), num(ROWS_1)), num(0.5)), num(CY_SPAN))

row_proc = defnoreturn("desenha_linha", row_params,
  if_block(cmp("GTE", var(:row), num(ROWS)), stop_block),
  setvar(:cy, cy_expr),
  setvar(:py, py_expr),
  callvoid("desenha_coluna", col_params, num(0), var(:py), var(:cy)),
  callvoid("desenha_linha",  row_params, add(var(:row), num(1)))
)

# ── Bloco principal ───────────────────────────────────────────────────────────
hat = { "type" => "controls_start", "id" => uid, "x" => 20, "y" => 600,
        "next" => { "block" => chain(
          setwidth(PIXEL),
          callvoid("desenha_linha", row_params, num(0))
        ) } }

# Posicionar procedures na tela
mandel_proc.merge!("x" => 380, "y" => 20)
col_proc.merge!(   "x" => 380, "y" => 280)
row_proc.merge!(   "x" => 380, "y" => 580)

all_vars = P.map { |name, vid| { "name" => name.to_s, "id" => vid } }

workspace = {
  "blocks"    => { "languageVersion" => 0, "blocks" => [mandel_proc, col_proc, row_proc, hat] },
  "variables" => all_vars
}

data = JSON.generate(workspace, max_nesting: false)
puts "JSON: #{data.bytesize / 1024}KB"

# ── Salvar projeto ────────────────────────────────────────────────────────────
user = User.find_by!(email: "juliano@hardfun.ai")
Project.where(user: user, title: "Mandelbrot Recursivo").destroy_all

conn   = ActiveRecord::Base.connection
result = conn.execute(<<~SQL)
  INSERT INTO projects (user_id, title, description, data, visibility, published_at,
                        created_at, updated_at, loves_count, remixes_count, comments_count, views_count)
  VALUES (#{user.id},
          'Mandelbrot Recursivo',
          'Conjunto de Mandelbrot em Logo puro: três procedures recursivas sem nenhum loop. mandel(cr,ci,zr,zi,n) itera z=z²+c recursivamente; desenha_coluna varre as colunas por recursão; desenha_linha varre as linhas por recursão — exatamente como se escreveria em Logo clássico.',
          #{conn.quote(data)},
          1, NOW(), NOW(), NOW(), 0, 0, 0, 0)
  RETURNING id
SQL
puts "Created id=#{result.first['id']}"
