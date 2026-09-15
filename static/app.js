let draftQueue = [];
const STORAGE_KEY = "reddit_bot_history";

// Toast Notification System
function showToast(message, type = 'info', title = '') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
        iconSvg = `<svg class="icon-svg sm text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17 4 12"/></svg>`;
    } else if (type === 'error') {
        iconSvg = `<svg class="icon-svg sm text-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    } else if (type === 'warning') {
        iconSvg = `<svg class="icon-svg sm text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    } else {
        iconSvg = `<svg class="icon-svg sm text-info" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `
        <div class="toast-icon">${iconSvg}</div>
        <div class="toast-content">
            ${title ? `<div class="toast-title">${escapeHtml(title)}</div>` : ''}
            <div class="toast-msg">${escapeHtml(message)}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <svg class="icon-svg xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// LocalStorage Helper Methods
function getHistoryFromLocalStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Error reading LocalStorage", e);
        return [];
    }
}

function saveItemToLocalStorage(item) {
    try {
        let history = getHistoryFromLocalStorage();
        const existingIdx = history.findIndex(h => h.id === item.id);
        const itemCopy = {
            ...item,
            savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        if (existingIdx !== -1) {
            history[existingIdx] = itemCopy;
        } else {
            history.unshift(itemCopy);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        updateHistoryCountBadge();
    } catch (e) {
        console.error("Error saving to LocalStorage", e);
    }
}

function clearHistoryLocalStorage() {
    if (confirm("Are you sure you want to clear your saved history in LocalStorage?")) {
        localStorage.removeItem(STORAGE_KEY);
        renderHistoryUI();
        updateHistoryCountBadge();
        showToast("LocalStorage history cleared.", "info", "Storage Reset");
    }
}

function deleteHistoryItem(id) {
    let history = getHistoryFromLocalStorage();
    history = history.filter(h => h.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    renderHistoryUI();
    updateHistoryCountBadge();
    showToast("Item removed from LocalStorage history.", "info");
}

function updateHistoryCountBadge() {
    const history = getHistoryFromLocalStorage();
    const countBadge = document.getElementById("historyCountBadge");
    if (countBadge) countBadge.innerText = history.length;
}

// Navigation Tab Switcher
function switchTab(tabName) {
    const queueView = document.getElementById("queueView");
    const historyView = document.getElementById("historyView");
    const tabQueueBtn = document.getElementById("tabQueueBtn");
    const tabHistoryBtn = document.getElementById("tabHistoryBtn");

    if (tabName === 'history') {
        queueView.style.display = "none";
        historyView.style.display = "block";
        tabQueueBtn.classList.remove("active");
        tabHistoryBtn.classList.add("active");
        renderHistoryUI();
    } else {
        queueView.style.display = "block";
        historyView.style.display = "none";
        tabQueueBtn.classList.add("active");
        tabHistoryBtn.classList.remove("active");
    }
}

function renderHistoryUI() {
    const history = getHistoryFromLocalStorage();
    const container = document.getElementById("historyContainer");
    const emptyState = document.getElementById("emptyHistoryState");

    // Stats updates
    const postedCount = history.filter(h => h.status === 'posted').length;
    const draftsCount = history.length;
    const uniqueSubs = new Set(history.map(h => h.subreddit)).size;

    document.getElementById("statPosted").innerText = postedCount;
    document.getElementById("statDrafts").innerText = draftsCount;
    document.getElementById("statSubreddits").innerText = uniqueSubs;

    if (history.length === 0) {
        emptyState.style.display = "block";
        container.innerHTML = "";
        return;
    }

    emptyState.style.display = "none";
    container.innerHTML = history.map(item => {
        const targetLink = item.posted_permalink || item.permalink;
        return `
            <div class="draft-card ${item.status === 'posted' ? 'card-posted' : ''}">
                <div class="draft-header">
                    <div class="meta-tags">
                        <span class="sub-tag">r/${escapeHtml(item.subreddit)}</span>
                        <span class="author-tag">u/${escapeHtml(item.author)}</span>
                        ${item.savedAt ? `<span class="time-tag">${escapeHtml(item.savedAt)}</span>` : ''}
                    </div>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <a href="${targetLink}" target="_blank" class="btn btn-secondary btn-sm link-btn-redirect">
                            View on Reddit
                            <svg class="icon-svg sm text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        </a>
                        <button class="btn btn-secondary btn-sm text-danger" onclick="deleteHistoryItem('${item.id}')" title="Remove from LocalStorage">
                            <svg class="icon-svg sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>
                        </button>
                    </div>
                </div>

                <div class="comment-body-box">
                    "${escapeHtml(item.body)}"
                </div>

                <div class="draft-reply-box">
                    <label style="margin-bottom:6px; display:flex; align-items:center; gap:6px;">
                        <svg class="icon-svg sm text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        Saved Response:
                    </label>
                    <div class="history-response-text">${escapeHtml(item.draft_reply)}</div>
                </div>

                <div class="card-actions">
                    <div>
                        <span class="badge ${getStatusBadgeClass(item.status)}">
                            ${getStatusBadgeIcon(item.status)}
                            ${getStatusLabel(item.status)}
                        </span>
                    </div>

                    <div>
                        <a href="${targetLink}" target="_blank" class="btn btn-send btn-sm">
                            Open Reddit Post ↗
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function onProviderChange() {
    const provider = document.getElementById("providerSelect").value;
    const modelSelect = document.getElementById("modelSelect");
    modelSelect.innerHTML = "";

    const models = AVAILABLE_MODELS[provider] || [];
    models.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.id;
        opt.textContent = m.name;
        modelSelect.appendChild(opt);
    });
}

function setLimit(val) {
    const input = document.getElementById("limitInput");
    if (!input) return;
    input.value = val;
    updateLimitPills(val);
}

function adjustLimit(delta) {
    const input = document.getElementById("limitInput");
    if (!input) return;
    let curr = parseInt(input.value, 10) || 4;
    curr = Math.max(1, Math.min(50, curr + delta));
    input.value = curr;
    updateLimitPills(curr);
}

function updateLimitPills(val) {
    const numVal = parseInt(val, 10);
    document.querySelectorAll('.preset-pill').forEach(pill => {
        if (parseInt(pill.textContent, 10) === numVal) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });
}

async function fetchAndDraftComments() {
    const subreddits = document.getElementById("subredditsInput").value.trim();
    const provider = document.getElementById("providerSelect").value;
    const modelId = document.getElementById("modelSelect").value;
    const limit = parseInt(document.getElementById("limitInput").value, 10);
    const systemPrompt = document.getElementById("systemPromptInput").value.trim();

    if (!subreddits) {
        showToast("Please enter at least one target subreddit.", "warning", "Input Required");
        return;
    }

    const fetchBtn = document.getElementById("fetchBtn");
    const fetchBtnIcon = document.getElementById("fetchBtnIcon");
    const fetchBtnText = document.getElementById("fetchBtnText");
    const statusBadge = document.getElementById("statusBadge");

    fetchBtn.disabled = true;
    fetchBtnIcon.innerHTML = `<svg class="spinner-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path></svg>`;
    fetchBtnText.innerText = "Fetching Comments & Drafting...";

    statusBadge.className = "badge badge-warning";
    statusBadge.innerHTML = `<svg class="spinner-svg sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path></svg> Processing...`;

    try {
        const res = await fetch("/api/fetch-and-draft", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                subreddits: subreddits,
                limit: limit,
                provider: provider,
                model_id: modelId,
                system_prompt: systemPrompt
            })
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.detail || "Failed to fetch comments.");
        }

        // Save fetched items to LocalStorage and Queue
        data.drafts.forEach(d => saveItemToLocalStorage(d));
        draftQueue = [...data.drafts, ...draftQueue];
        renderQueue();

        statusBadge.className = "badge badge-success";
        statusBadge.innerHTML = `<svg class="icon-svg sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17 4 12"/></svg> Drafted ${data.count} items`;
        showToast(`Successfully fetched & drafted ${data.count} comment replies!`, "success", "Queue Updated");
    } catch (err) {
        showToast(err.message, "error", "Fetch Failed");
        statusBadge.className = "badge badge-info";
        statusBadge.innerHTML = `<svg class="icon-svg sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> Idle`;
    } finally {
        fetchBtn.disabled = false;
        fetchBtnIcon.innerHTML = `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>`;
        fetchBtnText.innerText = "Fetch Comments & Generate Drafts";
    }
}

function renderQueue() {
    const container = document.getElementById("draftsContainer");
    const emptyState = document.getElementById("emptyState");
    const countBadge = document.getElementById("queueCount");

    countBadge.innerText = draftQueue.length;

    if (draftQueue.length === 0) {
        emptyState.style.display = "block";
        container.innerHTML = "";
        return;
    }

    emptyState.style.display = "none";
    container.innerHTML = draftQueue.map(item => `
        <div class="draft-card ${item.status === 'posted' ? 'card-posted' : ''}" id="card-${item.id}">
            <div class="draft-header">
                <div class="meta-tags">
                    <span class="sub-tag">r/${escapeHtml(item.subreddit)}</span>
                    <span class="author-tag">u/${escapeHtml(item.author)}</span>
                </div>
                <div>
                    <a href="${item.permalink}" target="_blank" class="permalink-link">
                        View on Reddit
                        <svg class="icon-svg xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </a>
                </div>
            </div>

            <div class="comment-body-box">
                "${escapeHtml(item.body)}"
            </div>

            <div class="draft-reply-box">
                <label style="margin-bottom:6px; display:flex; align-items:center; gap:6px;">
                    <svg class="icon-svg sm text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    AI Generated Draft Reply (Editable):
                </label>
                <textarea id="reply-text-${item.id}" ${item.status === 'posted' ? 'disabled' : ''}>${escapeHtml(item.draft_reply)}</textarea>
            </div>

            <div class="card-actions">
                <div>
                    <span id="badge-${item.id}" class="badge ${getStatusBadgeClass(item.status)}">
                        ${getStatusBadgeIcon(item.status)}
                        ${getStatusLabel(item.status)}
                    </span>
                </div>

                <div style="display:flex; gap:10px; align-items:center;">
                    ${item.status !== 'posted' ? `
                        <button class="btn btn-secondary btn-sm" onclick="regenerateDraft('${item.id}')" id="regen-btn-${item.id}">
                            <span id="regen-icon-${item.id}">
                                <svg class="icon-svg sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                            </span>
                            <span id="regen-text-${item.id}">Regenerate</span>
                        </button>
                        <button class="btn btn-send btn-sm" onclick="sendReply('${item.id}')" id="send-btn-${item.id}">
                            <span id="send-icon-${item.id}">
                                <svg class="icon-svg sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                            </span>
                            <span id="send-text-${item.id}">Send Reply</span>
                        </button>
                    ` : `
                        <div class="published-success-pill">
                            <svg class="icon-svg sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17 4 12"/></svg>
                            Published to Reddit
                            ${item.posted_permalink ? `
                                <a href="${item.posted_permalink}" target="_blank" class="reply-link">View Reply ↗</a>
                            ` : ''}
                        </div>
                    `}
                </div>
            </div>
        </div>
    `).join("");
}

async function regenerateDraft(commentId) {
    const item = draftQueue.find(d => d.id === commentId);
    if (!item) return;

    const provider = document.getElementById("providerSelect").value;
    const modelId = document.getElementById("modelSelect").value;
    const systemPrompt = document.getElementById("systemPromptInput").value.trim();

    const regenBtn = document.getElementById(`regen-btn-${commentId}`);
    const regenIcon = document.getElementById(`regen-icon-${commentId}`);
    const regenText = document.getElementById(`regen-text-${commentId}`);
    const replyTextarea = document.getElementById(`reply-text-${commentId}`);

    if (regenBtn) regenBtn.disabled = true;
    if (replyTextarea) replyTextarea.disabled = true;
    if (regenIcon) {
        regenIcon.innerHTML = `<svg class="spinner-svg sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path></svg>`;
    }
    if (regenText) regenText.innerText = "Generating...";

    try {
        const res = await fetch("/api/regenerate-draft", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                comment_body: item.body,
                provider: provider,
                model_id: modelId,
                system_prompt: systemPrompt
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Regeneration failed.");

        item.draft_reply = data.draft_reply;
        saveItemToLocalStorage(item);
        renderQueue();
        showToast("New AI draft generated!", "success", "Draft Updated");
    } catch (err) {
        showToast(`Failed to regenerate: ${err.message}`, "error", "Regeneration Failed");
        if (regenBtn) regenBtn.disabled = false;
        if (replyTextarea) replyTextarea.disabled = false;
        if (regenIcon) {
            regenIcon.innerHTML = `<svg class="icon-svg sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>`;
        }
        if (regenText) regenText.innerText = "Regenerate";
    }
}

async function sendReply(commentId) {
    const item = draftQueue.find(d => d.id === commentId);
    if (!item) return;

    const replyTextarea = document.getElementById(`reply-text-${commentId}`);
    const latestReplyText = replyTextarea ? replyTextarea.value.trim() : item.draft_reply;

    if (!latestReplyText) {
        showToast("Reply text cannot be empty.", "warning", "Validation Error");
        return;
    }

    const sendBtn = document.getElementById(`send-btn-${commentId}`);
    const regenBtn = document.getElementById(`regen-btn-${commentId}`);
    const badge = document.getElementById(`badge-${commentId}`);

    // Update Send Button to Loading Spinner State
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.innerHTML = `
            <svg class="spinner-svg sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path></svg>
            <span>Sending...</span>
        `;
    }
    if (regenBtn) regenBtn.disabled = true;
    if (replyTextarea) replyTextarea.disabled = true;

    if (badge) {
        badge.className = "badge badge-warning";
        badge.innerHTML = `
            <svg class="spinner-svg sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path></svg>
            Posting...
        `;
    }

    try {
        const res = await fetch("/api/send-reply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                comment_id: commentId,
                reply_text: latestReplyText
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to post reply.");

        item.status = "posted";
        item.draft_reply = latestReplyText;
        if (data.reply_permalink) {
            item.posted_permalink = data.reply_permalink;
        }

        saveItemToLocalStorage(item);
        renderQueue();
        showToast("Successfully posted reply to Reddit!", "success", "Published");
    } catch (err) {
        item.status = "error";
        saveItemToLocalStorage(item);

        if (replyTextarea) replyTextarea.disabled = false;
        
        // Re-enable send button if error
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.innerHTML = `
                <span id="send-icon-${commentId}">
                    <svg class="icon-svg sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                </span>
                <span id="send-text-${commentId}">Send Reply</span>
            `;
        }
        if (regenBtn) regenBtn.disabled = false;

        if (badge) {
            badge.className = "badge badge-warning";
            badge.innerHTML = `<svg class="icon-svg sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> Failed`;
        }

        showToast(err.message, "error", "Failed to Post");
    }
}

function clearQueue() {
    if (draftQueue.length > 0) {
        draftQueue = [];
        renderQueue();
        showToast("Draft queue cleared.", "info");
    }
}

function getStatusBadgeClass(status) {
    switch(status) {
        case 'posted': return 'badge-success';
        case 'error': return 'badge-warning';
        default: return 'badge-info';
    }
}

function getStatusBadgeIcon(status) {
    switch(status) {
        case 'posted':
            return `<svg class="icon-svg sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17 4 12"/></svg>`;
        case 'error':
            return `<svg class="icon-svg sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
        default:
            return `<svg class="icon-svg sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }
}

function getStatusLabel(status) {
    switch(status) {
        case 'posted': return 'Posted';
        case 'error': return 'Failed';
        default: return 'Draft Ready';
    }
}

function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {
    onProviderChange();
    updateHistoryCountBadge();
});
