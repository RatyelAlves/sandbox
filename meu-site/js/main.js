var currentLang = localStorage.getItem('lang') || 'pt';
var currentProject = 0;

var servicesData = [];
var projectsData = [];
var testimonialsData = [];
var brandsData = [];

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

function loc(obj) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[currentLang] || obj.pt || '';
}

function testimonialMeta(key) {
  var section = document.querySelector('.testimonials');
  if (!section) return '';
  var attr = section.getAttribute('data-' + key + '-' + currentLang);
  if (attr) return attr;
  return section.getAttribute('data-' + key + '-pt') || '';
}

function refreshStatsBanner() {
  var statsBannerTrack = document.getElementById('stats-banner-track');
  if (!statsBannerTrack) return;

  var brands = brandsData.length
    ? brandsData
    : ['GitHub', 'React', 'Node.js', 'Python', 'AWS', 'JavaScript'];

  var bannerItems = brands.map(function(brand) {
    return '<span class="stats-banner-item">' + brand + ' <span class="stats-banner-star">✦</span></span>';
  }).join('');

  statsBannerTrack.innerHTML = bannerItems + bannerItems;
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

  var activeService = document.querySelector('.service-item.active');
  if (activeService) selectService(parseInt(activeService.dataset.index, 10));
  showProject(currentProject);
  refreshTestimonials();
  refreshStatsBanner();
}

document.querySelectorAll('.lang-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    applyLanguage(btn.dataset.lang);
  });
});

var serviceItems = document.querySelectorAll('.service-item');
var serviceImg = document.getElementById('service-img');
var serviceAbout = document.getElementById('service-about');
var techTrack = document.getElementById('tech-track');

function buildTechCarousel(technologies) {
  var chips = technologies.map(function(tech) {
    return '<span class="tech-chip">' + tech + '</span>';
  }).join('');

  techTrack.innerHTML = chips + chips;
  techTrack.style.animation = 'none';
  techTrack.offsetHeight;
  techTrack.style.animation = '';
}

function selectService(index) {
  var data = servicesData[index];
  if (!data) return;

  serviceItems.forEach(function(item) {
    item.classList.toggle('active', parseInt(item.dataset.index, 10) === index);
  });

  serviceImg.src = data.img;
  serviceAbout.textContent = loc(data.about);
  buildTechCarousel(data.technologies);
}

serviceItems.forEach(function(item) {
  item.addEventListener('click', function() {
    selectService(parseInt(this.dataset.index, 10));
  });

  if (window.matchMedia('(hover: hover)').matches) {
    item.addEventListener('mouseenter', function() {
      selectService(parseInt(this.dataset.index, 10));
    });
  }
});

var workImg = document.getElementById('work-img');
var workTitle = document.getElementById('work-title');
var workDesc = document.getElementById('work-desc');
var workDiamonds = document.getElementById('work-diamonds');
var workCta = document.getElementById('work-cta');

function buildDiamonds() {
  if (!workDiamonds) return;

  workDiamonds.innerHTML = projectsData.map(function(_, i) {
    return '<button class="work-diamond' + (i === currentProject ? ' active' : '') + '" data-index="' + i + '" aria-label="Project ' + (i + 1) + '"></button>';
  }).join('');

  workDiamonds.querySelectorAll('.work-diamond').forEach(function(btn) {
    btn.addEventListener('click', function() {
      showProject(parseInt(this.dataset.index, 10));
    });
  });
}

function showProject(index) {
  index = Number(index);
  if (!Number.isFinite(index) || index < 0) return;

  currentProject = index;
  var project = projectsData[index];
  if (!project || !workImg) return;

  workImg.src = project.img;
  workTitle.textContent = loc(project.title);
  workDesc.textContent = loc(project.desc || project.cardDesc);
  if (workCta && project.url) workCta.href = project.url;
  if (workDiamonds) {
    workDiamonds.querySelectorAll('.work-diamond').forEach(function(btn, i) {
      btn.classList.toggle('active', i === index);
    });
  }
}

function stepProject(delta) {
  if (!projectsData.length) return;
  var total = projectsData.length;
  var current = Number(currentProject);
  if (!Number.isFinite(current)) current = 0;
  var nextIndex = (current + delta + total) % total;
  showProject(nextIndex);
}

