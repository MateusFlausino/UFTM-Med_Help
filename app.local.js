import { extractScaPdfData } from "./sca-parser.js";

const UI_STORAGE_KEY = "uftm-mobile-local-ui-v1";
const SESSION_STORAGE_KEY = "uftm-mobile-local-session-v1";
const PROFILE_STORAGE_PREFIX = "uftm-mobile-local-profile-";
const LOCAL_DB_NAME = "uftm-mobile-local-db";
const LOCAL_DB_VERSION = 1;
const UPLOAD_STORE = "uploads";

const navItems = [
  { id: "today", label: "Hoje" },
  { id: "week", label: "Grade" },
  { id: "menu", label: "RU" },
  { id: "sca", label: "SCA" },
];

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

const appElement = document.getElementById("app");
const uiState = loadUiState();
let localDbPromise = null;

let state = {
  activeTab: uiState.activeTab || "today",
  referenceDate: uiState.referenceDate || toISO(new Date()),
  menu: Array.isArray(uiState.menu) && uiState.menu.length ? uiState.menu : defaultMenu,
  lastMenuSync: uiState.lastMenuSync || "",
  syncMessage: uiState.syncMessage || "Buscando cardápio oficial da Abadia.",
  authChecking: true,
  authError: "",
  user: null,
  profile: null,
  uploads: [],
  uploadMessage: "",
  uploadError: "",
  uploadProgress: 0,
  openingUploadId: "",
  draftName: uiState.draftName || "",
  draftEmail: uiState.draftEmail || "",
};

appElement.addEventListener("click", onClick);
appElement.addEventListener("change", onChange);
appElement.addEventListener("input", onInput);

init();

async function init() {
  render();

  try {
    await openLocalDb();
    await restoreLocalSession();
  } catch (error) {
    setState({
      authChecking: false,
      authError: `Não consegui abrir o armazenamento local deste aparelho: ${describeLocalError(error)}`,
    });
  }

  refreshRuMenu(true);
}

async function restoreLocalSession() {
  const session = loadSession();
  if (!session) {
    setState({
      authChecking: false,
      syncMessage: "Modo local pronto. Abra seu perfil neste aparelho para enviar o PDF do SCA.",
    });
    return;
  }

  const profile = ensureStoredProfile(session);
  const uploads = await listUploadsForUser(session.uid);
  const nextProfile = ensureActiveUploadProfile(profile, uploads);

  setState({
    authChecking: false,
    authError: "",
    user: session,
    profile: nextProfile,
    uploads,
    uploadError: "",
    uploadMessage: uploads.length
      ? "Perfil local restaurado com seus PDFs salvos neste aparelho."
      : "Perfil local restaurado. Envie o primeiro PDF do SCA.",
  });
}

function render() {
  if (!state.user) {
    appElement.innerHTML = renderLogin();
    return;
  }

  const activeUpload = getActiveUpload();
  const academicData = getAcademicData(activeUpload);
  const todayClasses = getClassesForDate(academicData?.schedule || [], state.referenceDate);
  const nextClass = findNextClass(academicData?.schedule || [], state.referenceDate);
  const totalUploads = state.uploads.length;
  const disciplineCount = academicData?.disciplines?.length || 0;
  const classCount = academicData?.schedule?.length || 0;

  appElement.innerHTML = `
    <div class="app-view">
      <header class="header-bar">
        <div class="header-brand">
          <span class="brand-mark">UFTM</span>
          <div class="header-copy">
            <h1>UFTM Mobile</h1>
            <p>Perfil local do aluno e PDFs salvos no próprio aparelho</p>
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
          <button class="ghost" data-action="logout">Trocar aluno</button>
        </div>
      </header>

      <section class="hero-card">
        <div class="hero-content">
          <div class="hero-topline">Agenda acadêmica do aluno</div>
          <div class="hero-band">
            <span class="hero-chip">ID local ${escape(shortUid(state.user.uid))}</span>
            <span class="hero-chip">${escape(academicData?.profile?.course || "Curso não identificado")}</span>
            <span class="hero-chip">${activeUpload ? "PDF importado" : "Envie o PDF do SCA"}</span>
          </div>
          <h2 class="hero-title">${escape(buildHeroTitle(activeUpload, academicData, todayClasses, nextClass))}</h2>
          <p class="hero-subtitle">
            ${escape(buildHeroSubtitle(academicData))}
          </p>
          <div class="hero-actions">
            <div class="inline-field">
              <label for="referenceDate">Data de referência</label>
              <input id="referenceDate" type="date" value="${escape(state.referenceDate)}" />
            </div>
            <div class="button-row">
              <button class="secondary" data-action="set-tab" data-tab="${academicData ? "today" : "sca"}">${academicData ? "Ver agenda" : "Importar PDF"}</button>
              <button class="ghost" data-action="set-tab" data-tab="sca">Abrir SCA</button>
            </div>
          </div>
          <div class="metrics-grid">
            ${metric("PDFs salvos", String(totalUploads), "arquivos guardados neste aparelho")}
            ${metric("Disciplinas", String(disciplineCount), disciplineCount ? "lidas do PDF" : "aguardando importação")}
            ${metric("Aulas", String(classCount), classCount ? "blocos encontrados" : "horários ainda indisponíveis")}
            ${metric("Hoje", String(todayClasses.length), nextClass ? `próxima: ${nextClass.startTime}` : "sem aula futura no recorte")}
          </div>
        </div>
      </section>

      <nav class="tab-row" aria-label="Navegação principal">
        ${navItems.map(renderTabButton).join("")}
      </nav>

      ${renderTab(activeUpload)}

      <nav class="bottom-nav" aria-label="Navegação móvel">
        ${navItems.map(renderBottomButton).join("")}
      </nav>
    </div>
  `;
}

