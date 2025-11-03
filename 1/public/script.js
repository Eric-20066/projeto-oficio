const total = 100;
const container = document.getElementById("container");
const resetBtn = document.getElementById("resetBtn");
const voltarBtn = document.getElementById("voltarBtn");
const popup = document.getElementById("popup");
const popupText = document.getElementById("popup-text");
const popupButtons = document.getElementById("popup-buttons");

let selecionados = [];
let ultimoSelecionado = -1;

async function carregarNumeros() {
  try {
    const res = await fetch("/numeros");
    if (res.redirected) return (window.location.href = res.url);
    if (!res.ok) throw new Error("Falha na requisição");
    selecionados = await res.json();
    ultimoSelecionado = selecionados.length ? selecionados[selecionados.length - 1] : -1;
    criarNumeros();
  } catch (err) {
    mostrarPopup("Erro ao carregar números.", false);
  }
}

function criarNumeros() {
  container.innerHTML = "";
  for (let i = 0; i <= total; i++) {
    const div = document.createElement("div");
    div.textContent = i;
    div.classList.add("numero");
    if (selecionados.includes(i)) {
      div.classList.add("selecionado");
    } else {
      div.classList.add("disponivel");
      div.addEventListener("click", () => selecionar(i));
    }
    container.appendChild(div);
  }
}

async function selecionar(num) {
  if (num !== ultimoSelecionado + 1 && ultimoSelecionado !== -1) {
    return mostrarPopup("Selecione o próximo número em ordem!", false);
  }
  try {
    const res = await fetch("/selecionar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numero: num }),
    });
    const data = await res.json();
    if (data.sucesso) {
      selecionados.push(num);
      ultimoSelecionado = num;
      criarNumeros();
    } else mostrarPopup(data.mensagem, false);
  } catch {
    mostrarPopup("Erro ao conectar ao servidor.", false);
  }
}

async function resetar() {
  mostrarPopup("Deseja realmente resetar todos os números?", true, async () => {
    const res = await fetch("/resetar", { method: "POST" });
    const data = await res.json();
    if (data.sucesso) {
      selecionados = [];
      ultimoSelecionado = -1;
      criarNumeros();
    } else mostrarPopup("Erro ao resetar.", false);
  });
}

async function voltarAnterior() {
  if (selecionados.length === 0)
    return mostrarPopup("Nenhum número para voltar.", false);

  mostrarPopup("Remover o último número selecionado?", true, async () => {
    selecionados.pop();
    ultimoSelecionado = selecionados.length ? selecionados[selecionados.length - 1] : -1;

    await fetch("/resetar", { method: "POST" });
    for (let num of selecionados) {
      await fetch("/selecionar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero: num }),
      });
    }
    criarNumeros();
  });
}

function mostrarPopup(msg, confirmacao = false, onConfirm = null) {
  popupText.textContent = msg;
  popupButtons.innerHTML = "";
  if (confirmacao) {
    const sim = document.createElement("button");
    sim.textContent = "Sim";
    sim.onclick = () => {
      popup.style.display = "none";
      onConfirm && onConfirm();
    };
    const nao = document.createElement("button");
    nao.textContent = "Cancelar";
    nao.onclick = () => (popup.style.display = "none");
    popupButtons.append(sim, nao);
  } else {
    const ok = document.createElement("button");
    ok.textContent = "OK";
    ok.onclick = () => (popup.style.display = "none");
    popupButtons.append(ok);
  }
  popup.style.display = "flex";
}

resetBtn.addEventListener("click", resetar);
voltarBtn.addEventListener("click", voltarAnterior);
carregarNumeros();
