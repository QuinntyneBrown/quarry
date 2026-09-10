const nameInput = document.getElementById("display-name");
const notifications = document.getElementById("notifications");
const save = document.getElementById("save");
const reset = document.getElementById("reset");
const feedback = document.getElementById("feedback");
let session;
let parentOrigin;
function send(type, direction) {
  if (!session) return;
  const message = { type, sessionToken: session, protocolVersion: 1 };
  if (direction) message.direction = direction;
  parent.postMessage(message, parentOrigin);
}
window.addEventListener("message", event => {
  const data = event.data;
  if (event.source !== parent || !data || data.type !== "init" || data.protocolVersion !== 1
      || typeof data.sessionToken !== "string" || !/^[a-f0-9-]{36}$/.test(data.sessionToken)
      || Object.keys(data).sort().join(",") !== "protocolVersion,sessionToken,type" || session) return;
  session = data.sessionToken;
  parentOrigin = event.origin;
  for (const control of [nameInput, notifications, save, reset]) control.disabled = false;
  send("ready");
});
save.addEventListener("click", () => { feedback.textContent = `Saved for ${nameInput.value.trim() || "you"} in this preview.`; });
reset.addEventListener("click", () => { nameInput.value = "Jamie"; notifications.checked = true; feedback.textContent = "Preview reset."; });
document.addEventListener("keydown", event => {
  if (event.key === "Escape") { event.preventDefault(); send("dismiss"); }
  if (event.key === "Tab" && event.shiftKey && document.activeElement === nameInput) { event.preventDefault(); send("focus-exit", "backward"); }
  if (event.key === "Tab" && !event.shiftKey && document.activeElement === reset) { event.preventDefault(); send("focus-exit", "forward"); }
});
window.addEventListener("error", () => send("failure"));
window.addEventListener("unhandledrejection", () => send("failure"));
