const tableBody = document.querySelector("[data-admin-table]");
const countNode = document.querySelector("[data-admin-count]");
const logoutButton = document.querySelector("[data-admin-logout]");
const searchInput = document.querySelector("[data-admin-search]");
const statusFilterButtons = [...document.querySelectorAll("[data-admin-status-filter]")];
const refreshButton = document.querySelector("[data-admin-refresh]");
const emptyState = document.querySelector("[data-admin-empty]");
const errorState = document.querySelector("[data-admin-error]");

let orders = [];
let selectedStatus = "all";
let searchTerm = "";

const orderField = (order, snakeKey, camelKey) => order?.[snakeKey] ?? order?.[camelKey] ?? "";

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const normalizeStatus = (status) => {
  const normalized = String(status || "pending").toLowerCase();
  return normalized === "cancelled" ? "expired" : normalized;
};

const safeProgramLink = (value) => {
  if (!value) return "";
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("bg-BG", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const formatPrice = (value) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("bg-BG", { style: "currency", currency: "EUR" }).format(amount);
};

const setError = (message = "") => {
  if (!errorState) return;
  errorState.hidden = !message;
  errorState.textContent = message;
};

const getFilteredOrders = () =>
  orders.filter((order) => {
    const status = normalizeStatus(orderField(order, "payment_status", "paymentStatus"));
    const haystack = [
      orderField(order, "customer_name", "customerName"),
      orderField(order, "customer_email", "customerEmail"),
      orderField(order, "program_name", "programName"),
    ]
      .join(" ")
      .toLowerCase();

    const matchesStatus = selectedStatus === "all" || status === selectedStatus;
    const matchesSearch = !searchTerm || haystack.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

const renderOrders = () => {
  if (!tableBody) return;

  const filteredOrders = getFilteredOrders();
  if (countNode) countNode.textContent = `${filteredOrders.length} поръчки`;
  if (emptyState) emptyState.hidden = filteredOrders.length > 0;

  tableBody.innerHTML = filteredOrders
    .map((order) => {
      const status = normalizeStatus(orderField(order, "payment_status", "paymentStatus"));
      const programLink = safeProgramLink(orderField(order, "program_link", "programLink"));
      const customerName = orderField(order, "customer_name", "customerName") || "-";
      const customerEmail = orderField(order, "customer_email", "customerEmail") || "-";
      const customerPhone = orderField(order, "customer_phone", "customerPhone") || "-";
      const programName = orderField(order, "program_name", "programName") || "-";
      const programPrice = orderField(order, "program_price", "programPrice");
      const sessionId = orderField(order, "stripe_checkout_session_id", "stripeCheckoutSessionId") || "-";
      const createdAt = orderField(order, "created_at", "createdAt");

      return `
        <tr class="is-${escapeHtml(status)}">
          <td>${escapeHtml(formatDate(createdAt))}</td>
          <td><strong>${escapeHtml(customerName)}</strong></td>
          <td>${escapeHtml(customerEmail)}</td>
          <td>${escapeHtml(customerPhone)}</td>
          <td>${escapeHtml(programName)}</td>
          <td>${escapeHtml(formatPrice(programPrice))}</td>
          <td><mark class="order-status status-${escapeHtml(status)}">${escapeHtml(status)}</mark></td>
          <td><code>${escapeHtml(sessionId)}</code></td>
          <td>${programLink ? `<a href="${escapeHtml(programLink)}" target="_blank" rel="noreferrer">Отвори</a>` : "-"}</td>
        </tr>
      `;
    })
    .join("");
};

const setLoading = (isLoading) => {
  if (!refreshButton) return;
  refreshButton.disabled = isLoading;
  refreshButton.textContent = isLoading ? "Зареждане..." : "Refresh orders";
};

const loadOrders = async () => {
  setLoading(true);
  setError("");

  try {
    const response = await fetch("/api/admin/orders");
    const data = await response.json();

    if (response.status === 401) {
      window.location.replace("/admin/login");
      return;
    }

    if (!response.ok) throw new Error(data.error || "Не успяхме да заредим поръчките.");
    orders = Array.isArray(data.orders) ? data.orders : [];
    renderOrders();
  } catch (error) {
    orders = [];
    renderOrders();
    setError(error.message || "Възникна проблем при зареждане на поръчките.");
  } finally {
    setLoading(false);
  }
};

searchInput?.addEventListener("input", (event) => {
  searchTerm = event.target.value.trim().toLowerCase();
  renderOrders();
});

statusFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedStatus = button.dataset.adminStatusFilter || "all";
    statusFilterButtons.forEach((filterButton) => filterButton.classList.toggle("is-active", filterButton === button));
    renderOrders();
  });
});

refreshButton?.addEventListener("click", loadOrders);

logoutButton?.addEventListener("click", async () => {
  await fetch("/api/admin/logout", { method: "POST" });
  window.location.replace("/admin/login");
});

loadOrders();
