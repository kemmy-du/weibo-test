/* 测试版微博 - 纯前端实现，数据存 localStorage */
(function () {
  'use strict';

  var STORE_KEY = 'weibo_test_posts_v1';
  var MAX_LEN = 140;

  var feedEl = document.getElementById('feed');
  var postInput = document.getElementById('postInput');
  var publishBtn = document.getElementById('publishBtn');
  var charCount = document.getElementById('charCount');
  var imageRow = document.getElementById('imageRow');
  var imageInput = document.getElementById('imageInput');
  var imageBtn = document.getElementById('imageBtn');
  var topicBtn = document.getElementById('topicBtn');
  var emojiBtn = document.getElementById('emojiBtn');
  var clearImageBtn = document.getElementById('clearImageBtn');
  var searchInput = document.getElementById('searchInput');
  var statPosts = document.getElementById('statPosts');
  var toastEl = document.getElementById('toast');
  var feedEnd = document.getElementById('feedEnd');

  var currentTab = 'all';
  var searchKeyword = '';
  var repostOf = null; // 转发时引用的原微博

  /* ---------- 工具 ---------- */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatTime(ts) {
    var diff = Date.now() - ts;
    var min = Math.floor(diff / 60000);
    if (min < 1) return '刚刚';
    if (min < 60) return min + '分钟前';
    var hour = Math.floor(min / 60);
    if (hour < 24) return hour + '小时前';
    var day = Math.floor(hour / 24);
    if (day < 7) return day + '天前';
    var d = new Date(ts);
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }

  var toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2200);
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* ---------- 数据 ---------- */
  function seedPosts() {
    var now = Date.now();
    return [
      {
        id: uid(), author: 'kemmy-du', text: '用 GitHub Pages 搭好了个人主页 🎉 纯静态、零成本，访问速度还不错。 #GitHub Pages#',
        image: '', time: now - 25 * 60000,
        likes: 12, liked: false, reposts: 3, reposted: false,
        comments: [{ name: '路人甲', text: '厉害，学习一下', time: now - 20 * 60000 }]
      },
      {
        id: uid(), author: 'kemmy-du', text: '今天的收获：把重复的工作交给脚本，把判断留给人类。 #量化交易# #自动化#',
        image: '', time: now - 5 * 3600000,
        likes: 34, liked: true, reposts: 8, reposted: false,
        comments: []
      },
      {
        id: uid(), author: 'kemmy-du', text: '随手拍一张工位照 📷 新显示器到位，写代码幸福感 +50%',
        image: 'https://picsum.photos/seed/weibo-test/800/420',
        time: now - 26 * 3600000,
        likes: 56, liked: false, reposts: 5, reposted: false,
        comments: [{ name: '产品汪', text: '显示器链接发一下', time: now - 20 * 3600000 }]
      }
    ];
  }

  function loadPosts() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) {
        var seed = seedPosts();
        localStorage.setItem(STORE_KEY, JSON.stringify(seed));
        return seed;
      }
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return seedPosts();
    }
  }

  function savePosts() {
    localStorage.setItem(STORE_KEY, JSON.stringify(posts));
  }

  var posts = loadPosts();

  /* ---------- 渲染 ---------- */
  function renderText(text) {
    return escapeHtml(text).replace(/#([^#\n]{1,30})#/g, '<a class="topic" href="#">#$1#</a>');
  }

  function postHtml(p) {
    var commentsHtml = p.comments.map(function (c) {
      return '<div class="comment-item"><b>' + escapeHtml(c.name) + '</b>：' +
        escapeHtml(c.text) + '<span class="c-time">' + formatTime(c.time) + '</span></div>';
    }).join('');

    return '' +
      '<article class="post card" data-id="' + p.id + '">' +
        '<div class="post-head">' +
          '<div class="avatar">K</div>' +
          '<div class="post-meta">' +
            '<div class="post-name-line">' +
              '<a class="post-name" href="#">' + escapeHtml(p.author) + '</a>' +
              '<span class="badge-v" title="测试认证">✓</span>' +
              '<span class="post-time">' + formatTime(p.time) + '</span>' +
              '<span class="post-source">来自 测试版网页</span>' +
            '</div>' +
          '</div>' +
          '<button class="post-more" type="button" title="删除">···</button>' +
        '</div>' +
        '<div class="post-body">' + renderText(p.text) + '</div>' +
        (p.image ? '<div class="post-image"><img src="' + escapeHtml(p.image) + '" alt="配图" loading="lazy"></div>' : '') +
        '<div class="post-actions">' +
          '<button class="action-btn act-repost' + (p.reposted ? ' liked' : '') + '" type="button">' +
            '<span class="ico">🔁</span><span>' + p.reposts + '</span></button>' +
          '<button class="action-btn act-comment" type="button">' +
            '<span class="ico">💬</span><span>' + p.comments.length + '</span></button>' +
          '<button class="action-btn act-like' + (p.liked ? ' liked' : '') + '" type="button">' +
            '<span class="ico">' + (p.liked ? '❤️' : '🤍') + '</span><span>' + p.likes + '</span></button>' +
        '</div>' +
        '<div class="comments" hidden>' +
          '<div class="comment-list">' + commentsHtml + '</div>' +
          '<form class="comment-form">' +
            '<input type="text" maxlength="100" placeholder="写下你的评论...">' +
            '<button type="submit">评论</button>' +
          '</form>' +
        '</div>' +
      '</article>';
  }

  function visiblePosts() {
    var list = posts.slice().sort(function (a, b) { return b.time - a.time; });
    if (currentTab === 'original') list = list.filter(function (p) { return !p.repostOf; });
    if (currentTab === 'hot') list = list.sort(function (a, b) { return b.likes - a.likes; });
    if (searchKeyword) {
      var kw = searchKeyword.toLowerCase();
      list = list.filter(function (p) {
        return p.text.toLowerCase().indexOf(kw) > -1;
      });
    }
    return list;
  }

  function render() {
    var list = visiblePosts();
    feedEl.innerHTML = list.map(postHtml).join('');
    feedEnd.hidden = list.length > 0;
    statPosts.textContent = posts.length;
  }

  /* ---------- 发布 ---------- */
  function updateComposer() {
    var len = postInput.value.length;
    charCount.textContent = MAX_LEN - len;
    charCount.classList.toggle('warn', len > MAX_LEN - 20);
    publishBtn.disabled = len === 0 && !imageInput.value.trim();
  }

  postInput.addEventListener('input', updateComposer);

  postInput.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') publish();
  });

  imageBtn.addEventListener('click', function () {
    imageRow.hidden = !imageRow.hidden;
    if (!imageRow.hidden) imageInput.focus();
  });

  clearImageBtn.addEventListener('click', function () {
    imageInput.value = '';
    imageRow.hidden = true;
    updateComposer();
  });

  imageInput.addEventListener('input', updateComposer);

  topicBtn.addEventListener('click', function () {
    insertAtCursor(postInput, '##');
    postInput.focus();
    updateComposer();
  });

  emojiBtn.addEventListener('click', function () {
    var emojis = ['😀', '😂', '🥰', '😎', '🤔', '👍', '🎉', '🔥', '💪', '❤️'];
    insertAtCursor(postInput, emojis[Math.floor(Math.random() * emojis.length)]);
    postInput.focus();
    updateComposer();
  });

  function insertAtCursor(el, text) {
    var start = el.selectionStart, end = el.selectionEnd;
    el.value = el.value.slice(0, start) + text + el.value.slice(end);
    el.selectionStart = el.selectionEnd = start + text.length;
  }

  function publish() {
    var text = postInput.value.trim();
    var image = imageInput.value.trim();
    if (!text && !image) { toast('说点什么再发布吧'); return; }
    if (image && !/^https?:\/\//i.test(image)) { toast('图片链接需要以 http(s):// 开头'); return; }

    posts.push({
      id: uid(),
      author: 'kemmy-du',
      text: text,
      image: image,
      time: Date.now(),
      likes: 0, liked: false,
      reposts: 0, reposted: false,
      comments: [],
      repostOf: repostOf ? { text: repostOf.text, author: repostOf.author } : null
    });

    if (repostOf) {
      var origin = posts.find(function (p) { return p.id === repostOf.id; });
      if (origin) { origin.reposts += 1; origin.reposted = true; }
      repostOf = null;
    }

    savePosts();
    postInput.value = '';
    imageInput.value = '';
    imageRow.hidden = true;
    updateComposer();
    render();
    toast('发布成功 🎉');
  }

  publishBtn.addEventListener('click', publish);

  /* ---------- 信息流交互 ---------- */
  feedEl.addEventListener('click', function (e) {
    var article = e.target.closest('.post');
    if (!article) return;
    var post = posts.find(function (p) { return p.id === article.dataset.id; });
    if (!post) return;

    var likeBtn = e.target.closest('.act-like');
    var repostBtn = e.target.closest('.act-repost');
    var commentBtn = e.target.closest('.act-comment');
    var moreBtn = e.target.closest('.post-more');

    if (likeBtn) {
      post.liked = !post.liked;
      post.likes += post.liked ? 1 : -1;
      savePosts(); render();
      return;
    }

    if (repostBtn) {
      repostOf = post;
      postInput.value = '';
      postInput.focus();
      updateComposer();
      toast('输入转发理由，直接发布即可转发');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (commentBtn) {
      var box = article.querySelector('.comments');
      box.hidden = !box.hidden;
      if (!box.hidden) box.querySelector('input').focus();
      return;
    }

    if (moreBtn) {
      if (confirm('确定删除这条微博吗？')) {
        posts = posts.filter(function (p) { return p.id !== post.id; });
        savePosts(); render();
        toast('已删除');
      }
    }
  });

  feedEl.addEventListener('submit', function (e) {
    var form = e.target.closest('.comment-form');
    if (!form) return;
    e.preventDefault();
    var article = e.target.closest('.post');
    var post = posts.find(function (p) { return p.id === article.dataset.id; });
    var input = form.querySelector('input');
    var text = input.value.trim();
    if (!text) return;
    post.comments.push({ name: 'kemmy-du', text: text, time: Date.now() });
    input.value = '';
    savePosts(); render();
    toast('评论成功');
  });

  /* ---------- Tabs / 搜索 ---------- */
  document.querySelectorAll('.feed-tabs .tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.feed-tabs .tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      currentTab = tab.dataset.tab || 'all';
      render();
    });
  });

  var searchTimer = null;
  searchInput.addEventListener('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      searchKeyword = searchInput.value.trim();
      render();
    }, 200);
  });

  /* ---------- 启动 ---------- */
  updateComposer();
  render();
})();