function renderLogin() {
  const canLogin = !state.authChecking;
  const loginLabel = state.authChecking ? "Abrindo armazenamento local..." : "Entrar neste aparelho";
  const setupTitle = state.authChecking
    ? "Preparando o modo local do app."
    : "Crie um perfil local do aluno. Não precisa de Firebase, cartão ou mensalidade.";

  return `
    <div class="login-layout">
      <section class="login-card">
        <span class="eyebrow">Entrada local</span>
        <h1>UFTM Mobile sem Firebase, pronto para guardar o PDF no aparelho.</h1>
        <p>${escape(setupTitle)}</p>
        <div class="form-grid">
          <div class="inline-field">
            <label for="loginName">Nome do aluno</label>
            <input id="loginName" type="text" value="${escapeAttribute(state.draftName)}" placeholder="Ex.: Ana Elisa" />
          </div>
          <div class="inline-field">
            <label for="loginEmail">E-mail do aluno</label>
            <input id="loginEmail" type="email" value="${escapeAttribute(state.draftEmail)}" placeholder="nome@uftm.edu.br" />
          </div>
        </div>
        <div class="login-actions" style="margin-top: 1rem;">
          <button class="cta" data-action="login-local" ${canLogin ? "" : "disabled"}>${escape(loginLabel)}</button>
          <button class="ghost" data-action="sync-ru">Atualizar RU</button>
        </div>
        <div class="toast ${state.authError ? "is-warning" : ""}" style="margin-top: 1rem;">
          ${escape(state.authError || state.syncMessage || "Os dados do aluno e os PDFs ficarão salvos localmente neste navegador.")}
        </div>
        <div class="facts-grid" style="margin-top: 1.25rem;">
          <div class="fact"><strong>Sem calção</strong><p>não depende de serviço pago</p></div>
          <div class="fact"><strong>Local</strong><p>perfil e PDFs ficam no aparelho</p></div>
          <div class="fact"><strong>Simples</strong><p>pronto para começar com o SCA</p></div>
        </div>
      </section>

      <aside class="preview-card">
        <span class="eyebrow">Alternativa leve</span>
        <h2 class="preview-title">Cada aluno usa o próprio aparelho sem backend externo.</h2>
        <p class="preview-copy">
          O app abre um perfil local por e-mail, salva o PDF real do SCA no navegador e já organiza agenda, grade e disciplinas. Se o aluno trocar de aparelho, basta entrar e reenviar o PDF.
        </p>
        <div class="pill-grid">
          <div class="preview-pill"><strong>Perfil local</strong><span>identificação simples neste navegador</span></div>
          <div class="preview-pill"><strong>PDF local</strong><span>armazenado com IndexedDB no aparelho</span></div>
          <div class="preview-pill"><strong>Sem mensalidade</strong><span>zero dependência do Firebase</span></div>
        </div>
        <div class="mini-stack">
          <div class="mini-card"><small>Passo 1</small><strong>Entrar</strong><span>use nome e e-mail do aluno</span></div>
          <div class="mini-card"><small>Passo 2</small><strong>Enviar PDF</strong><span>o arquivo fica salvo no aparelho</span></div>
          <div class="mini-card"><small>Passo 3</small><strong>Usar a agenda</strong><span>horários e disciplinas aparecem após a leitura</span></div>
        </div>
      </aside>
    </div>
  `;
}

