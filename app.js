import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import {
  getDownloadURL,
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";

const STORAGE_KEY = "uftm-mobile-web-ui-v2";
const navItems = [
  { id: "today", label: "Hoje" },
  { id: "week", label: "Grade" },
  { id: "menu", label: "RU" },
  { id: "sca", label: "SCA" },
];

const appElement = document.getElementById("app");
const uiState = loadUiState();
const firebaseConfig = window.UFTM_FIREBASE_CONFIG || {};
const firebaseReady = hasFirebaseConfig(firebaseConfig);
const canUseGoogleAuth = window.location.protocol !== "file:";

const defaultMenu = [
  {
    unit: "Unidade Abadia",
    day: "Segunda",
    date: "2026-03-16",
    updatedAt: "2026-03-16T08:42:00-03:00",
    sourceTitle: "Cardápio Unidade Abadia - 16 a 20 de março",
    mainDish: "Carne de Panela com Tomate",
    option: "Omelete",
    garnish: "Macarrão Alho e Óleo",
    sides: "Arroz Branco; Feijão Carioca",
    salads: "Acelga com Tomate; Feijão Branco e Preto",
    dessert: "Banana",
    drink: "Goiaba",
  },
];

const services = {
  firebaseApp: null,
  auth: null,
  db: null,
  storage: null,
  provider: null,
};

let unsubscribeProfile = null;
let unsubscribeUploads = null;

let state = {
  activeTab: uiState.activeTab || "today",
  referenceDate: uiState.referenceDate || toISO(new Date()),
  menu: Array.isArray(uiState.menu) && uiState.menu.length ? uiState.menu : defaultMenu,
  lastMenuSync: uiState.lastMenuSync || "",
  syncMessage: uiState.syncMessage || "Buscando cardápio oficial da Abadia.",
  firebaseReady,
  canUseGoogleAuth,
  authChecking: firebaseReady && canUseGoogleAuth,
  authError: "",
  user: null,
  profile: null,
  uploads: [],
  uploadMessage: "",
  uploadError: "",
  uploadProgress: 0,
  openingUploadId: "",
};

appElement.addEventListener("click", onClick);
appElement.addEventListener("change", onChange);

init();

async function init() {
  render();
  refreshRuMenu(true);

  if (!firebaseReady) {
    setState({
      authChecking: false,
      authError: "Preencha o arquivo firebase-config.js para habilitar o login Google e os uploads privados.",
    });
    return;
  }

  if (!canUseGoogleAuth) {
    setState({
      authChecking: false,
      authError: "Abra o app em http://localhost:4173 ou no deploy para usar o Google Sign-In.",
    });
    return;
  }

  try {
    services.firebaseApp = initializeApp(firebaseConfig);
    services.auth = getAuth(services.firebaseApp);
    services.db = getFirestore(services.firebaseApp);
    services.storage = getStorage(services.firebaseApp);
    services.provider = new GoogleAuthProvider();
    services.provider.setCustomParameters({ prompt: "select_account" });

    try {
      await getRedirectResult(services.auth);
    } catch (error) {
      setState({ authError: describeFirebaseError(error) });
    }

    onAuthStateChanged(services.auth, handleAuthStateChange);
  } catch (error) {
    setState({
      authChecking: false,
      authError: `Falha ao inicializar o Firebase: ${describeFirebaseError(error)}`,
    });
  }
}

async function handleAuthStateChange(user) {
  stopUserSubscriptions();

  if (!user) {
    setState({
      authChecking: false,
      user: null,
      profile: null,
      uploads: [],
      uploadMessage: "",
      uploadError: "",
    });
    return;
  }

  const userData = {
    uid: user.uid,
    displayName: user.displayName || "",
    email: user.email || "",
    photoURL: user.photoURL || "",
  };

  setState({
    authChecking: false,
    user: userData,
    authError: "",
    uploadError: "",
    uploadMessage: "Conta Google conectada com sucesso.",
  });

  try {
    await setDoc(
      doc(services.db, "users", user.uid),
      {
        displayName: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || "",
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    setState({ uploadError: `Não consegui sincronizar o perfil do aluno: ${describeFirebaseError(error)}` });
  }

  unsubscribeProfile = onSnapshot(
    doc(services.db, "users", user.uid),
    (snapshot) => {
      const profile = snapshot.exists() ? snapshot.data() : {};
      setState({ profile });
    },
    (error) => {
      setState({ uploadError: `Não consegui carregar o perfil salvo: ${describeFirebaseError(error)}` });
    },
  );

  unsubscribeUploads = onSnapshot(
    query(collection(services.db, "users", user.uid, "uploads"), orderBy("uploadedAtClient", "desc")),
    (snapshot) => {
      const uploads = snapshot.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          ownerUid: data.ownerUid || user.uid,
          originalName: data.originalName || "PDF sem nome",
          normalizedName: data.normalizedName || "",
          storagePath: data.storagePath || "",
          size: Number(data.size || 0),
          contentType: data.contentType || "application/pdf",
          status: data.status || "uploaded",
          parserStatus: data.parserStatus || "ready_for_parser",
          uploadedAtClient: data.uploadedAtClient || "",
          updatedAt: timestampToIso(data.updatedAt) || data.uploadedAtClient || "",
          notes: data.notes || "",
        };
      });
      setState({ uploads });
    },
    (error) => {
      setState({ uploadError: `Não consegui carregar os PDFs desta conta: ${describeFirebaseError(error)}` });
    },
  );
}

