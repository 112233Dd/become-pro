const loginForm = document.querySelector("[data-admin-login]");
const statusNode = document.querySelector("[data-admin-status]");

const setStatus = (message) => {
  if (statusNode) statusNode.textContent = message;
};

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  setStatus("Влизане...");

  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: formData.get("password") }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Грешна парола.");
    window.location.href = "/admin/orders";
  } catch (error) {
    setStatus(error.message || "Неуспешен вход.");
  }
});
