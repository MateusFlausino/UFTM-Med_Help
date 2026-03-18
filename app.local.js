import { extractScaPdfData } from "./sca-parser.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?bundle";

const APP_NAME = "Agenda DAGV";
const APP_MARK = "DAGV";
const APP_TAGLINE = "Horários, RU e SCA no espaço do DA";
const DA_PORTAL_URL = "https://dagvmeduftm.wordpress.com/";
const SUPABASE_CONFIG_FILE = "supabase-config.js";
const SUPABASE_BUCKET = "student-pdfs";

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
const supabaseConfig = window.UFTM_SUPABASE_CONFIG || {};
const supabaseReady = hasSupabaseConfig(supabaseConfig);
const canUseGoogleAuth = window.location.protocol !== "file:";
const services = {
  supabase: null,
};
let localDbPromise = null;
let persistentUploadsIssue = "";
let authSubscription = null;

let state = {
  activeTab: uiState.activeTab || "home",
  agendaTab: uiState.agendaTab || "today",
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
  portalContent: {},
  newsFeed: [],
  portalLoadingTab: "",
  portalError: "",
};

appElement.addEventListener("click", onClick);
appElement.addEventListener("change", onChange);
appElement.addEventListener("input", onInput);

init().catch((error) => {
  console.error("Falha ao iniciar o painel do DAGV com Supabase.", error);
  appElement.innerHTML = renderStartupFailure(error);
});