function stopUserSubscriptions() {
  if (typeof unsubscribeProfile === "function") {
    unsubscribeProfile();
    unsubscribeProfile = null;
  }
  if (typeof unsubscribeUploads === "function") {
    unsubscribeUploads();
    unsubscribeUploads = null;
  }
}

function loadUiState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch (error) {
    return {};
  }
}

function persistUiState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      activeTab: state.activeTab,
      referenceDate: state.referenceDate,
      menu: state.menu,
      lastMenuSync: state.lastMenuSync,
      syncMessage: state.syncMessage,
    }),
  );
}

function setState(patch) {
  state = { ...state, ...patch };
  persistUiState();
  render();
}

function render() {
  if (!state.user) {
    appElement.innerHTML = renderLogin();
    return;
  }

  const activeUpload = getActiveUpload();
  const totalUploads = state.uploads.length;
  const parserStatus = getParserStatusLabel(activeUpload);
  const activeContent = renderTab(activeUpload);

  appElement.innerHTML = `
    <div class="app-view">
      <header class="header-bar">
        <div class="header-brand">
          <span class="brand-mark">UFTM</span>
          <div class="header-copy">
            <h1>UFTM Mobile</h1>
            <p>Conta autenticada com Google e PDFs privados por aluno</p>
          </div>
        </div>
        <div class="status-inline">
          <span class="status-dot" aria-hidden="true"></span>
          <span>${escape(getStatusMessage())}</span>
        </div>
        <div class="button-row">
          <div class="user-chip">
            ${renderAvatar(state.user)}
            <div>
              <strong>${escape(state.user.displayName || "Aluno UFTM")}</strong>
              <span>${escape(state.user.email || state.user.uid)}</span>
            </div>
          </div>
          <button class="ghost" data-action="sync-ru">Atualizar RU</button>
          <button class="ghost" data-action="logout">Sair</button>
        </div>
      </header>

      <section class="hero-card">
        <div class="hero-content">
          <div class="hero-topline">Conta vinculada ao aluno</div>
          <div class="hero-band">
            <span class="hero-chip">UID ${escape(shortUid(state.user.uid))}</span>
            <span class="hero-chip">${escape(formatLongDate(state.referenceDate))}</span>
            <span class="hero-chip">${activeUpload ? "PDF ativo" : "Sem PDF ativo"}</span>
          </div>
          <h2 class="hero-title">${escape(buildHeroTitle(activeUpload))}</h2>
          <p class="hero-subtitle">
            O app já está pronto para receber um PDF real do SCA. Cada arquivo enviado fica associado ao seu login Google no Firebase Storage e no Firestore.
          </p>
          <div class="hero-actions">
            <div class="inline-field">
              <label for="referenceDate">Data de referência</label>
              <input id="referenceDate" type="date" value="${escape(state.referenceDate)}" />
            </div>
            <div class="button-row">
              <button class="secondary" data-action="set-tab" data-tab="sca">Enviar PDF real</button>
              <button class="ghost" data-action="sync-ru">Atualizar cardápio</button>
            </div>
          </div>
          <div class="metrics-grid">
            ${metric("PDFs na conta", String(totalUploads), "arquivos privados do aluno")}
            ${metric("PDF ativo", activeUpload ? "1" : "0", activeUpload ? activeUpload.originalName : "nenhum selecionado")}
            ${metric("Parser", parserStatus.title, parserStatus.caption)}
            ${metric("RU", "Abadia", state.menu[0] ? formatDateShort(state.menu[0].date) : "sem cardápio")}
          </div>
        </div>
      </section>

      <nav class="tab-row" aria-label="Navegação principal">
        ${navItems.map(renderTabButton).join("")}
      </nav>

      ${activeContent}

      <nav class="bottom-nav" aria-label="Navegação móvel">
        ${navItems.map(renderBottomButton).join("")}
      </nav>
    </div>
  `;
}

