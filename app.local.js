import { extractScaPdfData } from "./sca-parser.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?bundle";

const APP_NAME = "Agenda DAGV";
const APP_MARK = "DAGV";
const DA_PORTAL_URL = "https://dagvmeduftm.wordpress.com/";
const SUPABASE_CONFIG_FILE = "supabase-config.js";
const SUPABASE_BUCKET = "student-pdfs";
const REGISTRATION_TAB_ID = "registration";
const DOCUMENT_VIEWER_TAB_ID = "document-viewer";
const MENU_AUTO_REFRESH_MS = 7 * 24 * 60 * 60 * 1000;
const CLASS_NOTIFICATION_LEAD_MINUTES = 10;
const NOTIFICATION_PROMPT_STORAGE_KEY = "uftm-mobile-notification-prompt-v1";
const NOTIFICATION_HISTORY_STORAGE_KEY = "uftm-mobile-notification-history-v1";
const NOTIFICATION_LOOKAHEAD_DAYS = 21;
const DOCUMENT_TYPES = {
  schedule: "schedule",
  studentCard: "student_card",
};
const PENDING_REGISTRATION_MESSAGE = "Aguardando finalização do cadastro. Envie a grade horária e a carteirinha estudantil para liberar o app.";

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
];

const SIDEBAR_ITEMS = [
  { id: "home", label: "Inicio", icon: "home", action: "set-main-tab", tab: "home" },
  { id: REGISTRATION_TAB_ID, label: "Cadastro", icon: "user-plus", action: "open-registration" },
  { id: "student-card", label: "ID Digital", icon: "id-card", action: "open-student-card" },
  { id: "today", label: "Grade Horaria", icon: "calendar-day", action: "open-academic-tab", tab: "today" },
  { id: "menu", label: "Restaurantes", icon: "utensils", action: "open-academic-tab", tab: "menu" },
  { id: "dagv", label: "DAGV", icon: "newspaper", action: "set-main-tab", tab: "dagv" },
  { id: "links", label: "Links", icon: "link", action: "set-main-tab", tab: "links" },
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
const supabaseConfig = readPublicSupabaseConfig(window.UFTM_SUPABASE_CONFIG || {});
const supabaseReady = hasSupabaseConfig(supabaseConfig);
const canUseGoogleAuth = window.location.protocol !== "file:";
const services = {
  supabase: null,
};
let localDbPromise = null;
let persistentUploadsIssue = "";
let authSubscription = null;
let notificationServiceWorkerRegistration = null;
let classNotificationTimerId = 0;
let classNotificationHeartbeatId = 0;
let scheduledReminderKey = "";

clearPublicBootstrapData();

let state = {
  activeTab: uiState.activeTab || "home",
  agendaTab: uiState.agendaTab || "today",
  sidebarOpen: Boolean(uiState.sidebarOpen),
  referenceDate: uiState.referenceDate || toISO(new Date()),
  menu: Array.isArray(uiState.menu) && uiState.menu.length ? uiState.menu : defaultMenu,
  lastMenuSync: uiState.lastMenuSync || "",
  syncMessage: uiState.syncMessage || "Buscando o cardápio da Abadia para o painel do DA.",
  supabaseReady,
  canUseGoogleAuth,
  authChecking: supabaseReady && canUseGoogleAuth,
  authError: "",
  user: null,
  profile: null,
  uploads: [],
  uploadMessage: "",
  uploadError: "",
  uploadProgress: 0,
  openingUploadId: "",
  documentViewer: createEmptyDocumentViewerState(),
  portalContent: {},
  newsFeed: [],
  portalLoadingTab: "",
  portalError: "",
};

appElement.addEventListener("click", onClick);
appElement.addEventListener("change", onChange);
appElement.addEventListener("input", onInput);

init().catch((error) => {
  appElement.innerHTML = renderStartupFailure(error);
});

async function init() {
  render();
  void registerNotificationServiceWorker();
  loadPortalTab("home", true);
  refreshRuMenuIfNeeded(true);

  if (!supabaseReady) {
    setState({
      authChecking: false,
      authError: `Preencha o arquivo ${SUPABASE_CONFIG_FILE} para habilitar login Google e PDFs privados na nuvem.`,
    });
    return;
  }

  if (!canUseGoogleAuth) {
    setState({
      authChecking: false,
      authError: "Abra o app em http://localhost:4173 ou no deploy para autenticar com Google.",
    });
    return;
  }

  try {
    services.supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    });

    if (authSubscription) {
      authSubscription.unsubscribe();
      authSubscription = null;
    }

    const { data } = services.supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        void handleSupabaseSession(session);
      }, 0);
    });

    authSubscription = data.subscription;

    const { data: sessionData, error } = await services.supabase.auth.getSession();
    if (error) {
      throw error;
    }

    await handleSupabaseSession(sessionData.session);
    clearSensitiveUrlData();
  } catch (error) {
    setState({
      authChecking: false,
      authError: `Não consegui inicializar a conta online: ${describeSupabaseError(error)}`,
    });
  }
}

async function handleSupabaseSession(session) {
  const user = session?.user || null;

  if (!user) {
    revokeActiveDocumentViewer();
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
      sidebarOpen: false,
      documentViewer: createEmptyDocumentViewerState(),
    });
    return;
  }

  const userData = normalizeSupabaseUser(user);

  setState({
    authChecking: false,
    authError: "",
    user: userData,
    profile: {
      uid: userData.uid,
      displayName: userData.displayName,
      email: userData.email,
      photoURL: userData.photoURL,
      activeUploadId: "",
      activeUploadName: "",
    },
    uploads: [],
    uploadError: "",
    uploadMessage: "Conta Google conectada com sucesso.",
  });

  try {
    await upsertSupabaseProfile(userData);
    const { profile, uploads } = await loadRemoteAccountData(userData.uid);

    setState({
      authChecking: false,
      authError: "",
      user: {
        ...userData,
        displayName: profile.displayName || userData.displayName || userData.email || "Aluno",
        email: profile.email || userData.email || "",
        photoURL: profile.photoURL || userData.photoURL || "",
      },
      profile,
      uploads,
      activeTab: hasCompletedRegistration(uploads, profile) ? state.activeTab : REGISTRATION_TAB_ID,
      agendaTab: hasCompletedRegistration(uploads, profile) ? state.agendaTab : "today",
      uploadError: "",
      uploadMessage: uploads.length
        ? hasCompletedRegistration(uploads, profile)
          ? "Conta conectada. Seus documentos privados foram sincronizados."
          : PENDING_REGISTRATION_MESSAGE
        : "Conta conectada. Envie a grade horaria e a carteirinha estudantil para liberar o painel.",
    });
  } catch (error) {
    setState({
      authChecking: false,
      uploadError: `Não consegui sincronizar o perfil do aluno: ${describeSupabaseError(error)}`,
      uploadMessage: "",
    });
  }
}

async function upsertSupabaseProfile(userData, extra = {}) {
  if (!services.supabase) {
    throw new Error("cliente Supabase indisponível");
  }

  const now = new Date().toISOString();
  const payload = {
    id: userData.uid,
    display_name: userData.displayName || "",
    email: userData.email || "",
    photo_url: userData.photoURL || "",
    last_login_at: now,
    updated_at: now,
    ...extra,
  };

  const { error } = await services.supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    throw error;
  }
}

async function loadRemoteAccountData(userUid) {
  if (!services.supabase) {
    throw new Error("cliente Supabase indisponível");
  }

  const [profileResult, uploadsResult] = await Promise.all([
    services.supabase
      .from("profiles")
      .select("*")
      .eq("id", userUid)
      .maybeSingle(),
    services.supabase
      .from("uploads")
      .select("*")
      .eq("owner_uid", userUid)
      .order("uploaded_at_client", { ascending: false }),
  ]);

  if (profileResult.error) {
    throw profileResult.error;
  }

  if (uploadsResult.error) {
    throw uploadsResult.error;
  }

  return {
    profile: normalizeSupabaseProfileRow(profileResult.data, userUid),
    uploads: (uploadsResult.data || []).map(normalizeSupabaseUploadRow),
  };
}

async function reloadRemoteAccountData(userUid) {
  const { profile, uploads } = await loadRemoteAccountData(userUid);
  const scheduleUploads = uploads.filter((item) => item.documentType !== DOCUMENT_TYPES.studentCard);
  const activeUpload = scheduleUploads.find((item) => item.id === profile.activeUploadId) || scheduleUploads[0] || null;
  const academicData = getAcademicData(activeUpload);
  const registrationComplete = hasCompletedRegistration(uploads, profile);

  setState({
    user: state.user
      ? {
          ...state.user,
          displayName: profile.displayName || state.user.displayName || state.user.email || "Aluno",
          email: profile.email || state.user.email || "",
          photoURL: profile.photoURL || state.user.photoURL || "",
        }
      : state.user,
    profile,
    uploads,
    activeTab: registrationComplete ? state.activeTab : REGISTRATION_TAB_ID,
    agendaTab: registrationComplete ? state.agendaTab : "today",
    referenceDate: academicData?.schedule?.length
      ? suggestReferenceDate(academicData.schedule, state.referenceDate)
      : state.referenceDate,
  });

  return { profile, uploads };
}

async function upsertUploadRow(upload) {
  if (!services.supabase) {
    throw new Error("cliente Supabase indisponível");
  }

  const now = new Date().toISOString();
  const { error } = await services.supabase
    .from("uploads")
    .upsert({
      id: upload.id,
      owner_uid: upload.ownerUid,
      original_name: upload.originalName,
      normalized_name: upload.normalizedName,
      storage_path: upload.storagePath,
      size: Number(upload.size || 0),
      content_type: upload.contentType || "application/pdf",
      status: upload.status || "uploaded",
      parser_status: upload.parserStatus || "",
      uploaded_at_client: upload.uploadedAtClient || now,
      updated_at: now,
      notes: upload.notes || "",
      academic_data: upload.academicData || null,
    }, { onConflict: "id" });

  if (error) {
    throw error;
  }
}

