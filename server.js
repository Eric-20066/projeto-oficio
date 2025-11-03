const express = require("express");
const fs = require("fs");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

const app = express();

// ✅ Porta correta para Render
const PORT = process.env.PORT || 3000;

// ✅ Arquivo de dados (na raiz)
const ARQUIVO = path.join(__dirname, "dados.json");

// === Middlewares ===
app.use(bodyParser.json());
app.use(cookieParser());

// ✅ Servir arquivos diretamente da raiz (já que não existe pasta public)
app.use(express.static(__dirname));

// === Funções auxiliares ===
function lerDados() {
  try {
    if (!fs.existsSync(ARQUIVO)) {
      return { usuarios: [], numerosSelecionados: [] };
    }
    return JSON.parse(fs.readFileSync(ARQUIVO, "utf8"));
  } catch (err) {
    console.error("Erro ao ler dados:", err);
    return { usuarios: [], numerosSelecionados: [] };
  }
}

function salvarDados(dados) {
  try {
    fs.writeFileSync(ARQUIVO, JSON.stringify(dados, null, 2));
  } catch (err) {
    console.error("Erro ao salvar dados:", err);
  }
}

// === Middleware de autenticação ===
function protegerRota(req, res, next) {
  if (req.cookies.usuario) next();
  else res.redirect("/login");
}

// === Rotas ===

// ✅ Página de login (ajustada)
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

// ✅ Login
app.post("/login", (req, res) => {
  const { usuario, senha } = req.body;
  const dados = lerDados();

  const user = dados.usuarios.find(
    (u) => u.usuario === usuario && u.senha === senha
  );

  if (user) {
    res.cookie("usuario", usuario, { httpOnly: true, sameSite: "lax" });
    res.json({ sucesso: true });
  } else {
    res.status(401).json({
      sucesso: false,
      mensagem: "Usuário ou senha incorretos",
    });
  }
});

// ✅ Logout
app.get("/logout", (req, res) => {
  res.clearCookie("usuario");
  res.redirect("/login");
});

// ✅ Página principal (ajustada)
app.get("/", protegerRota, (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ✅ Obter números
app.get("/numeros", protegerRota, (req, res) => {
  const dados = lerDados();
  res.json(dados.numerosSelecionados);
});

// ✅ Selecionar número
app.post("/selecionar", protegerRota, (req, res) => {
  const { numero } = req.body;
  const dados = lerDados();

  if (typeof numero !== "number" || isNaN(numero)) {
    return res.status(400).json({ sucesso: false, mensagem: "Número inválido" });
  }

  if (!dados.numerosSelecionados.includes(numero)) {
    dados.numerosSelecionados.push(numero);
    salvarDados(dados);
    res.json({ sucesso: true, numeros: dados.numerosSelecionados });
  } else {
    res.json({ sucesso: false, mensagem: "Número já selecionado" });
  }
});

// ✅ Resetar números
app.post("/resetar", protegerRota, (req, res) => {
  const dados = lerDados();
  dados.numerosSelecionados = [];
  salvarDados(dados);
  res.json({ sucesso: true });
});

// === Inicialização ===
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});
