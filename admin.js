const loginForm = document.querySelector("[data-admin-login]");
const statusNode = document.querySelector("[data-admin-status]");
const ordersSection = document.querySelector("[data-admin-orders]");
const tableBody = document.querySelector("[data-admin-table]");
const countNode = document.querySelector("[data-admin-count]");
const logoutButton = document.querySelector("[data-admin-logout]");

const setStatus = (message) => {
  if (statusNode) statusNode.textContent = message;
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("bg-BG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
};

const renderOrders = (orders) => {
  if (!tableBody || !ordersSection) return;
  ordersSection.hidden = false;
  if (loginForm) loginForm.hidden = true;
  if (countNode) countNode.textContent = `${orders.length} поръчки`;
  tableBody.innerHTML = orders
    .map(
      (order) => `
        <tr>
          <td><strong>${order.customer_name || "-"}</strong><span>${order.player_name || "-"} ${order.player_age ? `(${order.player_age})` : ""}</span></td>
          <td>${order.customer_email || "-"}<span>${order.customer_phone || "-"}</span></td>
          <td>${order.program_name || "-"}</td>
          <td>€${Number(order.program_price || 0).toFixed(2)}</td>
          <td><mark class="order-status status-${order.payment_status || "pending"}">${order.payment_status || "pending"}</mark></td>
          <td>${formatDate(order.created_at)}</td>
          <td><code>${order.stripe_checkout_session_id || "-"}</code></td>
          <td>${order.program_link ? `<a href="${order.program_link}" target="_blank" rel="noreferrer">Отвори</a>` : "-"}</td>
        </tr>
      `,
    )
    .join("");
};

const loadOrders = async () => {
  const response = await fetch("/api/admin/orders");
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Не успяхме да заредим поръчките.");
  renderOrders(data.orders || []);
};

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  setStatus("Влизане...");
  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Грешен вход.");
    setStatus("");
    await loadOrders();
  } catch (error) {
    setStatus(error.message || "Неуспешен вход.");
  }
});

logoutButton?.addEventListener("click", async () => {
  await fetch("/api/admin/logout", { method: "POST" });
  window.location.reload();
});

loadOrders().catch(() => {
  if (ordersSection) ordersSection.hidden = true;
  if (loginForm) loginForm.hidden = false;
});