function getSupabaseBucketName() {
  return String(supabaseConfig.bucket || SUPABASE_BUCKET || "").trim() || SUPABASE_BUCKET;
}

function normalizeSupabaseUser(user) {
  const metadata = user?.user_metadata || {};
  return {
    uid: String(user?.id || ""),
    displayName: normalizePersonName(metadata.full_name || metadata.name || user?.email || "Aluno"),
    email: normalizeEmail(user?.email || metadata.email || ""),
    photoURL: String(metadata.avatar_url || metadata.picture || ""),
    provider: Array.isArray(user?.app_metadata?.providers) && user.app_metadata.providers.length
      ? user.app_metadata.providers.join(",")
      : "google",
  };
}

function normalizeSupabaseProfileRow(row, fallbackUid = "") {
  return {
    uid: String(row?.id || fallbackUid || ""),
    displayName: normalizePersonName(row?.display_name || ""),
    email: normalizeEmail(row?.email || ""),
    photoURL: String(row?.photo_url || ""),
    activeUploadId: String(row?.active_upload_id || ""),
    activeUploadName: String(row?.active_upload_name || ""),
    lastUploadAtClient: String(row?.last_upload_at_client || ""),
    lastLoginAt: String(row?.last_login_at || ""),
    createdAt: String(row?.created_at || ""),
    updatedAt: String(row?.updated_at || ""),
  };
}

function normalizeSupabaseUploadRow(row) {
  const storagePath = String(row?.storage_path || "");
  return {
    id: String(row?.id || ""),
    ownerUid: String(row?.owner_uid || ""),
    originalName: String(row?.original_name || "PDF sem nome"),
    normalizedName: String(row?.normalized_name || ""),
    storagePath,
    size: Number(row?.size || 0),
    contentType: String(row?.content_type || "application/pdf"),
    status: String(row?.status || "uploaded"),
    parserStatus: String(row?.parser_status || ""),
    uploadedAtClient: String(row?.uploaded_at_client || ""),
    updatedAt: String(row?.updated_at || row?.uploaded_at_client || ""),
    createdAt: String(row?.created_at || ""),
    notes: String(row?.notes || ""),
    academicData: row?.academic_data || null,
    documentType: inferDocumentTypeFromStoragePath(storagePath, row?.parser_status),
  };
}

function inferDocumentTypeFromStoragePath(storagePath, parserStatus = "") {
  const parts = String(storagePath || "").split("/").filter(Boolean);
  if (parts[1] === "student-card" || String(parserStatus || "").startsWith("student_card")) {
    return DOCUMENT_TYPES.studentCard;
  }
  return DOCUMENT_TYPES.schedule;
}

function hasCompletedRegistration(uploads, profile) {
  const scheduleUploads = (uploads || []).filter((item) => item.documentType !== DOCUMENT_TYPES.studentCard);
  const studentCardUploads = (uploads || []).filter((item) => item.documentType === DOCUMENT_TYPES.studentCard);
  const activeSchedule = scheduleUploads.find((item) => item.id === profile?.activeUploadId) || scheduleUploads[0] || null;
  return Boolean(activeSchedule && studentCardUploads[0]);
}

function createEmptyDocumentViewerState() {
  return {
    uploadId: "",
    title: "",
    objectUrl: "",
    documentType: "",
    sourceTab: "home",
    sourceAgendaTab: "today",
    loading: false,
  };
}

function stopUserSubscriptions() {
  return;
}

function render() {
  if (!state.user) {
    appElement.innerHTML = renderLogin();
    return;
  }

  const registration = getRegistrationState();
  const activeUpload = registration.scheduleUpload;
  const statusBanner = renderStatusBanner(registration);

  appElement.innerHTML = `
    <div class="app-frame ${state.sidebarOpen ? "is-sidebar-open" : ""}">
      <button class="sidebar-backdrop ${state.sidebarOpen ? "is-visible" : ""}" data-action="close-sidebar" aria-label="Fechar menu lateral"></button>
      ${renderSidebar(registration)}
      <div class="app-view ios-shell campus-shell">
        <header class="header-bar compact-header">
          <button class="brand-mark brand-mark-button menu-toggle" data-action="toggle-sidebar" aria-label="Abrir menu lateral">
            ${renderUiIcon("menu", "menu-toggle-icon")}
            <span class="sr-only">Menu</span>
          </button>
          <div class="header-brand header-brand-centered">
            <div class="header-copy">
              <span class="header-kicker">Painel do DAGV</span>
              <h1>${escape(getScreenTitle())}</h1>
            </div>
          </div>
          <div class="button-row">
            ${registration.isComplete ? "" : `<span class="header-pill">Cadastro pendente</span>`}
            <button class="ghost header-action" data-action="logout">Sair</button>
          </div>
        </header>

        <section class="toolbar-strip">
          <div class="user-line">
            <div class="user-chip">
              ${renderAvatar(state.user)}
              <div>
                <strong>${escape(state.user.displayName || "Aluno")}</strong>
                <span>${escape(state.user.email || state.user.uid)}</span>
              </div>
            </div>
          </div>
        </section>

        ${statusBanner}

        ${renderMainPanel(activeUpload, registration)}
      </div>
    </div>
  `;
}

function renderLogin() {
  const canLogin = !state.authChecking && state.supabaseReady && state.canUseGoogleAuth;
  const loginLabel = state.authChecking ? "Conectando..." : "Entrar com Google";
  const supportMessage = state.authError
    || (!state.supabaseReady
      ? "O acesso online ainda está sendo preparado para este ambiente."
      : !state.canUseGoogleAuth
        ? "Abra o app pelo navegador para continuar com o login."
        : "Entre com sua conta Google para começar.")
    || "";

  return `
    <section class="login-hero-shell">
      <div class="login-hero">
        <span class="login-kicker">Desenvolvido pelo DAGV</span>
        <div class="login-brand-lockup">
          <img class="login-brand-mark-image" src="./icon.png" alt="DAGV" />
        </div>
        <h1>Sua rotina academica, mais simples.</h1>
        <p class="login-subtitle">Um app feito para simplificar a vida dos estudantes e desenvolvido pelo DA.</p>
        <div class="login-ribbon" aria-label="Principais areas do app">
          <span class="login-chip">Grade horaria</span>
          <span class="login-chip">RU</span>
          <span class="login-chip">ID digital</span>
        </div>
        <div class="login-actions login-actions-hero">
          <button class="cta" data-action="login-google" ${canLogin ? "" : "disabled"}>${escape(loginLabel)}</button>
          <a class="ghost link-button" href="${escapeAttribute(DA_PORTAL_URL)}" target="_blank" rel="noreferrer">Portal do DA</a>
        </div>
        <p class="login-support ${state.authError ? "is-warning" : ""}">${escape(supportMessage)}</p>
      </div>
    </section>
  `;
}

function renderStartupFailure(error) {
  return `
    <section class="login-hero-shell login-hero-shell-error">
      <div class="login-hero">
        <span class="login-kicker">Painel do DAGV</span>
        <div class="login-brand-lockup">
          <img class="login-brand-mark-image" src="./icon.png" alt="DAGV" />
        </div>
        <h1>Não conseguimos abrir o app agora.</h1>
        <p class="login-subtitle">Tente novamente em instantes ou siga pelo portal oficial do DAGV.</p>
        <div class="login-actions login-actions-hero">
          <button class="cta" data-action="reload-app">Tentar novamente</button>
          <a class="ghost link-button" href="${escapeAttribute(DA_PORTAL_URL)}" target="_blank" rel="noreferrer">Portal do DA</a>
        </div>
        <p class="login-support is-warning">${escape(describeLocalError(error))}</p>
      </div>
    </section>
  `;
}

function renderMainPanel(activeUpload, registration = getRegistrationState()) {
  if (state.activeTab === DOCUMENT_VIEWER_TAB_ID) {
    return renderDocumentViewer();
  }

  if (state.activeTab === REGISTRATION_TAB_ID) {
    return renderRegistrationPanel(registration);
  }

  if (!registration.isComplete) {
    return renderRegistrationPendingState(registration);
  }

  if (state.activeTab === "academic") {
    return renderAcademicPanel(activeUpload);
  }

  return renderPortalTab(activeUpload);
}

function renderDocumentViewer() {
  const viewer = state.documentViewer || createEmptyDocumentViewerState();
  const title = viewer.documentType === DOCUMENT_TYPES.studentCard
    ? "Carteirinha estudantil"
    : viewer.title || "Documento";
  const topline = viewer.documentType === DOCUMENT_TYPES.studentCard ? "ID digital" : "Documento";

  return `
    <section class="section-stack simple-stack">
      <section class="paper-card simple-section document-viewer-shell">
        <div class="section-header-row">
          <div>
            <div class="section-topline">${escape(topline)}</div>
            <h2 class="section-title">${escape(title)}</h2>
          </div>
          <div class="button-row">
            <button class="ghost" data-action="close-document-viewer">Voltar</button>
          </div>
        </div>
        ${viewer.loading
          ? `<div class="empty-state" style="margin-top: 1rem;">Carregando o PDF dentro do app...</div>`
          : viewer.objectUrl
            ? `<iframe class="document-viewer-frame" src="${escapeAttribute(`${viewer.objectUrl}#toolbar=0&navpanes=0&scrollbar=1`)}" title="${escapeAttribute(title)}"></iframe>`
            : `<div class="empty-state" style="margin-top: 1rem;">Nao consegui preparar este PDF agora.</div>`}
      </section>
    </section>
  `;
}

