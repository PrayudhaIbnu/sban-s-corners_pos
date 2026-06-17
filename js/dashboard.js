// ===== DASHBOARD =====

function renderDashboard() {
console.log("Dashboard Transactions:", transactions);
  const today =
    new Date().toDateString();

  const todayTx =
    transactions.filter(
      t =>
        new Date(t.date)
          .toDateString() === today
    );

  const totalSales =
    todayTx.reduce(
      (sum, t) =>
        sum + (t.total || 0),
      0
    );

  document.getElementById(
    "dashSales"
  ).textContent =
    "Rp " +
    totalSales.toLocaleString();

  document.getElementById(
    "dashOrders"
  ).textContent =
    todayTx.length;

  const itemCount = {};

  transactions.forEach(t => {

    if (!t.items) return;

    t.items.forEach(item => {

      itemCount[item.name] =
        (itemCount[item.name] || 0)
        + item.qty;

    });

  });

  const topItem =
    Object.entries(itemCount)
      .sort((a,b) => b[1]-a[1])[0];

  document.getElementById(
    "dashTop"
  ).textContent =
    topItem
      ? topItem[0]
      : "-";

  renderWeeklyChart();
  renderPopularItems(itemCount);
  renderRecentTransactions();
}

function renderPopularItems(itemCount) {

  const container =
    document.getElementById(
      "popularItems"
    );

  if (!container) return;

  const items =
    Object.entries(itemCount)
      .sort((a,b) => b[1]-a[1])
      .slice(0,5);

  if (!items.length) {

    container.innerHTML = `
      <p class="text-gray-400">
        No sales data
      </p>
    `;

    return;
  }

  container.innerHTML =
    items.map(item => `

      <div class="
        flex
        justify-between
        py-2
        border-b
        border-[#E5DDD3]
      ">

        <span>
          ${item[0]}
        </span>

        <span class="
          font-semibold
          text-forest
        ">
          ${item[1]}
        </span>

      </div>

    `).join("");
}

function renderRecentTransactions() {

  const container =
    document.getElementById(
      "recentTransactions"
    );

  if (!container) return;

  const recent =
    [...transactions]
      .reverse()
      .slice(0,5);

  if (!recent.length) {

    container.innerHTML = `
      <p class="text-gray-400">
        No transactions
      </p>
    `;

    return;
  }

  container.innerHTML =
    recent.map(t => `

      <div class="
        flex
        justify-between
        py-3
        border-b
        border-[#E5DDD3]
      ">

        <div>

          <p class="
            font-medium
            text-forest
          ">
            ${t.order_id}
          </p>

          <p class="
            text-sm
            text-gray-500
          ">
            ${new Date(t.date)
              .toLocaleString()}
          </p>

        </div>

        <span class="
          font-semibold
          text-terra
        ">
          Rp ${(t.total || 0)
            .toLocaleString()}
        </span>

      </div>

    `).join("");
}

function renderWeeklyChart() {

  const chart =
    document.getElementById(
      "weeklyChart"
    );

  if (!chart) return;

  const days =
    ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  const weekly =
    Array(7).fill(0);

  transactions.forEach(t => {

    const day =
      new Date(t.date)
        .getDay();

    weekly[day] +=
      t.total || 0;

  });

  const max =
    Math.max(...weekly,1);

  chart.innerHTML =
    weekly.map((value,index) => `

      <div class="
        flex-1
        flex
        flex-col
        justify-end
        items-center
      ">

        <div
          class="
            w-full
            rounded-t-xl
            bg-forest
          "
          style="
            height:
            ${
              Math.max(
                8,
                (value/max)*100
              )
            }%
          "
        ></div>

        <span class="
          text-xs
          text-gray-500
          mt-2
        ">
          ${days[index]}
        </span>

      </div>

    `).join("");
}