(function () {
  let pendingMemoir = null;
  let currentMemoir = null;

  const searchView = document.getElementById('searchView');
  const passwordView = document.getElementById('passwordView');
  const memoirView = document.getElementById('memoirView');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const resultsContainer = document.getElementById('resultsContainer');
  const memoirTitleForPassword = document.getElementById('memoirTitleForPassword');
  const passwordInput = document.getElementById('passwordInput');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const submitPasswordBtn = document.getElementById('submitPasswordBtn');
  const passwordError = document.getElementById('passwordError');
  const backToSearchFromPassword = document.getElementById('backToSearchFromPassword');
  const memoirTitleDisplay = document.getElementById('memoirTitleDisplay');
  const closeMemoirBtn = document.getElementById('closeMemoirBtn');
  const galleryScroll = document.getElementById('galleryScroll');

  // ============ 视图切换 ============
  function showView(view) {
    searchView.classList.add('hidden');
    passwordView.classList.add('hidden');
    memoirView.classList.add('hidden');
    if (view === 'search') searchView.classList.remove('hidden');
    else if (view === 'password') passwordView.classList.remove('hidden');
    else if (view === 'memoir') memoirView.classList.remove('hidden');
  }

  function resetPasswordForm() {
    passwordInput.value = '';
    passwordInput.type = 'password';
    togglePasswordBtn.textContent = '👁️';
    passwordError.textContent = '';
  }

  function filterMemoirs(query) {
    if (!query.trim()) return memoirsData;
    const q = query.trim().toLowerCase();
    return memoirsData.filter(m => m.name.toLowerCase().includes(q));
  }

  function renderResults(list) {
    if (!list.length) {
      resultsContainer.innerHTML = `<div class="empty-message">没有找到匹配的回忆录 😔</div>`;
      return;
    }
    resultsContainer.innerHTML = list.map(m => `
      <div class="result-item" data-memoir-id="${m.id}">
        <span class="name">${m.name}</span>
        <span class="arrow">→</span>
      </div>
    `).join('');

    document.querySelectorAll('.result-item').forEach(item => {
      item.addEventListener('click', () => {
        const selected = memoirsData.find(m => m.id === item.dataset.memoirId);
        if (selected) {
          pendingMemoir = selected;
          memoirTitleForPassword.textContent = selected.name + ' · 回忆录';
          resetPasswordForm();
          showView('password');
          passwordInput.focus();
        }
      });
    });
  }

  // ============ 渲染回忆录内部（顶部文字 + 图片 + 视频） ============
  function renderMemoirGallery(memoir) {
    if (!memoir || !memoir.entries || memoir.entries.length === 0) {
      galleryScroll.innerHTML = `<div class="empty-message" style="padding:40px;">这个回忆录还没有内容……</div>`;
      return;
    }

    // ⭐ 每本回忆录自己的开场文字
    // 在 memoirs.js 里每本写一个 intro 字段，可以是多行
    const defaultIntro = '人是由爱的人拼凑成的马赛克。\n相遇的意义就是被你改变的那部分的我，代替你，永远陪在我身边。';

    const introText = memoir.intro || defaultIntro;

    const introHtml = `
      <div class="intro-card-inner">
        <span class="quote-icon">✨</span>
        ${introText.split('\n').map(line => {
          const t = line.trim();
          if (t === '') return '<br>';
          // 以 —— 开头的行作为落款，右对齐（书信格式）
          if (t.startsWith('——')) {
            return `<p class="letter-sign">${t}</p>`;
          }
          return `<p>${t}</p>`;
        }).join('')}
      </div>
    `;

    const entriesHtml = memoir.entries.map(entry => {
      let mediaHtml = '';

      const hasImages = entry.images && entry.images.length > 0;
      const hasVideos = entry.videos && entry.videos.length > 0;

      if (hasImages) {
        mediaHtml += entry.images.map(url =>
          `<img src="${url}" alt="回忆照片" loading="lazy" onerror="this.style.display='none';">`
        ).join('');
      }

      if (hasVideos) {
        mediaHtml += entry.videos.map(url =>
          `<video src="${url}" controls preload="metadata" playsinline></video>`
        ).join('');
      }

      if (!hasImages && !hasVideos) {
        mediaHtml = `<div class="memory-image-placeholder">📷</div>`;
      }

      return `
        <div class="memory-card">
          <div class="memory-text">
            <div class="caption">${entry.text || ''}</div>
            <div class="date">${entry.date || ''}</div>
          </div>
          <div class="memory-images">
            ${mediaHtml}
          </div>
        </div>
      `;
    }).join('');

    galleryScroll.innerHTML = introHtml + entriesHtml;
  }

  function handleSearch() {
    renderResults(filterMemoirs(searchInput.value));
  }

  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') { e.preventDefault(); handleSearch(); }
  });

  // ============ 密码眼睛切换 ============
  togglePasswordBtn.addEventListener('click', () => {
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      togglePasswordBtn.textContent = '🙈';
    } else {
      passwordInput.type = 'password';
      togglePasswordBtn.textContent = '👁️';
    }
    passwordInput.focus();
  });

  // ============ 提交密码（解锁 + 直接播放专属音乐） ============
  submitPasswordBtn.addEventListener('click', () => {
    if (!pendingMemoir) { showView('search'); return; }

    if (passwordInput.value.trim() === pendingMemoir.password) {
      currentMemoir = pendingMemoir;
      memoirTitleDisplay.textContent = currentMemoir.name + ' · 回忆';
      renderMemoirGallery(currentMemoir);

      // ⭐ 直接播放这本回忆录的专属音乐
      const memoirAudio = document.getElementById('memoirAudio');
      if (memoirAudio) {
        if (currentMemoir.audio) {
          memoirAudio.src = currentMemoir.audio;
          memoirAudio.volume = 0.5;         // 音量 0~1，自己调
          memoirAudio.style.display = 'block';
          memoirAudio.play().catch(() => {});
        } else {
          memoirAudio.removeAttribute('src');
          memoirAudio.style.display = 'none';
        }
      }

      showView('memoir');
      galleryScroll.scrollTop = 0;
      pendingMemoir = null;
      resetPasswordForm();
    } else {
      passwordError.textContent = '密码不正确，请重试';
      passwordInput.value = '';
      passwordInput.focus();
    }
  });

  passwordInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') { e.preventDefault(); submitPasswordBtn.click(); }
  });

  // ============ 返回搜索 ============
  backToSearchFromPassword.addEventListener('click', () => {
    pendingMemoir = null;
    resetPasswordForm();
    showView('search');
  });

  // ============ 关闭回忆录（停止音乐） ============
  closeMemoirBtn.addEventListener('click', () => {
    const memoirAudio = document.getElementById('memoirAudio');
    if (memoirAudio) {
      memoirAudio.pause();
      memoirAudio.currentTime = 0;
      memoirAudio.removeAttribute('src');
      memoirAudio.style.display = 'none';
    }

    currentMemoir = null;
    showView('search');
    pendingMemoir = null;
    resetPasswordForm();
  });

  // ============ 初始化 ============
  renderResults(memoirsData);
  showView('search');
})();