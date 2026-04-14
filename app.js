/* ============================================================
   kasumi — app
   ============================================================ */

(function () {
  const { posts, projects, i18n } = window.DATA;
  const state = { lang: 'en', filter: 'all' };

  const app = document.getElementById('app');
  const themeBtn = document.getElementById('themeBtn');

  /* --- i18n --- */
  const t = (k) => i18n[state.lang][k] || k;
  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
  }

  /* --- theme --- */
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeBtn.textContent = theme === 'light' ? '◐' : '◑';
    try { localStorage.setItem('yami-theme', theme); } catch {}
  }
  function initTheme() {
    let saved = 'light';
    try { saved = localStorage.getItem('yami-theme') || 'light'; } catch {}
    setTheme(saved);
  }
  themeBtn.addEventListener('click', () => {
    const curr = document.documentElement.getAttribute('data-theme');
    setTheme(curr === 'light' ? 'dark' : 'light');
  });

  /* --- helpers --- */
  function formatDate(s) {
    const d = new Date(s);
    return d.toLocaleDateString(state.lang === 'ja' ? 'ja-JP' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }
  function readMinutes(html) {
    const words = html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
    return Math.max(1, Math.round(words / 220));
  }

  /* --- views --- */
  function postItem(p) {
    return `
      <li>
        <a href="#/post/${p.slug}" class="title">${p.title}</a>
        <div class="meta">
          <span>${formatDate(p.date)}</span>
          <span class="sep">·</span>
          <span>${t('filter_' + p.category)}</span>
          <span class="sep">·</span>
          <span>${readMinutes(p.content)} min read</span>
        </div>
        <div class="desc">${p.excerpt}</div>
      </li>
    `;
  }

  function renderHome() {
    app.innerHTML = `
      <div class="intro">
        <h1>${t('intro_title')}</h1>
        <p>${t('intro_p1')}</p>
        <p>${t('intro_p2')}</p>
      </div>

      <div class="section">
        <h2>${t('section_writing')}</h2>

        <div class="filter">
          <span>${t('filter_lab')}</span>
          ${['all', 'web', 'crypto', 'pwn', 'reverse'].map(cat => `
            <button class="${state.filter === cat ? 'on' : ''}" data-cat="${cat}">${t('filter_' + cat)}</button>
          `).join('')}
        </div>

        ${renderPostList()}
      </div>
    `;
    attachFilterHandlers();
  }

  function renderPostList() {
    const filtered = state.filter === 'all'
      ? posts
      : posts.filter(p => p.category === state.filter);
    if (filtered.length === 0) return `<div class="empty">${t('no_posts')}</div>`;
    return `<ul class="posts">${filtered.map(postItem).join('')}</ul>`;
  }

  function attachFilterHandlers() {
    document.querySelectorAll('.filter button').forEach(btn => {
      btn.addEventListener('click', () => {
        state.filter = btn.dataset.cat;
        const filterEl = document.querySelector('.filter');
        if (filterEl) {
          filterEl.querySelectorAll('button').forEach(b => {
            b.classList.toggle('on', b.dataset.cat === state.filter);
          });
          const listEl = document.querySelector('.posts') || document.querySelector('.empty');
          if (listEl) {
            const temp = document.createElement('div');
            temp.innerHTML = renderPostList();
            listEl.replaceWith(temp.firstElementChild);
          }
        }
      });
    });
  }

  function renderPost(slug) {
    const post = posts.find(p => p.slug === slug);
    if (!post) {
      app.innerHTML = `<div class="empty">Not found.</div>`;
      return;
    }
    app.innerHTML = `
      <article class="article">
        <a href="#/" class="back">${t('back')}</a>
        <h1>${post.title}</h1>
        <div class="byline">
          <span>${formatDate(post.date)}</span>
          <span class="sep">·</span>
          <span>${t('filter_' + post.category)}</span>
          <span class="sep">·</span>
          <span>${readMinutes(post.content)} min read</span>
          ${post.ctf ? `<span class="sep">·</span><span>${post.ctf}</span>` : ''}
        </div>
        <div class="content">${post.content}</div>
      </article>
    `;
    window.scrollTo(0, 0);
  }

  function renderProjects() {
    app.innerHTML = `
      <div class="section" style="border-top:none;padding-top:16px">
        <h2>${t('section_projects')}</h2>
        <ul class="projects">
          ${projects.map(p => `
            <li>
              <a href="#/project/${p.slug}" class="title">${p.name}</a>
              <div class="meta">
                <span>${t('status_' + p.status)}</span>
                <span class="sep">·</span>
                <span>${p.year}</span>
                <span class="sep">·</span>
                <span>${p.stack}</span>
              </div>
              <div class="desc">${p.desc}</div>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  function renderProject(slug) {
    const p = projects.find(x => x.slug === slug);
    if (!p) {
      app.innerHTML = `<div class="empty">Not found.</div>`;
      return;
    }
    app.innerHTML = `
      <article class="article">
        <a href="#/projects" class="back">${t('back_projects')}</a>
        <h1>${p.name}</h1>
        <div class="byline">
          <span>${t('status_' + p.status)}</span>
          <span class="sep">·</span>
          <span>${p.year}</span>
          <span class="sep">·</span>
          <span>${p.stack}</span>
          <span class="sep">·</span>
          <span>${p.license}</span>
        </div>
        <div class="content">
          ${p.content}
          <p style="margin-top:32px">
            <a href="${p.link}" target="_blank" rel="noopener">${t('project_source')}</a>
          </p>
        </div>
      </article>
    `;
    window.scrollTo(0, 0);
  }

  function renderAbout() {
    app.innerHTML = `
      <div class="about">
        <h1>${t('about_title')}</h1>
        <p>${t('about_p1')}</p>
        <p>${t('about_p2')}</p>
        <p>${t('about_p3')}</p>

        <div class="contact">
          <div><span class="k">${t('c_location')}</span> ${t('c_location_v')}</div>
          <div><span class="k">${t('c_focus')}</span> ${t('c_focus_v')}</div>
          <div><span class="k">${t('c_email')}</span> <a href="mailto:kasumi@yami-net.io">kasumi@yami-net.io</a></div>
          <div><span class="k">${t('c_github')}</span> <a href="https://github.com/yami-net">github.com/yami-net</a></div>
          <div><span class="k">${t('c_pgp')}</span> 0x4D3C 8A91 7E2F B8C5</div>
        </div>
      </div>
    `;
  }

  /* --- router --- */
  const routes = [
    { match: p => p === '/' || p === '',     render: renderHome,     nav: 'home' },
    { match: p => p.startsWith('/post/'),    render: p => renderPost(p.slice(6)), nav: 'home' },
    { match: p => p === '/projects',         render: renderProjects, nav: 'projects' },
    { match: p => p.startsWith('/project/'), render: p => renderProject(p.slice(9)), nav: 'projects' },
    { match: p => p === '/about',            render: renderAbout,    nav: 'about' },
  ];

  function router() {
    const path = (location.hash || '#/').slice(1);
    const route = routes.find(r => r.match(path)) || routes[0];
    route.render(path);
    document.querySelectorAll('header nav a').forEach(a => {
      a.classList.toggle('active', a.dataset.route === route.nav);
    });
    applyI18n();
  }
  window.addEventListener('hashchange', router);

  /* --- lang --- */
  document.querySelectorAll('.utilities [data-lang]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.lang = btn.dataset.lang;
      document.documentElement.lang = state.lang;
      document.querySelectorAll('.utilities [data-lang]').forEach(b => {
        b.classList.toggle('on', b.dataset.lang === state.lang);
      });
      router();
    });
  });
  document.querySelector(`.utilities [data-lang="${state.lang}"]`).classList.add('on');

  /* --- init --- */
  initTheme();
  router();
})();
