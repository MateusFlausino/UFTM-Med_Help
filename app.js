(function () {
  const STORAGE_KEY = "uftm-mobile-web-v1";
  const navItems = [
    { id: "today", label: "Hoje" },
    { id: "week", label: "Grade" },
    { id: "menu", label: "RU" },
    { id: "sca", label: "SCA" },
  ];

  const weekdays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const weekdayMap = { segunda: 1, terça: 2, terca: 2, quarta: 3, quinta: 4, sexta: 5 };

  function createEntry(day, range, group, title, time, teacher, location, type) {
    const [startDate, endDate] = splitRange(range);
    const [startTime, endTime] = time.split(" - ");
    return {
      id: [day, group, title, startDate, startTime].join("-"),
      day,
      weekday: weekdayMap[normalize(day)],
      startDate,
      endDate,
      group,
      title,
      startTime,
      endTime,
      teacher,
      location,
      type,
    };
  }

  const profile = {
    sourceTitle: "Relação de Disciplinas por Acadêmico",
    course: "0101/13 - MEDICINA (Bacharelado)",
    period: "2026 - 1",
    studentId: "2026.1085.7",
    studentName: "Ana Elísa Azevedo de Carvalho",
    parserMode: "base demo pronta para integração",
    pages: 4,
  };

  const disciplines = [
    ["1501.000.015-0", "ANATOMIA HUMANA I", "120.0", "LUCIANO GONCALVES", "luciano.goncalves@uftm.edu.br"],
    ["1008.000.133-2", "ANTROPOLOGIA", "30.0", "LUCIANA CRISTINA CAETANO DE MORAIS SILVA", "lucianacristina.silva@uftm.edu.br"],
    ["1501.000.084-2", "BASES CELULARES E MORFOFISIOLÓGICAS I", "150.0", "MARIA DAS GRAÇAS REIS", "mg.reis@uftm.edu.br"],
    ["1003.000.137-1", "INTRODUÇÃO À ÉTICA MÉDICA E CONTEÚDOS HUMANÍSTICOS", "30.0", "DOUGLAS REIS ABDALLA", "douglas.abdalla@uftm.edu.br"],
    ["1002.000.102-6", "MEDICINA E ESPIRITUALIDADE", "30.0", "RICARDO PASTORE", "ricardo.pastore@uftm.edu.br"],
    ["1008.000.136-7", "METODOLOGIA CIENTÍFICA", "45.0", "MARIO ALFREDO SILVEIRA MIRANZI", "mario.miranzi@uftm.edu.br"],
    ["1008.000.132-4", "PSICOLOGIA", "30.0", "LUCIANA MARIA DA SILVA", "luciana.maria.silva@uftm.edu.br"],
    ["1008.000.135-9", "VIVÊNCIAS I", "30.0", "DANIELA BARSOTTI SANTOS", "daniela.barsotti@uftm.edu.br"],
  ].map(([code, name, workload, teacher, email]) => ({
    code,
    name,
    workload,
    teacher,
    email,
    period: "09/03/2026 - 18/07/2026",
  }));

  const schedule = [
    createEntry("Segunda", "16/03/2026 - 13/04/2026", "T01", "ANATOMIA HUMANA I", "08:00 - 09:40", "LUCIANO GONCALVES", "Anfiteatro Anatômico", "Teórica"),
    createEntry("Segunda", "16/03/2026 - 01/06/2026", "T01", "METODOLOGIA CIENTÍFICA", "10:00 - 11:40", "MARIO ALFREDO SILVEIRA MIRANZI", "Bloco Didático 3", "Teórica"),
    createEntry("Segunda", "16/03/2026 - 30/03/2026", "P02", "BASES CELULARES E MORFOFISIOLÓGICAS I", "16:00 - 18:30", "JAVIER EMILIO LAZO CHICA", "Laboratório Integrado", "Prática"),
    createEntry("Terça", "17/03/2026 - 14/04/2026", "P01", "ANATOMIA HUMANA I", "07:10 - 09:40", "LUCIANO GONCALVES", "Laboratório Anatômico", "Prática"),
    createEntry("Terça", "17/03/2026 - 14/04/2026", "T02", "BASES CELULARES E MORFOFISIOLÓGICAS I", "16:00 - 18:30", "ANGELICA DE OLIVEIRA GOMES", "Sala Morfofuncional", "Teórica"),
    createEntry("Quarta", "18/03/2026 - 27/05/2026", "T01", "METODOLOGIA CIENTÍFICA", "10:00 - 11:40", "MARIO ALFREDO SILVEIRA MIRANZI", "Bloco Didático 3", "Teórica"),
    createEntry("Quarta", "18/03/2026 - 29/04/2026", "T01", "PSICOLOGIA", "14:00 - 15:40", "LUCIANA MARIA DA SILVA", "Sala 12", "Teórica"),
    createEntry("Quarta", "11/03/2026 - 20/05/2026", "T01", "ANTROPOLOGIA", "16:00 - 18:30", "LUCIANA CRISTINA CAETANO DE MORAIS SILVA", "Sala 12", "Teórica"),
    createEntry("Quinta", "12/03/2026 - 30/04/2026", "T01", "VIVÊNCIAS I", "08:00 - 09:40", "CLAUDIA DE AZEVEDO AGUIAR", "Unidade Básica Parceira", "Vivência"),
    createEntry("Quinta", "07/05/2026 - 25/06/2026", "P05", "VIVÊNCIAS I", "08:00 - 09:40", "DANIELA BARSOTTI SANTOS", "Território de prática", "Vivência"),
    createEntry("Sexta", "09/03/2026 - 15/05/2026", "T01", "INTRODUÇÃO À ÉTICA MÉDICA E CONTEÚDOS HUMANÍSTICOS", "07:10 - 08:50", "DOUGLAS REIS ABDALLA", "Sala de seminários", "Teórica"),
    createEntry("Sexta", "13/03/2026 - 18/07/2026", "T01", "MEDICINA E ESPIRITUALIDADE", "16:00 - 17:40", "RICARDO PASTORE", "Auditório Clínico", "Teórica"),
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
      sides: "Arroz Branco e Feijão Carioca",
      salads: "Acelga com Tomate; Feijão Branco e Preto",
      dessert: "Banana",
      drink: "Goiaba",
    },
  ];

  const app = document.getElementById("app");
  let state = loadState();

  setTimeout(function initApp() {
    render();
    refreshRuMenu(true);
  }, 220);
  app.addEventListener("click", onClick);
  app.addEventListener("change", onChange);

  function loadState() {
    let stored = {};
    try {
      stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (error) {
      stored = {};
    }
    return {
      loggedIn: Boolean(stored.loggedIn),
      activeTab: stored.activeTab || "today",
      uid: stored.uid || createUid(),
      referenceDate: stored.referenceDate || "2026-03-16",
      importedPdfName: stored.importedPdfName || "",
      importedPdfAt: stored.importedPdfAt || "",
      syncMessage: stored.syncMessage || "Cardápio oficial da Unidade Abadia carregado.",
      lastMenuSync: stored.lastMenuSync || "2026-03-16T08:42:00-03:00",
      menu: Array.isArray(stored.menu) && stored.menu.length ? stored.menu : defaultMenu,
    };
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function setState(patch) {
    state = { ...state, ...patch };
    persist();
    render();
  }

  function render() {
    if (!state.loggedIn) {
      app.innerHTML = renderLogin();
      return;
    }

    const todayClasses = getClassesForDate(state.referenceDate);
    const weekView = buildWeekView(state.referenceDate);
    const nextClass = findNextClass(state.referenceDate);
    const activeContent = renderTab(todayClasses, weekView, nextClass);

    app.innerHTML = `
      <div class="app-view">
        <header class="header-bar">
          <div class="header-brand">
            <span class="brand-mark">UFTM</span>
            <div class="header-copy">
              <h1>UFTM Mobile Web</h1>
              <p>${escape(profile.course)} • período ${escape(profile.period)}</p>
            </div>
          </div>
          <div class="status-inline">
            <span class="status-dot" aria-hidden="true"></span>
            <span>${escape(state.syncMessage)}</span>
          </div>
          <div class="button-row">
            <button class="ghost" data-action="sync-ru">Verificar RU</button>
            <button class="ghost" data-action="logout">Sair</button>
          </div>
        </header>

        <section class="hero-card">
          <div class="hero-content">
            <div class="hero-topline">Pronto para deploy e empacotamento</div>
            <div class="hero-band">
              <span class="hero-chip">UID ${escape(state.uid)}</span>
              <span class="hero-chip">${escape(profile.studentId)}</span>
              <span class="hero-chip">${escape(formatLongDate(state.referenceDate))}</span>
            </div>
            <h2 class="hero-title">${buildHeroTitle(todayClasses, nextClass)}</h2>
            <p class="hero-subtitle">
              SPA estática com persistência local, layout responsivo e estrutura compatível com deploy em Vercel e wrappers móveis como Capacitor.
            </p>
            <div class="hero-actions">
              <div class="inline-field">
                <label for="referenceDate">Data de referência</label>
                <input id="referenceDate" type="date" value="${escape(state.referenceDate)}" />
              </div>
              <div class="button-row">
                <button class="secondary" data-action="demo-week">Semana modelo</button>
                <button class="ghost" data-action="focus-now">Hoje real</button>
              </div>
            </div>
            <div class="metrics-grid">
              ${metric("Disciplinas", String(disciplines.length), "matérias carregadas")}
              ${metric("Aulas na semana", String(weekView.reduce((acc, day) => acc + day.classes.length, 0)), "blocos ativos")}
              ${metric("Hoje", String(todayClasses.length), "blocos na data")}
              ${metric("Deploy", "Static", "Vercel e webview prontos")}
            </div>
          </div>
        </section>

        <nav class="tab-row" aria-label="Navegação principal">
          ${navItems.map((item) => `
            <button class="tab-button ${state.activeTab === item.id ? "is-active" : ""}" data-action="set-tab" data-tab="${item.id}">
              ${item.label}
            </button>
          `).join("")}
        </nav>

        ${activeContent}

        <nav class="bottom-nav" aria-label="Navegação móvel">
          ${navItems.map((item) => `
            <button class="bottom-button ${state.activeTab === item.id ? "is-active" : ""}" data-action="set-tab" data-tab="${item.id}">
              ${item.label}
            </button>
          `).join("")}
        </nav>
      </div>
    `;
  }

  function renderLogin() {
    return `
      <div class="login-layout">
        <section class="login-card">
          <span class="eyebrow">Base pronta para produto</span>
          <h1>Versão web do app pronta para abrir e publicar.</h1>
          <p>
            Esta base já funciona como SPA estática e foi pensada para continuar em Vercel, PWA
            ou empacotadores móveis sem depender de um framework pesado agora.
          </p>
          <div class="login-actions">
            <button class="cta" data-action="login">Entrar no app</button>
            <button class="ghost" data-action="demo-week">Abrir semana modelo</button>
          </div>
          <div class="facts-grid" style="margin-top: 1.25rem;">
            <div class="fact"><strong>${disciplines.length}</strong><p>disciplinas organizadas</p></div>
            <div class="fact"><strong>Vercel</strong><p>deploy estático direto</p></div>
            <div class="fact"><strong>Mobile</strong><p>pronto para webview/Capacitor</p></div>
          </div>
        </section>

        <aside class="preview-card">
          <span class="eyebrow">Estrutura</span>
          <h2 class="preview-title">Uma base enxuta e fácil de evoluir.</h2>
          <p class="preview-copy">
            O projeto entra rápido no ar, aceita integração com backend depois e já respeita a identidade UFTM.
          </p>
          <div class="pill-grid">
            <div class="preview-pill"><strong>Hoje</strong><span>timeline com foco no dia</span></div>
            <div class="preview-pill"><strong>Grade</strong><span>semana visual de segunda a sexta</span></div>
            <div class="preview-pill"><strong>SCA</strong><span>slot preparado para parser do PDF</span></div>
          </div>
          <div class="mini-stack">
            <div class="mini-card"><small>Deploy</small><strong>Static-first</strong><span>funciona em hostings simples</span></div>
            <div class="mini-card"><small>Empacotar</small><strong>Webview-ready</strong><span>manifest e config podem crescer sem retrabalho</span></div>
          </div>
        </aside>
      </div>
    `;
  }

  function renderTab(todayClasses, weekView, nextClass) {
    if (state.activeTab === "week") {
      return `
        <section class="paper-card">
          <div class="section-topline">Grade semanal</div>
          <h2 class="section-title">${escape(weekTitle(state.referenceDate))}</h2>
          <p class="section-copy">Visão contínua da semana acadêmica com destaque para o dia selecionado.</p>
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
            <h2 class="section-title">Cardápio do dia da Unidade Abadia.</h2>
            <p class="section-copy">
              Fonte oficial semanal da UFTM, filtrada para o dia atual. O app pode verificar diariamente se saiu um PDF novo, mesmo quando o conteúdo continua semanal.
            </p>
            <div class="menu-grid" style="margin-top: 1rem;">
              ${state.menu.map(renderMenuCard).join("")}
            </div>
          </article>
          <aside class="timeline-card">
            <div class="timeline-topline">Atualização diária</div>
            <h2 class="section-title">Checagem diária, troca só quando a UFTM publicar novo arquivo.</h2>
            <div class="mini-stack" style="margin-top: 1rem;">
              <div class="mini-card"><small>Última publicação oficial</small><strong>${escape(formatShortDateTime(state.menu[0].updatedAt))}</strong><span>arquivo da Abadia</span></div>
              <div class="mini-card"><small>Última verificação</small><strong>${escape(formatShortDateTime(state.lastMenuSync))}</strong><span>persistida localmente</span></div>
              <div class="mini-card"><small>Rotina sugerida</small><strong>1x por dia</strong><span>mantém o cardápio atual sem esperar a semana virar</span></div>
            </div>
          </aside>
        </section>
      `;
    }

    if (state.activeTab === "sca") {
      return `
        <section class="upload-grid">
          <article class="upload-card">
            <div class="section-topline">Integração SCA</div>
            <h2 class="section-title">Ponto de entrada do PDF já preparado.</h2>
            <p class="section-copy">
              O upload já persiste o nome do arquivo e deixa claro onde o parser real deve entrar, sem travar o restante do app.
            </p>
            <div class="upload-drop" style="margin-top: 1rem;">
              <input id="pdfInput" type="file" accept="application/pdf" />
              <div class="button-row">
                <label class="file-trigger" for="pdfInput">Selecionar PDF</label>
                <button class="ghost" data-action="clear-pdf">Limpar</button>
              </div>
              <ul>
                <li>Modelo esperado: “Relação de Disciplinas por Acadêmico”.</li>
                <li>Estrutura pensada para ligar parser real depois.</li>
                <li>Compatível com deploy estático, sem backend obrigatório agora.</li>
              </ul>
            </div>
            <div class="toast" style="margin-top: 1rem;">
              ${state.importedPdfName
                ? `Último arquivo salvo: ${escape(state.importedPdfName)} • ${escape(formatShortDateTime(state.importedPdfAt))}`
                : "Nenhum PDF selecionado ainda."}
            </div>
          </article>
          <aside class="paper-card">
            <div class="section-topline">Empacotamento</div>
            <h2 class="section-title">Pronto para Vercel, PWA e webview.</h2>
            <div class="mini-stack" style="margin-top: 1rem;">
              <div class="mini-card"><small>Deploy web</small><strong>Static hosting</strong><span>arquivos diretos na raiz</span></div>
              <div class="mini-card"><small>Mobile</small><strong>Capacitor-ready</strong><span>configuração-base separada</span></div>
            </div>
          </aside>
        </section>
        <section class="paper-card" style="margin-top: 1rem;">
          <div class="section-topline">Disciplinas</div>
          <h2 class="section-title">Dados consolidados do período.</h2>
          <div class="discipline-grid" style="margin-top: 1rem;">
            ${disciplines.map(renderDiscipline).join("")}
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
              ? `Você tem ${todayClasses.length} bloco${todayClasses.length > 1 ? "s" : ""} ativo${todayClasses.length > 1 ? "s" : ""} nesta data.`
              : "Sem aulas nesta data. Você pode trocar a referência ou usar a semana modelo."}
          </p>
          <div class="toast ${nextClass ? "" : "is-warning"}">
            ${nextClass
              ? `Próxima referência: ${escape(nextClass.title)} em ${escape(nextClass.day)} às ${escape(nextClass.startTime)}.`
              : "Nenhuma aula futura encontrada no recorte atual."}
          </div>
          <div class="timeline-list" style="margin-top: 1rem;">
            ${todayClasses.length ? todayClasses.map(renderSchedule).join("") : `<div class="empty-state">Nenhum bloco encontrado para esta data.</div>`}
          </div>
        </article>
        <aside class="paper-card">
          <div class="section-topline">Resumo</div>
          <h2 class="section-title">Base pronta para evoluir sem recomeçar.</h2>
          <div class="mini-grid" style="margin-top: 1rem;">
            <div class="mini-card"><small>Aluno</small><strong>${escape(profile.studentName.split(" ")[0])}</strong><span>${escape(profile.studentId)}</span></div>
            <div class="mini-card"><small>Parser</small><strong>${escape(profile.parserMode)}</strong><span>slot SCA preparado</span></div>
            <div class="mini-card"><small>Páginas</small><strong>${String(profile.pages)}</strong><span>modelo oficial analisado</span></div>
            <div class="mini-card"><small>Deploy</small><strong>Vercel</strong><span>publicação estática direta</span></div>
          </div>
        </aside>
      </section>
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
          ${day.classes.length ? day.classes.map(renderSchedule).join("") : `<div class="empty-day">Sem blocos nesta data.</div>`}
        </div>
      </article>
    `;
  }

  function renderSchedule(item) {
    return `
      <article class="schedule-item" data-type="${escape(item.type)}">
        <div class="schedule-title-row">
          <div>
            <h3 class="schedule-title">${escape(item.title)}</h3>
            <div class="support-line">${escape(item.group)} • ${escape(item.type)}</div>
          </div>
          <div class="schedule-time">${escape(item.startTime)} - ${escape(item.endTime)}</div>
        </div>
        <div class="item-meta">
          <span class="tag">${escape(item.teacher)}</span>
          <span class="tag">${escape(item.location)}</span>
        </div>
        <div class="support-line">${escape(shortRange(item.startDate, item.endDate))}</div>
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

  function renderDiscipline(item) {
    return `
      <article class="discipline-item">
        <div class="discipline-head">
          <div>
            <div class="discipline-code">${escape(item.code)}</div>
            <h3 class="discipline-title">${escape(item.name)}</h3>
          </div>
          <span class="tag">${escape(item.workload)} h/a</span>
        </div>
        <dl>
          <div><dt>Docente</dt><dd>${escape(item.teacher)}</dd></div>
          <div><dt>E-mail</dt><dd>${escape(item.email)}</dd></div>
          <div><dt>Vigência</dt><dd>${escape(item.period)}</dd></div>
        </dl>
      </article>
    `;
  }

  function metric(label, value, caption) {
    return `<div class="metric-card"><small>${escape(label)}</small><strong>${escape(value)}</strong><span>${escape(caption)}</span></div>`;
  }

  function onClick(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;

    if (action === "login") return setState({ loggedIn: true, syncMessage: "Espaço local aberto com sucesso." });
    if (action === "logout") return setState({ loggedIn: false, activeTab: "today", syncMessage: "Sessão local encerrada." });
    if (action === "set-tab") return setState({ activeTab: button.dataset.tab || "today" });
    if (action === "demo-week") return setState({ loggedIn: true, referenceDate: "2026-03-16", syncMessage: "Semana modelo carregada." });
    if (action === "focus-now") return setState({ referenceDate: toISO(new Date()), syncMessage: "Data ajustada para hoje." });
    if (action === "sync-ru") {
      refreshRuMenu(false);
      return;
    }
    if (action === "clear-pdf") return setState({ importedPdfName: "", importedPdfAt: "", syncMessage: "Seleção de PDF removida." });
  }

  function onChange(event) {
    if (event.target.id === "referenceDate") {
      return setState({ referenceDate: event.target.value, syncMessage: "Data de referência atualizada." });
    }
    if (event.target.id === "pdfInput" && event.target.files && event.target.files[0]) {
      return setState({
        importedPdfName: event.target.files[0].name,
        importedPdfAt: new Date().toISOString(),
        syncMessage: "Arquivo salvo no slot de integração do SCA.",
      });
    }
  }

  async function refreshRuMenu(silent) {
    if (!silent) {
      setState({ syncMessage: "Consultando a fonte oficial da Abadia..." });
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
        syncMessage: `Cardápio da Abadia atualizado para ${result.menu.day}, ${formatDateShort(result.menu.date)}.`,
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

  function getClassesForDate(isoDate) {
    const day = toDate(isoDate);
    return schedule
      .filter((item) => item.weekday === day.getDay() && day >= toDate(item.startDate) && day <= toDate(item.endDate))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  function buildWeekView(referenceDate) {
    const monday = weekStart(toDate(referenceDate));
    return Array.from({ length: 5 }, (_, index) => {
      const date = addDays(monday, index);
      const iso = toISO(date);
      return {
        date: iso,
        label: weekdays[date.getDay()],
        isReference: iso === referenceDate,
        classes: getClassesForDate(iso),
      };
    });
  }

  function findNextClass(referenceDate) {
    const start = toDate(referenceDate);
    for (let i = 0; i < 14; i += 1) {
      const date = addDays(start, i);
      const classes = getClassesForDate(toISO(date));
      if (classes.length) return classes[0];
    }
    return null;
  }

  function buildHeroTitle(todayClasses, nextClass) {
    if (todayClasses.length) {
      return `Hoje o foco é ${todayClasses[0].title.toLowerCase()}, com ${todayClasses.length} bloco${todayClasses.length > 1 ? "s" : ""} em acompanhamento.`;
    }
    if (nextClass) {
      return `Seu próximo ponto acadêmico está em ${nextClass.day.toLowerCase()}, com ${nextClass.title.toLowerCase()}.`;
    }
    return "Sua base está pronta para integração, publicação e empacotamento.";
  }

  function splitRange(range) {
    const [start, end] = range.split(" - ");
    return [brToIso(start), brToIso(end)];
  }

  function brToIso(brDate) {
    const [day, month, year] = brDate.split("/");
    return `${year}-${month}-${day}`;
  }

  function toDate(isoDate) {
    const [year, month, day] = isoDate.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function toISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function addDays(date, amount) {
    const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    next.setDate(next.getDate() + amount);
    return next;
  }

  function weekStart(date) {
    const weekday = date.getDay();
    const offset = weekday === 0 ? -6 : 1 - weekday;
    return addDays(date, offset);
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
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDateShort(isoDate) {
    return toDate(isoDate).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function createUid() {
    return `uftm-${Math.random().toString(36).slice(2, 10)}`;
  }

  function escape(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
