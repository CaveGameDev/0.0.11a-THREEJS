// replace static import with robust dynamic import/fallback to avoid "Unexpected reserved word" in environments that mis-handle modules
let FontClass;
(async () => {
  try {
    const mod = await import('./render/font.js');
    FontClass = mod.default || mod.Font;
  } catch (e) {
    // fallback to global if available (older loader)
    FontClass = window.Font || null;
    console.warn('font import failed, falling back to global Font if present', e);
  }
})();

// wait for FontClass initialization before creating instance
const waitForFont = async () => {
  while (typeof FontClass !== 'function') {
    // small delay
    // eslint-disable-next-line no-await-in-loop
    await new Promise(r => setTimeout(r, 30));
  }
  return new FontClass('/default.gif');
};
let fontPromise = waitForFont();

// Minimal chat — only display a single server message and nothing else.

(function showSingleServerMessage(){
  const logEl = document.getElementById('chat-log');
  if (!logEl) return;
  logEl.innerHTML = '';
  const line = document.createElement('div');
  line.style.whiteSpace = 'pre-wrap';
  line.style.margin = '2px 0';
  line.style.fontFamily = 'Noto Sans, monospace';
  line.style.fontSize = '16px';
  line.style.color = '#fff';
  line.style.textShadow = '2px 2px 0 rgba(0,0,0,0.8)';
  const token = document.createElement('span');
  token.textContent = '[SERVER] ';
  token.style.color = 'yellow';
  token.style.fontWeight = '700';
  const text = document.createElement('span');
  text.textContent = 'Made By STG (https://github.com/cavegamedev)';
  line.appendChild(token);
  line.appendChild(text);
  logEl.appendChild(line);
})();

let messages = []; // full log
let currentTyping = ''; // what's being typed (shown in bottom-left)
window.chatTyping = false; // NEW: global flag indicating typing mode

/* @tweakable enable short global alias for gameChat */
const SHORT_ALIAS = true;

