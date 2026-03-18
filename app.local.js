import { extractScaPdfData } from "./sca-parser.js";

const APP_NAME = "Agenda DAGV";
const APP_MARK = "DAGV";
const APP_TAGLINE = "Horários, RU e SCA no espaço do DA";
const DA_PORTAL_URL = "https://dagvmeduftm.wordpress.com/";

const UI_STORAGE_KEY = "uftm-mobile-local-ui-v1";
const SESSION_STORAGE_KEY = "uftm-mobile-local-session-v1";
const PROFILE_STORAGE_PREFIX = "uftm-mobile-local-profile-";
const LOCAL_DB_NAME = "uftm-mobile-local-db";
const LOCAL_DB_VERSION = 1;
const UPLOAD_STORE = "uploads";

const MAIN_NAV_ITEMS = [
  { id: "home", label: "Página inicial" },
  { id: "elections", label: "Eleições DAGV" },
  { id: "dagv", label: "DAGV" },
  { id: "coordination", label: "Coordenação" },
  { id: "agenda", label: "Agenda Medicina" },
  { id: "info", label: "Informações" },
  { id: "links", label: "Links" },
  { id: "academic", label: "Acadêmico" },
];

const PORTAL_TABS = new Set(["home", "elections", "dagv", "coordination", "agenda", "info", "links"]);

const AGENDA_NAV_ITEMS = [
  { id: "today", label: "Hoje" },
  { id: "week", label: "Semana" },
  { id: "menu", label: "RU" },
  { id: "sca", label: "SCA" },
];

const DAGV_LINKS = [
  { title: "Portal do DAGV", caption: "Página principal do diretório", href: "https://dagvmeduftm.wordpress.com/" },
  { title: "Eleições DAGV", caption: "Acompanhe editais e chamadas", href: "https://dagvmeduftm.wordpress.com/eleicoes-dagv/" },
  { title: "Estatuto", caption: "Base institucional do diretório", href: "https://dagvmeduftm.wordpress.com/dagv/estatuto-dagv/" },
  { title: "Localização", caption: "Onde encontrar o DAGV", href: "https://dagvmeduftm.wordpress.com/dagv/localizacao/" },
  { title: "Galeria de fotos", caption: "Registro visual do diretório", href: "https://dagvmeduftm.wordpress.com/dagv/galeria-de-fotos/" },
];

const COORDINATION_LINKS = [
  { title: "Coordenação Geral", caption: "Gestão principal do DAGV", href: "https://dagvmeduftm.wordpress.com/coordenacao/coordenacao-geral/" },
  { title: "Secretaria Geral", caption: "Documentos e organização", href: "https://dagvmeduftm.wordpress.com/coordenacao/secretaria-geral/" },
  { title: "Finanças e Patrimônio", caption: "Recursos e estrutura", href: "https://dagvmeduftm.wordpress.com/coordenacao/coordenacao-de-financas-e-patrimonio/" },
  { title: "Comunicação", caption: "Divulgação e identidade", href: "https://dagvmeduftm.wordpress.com/coordenacao/coordenacao-de-comunicacao/" },
  { title: "Ensino, Pesquisa e Extensão", caption: "Projetos acadêmicos", href: "https://dagvmeduftm.wordpress.com/coordenacao/coordenacao-de-ensino-pesquisa-e-extensao/" },
  { title: "Sociocultural", caption: "Ações e eventos", href: "https://dagvmeduftm.wordpress.com/coordenacao/coordenacao-sociocultural/" },
  { title: "Representação Estudantil", caption: "Relação institucional", href: "https://dagvmeduftm.wordpress.com/coordenacao/coordenacao-de-representacao-estudantil/" },
  { title: "Desenvolvimento Tecnológico", caption: "Ferramentas do diretório", href: "https://dagvmeduftm.wordpress.com/coordenacao/coordenacao-de-desenvolvimento-tecnologico/" },
];

const INFO_LINKS = [
  { title: "Eventos Acadêmicos", caption: "Calendário e oportunidades", href: "https://dagvmeduftm.wordpress.com/agenda-medicina/eventos-academicos/" },
  { title: "Festas", caption: "Agenda social do curso", href: "https://dagvmeduftm.wordpress.com/festas/" },
  { title: "DENEM", caption: "Movimento estudantil nacional", href: "https://dagvmeduftm.wordpress.com/informacoes-2/denem/" },
  { title: "DCE UFTM", caption: "Diretório central dos estudantes", href: "https://dagvmeduftm.wordpress.com/informacoes-2/dce-uftm/" },
  { title: "Exigências Horárias", caption: "Carga e horas complementares", href: "https://dagvmeduftm.wordpress.com/informacoes-2/exigencias-horarias/" },
  { title: "CVU Uberaba", caption: "Referências da cidade", href: "https://dagvmeduftm.wordpress.com/informacoes-2/cvu-uberaba/" },
  { title: "CEPOP UFTM", caption: "Espaços e serviços", href: "https://dagvmeduftm.wordpress.com/informacoes-2/cepop-uftm/" },
  { title: "PET Medicina", caption: "Programa PET", href: "https://dagvmeduftm.wordpress.com/informacoes-2/pet-medicina/" },
  { title: "Cursinho Carolina", caption: "Projeto educacional", href: "https://dagvmeduftm.wordpress.com/informacoes-2/cursinho-carolina/" },
  { title: "Ligas Acadêmicas", caption: "Organizações estudantis", href: "https://dagvmeduftm.wordpress.com/informacoes-2/ligas-academicas/" },
  { title: "Instagram", caption: "Canal social do DA", href: "https://dagvmeduftm.wordpress.com/informacoes-2/instagram/" },
];