function renderSidebar(registration) {
  return `
    <aside class="sidebar-panel ${state.sidebarOpen ? "is-open" : ""}" aria-label="Navegacao do app">
      <section class="sidebar-profile">
        <div class="sidebar-profile-main">
          <div class="sidebar-avatar">${renderAvatar(state.user)}</div>
          <div>
            <strong>${escape(state.user.displayName || "Aluno")}</strong>
            <span>Aluno</span>
            <small>${escape(state.profile?.activeUploadName || state.user.email || state.user.uid)}</small>
          </div>
        </div>
        <div class="sidebar-profile-note">${registration.isComplete ? "Cadastro concluido" : "Cadastro inicial pendente"}</div>
      </section>

      <nav class="sidebar-nav" aria-label="Menu lateral">
        ${SIDEBAR_ITEMS.map((item) => renderSidebarItem(item, registration)).join("")}
      </nav>

      <div class="sidebar-footer">
        <button class="sidebar-item sidebar-item-footer" data-action="logout">
          <span class="sidebar-item-mark">${renderUiIcon("logout", "sidebar-item-icon")}</span>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  `;
}

function renderSidebarItem(item, registration) {
  const isViewerStudentCard = state.activeTab === DOCUMENT_VIEWER_TAB_ID
    && state.documentViewer.documentType === DOCUMENT_TYPES.studentCard
    && item.action === "open-student-card";
  const isActive = item.id === state.activeTab
    || (state.activeTab === "academic" && item.tab === state.agendaTab)
    || isViewerStudentCard;
  const isLocked = !registration.isComplete && item.action !== "open-registration" && item.action !== "open-student-card";

  return `
    <button class="sidebar-item ${isActive ? "is-active" : ""} ${isLocked ? "is-locked" : ""}" data-action="${escapeAttribute(item.action)}" ${item.tab ? `data-tab="${escapeAttribute(item.tab)}"` : ""}>
      <span class="sidebar-item-mark">${renderUiIcon(item.icon || "circle", "sidebar-item-icon")}</span>
      <span>${escape(item.label)}</span>
    </button>
  `;
}

function renderRegistrationPanel(registration) {
  const scheduleUploads = getScheduleUploads();
  const studentCardUpload = registration.studentCardUpload;

  return `
    <section class="section-stack simple-stack">
      <section class="paper-card dashboard-highlight onboarding-highlight">
        <div class="section-topline">Cadastro inicial</div>
        <h2 class="section-title">${registration.isComplete ? "Cadastro concluido" : "Envie os dois documentos antes do primeiro uso"}</h2>
        <p class="section-copy">
          ${registration.isComplete
            ? "Sua grade horaria e sua carteirinha estudantil ja estao vinculadas a conta. Sempre que precisar, voce pode atualizar os arquivos aqui."
            : "Para liberar o painel do DAGV, precisamos da grade horaria em PDF e da carteirinha estudantil em PDF. Ate la, o app fica em modo de espera com avisos simples."}
        </p>
        <div class="simple-meta-grid">
          ${renderRegistrationStatusCard("Grade horaria", registration.scheduleUpload ? "Recebida" : "Aguardando PDF", registration.scheduleUpload ? getExtractionCaption(registration.scheduleUpload) : "Envie o PDF do SCA para montar sua agenda.")}
          ${renderRegistrationStatusCard("Carteirinha estudantil", studentCardUpload ? "Recebida" : "Aguardando PDF", studentCardUpload ? "O item ID Digital do menu ja abre o PDF salvo." : "Pre-configurada para o PDF oficial que a UFTM disponibilizar.")}
        </div>
      </section>

      <section class="paper-card simple-section">
        <div class="section-header-row">
          <div>
            <div class="section-topline">Cadastro</div>
            <h2 class="section-title">Grade horaria</h2>
          </div>
          ${registration.scheduleUpload ? `<button class="ghost" data-action="open-academic-tab" data-tab="today">Abrir agenda</button>` : ""}
        </div>
        <p class="section-copy">Use o PDF oficial do SCA para preencher aulas, semana e disciplinas automaticamente.</p>
        <div class="upload-drop registration-drop" style="margin-top: 1rem;">
          <input id="schedulePdfInput" class="file-input" type="file" accept="application/pdf,.pdf" />
          <div class="button-row">
            <label class="file-trigger" for="schedulePdfInput">${registration.scheduleUpload ? "Atualizar grade horaria" : "Enviar grade horaria"}</label>
          </div>
          ${registration.scheduleUpload ? `
            <div class="simple-meta-grid">
              <div class="mini-card"><small>Arquivo ativo</small><strong>${escape(registration.scheduleUpload.originalName)}</strong><span>${escape(formatBytes(registration.scheduleUpload.size))}</span></div>
              <div class="mini-card"><small>Status</small><strong>${escape(getUploadStatusLabel(registration.scheduleUpload))}</strong><span>${escape(getExtractionCaption(registration.scheduleUpload))}</span></div>
            </div>
          ` : `<div class="support-line" style="margin-top: 0.85rem;">Aguardando o primeiro PDF do SCA.</div>`}
        </div>
      </section>

      <section class="paper-card simple-section">
        <div class="section-header-row">
          <div>
            <div class="section-topline">Cadastro</div>
            <h2 class="section-title">Carteirinha estudantil</h2>
          </div>
          ${studentCardUpload ? `<button class="ghost" data-action="open-student-card">Abrir ID digital</button>` : ""}
        </div>
        <p class="section-copy">Deixe o PDF da carteirinha salvo na conta. O modelo oficial da UFTM pode ser trocado depois sem mudar o fluxo.</p>
        <div class="upload-drop registration-drop" style="margin-top: 1rem;">
          <input id="studentCardInput" class="file-input" type="file" accept="application/pdf,.pdf" />
          <div class="button-row">
            <label class="file-trigger" for="studentCardInput">${studentCardUpload ? "Atualizar carteirinha" : "Enviar carteirinha estudantil"}</label>
          </div>
          ${studentCardUpload ? `
            <div class="simple-meta-grid">
              <div class="mini-card"><small>ID digital</small><strong>${escape(studentCardUpload.originalName)}</strong><span>${escape(formatBytes(studentCardUpload.size))}</span></div>
              <div class="mini-card"><small>Status</small><strong>Pronto</strong><span>Abre direto pelo menu lateral.</span></div>
            </div>
          ` : `<div class="support-line" style="margin-top: 0.85rem;">Aguardando o PDF da carteirinha para habilitar o item ID Digital.</div>`}
        </div>
      </section>

        <section class="paper-card simple-section">
          <div class="section-header-row">
            <div>
              <div class="section-topline">Arquivos</div>
              <h2 class="section-title">Documentos vinculados</h2>
            </div>
          </div>
          <div class="upload-list" style="margin-top: 1rem;">
            ${scheduleUploads.length || studentCardUpload
            ? [
                ...scheduleUploads.map((item) => renderUploadItem(item, registration.scheduleUpload)),
                ...getStudentCardUploads().map((item) => renderUploadItem(item, studentCardUpload)),
              ].join("")
            : `<div class="empty-state">Nenhum documento foi enviado ainda.</div>`}
        </div>
        ${renderUploadStatus()}
      </section>
    </section>
  `;
}

function renderRegistrationStatusCard(title, status, caption) {
  return `
    <div class="mini-card registration-status-card">
      <small>${escape(title)}</small>
      <strong>${escape(status)}</strong>
      <span>${escape(caption)}</span>
    </div>
  `;
}

function renderRegistrationPendingState(registration) {
  return `
    <section class="section-stack simple-stack">
      <section class="paper-card dashboard-highlight onboarding-highlight">
        <div class="section-topline">Cadastro pendente</div>
        <h2 class="section-title">Aguardando finalizacao do cadastro</h2>
        <p class="section-copy">${escape(buildRegistrationBannerMessage(registration))}</p>
        <div class="button-row" style="margin-top: 1rem;">
          <button class="secondary" data-action="open-registration">Ir para cadastro</button>
        </div>
      </section>
    </section>
  `;
}