async function init() {
  render();
  loadPortalTab("home", true);
  refreshRuMenu(true);

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
      activeTab: uploads.length ? state.activeTab : "academic",
      agendaTab: uploads.length ? state.agendaTab : "sca",
      uploadError: "",
      uploadMessage: uploads.length
        ? "Conta conectada. Seus PDFs privados foram sincronizados."
        : "Conta conectada. Envie o primeiro PDF do SCA para montar a agenda.",
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
  const activeUpload = uploads.find((item) => item.id === profile.activeUploadId) || uploads[0] || null;
  const academicData = getAcademicData(activeUpload);

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
    activeTab: uploads.length ? state.activeTab : "academic",
    agendaTab: uploads.length ? state.agendaTab : "sca",
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
  return {
    id: String(row?.id || ""),
    ownerUid: String(row?.owner_uid || ""),
    originalName: String(row?.original_name || "PDF sem nome"),
    normalizedName: String(row?.normalized_name || ""),
    storagePath: String(row?.storage_path || ""),
    size: Number(row?.size || 0),
    contentType: String(row?.content_type || "application/pdf"),
    status: String(row?.status || "uploaded"),
    parserStatus: String(row?.parser_status || ""),
    uploadedAtClient: String(row?.uploaded_at_client || ""),
    updatedAt: String(row?.updated_at || row?.uploaded_at_client || ""),
    createdAt: String(row?.created_at || ""),
    notes: String(row?.notes || ""),
    academicData: row?.academic_data || null,
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

  const activeUpload = getActiveUpload();
  const statusBanner = renderStatusBanner();

  appElement.innerHTML = `
    <div class="app-view ios-shell campus-shell">
      <header class="header-bar compact-header">
        <button class="brand-mark brand-mark-button" data-action="set-main-tab" data-tab="home">${APP_MARK}</button>
        <div class="header-brand header-brand-centered">
          <div class="header-copy">
            <span class="header-kicker">Painel do DAGV</span>
            <h1>${escape(getScreenTitle())}</h1>
          </div>
        </div>
        <div class="button-row">
          <button class="ghost header-action" data-action="sync-ru">RU</button>
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
          <div class="toolbar-caption">${escape(APP_TAGLINE)}</div>
        </div>
      </section>

      ${statusBanner}

      <nav class="primary-nav primary-nav-minimal" aria-label="Abas do DAGV">
        ${MAIN_NAV_ITEMS.map(renderMainTabButton).join("")}
      </nav>

      ${renderMainPanel(activeUpload)}
    </div>
  `;
}

function renderLogin() {
  const canLogin = !state.authChecking && state.supabaseReady && state.canUseGoogleAuth;
  const loginLabel = state.authChecking ? "Conectando..." : "Entrar com Google";
  const setupTitle = !state.supabaseReady
    ? `Configure o arquivo ${SUPABASE_CONFIG_FILE} para habilitar login Google e PDFs privados na nuvem.`
    : !state.canUseGoogleAuth
      ? "Abra o app em http://localhost:4173 ou no deploy para usar o login Google."
      : "Entre com sua conta Google para guardar PDFs do SCA na nuvem e acessar a agenda em qualquer aparelho.";

  return `
    <div class="login-layout">
      <section class="login-card">
        <span class="eyebrow">Painel do DA</span>
        <h1>${APP_NAME}, com login Google e PDFs privados na nuvem.</h1>
        <p>${escape(setupTitle)}</p>
        <div class="login-actions" style="margin-top: 1rem;">
          <button class="cta" data-action="login-google" ${canLogin ? "" : "disabled"}>${escape(loginLabel)}</button>
          <a class="ghost link-button" href="${escapeAttribute(DA_PORTAL_URL)}" target="_blank" rel="noreferrer">Portal do DA</a>
          <button class="ghost" data-action="sync-ru">Atualizar RU</button>
        </div>
        <div class="toast ${state.authError ? "is-warning" : ""}" style="margin-top: 1rem;">
          ${escape(state.authError || state.syncMessage || "O login acontece pelo Google via Supabase Auth. Os PDFs privados ficam no Storage da sua conta.")}
        </div>
        <div class="facts-grid" style="margin-top: 1.25rem;">
          <div class="fact"><strong>Conta online</strong><p>login com Google</p></div>
          <div class="fact"><strong>Do DA</strong><p>marca e entrada centralizadas no diretório</p></div>
          <div class="fact"><strong>PDF privado</strong><p>guardado no bucket privado do aluno</p></div>
        </div>
      </section>

      <aside class="preview-card">
        <span class="eyebrow">Identidade DAGV</span>
        <h2 class="preview-title">Horários, RU e SCA reunidos em um painel do DA.</h2>
        <p class="preview-copy">
          O aluno entra com Google, envia o PDF real do SCA e acompanha agenda, semana e RU em uma interface pensada para o diretório acadêmico.
        </p>
        <div class="pill-grid">
          <div class="preview-pill"><strong>Painel do DA</strong><span>atalho direto para o portal estudantil</span></div>
          <div class="preview-pill"><strong>PDF privado</strong><span>armazenado no Supabase Storage</span></div>
          <div class="preview-pill"><strong>Agenda real</strong><span>horários e disciplinas saem do SCA</span></div>
        </div>
        <div class="mini-stack">
          <div class="mini-card"><small>Passo 1</small><strong>Entrar</strong><span>use sua conta Google</span></div>
          <div class="mini-card"><small>Passo 2</small><strong>Enviar PDF</strong><span>o arquivo fica salvo na conta</span></div>
          <div class="mini-card"><small>Passo 3</small><strong>Acompanhar o dia</strong><span>aulas e RU sincronizam após a leitura</span></div>
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
        <h1>Não consegui iniciar o painel online.</h1>
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
            <button class="secondary" data-action="open-academic-tab" data-tab="${academicData ? "today" : "sca"}">${academicData ? "Abrir agenda" : "Importar PDF"}</button>
            <button class="ghost" data-action="set-main-tab" data-tab="dagv">Portal do DAGV</button>
          </div>
        </section>

        <section class="home-shortcuts">
          ${renderHomeShortcut("HJ", "Hoje", "open-academic-tab", "today")}
          ${renderHomeShortcut("RU", "RU", "open-academic-tab", "menu")}
          ${renderHomeShortcut("GR", "Semana", "open-academic-tab", "week")}
          ${renderHomeShortcut("PDF", "SCA", "open-academic-tab", "sca")}
          ${renderHomeShortcut("DA", "DAGV", "set-main-tab", "dagv")}
          ${renderHomeShortcut("LK", "Links", "set-main-tab", "links")}
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
          <button class="ghost" data-action="refresh-portal-tab" data-tab="${escapeAttribute(state.activeTab)}">${state.portalLoadingTab === state.activeTab ? "Atualizando..." : "Atualizar conteúdo"}</button>
        </div>
        <p class="section-copy">${escape(descriptionMap[state.activeTab] || "Conteúdo do DAGV carregado dentro do aplicativo.")}</p>
        ${state.portalError && state.portalLoadingTab !== state.activeTab ? `<div class="toast is-warning" style="margin-top: 1rem;">${escape(state.portalError)}</div>` : ""}
      </section>

      ${state.portalLoadingTab === state.activeTab && !pages.length
        ? `<div class="empty-state">Carregando o conteúdo atualizado do DAGV...</div>`
        : pages.length
          ? `<section class="section-stack">${pages.map(renderPortalPage).join("")}</section>`
          : `<div class="empty-state">Ainda não consegui carregar o conteúdo desta aba. Toque em atualizar para tentar novamente.</div>`}
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
            <button class="ghost" data-action="sync-ru">Atualizar</button>
          </div>
          <div class="menu-grid simple-menu-grid" style="margin-top: 1rem;">
            ${state.menu.map(renderMenuCard).join("")}
          </div>
        </section>
      </section>
    `;
  }

  if (state.agendaTab === "sca") {
    return `
      <section class="section-stack simple-stack">
        ${renderAgendaHeader("SCA")}
        <section class="paper-card simple-section">
          <div class="section-header-row">
            <div>
              <div class="section-topline">Upload</div>
              <h2 class="section-title">PDF do SCA</h2>
            </div>
            <button class="ghost" data-action="refresh-uploads">Atualizar lista</button>
          </div>
          <p class="section-copy">Envie o PDF oficial do aluno para preencher a agenda.</p>
          <div class="upload-drop" style="margin-top: 1rem;">
            <input id="pdfInput" class="file-input" type="file" accept="application/pdf,.pdf" />
            <div class="button-row">
              <label class="file-trigger" for="pdfInput">Selecionar PDF real</label>
            </div>
            ${activeUpload ? `
              <div class="simple-meta-grid">
                <div class="mini-card"><small>Arquivo ativo</small><strong>${escape(activeUpload.originalName)}</strong><span>${escape(formatBytes(activeUpload.size))}</span></div>
                <div class="mini-card"><small>Status</small><strong>${escape(getUploadStatusLabel(activeUpload))}</strong><span>${escape(getExtractionCaption(activeUpload))}</span></div>
              </div>
            ` : ""}
          </div>
          ${renderUploadStatus()}
        </section>

        ${activeUpload ? `
          <section class="paper-card simple-section">
            <div class="section-header-row">
              <div>
                <div class="section-topline">Resumo</div>
                <h2 class="section-title">${escape(academicData?.profile?.studentName || state.user.displayName || "Aluno")}</h2>
              </div>
              <button class="ghost" data-action="open-upload" data-upload-id="${escapeAttribute(activeUpload.id)}">Abrir PDF</button>
            </div>
            <div class="simple-meta-grid">
              <div class="mini-card"><small>Matrícula</small><strong>${escape(academicData?.profile?.studentId || "não encontrada")}</strong><span>${escape(academicData?.profile?.period || "período não encontrado")}</span></div>
              <div class="mini-card"><small>Curso</small><strong>${escape(academicData?.profile?.course || "não encontrado")}</strong><span>${String(disciplines.length)} disciplinas</span></div>
              <div class="mini-card"><small>Horários</small><strong>${String(schedule.length)}</strong><span>blocos importados</span></div>
              <div class="mini-card"><small>PDFs</small><strong>${String(state.uploads.length)}</strong><span>arquivos na conta</span></div>
            </div>
          </section>
        ` : ""}

        <section class="paper-card simple-section">
          <div class="section-header-row">
            <div>
              <div class="section-topline">Arquivos</div>
              <h2 class="section-title">PDFs salvos</h2>
            </div>
          </div>
          <div class="upload-list" style="margin-top: 1rem;">
            ${state.uploads.length ? state.uploads.map((item) => renderUploadItem(item, activeUpload)).join("") : `<div class="empty-state">Nenhum PDF enviado ainda.</div>`}
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
      <div class="button-row" style="margin-top: 0.75rem;">
        ${isActive ? `<span class="tag">PDF ativo</span>` : `<button class="ghost" data-action="set-active-upload" data-upload-id="${escapeAttribute(item.id)}">Definir ativo</button>`}
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
  return `<span class="avatar-fallback">${escape(initials(user.displayName || user.email || "Aluno"))}</span>`;
}

function metric(label, value, caption) {
  return `<div class="metric-card"><small>${escape(label)}</small><strong>${escape(value)}</strong><span>${escape(caption)}</span></div>`;
}

function getScreenTitle() {
  if (state.activeTab === "academic") {
    const agendaTitleMap = {
      today: "Grade Horária",
      week: "Semana",
      menu: "RU",
      sca: "PDF do SCA",
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

function renderStatusBanner() {
  const message = state.uploadError || state.authError || (state.uploadProgress > 0 ? state.uploadMessage : "");
  if (!message) {
    return "";
  }

  return `<div class="toast ${state.uploadError || state.authError ? "is-danger" : ""} compact-toast">${escape(message)}</div>`;
}

function renderHomeShortcut(mark, label, action, tab) {
  return `
    <button class="quick-button" data-action="${escapeAttribute(action)}" data-tab="${escapeAttribute(tab)}">
      <span class="quick-button-mark">${escape(mark)}</span>
      <span class="quick-button-label">${escape(label)}</span>
    </button>
  `;
}

function renderSimpleInfoRow(label, value) {
  return `
    <div class="simple-info-row">
      <span>${escape(label)}</span>
      <strong>${escape(value)}</strong>
    </div>
  `;
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

  if (action === "refresh-uploads") {
    refreshRemoteUploads();
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
  if (event.target.id && String(event.target.id).startsWith("login")) {
    setState({ authError: "" }, { render: false });
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

async function logout() {
  if (!services.supabase) return;

  try {
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
    uploadMessage: "Atualizando a lista de PDFs da conta...",
  });

  try {
    await reloadRemoteAccountData(state.user.uid);
    setState({
      uploadError: "",
      uploadMessage: "Lista de PDFs atualizada com sucesso.",
    });
  } catch (error) {
    setState({
      uploadError: `Não consegui atualizar a lista de PDFs: ${describeSupabaseError(error)}`,
      uploadMessage: "",
    });
  }
}

async function uploadPdf(file, inputElement) {
  if (!state.user || !services.supabase) {
    setState({ uploadError: "Entre com Google antes de enviar o PDF.", uploadMessage: "", uploadProgress: 0 });
    inputElement.value = "";
    return;
  }

  if (!isPdfFile(file)) {
    setState({ uploadError: "Selecione um arquivo PDF válido do SCA.", uploadMessage: "", uploadProgress: 0 });
    inputElement.value = "";
    return;
  }

  const uploadId = (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
    ? crypto.randomUUID()
    : createUploadId();
  const uploadedAtClient = new Date().toISOString();
  const normalizedName = normalizeFileName(file.name);
  const storagePath = `${state.user.uid}/${uploadId}/${normalizedName}`;
  const bucketName = getSupabaseBucketName();

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
          ? "PDF importado e sincronizado com sucesso na conta do aluno."
          : "PDF enviado para a conta, mas com reconhecimento parcial dos dados acadêmicos.",
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

  const upload = state.uploads.find((item) => item.id === uploadId);
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

async function openUpload(uploadId) {
  if (!uploadId) return;

  const popup = window.open("", "_blank", "noopener");
  setState({ openingUploadId: uploadId, uploadError: "", uploadMessage: "Abrindo o PDF da conta..." });

  try {
    const record = state.uploads.find((item) => item.id === uploadId);
    if (!record || !record.storagePath || !services.supabase) {
      throw new Error("arquivo não encontrado no armazenamento da conta");
    }

    const { data, error } = await services.supabase
      .storage
      .from(getSupabaseBucketName())
      .createSignedUrl(record.storagePath, 60);

    if (error || !data?.signedUrl) {
      throw error || new Error("não consegui criar um link temporário para este PDF");
    }

    if (popup) {
      popup.location.href = data.signedUrl;
    } else {
      window.open(data.signedUrl, "_blank", "noopener");
    }

    setState({ openingUploadId: "", uploadMessage: `${record.originalName} aberto em nova aba.`, uploadError: "" });
  } catch (error) {
    if (popup) popup.close();
    setState({
      openingUploadId: "",
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
  const fallback = message || describeLocalError(error);
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