const LINKS_TAB_ITEMS = [
  { title: "Portal do DAGV", caption: "Navegação completa do WordPress", href: "https://dagvmeduftm.wordpress.com/" },
  { title: "Loja Online DAGV", caption: "Produtos e arrecadação", href: "https://dagvmeduftm.wordpress.com/links/loja-online-dagv/" },
  { title: "Divulgação de Alunos", caption: "Espaço para comunicados", href: "https://dagvmeduftm.wordpress.com/links/divulgacao-alunos/" },
  { title: "Festas", caption: "Eventos sociais do curso", href: "https://dagvmeduftm.wordpress.com/festas/" },
  { title: "Instagram", caption: "Canal social do DA", href: "https://dagvmeduftm.wordpress.com/informacoes-2/instagram/" },
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
let persistentUploadsAvailable = true;
let persistentUploadsIssue = "";

let state = {
  activeTab: uiState.activeTab || "home",
  agendaTab: uiState.agendaTab || "today",
  referenceDate: uiState.referenceDate || toISO(new Date()),
  menu: Array.isArray(uiState.menu) && uiState.menu.length ? uiState.menu : defaultMenu,
  lastMenuSync: uiState.lastMenuSync || "",
  syncMessage: uiState.syncMessage || "Buscando o cardápio da Abadia para o painel do DA.",
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
  portalContent: {},
  newsFeed: [],
  portalLoadingTab: "",
  portalError: "",
};

appElement.addEventListener("click", onClick);
appElement.addEventListener("change", onChange);
appElement.addEventListener("input", onInput);

init().catch((error) => {
  console.error("Falha ao iniciar o painel local do DAGV.", error);
  appElement.innerHTML = renderStartupFailure(error);
});

async function init() {
  render();

  try {
    await openLocalDb();
  } catch (error) {
    persistentUploadsAvailable = false;
    persistentUploadsIssue = describeLocalError(error);
  }

  try {
    await restoreLocalSession();
  } catch (error) {
    setState({
      authChecking: false,
      authError: `Não consegui abrir o perfil local deste aparelho: ${describeLocalError(error)}`,
    });
  }

  loadPortalTab("home", true);
  refreshRuMenu(true);
}

async function restoreLocalSession() {
  const session = loadSession();
  if (!session) {
    setState({
      authChecking: false,
      authError: persistentUploadsAvailable ? "" : buildSessionStorageMessage(),
      syncMessage: persistentUploadsAvailable
        ? "Painel do DA pronto. Abra seu perfil neste aparelho para enviar o PDF do SCA."
        : "Painel do DA pronto em modo de sessão. Abra seu perfil para importar o PDF mesmo sem armazenamento persistente.",
    });
    return;
  }

  const profile = ensureStoredProfile(session);
  const uploads = persistentUploadsAvailable
    ? mergeUploads(await listUploadsForUser(session.uid), getTransientUploadsForUser(session.uid))
    : getSessionUploadsForUser(session.uid);
  const nextProfile = ensureActiveUploadProfile(profile, uploads);

  setState({
    authChecking: false,
    authError: persistentUploadsAvailable ? "" : buildSessionStorageMessage(),
    user: session,
    profile: nextProfile,
    uploads,
    uploadError: "",
    uploadMessage: uploads.length
      ? "Perfil restaurado com seus arquivos salvos neste aparelho."
      : persistentUploadsAvailable
        ? "Perfil restaurado. Envie o primeiro PDF do SCA."
        : "Perfil restaurado em modo de sessão. O PDF ficará disponível até recarregar a página.",
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
    <div class="app-view ios-shell">
      <header class="header-bar">
        <div class="header-brand">
          <span class="brand-mark">${APP_MARK}</span>
          <div class="header-copy">
            <h1>${APP_NAME}</h1>
            <p>${APP_TAGLINE}</p>
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
              <strong>${escape(state.user.displayName || "Aluno")}</strong>
              <span>${escape(state.user.email || state.user.uid)}</span>
            </div>
          </div>
          <button class="ghost" data-action="set-main-tab" data-tab="home">Início</button>
          <button class="ghost" data-action="sync-ru">Atualizar RU</button>
          <button class="ghost" data-action="logout">Trocar aluno</button>
        </div>
      </header>

      <section class="hero-card">
        <div class="hero-content">
          <div class="hero-topline">Aplicativo do diretório acadêmico</div>
          <div class="hero-band">
            <span class="hero-chip">Perfil ${escape(shortUid(state.user.uid))}</span>
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
              <button class="secondary" data-action="open-academic-tab" data-tab="${academicData ? "today" : "sca"}">${academicData ? "Ver agenda" : "Importar PDF"}</button>
              <button class="ghost" data-action="set-main-tab" data-tab="dagv">Explorar o DAGV</button>
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

      <nav class="primary-nav" aria-label="Abas do DAGV">
        ${MAIN_NAV_ITEMS.map(renderMainTabButton).join("")}
      </nav>

      ${renderMainPanel(activeUpload)}
    </div>
  `;
}

function renderLogin() {
  const canLogin = !state.authChecking;
  const loginLabel = state.authChecking ? "Abrindo armazenamento local..." : "Entrar neste aparelho";
  const setupTitle = state.authChecking
    ? "Preparando o painel local do DA."
    : "Crie um perfil local do aluno para usar horários, RU e SCA sem depender de serviço pago.";

  return `
    <div class="login-layout">
      <section class="login-card">
        <span class="eyebrow">Painel do DA</span>
        <h1>${APP_NAME}, pronto para guardar o PDF do SCA no aparelho.</h1>
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
          <a class="ghost link-button" href="${escapeAttribute(DA_PORTAL_URL)}" target="_blank" rel="noreferrer">Portal do DA</a>
          <button class="ghost" data-action="sync-ru">Atualizar RU</button>
        </div>
        <div class="toast ${state.authError ? "is-warning" : ""}" style="margin-top: 1rem;">
          ${escape(state.authError || state.syncMessage || "Os dados do aluno e os PDFs ficarão salvos localmente neste navegador.")}
        </div>
        <div class="facts-grid" style="margin-top: 1.25rem;">
          <div class="fact"><strong>Sem calção</strong><p>não depende de serviço pago</p></div>
          <div class="fact"><strong>Do DA</strong><p>marca e entrada centralizadas no diretório</p></div>
          <div class="fact"><strong>Local</strong><p>perfil e PDFs ficam no aparelho</p></div>
        </div>
      </section>

      <aside class="preview-card">
        <span class="eyebrow">Identidade DAGV</span>
        <h2 class="preview-title">Horários, RU e SCA reunidos em um painel do DA.</h2>
        <p class="preview-copy">
          O aluno entra neste navegador, envia o PDF real do SCA e acompanha agenda, semana e RU em uma interface pensada para o diretório acadêmico.
        </p>
        <div class="pill-grid">
          <div class="preview-pill"><strong>Painel do DA</strong><span>atalho direto para o portal estudantil</span></div>
          <div class="preview-pill"><strong>PDF local</strong><span>armazenado com IndexedDB no aparelho</span></div>
          <div class="preview-pill"><strong>Agenda real</strong><span>horários e disciplinas saem do SCA</span></div>
        </div>
        <div class="mini-stack">
          <div class="mini-card"><small>Passo 1</small><strong>Entrar</strong><span>use nome e e-mail do aluno</span></div>
          <div class="mini-card"><small>Passo 2</small><strong>Enviar PDF</strong><span>o arquivo fica salvo no aparelho</span></div>
          <div class="mini-card"><small>Passo 3</small><strong>Acompanhar o dia</strong><span>aulas e RU ficam prontos após a leitura</span></div>
        </div>
      </aside>
    </div>
  `;
}

function renderStartupFailure(error) {
  return `
    <div class="login-layout">
      <section class="login-card">
        <span class="eyebrow">Painel do DA</span>
        <h1>Não consegui iniciar o painel local.</h1>
        <p>O aplicativo encontrou um erro logo na abertura. Recarregue a página ou abra o portal oficial do diretório.</p>
        <div class="toast is-warning" style="margin-top: 1rem;">
          ${escape(describeLocalError(error))}
        </div>
        <div class="login-actions" style="margin-top: 1rem;">
          <button class="cta" data-action="reload-app">Tentar novamente</button>
          <a class="ghost link-button" href="${escapeAttribute(DA_PORTAL_URL)}" target="_blank" rel="noreferrer">Portal do DA</a>
        </div>
      </section>
    </div>
  `;
}

function renderMainPanel(activeUpload) {
  if (state.activeTab === "academic") {
    return renderAcademicPanel(activeUpload);
  }

  return renderPortalTab(activeUpload);
}

function renderPortalTab(activeUpload) {
  const academicData = getAcademicData(activeUpload);
  const schedule = academicData?.schedule || [];
  const disciplines = academicData?.disciplines || [];
  const todayClasses = getClassesForDate(schedule, state.referenceDate);
  const nextClass = findNextClass(schedule, state.referenceDate);
  const menu = state.menu[0] || null;
  const tabContent = state.portalContent[state.activeTab];
  const pages = tabContent?.pages || [];
  const titleMap = {
    home: "Página inicial",
    elections: "Eleições DAGV",
    dagv: "DAGV",
    coordination: "Coordenação",
    agenda: "Agenda Medicina",
    info: "Informações",
    links: "Links",
  };
  const descriptionMap = {
    home: "Página inicial do diretório com visão geral, notícias e destaques do dia.",
    elections: "Os gestores atualizam esta área no portal do DAGV e o aplicativo acompanha as mudanças.",
    dagv: "Conteúdo institucional do DAGV incorporado no aplicativo, sem redirecionar o aluno.",
    coordination: "Páginas das coordenações carregadas no app para consulta móvel.",
    agenda: "Eventos acadêmicos e festas mostrados dentro da experiência do aplicativo.",
    info: "Informações úteis do curso e da universidade incorporadas ao app.",
    links: "Projetos e acessos do DAGV reunidos em leitura nativa.",
  };

  return `
    <section class="section-stack">
      ${state.activeTab === "home" ? `
        <section class="overview-grid">
          <article class="paper-card compact-card">
            <div class="section-topline">Resumo do dia</div>
            <h2 class="section-title">${escape(formatLongDate(state.referenceDate))}</h2>
            <p class="section-copy">
              ${todayClasses.length
                ? `Você tem ${todayClasses.length} bloco${todayClasses.length > 1 ? "s" : ""} nesta data.`
                : "Ainda não há aulas nesta data ou o PDF ainda não foi enviado."}
            </p>
            <div class="toast ${nextClass ? "" : "is-warning"}" style="margin-top: 1rem;">
              ${nextClass
                ? `Próxima aula: ${escape(nextClass.title)} em ${escape(nextClass.day)} às ${escape(nextClass.startTime)}.`
                : "Sem próxima aula encontrada no período visível."}
            </div>
            <div class="button-row" style="margin-top: 1rem;">
              <button class="secondary" data-action="open-academic-tab" data-tab="${academicData ? "today" : "sca"}">${academicData ? "Abrir agenda" : "Enviar PDF"}</button>
            </div>
          </article>

          <article class="paper-card compact-card">
            <div class="section-topline">RU Abadia</div>
            <h2 class="section-title">${escape(menu?.mainDish || "Cardápio ainda indisponível")}</h2>
            <p class="section-copy">${escape(menu ? `${menu.day} • ${formatDateShort(menu.date)}` : "Sem atualização disponível no momento.")}</p>
            <div class="mini-stack" style="margin-top: 1rem;">
              <div class="mini-card"><small>Opção</small><strong>${escape(menu?.option || "aguardando")}</strong><span>alternativa do dia</span></div>
              <div class="mini-card"><small>Sobremesa</small><strong>${escape(menu?.dessert || "aguardando")}</strong><span>extra do RU</span></div>
            </div>
            <div class="button-row" style="margin-top: 1rem;">
              <button class="ghost" data-action="open-academic-tab" data-tab="menu">Abrir RU</button>
            </div>
          </article>
        </section>

        <section class="shortcut-grid">
          ${renderShortcutCard("Eleições DAGV", "Chamadas e atualizações do diretório", "set-main-tab", "elections")}
          ${renderShortcutCard("DAGV", "História, estatuto e galeria", "set-main-tab", "dagv")}
          ${renderShortcutCard("Coordenação", "Gestão e frentes ativas", "set-main-tab", "coordination")}
          ${renderShortcutCard("Agenda Medicina", "Eventos e festas do curso", "set-main-tab", "agenda")}
          ${renderShortcutCard("Informações", "Recados e apoios institucionais", "set-main-tab", "info")}
          ${renderShortcutCard("Links", "Projetos e acessos rápidos", "set-main-tab", "links")}
          ${renderShortcutCard("Acadêmico", "Hoje, semana, RU e SCA", "set-main-tab", "academic")}
        </section>
      ` : ""}

      <section class="paper-card agenda-shell">
        <div class="section-topline">${escape(titleMap[state.activeTab] || "Portal DAGV")}</div>
        <h2 class="section-title">${escape(titleMap[state.activeTab] || "Portal DAGV")}</h2>
        <p class="section-copy">${escape(descriptionMap[state.activeTab] || "Conteúdo do DAGV carregado dentro do aplicativo.")}</p>
        <div class="button-row" style="margin-top: 1rem;">
          <button class="ghost" data-action="refresh-portal-tab" data-tab="${escapeAttribute(state.activeTab)}">${state.portalLoadingTab === state.activeTab ? "Atualizando..." : "Atualizar conteúdo"}</button>
          ${state.activeTab === "home" ? `<button class="ghost" data-action="set-main-tab" data-tab="academic">Abrir área acadêmica</button>` : ""}
        </div>
        ${state.portalError && state.portalLoadingTab !== state.activeTab ? `<div class="toast is-warning" style="margin-top: 1rem;">${escape(state.portalError)}</div>` : ""}
      </section>

      ${state.newsFeed.length ? `
        <section class="section-stack">
          <div class="section-topline">News do dia</div>
          <div class="link-grid">
            ${state.newsFeed.slice(0, 4).map(renderNewsCard).join("")}
          </div>
        </section>
      ` : ""}

      ${state.portalLoadingTab === state.activeTab && !pages.length
        ? `<div class="empty-state">Carregando o conteúdo atualizado do DAGV...</div>`
        : pages.length
          ? `<section class="section-stack">${pages.map(renderPortalPage).join("")}</section>`
          : `<div class="empty-state">Ainda não consegui carregar o conteúdo desta aba. Toque em atualizar para tentar novamente.</div>`}

      ${state.activeTab === "home" ? `
        <section class="panel-grid">
          <article class="paper-card">
            <div class="section-topline">Prévia acadêmica</div>
            <h2 class="section-title">${escape(academicData?.profile?.studentName || state.user.displayName || "Aluno")}</h2>
            <div class="mini-grid" style="margin-top: 1rem;">
              <div class="mini-card"><small>PDF ativo</small><strong>${activeUpload ? "Selecionado" : "Pendente"}</strong><span>${escape(activeUpload ? activeUpload.originalName : "envie o PDF do SCA")}</span></div>
              <div class="mini-card"><small>Disciplinas</small><strong>${String(disciplines.length)}</strong><span>${escape(academicData?.profile?.course || "curso não identificado")}</span></div>
              <div class="mini-card"><small>Próxima</small><strong>${escape(nextClass?.startTime || "--:--")}</strong><span>${escape(nextClass?.title || "sem aula futura")}</span></div>
              <div class="mini-card"><small>Sincronização RU</small><strong>${escape(formatShortDateTime(state.lastMenuSync))}</strong><span>${escape(state.syncMessage)}</span></div>
            </div>
          </article>
          <article class="paper-card">
            <div class="section-topline">Gestão de conteúdo</div>
            <h2 class="section-title">Os gestores atualizam no portal do DAGV, e o app acompanha.</h2>
            <p class="section-copy">
              O aplicativo agora incorpora páginas e notícias do portal do DAGV sem tirar o aluno da experiência móvel.
            </p>
          </article>
        </section>
      ` : ""}
    </section>
  `;
}

function renderAcademicPanel(activeUpload) {
  const academicData = getAcademicData(activeUpload);
  const schedule = academicData?.schedule || [];
  const disciplines = academicData?.disciplines || [];
  const todayClasses = getClassesForDate(schedule, state.referenceDate);
  const weekView = buildWeekView(schedule, state.referenceDate);
  const nextClass = findNextClass(schedule, state.referenceDate);

  if (state.agendaTab === "week") {
    if (!activeUpload) {
      return renderMissingPdfState("Importe o PDF do SCA para montar sua semana acadêmica.");
    }

    return `
      <section class="section-stack">
        ${renderAgendaHeader("Semana acadêmica", "Sua visão acadêmica semanal dentro do aplicativo.")}
        <section class="paper-card">
          <div class="section-topline">Semana acadêmica</div>
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
      </section>
    `;
  }

  if (state.agendaTab === "menu") {
    return `
      <section class="section-stack">
        ${renderAgendaHeader("RU", "Acesso rápido ao cardápio diário dentro da área acadêmica.")}
        <section class="panel-grid">
          <article class="paper-card">
            <div class="section-topline">Cardápio RU</div>
            <h2 class="section-title">Cardápio do dia da Unidade Abadia</h2>
            <p class="section-copy">
              O painel consulta a publicação oficial do RU e mostra apenas o cardápio do dia, sem tirar o foco da identidade do DA.
            </p>
            <div class="menu-grid" style="margin-top: 1rem;">
              ${state.menu.map(renderMenuCard).join("")}
            </div>
          </article>
          <aside class="timeline-card">
            <div class="timeline-topline">Sincronização</div>
            <h2 class="section-title">Atualização diária do RU da Abadia</h2>
            <div class="mini-stack" style="margin-top: 1rem;">
              <div class="mini-card"><small>Última publicação oficial</small><strong>${escape(formatShortDateTime(state.menu[0]?.updatedAt))}</strong><span>arquivo da Abadia</span></div>
              <div class="mini-card"><small>Última verificação</small><strong>${escape(formatShortDateTime(state.lastMenuSync))}</strong><span>atualização do aparelho</span></div>
              <div class="mini-card"><small>Status</small><strong>${escape(state.syncMessage)}</strong><span>fonte oficial do RU</span></div>
            </div>
          </aside>
        </section>
      </section>
    `;
  }

  if (state.agendaTab === "sca") {
    return `
      <section class="section-stack">
        ${renderAgendaHeader("SCA", "Importe e revise o PDF do aluno dentro da área acadêmica.")}
        <section class="upload-grid">
          <article class="upload-card">
            <div class="section-topline">Upload SCA</div>
            <h2 class="section-title">Envie o PDF real do aluno</h2>
            <p class="section-copy">
              O arquivo oficial do SCA fica salvo neste aparelho e, quando reconhecido, preenche a agenda do DA com aulas, semana e disciplinas.
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
              <div class="mini-card"><small>Aluno</small><strong>${escape(state.user.displayName || "Aluno")}</strong><span>${escape(state.user.email || state.user.uid)}</span></div>
              <div class="mini-card"><small>Status do arquivo</small><strong>${escape(getUploadStatusLabel(activeUpload))}</strong><span>${escape(getExtractionCaption(activeUpload))}</span></div>
              <div class="mini-card"><small>Último envio</small><strong>${escape(activeUpload ? formatShortDateTime(activeUpload.uploadedAtClient) : "sem envio")}</strong><span>${escape(activeUpload ? formatBytes(activeUpload.size) : "aguardando PDF")}</span></div>
            </div>
          </aside>
        </section>
        <section class="panel-grid">
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
        <section class="paper-card">
          <div class="section-topline">Disciplinas</div>
          <h2 class="section-title">Componentes encontrados no PDF</h2>
          <div class="discipline-grid" style="margin-top: 1rem;">
            ${disciplines.length ? disciplines.map(renderDiscipline).join("") : `<div class="empty-state">Ainda não consegui ler disciplinas deste arquivo. Tente reenviar o PDF oficial do SCA.</div>`}
          </div>
        </section>
        <section class="paper-card">
          <div class="section-topline">Arquivos do aparelho</div>
          <h2 class="section-title">PDFs salvos neste perfil local</h2>
          <p class="section-copy">
            Cada arquivo fica preso a este navegador/aparelho e pode ser definido como o PDF ativo do aluno.
          </p>
          <div class="upload-list" style="margin-top: 1rem;">
            ${state.uploads.length ? state.uploads.map((item) => renderUploadItem(item, activeUpload)).join("") : `<div class="empty-state">Nenhum PDF enviado ainda. Faça o primeiro upload para vincular o arquivo a este perfil local.</div>`}
          </div>
        </section>
      </section>
    `;
  }

  return `
    <section class="section-stack">
      ${renderAgendaHeader("Hoje", "Visualização diária do aluno dentro do aplicativo.")}
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
    </section>
  `;
}

function renderAgendaHeader(title, description) {
  return `
    <section class="paper-card agenda-shell">
      <div class="section-topline">Acadêmico</div>
      <h2 class="section-title">${escape(title)}</h2>
      <p class="section-copy">${escape(description)}</p>
      <div class="segmented-control" style="margin-top: 1rem;">
        ${AGENDA_NAV_ITEMS.map(renderAgendaTabButton).join("")}
      </div>
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
        ${item.isTransient ? `<span class="tag">Só nesta sessão</span>` : ""}
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

function renderMainTabButton(item) {
  return `
    <button class="tab-button ${state.activeTab === item.id ? "is-active" : ""}" data-action="set-main-tab" data-tab="${item.id}">
      ${item.label}
    </button>
  `;
}

function renderAgendaTabButton(item) {
  return `
    <button class="segmented-button ${state.agendaTab === item.id ? "is-active" : ""}" data-action="set-agenda-tab" data-tab="${item.id}">
      ${item.label}
    </button>
  `;
}

function renderPortalPage(page) {
  return `
    <article class="paper-card portal-page">
      <div class="portal-page-head">
        <div>
          <div class="section-topline">${escape(page.sourceLabel || "DAGV")}</div>
          <h3 class="section-title">${escape(page.title || "Página")}</h3>
        </div>
        ${page.publishedAt ? `<span class="tag">${escape(formatShortDateTime(page.publishedAt))}</span>` : ""}
      </div>
      ${page.image ? `<img class="portal-image" src="${escapeAttribute(page.image)}" alt="${escapeAttribute(page.title || "Imagem da página")}" />` : ""}
      ${page.summary ? `<p class="section-copy">${escape(page.summary)}</p>` : ""}
      <div class="portal-blocks">
        ${(page.blocks || []).map(renderPortalBlock).join("")}
      </div>
    </article>
  `;
}

function renderPortalBlock(block) {
  if (block.type === "heading") {
    return `<h4 class="portal-heading">${escape(block.text)}</h4>`;
  }

  if (block.type === "list") {
    return `<div class="portal-list-item">${escape(block.text)}</div>`;
  }

  return `<p class="portal-paragraph">${escape(block.text)}</p>`;
}

function renderNewsCard(item) {
  return `
    <article class="paper-card news-card">
      <div class="section-topline">${escape(item.sourceLabel || "Atualização")}</div>
      <h3 class="schedule-title">${escape(item.title || "Notícia")}</h3>
      <p class="section-copy">${escape(item.summary || "Sem resumo disponível.")}</p>
      <div class="support-line">${escape(item.publishedAt ? formatShortDateTime(item.publishedAt) : "sem data")}</div>
    </article>
  `;
}

function renderLinkCard(item) {
  return `
    <a class="paper-card link-card" href="${escapeAttribute(item.href)}" target="_blank" rel="noreferrer">
      <div class="link-card-top">
        <span class="tag">Portal</span>
      </div>
      <h3 class="schedule-title">${escape(item.title)}</h3>
      <p class="section-copy">${escape(item.caption)}</p>
      <span class="link-hint">Abrir no WordPress</span>
    </a>
  `;
}

function renderInlineLink(item) {
  return `
    <a class="inline-link" href="${escapeAttribute(item.href)}" target="_blank" rel="noreferrer">
      <strong>${escape(item.title)}</strong>
      <span>${escape(item.caption)}</span>
    </a>
  `;
}

function renderShortcutCard(title, caption, action, tab) {
  return `
    <button class="paper-card shortcut-card" data-action="${escapeAttribute(action)}" data-tab="${escapeAttribute(tab)}">
      <span class="tag">Acesso rápido</span>
      <strong>${escape(title)}</strong>
      <span>${escape(caption)}</span>
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

  if (action === "set-main-tab") {
    const nextTab = button.dataset.tab || "home";
    setState({ activeTab: nextTab });
    if (PORTAL_TABS.has(nextTab)) {
      loadPortalTab(nextTab, true);
    }
    return;
  }

  if (action === "set-agenda-tab") {
    setState({
      activeTab: "academic",
      agendaTab: button.dataset.tab || "today",
    });
    return;
  }

  if (action === "open-academic-tab") {
    setState({
      activeTab: "academic",
      agendaTab: button.dataset.tab || "today",
    });
    return;
  }

  if (action === "refresh-portal-tab") {
    loadPortalTab(button.dataset.tab || state.activeTab, false);
    return;
  }

  if (action === "sync-ru") {
    refreshRuMenu(false);
    return;
  }

  if (action === "reload-app") {
    window.location.reload();
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
    setState({
      draftName: event.target.value || "",
      authError: "",
    }, { render: false });
    return;
  }

  if (event.target.id === "loginEmail") {
    setState({
      draftEmail: event.target.value || "",
      authError: "",
    }, { render: false });
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
    const uploads = persistentUploadsAvailable
      ? mergeUploads(await listUploadsForUser(user.uid), getTransientUploadsForUser(user.uid))
      : getSessionUploadsForUser(user.uid);
    const nextProfile = ensureActiveUploadProfile(profile, uploads);

    setState({
      authChecking: false,
      authError: persistentUploadsAvailable ? "" : buildSessionStorageMessage(),
      user,
      profile: nextProfile,
      uploads,
      uploadError: "",
      uploadMessage: uploads.length
        ? "Perfil reencontrado neste aparelho."
        : persistentUploadsAvailable
          ? "Perfil criado. Agora envie o PDF oficial do SCA."
          : "Perfil criado em modo de sessão. O PDF será lido e mantido só até recarregar a página.",
      activeTab: uploads.length ? state.activeTab : "academic",
      agendaTab: uploads.length ? state.agendaTab : "sca",
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
    activeTab: "home",
    agendaTab: "today",
    syncMessage: "Sessão encerrada. Os arquivos continuam guardados neste aparelho.",
  });
}

async function refreshLocalUploads() {
  if (!state.user) return;

  if (!persistentUploadsAvailable) {
    setState({
      uploads: getSessionUploadsForUser(state.user.uid),
      uploadError: "",
      uploadMessage: "Este navegador não liberou armazenamento persistente. Mostrando apenas os PDFs desta sessão.",
    });
    return;
  }

  try {
    const uploads = mergeUploads(await listUploadsForUser(state.user.uid), getTransientUploadsForUser(state.user.uid));
    const profile = ensureActiveUploadProfile(loadStoredProfile(state.user.uid) || ensureStoredProfile(state.user), uploads);
    setState({
      profile,
      uploads,
      uploadError: "",
      uploadMessage: uploads.length
        ? "Lista local atualizada com os arquivos deste aparelho."
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
    activeTab: "academic",
    agendaTab: "sca",
  });

  try {
    const academicData = await parseAcademicPdf(file, {
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
    const nextProfile = {
      ...(loadStoredProfile(state.user.uid) || ensureStoredProfile(state.user)),
      activeUploadId: uploadId,
      activeUploadName: file.name,
      lastUploadAtClient: uploadedAtClient,
      updatedAt: uploadedAtClient,
    };

    setState({
      uploadProgress: 56,
      uploadMessage: "Organizando horários, disciplinas e dados do aluno...",
      uploadError: "",
    });

    if (persistentUploadsAvailable) {
      try {
        await saveUploadRecord(record);
        setState({
          uploadProgress: 82,
          uploadMessage: "Salvando os dados deste aluno neste aparelho...",
          uploadError: "",
        });

        const profile = saveStoredProfile(nextProfile);
        const uploads = mergeUploads(
          await listUploadsForUser(state.user.uid),
          getTransientUploadsForUser(state.user.uid).filter((item) => item.id !== uploadId),
        );

        setState({
          authError: "",
          profile,
          uploads,
          uploadProgress: 100,
          uploadMessage: academicData.schedule.length || academicData.disciplines.length
            ? "PDF importado com sucesso. Sua agenda acadêmica já foi preenchida."
            : "PDF salvo, mas não consegui reconhecer todos os dados acadêmicos.",
          uploadError: "",
          referenceDate: suggestReferenceDate(academicData.schedule, state.referenceDate),
        });
        return;
      } catch (storageError) {
        persistentUploadsAvailable = false;
        persistentUploadsIssue = describeLocalError(storageError);
      }
    }

    let profile = nextProfile;
    try {
      profile = saveStoredProfile(nextProfile);
    } catch (profileError) {
      // segue com os dados em memória para não descartar a extração já concluída
    }

    const transientRecord = {
      ...record,
      isTransient: true,
      storagePath: `session://${state.user.uid}/${uploadId}/${normalizeFileName(file.name)}`,
      notes: academicData.schedule.length || academicData.disciplines.length
        ? "Arquivo importado para esta sessão."
        : "Arquivo lido para esta sessão, mas com dados acadêmicos parciais.",
    };
    const uploads = mergeUploads(
      state.uploads.filter((item) => item.ownerUid === state.user.uid && item.id !== uploadId),
      [transientRecord],
    );

    setState({
      authError: buildSessionStorageMessage(),
      profile,
      uploads,
      uploadProgress: 100,
      uploadMessage: academicData.schedule.length || academicData.disciplines.length
        ? "PDF lido com sucesso. A agenda foi preenchida, mas o arquivo ficará disponível só nesta sessão."
        : "PDF lido nesta sessão, mas com reconhecimento parcial dos dados acadêmicos.",
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

async function parseAcademicPdf(file, fallbackProfile) {
  let serverError = null;

  try {
    return await parseAcademicPdfWithApi(file, fallbackProfile);
  } catch (error) {
    serverError = error;
  }

  try {
    return await extractScaPdfData(file, fallbackProfile);
  } catch (deviceError) {
    if (serverError) {
      throw new Error(`servidor: ${describeLocalError(serverError)}; aparelho: ${describeLocalError(deviceError)}`);
    }
    throw deviceError;
  }
}

async function parseAcademicPdfWithApi(file, fallbackProfile) {
  const response = await fetch("/api/parse-sca", {
    method: "POST",
    headers: {
      "content-type": file.type || "application/pdf",
      "x-display-name": encodeURIComponent(fallbackProfile?.displayName || ""),
      "x-student-name": encodeURIComponent(fallbackProfile?.studentName || ""),
    },
    body: file,
  });

  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success || !result?.academicData) {
    throw new Error(result?.message || `falha ao processar o PDF no servidor (${response.status})`);
  }

  return result.academicData;
}

async function loadPortalTab(tab, silent = false) {
  if (!PORTAL_TABS.has(tab)) {
    return;
  }

  setState({
    portalLoadingTab: tab,
    portalError: "",
  }, { render: !silent });

  try {
    const response = await fetch(`/api/dagv-content?tab=${encodeURIComponent(tab)}`);
    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success) {
      throw new Error(result?.message || `falha ao carregar o conteúdo do DAGV (${response.status})`);
    }

    setState({
      portalLoadingTab: "",
      portalError: "",
      portalContent: {
        ...state.portalContent,
        [tab]: {
          pages: Array.isArray(result.pages) ? result.pages : [],
          generatedAt: result.generatedAt || "",
        },
      },
      newsFeed: Array.isArray(result.news) ? result.news : state.newsFeed,
    });
  } catch (error) {
    setState({
      portalLoadingTab: "",
      portalError: `Não consegui atualizar esta aba agora: ${describeLocalError(error)}`,
    }, { render: !silent });
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
    const transientRecord = state.uploads.find((item) => item.id === uploadId && item.blob);
    const record = transientRecord || await getUploadRecord(uploadId);
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
    return "Entre no perfil local do aluno, envie o PDF oficial do SCA e acompanhe a agenda do DA diretamente neste aparelho.";
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
  if (upload.isTransient && upload.status === "processed") return "Importado";
  if (upload.isTransient && upload.status === "limited") return "Parcial";
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
        <button class="ghost" data-action="open-academic-tab" data-tab="sca">Abrir SCA</button>
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
      agendaTab: state.agendaTab,
      referenceDate: state.referenceDate,
      menu: state.menu,
      lastMenuSync: state.lastMenuSync,
      syncMessage: state.syncMessage,
      draftName: state.draftName,
      draftEmail: state.draftEmail,
    }),
  );
}

function setState(patch, options = {}) {
  const shouldRender = options.render !== false;
  state = { ...state, ...patch };
  persistUiState();
  if (shouldRender) {
    render();
  }
}

function getTransientUploadsForUser(ownerUid) {
  return state.uploads.filter((item) => item.isTransient && item.ownerUid === ownerUid);
}

function getSessionUploadsForUser(ownerUid) {
  return state.uploads.filter((item) => item.ownerUid === ownerUid);
}

function mergeUploads(primary, extra = []) {
  return uniqueBy([...(extra || []), ...(primary || [])], (item) => item.id)
    .sort((left, right) => String(right.uploadedAtClient || "").localeCompare(String(left.uploadedAtClient || "")));
}

function buildSessionStorageMessage() {
  return persistentUploadsIssue
    ? `Não consegui abrir o armazenamento local deste navegador (${persistentUploadsIssue}). Vou manter o PDF apenas nesta sessão.`
    : "Não consegui abrir o armazenamento local deste navegador. Vou manter o PDF apenas nesta sessão.";
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
