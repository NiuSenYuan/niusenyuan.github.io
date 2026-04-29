(async function () {
    const postListEl = document.getElementById('post-list');
    const tagCloudEl = document.getElementById('tag-cloud');
    const archiveListEl = document.getElementById('archive-list');

    if (!postListEl) return;

    try {
        const resp = await fetch('posts.json');
        if (!resp.ok) throw new Error('Failed to load posts');
        const posts = await resp.json();

        renderPostList(posts);
        renderTagCloud(posts);
        renderArchives(posts);
    } catch (err) {
        postListEl.innerHTML = '<div class="loading">暂无文章。欢迎回来！</div>';
        console.error(err);
    }

    function renderPostList(posts) {
        if (posts.length === 0) {
            postListEl.innerHTML = '<div class="loading">暂无文章。写点什么吧！</div>';
            return;
        }

        postListEl.innerHTML = posts.map(post => `
            <article class="post-card">
                <h2 class="post-card-title">
                    <a href="${post.url}">${escapeHtml(post.title)}</a>
                </h2>
                <div class="post-card-meta">
                    <span>📅 ${post.date}</span>
                    ${post.author ? `<span>✍️ ${escapeHtml(post.author)}</span>` : ''}
                    ${post.readTime ? `<span>⏱ ${post.readTime} 分钟阅读</span>` : ''}
                </div>
                <p class="post-card-excerpt">${escapeHtml(post.excerpt)}</p>
                ${post.tags && post.tags.length ? `
                    <div class="post-card-tags">
                        ${post.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
                    </div>
                ` : ''}
            </article>
        `).join('');
    }

    function renderTagCloud(posts) {
        const tagCount = {};
        posts.forEach(post => {
            (post.tags || []).forEach(tag => {
                tagCount[tag] = (tagCount[tag] || 0) + 1;
            });
        });

        if (Object.keys(tagCount).length === 0) {
            tagCloudEl.innerHTML = '<span style="color:var(--text-muted);font-size:0.85rem;">暂无标签</span>';
            return;
        }

        const maxCount = Math.max(...Object.values(tagCount));
        tagCloudEl.innerHTML = Object.entries(tagCount)
            .sort((a, b) => b[1] - a[1])
            .map(([tag, count]) => {
                const size = 0.75 + (count / maxCount) * 0.45;
                return `<span class="tag" style="font-size:${size.toFixed(2)}rem;cursor:pointer;" onclick="filterByTag('${escapeAttr(tag)}')">${escapeHtml(tag)} (${count})</span>`;
            })
            .join('');
    }

    function renderArchives(posts) {
        const grouped = {};
        posts.forEach(post => {
            const yearMonth = post.date.substring(0, 7);
            if (!grouped[yearMonth]) grouped[yearMonth] = [];
            grouped[yearMonth].push(post);
        });

        const sorted = Object.keys(grouped).sort().reverse();

        if (sorted.length === 0) {
            archiveListEl.innerHTML = '<li style="color:var(--text-muted);font-size:0.85rem;">暂无归档</li>';
            return;
        }

        archiveListEl.innerHTML = sorted.map(ym => `
            <li>
                <a href="#">
                    ${escapeHtml(ym)}
                    <span class="count">${grouped[ym].length} 篇</span>
                </a>
            </li>
        `).join('');
    }

    window.filterByTag = function (tag) {
        // Simple tag filter: reload posts and filter client-side
        fetch('posts.json')
            .then(r => r.json())
            .then(posts => {
                const filtered = posts.filter(p => (p.tags || []).includes(tag));
                renderPostList(filtered);
            });
    };
})();

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeAttr(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