function renderLogin() {
  const canLogin = state.firebaseReady && state.canUseGoogleAuth && !state.authChecking;
  const loginLabel = state.authChecking ? "Conferindo sessão..." : "Entrar com Google";
  const setupTitle = !state.firebaseReady
    ? "Conecte o Firebase para liberar autenticação e uploads privados."
    : !state.canUseGoogleAuth
      ? "Abra por servidor local ou deploy para usar o login Google."
      : "Entre com sua conta Google para vincular o PDF real ao aluno.";

  return `
    <div class="login-layout">
      <section class="login-card">
        <span class="eyebrow">Login do aluno</span>
        <h1>UFTM Mobile com autenticação real e PDF privado por conta.</h1>
        <p>${escape(setupTitle)}</p>
        <div class="login-actions">
          <button class="cta" data-action="login-google" ${canLogin ? "" : "disabled"}>${escape(loginLabel)}</button>
          <button class="ghost" data-action="sync-ru">Atualizar RU</button>
        </div>
        <div class="toast ${state.authError ? "is-warning" : ""}" style="margin-top: 1rem;">
          ${escape(state.authError || state.syncMessage)}
        </div>
        <div class="facts-grid" style="margin-top: 1.25rem;">
          <div class="fact"><strong>Google</strong><p>login por conta institucional ou pessoal</p></div>
          <div class="fact"><strong>Firestore</strong><p>metadados do PDF por aluno</p></div>
          <div class="fact"><strong>Storage</strong><p>arquivo PDF privado por UID</p></div>
        </div>
      </section>

      <aside class="preview-card">
        <span class="eyebrow">Base pronta</span>
        <h2 class="preview-title">Sem dados pré-carregados, pronta para o PDF real.</h2>
        <p class="preview-copy">
          O app deixou os exemplos fixos para trás. Agora o fluxo começa pelo login Google, segue com upload do PDF oficial do SCA e mantém cada arquivo separado por aluno.
        </p>
        <div class="pill-grid">
          <div class="preview-pill"><strong>Conta Google</strong><span>sessão individual no Firebase Auth</span></div>
          <div class="preview-pill"><strong>PDF privado</strong><span>arquivo salvo no Storage por UID</span></div>
          <div class="preview-pill"><strong>Parser real</strong><span>campo pronto para consumir o PDF enviado</span></div>
        </div>
        <div class="mini-stack">
          <div class="mini-card"><small>Passo 1</small><strong>Preencher config</strong><span>edite firebase-config.js com os dados do projeto</span></div>
          <div class="mini-card"><small>Passo 2</small><strong>Autorizar domínio</strong><span>inclua localhost e o domínio final no Firebase Auth</span></div>
          <div class="mini-card"><small>Passo 3</small><strong>Aplicar regras</strong><span>use firestore.rules e storage.rules</span></div>
        </div>
      </aside>
    </div>
  `;
}