function renderTab(activeUpload) {
  const academicData = getAcademicData(activeUpload);
  const schedule = academicData?.schedule || [];
  const disciplines = academicData?.disciplines || [];
  const todayClasses = getClassesForDate(schedule, state.referenceDate);
  const weekView = buildWeekView(schedule, state.referenceDate);
  const nextClass = findNextClass(schedule, state.referenceDate);

  if (state.activeTab === "week") {
    if (!activeUpload) {
      return renderMissingPdfState("Importe o PDF do SCA para montar sua grade semanal.");
    }

    return `
      <section class="paper-card">
        <div class="section-topline">Grade semanal</div>
        <h2 class="section-title">${escape(weekTitle(state.referenceDate))}</h2>
        <p class="section-copy">
          ${weekView.some((day) => day.classes.length)
            ? "Sua semana foi organizada a partir do PDF importado."
            : "O PDF foi salvo, mas não encontrei blocos de aula suficientes para montar a semana."}
        </p>
        <div class="week-grid" style="margin-top: 1rem;">
          ${weekView.map(renderDayColumn).join("")}
        </div>
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
            O app consulta a publicação oficial da UFTM e mostra apenas o cardápio do dia. Esta parte continua funcionando sem Firebase.
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
            O arquivo oficial do SCA fica salvo neste aparelho e, quando reconhecido, preenche a agenda, a grade e as disciplinas do aluno.
          </p>
          <div class="upload-drop" style="margin-top: 1rem;">
            <input id="pdfInput" class="file-input" type="file" accept="application/pdf,.pdf" />
            <div class="button-row">
              <label class="file-trigger" for="pdfInput">Selecionar PDF real</label>
              <button class="ghost" data-action="refresh-uploads">Atualizar lista</button>
            </div>
            <ul>
              <li>Formato esperado: “Relação de Disciplinas por Acadêmico”.</li>
              <li>Os dados ficam salvos apenas neste aparelho.</li>
              <li>Se limpar os dados do navegador, será preciso reenviar o arquivo.</li>
            </ul>
          </div>
          ${renderUploadStatus()}
        </article>
        <aside class="paper-card">
          <div class="section-topline">PDF ativo</div>
          <h2 class="section-title">${activeUpload ? escape(activeUpload.originalName) : "Nenhum PDF selecionado ainda"}</h2>
          <div class="mini-stack" style="margin-top: 1rem;">
            <div class="mini-card"><small>Aluno</small><strong>${escape(state.user.displayName || "Aluno UFTM")}</strong><span>${escape(state.user.email || state.user.uid)}</span></div>
            <div class="mini-card"><small>Status do arquivo</small><strong>${escape(getUploadStatusLabel(activeUpload))}</strong><span>${escape(getExtractionCaption(activeUpload))}</span></div>
            <div class="mini-card"><small>Último envio</small><strong>${escape(activeUpload ? formatShortDateTime(activeUpload.uploadedAtClient) : "sem envio")}</strong><span>${escape(activeUpload ? formatBytes(activeUpload.size) : "aguardando PDF")}</span></div>
          </div>
        </aside>
      </section>
      <section class="panel-grid" style="margin-top: 1rem;">
        <article class="paper-card">
          <div class="section-topline">Dados do aluno</div>
          <h2 class="section-title">${escape(academicData?.profile?.studentName || state.user.displayName || "Aluno")}</h2>
          <div class="mini-grid" style="margin-top: 1rem;">
            <div class="mini-card"><small>Matrícula</small><strong>${escape(academicData?.profile?.studentId || "não encontrada")}</strong><span>identificação acadêmica</span></div>
            <div class="mini-card"><small>Curso</small><strong>${escape(academicData?.profile?.course || "não encontrado")}</strong><span>curso importado do PDF</span></div>
            <div class="mini-card"><small>Período</small><strong>${escape(academicData?.profile?.period || "não encontrado")}</strong><span>período letivo</span></div>
            <div class="mini-card"><small>Arquivo</small><strong>${escape(activeUpload ? activeUpload.originalName : "sem PDF")}</strong><span>${escape(academicData?.summary?.classCount ? `${academicData.summary.classCount} blocos carregados` : "envie o PDF oficial")}</span></div>
          </div>
        </article>
        <aside class="paper-card">
          <div class="section-topline">Resumo</div>
          <h2 class="section-title">O que foi importado do PDF</h2>
          <div class="mini-stack" style="margin-top: 1rem;">
            <div class="mini-card"><small>Disciplinas</small><strong>${String(disciplines.length)}</strong><span>componentes reconhecidos</span></div>
            <div class="mini-card"><small>Horários</small><strong>${String(schedule.length)}</strong><span>blocos identificados no semestre</span></div>
            <div class="mini-card"><small>Páginas</small><strong>${escape(String(academicData?.profile?.pages || 0))}</strong><span>lidas do PDF</span></div>
          </div>
        </aside>
      </section>
      <section class="paper-card" style="margin-top: 1rem;">
        <div class="section-topline">Disciplinas</div>
        <h2 class="section-title">Componentes encontrados no PDF</h2>
        <div class="discipline-grid" style="margin-top: 1rem;">
          ${disciplines.length ? disciplines.map(renderDiscipline).join("") : `<div class="empty-state">Ainda não consegui ler disciplinas deste arquivo. Tente reenviar o PDF oficial do SCA.</div>`}
        </div>
      </section>
      <section class="paper-card" style="margin-top: 1rem;">
        <div class="section-topline">Arquivos do aparelho</div>
        <h2 class="section-title">PDFs salvos neste perfil local</h2>
        <p class="section-copy">
          Cada arquivo fica preso a este navegador/aparelho e pode ser definido como o PDF ativo do aluno.
        </p>
        <div class="upload-list" style="margin-top: 1rem;">
          ${state.uploads.length ? state.uploads.map((item) => renderUploadItem(item, activeUpload)).join("") : `<div class="empty-state">Nenhum PDF enviado ainda. Faça o primeiro upload para vincular o arquivo a este perfil local.</div>`}
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
          ${todayClasses.length
            ? `Você tem ${todayClasses.length} bloco${todayClasses.length > 1 ? "s" : ""} programado${todayClasses.length > 1 ? "s" : ""} nesta data.`
            : "Não encontrei aulas nesta data no PDF importado."}
        </p>
        <div class="toast ${nextClass ? "" : "is-warning"}">
          ${nextClass
            ? `Próxima aula: ${escape(nextClass.title)} em ${escape(nextClass.day)} às ${escape(nextClass.startTime)}.`
            : "Ainda não encontrei uma próxima aula a partir da data selecionada."}
        </div>
        <div class="timeline-list" style="margin-top: 1rem;">
          ${activeUpload ? (todayClasses.length ? todayClasses.map(renderSchedule).join("") : `<div class="empty-state">Não há aulas nesta data. Tente mudar a data de referência.</div>`) : renderMissingPdfState("Importe o PDF do SCA para carregar sua agenda de hoje.")}
        </div>
      </article>
      <aside class="paper-card">
        <div class="section-topline">Resumo local</div>
        <h2 class="section-title">${escape(academicData?.profile?.studentName || "Dados do aluno")}</h2>
        <div class="mini-grid" style="margin-top: 1rem;">
          <div class="mini-card"><small>Matrícula</small><strong>${escape(academicData?.profile?.studentId || "não encontrada")}</strong><span>${escape(academicData?.profile?.period || "período não encontrado")}</span></div>
          <div class="mini-card"><small>PDF ativo</small><strong>${activeUpload ? "Selecionado" : "Pendente"}</strong><span>${escape(activeUpload ? activeUpload.originalName : "envie pela aba SCA")}</span></div>
          <div class="mini-card"><small>Disciplinas</small><strong>${String(disciplines.length)}</strong><span>${escape(academicData?.profile?.course || "curso não encontrado")}</span></div>
          <div class="mini-card"><small>Semana</small><strong>${String(weekView.reduce((acc, day) => acc + day.classes.length, 0))}</strong><span>blocos visíveis na semana</span></div>
        </div>
      </aside>
    </section>
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
        <span class="tag">${isActive ? "PDF ativo" : "PDF local"}</span>
        <span class="tag">${escape(getExtractionCaption(item))}</span>
      </div>
      <div class="button-row" style="margin-top: 0.75rem;">
        ${isActive ? "" : `<button class="ghost" data-action="set-active-upload" data-upload-id="${escapeAttribute(item.id)}">Definir como ativo</button>`}
        <button class="ghost" data-action="open-upload" data-upload-id="${escapeAttribute(item.id)}">${state.openingUploadId === item.id ? "Abrindo..." : "Abrir PDF"}</button>
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

  if (action === "login-local") {
    loginLocal();
    return;
  }

  if (action === "logout") {
    logout();
    return;
  }

  if (action === "refresh-uploads") {
    refreshLocalUploads();
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

function onInput(event) {
  if (event.target.id === "loginName") {
    setState({ draftName: event.target.value || "" });
    return;
  }

  if (event.target.id === "loginEmail") {
    setState({ draftEmail: event.target.value || "" });
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

async function loginLocal() {
  if (state.authChecking) return;

  const displayName = normalizePersonName(state.draftName);
  const email = normalizeEmail(state.draftEmail);

  if (!displayName) {
    setState({ authError: "Digite o nome do aluno para abrir o perfil local." });
    return;
  }

  if (!isLikelyEmail(email)) {
    setState({ authError: "Digite um e-mail válido para identificar o aluno neste aparelho." });
    return;
  }

  const user = {
    uid: createLocalUid(email),
    displayName,
    email,
    photoURL: "",
    provider: "local-device",
  };

  try {
    saveSession(user);
    const profile = ensureStoredProfile(user);
    const uploads = await listUploadsForUser(user.uid);
    const nextProfile = ensureActiveUploadProfile(profile, uploads);

    setState({
      authChecking: false,
      authError: "",
      user,
      profile: nextProfile,
      uploads,
      uploadError: "",
      uploadMessage: uploads.length
        ? "Perfil local reencontrado neste aparelho."
        : "Perfil local criado. Agora envie o PDF oficial do SCA.",
      activeTab: uploads.length ? state.activeTab : "sca",
    });
  } catch (error) {
    setState({ authError: `Não consegui abrir o perfil local: ${describeLocalError(error)}` });
  }
}

function logout() {
  clearSession();
  setState({
    authChecking: false,
    authError: "",
    user: null,
    profile: null,
    uploads: [],
    uploadMessage: "",
    uploadError: "",
    uploadProgress: 0,
    openingUploadId: "",
    activeTab: "today",
    syncMessage: "Sessão local encerrada. Os PDFs continuam guardados neste aparelho.",
  });
}

async function refreshLocalUploads() {
  if (!state.user) return;

  try {
    const uploads = await listUploadsForUser(state.user.uid);
    const profile = ensureActiveUploadProfile(loadStoredProfile(state.user.uid) || ensureStoredProfile(state.user), uploads);
    setState({
      profile,
      uploads,
      uploadError: "",
      uploadMessage: uploads.length
        ? "Lista local atualizada com os PDFs deste aparelho."
        : "Ainda não há PDFs salvos para este perfil local.",
    });
  } catch (error) {
    setState({ uploadError: `Não consegui atualizar a lista local: ${describeLocalError(error)}` });
  }
}

async function uploadPdf(file, inputElement) {
  if (!state.user) {
    setState({ uploadError: "Abra um perfil local antes de enviar o PDF.", uploadMessage: "", uploadProgress: 0 });
    inputElement.value = "";
    return;
  }

  if (!isPdfFile(file)) {
    setState({ uploadError: "Selecione um arquivo PDF válido do SCA.", uploadMessage: "", uploadProgress: 0 });
    inputElement.value = "";
    return;
  }

  const uploadId = createUploadId();
  const uploadedAtClient = new Date().toISOString();

  setState({
    uploadError: "",
    uploadMessage: `Lendo ${file.name}...`,
    uploadProgress: 8,
    activeTab: "sca",
  });

  try {
    const academicData = await extractScaPdfData(file, {
      displayName: state.user.displayName,
      studentName: state.user.displayName,
    });

    const record = {
      id: uploadId,
      ownerUid: state.user.uid,
      originalName: file.name,
      normalizedName: normalizeFileName(file.name),
      storagePath: `local://${state.user.uid}/${uploadId}/${normalizeFileName(file.name)}`,
      size: file.size,
      contentType: file.type || "application/pdf",
      status: academicData.schedule.length || academicData.disciplines.length ? "processed" : "limited",
      uploadedAtClient,
      updatedAt: uploadedAtClient,
      notes: academicData.schedule.length || academicData.disciplines.length
        ? "Arquivo importado com sucesso."
        : "Não consegui ler todos os dados acadêmicos deste arquivo.",
      academicData,
      blob: file,
    };

    setState({
      uploadProgress: 56,
      uploadMessage: "Organizando horários, disciplinas e dados do aluno...",
      uploadError: "",
    });

    await saveUploadRecord(record);
    setState({
      uploadProgress: 82,
      uploadMessage: "Salvando os dados deste aluno neste aparelho...",
      uploadError: "",
    });

    const profile = saveStoredProfile({
      ...(loadStoredProfile(state.user.uid) || ensureStoredProfile(state.user)),
      activeUploadId: uploadId,
      activeUploadName: file.name,
      lastUploadAtClient: uploadedAtClient,
      updatedAt: uploadedAtClient,
    });
    const uploads = await listUploadsForUser(state.user.uid);

    setState({
      profile,
      uploads,
      uploadProgress: 100,
      uploadMessage: academicData.schedule.length || academicData.disciplines.length
        ? "PDF importado com sucesso. Sua agenda acadêmica já foi preenchida."
        : "PDF salvo, mas não consegui reconhecer todos os dados acadêmicos.",
      uploadError: "",
      referenceDate: suggestReferenceDate(academicData.schedule, state.referenceDate),
    });
  } catch (error) {
    setState({
      uploadProgress: 0,
      uploadMessage: "",
      uploadError: `Não consegui importar este PDF do SCA: ${describeLocalError(error)}`,
    });
  } finally {
    inputElement.value = "";
  }
}

