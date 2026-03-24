import { extractScaPdfData } from "./sca-parser.js";

const APP_NAME = "Agenda DAGV";
const APP_MARK = "DAGV";
const SUPABASE_CONFIG_FILE = "supabase-config.js";
const SUPABASE_BUCKET = "student-pdfs";
const REGISTRATION_TAB_ID = "registration";
const DOCUMENT_VIEWER_TAB_ID = "document-viewer";
const ADMIN_TAB_ID = "admin";
const MENU_AUTO_REFRESH_MS = 6 * 60 * 60 * 1000;
const MENU_REFRESH_HEARTBEAT_MS = 30 * 60 * 1000;
const CLASS_NOTIFICATION_LEAD_MINUTES = 10;
const NOTIFICATION_PROMPT_STORAGE_KEY = "uftm-mobile-notification-prompt-v1";
const NOTIFICATION_HISTORY_STORAGE_KEY = "uftm-mobile-notification-history-v1";
const NOTIFICATION_LOOKAHEAD_DAYS = 21;
const DOCUMENT_TYPES = {
  schedule: "schedule",
  studentCard: "student_card",
};
const ANNOUNCEMENT_CATEGORIES = {
  announcement: "announcement",
  dailyNotice: "daily_notice",
  academicNotice: "academic_notice",
  eventAnnouncement: "event_announcement",
  partyAnnouncement: "party_announcement",
  urgentNotice: "urgent_notice",
};
const ANNOUNCEMENT_CATEGORY_OPTIONS = [
  {
    id: ANNOUNCEMENT_CATEGORIES.announcement,
    label: "Anuncio",
    description: "Comunicado geral para campanhas, chamadas e destaques do DA.",
    placement: "Destaque principal da tela inicial",
    tone: "announcement",
    spotlight: true,
  },
  {
    id: ANNOUNCEMENT_CATEGORIES.dailyNotice,
    label: "Aviso do dia",
    description: "Recado rapido para a rotina dos alunos ao longo do dia.",
    placement: "Bloco de avisos rapidos",
    tone: "notice",
    spotlight: false,
  },
  {
    id: ANNOUNCEMENT_CATEGORIES.academicNotice,
    label: "Academico",
    description: "Mudancas de aula, provas, monitorias, prazos e orientacoes.",
    placement: "Bloco academico da home",
    tone: "academic",
    spotlight: false,
  },
  {
    id: ANNOUNCEMENT_CATEGORIES.eventAnnouncement,
    label: "Evento",
    description: "Palestras, congressos, inscricoes e atividades abertas.",
    placement: "Bloco de eventos e anuncios",
    tone: "event",
    spotlight: true,
  },
  {
    id: ANNOUNCEMENT_CATEGORIES.partyAnnouncement,
    label: "Festa",
    description: "Divulgacao de festas, integracoes e experiencias do curso.",
    placement: "Bloco de eventos e anuncios",
    tone: "party",
    spotlight: false,
  },
  {
    id: ANNOUNCEMENT_CATEGORIES.urgentNotice,
    label: "Urgente",
    description: "Comunicado critico com prioridade maxima para aparecer primeiro.",
    placement: "Destaque principal da tela inicial",
    tone: "urgent",
    spotlight: true,
  },
];
const ANNOUNCEMENT_HOME_SECTIONS = [
  {
    id: "academic",
    topline: "Academico",
    title: "Atualizacoes da rotina academica",
    categories: [ANNOUNCEMENT_CATEGORIES.academicNotice],
  },
  {
    id: "events",
    topline: "Eventos e anuncios",
    title: "Chamadas abertas para a comunidade",
    categories: [
      ANNOUNCEMENT_CATEGORIES.announcement,
      ANNOUNCEMENT_CATEGORIES.eventAnnouncement,
      ANNOUNCEMENT_CATEGORIES.partyAnnouncement,
    ],
  },
  {
    id: "notices",
    topline: "Avisos rapidos",
    title: "Recados ativos para hoje",
    categories: [
      ANNOUNCEMENT_CATEGORIES.dailyNotice,
      ANNOUNCEMENT_CATEGORIES.urgentNotice,
    ],
  },
];
const EXPANSION_LINKS = [
  {
    id: "one-time-payment",
    title: "Pagamento unico",
    description: "Espaco reservado para um checkout simples de compra avulsa ou acesso individual.",
    href: "#pagamento-unico",
    hint: "Substituir pelo link do checkout",
    badge: "Monetizacao",
  },
  {
    id: "plus-plan",
    title: "Plano Plus",
    description: "Area pronta para um futuro plano com beneficios extras, recursos premium e upgrades.",
    href: "#plano-plus",
    hint: "Substituir pelo link do Plus",
    badge: "Plus",
  },
  {
    id: "academic-leagues",
    title: "Ligas Academicas",
    description: "Espaco para concentrar links simples, descricoes curtas e acessos rapidos das ligas.",
    href: "#ligas-academicas",
    hint: "Substituir pelo portal das ligas",
    badge: "Comunidade",
  },
];
const PENDING_REGISTRATION_MESSAGE = "Aguardando finalização do cadastro. Envie a grade horária e o link da carteirinha estudantil para liberar o app.";

const UI_STORAGE_KEY = "uftm-mobile-local-ui-v1";
const SESSION_STORAGE_KEY = "uftm-mobile-local-session-v1";
const PROFILE_STORAGE_PREFIX = "uftm-mobile-local-profile-";
const LOCAL_DB_NAME = "uftm-mobile-local-db";
const LOCAL_DB_VERSION = 1;
const UPLOAD_STORE = "uploads";

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
  { id: "week", label: "Semana", icon: "calendar-grid", action: "open-academic-tab", tab: "week" },
  { id: "menu", label: "Restaurantes", icon: "utensils", action: "open-academic-tab", tab: "menu" },
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
let menuRefreshHeartbeatId = 0;
let scheduledReminderKey = "";
let createSupabaseClient = null;

clearPublicBootstrapData();

let state = {
  activeTab: uiState.activeTab || "home",
  agendaTab: uiState.agendaTab || "today",
  sidebarOpen: Boolean(uiState.sidebarOpen),
  referenceDate: uiState.referenceDate || toISO(new Date()),
  menu: Array.isArray(uiState.menu) && uiState.menu.length ? uiState.menu : defaultMenu,
  lastMenuSync: uiState.lastMenuSync || "",
  syncMessage: uiState.syncMessage || "Buscando o cardápio da Abadia para o painel do DA.",
  isOnline: isNavigatorOnline(),
  offlineAccess: false,
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
  studentCardUrlDraft: "",
  documentViewer: createEmptyDocumentViewerState(),
  isAdmin: false,
  adminRole: "",
  announcements: Array.isArray(uiState.announcements) ? uiState.announcements.map(normalizeAdminAnnouncementRow) : [],
  announcementsLoading: false,
  announcementsError: "",
  adminLoading: false,
  adminError: "",
  adminStats: createEmptyAdminStats(),
  adminDraft: createEmptyAdminDraft(),
};

appElement.addEventListener("click", onClick);
appElement.addEventListener("change", onChange);
appElement.addEventListener("input", onInput);
appElement.addEventListener("load", onLoad, true);
document.addEventListener("visibilitychange", onVisibilityChange);
window.addEventListener("online", onConnectivityChange);
window.addEventListener("offline", onConnectivityChange);

init().catch((error) => {
  appElement.innerHTML = renderStartupFailure(error);
});

async function init() {
  render();
  void registerNotificationServiceWorker();
  startMenuRefreshHeartbeat();
  refreshRuMenuIfNeeded(true);

  if (!state.isOnline) {
    const restoredOffline = await restoreOfflineSession("Modo offline ativo com os ultimos dados salvos neste aparelho.");
    if (restoredOffline) {
      return;
    }
  }

  if (!supabaseReady) {
    const restoredOffline = await restoreOfflineSession("Modo offline ativo com os ultimos dados salvos neste aparelho.");
    if (restoredOffline) {
      return;
    }
    setState({
      authChecking: false,
      authError: `Preencha o arquivo ${SUPABASE_CONFIG_FILE} para habilitar login Google e PDFs privados na nuvem.`,
    });
    return;
  }

  if (!canUseGoogleAuth) {
    const restoredOffline = await restoreOfflineSession("Modo offline ativo com os ultimos dados salvos neste aparelho.");
    if (restoredOffline) {
      return;
    }
    setState({
      authChecking: false,
      authError: "Abra o app em http://localhost:4173 ou no deploy para autenticar com Google.",
    });
    return;
  }

  try {
    const createClient = await ensureSupabaseClientFactory();
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
    const restoredOffline = isLikelyOfflineError(error)
      ? await restoreOfflineSession("Modo offline ativo com os ultimos dados salvos neste aparelho.")
      : false;
    if (restoredOffline) {
      return;
    }
    setState({
      authChecking: false,
      authError: `Não consegui inicializar a conta online: ${describeSupabaseError(error)}`,
    });
  }
}

async function ensureSupabaseClientFactory() {
  if (createSupabaseClient) {
    return createSupabaseClient;
  }

  const module = await import("https://esm.sh/@supabase/supabase-js@2?bundle");
  createSupabaseClient = module.createClient;
  return createSupabaseClient;
}