function renderTab(activeUpload) {
  if (state.activeTab === "week") {
    return `
      <section class="paper-card">
        <div class="section-topline">Grade semanal</div>
        <h2 class="section-title">Aguardando o parser do PDF ativo</h2>
        <p class="section-copy">
          A visão semanal ficará populada assim que o parser real ler o PDF ${activeUpload ? `“${escape(activeUpload.originalName)}”` : "que você enviar na aba SCA"}.
        </p>
        ${renderParserToast(activeUpload)}
      </section>
    `;
  }

  if (state.activeTab === "menu") {
    return `
      <section class="panel-grid">
        <article class="paper-card">
          <div class="section-topline">Cardápio RU</div>
          <h2 class="section-title">Cardápio do dia da Unidade Abadia</h2>
          <p class="section-copy">
            O app consulta a publicação oficial da UFTM e mostra apenas o cardápio do dia. Você pode checar manualmente quando quiser.
          </p>
          <div class="menu-grid" style="margin-top: 1rem;">
            ${state.menu.map(renderMenuCard).join("")}
          </div>
        </article>
        <aside class="timeline-card">
          <div class="timeline-topline">Sincronização</div>
          <h2 class="section-title">Atualização diária baseada no PDF oficial</h2>
          <div class="mini-stack" style="margin-top: 1rem;">
            <div class="mini-card"><small>Última publicação oficial</small><strong>${escape(formatShortDateTime(state.menu[0]?.updatedAt))}</strong><span>arquivo da Abadia</span></div>
            <div class="mini-card"><small>Última verificação</small><strong>${escape(formatShortDateTime(state.lastMenuSync))}</strong><span>salva localmente</span></div>
            <div class="mini-card"><small>Status</small><strong>${escape(state.syncMessage)}</strong><span>rota /api/ru-abadia</span></div>
          </div>
        </aside>
      </section>
    `;
  }

  if (state.activeTab === "sca") {
    return `
      <section class="upload-grid">
        <article class="upload-card">
          <div class="section-topline">Upload SCA</div>
          <h2 class="section-title">Envie o PDF real do aluno</h2>
          <p class="section-copy">
            O arquivo será vinculado à sua conta Google e marcado como pronto para o parser real. Não há horários pré-carregados nesta versão.
          </p>
          <div class="upload-drop" style="margin-top: 1rem;">
            <input id="pdfInput" class="file-input" type="file" accept="application/pdf,.pdf" />
            <div class="button-row">
              <label class="file-trigger" for="pdfInput">Selecionar PDF real</label>
              <button class="ghost" data-action="refresh-uploads">Sincronizar lista</button>
            </div>
            <ul>
              <li>Formato esperado: “Relação de Disciplinas por Acadêmico”.</li>
              <li>O upload fica salvo em \`users/{uid}/uploads/...\`.</li>
              <li>O parser real poderá consumir o mesmo arquivo depois, sem novo envio.</li>
            </ul>
          </div>
          ${renderUploadStatus()}
        </article>
        <aside class="paper-card">
          <div class="section-topline">PDF ativo</div>
          <h2 class="section-title">${activeUpload ? escape(activeUpload.originalName) : "Nenhum PDF selecionado ainda"}</h2>
          <div class="mini-stack" style="margin-top: 1rem;">
            <div class="mini-card"><small>Conta</small><strong>${escape(state.user.displayName || "Aluno UFTM")}</strong><span>${escape(state.user.email || state.user.uid)}</span></div>
            <div class="mini-card"><small>Status do arquivo</small><strong>${escape(getUploadStatusLabel(activeUpload))}</strong><span>${escape(getParserStatusLabel(activeUpload).caption)}</span></div>
            <div class="mini-card"><small>Último envio</small><strong>${escape(activeUpload ? formatShortDateTime(activeUpload.uploadedAtClient) : "sem envio")}</strong><span>${escape(activeUpload ? formatBytes(activeUpload.size) : "aguardando PDF")}</span></div>
          </div>
        </aside>
      </section>
      <section class="paper-card" style="margin-top: 1rem;">
        <div class="section-topline">Arquivos da conta</div>
        <h2 class="section-title">PDFs vinculados a este aluno</h2>
        <p class="section-copy">
          Cada upload fica separado por UID e pode ser definido como arquivo ativo para o parser.
        </p>
        <div class="upload-list" style="margin-top: 1rem;">
          ${state.uploads.length ? state.uploads.map((item) => renderUploadItem(item, activeUpload)).join("") : `<div class="empty-state">Nenhum PDF enviado ainda. Faça o primeiro upload para vincular o arquivo ao aluno.</div>`}
        </div>
      </section>
    `;
  }

  return `
    <section class="panel-grid">
      <article class="timeline-card">
        <div class="timeline-topline">Hoje</div>
        <h2 class="section-title">${escape(formatLongDate(state.referenceDate))}</h2>
        <p class="section-copy">
          Seus horários vão aparecer aqui quando o parser real processar o PDF ativo da conta.
        </p>
        ${renderParserToast(activeUpload)}
      </article>
      <aside class="paper-card">
        <div class="section-topline">Resumo da conta</div>
        <h2 class="section-title">Tudo pronto para o primeiro PDF real</h2>
        <div class="mini-grid" style="margin-top: 1rem;">
          <div class="mini-card"><small>Aluno</small><strong>${escape(state.user.displayName || "Aluno UFTM")}</strong><span>${escape(state.user.email || shortUid(state.user.uid))}</span></div>
          <div class="mini-card"><small>PDF ativo</small><strong>${activeUpload ? "Selecionado" : "Pendente"}</strong><span>${escape(activeUpload ? activeUpload.originalName : "envie pela aba SCA")}</span></div>
          <div class="mini-card"><small>Uploads</small><strong>${String(state.uploads.length)}</strong><span>arquivos privados nesta conta</span></div>
          <div class="mini-card"><small>Parser</small><strong>${escape(getParserStatusLabel(activeUpload).title)}</strong><span>${escape(getParserStatusLabel(activeUpload).caption)}</span></div>
        </div>
      </aside>
    </section>
  `;
}

