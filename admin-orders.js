const tableBody = document.querySelector("[data-admin-table]");
const countNode = document.querySelector("[data-admin-count]");
const logoutButton = document.querySelector("[data-admin-logout]");

const formatDate = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("bg-BG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
};

const renderOrders = (orders) => {
  if (!tableBody) return;
  if (countNode) countNode.textContent = `${orders.length} поръчки`;
  tableBody.innerHTML = orders
    .map(
      (order) => `
        <tr>
          <td>${formatDate(order.created_at)}</td>
          <td><strong>${order.customer_name || "-"}</strong></td>
          <td>${order.customer_email || "-"}</td>
          <td>${order.customer_phone || "-"}</td>
          <td>${order.program_name || "-"}</td>
          <td>€${Number(order.program_price || 0).toFixed(2)}</td>
          <td><mark class="order-status status-${order.payment_status || "pending"}">${order.payment_status || "pending"}</mark></td>
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
  if (response.status === 401) {
    window.location.replace("/admin/login");
    return;
  }
  if (!response.ok) throw new Error(data.error || "Не успяхме да заредим поръчките.");
  renderOrders(data.orders || []);
};

logoutButton?.addEventListener("click", async () => {
  await fetch("/api/admin/logout", { method: "POST" });
  window.location.replace("/admin/login");
});

loadOrders().catch(() => {
  renderOrders([]);
});