function bindWorkNav() {
  var prev = document.getElementById('work-prev');
  var next = document.getElementById('work-next');

  if (prev) {
    prev.onclick = function(e) {
      e.preventDefault();
      stepProject(-1);
    };
  }

  if (next) {
    next.onclick = function(e) {
      e.preventDefault();
      stepProject(1);
    };
  }
}

function buildTestimonialCard(item) {
  var role = loc(item.role) || testimonialMeta('role');
  var quote = loc(item.quote) || testimonialMeta('quote');
  return '<article class="testimonial-card">' +
    '<div class="testimonial-top">' +
      '<div class="testimonial-user">' +
        '<img class="testimonial-avatar" src="' + item.avatar + '" alt="' + item.name + '" />' +
        '<div>' +
          '<p class="testimonial-name">' + item.name + '</p>' +
          '<p class="testimonial-role">' + role + '</p>' +
        '</div>' +
      '</div>' +
      '<span class="testimonial-brand ' + (item.brandClass || '') + '">' + (item.brand || '') + '</span>' +
    '</div>' +
    '<p class="testimonial-quote">' + quote + '</p>' +
  '</article>';
}

function fillTestimonialTrack(trackId, items) {
  var track = document.getElementById(trackId);
  var cards = items.map(buildTestimonialCard).join('');
  track.innerHTML = cards + cards;
}

function refreshTestimonials() {
  fillTestimonialTrack('testimonials-track-1', testimonialsData);
  fillTestimonialTrack('testimonials-track-2', testimonialsData.slice().reverse());
}

cachePtTexts();
servicesData = readJson('services-data') || [];
projectsData = readJson('projects-data') || [];
testimonialsData = readJson('testimonials-data') || [];
brandsData = readJson('brands-data') || [];

bindWorkNav();
buildDiamonds();

if (currentLang === 'en') {
  applyLanguage('en');
} else {
  document.documentElement.lang = 'pt';
  document.querySelectorAll('.lang-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.lang === 'pt');
  });
  var activeService = document.querySelector('.service-item.active');
  if (activeService) selectService(parseInt(activeService.dataset.index, 10));
  showProject(0);
  refreshTestimonials();
  refreshStatsBanner();
}

document.getElementById('back-to-top').addEventListener('click', function(e) {
  e.preventDefault();
  if (window.matchMedia('(max-width: 768px)').matches) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  var track = document.getElementById('sections-track');
  track.scrollTo({ left: 0, behavior: 'smooth' });
  if (track.children[0]) track.children[0].scrollTop = 0;
});

(function() {
  var track = document.getElementById('sections-track');
  if (!track) return;

  var mobileQuery = window.matchMedia('(max-width: 768px)');

  track.addEventListener('wheel', function(e) {
    if (mobileQuery.matches) return;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;

    var index = Math.round(track.scrollLeft / track.clientWidth);
    var panel = track.children[index];
    if (!panel) return;

    var canScrollY = panel.scrollHeight > panel.clientHeight + 1;
    var atTop = panel.scrollTop <= 0;
    var atBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 1;

    if (panel.classList.contains('home')) {
      e.preventDefault();
      var homeNext = e.deltaY > 0 ? Math.min(index + 1, track.children.length - 1) : Math.max(index - 1, 0);
      track.scrollTo({ left: homeNext * track.clientWidth, behavior: 'smooth' });
      return;
    }

    if (canScrollY) {
      if (e.deltaY > 0 && !atBottom) return;
      if (e.deltaY < 0 && !atTop) return;
    }

    e.preventDefault();

    var targetIndex = e.deltaY > 0
      ? Math.min(index + 1, track.children.length - 1)
      : Math.max(index - 1, 0);

    if (targetIndex === index) return;

    track.scrollTo({ left: targetIndex * track.clientWidth, behavior: 'smooth' });
  }, { passive: false });

  document.querySelectorAll('a[href="#contact-footer"]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();

      if (mobileQuery.matches) {
        var target = document.getElementById('contact-footer');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      track.scrollTo({ left: (track.children.length - 1) * track.clientWidth, behavior: 'smooth' });
      var panel = track.children[track.children.length - 1];
      if (panel) panel.scrollTop = 0;
    });
  });
})();
