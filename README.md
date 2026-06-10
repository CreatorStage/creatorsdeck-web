# CreatorsDeck Studio - Frontend Web Application 🎨

Este diretório contém a interface web do **CreatorsDeck Studio** desenvolvida com **React**, **Vite** e **Tailwind CSS**. A interface oferece um dashboard no estilo YouTube Studio com funcionalidades para gerenciar roteiros em blocos, visualizar Moodboards de imagens/links e gerenciar ideias através de tabelas e quadros Kanban.

---

## 🛠️ Tecnologias Utilizadas

* **React 19**
* **Vite**: Bundler ultra-rápido para desenvolvimento frontend.
* **Tailwind CSS v4**: Framework utilitário para estilização fluida, responsiva e moderna.
* **Material Icons**: Conjunto de ícones oficiais.
* **Motion**: Animações fluidas de arrastar e soltar (Kanban) e transições.
* **SweetAlert2**: Alertas e popups customizados.

---

## 📂 Organização dos Diretórios

* `src/components`: Componentes reutilizáveis de interface (Kanban, Metas, Canais, etc).
  * `src/components/workspace`: Área de edição de roteiros de vídeos (Roteiro em blocos, teleprompter, gravação de voz).
  * `src/components/shared`: Componentes globais como o sidebar.
* `src/api.ts`: Abstração de chamadas HTTP para o back-end em Java.
* `src/types.ts`: Definição de tipos TypeScript compartilhados na aplicação.
* `src/index.css`: Ponto de entrada de estilos globais e variáveis de cores do tema (Modo Claro e Modo Escuro).

---

## ⚙️ Variáveis de Ambiente

Crie ou edite o arquivo `.env` ou `.env.local` na raiz do diretório `front` com as seguintes variáveis:

```env
# URL base para chamadas ao backend
VITE_API_URL=http://localhost:8080
PORT=3001
```

---

## 🚀 Como Executar

### 1. Requisitos
* Node.js (v20+ recomendado) instalado.
* NPM ou Yarn instalado.

### 2. Rodando Localmente
Instale as dependências e inicie o servidor de desenvolvimento:
```bash
npm install
npm run dev
```

A aplicação estará disponível em: **`http://localhost:3001`**

### 3. Rodando com Docker
Para construir e executar a imagem de produção da aplicação Web:
```bash
docker compose up -d --build frontend
```

---

## 💡 Recursos de Destaque no Frontend

1. **Roteirização Modular por Blocos:** Crie e ordene partes do seu roteiro (Gancho, Conteúdo, CTA, Conclusão) de forma visual.
2. **Gravação de Voz para Texto:** Transcreva suas ideias falando diretamente no microfone (requer navegador compatível como Google Chrome oficial).
3. **Quadro Kanban de Produção:** Monitore o progresso das suas ideias de conteúdo arrastando os cards através das etapas de produção.
4. **Moodboard de Thumbnails:** Visualize capas e links inspiradores capturados por você durante a navegação usando a extensão do Chrome.
