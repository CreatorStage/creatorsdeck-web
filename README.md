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

Crie ou edite o arquivo `.env` ou `.env.local` na raiz do diretório `creatorsdeck-web` com as seguintes variáveis:

```env
# URL base para chamadas ao backend
VITE_API_URL=http://localhost:8082
PORT=3001
```

---

## 🚀 Como Executar

### 1. Requisitos
* Node.js (v20+ recomendado) instalado.
* NPM ou Yarn instalado.

### 2. Rodando Localmente (Desenvolvimento Web)
Instale as dependências e inicie o servidor de desenvolvimento:
```bash
npm install
npm run dev
```

A aplicação estará disponível em: **`http://localhost:3001`**

### 3. Rodando Localmente com Electron (Versão Desktop)
Para rodar a aplicação em modo janela de desktop usando o Electron:
```bash
npm run electron-dev
```

### 4. Empacotando Executável para Windows/macOS/Linux
Para gerar instaladores standalone autônomos (ex: `.exe` para Windows):
```bash
npm run build-exe
```
Os arquivos resultantes serão salvos na pasta local `release/`.

### 5. Rodando com Docker
Para construir e executar a imagem de produção da aplicação Web:
```bash
docker compose up -d --build frontend
```

---

## 💡 Recursos de Destaque no Frontend

1. **Roteirização Modular por Blocos:** Crie e ordene partes do seu roteiro (Gancho, Conteúdo, CTA, Conclusão) de forma visual.
2. **Transcrição de Voz Local Offline (Whisper Web):** Grave áudios e transcreva-os diretamente no seu computador usando o modelo Whisper rodando offline via Web Assembly no navegador.
3. **Calendário Interativo de Planejamento:** Organize e visualize os prazos de publicação de suas ideias de conteúdo diretamente em uma agenda de calendário mensal.
4. **Links de Canais Rápidos na Header:** Visualize o nome do seu canal ativo na barra superior da plataforma e abra a URL oficial do canal no YouTube com apenas um clique.
5. **Quadro Kanban de Produção:** Monitore o progresso das suas ideias de conteúdo arrastando os cards através das etapas de produção.
6. **Moodboard de Thumbnails:** Visualize capas e links inspiradores capturados por você durante a navegação usando a extensão do Chrome.