function renderPortalTab(activeUpload) {
  const academicData = getAcademicData(activeUpload);
  const schedule = academicData?.schedule || [];
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
    home: "Atalhos rápidos para RU, grade e conteúdos do diretório.",
    elections: "Editais e chamadas do diretório.",
    dagv: "Conteúdo institucional do DAGV.",
    coordination: "Frentes e coordenações do diretório.",
    agenda: "Eventos e agenda do curso.",
    info: "Informações úteis da comunidade acadêmica.",
    links: "Acessos rápidos do DAGV.",
  };

  if (state.activeTab === "home") {
    return `
      <section class="section-stack simple-stack">
        <section class="paper-card dashboard-highlight">
          <div class="section-topline">Resumo</div>
          <h2 class="section-title">${escape(buildHeroTitle(activeUpload, academicData, todayClasses, nextClass))}</h2>
          <p class="section-copy">${escape(buildHeroSubtitle(academicData))}</p>
          <div class="button-row" style="margin-top: 1rem;">
            <button class="secondary" data-action="${academicData ? "open-academic-tab" : "open-registration"}" ${academicData ? 'data-tab="today"' : ""}>${academicData ? "Abrir agenda" : "Finalizar cadastro"}</button>
            <button class="ghost" data-action="set-main-tab" data-tab="dagv">Portal do DAGV</button>
          </div>
        </section>

        <section class="home-shortcuts">
          ${renderHomeShortcut("calendar-day", "Hoje", "open-academic-tab", "today")}
          ${renderHomeShortcut("utensils", "RU", "open-academic-tab", "menu")}
          ${renderHomeShortcut("calendar-grid", "Semana", "open-academic-tab", "week")}
          ${renderHomeShortcut("user-plus", "Cadastro", "open-registration", "")}
          ${renderHomeShortcut("newspaper", "DAGV", "set-main-tab", "dagv")}
          ${renderHomeShortcut("link", "Links", "set-main-tab", "links")}
        </section>

        <section class="paper-card simple-section">
          <div class="section-header-row">
            <div>
              <div class="section-topline">Restaurante</div>
              <h2 class="section-title">Hoje no RU Abadia</h2>
            </div>
            <button class="ghost" data-action="open-academic-tab" data-tab="menu">Ver tudo</button>
          </div>
          ${menu ? `
            <div class="simple-list">
              ${renderSimpleInfoRow("Prato principal", menu.mainDish || "Sem informação")}
              ${renderSimpleInfoRow("Opção", menu.option || "Sem informação")}
              ${renderSimpleInfoRow("Sobremesa", menu.dessert || "Sem informação")}
            </div>
          ` : `<div class="empty-state">Sem cardápio disponível agora.</div>`}
        </section>

        <section class="paper-card simple-section">
          <div class="section-header-row">
            <div>
              <div class="section-topline">Grade horária</div>
              <h2 class="section-title">Hoje</h2>
            </div>
            <div class="inline-field compact-date-field">
              <label for="referenceDate">Data</label>
              <input id="referenceDate" type="date" value="${escape(state.referenceDate)}" />
            </div>
          </div>
          <div class="timeline-list">
            ${activeUpload
              ? (todayClasses.length
                  ? todayClasses.map(renderSchedule).join("")
                  : `<div class="empty-state">Nenhuma aula nesta data.</div>`)
              : renderMissingPdfState("Importe o PDF do SCA para montar sua grade.")}
          </div>
        </section>

        ${state.newsFeed.length ? `
          <section class="section-stack">
            <div class="section-topline">Últimas do DAGV</div>
            <div class="link-grid compact-grid">
              ${state.newsFeed.slice(0, 2).map(renderNewsCard).join("")}
            </div>
          </section>
        ` : ""}
      </section>
    `;
  }

  return `
    <section class="section-stack simple-stack">
      <section class="paper-card agenda-shell simple-section">
        <div class="section-header-row">
          <div>
            <div class="section-topline">${escape(titleMap[state.activeTab] || "Portal DAGV")}</div>
            <h2 class="section-title">${escape(titleMap[state.activeTab] || "Portal DAGV")}</h2>
          </div>
        </div>
        <p class="section-copy">${escape(descriptionMap[state.activeTab] || "Conteúdo do DAGV carregado dentro do aplicativo.")}</p>
        ${state.portalError && state.portalLoadingTab !== state.activeTab ? `<div class="toast is-warning" style="margin-top: 1rem;">${escape(state.portalError)}</div>` : ""}
      </section>

      ${state.portalLoadingTab === state.activeTab && !pages.length
        ? `<div class="empty-state">Carregando o conteúdo atualizado do DAGV...</div>`
        : pages.length
          ? `<section class="section-stack">${pages.map(renderPortalPage).join("")}</section>`
          : `<div class="empty-state">Ainda não consegui carregar o conteúdo desta aba agora.</div>`}
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
      <section class="section-stack simple-stack">
        ${renderAgendaHeader("Semana")}
        <section class="paper-card simple-section">
          <div class="section-header-row">
            <div>
              <div class="section-topline">Grade</div>
              <h2 class="section-title">${escape(weekTitle(state.referenceDate))}</h2>
            </div>
            <div class="inline-field compact-date-field">
              <label for="referenceDate">Data</label>
              <input id="referenceDate" type="date" value="${escape(state.referenceDate)}" />
            </div>
          </div>
          <div class="week-grid" style="margin-top: 1rem;">
            ${weekView.map(renderDayColumn).join("")}
          </div>
        </section>
      </section>
    `;
  }

  if (state.agendaTab === "menu") {
    return `
      <section class="section-stack simple-stack">
        ${renderAgendaHeader("RU")}
        <section class="paper-card simple-section">
          <div class="section-header-row">
            <div>
              <div class="section-topline">Restaurante</div>
              <h2 class="section-title">Unidade Abadia</h2>
            </div>
          </div>
          <div class="menu-grid simple-menu-grid" style="margin-top: 1rem;">
            ${state.menu.map(renderMenuCard).join("")}
          </div>
        </section>
      </section>
    `;
  }

  return `
    <section class="section-stack simple-stack">
      ${renderAgendaHeader("Hoje")}
      <section class="paper-card simple-section">
        <div class="section-header-row">
          <div>
            <div class="section-topline">Agenda</div>
            <h2 class="section-title">${escape(formatLongDate(state.referenceDate))}</h2>
          </div>
          <div class="inline-field compact-date-field">
            <label for="referenceDate">Data</label>
            <input id="referenceDate" type="date" value="${escape(state.referenceDate)}" />
          </div>
        </div>
        <div class="timeline-list" style="margin-top: 1rem;">
          ${activeUpload
            ? (todayClasses.length
                ? todayClasses.map(renderSchedule).join("")
                : `<div class="empty-state">Nenhuma aula nesta data.</div>`)
            : renderMissingPdfState("Importe o PDF do SCA para carregar sua agenda.")}
        </div>
      </section>

      ${activeUpload ? `
        <section class="paper-card simple-section">
          <div class="simple-meta-grid">
            <div class="mini-card"><small>Próxima aula</small><strong>${escape(nextClass?.startTime || "--:--")}</strong><span>${escape(nextClass?.title || "sem aula futura")}</span></div>
            <div class="mini-card"><small>PDF ativo</small><strong>${escape(activeUpload.originalName)}</strong><span>${escape(academicData?.profile?.course || "curso não encontrado")}</span></div>
            <div class="mini-card"><small>Semana</small><strong>${String(weekView.reduce((acc, day) => acc + day.classes.length, 0))}</strong><span>blocos visíveis</span></div>
          </div>
        </section>
      ` : ""}
    </section>
  `;
}

function renderAgendaHeader(title) {
  return `
    <section class="paper-card agenda-shell simple-section">
      <div class="section-topline">Acadêmico</div>
      <h2 class="section-title">${escape(title)}</h2>
      <div class="button-row" style="margin-top: 0.75rem;">
        <button class="ghost" data-action="open-registration">Cadastro</button>
      </div>
      <div class="segmented-control" style="margin-top: 1rem;">
        ${AGENDA_NAV_ITEMS.map(renderAgendaTabButton).join("")}
      </div>
    </section>
  `;
}

