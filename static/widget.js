/* Tour Assistant chat widget.
   Drop this one line into any web page:
       <script src="https://YOUR-SERVER/widget.js" defer></script>
   It adds a round chat button in the bottom-right corner. Clicking it opens a small chat
   panel that talks to /api/chat on the same server this script was loaded from. */

(function () {
  // Where to send messages: the server that served this script.
  var script = document.currentScript;
  var base = script && script.src ? new URL(script.src).origin : "";
  var API = base + "/api/chat";

  // The server assigns a conversation id on the first message. It is kept only in
  // this variable, so refreshing the page starts a fresh conversation. Nothing is
  // stored in the visitor's browser.
  var sessionId = null;
  try { localStorage.removeItem("ta_session"); } catch (e) {}   // clean up ids saved by an older version

  // ---- styles -------------------------------------------------------------
  var css = document.createElement("style");
  css.textContent = `
    .ta-btn{position:fixed;right:20px;bottom:20px;width:56px;height:56px;border-radius:50%;
      background:#2f4a3a;color:#fff;border:0;font-size:24px;cursor:pointer;
      box-shadow:0 4px 14px rgba(0,0,0,.25);z-index:9999}
    .ta-panel{position:fixed;right:20px;bottom:88px;width:340px;max-width:calc(100vw - 40px);
      height:460px;max-height:calc(100vh - 120px);background:#fff;border-radius:14px;
      box-shadow:0 8px 30px rgba(0,0,0,.25);display:none;flex-direction:column;overflow:hidden;
      font:15px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;z-index:9999}
    .ta-panel.open{display:flex}
    .ta-head{background:#2f4a3a;color:#fff;padding:12px 16px;font-weight:600}
    .ta-head small{display:block;font-weight:400;opacity:.85;font-size:12px}
    .ta-log{flex:1;overflow-y:auto;padding:12px;background:#f6f5f1}
    .ta-msg{margin:6px 0;padding:9px 12px;border-radius:12px;max-width:85%;white-space:pre-wrap;word-wrap:break-word}
    .ta-msg.me{background:#2f4a3a;color:#fff;margin-left:auto;border-bottom-right-radius:4px}
    .ta-msg.bot{background:#fff;color:#222;border:1px solid #e3e1da;border-bottom-left-radius:4px}
    .ta-msg.typing{color:#777;font-style:italic}
    .ta-form{display:flex;border-top:1px solid #e3e1da}
    .ta-form input{flex:1;border:0;padding:12px;font:inherit;outline:none}
    .ta-form button{border:0;background:#2f4a3a;color:#fff;padding:0 16px;cursor:pointer;font:inherit}
  `;
  document.head.appendChild(css);

  // ---- elements -----------------------------------------------------------
  var btn = document.createElement("button");
  btn.className = "ta-btn"; btn.title = "Ask us a question"; btn.textContent = "💬";

  var panel = document.createElement("div");
  panel.className = "ta-panel";
  panel.innerHTML =
    '<div class="ta-head">Ask us anything<small>Tours, prices, parking, what to bring</small></div>' +
    '<div class="ta-log"></div>' +
    '<form class="ta-form"><input placeholder="Type your question..." autocomplete="off">' +
    '<button type="submit">Send</button></form>';

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  var log = panel.querySelector(".ta-log");
  var form = panel.querySelector("form");
  var input = panel.querySelector("input");

  function add(text, who) {
    var div = document.createElement("div");
    div.className = "ta-msg " + who;
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    return div;
  }

  add("Hi! Ask me about our tours, prices, parking, or what to bring.", "bot");

  btn.onclick = function () {
    panel.classList.toggle("open");
    if (panel.classList.contains("open")) input.focus();
  };

  // ---- sending a message --------------------------------------------------
  form.onsubmit = function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    input.value = "";
    add(text, "me");
    var typing = add("Typing...", "bot typing");

    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, session_id: sessionId })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        typing.remove();
        if (data.session_id) sessionId = data.session_id;
        add(data.reply || data.error || "Sorry, something went wrong.", "bot");
      })
      .catch(function () {
        typing.remove();
        add("Sorry, I couldn't reach the server. Please call (717) 555-0142.", "bot");
      });
  };
})();