function renderParserToast(activeUpload) {
  if (!activeUpload) {
    return `
      <div class="toast is-warning" style="margin-top: 1rem;">
        Nenhum PDF real foi enviado ainda. Vá para a aba SCA e faça upload do arquivo oficial do aluno.
        <div class="button-row" style="margin-top: 0.75rem;">
          <button class="ghost" data-action="set-tab" data-tab="sca">Abrir aba SCA</button>
        </div>
      </div>
    `;
  }

  if (activeUpload.status === "error") {
    return `
      <div class="toast is-danger" style="margin-top: 1rem;">
        O último upload falhou. Reenvie o PDF real para continuar.
        <div class="button-row" style="margin-top: 0.75rem;">
          <button class="ghost" data-action="set-tab" data-tab="sca">Voltar ao upload</button>
        </div>
      </div>
    `;
  }

  if (activeUpload.status !== "uploaded") {
    return `
      <div class="toast" style="margin-top: 1rem;">
        O arquivo ${escape(activeUpload.originalName)} ainda está sendo sincronizado. Assim que o upload terminar, ele ficará pronto para o parser.
      </div>
    `;
  }

  return `
    <div class="toast" style="margin-top: 1rem;">
      O PDF ${escape(activeUpload.originalName)} já está salvo na sua conta e marcado como pronto para o parser real. Quando o extrator for ligado, os horários vão aparecer automaticamente.
    </div>
  `;
}

function renderUploadStatus() {
  const classes = ["toast"];
  const message = state.uploadError || state.uploadMessage || "Nenhum envio em andamento.";

  if (state.uploadError) {
    classes.push("is-danger");
  } else if (!state.uploadMessage) {
    classes.push("is-warning");
  }

  return `
    <div class="${classes.join(" ")}" style="margin-top: 1rem;">
      ${escape(message)}
    </div>
    ${state.uploadProgress > 0 && state.uploadProgress < 100
      ? `<div class="progress-track" style="margin-top: 0.75rem;"><div class="progress-fill" style="width: ${state.uploadProgress}%;"></div></div>`
      : ""}
  `;
}

function renderUploadItem(item, activeUpload) {
  const isActive = activeUpload && activeUpload.id === item.id;
  return `
    <article class="upload-entry ${isActive ? "is-active" : ""}">
      <div class="upload-entry-top">
        <div>
          <h3 class="schedule-title">${escape(item.originalName)}</h3>
          <div class="support-line">${escape(formatShortDateTime(item.uploadedAtClient))} • ${escape(formatBytes(item.size))}</div>
        </div>
        <span class="tag">${escape(getUploadStatusLabel(item))}</span>
      </div>
      <div class="item-meta">
        <span class="tag">${isActive ? "PDF ativo" : "PDF da conta"}</span>
        <span class="tag">${escape(getParserStatusLabel(item).caption)}</span>
      </div>
      <div class="button-row" style="margin-top: 0.75rem;">
        ${isActive || item.status !== "uploaded" ? "" : `<button class="ghost" data-action="set-active-upload" data-upload-id="${escape(item.id)}">Definir como ativo</button>`}
        ${item.storagePath ? `<button class="ghost" data-action="open-upload" data-upload-id="${escape(item.id)}">${state.openingUploadId === item.id ? "Abrindo..." : "Abrir PDF"}</button>` : ""}
      </div>
    </article>
  `;
}

