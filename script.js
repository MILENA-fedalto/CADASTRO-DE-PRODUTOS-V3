

// Array global que armazena os produtos cadastrados
const listaDeProdutos = [];

// Estado auxiliar: null indica "Modo Cadastro", número indica "Modo Edição"
let indiceEdicao = null;


class Produto {

    #preco;
    #quantidade;

    constructor(nome, preco, quantidade) {

        // Validação do nome
        if (!nome || nome.trim() === "") {
            throw new Error("O nome do produto não pode estar vazio.");
        }

        // Validação do preço
        if (isNaN(preco) || preco <= 0) {
            throw new Error("O preço deve ser maior que zero.");
        }

        // Validação da quantidade
        if (isNaN(quantidade) || quantidade <= 0) {
            throw new Error("A quantidade deve ser maior que zero.");
        }

        // Atribuição das propriedades
        this.nome = nome.trim();
        this.#preco = preco;
        this.#quantidade = quantidade;
    }

    // Getters
    get preco() {
        return this.#preco;
    }

    get quantidade() {
        return this.#quantidade;
    }

    // Calcula o subtotal
    get subtotal() {
        return this.#preco * this.#quantidade;
    }
}


// Salva os produtos no navegador
function salvarProdutos() {

    const produtosParaSalvar = listaDeProdutos.map(produto => {
        return {
            nome: produto.nome,
            preco: produto.preco,
            quantidade: produto.quantidade
        };
    });

    localStorage.setItem(
        "produtos",
        JSON.stringify(produtosParaSalvar)
    );
}


// Recupera os produtos salvos
function carregarProdutos() {

    const dadosSalvos = localStorage.getItem("produtos");

    if (!dadosSalvos) {
        renderizarTabela();
        return;
    }

    try {

        const produtosSalvos = JSON.parse(dadosSalvos);

        if (!Array.isArray(produtosSalvos)) {
            throw new Error("Dados salvos inválidos.");
        }

        listaDeProdutos.length = 0;

        produtosSalvos.forEach(produto => {

            const produtoRecuperado = new Produto(
                produto.nome,
                produto.preco,
                produto.quantidade
            );

            listaDeProdutos.push(produtoRecuperado);
        });

    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        alert("Não foi possível recuperar os produtos salvos.");
    }

    renderizarTabela();
}


const form = document.getElementById("produto-form");

const tabelaCorpo = document.querySelector("#tabela-produtos tbody");

const botaoSubmit = document.querySelector(".btn-primary");


function atualizarTotalEstoque() {

    const valorTotal = listaDeProdutos.reduce((acumulador, produto) => {
        return acumulador + produto.subtotal;
    }, 0);

    const totalFormatado = valorTotal.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

    document.getElementById("total-estoque").innerText =
        `Total em Estoque: ${totalFormatado}`;
}

function renderizarTabela() {

    tabelaCorpo.innerHTML = "";

    listaDeProdutos.forEach((produto, index) => {

        const linha = document.createElement("tr");

        linha.innerHTML = `
            <td></td>

            <td>
                ${produto.preco.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                })}
            </td>

            <td>${produto.quantidade}</td>

            <td>
                ${produto.subtotal.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                })}
            </td>

            <td>
                <button class="btn-editar"
                    onclick="prepararEdicao(${index})">
                    Editar
                </button>

                <button class="btn-remover"
                    onclick="removerProduto(${index})">
                    Remover
                </button>
            </td>
        `;

        linha.querySelector("td").textContent = produto.nome;

        tabelaCorpo.appendChild(linha);
    });

    atualizarTotalEstoque();
}

function removerProduto(index) {

    listaDeProdutos.splice(index, 1);

    // Ajusta o estado de edição
    if (indiceEdicao !== null) {

        if (indiceEdicao === index) {
            cancelarEdicao();

        } else if (index < indiceEdicao) {
            indiceEdicao--;
        }
    }

    salvarProdutos();

    renderizarTabela();
}


document.getElementById("limpar-tabela").addEventListener("click", () => {

    const confirmar = confirm(
        "Tem certeza que deseja remover todos os produtos?"
    );

    if (!confirmar) {
        return;
    }

    listaDeProdutos.length = 0;

    cancelarEdicao();

    salvarProdutos();

    renderizarTabela();
});

// Função solicitada no PDF
function prepararEdicao(index) {

    const produto = listaDeProdutos[index];

    if (!produto) {
        alert("Produto não encontrado.");
        return;
    }

    // 1. Preenche os campos do formulário com os dados existentes
    document.getElementById("nome").value = produto.nome;
    document.getElementById("preco").value = produto.preco;
    document.getElementById("quantidade").value = produto.quantidade;

    // 2. Transfere o estado para Modo Edição
    indiceEdicao = index;

    // 3. Atualiza o texto do botão
    document.querySelector(".btn-primary").textContent = "Salvar Alterações";

    // Leva o usuário até o formulário
    form.scrollIntoView({
        behavior: "smooth"
    });
}

function cancelarEdicao() {

    indiceEdicao = null;

    form.reset();

    document.querySelector(".btn-primary").textContent = "Adicionar Produto";
}

form.addEventListener("submit", function (event) {

    event.preventDefault();

    // Captura os valores conforme o PDF
    const nome = document.getElementById("nome").value.trim();

    const precoTexto = document.getElementById("preco").value.trim();
    const quantidadeTexto = document.getElementById("quantidade").value.trim();

    const preco = parseFloat(precoTexto);
    const quantidade = parseInt(quantidadeTexto, 10);

    if (!nome) {
        alert("Por favor, informe um nome válido para o produto.");
        return;
    }

    if (
        precoTexto === "" ||
        quantidadeTexto === "" ||
        isNaN(preco) ||
        preco <= 0 ||
        isNaN(quantidade) ||
        quantidade <= 0 ||
        !Number.isFinite(preco) ||
        !Number.isInteger(Number(quantidadeTexto))
    ) {
        alert("O preço e a quantidade devem ser valores numéricos maiores que zero.");
        return;
    }

    try {

        // Cria o objeto Produto
        const novoProduto = new Produto(nome, preco, quantidade);

        // MODO INCLUSÃO
        if (indiceEdicao === null) {

            listaDeProdutos.push(novoProduto);

        } else {

            // MODO EDIÇÃO
            listaDeProdutos[indiceEdicao] = novoProduto;

        }

        // Salva as alterações no navegador
        salvarProdutos();

        // Atualiza a tabela
        renderizarTabela();

        // Restaura o estado após salvar
        indiceEdicao = null;

        // Limpa o formulário
        form.reset();

        // Restaura o texto do botão
        document.querySelector(".btn-primary").textContent = "Adicionar Produto";

    } catch (error) {

        alert(error.message);

    }

});

carregarProdutos();