async function handleSupabaseSession(session) {
  const user = session?.user || null;

  if (!user) {
    clearSession();
    revokeActiveDocumentViewer();
    setState({
      authChecking: false,
      authError: "",
      user: null,
      profile: null,
      uploads: [],
      studentCardUrlDraft: "",
      uploadMessage: "",
      uploadError: "",
      uploadProgress: 0,
      openingUploadId: "",
      activeTab: "home",
      agendaTab: "today",
      sidebarOpen: false,
      documentViewer: createEmptyDocumentViewerState(),
      isAdmin: false,
      adminRole: "",
      announcements: [],
      announcementsLoading: false,
      announcementsError: "",
      adminLoading: false,
      adminError: "",
      adminStats: createEmptyAdminStats(),
      adminDraft: createEmptyAdminDraft(),
      offlineAccess: false,
    });
    return;
  }

  const userData = normalizeSupabaseUser(user);
  const configuredAdminAccess = resolveConfiguredAdminAccess(userData);
  saveSession(userData);

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
    studentCardUrlDraft: "",
    uploadError: "",
    uploadMessage: "Conta Google conectada com sucesso.",
    isAdmin: configuredAdminAccess.isAdmin,
    adminRole: configuredAdminAccess.role,
    announcements: [],
    announcementsLoading: true,
    announcementsError: "",
    adminLoading: configuredAdminAccess.isAdmin,
    adminError: "",
    adminStats: createEmptyAdminStats(),
    adminDraft: createEmptyAdminDraft(),
  });

  try {
    await upsertSupabaseProfile(userData);
    const [{ profile, uploads }, adminAccess, announcementsResult] = await Promise.all([
      loadRemoteAccountData(userData.uid),
      resolveAdminAccess(userData),
      loadAnnouncements(),
    ]);
    const resolvedAdminAccess = adminAccess.isAdmin ? adminAccess : configuredAdminAccess;
    const registrationComplete = hasCompletedRegistration(uploads, profile);
    const nextActiveTab = !resolvedAdminAccess.isAdmin && state.activeTab === ADMIN_TAB_ID
      ? "home"
      : state.activeTab;

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
      isAdmin: resolvedAdminAccess.isAdmin,
      adminRole: resolvedAdminAccess.role,
      announcements: announcementsResult.items,
      announcementsLoading: false,
      announcementsError: announcementsResult.error,
    adminLoading: false,
    adminError: "",
    adminStats: createEmptyAdminStats(),
    studentCardUrlDraft: getStudentCardLinkUrl(getPrimaryStudentCardUploadFromUploads(uploads)),
      activeTab: registrationComplete || resolvedAdminAccess.isAdmin ? nextActiveTab : REGISTRATION_TAB_ID,
      agendaTab: registrationComplete ? state.agendaTab : "today",
      uploadError: "",
      offlineAccess: false,
      uploadMessage: uploads.length
        ? registrationComplete
          ? "Conta conectada. Seus documentos privados foram sincronizados."
          : PENDING_REGISTRATION_MESSAGE
        : "Conta conectada. Envie a grade horaria e o link da carteirinha estudantil para liberar o painel.",
    });

    saveStoredProfile(profile);
    void cacheUploadsForOffline(uploads);
    void syncUserPreferences();
    void maybeShowMenuNotification(state.menu[0] || null);
    if (resolvedAdminAccess.isAdmin) {
      void refreshAdminDashboard(true);
    }
  } catch (error) {
    const restoredOffline = isLikelyOfflineError(error)
      ? await restoreOfflineSession("Modo offline ativo com os ultimos dados salvos neste aparelho.")
      : false;
    if (restoredOffline) {
      return;
    }
    setState({
      authChecking: false,
      uploadError: `Não consegui sincronizar o perfil do aluno: ${describeSupabaseError(error)}`,
      uploadMessage: "",
      announcementsLoading: false,
      adminLoading: false,
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
  const studentCardUpload = getPrimaryStudentCardUploadFromUploads(uploads);

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
    studentCardUrlDraft: getStudentCardLinkUrl(studentCardUpload),
    activeTab: registrationComplete ? state.activeTab : REGISTRATION_TAB_ID,
    agendaTab: registrationComplete ? state.agendaTab : "today",
    referenceDate: academicData?.schedule?.length
      ? suggestReferenceDate(academicData.schedule, state.referenceDate)
      : state.referenceDate,
    offlineAccess: false,
  });

  saveStoredProfile(profile);
  await cacheUploadsForOffline(uploads);
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

function getPrimaryStudentCardUploadFromUploads(uploads = []) {
  const studentCardUploads = (uploads || []).filter((item) => item.documentType === DOCUMENT_TYPES.studentCard);
  return studentCardUploads.find((item) => isStudentCardLinkUpload(item)) || studentCardUploads[0] || null;
}

function isStudentCardLinkUpload(upload) {
  return upload?.documentType === DOCUMENT_TYPES.studentCard && String(upload?.parserStatus || "") === "student_card_link";
}

function getStudentCardLinkUrl(upload) {
  if (!isStudentCardLinkUpload(upload)) {
    return "";
  }

  const normalized = normalizeStudentCardLink(upload.notes || "");
  return isAllowedStudentCardUrl(normalized) ? normalized : "";
}

function normalizeStudentCardLink(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return "";
  }

  const candidate = /^[a-z]+:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed.replace(/^\/+/, "")}`;

  try {
    return new URL(candidate).toString();
  } catch (error) {
    return "";
  }
}

function isAllowedStudentCardUrl(value) {
  try {
    const url = new URL(String(value || ""));
    const hostname = String(url.hostname || "").toLowerCase();
    return url.protocol === "https:" && (hostname === "uftm.edu.br" || hostname.endsWith(".uftm.edu.br"));
  } catch (error) {
    return false;
  }
}

function getStudentCardUrlLabel(upload) {
  const url = getStudentCardLinkUrl(upload);
  if (!url) {
    return "";
  }

  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch (error) {
    return "";
  }
}

function buildStudentCardProxyUrl(value) {
  const normalized = normalizeStudentCardLink(value);
  if (!normalized) {
    return "";
  }

  return `/api/student-card-image?url=${encodeURIComponent(normalized)}`;
}

async function prepareStudentCardInlineSource(externalUrl) {
  const proxyUrl = buildStudentCardProxyUrl(externalUrl);
  if (!proxyUrl) {
    return {
      objectUrl: "",
      externalUrl,
    };
  }

  try {
    const response = await fetch(proxyUrl, {
      method: "GET",
      cache: "no-store",
      credentials: "omit",
    });

    if (!response.ok) {
      throw new Error(`falha ao buscar a imagem da carteirinha (${response.status})`);
    }

    const blob = await response.blob();
    const objectUrl = await createCroppedStudentCardObjectUrl(blob);

    return {
      objectUrl,
      externalUrl: "",
    };
  } catch (error) {
    return {
      objectUrl: "",
      externalUrl,
    };
  }
}

async function createCroppedStudentCardObjectUrl(blob) {
  const sourceUrl = URL.createObjectURL(blob);

  try {
    const image = await loadImageElement(sourceUrl);
    const bounds = detectStudentCardBounds(image);

    if (!bounds) {
      return sourceUrl;
    }

    const cropChanged = bounds.x > 0
      || bounds.y > 0
      || bounds.width < image.naturalWidth
      || bounds.height < image.naturalHeight;

    if (!cropChanged) {
      return sourceUrl;
    }

    const canvas = document.createElement("canvas");
    canvas.width = bounds.width;
    canvas.height = bounds.height;

    const context = canvas.getContext("2d");
    if (!context) {
      return sourceUrl;
    }

    context.drawImage(
      image,
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
      0,
      0,
      bounds.width,
      bounds.height,
    );

    const croppedBlob = await canvasToBlob(canvas, resolveCanvasImageType(blob.type));
    if (!croppedBlob) {
      return sourceUrl;
    }

    const croppedUrl = URL.createObjectURL(croppedBlob);
    URL.revokeObjectURL(sourceUrl);
    return croppedUrl;
  } catch (error) {
    URL.revokeObjectURL(sourceUrl);
    throw error;
  }
}

function resolveCanvasImageType(contentType) {
  return /^image\/(png|jpeg|jpg|webp)$/i.test(String(contentType || "")) ? contentType : "image/png";
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("nao consegui carregar a imagem da carteirinha"));
    image.src = src;
  });
}

function canvasToBlob(canvas, type) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, 0.92);
  });
}

function detectStudentCardBounds(image) {
  const naturalWidth = Number(image.naturalWidth || 0);
  const naturalHeight = Number(image.naturalHeight || 0);

  if (!naturalWidth || !naturalHeight) {
    return null;
  }

  const maxSampleSide = 960;
  const scale = Math.min(1, maxSampleSide / Math.max(naturalWidth, naturalHeight));
  const sampleWidth = Math.max(1, Math.round(naturalWidth * scale));
  const sampleHeight = Math.max(1, Math.round(naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return null;
  }

  context.drawImage(image, 0, 0, sampleWidth, sampleHeight);
  const { data } = context.getImageData(0, 0, sampleWidth, sampleHeight);
  const rowThreshold = 24;
  const columnThreshold = 24;

  let top = 0;
  while (top < sampleHeight && getRowEdgeSignal(data, sampleWidth, top) < rowThreshold) {
    top += 1;
  }

  let bottom = sampleHeight - 1;
  while (bottom >= top && getRowEdgeSignal(data, sampleWidth, bottom) < rowThreshold) {
    bottom -= 1;
  }

  let left = 0;
  while (left < sampleWidth && getColumnEdgeSignal(data, sampleWidth, sampleHeight, left) < columnThreshold) {
    left += 1;
  }

  let right = sampleWidth - 1;
  while (right >= left && getColumnEdgeSignal(data, sampleWidth, sampleHeight, right) < columnThreshold) {
    right -= 1;
  }

  if (left >= right || top >= bottom) {
    return null;
  }

  const samplePadding = Math.max(4, Math.round(Math.min(sampleWidth, sampleHeight) * 0.012));
  const paddedLeft = Math.max(0, left - samplePadding);
  const paddedTop = Math.max(0, top - samplePadding);
  const paddedRight = Math.min(sampleWidth - 1, right + samplePadding);
  const paddedBottom = Math.min(sampleHeight - 1, bottom + samplePadding);
  const inverseScale = 1 / scale;
  const x = Math.max(0, Math.floor(paddedLeft * inverseScale));
  const y = Math.max(0, Math.floor(paddedTop * inverseScale));
  const width = Math.min(naturalWidth - x, Math.ceil((paddedRight - paddedLeft + 1) * inverseScale));
  const height = Math.min(naturalHeight - y, Math.ceil((paddedBottom - paddedTop + 1) * inverseScale));

  if (width <= 0 || height <= 0) {
    return null;
  }

  return { x, y, width, height };
}

function getRowEdgeSignal(data, width, row) {
  let total = 0;
  const offset = row * width * 4;

  for (let column = 0; column < width; column += 1) {
    total += getStudentCardPixelSignal(data, offset + (column * 4));
  }

  return total / width;
}

function getColumnEdgeSignal(data, width, height, column) {
  let total = 0;

  for (let row = 0; row < height; row += 1) {
    const offset = ((row * width) + column) * 4;
    total += getStudentCardPixelSignal(data, offset);
  }

  return total / height;
}

function getStudentCardPixelSignal(data, offset) {
  const alpha = data[offset + 3];
  if (alpha < 10) {
    return 0;
  }

  const red = data[offset];
  const green = data[offset + 1];
  const blue = data[offset + 2];
  const brightest = Math.max(red, green, blue);
  const darkest = Math.min(red, green, blue);
  const luminance = (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
  const contrast = brightest - darkest;

  if (brightest < 26 && luminance < 20) {
    return 0;
  }

  return Math.max(0, luminance - 14) + (Math.max(0, contrast - 6) * 0.9);
}

function hasCompletedRegistration(uploads, profile) {
  const scheduleUploads = (uploads || []).filter((item) => item.documentType !== DOCUMENT_TYPES.studentCard);
  const studentCardUpload = getPrimaryStudentCardUploadFromUploads(uploads);
  const activeSchedule = scheduleUploads.find((item) => item.id === profile?.activeUploadId) || scheduleUploads[0] || null;
  return Boolean(activeSchedule && getStudentCardLinkUrl(studentCardUpload));
}

function createEmptyDocumentViewerState() {
  return {
    uploadId: "",
    title: "",
    objectUrl: "",
    externalUrl: "",
    documentType: "",
    sourceTab: "home",
    sourceAgendaTab: "today",
    loading: false,
  };
}

function createEmptyAdminDraft() {
  return {
    category: ANNOUNCEMENT_CATEGORIES.announcement,
    title: "",
    body: "",
    startsAt: "",
    endsAt: "",
    actionLabel: "",
    actionUrl: "",
    isPublished: true,
  };
}

function createEmptyAdminStats() {
  return {
    totalUsers: 0,
    activeUsers7d: 0,
    completedRegistrations: 0,
    notificationSubscribers: 0,
    standaloneUsers: 0,
  };
}

function isConfiguredAdminEmail(email) {
  return supabaseConfig.adminEmails.includes(normalizeEmail(email));
}

function resolveConfiguredAdminAccess(user) {
  if (!isConfiguredAdminEmail(user?.email || "")) {
    return { isAdmin: false, role: "" };
  }

  return {
    isAdmin: true,
    role: "bootstrap_admin",
  };
}

async function resolveAdminAccess(user) {
  const fallback = resolveConfiguredAdminAccess(user);

  if (!services.supabase || !user?.uid) {
    return fallback;
  }

  try {
    const { data, error } = await services.supabase
      .from("admin_users")
      .select("role,is_active")
      .eq("user_id", user.uid)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data?.is_active) {
      return {
        isAdmin: true,
        role: String(data.role || "admin"),
      };
    }

    return fallback;
  } catch (error) {
    return fallback;
  }
}

async function loadAnnouncements() {
  if (!services.supabase) {
    return {
      items: [],
      error: "",
    };
  }

  try {
    const { data, error } = await services.supabase
      .from("admin_announcements")
      .select("*")
      .order("starts_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return {
      items: (data || []).map(normalizeAdminAnnouncementRow),
      error: "",
    };
  } catch (error) {
    if (isAdminFeatureUnavailableError(error)) {
      return {
        items: [],
        error: "",
      };
    }

    return {
      items: [],
      error: `Não consegui carregar os avisos do app: ${describeSupabaseError(error)}`,
    };
  }
}

async function loadAdminStats() {
  if (!services.supabase) {
    return {
      stats: createEmptyAdminStats(),
      error: "",
    };
  }

  try {
    const sevenDaysAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString();
    const [totalUsersResult, activeUsersResult, notificationSubscribersResult, standaloneUsersResult, uploadsResult] = await Promise.all([
      services.supabase
        .from("profiles")
        .select("id", { count: "exact", head: true }),
      services.supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("last_login_at", sevenDaysAgo),
      services.supabase
        .from("user_preferences")
        .select("user_id", { count: "exact", head: true })
        .eq("notifications_enabled", true),
      services.supabase
        .from("user_preferences")
        .select("user_id", { count: "exact", head: true })
        .eq("installation_status", "standalone"),
      services.supabase
        .from("uploads")
        .select("owner_uid,parser_status,storage_path"),
    ]);

    const failure = [
      totalUsersResult.error,
      activeUsersResult.error,
      notificationSubscribersResult.error,
      standaloneUsersResult.error,
      uploadsResult.error,
    ].find(Boolean);

    if (failure) {
      throw failure;
    }

    return {
      stats: buildAdminStats({
        totalUsers: Number(totalUsersResult.count || 0),
        activeUsers7d: Number(activeUsersResult.count || 0),
        notificationSubscribers: Number(notificationSubscribersResult.count || 0),
        standaloneUsers: Number(standaloneUsersResult.count || 0),
        uploads: uploadsResult.data || [],
      }),
      error: "",
    };
  } catch (error) {
    if (isAdminFeatureUnavailableError(error)) {
      return {
        stats: createEmptyAdminStats(),
        error: "Aplique o novo schema.sql no Supabase para liberar métricas e gestão administrativa.",
      };
    }

    return {
      stats: createEmptyAdminStats(),
      error: `Não consegui carregar as métricas administrativas: ${describeSupabaseError(error)}`,
    };
  }
}

async function refreshAdminDashboard(silent = false) {
  if (!state.isAdmin || !services.supabase) {
    return;
  }

  setState({
    adminLoading: true,
    adminError: "",
  }, { render: !silent });

  const [announcementsResult, statsResult] = await Promise.all([
    loadAnnouncements(),
    loadAdminStats(),
  ]);

  setState({
    announcements: announcementsResult.items,
    announcementsLoading: false,
    announcementsError: announcementsResult.error,
    adminLoading: false,
    adminError: statsResult.error || announcementsResult.error,
    adminStats: statsResult.stats,
  });
}

async function syncUserPreferences() {
  if (!services.supabase || !state.user) {
    return;
  }

  try {
    const permission = resolveNotificationPermissionStatus();
    const notificationsEnabled = permission === "granted";
    const now = new Date().toISOString();

    const { error } = await services.supabase
      .from("user_preferences")
      .upsert({
        user_id: state.user.uid,
        notifications_enabled: notificationsEnabled,
        notification_permission: permission,
        installation_status: resolveInstallationStatus(),
        subscribed_at: notificationsEnabled ? now : null,
        last_seen_at: now,
        updated_at: now,
      }, { onConflict: "user_id" });

    if (error && !isAdminFeatureUnavailableError(error)) {
      throw error;
    }
  } catch (error) {
    // Preferências de uso não devem bloquear o app do aluno.
  }
}

function buildAdminStats({ totalUsers, activeUsers7d, notificationSubscribers, standaloneUsers, uploads }) {
  const completionMap = new Map();

  for (const row of uploads || []) {
    const ownerUid = String(row?.owner_uid || "");
    if (!ownerUid) {
      continue;
    }

    const current = completionMap.get(ownerUid) || { hasSchedule: false, hasStudentCard: false };
    const documentType = inferDocumentTypeFromStoragePath(row?.storage_path, row?.parser_status);
    if (documentType === DOCUMENT_TYPES.studentCard && String(row?.parser_status || "") === "student_card_link") {
      current.hasStudentCard = true;
    } else if (documentType === DOCUMENT_TYPES.schedule) {
      current.hasSchedule = true;
    }
    completionMap.set(ownerUid, current);
  }

  const completedRegistrations = Array.from(completionMap.values())
    .filter((item) => item.hasSchedule && item.hasStudentCard)
    .length;

  return {
    totalUsers,
    activeUsers7d,
    completedRegistrations,
    notificationSubscribers,
    standaloneUsers,
  };
}

function normalizeAdminAnnouncementRow(row) {
  return {
    id: String(row?.id || ""),
    category: normalizeAnnouncementCategory(row?.category),
    title: String(row?.title || "Sem título"),
    body: String(row?.body || ""),
    actionLabel: String(row?.action_label || ""),
    actionUrl: normalizeOptionalHttpUrl(row?.action_url || ""),
    startsAt: String(row?.starts_at || ""),
    endsAt: String(row?.ends_at || ""),
    isPublished: Boolean(row?.is_published),
    createdAt: String(row?.created_at || ""),
    updatedAt: String(row?.updated_at || ""),
    createdBy: String(row?.created_by || ""),
  };
}

function normalizeAnnouncementCategory(value) {
  const normalized = String(value || "").trim();
  return ANNOUNCEMENT_CATEGORY_OPTIONS.some((item) => item.id === normalized)
    ? normalized
    : ANNOUNCEMENT_CATEGORIES.dailyNotice;
}

function getAnnouncementCategoryMeta(category) {
  const normalized = normalizeAnnouncementCategory(category);
  return ANNOUNCEMENT_CATEGORY_OPTIONS.find((item) => item.id === normalized) || ANNOUNCEMENT_CATEGORY_OPTIONS[1];
}

function getAnnouncementCategoryLabel(category) {
  return getAnnouncementCategoryMeta(category).label;
}

function getAnnouncementCategoryDescription(category) {
  return getAnnouncementCategoryMeta(category).description;
}

function getAnnouncementCategoryPlacement(category) {
  return getAnnouncementCategoryMeta(category).placement;
}

function getAnnouncementCategoryTone(category) {
  return getAnnouncementCategoryMeta(category).tone;
}

function getAnnouncementToneClass(category) {
  return `is-${getAnnouncementCategoryTone(category)}`;
}

function isAnnouncementSpotlightCategory(category) {
  return Boolean(getAnnouncementCategoryMeta(category).spotlight);
}

function getAnnouncementPriority(category) {
  const normalized = normalizeAnnouncementCategory(category);
  const priorityMap = {
    [ANNOUNCEMENT_CATEGORIES.urgentNotice]: 0,
    [ANNOUNCEMENT_CATEGORIES.announcement]: 1,
    [ANNOUNCEMENT_CATEGORIES.eventAnnouncement]: 2,
    [ANNOUNCEMENT_CATEGORIES.academicNotice]: 3,
    [ANNOUNCEMENT_CATEGORIES.partyAnnouncement]: 4,
    [ANNOUNCEMENT_CATEGORIES.dailyNotice]: 5,
  };

  return priorityMap[normalized] ?? 9;
}

function getAnnouncementDisplayTime(item) {
  return String(item?.startsAt || item?.createdAt || "");
}

function isAnnouncementActive(item, now = new Date()) {
  if (!item?.isPublished) {
    return false;
  }

  const nowTime = now.getTime();
  const startsAt = item.startsAt ? new Date(item.startsAt).getTime() : Number.NEGATIVE_INFINITY;
  const endsAt = item.endsAt ? new Date(item.endsAt).getTime() : Number.POSITIVE_INFINITY;

  return nowTime >= startsAt && nowTime <= endsAt;
}

function getActiveAnnouncementsByCategory(category) {
  return getActiveAnnouncements().filter((item) => item.category === category);
}

function sortAnnouncementsForDisplay(items) {
  return [...(items || [])].sort((left, right) => {
    const priorityDiff = getAnnouncementPriority(left.category) - getAnnouncementPriority(right.category);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return getAnnouncementDisplayTime(right).localeCompare(getAnnouncementDisplayTime(left));
  });
}

function getActiveAnnouncements() {
  return sortAnnouncementsForDisplay(
    state.announcements.filter((item) => isAnnouncementActive(item)),
  );
}

function getAnnouncementSpotlight(items = getActiveAnnouncements()) {
  const active = sortAnnouncementsForDisplay(items);
  return active.find((item) => isAnnouncementSpotlightCategory(item.category)) || null;
}

function getAnnouncementStatusLabel(item) {
  if (!item.isPublished) {
    return "Rascunho";
  }

  if (isAnnouncementActive(item)) {
    return "Publicado";
  }

  if (item.startsAt && new Date(item.startsAt).getTime() > Date.now()) {
    return "Agendado";
  }

  if (item.endsAt && new Date(item.endsAt).getTime() < Date.now()) {
    return "Encerrado";
  }

  return "Publicado";
}

function normalizeOptionalHttpUrl(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return "";
  }

  try {
    const url = new URL(trimmed);
    return /^https?:$/i.test(url.protocol) ? url.toString() : "";
  } catch (error) {
    return "";
  }
}

function isAdminFeatureUnavailableError(error) {
  const code = String(error?.code || error?.error_code || "").toUpperCase();
  const message = String(error?.message || "").toLowerCase();

  return code === "42P01"
    || code === "PGRST205"
    || message.includes("does not exist")
    || message.includes("could not find the table")
    || message.includes("admin_announcements")
    || message.includes("admin_users")
    || message.includes("user_preferences");
}

function resolveNotificationPermissionStatus() {
  if (!supportsClassNotifications()) {
    return "default";
  }

  return ["default", "granted", "denied"].includes(Notification.permission)
    ? Notification.permission
    : "default";
}

function resolveInstallationStatus() {
  if (typeof window === "undefined") {
    return "browser";
  }

  if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) {
    return "standalone";
  }

  if (typeof navigator !== "undefined" && navigator.standalone) {
    return "standalone";
  }

  return "browser";
}

function stopUserSubscriptions() {
  return;
}

function render() {
  if (!state.user) {
    appElement.innerHTML = renderLogin();
    syncStudentCardStageRatio();
    return;
  }

  if (state.activeTab === DOCUMENT_VIEWER_TAB_ID && state.documentViewer?.documentType === DOCUMENT_TYPES.studentCard) {
    appElement.innerHTML = renderStudentCardScreen();
    syncStudentCardStageRatio();
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
  syncStudentCardStageRatio();
}

function onLoad(event) {
  const target = event.target;
  if (!(target instanceof HTMLImageElement) || !target.classList.contains("student-card-image")) {
    return;
  }

  applyStudentCardStageRatio(target);
}

function onVisibilityChange() {
  if (typeof document === "undefined" || document.visibilityState !== "visible") {
    return;
  }

  refreshRuMenuIfNeeded(true);
  void maybeShowMenuNotification(state.menu[0] || null);
  syncClassNotifications();
}

function onConnectivityChange() {
  const isOnline = isNavigatorOnline();

  setState({
    isOnline,
    syncMessage: isOnline
      ? (state.offlineAccess ? "Conexao restabelecida. Recarregue o app para sincronizar os dados mais recentes." : state.syncMessage)
      : "Modo offline ativo com os ultimos dados salvos neste aparelho.",
  });

  if (!isOnline) {
    if (!state.user) {
      void restoreOfflineSession("Modo offline ativo com os ultimos dados salvos neste aparelho.");
    }
    return;
  }

  if (state.user && !state.offlineAccess) {
    refreshRuMenuIfNeeded(true);
  }
}

function isNavigatorOnline() {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

function isLikelyOfflineError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return !isNavigatorOnline()
    || message.includes("network")
    || message.includes("fetch")
    || message.includes("failed to fetch")
    || message.includes("load failed")
    || message.includes("offline");
}

async function restoreOfflineSession(message = "") {
  const cachedUser = loadSession();
  if (!cachedUser?.uid) {
    return false;
  }

  const cachedProfile = loadStoredProfile(cachedUser.uid) || ensureStoredProfile(cachedUser);
  let cachedUploads = [];

  try {
    cachedUploads = await listUploadsForUser(cachedUser.uid);
  } catch (error) {
    cachedUploads = [];
  }

  const profile = ensureActiveUploadProfile(cachedProfile, cachedUploads);
  const registrationComplete = hasCompletedRegistration(cachedUploads, profile);
  const nextActiveTab = state.activeTab === ADMIN_TAB_ID ? "home" : state.activeTab;
  const activeUpload = cachedUploads.find((item) => item.id === profile.activeUploadId)
    || cachedUploads.find((item) => item.documentType !== DOCUMENT_TYPES.studentCard)
    || null;
  const studentCardUpload = getPrimaryStudentCardUploadFromUploads(cachedUploads);

  setState({
    authChecking: false,
    authError: "",
    user: cachedUser,
    profile,
    uploads: cachedUploads,
    studentCardUrlDraft: getStudentCardLinkUrl(studentCardUpload),
    activeTab: registrationComplete ? nextActiveTab : REGISTRATION_TAB_ID,
    agendaTab: registrationComplete ? state.agendaTab : "today",
    referenceDate: activeUpload?.academicData?.schedule?.length
      ? suggestReferenceDate(activeUpload.academicData.schedule, state.referenceDate)
      : state.referenceDate,
    isAdmin: false,
    adminRole: "",
    adminLoading: false,
    adminError: "",
    adminStats: createEmptyAdminStats(),
    offlineAccess: true,
    isOnline: false,
    uploadMessage: "",
    uploadError: "",
    syncMessage: message || "Modo offline ativo com os ultimos dados salvos neste aparelho.",
  });

  return true;
}

function syncStudentCardStageRatio() {
  const image = appElement.querySelector(".student-card-image");
  if (!(image instanceof HTMLImageElement) || !image.complete) {
    return;
  }

  applyStudentCardStageRatio(image);
}

function applyStudentCardStageRatio(image) {
  const stage = image.closest(".document-viewer-stage.is-student-card-stage");
  const naturalWidth = Number(image.naturalWidth || 0);
  const naturalHeight = Number(image.naturalHeight || 0);

  if (!(stage instanceof HTMLElement) || !naturalWidth || !naturalHeight) {
    return;
  }

  stage.style.setProperty("--student-card-stage-ratio", String(naturalWidth / naturalHeight));
}

function renderLogin() {
  const canLogin = !state.authChecking && state.supabaseReady && state.canUseGoogleAuth && state.isOnline;
  const loginLabel = state.authChecking ? "Conectando..." : "Entrar com Google";
  const supportMessage = state.authError
    || (!state.supabaseReady
      ? "O acesso online ainda está sendo preparado para este ambiente."
      : !state.isOnline
        ? "Sem internet agora. Entre online uma vez neste aparelho para liberar o modo offline basico."
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
        <p class="login-subtitle">Tente novamente em instantes para voltar ao painel interno do aplicativo.</p>
        <div class="login-actions login-actions-hero">
          <button class="cta" data-action="reload-app">Tentar novamente</button>
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

  if (state.activeTab === ADMIN_TAB_ID) {
    return state.isAdmin ? renderAdminPanel() : renderAdminAccessDenied();
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

  return renderHomePanel(activeUpload);
}

function renderStudentCardScreen() {
  const viewer = state.documentViewer || createEmptyDocumentViewerState();
  const frameSrc = viewer.externalUrl || viewer.objectUrl || "";

  return `
    <section class="student-card-screen">
      <div class="student-card-screen-top">
        <button class="ghost student-card-back" data-action="close-document-viewer">Voltar</button>
      </div>
      <div class="student-card-screen-body">
        ${viewer.loading
          ? `<div class="empty-state">Carregando o ID digital dentro do app...</div>`
          : frameSrc
            ? `<div class="document-viewer-stage is-student-card-stage"><img class="student-card-image" src="${escapeAttribute(frameSrc)}" alt="Carteirinha estudantil" referrerpolicy="no-referrer" decoding="async" /></div>`
            : `<div class="empty-state">Nao consegui preparar o ID digital agora.</div>`}
      </div>
    </section>
  `;
}

function renderDocumentViewer() {
  const viewer = state.documentViewer || createEmptyDocumentViewerState();
  const isStudentCardViewer = viewer.documentType === DOCUMENT_TYPES.studentCard;
  const title = viewer.documentType === DOCUMENT_TYPES.studentCard
    ? "Carteirinha estudantil"
    : viewer.title || "Documento";
  const topline = viewer.documentType === DOCUMENT_TYPES.studentCard ? "ID digital" : "Documento";
  const frameSrc = viewer.externalUrl || (viewer.objectUrl ? `${viewer.objectUrl}#toolbar=0&navpanes=0&scrollbar=1` : "");

  return `
    <section class="section-stack simple-stack">
      <section class="paper-card simple-section document-viewer-shell ${isStudentCardViewer ? "is-student-card-viewer" : ""}">
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
          ? `<div class="empty-state" style="margin-top: 1rem;">${viewer.documentType === DOCUMENT_TYPES.studentCard ? "Carregando o ID digital dentro do app..." : "Carregando o documento dentro do app..."}</div>`
          : frameSrc
            ? isStudentCardViewer
              ? `<div class="document-viewer-stage is-student-card-stage"><img class="student-card-image" src="${escapeAttribute(frameSrc)}" alt="${escapeAttribute(title)}" referrerpolicy="no-referrer" decoding="async" /></div>`
              : `<iframe class="document-viewer-frame" src="${escapeAttribute(frameSrc)}" title="${escapeAttribute(title)}" referrerpolicy="no-referrer"></iframe>`
            : `<div class="empty-state" style="margin-top: 1rem;">Nao consegui preparar este documento agora.</div>`}
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
        ${getSidebarItems().map((item) => renderSidebarItem(item, registration)).join("")}
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

function getSidebarItems() {
  return state.isAdmin
    ? [...SIDEBAR_ITEMS, { id: ADMIN_TAB_ID, label: "Admin", icon: "shield", action: "open-admin" }]
    : SIDEBAR_ITEMS;
}

function renderSidebarItem(item, registration) {
  const isViewerStudentCard = state.activeTab === DOCUMENT_VIEWER_TAB_ID
    && state.documentViewer.documentType === DOCUMENT_TYPES.studentCard
    && item.action === "open-student-card";
  const isActive = item.id === state.activeTab
    || (state.activeTab === "academic" && item.tab === state.agendaTab)
    || isViewerStudentCard;
  const isLocked = !registration.isComplete
    && item.action !== "open-registration"
    && item.action !== "open-student-card"
    && item.action !== "open-admin";

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
  const studentCardLink = getStudentCardLinkUrl(studentCardUpload);

  return `
    <section class="section-stack simple-stack">
      <section class="paper-card dashboard-highlight onboarding-highlight">
        <div class="section-topline">Cadastro inicial</div>
        <h2 class="section-title">${registration.isComplete ? "Cadastro concluido" : "Envie os dois documentos antes do primeiro uso"}</h2>
        <p class="section-copy">
          ${registration.isComplete
            ? "Sua grade horaria e seu ID digital ja estao vinculados a conta. Sempre que precisar, voce pode atualizar os dados aqui."
            : "Para liberar o painel do DAGV, precisamos da grade horaria em PDF e do link oficial da carteirinha estudantil. Ate la, o app fica em modo de espera com avisos simples."}
        </p>
        <div class="simple-meta-grid">
          ${renderRegistrationStatusCard("Grade horaria", registration.scheduleUpload ? "Recebida" : "Aguardando PDF", registration.scheduleUpload ? getExtractionCaption(registration.scheduleUpload) : "Envie o PDF do SCA para montar sua agenda.")}
          ${renderRegistrationStatusCard("ID digital", studentCardUpload ? "Link salvo" : "Aguardando link", studentCardUpload ? "O item ID Digital do menu ja abre a carteirinha dentro do app." : "Cole o link oficial da carteirinha virtual da UFTM.")}
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
        <p class="section-copy">Cole o link oficial da carteirinha virtual da UFTM para abrir o ID digital dentro do app.</p>
        <div class="upload-drop registration-drop" style="margin-top: 1rem;">
          <div class="inline-field">
            <label for="studentCardUrlInput">Link da carteirinha virtual</label>
            <input id="studentCardUrlInput" type="url" inputmode="url" autocomplete="url" spellcheck="false" placeholder="https://siscad.uftm.edu.br/carteiravirtual/..." value="${escapeAttribute(state.studentCardUrlDraft || studentCardLink)}" />
          </div>
          <div class="button-row">
            <button class="ghost" data-action="save-student-card-link">${studentCardUpload ? "Atualizar link" : "Salvar link"}</button>
          </div>
          ${studentCardUpload ? `
            <div class="simple-meta-grid">
              <div class="mini-card"><small>ID digital</small><strong>${escape(studentCardUpload.originalName || "Carteirinha virtual UFTM")}</strong><span>${escape(getStudentCardUrlLabel(studentCardUpload) || "Leitura interna pelo app")}</span></div>
              <div class="mini-card"><small>Status</small><strong>Pronto</strong><span>Abre direto pelo menu lateral.</span></div>
            </div>
          ` : `<div class="support-line" style="margin-top: 0.85rem;">Cole o link da carteirinha para habilitar o item ID Digital.</div>`}
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
                ...(studentCardUpload ? [renderUploadItem(studentCardUpload, studentCardUpload)] : []),
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
      ${renderAnnouncementsFeed()}
    </section>
  `;
}

function renderAdminAccessDenied() {
  return `
    <section class="section-stack simple-stack">
      <section class="paper-card dashboard-highlight onboarding-highlight">
        <div class="section-topline">Admin</div>
        <h2 class="section-title">Acesso restrito</h2>
        <p class="section-copy">Esta área administrativa só fica disponível para contas autorizadas no Supabase.</p>
        <div class="button-row" style="margin-top: 1rem;">
          <button class="secondary" data-action="set-main-tab" data-tab="home">Voltar ao início</button>
        </div>
      </section>
    </section>
  `;
}

function buildAdminAnnouncementBuckets(items) {
  const active = [];
  const scheduled = [];
  const library = [];

  for (const item of items || []) {
    if (isAnnouncementActive(item)) {
      active.push(item);
      continue;
    }

    if (item.isPublished && item.startsAt && new Date(item.startsAt).getTime() > Date.now()) {
      scheduled.push(item);
      continue;
    }

    library.push(item);
  }

  return {
    active: sortAnnouncementsForDisplay(active),
    scheduled: sortAnnouncementsForDisplay(scheduled),
    library: sortAnnouncementsForDisplay(library),
  };
}

function renderAdminCategoryOption(option, selectedCategory) {
  const isSelected = option.id === normalizeAnnouncementCategory(selectedCategory);
  return `
    <button class="announcement-type-option ${isSelected ? "is-selected" : ""} ${getAnnouncementToneClass(option.id)}" type="button" data-action="set-admin-category" data-category="${escapeAttribute(option.id)}">
      <div>
        <strong>${escape(option.label)}</strong>
        <span>${escape(option.description)}</span>
      </div>
      <small>${escape(option.placement)}</small>
    </button>
  `;
}

function buildAdminDraftPreview(draft) {
  return {
    id: "draft-preview",
    category: normalizeAnnouncementCategory(draft?.category),
    title: String(draft?.title || "").trim() || "Seu anuncio aparece aqui",
    body: String(draft?.body || "").trim() || "Escreva uma mensagem objetiva para os alunos entenderem o que mudou e qual acao tomar.",
    actionLabel: String(draft?.actionLabel || "").trim(),
    actionUrl: normalizeOptionalHttpUrl(draft?.actionUrl || ""),
    startsAt: normalizeAdminDateTimeValue(draft?.startsAt || "") || "",
    endsAt: normalizeAdminDateTimeValue(draft?.endsAt || "") || "",
    isPublished: Boolean(draft?.isPublished),
    createdAt: new Date().toISOString(),
  };
}

function renderAdminDraftPreview(draft) {
  const preview = buildAdminDraftPreview(draft);
  const placement = getAnnouncementCategoryPlacement(preview.category);
  const previewCard = isAnnouncementSpotlightCategory(preview.category)
    ? renderAnnouncementSpotlight(preview, {
        preview: true,
        topline: "Destaque inicial",
        helper: placement,
      })
    : renderPublishedAnnouncementCard(preview);

  return `
    <div class="section-stack" style="margin-top: 1rem;">
      ${previewCard}
      <div class="mini-card">
        <small>Posicionamento</small>
        <strong>${escape(placement)}</strong>
        <span>${escape(getAnnouncementCategoryDescription(preview.category))}</span>
      </div>
    </div>
  `;
}

function renderAdminAnnouncementBucket(title, description, items) {
  return `
    <section class="admin-announcement-column">
      <div class="admin-announcement-column-head">
        <div>
          <h3>${escape(title)}</h3>
          <p>${escape(description)}</p>
        </div>
        <span class="tag">${String(items.length)}</span>
      </div>
      <div class="upload-list">
        ${items.length
          ? items.map(renderAdminAnnouncementItem).join("")
          : `<div class="empty-state">Nenhuma publicacao nesta coluna.</div>`}
      </div>
    </section>
  `;
}

function renderAnnouncementSpotlight(item, options = {}) {
  if (!item) {
    return "";
  }

  const helper = options.helper || getAnnouncementCategoryPlacement(item.category);
  return `
    <section class="paper-card announcement-spotlight ${getAnnouncementToneClass(item.category)}">
      <div class="announcement-spotlight-top">
        <div>
          <div class="section-topline">${escape(options.topline || "Anuncio em destaque")}</div>
          <h2 class="section-title">${escape(item.title)}</h2>
        </div>
        <span class="tag">${escape(getAnnouncementCategoryLabel(item.category))}</span>
      </div>
      <p class="section-copy">${escape(item.body || getAnnouncementCategoryDescription(item.category))}</p>
      <div class="item-meta">
        <span class="tag">${escape(helper)}</span>
        ${item.startsAt ? `<span class="tag">${options.preview ? "Inicio" : "Visivel desde"} ${escape(formatShortDateTime(item.startsAt))}</span>` : ""}
        ${item.endsAt ? `<span class="tag">Ate ${escape(formatShortDateTime(item.endsAt))}</span>` : ""}
      </div>
      ${item.actionUrl
        ? `<div class="button-row" style="margin-top: 0.9rem;"><a class="secondary link-button" href="${escapeAttribute(item.actionUrl)}" target="_blank" rel="noreferrer">${escape(item.actionLabel || "Abrir link")}</a></div>`
        : ""}
    </section>
  `;
}

function renderHomeAnnouncementSpotlight(item) {
  if (!item) {
    return "";
  }

  return renderAnnouncementSpotlight(item, {
    topline: "Anuncio em destaque",
    helper: "Espaco principal da home",
  });
}

function renderAdminPanel() {
  const draft = state.adminDraft || createEmptyAdminDraft();
  const announcements = [...state.announcements]
    .sort((left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || "")));
  const buckets = buildAdminAnnouncementBuckets(announcements);

  return `
    <section class="section-stack simple-stack">
      <section class="paper-card dashboard-highlight simple-section">
        <div class="section-header-row">
          <div>
            <div class="section-topline">Administração</div>
            <h2 class="section-title">Anuncios, avisos e metricas do aplicativo</h2>
          </div>
          <div class="button-row">
            <button class="ghost" data-action="admin-refresh">Atualizar painel</button>
          </div>
        </div>
        <p class="section-copy">Use esta area para publicar anuncios, avisos academicos, comunicados urgentes, eventos e festas em um feed mais organizado para os alunos.</p>
        <div class="metrics-grid" style="margin-top: 1rem;">
          ${metric("Usuários", String(state.adminStats.totalUsers), "contas com login criado")}
          ${metric("Ativos 7d", String(state.adminStats.activeUsers7d), "abriram o app na última semana")}
          ${metric("Cadastros", String(state.adminStats.completedRegistrations), "já concluíram grade + ID")}
          ${metric("Notificações", String(state.adminStats.notificationSubscribers), "aceitaram os avisos do app")}
          ${metric("Modo app", String(state.adminStats.standaloneUsers), "abriram em modo instalado")}
        </div>
        <div class="simple-meta-grid admin-announcement-summary" style="margin-top: 1rem;">
          ${renderRegistrationStatusCard("Ativos agora", String(buckets.active.length), "ja aparecem para os alunos")}
          ${renderRegistrationStatusCard("Agendados", String(buckets.scheduled.length), "entram automaticamente no horario")}
          ${renderRegistrationStatusCard("Rascunhos e arquivo", String(buckets.library.length), "itens fora do feed atual")}
        </div>
        ${state.adminError ? `<div class="toast is-warning" style="margin-top: 1rem;">${escape(state.adminError)}</div>` : ""}
      </section>

      <section class="paper-card simple-section">
        <div class="section-header-row">
          <div>
            <div class="section-topline">Publicacao</div>
            <h2 class="section-title">Novo conteudo para a home</h2>
          </div>
        </div>
        <p class="section-copy">Escolha o tipo do conteudo, revise a previa e publique. Os anuncios em destaque ganham um espaco proprio logo no topo da tela inicial.</p>
        <div class="admin-compose-grid">
          <div class="form-grid">
            <div class="inline-field">
              <label for="adminDraftCategory">Tipo</label>
              <select id="adminDraftCategory">
                ${ANNOUNCEMENT_CATEGORY_OPTIONS.map((option) => `
                  <option value="${option.id}" ${draft.category === option.id ? "selected" : ""}>${escape(option.label)}</option>
                `).join("")}
              </select>
            </div>
            <div class="announcement-type-grid">
              ${ANNOUNCEMENT_CATEGORY_OPTIONS.map((option) => renderAdminCategoryOption(option, draft.category)).join("")}
            </div>
            <div class="inline-field">
              <label for="adminDraftTitle">Titulo</label>
              <input id="adminDraftTitle" type="text" maxlength="120" value="${escapeAttribute(draft.title)}" placeholder="Ex.: Jornada academica com inscricoes abertas" />
            </div>
            <div class="inline-field">
              <label for="adminDraftBody">Mensagem</label>
              <textarea id="adminDraftBody" rows="5" maxlength="1200" placeholder="Escreva o conteudo que deve aparecer para os alunos.">${escape(draft.body)}</textarea>
            </div>
            <div class="simple-meta-grid">
              <div class="inline-field">
                <label for="adminDraftStartsAt">Inicio</label>
                <input id="adminDraftStartsAt" type="datetime-local" value="${escapeAttribute(draft.startsAt)}" />
              </div>
              <div class="inline-field">
                <label for="adminDraftEndsAt">Fim</label>
                <input id="adminDraftEndsAt" type="datetime-local" value="${escapeAttribute(draft.endsAt)}" />
              </div>
            </div>
            <div class="simple-meta-grid">
              <div class="inline-field">
                <label for="adminDraftActionLabel">Texto do botao</label>
                <input id="adminDraftActionLabel" type="text" maxlength="40" value="${escapeAttribute(draft.actionLabel)}" placeholder="Ex.: Abrir inscricao" />
              </div>
              <div class="inline-field">
                <label for="adminDraftActionUrl">Link do botao</label>
                <input id="adminDraftActionUrl" type="url" value="${escapeAttribute(draft.actionUrl)}" placeholder="https://..." />
              </div>
            </div>
            <label class="checkbox-field" for="adminDraftPublished">
              <input id="adminDraftPublished" type="checkbox" ${draft.isPublished ? "checked" : ""} />
              <span>Publicar imediatamente</span>
            </label>
            <div class="button-row">
              <button class="secondary" data-action="save-admin-announcement" ${state.adminLoading ? "disabled" : ""}>${state.adminLoading ? "Salvando..." : "Salvar aviso"}</button>
              <button class="ghost" data-action="admin-refresh">Recarregar</button>
            </div>
          </div>
          <aside class="announcement-preview-shell">
            <div class="section-topline">Previa</div>
            <h3 class="section-title">Como vai aparecer para o aluno</h3>
            <p class="section-copy">O app usa um destaque principal para anuncios e um feed organizado por tipo logo abaixo.</p>
            ${renderAdminDraftPreview(draft)}
          </aside>
        </div>
      </section>

      <section class="paper-card simple-section">
        <div class="section-header-row">
          <div>
            <div class="section-topline">Organizacao</div>
            <h2 class="section-title">Publicacoes cadastradas</h2>
          </div>
          <span class="tag">${String(announcements.length)} itens</span>
        </div>
        <div class="admin-board-grid" style="margin-top: 1rem;">
          ${renderAdminAnnouncementBucket("Ativos agora", "Entraram na home do app.", buckets.active)}
          ${renderAdminAnnouncementBucket("Agendados", "Aguardando a janela de publicacao.", buckets.scheduled)}
          ${renderAdminAnnouncementBucket("Rascunhos e arquivo", "Itens despublicados ou encerrados.", buckets.library)}
        </div>
      </section>
    </section>
  `;
}

function renderAdminAnnouncementItem(item) {
  return `
    <article class="upload-entry admin-announcement-entry ${getAnnouncementToneClass(item.category)}">
      <div class="upload-entry-top">
        <div>
          <h3 class="schedule-title">${escape(item.title)}</h3>
          <div class="support-line">${escape(getAnnouncementCategoryLabel(item.category))} • ${escape(getAnnouncementStatusLabel(item))} • ${escape(getAnnouncementCategoryPlacement(item.category))}</div>
        </div>
        <span class="tag">${escape(getAnnouncementStatusLabel(item))}</span>
      </div>
      ${item.body ? `<p class="section-copy" style="margin-top: 0.75rem;">${escape(item.body)}</p>` : ""}
      <div class="item-meta">
        ${item.startsAt ? `<span class="tag">Inicio ${escape(formatShortDateTime(item.startsAt))}</span>` : ""}
        ${item.endsAt ? `<span class="tag">Fim ${escape(formatShortDateTime(item.endsAt))}</span>` : ""}
        ${item.actionUrl ? `<span class="tag">${escape(item.actionLabel || "Link externo")}</span>` : ""}
      </div>
      <div class="button-row" style="margin-top: 0.75rem;">
        <button class="ghost" data-action="toggle-admin-announcement" data-announcement-id="${escapeAttribute(item.id)}">${item.isPublished ? "Despublicar" : "Publicar"}</button>
        <button class="ghost" data-action="delete-admin-announcement" data-announcement-id="${escapeAttribute(item.id)}">Excluir</button>
      </div>
    </article>
  `;
}

function renderAnnouncementsFeed(options = {}) {
  const excludeIds = new Set(options.excludeIds || []);
  const activeAnnouncements = getActiveAnnouncements().filter((item) => !excludeIds.has(item.id));
  const sections = ANNOUNCEMENT_HOME_SECTIONS
    .map((section) => ({
      ...section,
      items: activeAnnouncements.filter((item) => section.categories.includes(item.category)).slice(0, 4),
    }))
    .filter((section) => section.items.length);

  if (!sections.length) {
    return "";
  }

  return `
    <section class="section-stack announcement-feed-stack">
      ${sections.map(renderAnnouncementCollection).join("")}
    </section>
  `;
}

function renderAnnouncementCollection(section) {
  return `
    <section class="paper-card simple-section">
      <div class="section-topline">${escape(section.topline)}</div>
      <h2 class="section-title">${escape(section.title)}</h2>
      <div class="upload-list" style="margin-top: 1rem;">
        ${section.items.map(renderPublishedAnnouncementCard).join("")}
      </div>
    </section>
  `;
}

function renderPublishedAnnouncementCard(item) {
  return `
    <article class="upload-entry admin-announcement-entry ${getAnnouncementToneClass(item.category)}">
      <div class="upload-entry-top">
        <div>
          <h3 class="schedule-title">${escape(item.title)}</h3>
          <div class="support-line">${escape(getAnnouncementCategoryLabel(item.category))} • ${escape(getAnnouncementCategoryPlacement(item.category))}${item.startsAt ? ` • ${escape(formatShortDateTime(item.startsAt))}` : ""}</div>
        </div>
        <span class="tag">${escape(getAnnouncementStatusLabel(item))}</span>
      </div>
      ${item.body ? `<p class="section-copy" style="margin-top: 0.75rem;">${escape(item.body)}</p>` : ""}
      ${item.actionUrl ? `<div class="button-row" style="margin-top: 0.75rem;"><a class="ghost link-button" href="${escapeAttribute(item.actionUrl)}" target="_blank" rel="noreferrer">${escape(item.actionLabel || "Abrir link")}</a></div>` : ""}
    </article>
  `;
}

function renderHomePanel(activeUpload) {
  const academicData = getAcademicData(activeUpload);
  const schedule = academicData?.schedule || [];
  const todayClasses = getClassesForDate(schedule, state.referenceDate);
  const nextClass = findNextClass(schedule, state.referenceDate);
  const menu = state.menu[0] || null;
  const spotlightAnnouncement = getAnnouncementSpotlight();
  return `
    <section class="section-stack simple-stack">
      <section class="paper-card dashboard-highlight">
        <div class="section-topline">Resumo</div>
        <h2 class="section-title">${escape(buildHeroTitle(activeUpload, academicData, todayClasses, nextClass))}</h2>
        <div class="button-row" style="margin-top: 1rem;">
          <button class="secondary" data-action="${academicData ? "open-academic-tab" : "open-registration"}" ${academicData ? 'data-tab="today"' : ""}>${academicData ? "Abrir agenda" : "Finalizar cadastro"}</button>
          ${getRegistrationState().studentCardUpload ? `<button class="ghost" data-action="open-student-card">Abrir ID digital</button>` : ""}
        </div>
      </section>

      ${renderHomeAnnouncementSpotlight(spotlightAnnouncement)}

      <section class="home-shortcuts">
        ${renderHomeShortcut("calendar-day", "Hoje", "open-academic-tab", "today")}
        ${renderHomeShortcut("utensils", "RU", "open-academic-tab", "menu")}
        ${renderHomeShortcut("calendar-grid", "Semana", "open-academic-tab", "week")}
        ${renderHomeShortcut("user-plus", "Cadastro", "open-registration", "")}
        ${getRegistrationState().studentCardUpload ? renderHomeShortcut("id-card", "ID Digital", "open-student-card", "") : ""}
        ${state.isAdmin ? renderHomeShortcut("shield", "Admin", "open-admin", "") : ""}
      </section>

      ${renderNotificationPanel(activeUpload)}

      ${renderAnnouncementsFeed({ excludeIds: spotlightAnnouncement ? [spotlightAnnouncement.id] : [] })}

      ${renderExpansionLinksPanel()}

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
    </section>
  `;
}

function renderNotificationPanel(activeUpload) {
  const notificationsSupported = supportsClassNotifications();
  const permission = resolveNotificationPermissionStatus();
  const menu = state.menu[0] || null;
  const academicData = getAcademicData(activeUpload);
  const schedule = academicData?.schedule || [];
  const nextReminder = activeUpload && schedule.length
    ? getNextClassReminder(schedule, activeUpload.id || "")
    : null;
  const activationLabel = permission === "denied" ? "Como liberar avisos" : "Ativar avisos";

  return `
    <section class="paper-card simple-section">
      <div class="section-header-row">
        <div>
          <div class="section-topline">Notificacoes</div>
          <h2 class="section-title">Cardapio do dia e aulas</h2>
        </div>
        <span class="tag">${escape(getNotificationPermissionLabel(permission, notificationsSupported))}</span>
      </div>
      <p class="section-copy">${escape(buildNotificationPanelCopy(permission, notificationsSupported))}</p>
      <div class="simple-meta-grid">
        ${renderRegistrationStatusCard("Cardapio do dia", getMenuNotificationStatus(menu, permission, notificationsSupported), buildMenuNotificationCaption(menu, permission, notificationsSupported))}
        ${renderRegistrationStatusCard("Aulas", getClassNotificationStatus(activeUpload, nextReminder, permission, notificationsSupported), buildClassNotificationCaption(activeUpload, nextReminder, permission, notificationsSupported))}
      </div>
      <div class="button-row" style="margin-top: 1rem;">
        ${notificationsSupported && permission !== "granted" ? `<button class="secondary" data-action="enable-notifications">${escape(activationLabel)}</button>` : ""}
        <button class="ghost" data-action="open-academic-tab" data-tab="menu">Ver RU</button>
        ${activeUpload ? `<button class="ghost" data-action="open-academic-tab" data-tab="today">Ver aulas</button>` : ""}
      </div>
    </section>
  `;
}

function renderExpansionLinksPanel() {
  return `
    <section class="paper-card simple-section">
      <div class="section-header-row">
        <div>
          <div class="section-topline">Expansao</div>
          <h2 class="section-title">Planos, checkout e ligas</h2>
        </div>
        <span class="tag">Estrutura pronta</span>
      </div>
      <p class="section-copy">A home agora ja comporta um checkout de pagamento unico, um futuro Plano Plus e um espaco simples para Ligas Academicas, apenas com links e descricoes curtas.</p>
      <div class="link-grid" style="margin-top: 1rem;">
        ${EXPANSION_LINKS.map(renderExpansionLinkCard).join("")}
      </div>
    </section>
  `;
}

function renderExpansionLinkCard(item) {
  return `
    <a class="paper-card feature-card link-card" href="${escapeAttribute(item.href)}">
      <div class="link-card-top">
        <span class="tag">${escape(item.badge)}</span>
      </div>
      <div>
        <h3 class="schedule-title">${escape(item.title)}</h3>
        <p class="section-copy">${escape(item.description)}</p>
      </div>
      <span class="link-hint">${escape(item.hint)}</span>
    </a>
  `;
}

function getNotificationPermissionLabel(permission, notificationsSupported) {
  if (!notificationsSupported) {
    return "Sem suporte";
  }

  if (permission === "granted") {
    return "Ativas";
  }

  if (permission === "denied") {
    return "Bloqueadas";
  }

  return "Desligadas";
}

function buildNotificationPanelCopy(permission, notificationsSupported) {
  if (!notificationsSupported) {
    return "Este navegador nao oferece suporte aos avisos do app.";
  }

  if (permission === "granted") {
    return "Quando o app estiver aberto, voce recebe o cardapio do RU do dia e lembretes 10 minutos antes de cada aula.";
  }

  if (permission === "denied") {
    return "Os avisos foram bloqueados. Libere a permissao do site no navegador para voltar a receber o cardapio do RU e os lembretes das aulas.";
  }

  return "Ative os avisos para receber o cardapio do RU do dia e um lembrete 10 minutos antes das aulas.";
}

function getMenuNotificationStatus(menu, permission, notificationsSupported) {
  if (!notificationsSupported) {
    return "Sem suporte";
  }

  if (permission === "denied") {
    return "Bloqueado";
  }

  if (!menu) {
    return "Aguardando";
  }

  if (permission !== "granted") {
    return "Pronto";
  }

  return isTodayMenu(menu) ? "Hoje" : formatDateShort(menu.date);
}

function buildMenuNotificationCaption(menu, permission, notificationsSupported) {
  if (!notificationsSupported) {
    return "O navegador atual nao consegue mostrar o aviso do cardapio.";
  }

  if (permission === "denied") {
    return "As notificacoes do RU foram bloqueadas neste navegador.";
  }

  if (!menu) {
    return "Vou avisar assim que o cardapio do dia estiver disponivel.";
  }

  const highlight = [menu.mainDish, menu.option, menu.dessert].filter(Boolean).slice(0, 3).join(" • ");
  if (!highlight) {
    return permission === "granted"
      ? `Aviso pronto para ${formatDateShort(menu.date)}.`
      : `Ultimo cardapio salvo em ${formatDateShort(menu.date)}.`;
  }

  return permission === "granted"
    ? `${formatDateShort(menu.date)}: ${highlight}.`
    : `Ao ativar, o app avisa com este resumo: ${highlight}.`;
}

function getClassNotificationStatus(activeUpload, nextReminder, permission, notificationsSupported) {
  if (!activeUpload) {
    return "Sem grade";
  }

  if (!notificationsSupported) {
    return "Sem suporte";
  }

  if (permission === "denied") {
    return "Bloqueado";
  }

  if (permission !== "granted") {
    return "Aguardando";
  }

  if (!nextReminder) {
    return "Sem aulas";
  }

  return `${CLASS_NOTIFICATION_LEAD_MINUTES} min antes`;
}

function buildClassNotificationCaption(activeUpload, nextReminder, permission, notificationsSupported) {
  if (!activeUpload) {
    return "Envie a grade horaria para liberar os lembretes das aulas.";
  }

  if (!notificationsSupported) {
    return "O navegador atual nao consegue mostrar os avisos das aulas.";
  }

  if (permission === "denied") {
    return "As notificacoes das aulas foram bloqueadas neste navegador.";
  }

  if (permission !== "granted") {
    return "Ative para receber um aviso 10 minutos antes de cada aula.";
  }

  if (!nextReminder) {
    return "Nenhuma aula futura encontrada nos proximos dias.";
  }

  return `${nextReminder.title} em ${formatDateShort(nextReminder.isoDate)} as ${nextReminder.startTime}.`;
}

function renderAcademicPanel(activeUpload) {
  const academicData = getAcademicData(activeUpload);
  const schedule = academicData?.schedule || [];
  const disciplines = academicData?.disciplines || [];
  const todayClasses = getClassesForDate(schedule, state.referenceDate);
  const weekView = buildWeekView(schedule, state.referenceDate);

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
  const supportLabel = isStudentCard
    ? `${isStudentCardLinkUpload(item) ? "Link da carteirinha" : "Carteirinha estudantil"} • ${formatShortDateTime(item.uploadedAtClient)}${getStudentCardUrlLabel(item) ? ` • ${getStudentCardUrlLabel(item)}` : ""}`
    : `Grade horaria • ${formatShortDateTime(item.uploadedAtClient)} • ${formatBytes(item.size)}`;
  return `
    <article class="upload-entry ${isActive ? "is-active" : ""}">
      <div class="upload-entry-top">
        <div>
          <h3 class="schedule-title">${escape(item.originalName)}</h3>
          <div class="support-line">${escape(supportLabel)}</div>
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