function renderMenuCard(item) {
  return `
    <article class="menu-card">
      <div class="menu-top">
        <h3 class="menu-title">${escape(item.unit)}</h3>
        <span class="tag">${escape(formatLongDate(item.date))}</span>
      </div>
      <section class="menu-section"><h4>Dia</h4><p>${escape(item.day)}</p></section>
      <section class="menu-section"><h4>Prato principal</h4><p>${escape(item.mainDish)}</p></section>
      <section class="menu-section"><h4>Opção</h4><p>${escape(item.option)}</p></section>
      <section class="menu-section"><h4>Guarnição</h4><p>${escape(item.garnish)}</p></section>
      <section class="menu-section"><h4>Acompanhamentos</h4><p>${escape(item.sides)}</p></section>
      <section class="menu-section"><h4>Saladas</h4><p>${escape(item.salads)}</p></section>
      <section class="menu-section"><h4>Sobremesa</h4><p>${escape(item.dessert)}</p></section>
      <section class="menu-section"><h4>Refresco</h4><p>${escape(item.drink)}</p></section>
      <section class="menu-section"><h4>Origem</h4><p>${escape(item.sourceTitle)}</p></section>
    </article>
  `;
}

function renderTabButton(item) {
  return `
    <button class="tab-button ${state.activeTab === item.id ? "is-active" : ""}" data-action="set-tab" data-tab="${item.id}">
      ${item.label}
    </button>
  `;
}

function renderBottomButton(item) {
  return `
    <button class="bottom-button ${state.activeTab === item.id ? "is-active" : ""}" data-action="set-tab" data-tab="${item.id}">
      ${item.label}
    </button>
  `;
}

function renderAvatar(user) {
  if (user.photoURL) {
    return `<img class="avatar-image" src="${escapeAttribute(user.photoURL)}" alt="Foto do utilizador" referrerpolicy="no-referrer" />`;
  }
  return `<span class="avatar-fallback">${escape(initials(user.displayName || user.email || "Aluno"))}</span>`;
}

function metric(label, value, caption) {
  return `<div class="metric-card"><small>${escape(label)}</small><strong>${escape(value)}</strong><span>${escape(caption)}</span></div>`;
}

async function onClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;

  if (action === "set-tab") {
    setState({ activeTab: button.dataset.tab || "today" });
    return;
  }

  if (action === "sync-ru") {
    refreshRuMenu(false);
    return;
  }

  if (action === "login-google") {
    loginWithGoogle();
    return;
  }

  if (action === "logout") {
    logout();
    return;
  }

  if (action === "refresh-uploads") {
    setState({ uploadMessage: "Sincronização ativa. A lista acompanha sua conta em tempo real.", uploadError: "" });
    return;
  }

  if (action === "set-active-upload") {
    setActiveUpload(button.dataset.uploadId || "");
    return;
  }

  if (action === "open-upload") {
    openUpload(button.dataset.uploadId || "");
  }
}

function onChange(event) {
  if (event.target.id === "referenceDate") {
    setState({ referenceDate: event.target.value || toISO(new Date()) });
    return;
  }

  if (event.target.id === "pdfInput" && event.target.files && event.target.files[0]) {
    uploadPdf(event.target.files[0], event.target);
  }
}

async function loginWithGoogle() {
  if (!state.firebaseReady) {
    setState({ authError: "Preencha firebase-config.js antes de tentar autenticar." });
    return;
  }

  if (!state.canUseGoogleAuth) {
    setState({ authError: "Use http://localhost:4173 ou o deploy publicado. O Google Sign-In não funciona em file://." });
    return;
  }

  setState({ authError: "", uploadMessage: "Abrindo autenticação Google..." });

  try {
    await signInWithPopup(services.auth, services.provider);
  } catch (error) {
    if (shouldUseRedirect(error)) {
      await signInWithRedirect(services.auth, services.provider);
      return;
    }
    setState({ authError: describeFirebaseError(error), uploadMessage: "" });
  }
}

async function logout() {
  if (!services.auth) return;

  try {
    await signOut(services.auth);
    setState({
      uploadMessage: "",
      uploadError: "",
      authError: "",
      activeTab: "today",
    });
  } catch (error) {
    setState({ authError: `Não consegui encerrar a sessão: ${describeFirebaseError(error)}` });
  }
}

