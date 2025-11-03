
const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

// === Conexão com banco ===
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// === Middlewares ===
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static("public"));

// === Middleware de autenticação ===
function protegerRota(req, res, next) {
  if (req.cookies.usuario) next();
  else res.redirect("/login");
}

// === Rotas ===

// Página de login
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public/login.html"));
});

// Login
app.post("/login", async (req, res) => {
  const { usuario, senha } = req.body;

  const result = await pool.query(
    "SELECT * FROM usuarios WHERE usuario = $1 AND senha = $2",
    [usuario, senha]
  );

  if (result.rows.length > 0) {
    res.cookie("usuario", usuario, { httpOnly: true, sameSite: "lax" });
    res.json({ sucesso: true });
  } else {
    res
      .status(401)
      .json({ sucesso: false, mensagem: "Usuário ou senha incorretos" });
  }
});

// Logout
app.get("/logout", (req, res) => {
  res.clearCookie("usuario");
  res.redirect("/login");
});

// Página principal
app.get("/", protegerRota, (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// Obter números
app.get("/numeros", protegerRota, async (req, res) => {
  const result = await pool.query(
    "SELECT valor FROM numeros ORDER BY valor ASC"
  );
  const numeros = result.rows.map((row) => row.valor);
  res.json(numeros);
});

// Selecionar número
app.post("/selecionar", protegerRota, async (req, res) => {
  const { numero } = req.body;

  try {
    await pool.query(
      "INSERT INTO numeros(valor) VALUES($1) ON CONFLICT DO NOTHING",
      [numero]
    );
    res.json({ sucesso: true });
  } catch {
    res.status(400).json({ sucesso: false, mensagem: "Erro ao salvar número" });
  }
});

// Resetar
app.post("/resetar", protegerRota, async (req, res) => {
  await pool.query("DELETE FROM numeros");
  res.json({ sucesso: true });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});
