var currentLang = localStorage.getItem('lang') || 'pt';
var currentFilter = 'all';

var FILTERS = [
  { id: 'all', label: { pt: 'Todos', en: 'All' } },
  { id: 'fullstack', label: { pt: 'Full-Stack', en: 'Full-Stack' } },
  { id: 'frontend', label: { pt: 'Front-end', en: 'Front-end' } },
  { id: 'backend', label: { pt: 'Back-end', en: 'Back-end' } },
  { id: 'cloud', label: { pt: 'Cloud', en: 'Cloud' } },
  { id: 'study', label: { pt: 'Estudos', en: 'Studies' } }
];

function readJson(id) {
  var el = document.getElementById(id);
  if (!el) return null;
  try {
    return JSON.parse(el.textContent);
  } catch (e) {
    console.error('Erro ao ler JSON #' + id + ':', e);
    return null;
  }
}

function loc(obj) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[currentLang] || obj.pt || '';
}

function cachePtTexts() {
  document.querySelectorAll('[data-en]').forEach(function(el) {
    el.dataset.pt = el.textContent.trim();
  });

  document.querySelectorAll('[data-en-html]').forEach(function(el) {
    el.dataset.ptHtml = el.innerHTML.trim();
  });

  var titleEl = document.querySelector('title');
  if (titleEl) {
    titleEl.dataset.pt = titleEl.textContent.trim();
  }
}

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-en]').forEach(function(el) {
    el.textContent = lang === 'en' ? el.getAttribute('data-en') : (el.dataset.pt || el.textContent);
  });

  document.querySelectorAll('[data-en-html]').forEach(function(el) {
    el.innerHTML = lang === 'en' ? el.getAttribute('data-en-html') : (el.dataset.ptHtml || el.innerHTML);
  });

  var titleEl = document.querySelector('title');
  if (titleEl && titleEl.getAttribute('data-en')) {
    document.title = lang === 'en' ? titleEl.getAttribute('data-en') : (titleEl.dataset.pt || titleEl.textContent);
  }

  document.querySelectorAll('.lang-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  buildFilters();
  renderProjects();
}

function buildFilters() {
  var container = document.getElementById('projects-filters');
  if (!container) return;

  container.innerHTML = FILTERS.map(function(filter) {
    var active = currentFilter === filter.id ? ' active' : '';
    return '<button type="button" class="projects-filter' + active + '" data-filter="' + filter.id + '" role="tab" aria-selected="' + (active ? 'true' : 'false') + '">' + loc(filter.label) + '</button>';
  }).join('');

  container.querySelectorAll('.projects-filter').forEach(function(btn) {
    btn.addEventListener('click', function() {
      currentFilter = btn.dataset.filter;
      buildFilters();
      renderProjects();
    });
  });
}

function buildProjectCard(project) {
  var title = loc(project.title);
  var desc = loc(project.desc);
  var media = project.img
    ? '<img class="project-card-img" src="' + project.img + '" alt="' + title + '" loading="lazy" />'
    : '<div class="project-card-placeholder" style="background:' + (project.gradient || 'linear-gradient(135deg, #1a1a1a, #2d2d2d)') + '"></div>';

  var tags = (project.tags || []).map(function(tag) {
    return '<span class="project-card-tag">' + tag + '</span>';
  }).join('');

  return '<article class="project-card">' +
    '<a class="project-card-media" href="' + project.url + '" target="_blank" rel="noopener noreferrer">' + media + '</a>' +
    '<h2 class="project-card-title">' + title + '</h2>' +
    '<p class="project-card-desc">' + desc + '</p>' +
    (tags ? '<div class="project-card-tags">' + tags + '</div>' : '') +
  '</article>';
}

function renderProjects() {
  var grid = document.getElementById('projects-grid');
  var empty = document.getElementById('projects-empty');
  var projects = readJson('projects-all-data') || [];
  if (!grid) return;

  var filtered = currentFilter === 'all'
    ? projects
    : projects.filter(function(project) { return project.category === currentFilter; });

  grid.innerHTML = filtered.map(buildProjectCard).join('');

  if (empty) {
    empty.hidden = filtered.length > 0;
  }
}

document.querySelectorAll('.lang-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    applyLanguage(btn.dataset.lang);
  });
});

cachePtTexts();
buildFilters();
renderProjects();

if (currentLang === 'en') {
  applyLanguage('en');
} else {
  document.documentElement.lang = 'pt';
  document.querySelectorAll('.lang-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.lang === 'pt');
  });
}