function renderUploadStatus() {
  if (!shouldShowUploadStatusPanel()) {
    return "";
  }

  const classes = ["toast"];
  const message = state.uploadError || state.uploadMessage || "";

  if (state.uploadError) {
    classes.push("is-danger");
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
  const isStudentCard = item.documentType === DOCUMENT_TYPES.studentCard;
  return `
    <article class="upload-entry ${isActive ? "is-active" : ""}">
      <div class="upload-entry-top">
        <div>
          <h3 class="schedule-title">${escape(item.originalName)}</h3>
          <div class="support-line">${escape(isStudentCard ? "Carteirinha estudantil" : "Grade horaria")} • ${escape(formatShortDateTime(item.uploadedAtClient))} • ${escape(formatBytes(item.size))}</div>
        </div>
        <span class="tag">${escape(getUploadStatusLabel(item))}</span>
      </div>
      <div class="button-row" style="margin-top: 0.75rem;">
        ${isStudentCard
          ? `<span class="tag">ID digital</span>`
          : isActive
            ? `<span class="tag">Grade ativa</span>`
            : `<button class="ghost" data-action="set-active-upload" data-upload-id="${escapeAttribute(item.id)}">Definir ativa</button>`}
        <button class="ghost" data-action="open-upload" data-upload-id="${escapeAttribute(item.id)}">${state.openingUploadId === item.id ? "Abrindo..." : "Abrir"}</button>
      </div>
    </article>
  `;
}

function renderMenuCard(item) {
  return `
    <article class="menu-card simple-menu-card">
      <div class="menu-top">
        <h3 class="menu-title">${escape(item.unit)}</h3>
        <span class="tag">${escape(formatDateShort(item.date))}</span>
      </div>
      <section class="menu-section"><h4>Prato principal</h4><p>${escape(item.mainDish)}</p></section>
      <section class="menu-section"><h4>Opção</h4><p>${escape(item.option)}</p></section>
      <section class="menu-section"><h4>Guarnição</h4><p>${escape(item.garnish)}</p></section>
      <section class="menu-section"><h4>Acompanhamentos</h4><p>${escape(item.sides)}</p></section>
      <section class="menu-section"><h4>Saladas</h4><p>${escape(item.salads)}</p></section>
      <section class="menu-section"><h4>Sobremesa</h4><p>${escape(item.dessert)}</p></section>
      <section class="menu-section"><h4>Refresco</h4><p>${escape(item.drink)}</p></section>
    </article>
  `;
}

function renderMainTabButton(item) {
  return `
    <button class="tab-button compact-tab ${state.activeTab === item.id ? "is-active" : ""}" data-action="set-main-tab" data-tab="${item.id}">
      ${item.label}
    </button>
  `;
}

function renderAgendaTabButton(item) {
  return `
    <button class="segmented-button compact-segment ${state.agendaTab === item.id ? "is-active" : ""}" data-action="set-agenda-tab" data-tab="${item.id}">
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
    <article class="paper-card news-card simple-section">
      ${item.image ? `<img class="portal-image" src="${escapeAttribute(item.image)}" alt="${escapeAttribute(item.title || "Imagem da notícia")}" />` : ""}
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
      <strong>${escape(title)}</strong>
      <span>${escape(caption)}</span>
    </button>
  `;
}

function renderAvatar(user) {
  if (user?.photoURL) {
    return `<img class="avatar-image" src="${escapeAttribute(user.photoURL)}" alt="${escapeAttribute(user.displayName || "Foto do aluno")}" referrerpolicy="no-referrer" loading="lazy" decoding="async" />`;
  }

  return `<span class="avatar-fallback">${escape(initials(user.displayName || user.email || "Aluno"))}</span>`;
}

function renderUiIcon(iconName, className = "ui-icon") {
  const svgBodyMap = {
    home: `
      <path d="M4 10.5 12 4l8 6.5"></path>
      <path d="M6 9.5V20h12V9.5"></path>
      <path d="M10 20v-5h4v5"></path>
    `,
    "user-plus": `
      <circle cx="9" cy="8" r="3"></circle>
      <path d="M4 20c0-3 2.3-5 5-5s5 2 5 5"></path>
      <path d="M18 8v6"></path>
      <path d="M15 11h6"></path>
    `,
    "id-card": `
      <rect x="3" y="5" width="18" height="14" rx="3"></rect>
      <circle cx="8" cy="11" r="2"></circle>
      <path d="M5.5 16c.8-1.6 2-2.4 3.8-2.4 1.7 0 2.9.8 3.7 2.4"></path>
      <path d="M15 10h3.5"></path>
      <path d="M15 13h3.5"></path>
    `,
    "calendar-day": `
      <rect x="3" y="5" width="18" height="16" rx="3"></rect>
      <path d="M8 3v4"></path>
      <path d="M16 3v4"></path>
      <path d="M3 9.5h18"></path>
      <circle cx="12" cy="15" r="2.2" class="icon-fill"></circle>
    `,
    "calendar-grid": `
      <rect x="3" y="5" width="18" height="16" rx="3"></rect>
      <path d="M8 3v4"></path>
      <path d="M16 3v4"></path>
      <path d="M3 9.5h18"></path>
      <path d="M8 13h3"></path>
      <path d="M13 13h3"></path>
      <path d="M8 17h3"></path>
      <path d="M13 17h3"></path>
    `,
    utensils: `
      <path d="M6 3v7"></path>
      <path d="M8.5 3v7"></path>
      <path d="M11 3v7"></path>
      <path d="M8.5 10v11"></path>
      <path d="M17 3v18"></path>
      <path d="M17 3c2.2 1.4 3 4 3 7v1.5h-6"></path>
    `,
    newspaper: `
      <rect x="3" y="5" width="18" height="14" rx="2.5"></rect>
      <rect x="6.5" y="8.5" width="4" height="4" rx=".6" class="icon-fill"></rect>
      <path d="M12.5 9h4.5"></path>
      <path d="M12.5 12h4.5"></path>
      <path d="M6.5 15h10.5"></path>
    `,
    link: `
      <path d="M10 14 14 10"></path>
      <path d="M7.5 16.5l-1 1a3 3 0 0 1-4.2-4.2l3-3a3 3 0 0 1 4.2 0"></path>
      <path d="M16.5 7.5l1-1a3 3 0 0 1 4.2 4.2l-3 3a3 3 0 0 1-4.2 0"></path>
    `,
    logout: `
      <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"></path>
      <path d="M13 16l4-4-4-4"></path>
      <path d="M9 12h8"></path>
    `,
    menu: `
      <path d="M4 7h16"></path>
      <path d="M4 12h16"></path>
      <path d="M4 17h16"></path>
    `,
    circle: `
      <circle cx="12" cy="12" r="6" class="icon-fill"></circle>
    `,
  };

  return `
    <svg class="${escapeAttribute(className)}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
      ${svgBodyMap[iconName] || svgBodyMap.circle}
    </svg>
  `;
}

function metric(label, value, caption) {
  return `<div class="metric-card"><small>${escape(label)}</small><strong>${escape(value)}</strong><span>${escape(caption)}</span></div>`;
}

function getScreenTitle() {
  if (state.activeTab === DOCUMENT_VIEWER_TAB_ID) {
    return state.documentViewer.documentType === DOCUMENT_TYPES.studentCard ? "ID Digital" : "Documento";
  }

  if (state.activeTab === REGISTRATION_TAB_ID) {
    return "Cadastro";
  }

  if (state.activeTab === "academic") {
    const agendaTitleMap = {
      today: "Grade Horária",
      week: "Semana",
      menu: "RU",
    };
    return agendaTitleMap[state.agendaTab] || "Acadêmico";
  }

  const mainTitleMap = {
    home: "Início",
    elections: "Eleições",
    dagv: "DAGV",
    coordination: "Coordenação",
    agenda: "Agenda",
    info: "Informações",
    links: "Links",
  };

  return mainTitleMap[state.activeTab] || APP_NAME;
}

function renderStatusBanner(registration = getRegistrationState()) {
  const message = state.uploadError
    || state.authError
    || (!registration.isComplete ? buildRegistrationBannerMessage(registration) : "");
  if (!message) {
    return "";
  }

  const classes = ["toast", "compact-toast"];
  if (state.uploadError || state.authError) {
    classes.push("is-danger");
  } else if (!registration.isComplete) {
    classes.push("is-warning");
  }

  return `<div class="${classes.join(" ")}">${escape(message)}</div>`;
}

function renderHomeShortcut(iconName, label, action, tab) {
  return `
    <button class="quick-button" data-action="${escapeAttribute(action)}" ${tab ? `data-tab="${escapeAttribute(tab)}"` : ""}>
      <span class="quick-button-mark">${renderUiIcon(iconName, "quick-button-icon")}</span>
      <span class="quick-button-label">${escape(label)}</span>
    </button>
  `;
}

function shouldShowUploadStatusPanel() {
  if (state.uploadError) {
    return true;
  }

  return state.uploadProgress > 0 && state.uploadProgress < 100;
}

function renderSimpleInfoRow(label, value) {
  return `
    <div class="simple-info-row">
      <span>${escape(label)}</span>
      <strong>${escape(value)}</strong>
    </div>
  `;
}

function getScheduleUploads() {
  return state.uploads.filter((item) => item.documentType !== DOCUMENT_TYPES.studentCard);
}

function getStudentCardUploads() {
  return state.uploads.filter((item) => item.documentType === DOCUMENT_TYPES.studentCard);
}

function getRegistrationState() {
  const scheduleUploads = getScheduleUploads();
  const studentCardUploads = getStudentCardUploads();
  const scheduleUpload = getActiveUpload();
  const studentCardUpload = studentCardUploads[0] || null;
  const missing = [];

  if (!scheduleUpload) {
    missing.push("grade horaria");
  }

  if (!studentCardUpload) {
    missing.push("carteirinha estudantil");
  }

  return {
    scheduleUpload,
    studentCardUpload,
    missing,
    isComplete: !missing.length,
    scheduleUploads,
    studentCardUploads,
  };
}

function buildRegistrationBannerMessage(registration = getRegistrationState()) {
  if (registration.isComplete) {
    return "";
  }

  return `Aguardando finalizacao do cadastro: envie ${registration.missing.join(" e ")} antes da primeira utilizacao.`;
}

function ensureAccessAfterRegistration(action) {
  const registration = getRegistrationState();
  if (registration.isComplete) {
    return true;
  }

  const message = buildRegistrationBannerMessage(registration);
  setState({
    activeTab: REGISTRATION_TAB_ID,
    sidebarOpen: false,
    uploadError: "",
    uploadMessage: message || PENDING_REGISTRATION_MESSAGE,
  });

  return false;
}

async function onClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  maybePromptForClassNotifications(action);

  if (action === "toggle-sidebar") {
    setState({ sidebarOpen: !state.sidebarOpen });
    return;
  }

  if (action === "close-sidebar") {
    setState({ sidebarOpen: false });
    return;
  }

  if (action === "close-document-viewer") {
    closeDocumentViewer();
    return;
  }

  if (action === "open-registration") {
    revokeActiveDocumentViewer();
    setState({
      activeTab: REGISTRATION_TAB_ID,
      sidebarOpen: false,
      documentViewer: createEmptyDocumentViewerState(),
    });
    return;
  }

  if (action === "set-main-tab") {
    const nextTab = button.dataset.tab || "home";
    if (!ensureAccessAfterRegistration(action)) {
      return;
    }
    revokeActiveDocumentViewer();
    setState({
      activeTab: nextTab,
      sidebarOpen: false,
      documentViewer: createEmptyDocumentViewerState(),
    });
    if (PORTAL_TABS.has(nextTab)) {
      loadPortalTab(nextTab, true);
    }
    return;
  }

  if (action === "set-agenda-tab") {
    if (!ensureAccessAfterRegistration(action)) {
      return;
    }
    revokeActiveDocumentViewer();
    setState({
      activeTab: "academic",
      agendaTab: button.dataset.tab || "today",
      sidebarOpen: false,
      documentViewer: createEmptyDocumentViewerState(),
    });
    return;
  }

  if (action === "open-academic-tab") {
    if (!ensureAccessAfterRegistration(action)) {
      return;
    }
    revokeActiveDocumentViewer();
    setState({
      activeTab: "academic",
      agendaTab: button.dataset.tab || "today",
      sidebarOpen: false,
      documentViewer: createEmptyDocumentViewerState(),
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

  if (action === "login-google") {
    loginWithGoogle();
    return;
  }

  if (action === "reload-app") {
    window.location.reload();
    return;
  }

  if (action === "logout") {
    logout();
    return;
  }

  if (action === "open-student-card") {
    const studentCardUpload = getRegistrationState().studentCardUpload;
    if (!studentCardUpload) {
      revokeActiveDocumentViewer();
      setState({
        activeTab: REGISTRATION_TAB_ID,
        sidebarOpen: false,
        documentViewer: createEmptyDocumentViewerState(),
        uploadError: "",
        uploadMessage: "A carteirinha digital ainda aguarda o PDF oficial do aluno.",
      });
      return;
    }

    setState({ sidebarOpen: false });
    openUpload(studentCardUpload.id, { inline: true });
    return;
  }

  if (action === "refresh-uploads") {
    refreshRemoteUploads();
    return;
  }

  if (action === "set-active-upload") {
    setActiveUpload(button.dataset.uploadId || "");
    return;
  }

  if (action === "open-upload") {
    openUpload(button.dataset.uploadId || "", { inline: true });
  }
}

function onInput(event) {
  if (event.target.id && String(event.target.id).startsWith("login")) {
    setState({ authError: "" }, { render: false });
  }
}

function onChange(event) {
  if (event.target.id === "referenceDate") {
    setState({ referenceDate: event.target.value || toISO(new Date()) });
    return;
  }

  if (event.target.id === "schedulePdfInput" && event.target.files && event.target.files[0]) {
    uploadDocument(event.target.files[0], event.target, DOCUMENT_TYPES.schedule);
    return;
  }

  if (event.target.id === "studentCardInput" && event.target.files && event.target.files[0]) {
    uploadDocument(event.target.files[0], event.target, DOCUMENT_TYPES.studentCard);
  }
}

async function logout() {
  if (!services.supabase) return;

  try {
    revokeActiveDocumentViewer();
    stopUserSubscriptions();
    const { error } = await services.supabase.auth.signOut();
    if (error) {
      throw error;
    }

    setState({
      authError: "",
      uploadError: "",
      uploadMessage: "",
      uploadProgress: 0,
      openingUploadId: "",
      activeTab: "home",
      agendaTab: "today",
      sidebarOpen: false,
      documentViewer: createEmptyDocumentViewerState(),
      syncMessage: "Sessão encerrada. Entre novamente para acessar seus PDFs.",
    });
  } catch (error) {
    setState({ authError: `Não consegui encerrar a sessão: ${describeSupabaseError(error)}` });
  }
}

async function loginWithGoogle() {
  if (state.authChecking) return;

  if (!state.supabaseReady) {
    setState({ authError: `Preencha ${SUPABASE_CONFIG_FILE} antes de usar o login Google.` });
    return;
  }

  if (!state.canUseGoogleAuth) {
    setState({ authError: "Abra o app em http://localhost:4173 ou no deploy para autenticar com Google." });
    return;
  }

  if (!services.supabase) {
    setState({ authError: "O cliente do Supabase ainda não foi inicializado." });
    return;
  }

  setState({
    authChecking: true,
    authError: "",
    uploadError: "",
    uploadMessage: "Redirecionando para o login Google...",
  });

  try {
    const { data, error } = await services.supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: "select_account" },
      },
    });

    if (error) {
      throw error;
    }

    if (data?.url) {
      window.location.href = data.url;
      return;
    }

    setState({
      authChecking: false,
      uploadMessage: "Abrindo o login Google...",
    });
  } catch (error) {
    setState({
      authChecking: false,
      authError: describeSupabaseError(error),
      uploadMessage: "",
    });
  }
}

