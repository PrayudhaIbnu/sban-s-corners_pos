// ===== REPORTS =====

function renderReports() {

  updateReportStats();
  renderPaymentStats();

  const container =
    document.getElementById(
      "reportsTable"
    );

  if (!container) return;

  if (!transactions.length) {

    container.innerHTML = `
      <div class="
        text-center
        py-16
        text-gray-400
      ">
        No transactions yet
      </div>
    `;

    return;
  }

  container.innerHTML =
    [...transactions]
      .reverse()
      .map(t => `

        <div class="
          card-premium
          p-5
          mb-4
        ">

          <div class="
            flex
            justify-between
            items-start
          ">

            <div>

              <h4 class="
                font-display
                text-xl
                text-forest
              ">
                ${t.order_id}
              </h4>

              <p class="
                text-sm
                text-gray-500
              ">
                ${new Date(t.date)
                  .toLocaleString()}
              </p>

            </div>

            <div class="text-right">

              <p class="
                font-semibold
                text-terra
              ">
                Rp ${(t.total || 0)
                  .toLocaleString()}
              </p>

              <span class="
                inline-block
                mt-2
                px-3
                py-1
                rounded-full
                bg-[#EFE7DE]
                text-forest
                text-xs
              ">
                ${t.payment_method}
              </span>

            </div>

          </div>

        </div>

      `)
      .join("");
}

function updateReportStats() {

  const revenue =
    transactions.reduce(
      (sum,t) =>
        sum + (t.total || 0),
      0
    );

  const orders =
    transactions.length;

  const average =
    orders
      ? Math.round(
          revenue/orders
        )
      : 0;

  document.getElementById(
    "reportRevenue"
  ).textContent =
    "Rp " +
    revenue.toLocaleString();

  document.getElementById(
    "reportOrders"
  ).textContent =
    orders;

  document.getElementById(
    "reportAverage"
  ).textContent =
    "Rp " +
    average.toLocaleString();
}

function renderPaymentStats() {

  const container =
    document.getElementById(
      "paymentStats"
    );

  if (!container) return;

  const methods = {};

  transactions.forEach(t => {

    methods[t.payment_method] =
      (methods[t.payment_method] || 0)
      + 1;

  });

  const entries =
    Object.entries(methods);

  if (!entries.length) {

    container.innerHTML = `
      <p class="text-gray-400">
        No payment data
      </p>
    `;

    return;
  }

  container.innerHTML =
    entries.map(([name,total]) => `

      <div class="mb-4">

        <div class="
          flex
          justify-between
          mb-2
        ">

          <span>${name}</span>

          <span class="
            font-semibold
            text-forest
          ">
            ${total}
          </span>

        </div>

        <div class="
          h-2
          bg-[#EFE7DE]
          rounded-full
        ">

          <div
            class="
              h-full
              bg-forest
              rounded-full
            "
            style="
              width:
              ${
                (total /
                transactions.length)
                * 100
              }%
            "
          ></div>

        </div>

      </div>

    `).join("");
}