function setActiveUpload(uploadId) {
  if (!state.user || !uploadId) return;

  const upload = state.uploads.find((item) => item.id === uploadId);
  if (!upload) return;

  const profile = saveStoredProfile({
    ...(loadStoredProfile(state.user.uid) || ensureStoredProfile(state.user)),
    activeUploadId: upload.id,
    activeUploadName: upload.originalName,
    updatedAt: new Date().toISOString(),
  });

  setState({
    profile,
    uploadMessage: `${upload.originalName} agora é o PDF ativo deste perfil local.`,
    uploadError: "",
  });
}

async function openUpload(uploadId) {
  if (!uploadId) return;

  const popup = window.open("", "_blank", "noopener");
  setState({ openingUploadId: uploadId, uploadError: "", uploadMessage: "Abrindo o PDF salvo localmente..." });

  try {
    const record = await getUploadRecord(uploadId);
    if (!record || !record.blob) {
      throw new Error("arquivo não encontrado no armazenamento local");
    }

    const url = URL.createObjectURL(record.blob);

    if (popup) {
      popup.location.href = url;
    } else {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      link.click();
    }

    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    setState({ openingUploadId: "", uploadMessage: `${record.originalName} aberto em nova aba.`, uploadError: "" });
  } catch (error) {
    if (popup) popup.close();
    setState({
      openingUploadId: "",
      uploadError: `Não consegui abrir o PDF local: ${describeLocalError(error)}`,
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

function buildHeroTitle(activeUpload, academicData, todayClasses, nextClass) {
  const name = firstName(academicData?.profile?.studentName || state.user?.displayName || state.user?.email || "Aluno");
  if (!activeUpload) {
    return `${name}, importe seu PDF do SCA para carregar sua agenda acadêmica.`;
  }
  if (todayClasses.length) {
    return `${name}, hoje você tem ${todayClasses.length} compromisso${todayClasses.length > 1 ? "s" : ""} acadêmico${todayClasses.length > 1 ? "s" : ""}.`;
  }
  if (nextClass) {
    return `${name}, sua próxima aula é ${nextClass.title} em ${nextClass.day} às ${nextClass.startTime}.`;
  }
  return `${name}, o PDF ${activeUpload.originalName} foi importado com sucesso.`;
}

function buildHeroSubtitle(academicData) {
  if (!academicData) {
    return "Entre no perfil local do aluno, envie o PDF oficial do SCA e acompanhe a agenda diretamente neste aparelho.";
  }

  const pieces = [
    academicData.profile?.course,
    academicData.profile?.period ? `período ${academicData.profile.period}` : "",
    academicData.summary?.disciplineCount ? `${academicData.summary.disciplineCount} disciplina${academicData.summary.disciplineCount > 1 ? "s" : ""}` : "",
    academicData.summary?.classCount ? `${academicData.summary.classCount} bloco${academicData.summary.classCount > 1 ? "s" : ""} de aula` : "",
  ].filter(Boolean);

  return pieces.length
    ? `Dados importados do PDF do SCA: ${pieces.join(" • ")}.`
    : "O arquivo está salvo, mas ainda não consegui extrair informações suficientes deste PDF.";
}

function getActiveUpload() {
  if (!state.uploads.length) return null;
  const activeId = state.profile?.activeUploadId || "";
  return state.uploads.find((item) => item.id === activeId) || state.uploads[0] || null;
}

function getAcademicData(upload) {
  return upload?.academicData || null;
}

function getExtractionCaption(upload) {
  if (!upload) {
    return "aguardando o primeiro PDF";
  }

  const academicData = getAcademicData(upload);
  if (academicData?.summary?.classCount || academicData?.summary?.disciplineCount) {
    return `${academicData.summary.disciplineCount || 0} disciplinas e ${academicData.summary.classCount || 0} blocos identificados`;
  }

  return "arquivo salvo, mas sem dados suficientes";
}

function getUploadStatusLabel(upload) {
  if (!upload) return "Sem arquivo";
  if (upload.status === "processed") return "Importado";
  if (upload.status === "limited") return "Importado parcialmente";
  if (upload.status === "uploaded") return "Salvo";
  return upload.status || "Salvo";
}

function getStatusMessage() {
  return state.uploadError || state.authError || state.uploadMessage || state.syncMessage;
}

function renderMissingPdfState(message) {
  return `
    <div class="empty-state">
      ${escape(message)}
      <div class="button-row" style="margin-top: 0.75rem;">
        <button class="ghost" data-action="set-tab" data-tab="sca">Abrir SCA</button>
      </div>
    </div>
  `;
}

function renderDayColumn(day) {
  return `
    <article class="day-column ${day.isReference ? "is-reference" : ""}">
      <header class="day-header">
        <div class="week-card-top">
          <h3>${escape(day.label)}</h3>
          <span class="day-badge">${String(day.classes.length)}</span>
        </div>
        <p>${escape(formatLongDate(day.date))}</p>
      </header>
      <div class="day-body">
        ${day.classes.length ? day.classes.map(renderSchedule).join("") : `<div class="empty-day">Sem aulas nesta data.</div>`}
      </div>
    </article>
  `;
}

function renderSchedule(item) {
  return `
    <article class="schedule-item" data-type="${escape(item.type || "Aula")}">
      <div class="schedule-title-row">
        <div>
          <h3 class="schedule-title">${escape(item.title)}</h3>
          <div class="support-line">${escape(item.group || "Turma")} • ${escape(item.type || "Aula")}</div>
        </div>
        <div class="schedule-time">${escape(item.startTime)} - ${escape(item.endTime)}</div>
      </div>
      <div class="item-meta">
        <span class="tag">${escape(item.teacher || "Docente não informado")}</span>
      </div>
      <div class="support-line">${escape(shortRange(item.startDate, item.endDate))}</div>
    </article>
  `;
}

function renderDiscipline(item) {
  return `
    <article class="discipline-item">
      <div class="discipline-head">
        <div>
          <div class="discipline-code">${escape(item.code || "Sem código")}</div>
          <h3 class="discipline-title">${escape(item.name)}</h3>
        </div>
        <span class="tag">${escape(item.workload ? `${item.workload} h/a` : "Carga não informada")}</span>
      </div>
      <dl>
        <div><dt>Docente</dt><dd>${escape(item.teacher || "Não informado")}</dd></div>
        <div><dt>E-mail</dt><dd>${escape(item.email || "Não informado")}</dd></div>
        <div><dt>Vigência</dt><dd>${escape(item.period || "Não informada")}</dd></div>
      </dl>
    </article>
  `;
}

function getClassesForDate(schedule, isoDate) {
  const day = toDate(isoDate);
  return schedule
    .filter((item) => item.weekday === day.getDay() && day >= toDate(item.startDate) && day <= toDate(item.endDate))
    .sort((left, right) => left.startTime.localeCompare(right.startTime));
}

function buildWeekView(schedule, referenceDate) {
  const monday = weekStart(toDate(referenceDate));
  return Array.from({ length: 5 }, (_, index) => {
    const date = addDays(monday, index);
    const isoDate = toISO(date);
    return {
      date: isoDate,
      label: weekdays[date.getDay()],
      isReference: isoDate === referenceDate,
      classes: getClassesForDate(schedule, isoDate),
    };
  });
}

function findNextClass(schedule, referenceDate) {
  const start = toDate(referenceDate);
  for (let offset = 0; offset < 21; offset += 1) {
    const date = addDays(start, offset);
    const classes = getClassesForDate(schedule, toISO(date));
    if (classes.length) {
      return classes[0];
    }
  }
  return null;
}

function suggestReferenceDate(schedule, fallbackDate) {
  if (!schedule.length) {
    return fallbackDate;
  }

  const today = toISO(new Date());
  const todayClasses = getClassesForDate(schedule, today);
  if (todayClasses.length) {
    return today;
  }

  const next = findNextClass(schedule, today);
  return next ? next.startDate : fallbackDate;
}

function weekTitle(referenceDate) {
  const monday = weekStart(toDate(referenceDate));
  const friday = addDays(monday, 4);
  return `Semana de ${monday.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} a ${friday.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;
}

function shortRange(startDate, endDate) {
  const start = toDate(startDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  const end = toDate(endDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  return `${start} até ${end}`;
}

function loadUiState() {
  try {
    return JSON.parse(localStorage.getItem(UI_STORAGE_KEY) || "{}");
  } catch (error) {
    return {};
  }
}

function persistUiState() {
  localStorage.setItem(
    UI_STORAGE_KEY,
    JSON.stringify({
      activeTab: state.activeTab,
      referenceDate: state.referenceDate,
      menu: state.menu,
      lastMenuSync: state.lastMenuSync,
      syncMessage: state.syncMessage,
      draftName: state.draftName,
      draftEmail: state.draftEmail,
    }),
  );
}

function setState(patch) {
  state = { ...state, ...patch };
  persistUiState();
  render();
}

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || "null");
  } catch (error) {
    return null;
  }
}

function saveSession(user) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

function profileStorageKey(uid) {
  return `${PROFILE_STORAGE_PREFIX}${uid}`;
}

function loadStoredProfile(uid) {
  if (!uid) return null;

  try {
    return JSON.parse(localStorage.getItem(profileStorageKey(uid)) || "null");
  } catch (error) {
    return null;
  }
}

function ensureStoredProfile(user) {
  const current = loadStoredProfile(user.uid);
  if (current) return current;

  return saveStoredProfile({
    uid: user.uid,
    displayName: user.displayName || "",
    email: user.email || "",
    activeUploadId: "",
    activeUploadName: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

function ensureActiveUploadProfile(profile, uploads) {
  if (!profile || !uploads.length || profile.activeUploadId) {
    return profile;
  }

  return saveStoredProfile({
    ...profile,
    activeUploadId: uploads[0].id,
    activeUploadName: uploads[0].originalName,
    updatedAt: new Date().toISOString(),
  });
}

function saveStoredProfile(profile) {
  localStorage.setItem(profileStorageKey(profile.uid), JSON.stringify(profile));
  return profile;
}

function openLocalDb() {
  if (localDbPromise) return localDbPromise;

  localDbPromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB não está disponível"));
      return;
    }

    const request = window.indexedDB.open(LOCAL_DB_NAME, LOCAL_DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      let store;

      if (!database.objectStoreNames.contains(UPLOAD_STORE)) {
        store = database.createObjectStore(UPLOAD_STORE, { keyPath: "id" });
      } else {
        store = request.transaction.objectStore(UPLOAD_STORE);
      }

      if (!store.indexNames.contains("ownerUid")) {
        store.createIndex("ownerUid", "ownerUid", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Falha ao abrir o banco local"));
  });

  return localDbPromise;
}

async function saveUploadRecord(record) {
  const database = await openLocalDb();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(UPLOAD_STORE, "readwrite");
    const store = transaction.objectStore(UPLOAD_STORE);
    const request = store.put(record);

    request.onsuccess = () => resolve(record);
    request.onerror = () => reject(request.error || new Error("Falha ao salvar o PDF local"));
  });
}

async function getUploadRecord(uploadId) {
  const database = await openLocalDb();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(UPLOAD_STORE, "readonly");
    const store = transaction.objectStore(UPLOAD_STORE);
    const request = store.get(uploadId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error("Falha ao abrir o PDF local"));
  });
}

async function listUploadsForUser(ownerUid) {
  const database = await openLocalDb();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(UPLOAD_STORE, "readonly");
    const store = transaction.objectStore(UPLOAD_STORE);
    const index = store.index("ownerUid");
    const request = index.getAll(ownerUid);

    request.onsuccess = () => {
      const uploads = (request.result || [])
        .map((item) => {
          const { blob, ...metadata } = item;
          return metadata;
        })
        .sort((left, right) => String(right.uploadedAtClient || "").localeCompare(String(left.uploadedAtClient || "")));
      resolve(uploads);
    };

    request.onerror = () => reject(request.error || new Error("Falha ao listar os PDFs locais"));
  });
}

function describeLocalError(error) {
  return error?.message || "erro desconhecido";
}

function createLocalUid(email) {
  let hash = 0;
  const normalized = normalizeEmail(email);

  for (let index = 0; index < normalized.length; index += 1) {
    hash = ((hash << 5) - hash) + normalized.charCodeAt(index);
    hash |= 0;
  }

  return `local-${Math.abs(hash).toString(36)}-${normalized.split("@")[0].slice(0, 12)}`;
}

function createUploadId() {
  return `upload-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizePersonName(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isLikelyEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
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

const weekdays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

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

function addDays(date, amount) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + amount);
  return next;
}

function weekStart(date) {
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  return addDays(date, offset);
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