function renderAgendaTabButton(item) {
  return `
    <button class="segmented-button compact-segment ${state.agendaTab === item.id ? "is-active" : ""}" data-action="set-agenda-tab" data-tab="${item.id}">
      ${item.label}
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
    shield: `
      <path d="M12 3 19 6v6c0 4.6-2.7 7.8-7 9-4.3-1.2-7-4.4-7-9V6l7-3Z"></path>
      <path d="m9.5 12 1.8 1.8 3.6-3.6"></path>
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

  if (state.activeTab === ADMIN_TAB_ID) {
    return "Admin";
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
    [ADMIN_TAB_ID]: "Admin",
  };

  return mainTitleMap[state.activeTab] || APP_NAME;
}

function renderStatusBanner(registration = getRegistrationState()) {
  const message = state.uploadError
    || state.authError
    || (!state.isOnline && state.user ? "Modo offline ativo. Exibindo os ultimos dados salvos neste aparelho." : "")
    || (!registration.isComplete ? buildRegistrationBannerMessage(registration) : "");
  if (!message) {
    return "";
  }

  const classes = ["toast", "compact-toast"];
  if (state.uploadError || state.authError) {
    classes.push("is-danger");
  } else if (!state.isOnline && state.user) {
    classes.push("is-warning");
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

function getPrimaryStudentCardUpload() {
  return getPrimaryStudentCardUploadFromUploads(state.uploads);
}

function getRegistrationState() {
  const scheduleUploads = getScheduleUploads();
  const scheduleUpload = getActiveUpload();
  const studentCardUploads = getStudentCardUploads();
  const studentCardCandidate = getPrimaryStudentCardUpload();
  const studentCardUpload = getStudentCardLinkUrl(studentCardCandidate) ? studentCardCandidate : null;
  const missing = [];

  if (!scheduleUpload) {
    missing.push("grade horaria");
  }

  if (!studentCardUpload) {
    missing.push("link da carteirinha estudantil");
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
  if (state.isAdmin) {
    return true;
  }

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

  if (action === "open-admin") {
    revokeActiveDocumentViewer();
    setState({
      activeTab: ADMIN_TAB_ID,
      sidebarOpen: false,
      documentViewer: createEmptyDocumentViewerState(),
      uploadError: "",
      uploadMessage: "",
    });
    if (state.isAdmin) {
      void refreshAdminDashboard(false);
    }
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

  if (action === "admin-refresh") {
    if (state.isAdmin) {
      void refreshAdminDashboard(false);
    }
    return;
  }

  if (action === "enable-notifications") {
    void enableAppNotifications();
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
        uploadMessage: "O ID digital ainda aguarda o link oficial da carteirinha do aluno.",
      });
      return;
    }

    setState({ sidebarOpen: false });
    openUpload(studentCardUpload.id, { inline: true });
    return;
  }

  if (action === "save-student-card-link") {
    saveStudentCardLink();
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
    return;
  }

  if (action === "set-admin-category") {
    setState({
      adminDraft: {
        ...(state.adminDraft || createEmptyAdminDraft()),
        category: normalizeAnnouncementCategory(button.dataset.category || ""),
      },
      adminError: "",
      uploadError: "",
    });
    return;
  }

  if (action === "save-admin-announcement") {
    void saveAdminAnnouncement();
    return;
  }

  if (action === "toggle-admin-announcement") {
    void toggleAdminAnnouncementPublished(button.dataset.announcementId || "");
    return;
  }

  if (action === "delete-admin-announcement") {
    void deleteAdminAnnouncement(button.dataset.announcementId || "");
  }
}

function onInput(event) {
  if (event.target.id && String(event.target.id).startsWith("login")) {
    setState({ authError: "" }, { render: false });
    return;
  }

  if (event.target.id === "studentCardUrlInput") {
    setState({
      studentCardUrlDraft: event.target.value || "",
      uploadError: "",
    }, { render: false });
    return;
  }

  if (String(event.target.id || "").startsWith("adminDraft")) {
    updateAdminDraftFromEvent(event.target);
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

  if (String(event.target.id || "").startsWith("adminDraft")) {
    updateAdminDraftFromEvent(event.target);
  }
}

async function logout() {
  if (!services.supabase) {
    revokeActiveDocumentViewer();
    stopUserSubscriptions();
    clearSession();
    setState({
      authChecking: false,
      authError: "",
      uploadError: "",
      uploadMessage: "",
      uploadProgress: 0,
      openingUploadId: "",
      studentCardUrlDraft: "",
      activeTab: "home",
      agendaTab: "today",
      sidebarOpen: false,
      documentViewer: createEmptyDocumentViewerState(),
      user: null,
      profile: null,
      uploads: [],
      isAdmin: false,
      adminRole: "",
      adminStats: createEmptyAdminStats(),
      adminDraft: createEmptyAdminDraft(),
      offlineAccess: false,
      syncMessage: state.isOnline
        ? "Sessão encerrada. Entre novamente para acessar seus PDFs."
        : "Modo offline encerrado neste aparelho.",
    });
    return;
  }

  try {
    revokeActiveDocumentViewer();
    stopUserSubscriptions();
    clearSession();
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
      studentCardUrlDraft: "",
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
    const localUploadSnapshot = {
      id: uploadId,
      ownerUid: state.user.uid,
      originalName: file.name,
      normalizedName,
      storagePath,
      size: file.size,
      contentType: file.type || "application/pdf",
      status: "processed",
      parserStatus: "parsed_locally",
      uploadedAtClient,
      updatedAt: uploadedAtClient,
      notes: "PDF salvo localmente neste aparelho para acesso offline basico.",
      academicData,
      documentType: DOCUMENT_TYPES.schedule,
    };

    await cacheUploadForOffline(localUploadSnapshot, file);

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

async function saveStudentCardLink() {
  if (!state.user || !services.supabase) {
    setState({ uploadError: "Entre com Google antes de salvar o link da carteirinha.", uploadMessage: "", uploadProgress: 0 });
    return;
  }

  const studentCardUrl = normalizeStudentCardLink(state.studentCardUrlDraft);
  if (!studentCardUrl || !isAllowedStudentCardUrl(studentCardUrl)) {
    setState({
      uploadError: "Cole um link HTTPS oficial da UFTM para a carteirinha estudantil.",
      uploadMessage: "",
      uploadProgress: 0,
    });
    return;
  }

  const currentUpload = getPrimaryStudentCardUpload();
  const uploadId = currentUpload?.id || ((typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
    ? crypto.randomUUID()
    : createUploadId());
  const uploadedAtClient = new Date().toISOString();
  const storagePath = `${state.user.uid}/student-card/link`;

  setState({
    uploadError: "",
    uploadMessage: currentUpload ? "Atualizando o link do ID digital..." : "Salvando o link do ID digital...",
    uploadProgress: 40,
    activeTab: REGISTRATION_TAB_ID,
    studentCardUrlDraft: studentCardUrl,
  });

  try {
    const localUploadSnapshot = {
      id: uploadId,
      ownerUid: state.user.uid,
      originalName: "Carteirinha virtual UFTM",
      normalizedName: "id-digital-link",
      storagePath,
      size: 0,
      contentType: "text/uri-list",
      status: "linked",
      parserStatus: "student_card_link",
      uploadedAtClient,
      updatedAt: uploadedAtClient,
      notes: studentCardUrl,
      academicData: null,
      documentType: DOCUMENT_TYPES.studentCard,
    };

    await cacheUploadForOffline(localUploadSnapshot);

    await upsertUploadRow({
      id: uploadId,
      ownerUid: state.user.uid,
      originalName: "Carteirinha virtual UFTM",
      normalizedName: "id-digital-link",
      storagePath,
      size: 0,
      contentType: "text/uri-list",
      status: "linked",
      parserStatus: "student_card_link",
      uploadedAtClient,
      notes: studentCardUrl,
      academicData: null,
    });

    await reloadRemoteAccountData(state.user.uid);

    setState({
      uploadProgress: 100,
      uploadMessage: "ID digital vinculado com sucesso. O item ID Digital ja abre dentro do app.",
      uploadError: "",
      studentCardUrlDraft: studentCardUrl,
    });
  } catch (error) {
    setState({
      uploadProgress: 0,
      uploadMessage: "",
      uploadError: `Nao consegui salvar o link da carteirinha: ${describeSupabaseError(error)}`,
    });
  }
}

function updateAdminDraftFromEvent(target) {
  const draft = state.adminDraft || createEmptyAdminDraft();
  const nextDraft = { ...draft };
  const targetId = String(target?.id || "");

  if (targetId === "adminDraftCategory") {
    nextDraft.category = normalizeAnnouncementCategory(target.value);
  } else if (targetId === "adminDraftTitle") {
    nextDraft.title = String(target.value || "");
  } else if (targetId === "adminDraftBody") {
    nextDraft.body = String(target.value || "");
  } else if (targetId === "adminDraftStartsAt") {
    nextDraft.startsAt = String(target.value || "");
  } else if (targetId === "adminDraftEndsAt") {
    nextDraft.endsAt = String(target.value || "");
  } else if (targetId === "adminDraftActionLabel") {
    nextDraft.actionLabel = String(target.value || "");
  } else if (targetId === "adminDraftActionUrl") {
    nextDraft.actionUrl = String(target.value || "");
  } else if (targetId === "adminDraftPublished") {
    nextDraft.isPublished = Boolean(target.checked);
  }

  setState({
    adminDraft: nextDraft,
    adminError: "",
    uploadError: "",
  }, { render: false });
}

async function saveAdminAnnouncement() {
  if (!state.isAdmin || !state.user || !services.supabase) {
    return;
  }

  const payload = buildAdminAnnouncementPayload(state.adminDraft);
  if (!payload.ok) {
    setState({
      adminError: payload.message,
      uploadError: "",
      uploadMessage: "",
    });
    return;
  }

  setState({
    adminLoading: true,
    adminError: "",
    uploadError: "",
    uploadMessage: "Salvando aviso no painel administrativo...",
  });

  try {
    const now = new Date().toISOString();
    const { error } = await services.supabase
      .from("admin_announcements")
      .insert({
        category: payload.value.category,
        title: payload.value.title,
        body: payload.value.body,
        starts_at: payload.value.startsAt,
        ends_at: payload.value.endsAt,
        action_label: payload.value.actionLabel,
        action_url: payload.value.actionUrl,
        is_published: payload.value.isPublished,
        created_by: state.user.uid,
        updated_at: now,
      });

    if (error) {
      throw error;
    }

    setState({
      adminDraft: createEmptyAdminDraft(),
      uploadMessage: "Aviso salvo com sucesso.",
      uploadError: "",
      adminError: "",
    });

    await refreshAdminDashboard(true);
  } catch (error) {
    setState({
      adminLoading: false,
      adminError: `Não consegui salvar o aviso: ${describeSupabaseError(error)}`,
      uploadMessage: "",
    });
  }
}

async function toggleAdminAnnouncementPublished(announcementId) {
  if (!state.isAdmin || !services.supabase || !announcementId) {
    return;
  }

  const current = state.announcements.find((item) => item.id === announcementId);
  if (!current) {
    return;
  }

  setState({
    adminLoading: true,
    adminError: "",
    uploadMessage: current.isPublished ? "Despublicando aviso..." : "Publicando aviso...",
    uploadError: "",
  }, { render: false });

  try {
    const { error } = await services.supabase
      .from("admin_announcements")
      .update({
        is_published: !current.isPublished,
        updated_at: new Date().toISOString(),
      })
      .eq("id", announcementId);

    if (error) {
      throw error;
    }

    await refreshAdminDashboard(true);
    setState({
      uploadMessage: !current.isPublished ? "Aviso publicado com sucesso." : "Aviso movido para rascunho.",
      uploadError: "",
      adminError: "",
    });
  } catch (error) {
    setState({
      adminLoading: false,
      adminError: `Não consegui atualizar este aviso: ${describeSupabaseError(error)}`,
      uploadMessage: "",
    });
  }
}

async function deleteAdminAnnouncement(announcementId) {
  if (!state.isAdmin || !services.supabase || !announcementId) {
    return;
  }

  setState({
    adminLoading: true,
    adminError: "",
    uploadMessage: "Removendo aviso do painel...",
    uploadError: "",
  }, { render: false });

  try {
    const { error } = await services.supabase
      .from("admin_announcements")
      .delete()
      .eq("id", announcementId);

    if (error) {
      throw error;
    }

    await refreshAdminDashboard(true);
    setState({
      uploadMessage: "Aviso removido com sucesso.",
      uploadError: "",
      adminError: "",
    });
  } catch (error) {
    setState({
      adminLoading: false,
      adminError: `Não consegui excluir este aviso: ${describeSupabaseError(error)}`,
      uploadMessage: "",
    });
  }
}

function buildAdminAnnouncementPayload(draft) {
  const title = String(draft?.title || "").trim();
  const body = String(draft?.body || "").trim();
  const actionLabel = String(draft?.actionLabel || "").trim();
  const actionUrl = normalizeOptionalHttpUrl(draft?.actionUrl || "");
  const startsAt = normalizeAdminDateTimeValue(draft?.startsAt || "");
  const endsAt = normalizeAdminDateTimeValue(draft?.endsAt || "");

  if (!title) {
    return { ok: false, message: "Preencha um título para o aviso." };
  }

  if (!body) {
    return { ok: false, message: "Escreva a mensagem que os alunos devem ver." };
  }

  if (String(draft?.actionUrl || "").trim() && !actionUrl) {
    return { ok: false, message: "Use um link válido começando com http:// ou https://." };
  }

  if (endsAt && startsAt && new Date(endsAt).getTime() < new Date(startsAt).getTime()) {
    return { ok: false, message: "O fim do aviso não pode ser anterior ao início." };
  }

  return {
    ok: true,
    value: {
      category: normalizeAnnouncementCategory(draft?.category),
      title,
      body,
      startsAt,
      endsAt,
      actionLabel: actionLabel || "",
      actionUrl,
      isPublished: Boolean(draft?.isPublished),
    },
  };
}

function normalizeAdminDateTimeValue(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
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
  let localRecord = null;

  try {
    localRecord = await getUploadRecord(uploadId);
  } catch (error) {
    localRecord = null;
  }

  const resolvedRecord = record || localRecord;
  if (!resolvedRecord) {
    setState({
      uploadError: "Não consegui localizar este documento agora.",
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
  if (inline && resolvedRecord.documentType === DOCUMENT_TYPES.studentCard) {
    void enterStudentCardImmersiveMode();
  }
  setState({
    openingUploadId: uploadId,
    uploadError: "",
    uploadMessage: inline ? "Carregando o documento dentro do app..." : "Abrindo o documento da conta...",
    activeTab: inline ? DOCUMENT_VIEWER_TAB_ID : state.activeTab,
    documentViewer: inline
      ? {
          uploadId,
          title: resolvedRecord.originalName,
          objectUrl: "",
          externalUrl: "",
          documentType: resolvedRecord.documentType,
          sourceTab,
          sourceAgendaTab,
          loading: true,
        }
      : state.documentViewer,
  });

  try {
    if (isStudentCardLinkUpload(resolvedRecord)) {
      const externalUrl = getStudentCardLinkUrl(resolvedRecord);
      if (!externalUrl) {
        throw new Error("nao encontrei o link oficial da carteirinha");
      }

      if (!state.isOnline) {
        throw new Error("o id digital precisa de internet para abrir o link oficial");
      }

      if (!inline) {
        window.open(externalUrl, "_blank", "noopener,noreferrer");
        setState({ openingUploadId: "", uploadMessage: "ID digital aberto em nova aba.", uploadError: "" });
        return;
      }

      const preparedSource = await prepareStudentCardInlineSource(externalUrl);

      setState({
        openingUploadId: "",
        uploadMessage: "ID digital carregado dentro do app.",
        uploadError: "",
        activeTab: DOCUMENT_VIEWER_TAB_ID,
        documentViewer: {
          uploadId,
          title: resolvedRecord.originalName,
          objectUrl: preparedSource.objectUrl,
          externalUrl: preparedSource.externalUrl,
          documentType: resolvedRecord.documentType,
          sourceTab,
          sourceAgendaTab,
          loading: false,
        },
      });
      return;
    }

    if ((!services.supabase || !state.isOnline) && localRecord?.blob) {
      const objectUrl = URL.createObjectURL(localRecord.blob);

      setState({
        openingUploadId: "",
        uploadMessage: `${resolvedRecord.originalName} carregado do armazenamento offline.`,
        uploadError: "",
        activeTab: DOCUMENT_VIEWER_TAB_ID,
        documentViewer: {
          uploadId,
          title: resolvedRecord.originalName,
          objectUrl,
          externalUrl: "",
          documentType: resolvedRecord.documentType,
          sourceTab,
          sourceAgendaTab,
          loading: false,
        },
      });
      return;
    }

    if (!services.supabase || !state.isOnline) {
      throw new Error("este documento ainda nao foi salvo localmente neste aparelho");
    }

    const { data, error } = await services.supabase
      .storage
      .from(getSupabaseBucketName())
      .createSignedUrl(resolvedRecord.storagePath, 300);

    if (error || !data?.signedUrl) {
      throw error || new Error("não consegui criar um link temporário para este PDF");
    }

    if (!inline) {
      window.open(data.signedUrl, "_blank", "noopener");
      setState({ openingUploadId: "", uploadMessage: `${resolvedRecord.originalName} aberto em nova aba.`, uploadError: "" });
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
    await cacheUploadForOffline({
      ...resolvedRecord,
      updatedAt: new Date().toISOString(),
    }, pdfBlob);

    setState({
      openingUploadId: "",
      uploadMessage: resolvedRecord.documentType === DOCUMENT_TYPES.studentCard
        ? "ID digital carregado dentro do app."
        : `${resolvedRecord.originalName} carregado dentro do app.`,
      uploadError: "",
      activeTab: DOCUMENT_VIEWER_TAB_ID,
      documentViewer: {
        uploadId,
        title: resolvedRecord.originalName,
        objectUrl,
        externalUrl: "",
        documentType: resolvedRecord.documentType,
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
      uploadError: `Não consegui abrir o documento: ${describeSupabaseError(error)}`,
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

    void maybeShowMenuNotification(result.menu);
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

  if (toISO(new Date(lastSyncTime)) !== toISO(new Date())) {
    return true;
  }

  return (Date.now() - lastSyncTime) >= MENU_AUTO_REFRESH_MS;
}

function startMenuRefreshHeartbeat() {
  if (menuRefreshHeartbeatId || typeof window === "undefined") {
    return;
  }

  menuRefreshHeartbeatId = window.setInterval(() => {
    refreshRuMenuIfNeeded(true);
  }, MENU_REFRESH_HEARTBEAT_MS);
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
    if (isStudentCardLinkUpload(upload)) return "Link salvo";
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
    adminEmails: Array.isArray(rawConfig?.adminEmails)
      ? rawConfig.adminEmails.map((value) => normalizeEmail(value)).filter(Boolean)
      : [],
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
  void exitStudentCardImmersiveMode();
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

function isCompactViewport() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches;
}

async function enterStudentCardImmersiveMode() {
  if (typeof document === "undefined" || !isCompactViewport()) {
    return;
  }

  const target = document.documentElement;
  try {
    if (!document.fullscreenElement && typeof target.requestFullscreen === "function") {
      await target.requestFullscreen({ navigationUI: "hide" });
    }
  } catch (error) {
    // Alguns navegadores móveis recusam fullscreen; mantemos o fallback visual via CSS.
  }

  try {
    if (screen.orientation && typeof screen.orientation.lock === "function") {
      await screen.orientation.lock("landscape");
    }
  } catch (error) {
    // Se o navegador não aceitar lock de orientação, seguimos sem bloquear o fluxo.
  }
}

async function exitStudentCardImmersiveMode() {
  try {
    if (screen.orientation && typeof screen.orientation.unlock === "function") {
      screen.orientation.unlock();
    }
  } catch (error) {
    // Alguns navegadores não implementam unlock.
  }

  try {
    if (typeof document !== "undefined" && document.fullscreenElement && typeof document.exitFullscreen === "function") {
      await document.exitFullscreen();
    }
  } catch (error) {
    // Ignoramos falhas ao sair do fullscreen.
  }
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

  if ([
    "close-sidebar",
    "toggle-sidebar",
    "logout",
    "reload-app",
    "enable-notifications",
    "admin-refresh",
    "set-admin-category",
    "save-admin-announcement",
    "toggle-admin-announcement",
    "delete-admin-announcement",
  ].includes(action)) {
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
    void syncUserPreferences();
    return permission;
  } catch (error) {
    void syncUserPreferences();
    return "default";
  }
}

async function enableAppNotifications() {
  if (!supportsClassNotifications()) {
    setState({
      uploadError: "Este navegador nao oferece suporte as notificacoes do app.",
      uploadMessage: "",
    });
    return;
  }

  if (Notification.permission === "denied") {
    setState({
      uploadError: "As notificacoes estao bloqueadas neste navegador. Libere a permissao do site nas configuracoes do navegador e recarregue o app.",
      uploadMessage: "",
    });
    void syncUserPreferences();
    return;
  }

  const permission = await requestClassNotificationPermission();

  if (permission === "granted") {
    setState({
      uploadError: "",
      uploadMessage: "",
    });
    void maybeShowMenuNotification(state.menu[0] || null);
    syncClassNotifications();
    return;
  }

  if (permission === "denied") {
    setState({
      uploadError: "As notificacoes foram bloqueadas. Libere a permissao do site para ativar os avisos.",
      uploadMessage: "",
    });
    return;
  }

  setState({
    uploadError: "Nao consegui concluir a permissao de notificacoes agora. Tente novamente.",
    uploadMessage: "",
  });
}

function isTodayMenu(menu) {
  return Boolean(menu?.date) && String(menu.date) === toISO(new Date());
}

function buildMenuReminderKey(menu) {
  return `menu|${String(menu?.date || toISO(new Date()))}`;
}

async function maybeShowMenuNotification(menu) {
  if (!supportsClassNotifications() || Notification.permission !== "granted" || !state.user || !menu || !isTodayMenu(menu)) {
    return;
  }

  const reminderKey = buildMenuReminderKey(menu);
  if (hasReminderBeenShown(reminderKey)) {
    return;
  }

  const bodyParts = [
    `${menu.unit || "RU Abadia"} em ${formatDateShort(menu.date)}.`,
    menu.mainDish ? `Prato principal: ${menu.mainDish}.` : "",
    menu.dessert ? `Sobremesa: ${menu.dessert}.` : "",
  ].filter(Boolean);

  rememberReminderShown(reminderKey, toDate(menu.date));

  try {
    const registration = await registerNotificationServiceWorker();
    if (registration?.showNotification) {
      await registration.showNotification("Veja o cardapio do dia", {
        body: bodyParts.join(" "),
        icon: "./icon.png",
        badge: "./icon.png",
        tag: reminderKey,
        renotify: false,
        data: {
          path: "/",
          section: "menu",
        },
      });
    } else {
      const notification = new Notification("Veja o cardapio do dia", {
        body: bodyParts.join(" "),
        icon: "./icon.png",
        tag: reminderKey,
      });
      window.setTimeout(() => notification.close(), 12000);
    }
  } catch (error) {
    // Se falhar, evitamos interromper o app.
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
      menu: state.menu,
      lastMenuSync: state.lastMenuSync,
      syncMessage: state.syncMessage,
      announcements: state.announcements,
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

async function cacheUploadsForOffline(uploads = []) {
  for (const upload of uploads) {
    try {
      await saveUploadRecord(upload);
    } catch (error) {
      // Mantemos o fluxo online mesmo sem conseguir espelhar no cache local.
    }
  }
}

async function cacheUploadForOffline(upload, blob) {
  try {
    await saveUploadRecord(blob ? { ...upload, blob } : upload);
  } catch (error) {
    // Falhas no cache local não devem impedir o restante do fluxo.
  }
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