async function uploadPdf(file, inputElement) {
  if (!state.user || !services.db || !services.storage) {
    setState({ uploadError: "Entre com Google antes de enviar o PDF.", uploadMessage: "", uploadProgress: 0 });
    inputElement.value = "";
    return;
  }

  if (!isPdfFile(file)) {
    setState({ uploadError: "Selecione um arquivo PDF válido do SCA.", uploadMessage: "", uploadProgress: 0 });
    inputElement.value = "";
    return;
  }

  const uploadId = doc(collection(services.db, "users", state.user.uid, "uploads")).id;
  const normalizedName = normalizeFileName(file.name);
  const uploadedAtClient = new Date().toISOString();
  const storagePath = `users/${state.user.uid}/uploads/${uploadId}/${normalizedName}`;
  const uploadDocRef = doc(services.db, "users", state.user.uid, "uploads", uploadId);

  setState({
    uploadError: "",
    uploadMessage: `Enviando ${file.name} para a sua conta...`,
    uploadProgress: 1,
    activeTab: "sca",
  });

  try {
    await setDoc(uploadDocRef, {
      ownerUid: state.user.uid,
      originalName: file.name,
      normalizedName,
      storagePath,
      size: file.size,
      contentType: file.type || "application/pdf",
      status: "uploading",
      parserStatus: "waiting_upload",
      uploadedAtClient,
      notes: "PDF real salvo e pronto para o parser do SCA.",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await new Promise((resolve, reject) => {
      const task = uploadBytesResumable(
        storageRef(services.storage, storagePath),
        file,
        { contentType: "application/pdf" },
      );

      task.on(
        "state_changed",
        (snapshot) => {
          const progress = snapshot.totalBytes ? Math.max(1, Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)) : 1;
          setState({
            uploadProgress: progress,
            uploadMessage: `Enviando ${file.name}: ${progress}% concluído.`,
            uploadError: "",
          });
        },
        reject,
        resolve,
      );
    });

    await updateDoc(uploadDocRef, {
      status: "uploaded",
      parserStatus: "ready_for_parser",
      updatedAt: serverTimestamp(),
    });

    await setDoc(
      doc(services.db, "users", state.user.uid),
      {
        activeUploadId: uploadId,
        activeUploadName: file.name,
        lastUploadAtClient: uploadedAtClient,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    setState({
      uploadProgress: 100,
      uploadMessage: "PDF vinculado à sua conta e definido como arquivo ativo para o parser real.",
      uploadError: "",
    });
  } catch (error) {
    try {
      await setDoc(
        uploadDocRef,
        {
          ownerUid: state.user.uid,
          originalName: file.name,
          normalizedName,
          storagePath,
          size: file.size,
          contentType: file.type || "application/pdf",
          status: "error",
          parserStatus: "upload_failed",
          uploadedAtClient,
          notes: describeFirebaseError(error),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } catch (secondaryError) {
      // Mantemos o erro original para a interface.
    }

    setState({
      uploadProgress: 0,
      uploadMessage: "",
      uploadError: `Não consegui enviar o PDF: ${describeFirebaseError(error)}`,
    });
  } finally {
    inputElement.value = "";
  }
}

async function setActiveUpload(uploadId) {
  if (!state.user || !uploadId || !services.db) return;

  const upload = state.uploads.find((item) => item.id === uploadId);
  if (!upload) return;

  try {
    await setDoc(
      doc(services.db, "users", state.user.uid),
      {
        activeUploadId: upload.id,
        activeUploadName: upload.originalName,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    setState({ uploadMessage: `${upload.originalName} agora é o PDF ativo desta conta.`, uploadError: "" });
  } catch (error) {
    setState({ uploadError: `Não consegui definir o PDF ativo: ${describeFirebaseError(error)}` });
  }
}

async function openUpload(uploadId) {
  const upload = state.uploads.find((item) => item.id === uploadId);
  if (!upload || !upload.storagePath || !services.storage) return;

  setState({ openingUploadId: uploadId, uploadError: "", uploadMessage: `Abrindo ${upload.originalName}...` });

  try {
    const url = await getDownloadURL(storageRef(services.storage, upload.storagePath));
    window.open(url, "_blank", "noopener");
    setState({ openingUploadId: "", uploadMessage: `${upload.originalName} aberto em nova aba.` });
  } catch (error) {
    setState({
      openingUploadId: "",
      uploadError: `Não consegui abrir o PDF: ${describeFirebaseError(error)}`,
      uploadMessage: "",
    });
  }
}

async function refreshRuMenu(silent) {
  if (!silent) {
    setState({ syncMessage: "Consultando a publicação oficial da Abadia..." });
  }

  try {
    const response = await fetch("./api/ru-abadia");
    const result = await response.json();

    if (!response.ok || !result.success || !result.menu) {
      throw new Error(result.message || "A API local não retornou cardápio válido.");
    }

    setState({
      menu: [result.menu],
      lastMenuSync: new Date().toISOString(),
      syncMessage: `Cardápio do dia sincronizado: ${result.menu.day}, ${formatDateShort(result.menu.date)}.`,
    });
  } catch (error) {
    if (!silent) {
      setState({
        lastMenuSync: new Date().toISOString(),
        syncMessage: "Não consegui atualizar agora; mantendo o último cardápio salvo.",
      });
    }
  }
}

function buildHeroTitle(activeUpload) {
  const name = firstName(state.user?.displayName || state.user?.email || "Aluno");
  if (!activeUpload) {
    return `${name}, envie o PDF real do SCA para começar a montar sua rotina.`;
  }
  if (activeUpload.status === "uploaded") {
    return `${name}, o PDF ${activeUpload.originalName} já está vinculado à sua conta.`;
  }
  if (activeUpload.status === "error") {
    return `${name}, houve uma falha no último upload e o arquivo precisa ser reenviado.`;
  }
  return `${name}, o PDF ${activeUpload.originalName} ainda está sendo sincronizado.`;
}

function getActiveUpload() {
  if (!state.uploads.length) return null;
  const activeId = state.profile?.activeUploadId || "";
  return state.uploads.find((item) => item.id === activeId) || state.uploads[0] || null;
}

function getParserStatusLabel(upload) {
  if (!upload) {
    return {
      title: "Pendente",
      caption: "aguardando o primeiro PDF real",
    };
  }

  if (upload.status === "error") {
    return {
      title: "Falhou",
      caption: "reenvie o PDF para liberar o parser",
    };
  }

  if (upload.status !== "uploaded") {
    return {
      title: "Subindo",
      caption: "o arquivo ainda está indo para o Storage",
    };
  }

  return {
    title: "Pronto",
    caption: "arquivo disponível para o parser real",
  };
}

function getUploadStatusLabel(upload) {
  if (!upload) return "Sem arquivo";
  if (upload.status === "uploaded") return "Enviado";
  if (upload.status === "error") return "Falhou";
  if (upload.status === "uploading") return "Enviando";
  return upload.status;
}

function getStatusMessage() {
  return state.uploadError || state.authError || state.uploadMessage || state.syncMessage;
}

function hasFirebaseConfig(config) {
  return [
    config.apiKey,
    config.authDomain,
    config.projectId,
    config.storageBucket,
    config.messagingSenderId,
    config.appId,
  ].every((value) => value && !String(value).includes("PREENCHA") && !String(value).includes("SEU-PROJETO"));
}

function shouldUseRedirect(error) {
  const code = String(error?.code || "");
  return code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment";
}

function describeFirebaseError(error) {
  const code = String(error?.code || "");
  const fallback = error?.message || "erro desconhecido";

  const knownErrors = {
    "auth/operation-not-supported-in-this-environment": "use o app em http://localhost:4173 ou no deploy; o Google Sign-In não funciona em file://",
    "auth/unauthorized-domain": "adicione este domínio em Authentication > Settings > Authorized domains no Firebase",
    "auth/popup-blocked": "o navegador bloqueou a janela de login; permita pop-ups ou tente novamente",
    "auth/popup-closed-by-user": "a janela de autenticação foi fechada antes da conclusão",
    "storage/unauthorized": "as regras do Firebase Storage não permitem este upload para o utilizador atual",
    "permission-denied": "as regras do Firestore não permitem esta operação para o utilizador atual",
  };

  return knownErrors[code] || fallback;
}

function timestampToIso(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  return "";
}

function normalizeFileName(name) {
  const safe = String(name || "horarios.pdf")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return safe.toLowerCase().endsWith(".pdf") ? safe : `${safe}.pdf`;
}

function isPdfFile(file) {
  return Boolean(file) && ((file.type || "").includes("pdf") || String(file.name || "").toLowerCase().endsWith(".pdf"));
}

function shortUid(uid) {
  return String(uid || "").slice(0, 8);
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatLongDate(isoDate) {
  return toDate(isoDate).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatShortDateTime(isoDateTime) {
  if (!isoDateTime) return "sem registro";
  return new Date(isoDateTime).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(isoDate) {
  if (!isoDate) return "sem data";
  return toDate(isoDate).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function toDate(isoDate) {
  const [year, month, day] = String(isoDate).split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function toISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function firstName(value) {
  return String(value || "Aluno").trim().split(/\s+/)[0];
}

function initials(value) {
  const parts = String(value || "Aluno").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((item) => item[0]).join("").toUpperCase();
}

function escape(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escape(value);
}