async function refreshRemoteUploads() {
  if (!state.user || !services.supabase) return;

  setState({
    uploadError: "",
    uploadMessage: "Atualizando os documentos da conta...",
  });

  try {
    await reloadRemoteAccountData(state.user.uid);
    setState({
      uploadError: "",
      uploadMessage: "Lista de documentos atualizada com sucesso.",
    });
  } catch (error) {
    setState({
      uploadError: `Não consegui atualizar a lista de documentos: ${describeSupabaseError(error)}`,
      uploadMessage: "",
    });
  }
}

async function uploadDocument(file, inputElement, documentType) {
  if (documentType === DOCUMENT_TYPES.studentCard) {
    await uploadStudentCardDocument(file, inputElement);
    return;
  }

  await uploadScheduleDocument(file, inputElement);
}

async function uploadScheduleDocument(file, inputElement) {
  if (!state.user || !services.supabase) {
    setState({ uploadError: "Entre com Google antes de enviar o PDF.", uploadMessage: "", uploadProgress: 0 });
    inputElement.value = "";
    return;
  }

  if (!isPdfFile(file)) {
    setState({ uploadError: "Selecione um arquivo PDF valido do SCA.", uploadMessage: "", uploadProgress: 0 });
    inputElement.value = "";
    return;
  }

  const uploadId = (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
    ? crypto.randomUUID()
    : createUploadId();
  const uploadedAtClient = new Date().toISOString();
  const normalizedName = normalizeFileName(file.name);
  const storagePath = `${state.user.uid}/schedule/${uploadId}/${normalizedName}`;
  const bucketName = getSupabaseBucketName();

  setState({
    uploadError: "",
    uploadMessage: `Lendo ${file.name}...`,
    uploadProgress: 8,
    activeTab: REGISTRATION_TAB_ID,
  });

  try {
    const academicData = await parseAcademicPdf(file, {
      displayName: state.user.displayName,
      studentName: state.user.displayName,
    });

    setState({
      uploadProgress: 56,
      uploadMessage: "Organizando horários, disciplinas e dados do aluno...",
      uploadError: "",
    });

    try {
      await upsertUploadRow({
        id: uploadId,
        ownerUid: state.user.uid,
        originalName: file.name,
        normalizedName,
        storagePath,
        size: file.size,
        contentType: file.type || "application/pdf",
        status: "uploading",
        parserStatus: "parsed_locally",
        uploadedAtClient,
        notes: "PDF lido com sucesso e aguardando envio para o Storage.",
        academicData,
      });

      setState({
        uploadProgress: 72,
        uploadMessage: `Enviando ${file.name} para a conta do aluno...`,
        uploadError: "",
      });

      const { error: storageError } = await services.supabase
        .storage
        .from(bucketName)
        .upload(storagePath, file, {
          contentType: file.type || "application/pdf",
          upsert: false,
        });

      if (storageError) {
        throw storageError;
      }

      setState({
        uploadProgress: 90,
        uploadMessage: "Salvando os metadados do PDF na conta...",
        uploadError: "",
      });

      const hasAcademicData = Boolean(academicData.schedule.length || academicData.disciplines.length);

      await upsertUploadRow({
        id: uploadId,
        ownerUid: state.user.uid,
        originalName: file.name,
        normalizedName,
        storagePath,
        size: file.size,
        contentType: file.type || "application/pdf",
        status: hasAcademicData ? "processed" : "limited",
        parserStatus: "ready",
        uploadedAtClient,
        notes: hasAcademicData
          ? "PDF enviado e dados acadêmicos sincronizados com a conta."
          : "PDF enviado, mas com leitura parcial dos dados acadêmicos.",
        academicData,
      });

      await upsertSupabaseProfile(state.user, {
        display_name: state.user.displayName || academicData.profile?.studentName || "",
        active_upload_id: uploadId,
        active_upload_name: file.name,
        last_upload_at_client: uploadedAtClient,
      });

      await reloadRemoteAccountData(state.user.uid);

      setState({
        uploadProgress: 100,
        uploadMessage: hasAcademicData
          ? "Grade horaria importada e sincronizada com sucesso."
          : "Grade horaria enviada para a conta, mas com reconhecimento parcial dos dados academicos.",
        uploadError: "",
        referenceDate: suggestReferenceDate(academicData.schedule, state.referenceDate),
      });
    } catch (storageError) {
      try {
        await upsertUploadRow({
          id: uploadId,
          ownerUid: state.user.uid,
          originalName: file.name,
          normalizedName,
          storagePath,
          size: file.size,
          contentType: file.type || "application/pdf",
          status: "error",
          parserStatus: "storage_failed",
          uploadedAtClient,
          notes: describeSupabaseError(storageError),
          academicData,
        });
      } catch (secondaryError) {
        // Mantemos o erro original para a interface.
      }

      throw storageError;
    }
  } catch (error) {
    setState({
      uploadProgress: 0,
      uploadMessage: "",
      uploadError: `Não consegui importar este PDF do SCA: ${describeSupabaseError(error)}`,
    });
  } finally {
    inputElement.value = "";
  }
}

async function uploadStudentCardDocument(file, inputElement) {
  if (!state.user || !services.supabase) {
    setState({ uploadError: "Entre com Google antes de enviar a carteirinha.", uploadMessage: "", uploadProgress: 0 });
    inputElement.value = "";
    return;
  }

  if (!isPdfFile(file)) {
    setState({ uploadError: "Selecione um arquivo PDF valido para a carteirinha estudantil.", uploadMessage: "", uploadProgress: 0 });
    inputElement.value = "";
    return;
  }

  const uploadId = (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
    ? crypto.randomUUID()
    : createUploadId();
  const uploadedAtClient = new Date().toISOString();
  const normalizedName = normalizeFileName(file.name);
  const storagePath = `${state.user.uid}/student-card/${uploadId}/${normalizedName}`;
  const bucketName = getSupabaseBucketName();

  setState({
    uploadError: "",
    uploadMessage: `Enviando ${file.name} como carteirinha estudantil...`,
    uploadProgress: 24,
    activeTab: REGISTRATION_TAB_ID,
  });

  try {
    await upsertUploadRow({
      id: uploadId,
      ownerUid: state.user.uid,
      originalName: file.name,
      normalizedName,
      storagePath,
      size: file.size,
      contentType: file.type || "application/pdf",
      status: "uploading",
      parserStatus: "student_card_pending",
      uploadedAtClient,
      notes: "Carteirinha estudantil aguardando envio completo para o Storage.",
      academicData: null,
    });

    const { error: storageError } = await services.supabase
      .storage
      .from(bucketName)
      .upload(storagePath, file, {
        contentType: file.type || "application/pdf",
        upsert: false,
      });

    if (storageError) {
      throw storageError;
    }

    await upsertUploadRow({
      id: uploadId,
      ownerUid: state.user.uid,
      originalName: file.name,
      normalizedName,
      storagePath,
      size: file.size,
      contentType: file.type || "application/pdf",
      status: "uploaded",
      parserStatus: "student_card_ready",
      uploadedAtClient,
      notes: "Carteirinha estudantil salva e pronta para abrir pelo menu lateral.",
      academicData: null,
    });

    await reloadRemoteAccountData(state.user.uid);

    setState({
      uploadProgress: 100,
      uploadMessage: "Carteirinha estudantil vinculada com sucesso. O item ID Digital ja pode abrir o PDF.",
      uploadError: "",
    });
  } catch (error) {
    setState({
      uploadProgress: 0,
      uploadMessage: "",
      uploadError: `Nao consegui vincular a carteirinha estudantil: ${describeSupabaseError(error)}`,
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
      throw new Error(`servidor: ${describeLocalError(serverError)}; navegador: ${describeLocalError(deviceError)}`);
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

async function setActiveUpload(uploadId) {
  if (!state.user || !uploadId || !services.supabase) return;

  const upload = getScheduleUploads().find((item) => item.id === uploadId);
  if (!upload) return;

  try {
    await upsertSupabaseProfile(state.user, {
      active_upload_id: upload.id,
      active_upload_name: upload.originalName,
    });

    await reloadRemoteAccountData(state.user.uid);

    setState({
      uploadMessage: `${upload.originalName} agora é o PDF ativo desta conta.`,
      uploadError: "",
    });
  } catch (error) {
    setState({
      uploadError: `Não consegui definir o PDF ativo: ${describeSupabaseError(error)}`,
      uploadMessage: "",
    });
  }
}

async function openUpload(uploadId, options = {}) {
  if (!uploadId) return;
  const inline = options.inline !== false;
  const record = state.uploads.find((item) => item.id === uploadId);
  if (!record || !record.storagePath || !services.supabase) {
    setState({
      uploadError: "Não consegui localizar este PDF agora.",
      uploadMessage: "",
      openingUploadId: "",
    });
    return;
  }

  const sourceTab = state.activeTab === DOCUMENT_VIEWER_TAB_ID
    ? (state.documentViewer.sourceTab || REGISTRATION_TAB_ID)
    : state.activeTab;
  const sourceAgendaTab = state.activeTab === DOCUMENT_VIEWER_TAB_ID
    ? (state.documentViewer.sourceAgendaTab || state.agendaTab)
    : state.agendaTab;

  revokeActiveDocumentViewer();
  setState({
    openingUploadId: uploadId,
    uploadError: "",
    uploadMessage: inline ? "Carregando o PDF dentro do app..." : "Abrindo o PDF da conta...",
    activeTab: inline ? DOCUMENT_VIEWER_TAB_ID : state.activeTab,
    documentViewer: inline
      ? {
          uploadId,
          title: record.originalName,
          objectUrl: "",
          documentType: record.documentType,
          sourceTab,
          sourceAgendaTab,
          loading: true,
        }
      : state.documentViewer,
  });

  try {
    const { data, error } = await services.supabase
      .storage
      .from(getSupabaseBucketName())
      .createSignedUrl(record.storagePath, 300);

    if (error || !data?.signedUrl) {
      throw error || new Error("não consegui criar um link temporário para este PDF");
    }

    if (!inline) {
      window.open(data.signedUrl, "_blank", "noopener");
      setState({ openingUploadId: "", uploadMessage: `${record.originalName} aberto em nova aba.`, uploadError: "" });
      return;
    }

    const response = await fetch(data.signedUrl, {
      method: "GET",
      cache: "no-store",
      credentials: "omit",
    });

    if (!response.ok) {
      throw new Error("não consegui baixar o PDF da conta");
    }

    const pdfBlob = await response.blob();
    const objectUrl = URL.createObjectURL(pdfBlob);

    setState({
      openingUploadId: "",
      uploadMessage: record.documentType === DOCUMENT_TYPES.studentCard
        ? "ID digital carregado dentro do app."
        : `${record.originalName} carregado dentro do app.`,
      uploadError: "",
      activeTab: DOCUMENT_VIEWER_TAB_ID,
      documentViewer: {
        uploadId,
        title: record.originalName,
        objectUrl,
        documentType: record.documentType,
        sourceTab,
        sourceAgendaTab,
        loading: false,
      },
    });
  } catch (error) {
    revokeActiveDocumentViewer();
    setState({
      openingUploadId: "",
      activeTab: sourceTab,
      agendaTab: sourceAgendaTab,
      documentViewer: createEmptyDocumentViewerState(),
      uploadError: `Não consegui abrir o PDF: ${describeSupabaseError(error)}`,
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

function refreshRuMenuIfNeeded(silent = true) {
  if (shouldRefreshRuMenu()) {
    void refreshRuMenu(silent);
  }
}

function shouldRefreshRuMenu() {
  if (!state.lastMenuSync) {
    return true;
  }

  const lastSyncTime = new Date(state.lastMenuSync).getTime();
  if (!Number.isFinite(lastSyncTime)) {
    return true;
  }

  return (Date.now() - lastSyncTime) >= MENU_AUTO_REFRESH_MS;
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
    return "Entre na conta do aluno, envie o PDF oficial do SCA e acompanhe a agenda do DA em qualquer aparelho.";
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
  const scheduleUploads = getScheduleUploads();
  if (!scheduleUploads.length) return null;
  const activeId = state.profile?.activeUploadId || "";
  return scheduleUploads.find((item) => item.id === activeId) || scheduleUploads[0] || null;
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
  if (upload.documentType === DOCUMENT_TYPES.studentCard) {
    if (upload.status === "uploading") return "Enviando";
    if (upload.status === "error") return "Falhou";
    return "Pronto";
  }
  if (upload.status === "processed") return "Importado";
  if (upload.status === "limited") return "Importado parcialmente";
  if (upload.status === "uploading") return "Enviando";
  if (upload.status === "error") return "Falhou";
  if (upload.status === "uploaded") return "Salvo";
  return upload.status || "Salvo";
}

function getStatusMessage() {
  return state.uploadError || state.authError || state.uploadMessage || state.syncMessage;
}

function hasSupabaseConfig(config) {
  return [config.url, config.anonKey]
    .every((value) => value && !String(value).includes("COLE_AQUI") && !String(value).includes("PREENCHA"));
}

function describeSupabaseError(error) {
  const code = String(error?.code || error?.error_code || "");
  const message = String(error?.message || error?.error_description || "");
  const fallback = describeLocalError(error);
  const normalized = `${code} ${message}`.toLowerCase();

  if (normalized.includes("network") || normalized.includes("fetch")) {
    return "não consegui falar com o Supabase agora; confira a conexão e tente novamente";
  }

  if (normalized.includes("invalid login credentials")) {
    return "não consegui autenticar com essa conta Google";
  }

  if (normalized.includes("provider is not enabled")) {
    return "habilite o Google em Authentication > Providers dentro do Supabase";
  }

  if (normalized.includes("redirect") && normalized.includes("allow")) {
    return "adicione esta URL em Authentication > URL Configuration no Supabase";
  }

  if (normalized.includes("row-level security") || normalized.includes("permission denied")) {
    return "as policies do Supabase ainda não permitem esta operação para o aluno atual";
  }

  if (normalized.includes("duplicate key")) {
    return "este PDF já foi salvo anteriormente na conta";
  }

  if (normalized.includes("mime type") || normalized.includes("invalid file")) {
    return "o bucket só aceita PDF; confira o arquivo enviado";
  }

  if (normalized.includes("bucket not found")) {
    return "não encontrei o bucket configurado no Supabase Storage";
  }

  if (normalized.includes("object not found")) {
    return "não encontrei o PDF no armazenamento da conta";
  }

  return fallback;
}

function readPublicSupabaseConfig(rawConfig) {
  return Object.freeze({
    url: String(rawConfig?.url || "").trim(),
    anonKey: String(rawConfig?.anonKey || rawConfig?.publishableKey || "").trim(),
    bucket: String(rawConfig?.bucket || SUPABASE_BUCKET || "").trim(),
  });
}

function clearPublicBootstrapData() {
  try {
    delete window.UFTM_SUPABASE_CONFIG;
  } catch (error) {
    window.UFTM_SUPABASE_CONFIG = undefined;
  }
}

function clearSensitiveUrlData() {
  try {
    const url = new URL(window.location.href);
    const keys = ["code", "access_token", "refresh_token", "token_type", "expires_in", "expires_at", "provider_token", "provider_refresh_token"];
    let changed = false;

    for (const key of keys) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    }

    if (url.hash) {
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
      let hashChanged = false;
      for (const key of keys) {
        if (hashParams.has(key)) {
          hashParams.delete(key);
          hashChanged = true;
        }
      }

      if (hashChanged) {
        url.hash = hashParams.toString() ? `#${hashParams.toString()}` : "";
        changed = true;
      }
    }

    if (changed) {
      window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
    }
  } catch (error) {
    // Ignoramos falhas de limpeza de URL para não interromper o app.
  }
}

function revokeActiveDocumentViewer() {
  try {
    if (state.documentViewer?.objectUrl) {
      URL.revokeObjectURL(state.documentViewer.objectUrl);
    }
  } catch (error) {
    // Ignoramos falhas ao liberar o blob do viewer.
  }
}

function closeDocumentViewer() {
  const sourceTab = state.documentViewer?.sourceTab || REGISTRATION_TAB_ID;
  const sourceAgendaTab = state.documentViewer?.sourceAgendaTab || "today";
  revokeActiveDocumentViewer();
  setState({
    activeTab: sourceTab,
    agendaTab: sourceAgendaTab,
    openingUploadId: "",
    documentViewer: createEmptyDocumentViewerState(),
    uploadError: "",
    uploadMessage: "",
  });
}

function supportsClassNotifications() {
  return typeof window !== "undefined"
    && "Notification" in window
    && "serviceWorker" in navigator;
}

async function registerNotificationServiceWorker() {
  if (!supportsClassNotifications()) {
    return null;
  }

  if (notificationServiceWorkerRegistration) {
    return notificationServiceWorkerRegistration;
  }

  try {
    notificationServiceWorkerRegistration = await navigator.serviceWorker.register("./service-worker.js");
    syncClassNotifications();
    return notificationServiceWorkerRegistration;
  } catch (error) {
    return null;
  }
}

function maybePromptForClassNotifications(action) {
  if (!supportsClassNotifications()) {
    return;
  }

  if (!state.user || !hasCompletedRegistration(state.uploads, state.profile)) {
    return;
  }

  if (Notification.permission !== "default") {
    return;
  }

  if (hasNotificationPromptBeenAttempted()) {
    return;
  }

  if (["close-sidebar", "toggle-sidebar", "logout", "reload-app"].includes(action)) {
    return;
  }

  rememberNotificationPromptAttempt();
  void requestClassNotificationPermission();
}

async function requestClassNotificationPermission() {
  if (!supportsClassNotifications() || Notification.permission !== "default") {
    return Notification.permission;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await registerNotificationServiceWorker();
      syncClassNotifications();
    }
    return permission;
  } catch (error) {
    return "default";
  }
}

function syncClassNotifications() {
  clearClassNotificationTimer();

  if (!supportsClassNotifications() || Notification.permission !== "granted" || !state.user) {
    stopClassNotificationHeartbeat();
    return;
  }

  const activeUpload = getActiveUpload();
  const schedule = getAcademicData(activeUpload)?.schedule || [];
  if (!schedule.length) {
    stopClassNotificationHeartbeat();
    return;
  }

  startClassNotificationHeartbeat();
  const nextReminder = getNextClassReminder(schedule, activeUpload?.id || "");
  if (!nextReminder) {
    return;
  }

  scheduledReminderKey = nextReminder.key;
  classNotificationTimerId = window.setTimeout(() => {
    classNotificationTimerId = 0;
    scheduledReminderKey = "";
    void fireClassReminderNotification(nextReminder);
  }, nextReminder.delayMs);
}

function clearClassNotificationTimer() {
  if (classNotificationTimerId) {
    window.clearTimeout(classNotificationTimerId);
    classNotificationTimerId = 0;
  }
  scheduledReminderKey = "";
}

function startClassNotificationHeartbeat() {
  if (classNotificationHeartbeatId) {
    return;
  }

  classNotificationHeartbeatId = window.setInterval(() => {
    syncClassNotifications();
  }, 60 * 1000);
}

function stopClassNotificationHeartbeat() {
  if (classNotificationHeartbeatId) {
    window.clearInterval(classNotificationHeartbeatId);
    classNotificationHeartbeatId = 0;
  }
}

function getNextClassReminder(schedule, uploadId) {
  const reminders = listUpcomingClassReminders(schedule, uploadId);
  return reminders.find((item) => !hasReminderBeenShown(item.key)) || null;
}

function listUpcomingClassReminders(schedule, uploadId) {
  const reminders = [];
  const now = Date.now();
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  for (let offset = 0; offset <= NOTIFICATION_LOOKAHEAD_DAYS; offset += 1) {
    const day = addDays(startOfToday, offset);
    const isoDate = toISO(day);
    const classes = getClassesForDate(schedule, isoDate);

    for (const classItem of classes) {
      const startAt = combineIsoDateAndTime(isoDate, classItem.startTime);
      if (!startAt || Number.isNaN(startAt.getTime()) || startAt.getTime() <= now) {
        continue;
      }

      const rawNotifyAt = startAt.getTime() - (CLASS_NOTIFICATION_LEAD_MINUTES * 60 * 1000);
      const notifyAt = rawNotifyAt <= now ? now + 1000 : rawNotifyAt;
      const key = buildClassReminderKey(uploadId, isoDate, classItem);

      reminders.push({
        key,
        title: classItem.title || "Aula",
        group: classItem.group || "",
        teacher: classItem.teacher || "",
        startTime: classItem.startTime || "",
        startAt,
        isoDate,
        delayMs: Math.max(0, notifyAt - now),
      });
    }
  }

  return reminders.sort((left, right) => left.delayMs - right.delayMs);
}

function buildClassReminderKey(uploadId, isoDate, classItem) {
  return [
    uploadId || "schedule",
    isoDate,
    classItem?.startTime || "",
    classItem?.title || "aula",
    classItem?.group || "",
  ].join("|");
}

function combineIsoDateAndTime(isoDate, time) {
  const [year, month, day] = String(isoDate || "").split("-").map(Number);
  const [hours, minutes] = String(time || "").split(":").map(Number);

  if (!year || !month || !day || !Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

async function fireClassReminderNotification(reminder) {
  if (!supportsClassNotifications() || Notification.permission !== "granted") {
    return;
  }

  if (hasReminderBeenShown(reminder.key)) {
    syncClassNotifications();
    return;
  }

  rememberReminderShown(reminder.key, reminder.startAt);
  const bodyParts = [
    `Sua aula ${reminder.title} comeca as ${reminder.startTime}.`,
    reminder.group ? `Turma ${reminder.group}.` : "",
  ].filter(Boolean);

  try {
    const registration = await registerNotificationServiceWorker();
    if (registration?.showNotification) {
      await registration.showNotification("Aula em 10 minutos", {
        body: bodyParts.join(" "),
        icon: "./icon.png",
        badge: "./icon.png",
        tag: reminder.key,
        renotify: false,
        data: {
          path: "/",
          section: "academic",
        },
      });
    } else {
      const notification = new Notification("Aula em 10 minutos", {
        body: bodyParts.join(" "),
        icon: "./icon.png",
        tag: reminder.key,
      });
      window.setTimeout(() => notification.close(), 12000);
    }
  } catch (error) {
    // Se falhar, evitamos interromper o app.
  } finally {
    syncClassNotifications();
  }
}

function hasNotificationPromptBeenAttempted() {
  try {
    return Boolean(localStorage.getItem(NOTIFICATION_PROMPT_STORAGE_KEY));
  } catch (error) {
    return true;
  }
}

function rememberNotificationPromptAttempt() {
  try {
    localStorage.setItem(NOTIFICATION_PROMPT_STORAGE_KEY, new Date().toISOString());
  } catch (error) {
    // Ignoramos falhas de armazenamento do prompt.
  }
}

function readReminderHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(NOTIFICATION_HISTORY_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeReminderHistory(items) {
  try {
    localStorage.setItem(NOTIFICATION_HISTORY_STORAGE_KEY, JSON.stringify(items.slice(-160)));
  } catch (error) {
    // Ignoramos falhas de armazenamento da fila local.
  }
}

function hasReminderBeenShown(reminderKey) {
  const now = Date.now();
  const history = readReminderHistory().filter((item) => Number(item?.expiresAt || 0) > now);
  if (history.length) {
    writeReminderHistory(history);
  }
  return history.some((item) => item.key === reminderKey);
}

function rememberReminderShown(reminderKey, startAt) {
  const now = Date.now();
  const history = readReminderHistory().filter((item) => Number(item?.expiresAt || 0) > now);
  history.push({
    key: reminderKey,
    expiresAt: new Date(startAt.getTime() + (24 * 60 * 60 * 1000)).getTime(),
  });
  writeReminderHistory(history);
}

function timestampToIso(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  return "";
}

function renderMissingPdfState(message) {
  return `
    <div class="empty-state">
      ${escape(message)}
      <div class="button-row" style="margin-top: 0.75rem;">
        <button class="ghost" data-action="open-registration">Abrir cadastro</button>
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
      sidebarOpen: state.sidebarOpen,
      referenceDate: state.referenceDate,
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
  syncClassNotifications();
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
  const message = String(error?.message || "").toLowerCase();

  if (!message) {
    return "não consegui concluir esta etapa agora";
  }

  if (message.includes("fetch") || message.includes("network") || message.includes("failed to fetch")) {
    return "não consegui falar com o servidor agora";
  }

  if (message.includes("pdf")) {
    return "não consegui processar o PDF informado";
  }

  if (message.includes("permission") || message.includes("security") || message.includes("denied")) {
    return "o navegador bloqueou esta operação";
  }

  if (message.includes("timeout")) {
    return "a operação demorou mais do que o esperado";
  }

  if (message.includes("auth") || message.includes("oauth") || message.includes("token")) {
    return "não consegui concluir a autenticação agora";
  }

  return "não consegui concluir esta etapa agora";
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
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : ((random & 0x3) | 0x8);
    return value.toString(16);
  });
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

function uniqueBy(items, selector) {
  const map = new Map();

  for (const item of items || []) {
    map.set(selector(item), item);
  }

  return Array.from(map.values());
}
