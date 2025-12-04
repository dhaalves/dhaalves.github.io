# Rodrigo Embalagens

Este projeto é uma aplicação web para a loja **Rodrigo Embalagens**, desenvolvida com React, Vite, Tailwind CSS e Firebase. A aplicação funciona como uma vitrine virtual para clientes e possui um painel administrativo para gerenciamento de produtos.

## Funcionalidades

### 🛒 Para Clientes (Vitrine)
*   **Visualização de Produtos:** Lista de produtos com imagens, títulos, categorias e descrições.
*   **Busca em Tempo Real:** Barra de pesquisa para filtrar produtos por nome, categoria ou descrição.
*   **Exibição de Preços:** Visualização do preço do produto (quando visível) ou botão "Consultar Preço" para itens sob consulta.
*   **Detalhes:** Badges de categoria e layout responsivo adaptado para dispositivos móveis e desktops.

### 🔐 Para Administradores (Painel Admin)
*   **Autenticação Restrita:** Tela de login para acesso à área administrativa (Credenciais de teste: `admin` / `admin`).
*   **Dashboard de Gerenciamento:** Visão geral dos produtos cadastrados.
*   **Cadastro de Produtos:**
    *   Upload de imagens (com pré-visualização e validação de tamanho < 800KB).
    *   Campos para Título, Categoria, Preço e Descrição.
    *   **Controle de Visibilidade de Preço:** Opção para ocultar o preço na vitrine ("Sob Consulta").
*   **Listagem e Edição:** Tabela com todos os produtos, permitindo visualização rápida de status.
*   **Exclusão:** Funcionalidade para remover produtos do banco de dados (Firestore).

## Tecnologias Utilizadas

*   **Frontend:** React.js
*   **Build Tool:** Vite
*   **Estilização:** Tailwind CSS, Lucide React (Ícones)
*   **Backend / BaaS:** Firebase (Authentication, Firestore Database)
*   **Deploy:** GitHub Pages

## Instalação e Execução

1.  Instale as dependências:
    ```bash
    npm install
    ```
2.  Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```
3.  Para gerar a build de produção (GitHub Pages):
    ```bash
    npm run build
    ```