// Public API for other game code to push messages
window.gameChat = {
  push(msg) {
    const str = String(msg);
    // FILTER: silently drop noisy automatic world-regeneration spam
    if (/world\s*regenerat/i.test(str)) return;
    // Create line element immediately (avoid rebuilds from renderLog)
    const line = document.createElement('div');
    // Render as a single full line. If message begins with [SERVER], keep it inline.
    if (/#JOIN/.test(str)) {
      const restFull = str.replace(/\[SERVER\]\s*/,'').trim();
      const urlMatch = restFull.match(/(https?:\/\/\S*#?JOIN\S*|\S*#JOIN\S*)/);
      const rest = urlMatch ? urlMatch[0] : restFull;
      const token = document.createElement('span');
      token.textContent = '[SERVER] ';
      token.style.color = 'yellow';
      token.style.fontWeight = 'bold';
      line.appendChild(token);

      const textNode = document.createElement('span');
      textNode.textContent = 'Click to copy JoinCode';
      textNode.style.marginRight = '8px';
      line.appendChild(textNode);

      const btn = document.createElement('button');
      btn.textContent = 'Copy';
      btn.style.marginLeft = '6px';
      btn.style.padding = '2px 6px';
      btn.style.fontSize = '14px';
      btn.style.cursor = 'pointer';
      btn.style.background = '#111';
      btn.style.color = '#fff';
      btn.style.border = '1px solid rgba(255,255,255,0.06)';
      btn.addEventListener('click', () => {
        navigator.clipboard?.writeText(rest).then(() => {
          const prev = btn.textContent;
          btn.textContent = 'Copied';
          setTimeout(() => btn.textContent = prev, 1200);
        }).catch(() => {
          window.prompt('Copy join URL:', rest);
        });
      });
      line.appendChild(btn);

      const creditLine = document.createElement('div');
      const token2 = document.createElement('span');
      token2.textContent = '[SERVER] ';
      token2.style.color = 'yellow';
      token2.style.fontWeight = 'bold';
      creditLine.appendChild(token2);

      const link = document.createElement('a');
      link.href = 'https://github.com/cavegamedev';
      link.textContent = 'STG';
      link.style.color = '#4ea3ff';
      link.style.textDecoration = 'underline';
      link.target = '_blank';
      creditLine.appendChild(document.createTextNode('Made By '));
      creditLine.appendChild(link);

      creditLine.style.marginTop = '4px';
      creditLine.style.fontFamily = 'Noto Sans, monospace';
      creditLine.style.fontSize = '16px';
      creditLine.style.color = '#fff';
      creditLine.style.textShadow = '2px 2px 0 rgba(0,0,0,0.8)';

      logEl.appendChild(line);
      logEl.appendChild(creditLine);
      // Auto-fade/cleanup both lines after 15s (user requested)
      [line, creditLine].forEach(el => {
        el.style.transition = 'opacity 1s';
        setTimeout(() => el.style.opacity = '0', 15000);
        setTimeout(() => el.remove(), 16000);
      });
      return;
    } else if (str.startsWith('[SERVER]')) {
      // Inline server tag: split token so [SERVER] is yellow and rest is white
      const token = document.createElement('span');
      token.textContent = '[SERVER] ';
      token.style.color = 'yellow';
      token.style.fontWeight = '700';
      const rest = document.createElement('span');
      rest.textContent = str.replace(/^\[SERVER\]\s*/, '');
      rest.style.color = '#fff';
      line.appendChild(token);
      line.appendChild(rest);
      // apply Minecrafter font to the entire server line for consistent look
      line.classList.add('server-chat');
    } else {
      line.textContent = str;
    }
    line.style.whiteSpace = 'pre-wrap';
    line.style.margin = '2px 0';
    line.style.fontFamily = 'Noto Sans, monospace';
    line.style.fontSize = '16px'; // bigger text
    line.style.color = '#fff';
    line.style.textShadow = '2px 2px 0 rgba(0,0,0,0.8)'; // apply shadow effect
    logEl.appendChild(line);
    // Auto-fade and remove after 15s (per request)
    line.style.transition = 'opacity 1s';
    setTimeout(() => line.style.opacity = '0', 15000);
    setTimeout(() => line.remove(), 16000);
  },
  setTyping(text) {
    currentTyping = String(text || '');
    renderTyping();
  },
  // NEW: callback hook set by game to receive local sends (so multiplayer can broadcast)
  onLocalSend: null,
  // NEW: helper to send a local message (push + notify network)
  async sendLocal(msg) {
    const s = String(msg || '');
    // push locally
    messages.push(s);
    renderLog();
    // notify host/game code to broadcast
    if (typeof window.gameChat.onLocalSend === 'function') {
      try { window.gameChat.onLocalSend(s); } catch (e) {}
    }
    // If a peer-to-peer network helper is present, use it instead of Websim for player-to-player data
    try { if (window.P2PNetwork && typeof window.P2PNetwork.broadcast === 'function') await window.P2PNetwork.broadcast(s); } catch(e){}
    // NEW: throttle/rate-limit network forwards and avoid sending huge payloads directly
    try {
      const trimmed = s.trim();
      // simple size guard: avoid sending messages that look like raw world dumps
      if (s.length > 2000) {
        // attempt to persist large payload via SaveSystem (download/upload) rather than chat socket
        if (window.SaveSystem && typeof window.SaveSystem.downloadAndNotify === 'function') {
          window.gameChat.push('[SERVER] Large payload detected — saving locally instead of sending over socket.');
          try { await window.SaveSystem.downloadAndNotify(`LargePayload_${Date.now()}.json`); } catch (e) {}
        } else {
          window.gameChat.push('[SERVER] Large payload detected — message blocked to prevent socket overflow.');
        }
        return;
      }
      // rate-limit chat forwarding to network: max one forwarded message per 1500ms
      window._gameChat_last_forward = window._gameChat_last_forward || 0;
      const now = Date.now();
      if (now - window._gameChat_last_forward < 1500) {
        // drop or queue briefly (we simply drop to avoid spam)
        return;
      }
      window._gameChat_last_forward = now;
      // NEW: detect simple slash-commands and forward to Websim room if available
      try {
        const trimmed = s.trim(); 
        if (trimmed.startsWith('/join ')) {
          const parts = trimmed.split(/\s+/);
          if (parts[1]) {
            const target = parts[1];
            // visually color the username blue in the chat log (client-side)
            (function showBlueName(username){
              const line = document.createElement('div');
              const nameSpan = document.createElement('span');
              nameSpan.textContent = username;
              nameSpan.style.color = '#4ea3ff';
              nameSpan.style.fontWeight = '600';
              line.appendChild(nameSpan);
              line.appendChild(document.createTextNode(' requested join'));
              line.style.whiteSpace = 'pre-wrap';
              line.style.margin = '2px 0';
              line.style.fontFamily = 'Noto Sans, monospace';
              line.style.fontSize = '16px';
              line.style.color = '#fff';
              line.style.textShadow = '2px 2px 0 rgba(0,0,0,0.8)';
              logEl.appendChild(line);
              // auto-fade like other messages
              line.style.transition = 'opacity 1s';
              setTimeout(() => line.style.opacity = '0', 10000);
              setTimeout(() => line.remove(), 11000);
            })(target);
 
            // create a join_request record so the target user can respond with their world
            if (window.websimRoom && window.websimRoom.collection) {
              (async () => {
                const cur = await window.websim.getCurrentUser();
                const requester = cur ? cur.username : 'unknown';
                try {
                  await window.websimRoom.collection('join_request').create({
                    target_username: target,
                    requester_username: requester,
                    created_at: new Date().toISOString()
                  });
                } catch(e){}
                // client-side attempt to locate target's world and redirect
                // show server redirecting message
                window.gameChat.push('[SERVER] Redirecting...');
                // try common collection names that might store a user's world
                const collectionsToTry = ['world','world_state','user_world','worlds'];
                let found = null;
                for (const col of collectionsToTry) {
                  try {
                    if (!window.websimRoom.collection(col)) continue;
                    const list = window.websimRoom.collection(col).filter({ username: target }).getList();
                    if (Array.isArray(list) && list.length > 0) { found = {col, list}; break; }
                  } catch(e){}
                }
                // also try a generic query for records with creator field
                if (!found) {
                  try {
                    const list = window.websimRoom.collection('world').getList();
                    if (Array.isArray(list)) {
                      const hit = list.find(r => r.username === target || r.creator === target || r.requester_username === target);
                      if (hit) found = {col:'world', list: [hit]};
                    }
                  } catch(e){}
                }
 
                if (found) {
                  // attempt to derive a redirect URL from common fields
                  const rec = found.list[0];
                  let url = rec.url || rec.project_url || rec.world_url || null;
                  if (!url && rec.project_id) url = `https://websim.com/p/${rec.project_id}`;
                  if (!url && rec.world_id) url = `https://websim.com/p/${rec.world_id}`;
                  // fallback: try a profile link if nothing else
                  if (!url) url = `https://websim.com/@${target}`;
                  // final redirect (allow slight delay so message is visible)
                  setTimeout(() => { window.location.href = url; }, 800);
                } else {
                  // NOT FOUND (red)
                  const nf = document.createElement('div');
                  const token = document.createElement('span');
                  token.textContent = '[SERVER] ';
                  token.style.color = 'yellow';
                  token.style.fontWeight = 'bold';
                  nf.appendChild(token);
                  const txt = document.createElement('span');
                  txt.textContent = 'NOT FOUND';
                  txt.style.color = '#ff4d4f';
                  txt.style.fontWeight = '700';
                  nf.appendChild(txt);
                  nf.style.margin = '2px 0';
                  nf.style.fontFamily = 'Noto Sans, monospace';
                  nf.style.fontSize = '16px';
                  logEl.appendChild(nf);
                  nf.style.transition = 'opacity 1s';
                  setTimeout(() => nf.style.opacity = '0', 10000);
                  setTimeout(() => nf.remove(), 11000);
                }
              })();
            }
          }
        } else if (trimmed === '/reset') {
          // local immediate reset request: notify server/db so others (or your own devices) can observe
          if (window.websimRoom && window.websimRoom.collection) {
            (async () => {
              const cur = await window.websim.getCurrentUser();
              await window.websimRoom.collection('reset_request').create({
                username: cur.username,
                created_at: new Date().toISOString()
              }).catch(()=>{});
            })();
          }
        } else if (trimmed === '/save') {
          // Save current world to DB under this user's username
          (async () => {
            try {
              if (!window.worldInstance) {
                window.gameChat.push('[SERVER] No world loaded to save.');
                return;
              }
              const cur = await window.websim.getCurrentUser();
              if (!cur || !cur.username) {
                window.gameChat.push('[SERVER] Unable to determine username for save.');
                return;
              }
 
              // Notify user save is starting
              window.gameChat.push('[SERVER] Saving World...');
 
              const payload = {
                username: cur.username,
                width: window.worldInstance.width,
                height: window.worldInstance.height,
                depth: window.worldInstance.depth,
                blocks: Array.from(window.worldInstance.blocks || []),
                lightDepths: Array.from(window.worldInstance.lightDepths || []),
                created_at: new Date().toISOString(),
                // include live player position if available so save files contain non-map player state
                ...(window.player && typeof window.player.x === 'number' ? {
                  player_x: window.player.x,
                  player_y: window.player.y,
                  player_z: window.player.z,
                  player_yaw: window.player.yRotation,
                  player_pitch: window.player.xRotation
                } : {})
              };
 
              const col = window.websimRoom && window.websimRoom.collection ? window.websimRoom.collection('world') : null;
              if (!col) {
                // Attempt using World.saveToDB() as a fallback if available
                if (typeof window.worldInstance.saveToDB === 'function') {
                  const ok = await window.worldInstance.saveToDB().catch(err => { throw err; });
                  if (ok) {
                    window.gameChat.push('[SERVER] Saved Successfully!');
                  } else {
                    window.gameChat.push('[SERVER] SaveError: Unknown error');
                  }
                  return;
                }
                window.gameChat.push('[SERVER] SaveError: No database collection available.');
                return;
              }
 
              // Try to find an existing record to update
              let existing = [];
              try { existing = col.filter({ username: cur.username }).getList(); } catch(e){ existing = []; }
 
              if (Array.isArray(existing) && existing.length > 0) {
                try {
                  await col.update(existing[0].id, payload);
                  window.gameChat.push('[SERVER] Saved Successfully!');
                } catch (err) {
                  // Try create as fallback
                  try { await col.create(payload); window.gameChat.push('[SERVER] Saved Successfully!'); }
                  catch (err2) { window.gameChat.push('[SERVER] SaveError: ' + (err2 && err2.message ? err2.message : String(err2))); }
                }
              } else {
                try {
                  await col.create(payload);
                  window.gameChat.push('[SERVER] Saved Successfully!');
                } catch (err) {
                  window.gameChat.push('[SERVER] SaveError: ' + (err && err.message ? err.message : String(err)));
                }
              }
            } catch (e) {
              window.gameChat.push('[SERVER] SaveError: ' + (e && e.message ? e.message : String(e)));
            }
          })();
        } else if (trimmed === '/save DL') {
          // Download current world data as compact .dat (binary) if available, fallback to level.dat gzipped or JSON
          (async () => {
            try {
              if (!window.worldInstance) {
                window.gameChat.push('[SERVER] No world loaded to download.');
                return;
              }
              window.gameChat.push('[SERVER] Preparing download (prefer .dat)...');
              // prefer binary .dat export
              if (window.SaveSystem && typeof window.SaveSystem.downloadDatDL === 'function') {
                await window.SaveSystem.downloadDatDL(`World_${Date.now()}.dat`);
                window.gameChat.push('[SERVER] Download ready: .dat');
                return;
              }
              // fallback: level.dat gzipped raw blocks
              if (window.SaveSystem && typeof window.SaveSystem.saveLevelDat === 'function') {
                await window.SaveSystem.saveLevelDat('level.dat');
                window.gameChat.push('[SERVER] Download ready: level.dat');
                return;
              }
              // last-resort: JSON fallback
              if (window.SaveSystem && typeof window.SaveSystem.downloadSaveDL === 'function') {
                await window.SaveSystem.downloadSaveDL(`Save_${Date.now()}.json`);
                window.gameChat.push('[SERVER] Download ready: JSON');
                return;
              }
              window.gameChat.push('[SERVER] SaveError: No save facility available.');
            } catch (err) {
              window.gameChat.push('[SERVER] SaveError: ' + (err && err.message ? err.message : String(err)));
            }
          })();
        } else if (trimmed === '/save import') {
          // Prompt user to upload a save file and import it via centralized importer
          (async () => {
            try {
              if (window.SaveImporter && typeof window.SaveImporter.openImportDialog === 'function') {
                window.SaveImporter.openImportDialog();
              } else {
                // fallback to direct SaveSystem import if SaveImporter not present
                if (!window.SaveSystem || typeof window.SaveSystem.loadFromFile !== 'function') {
                  window.gameChat.push('[SERVER] ImportError: Import facility not available.');
                  return;
                }
                // create a minimal file picker and delegate to SaveSystem.loadFromFile
                const input = document.createElement('input');
                input.type = 'file';
                // accept JSON or binary .dat world files
                input.accept = '.json,application/json,.dat,application/octet-stream';
                input.style.display = 'none';
                document.body.appendChild(input);
                input.click();
                input.addEventListener('change', async () => {
                  const f = input.files && input.files[0];
                  input.remove();
                  if (!f) { window.gameChat.push('[SERVER] Import cancelled.'); return; }
                  window.gameChat.push('[SERVER] Importing file...');
                  try {
                    // if .dat file use binary loader if available
                    const name = (f.name || '').toLowerCase();
                    const isDat = name.endsWith('.dat') || f.type === 'application/octet-stream';
                    let res;
                    if (isDat && typeof window.SaveSystem.loadDatFromFile === 'function') {
                      res = await window.SaveSystem.loadDatFromFile(f);
                    } else {
                      res = await window.SaveSystem.loadFromFile(f);
                    }
                    if (res && res.ok) window.gameChat.push('[SERVER] Imported successfully.');
                    else window.gameChat.push('[SERVER] ImportError: ' + (res && res.error ? String(res.error) : 'Unknown error'));
                  } catch (err) {
                    window.gameChat.push('[SERVER] ImportError: ' + (err && err.message ? err.message : String(err)));
                  }
                }, { once: true });
              }
            } catch (e) {
              window.gameChat.push('[SERVER] ImportError: ' + (e && e.message ? e.message : String(e)));
            }
          })();
        }
      } catch(e) {}
    } catch(e) {}
  }
};

// Render the scrollable log into the DOM (simple text nodes)
function renderLog() {
  // legacy: keep behavior to rebuild (used rarely). We'll preserve scroll but keep existing messages array.
  const atBottom = (logEl.scrollHeight - logEl.clientHeight - logEl.scrollTop) < 20;
  logEl.innerHTML = '';
  for (let i = 0; i < messages.length; i++) {
    const line = document.createElement('div');
    const msg = String(messages[i] || '');
    // preserve [SERVER] token coloring for legacy rebuilds
    if (msg.startsWith('[SERVER]')) {
      const token = document.createElement('span');
      token.textContent = '[SERVER] ';
      token.style.color = 'yellow';
      token.style.fontWeight = '700';
      const rest = document.createElement('span');
      rest.textContent = msg.replace(/^\[SERVER\]\s*/,'');
      rest.style.color = '#fff';
      line.appendChild(token);
      line.appendChild(rest);
      // apply Minecrafter font to rebuilt server lines as well
      line.classList.add('server-chat');
    } else {
      line.textContent = msg;
      line.style.color = '#fff';
    }
    line.style.whiteSpace = 'pre-wrap';
    line.style.margin = '2px 0';
    line.style.fontFamily = 'Noto Sans, monospace';
    line.style.fontSize = '16px';
    line.style.textShadow = '2px 2px 0 rgba(0,0,0,0.8)';
     logEl.appendChild(line);
     // auto-fade legacy lines
     line.style.transition = 'opacity 1s';
     setTimeout(() => line.style.opacity = '0', 15000);
     setTimeout(() => line.remove(), 16000);
   }
  if (atBottom) logEl.scrollTop = logEl.scrollHeight;
}

// Render current typing to canvas using Font (default.gif)
function renderTyping() {
  tCtx.clearRect(0,0,typingCanvasEl.width, typingCanvasEl.height);
  const w = typingCanvasEl.width, h = typingCanvasEl.height;
  // draw black bar background with slight padding
  tCtx.fillStyle = 'rgba(0,0,0,0.9)';
  tCtx.fillRect(0, 0, w, h);
  // small inner border to make it distinct (subtle)
  tCtx.strokeStyle = 'rgba(0,0,0,1)';
  tCtx.lineWidth = 2;
  tCtx.strokeRect(1,1,w-2,h-2);
  if (!font.ready) {
    // fallback: draw text with simple shadow effect
    tCtx.fillStyle = 'rgba(0,0,0,0.8)';
    tCtx.font = '16px monospace';
    tCtx.fillText(currentTyping, 1+1, 16+1);
    tCtx.fillStyle = '#fff';
    tCtx.fillText(currentTyping, 1, 16);
    return;
  }
  // draw text using bitmap font's shadow helper so we keep our stylized shadow
  font.drawShadow(tCtx, currentTyping, 6, 4, '#ffffff');
  // ensure typing bar visible when rendering typing
  typingCanvasEl.style.transition = 'opacity 0.6s';
  typingCanvasEl.style.opacity = '1';
  // reset any existing fade timer and schedule fade after 10s of inactivity
  if (window._chat_typing_fade_timer) clearTimeout(window._chat_typing_fade_timer);
  window._chat_typing_fade_timer = setTimeout(() => {
    typingCanvasEl.style.opacity = '0';
  }, 10000);
}

// Hook keyboard input to update typing for demo convenience (non-invasive)
let focused = false;
window.addEventListener('keydown', (e) => {
  // Open chat with '/' key when not already typing
  if (e.key === '/' && !window.chatTyping) {
    e.preventDefault();
    currentTyping = '';
    window.chatTyping = true;
    renderTyping();
    return;
  }

  // Only accept typing characters when the typing bar is active (clicked)
  if (!window.chatTyping) {
    // allow Enter to clear focus (so player can dismiss with Enter)
    if (e.key === 'Enter') {
      window.chatTyping = false;
      renderTyping();
    }
    return;
  }

  // If Enter pressed, push message and clear
  if (e.key === 'Enter') {
    if (currentTyping.trim()) {
      // changed to sendLocal so multiplayer code can pick it up
      window.gameChat.sendLocal(currentTyping);
      currentTyping = '';
      renderTyping();
    }
    // stop typing on Enter
    window.chatTyping = false; // NEW: exit typing mode
    // schedule fade immediately (short delay so render completes)
    if (typingCanvasEl) {
      if (window._chat_typing_fade_timer) clearTimeout(window._chat_typing_fade_timer);
      window._chat_typing_fade_timer = setTimeout(() => { typingCanvasEl.style.opacity = '0'; }, 100);
    }
    return;
  }
  // Ignore if modifier keys
  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
    currentTyping += e.key;
    window.chatTyping = true; // NEW: mark that player is typing
    renderTyping();
  } else if (e.key === 'Backspace') {
    currentTyping = currentTyping.slice(0, -1);
    // if emptied, still considered typing until Enter clears; keep flag true
    window.chatTyping = currentTyping.length > 0;
    renderTyping();
  }
});

// Ensure initial render once font is ready
const readyInterval = setInterval(() => {
  if (font.ready) {
    clearInterval(readyInterval);
    renderTyping();
  }
}, 100);

// Expose for debugging/demo
window._chat_messages = messages;

// replace `const font = new Font('/default.gif');` with:
const font = await fontPromise;

// expose short alias for gameChat
window.g = window.gameChat;