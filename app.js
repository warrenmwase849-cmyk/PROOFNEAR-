
// PROOFNEAR DASHBOARD CONNECTION

const SUPABASE_URL = "https://rmprzvgxuwtkyfhrevki.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Z_6UK4b8hG3u3sGdV2BFKA_bjd0eYoD";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const dashboardContent = document.getElementById("dashboardContent");

let currentUser = null;
let isProofnearAdmin = false;
let notificationChannel = null;


async function initializeDashboard() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error || !data.session) {
    window.location.href = "index.html";
    return;
  }

  currentUser = data.session.user;

  showSection("overview");

  updateNotificationBadge();
  startNotificationListener();

const { data: isAdmin, error: adminError } =
  await supabaseClient.rpc("is_proofnear_admin");

if (adminError) {
  console.error("Admin check failed:", adminError.message);
  isProofnearAdmin = false;
} else {
  isProofnearAdmin = isAdmin === true;
}

console.log("PROOFNEAR administrator:", isProofnearAdmin);

const adminNavigation = document.getElementById("adminNavigation");

if (adminNavigation) {
  adminNavigation.style.display =
    isProofnearAdmin ? "block" : "none";
}

  console.log("PROOFNEAR: Initialization completed");
}

function showSection(section) {
  if (!currentUser) return;
  document.querySelectorAll(".sidebar-link").forEach(button => {
    button.classList.toggle(
      "active",
      button.getAttribute("onclick")?.includes(`'${section}'`)
    );
  });
  const name =
    currentUser.user_metadata.full_name ||
    currentUser.email.split("@")[0];

  const email = currentUser.email || "";

  if (section === "overview") {
  loadDashboardOverview();
}

  else if (section === "profile") {
  loadMyProfile();
}

  else if (section === "opportunities") {
  loadMyOpportunities();
}
    else if (section === "applications") {
  loadMyApplications();
}
    else if (section === "payments") {
  loadMyPayments();
    }

  else if (section === "post") {
  window.location.href = "index.html?open=post";
}

  else if (section === "messages") {
    dashboardContent.innerHTML = `
      <h2>Messages</h2>
      <p>Your messages will appear here when messaging is connected.</p>
    `;
  }

  else if (section === "notifications") {
  loadMyNotifications();
}

else if (section === "settings") {
  loadAccountSettings();
}
else if (section === "verification") {
  if (!isProofnearAdmin) {
    dashboardContent.innerHTML = `
      <h2>Access Denied</h2>
      <p>Administrator access required.</p>
    `;
    return;
  }

  loadVerificationRequests();
}
  else if (section === "admin") {
    if (!isProofnearAdmin) {
      dashboardContent.innerHTML = `
        <h2>Access Denied</h2>
        <p>Administrator access required.</p>
      `;
      return;
    }

    dashboardContent.innerHTML = `

<h2>🔐 PROOFNEAR Admin Panel</h2>
<p>Manage and supervise platform activities.</p>

<div class="dashboard-card">
  <h3>⏳ Pending Opportunities</h3>
  <p>Review new opportunities awaiting approval.</p>
  <button class="btn btn-primary" onclick="loadPendingJobs()">
    Review Pending Jobs
  </button>
</div>

<div class="dashboard-card">
  <h3>✅ Approved Opportunities</h3>
  <p>Manage opportunities already published.</p>
  <button class="btn btn-primary" onclick="loadApprovedJobs()">
    View Approved Opportunities
  </button>
</div>
      <div class="dashboard-card" style="margin:0;border-top:4px solid #2878c8;">
        <p style="margin:0;color:#71817d;">📨 Applications Received</p>
        <h2 id="adminApplicationsReceived" style="font-size:30px;margin:12px 0 0;">...</h2>
      </div>

      <div class="dashboard-card" style="margin:0;border-top:4px solid #8055b7;">
        <p style="margin:0;color:#71817d;">👥 Unique Applicants</p>
        <h2 id="adminUniqueApplicants" style="font-size:30px;margin:12px 0 0;">...</h2>
      </div>
<div class="dashboard-card">
  <h3>💰 Payment Verification</h3>
  <p>Review MTN and Airtel payments before approving opportunities.</p>
  <button class="btn btn-primary" onclick="loadPendingPayments()">
    Manage Payments
  </button>
</div>
<div class="dashboard-card" style="border-top:4px solid #087f5b;">
  <h3>📊 CEO Earnings & Analytics</h3>
  <p>
    Monitor PROOFNEAR revenue, payment activity,
    financial growth and platform performance.
  </p>
  <button class="btn btn-primary" onclick="loadAdminEarnings()">
    Open Earnings Dashboard
  </button>
</div>

<div class="dashboard-card" style="border-top:4px solid #8b5cf6;">
  <h3>📈 CEO Growth Analytics</h3>
  <p>Track registrations and opportunity growth over 30 days.</p>
  <button class="btn btn-primary"
    onclick="loadAdminGrowthAnalytics()">
    Open Growth Analytics
  </button>
</div>

<div class="dashboard-card" style="border-top:4px solid #2878c8;">
  <h3>🌍 CEO Platform Overview</h3>
  <p>Monitor PROOFNEAR users and opportunity activity.</p>
  <button class="btn btn-primary"
    onclick="loadAdminPlatformOverview()">
    Open Platform Overview
  </button>
</div>

<div class="dashboard-card">
  <h3>🎤 Pending Talent Content</h3>
  <p>Review music, videos, photos and other creator submissions.</p>
  <button class="btn btn-primary" onclick="loadPendingTalentPosts()">
    Review Talent Content
  </button>
</div>

<div class="dashboard-card">
  <h3>🏆 Pending Talent Challenges</h3>
  <p>Review creator challenges before they become public.</p>
  <button class="btn btn-primary" onclick="loadPendingTalentChallenges()">
    Review Challenges
  </button>
</div>
<div class="dashboard-card">
  <h3>🎬 Pending Challenge Entries</h3>
  <p>Review photos, videos and other entries submitted by challenge participants.</p>
  <button class="btn btn-primary"
    onclick="loadPendingChallengeEntries()">
    Review Challenge Entries
  </button>
</div>
        `;

    loadAdminApplicationStats();
  }
}
async function loadAdminApplicationStats() {
  const { data, error } = await supabaseClient.rpc(
    "get_admin_application_stats"
  );

  if (error) {
    console.error("Admin application statistics error:", error);
    document.getElementById("adminApplicationsReceived").textContent = "—";
    document.getElementById("adminUniqueApplicants").textContent = "—";
    return;
  }

  const stats = data?.[0];

  document.getElementById("adminApplicationsReceived").textContent =
    stats?.total_applications ?? 0;

  document.getElementById("adminUniqueApplicants").textContent =
    stats?.unique_applicants ?? 0;
}

async function loadAdminPlatformOverview() {
  if (!isProofnearAdmin) {
    dashboardContent.innerHTML = `
      <h2>Access Denied</h2>
      <p>Administrator access required.</p>
    `;
    return;
  }

  dashboardContent.innerHTML = `
    <h2>🌍 CEO Platform Overview</h2>
    <p>Loading PROOFNEAR platform statistics...</p>
  `;

  try {
    const { data, error } = await supabaseClient.rpc(
      "get_proofnear_admin_overview"
    );

    if (error) throw error;

    const overview = data || {};
    const totalUsers = Number(overview.total_users || 0);
    const totalOpportunities = Number(overview.total_opportunities || 0);
    const statuses = overview.opportunities_by_status || {};

    dashboardContent.innerHTML = `
      <h2>🌍 CEO Platform Overview</h2>
      <p>PROOFNEAR platform performance</p>

      <div class="dashboard-card">
        <h3>👥 Registered Users</h3>
        <h2>${totalUsers.toLocaleString()}</h2>
      </div>

      <div class="dashboard-card">
        <h3>💼 Total Opportunities</h3>
        <h2>${totalOpportunities.toLocaleString()}</h2>
      </div>

      <div class="dashboard-card">
        <h3>📊 Opportunities by Status</h3>
        <p>Approved: ${Number(statuses.APPROVED || 0).toLocaleString()}</p>
        <p>Pending: ${Number(statuses.PENDING || 0).toLocaleString()}</p>
      </div>

      <button class="btn btn-primary"
        onclick="loadAdminPlatformOverview()">
        🔄 Refresh Overview
      </button>

      <button class="btn btn-primary"
        onclick="showSection('admin')">
        ← Back to Admin Panel
      </button>
    `;
  } catch (error) {
    console.error("Platform overview error:", error);

    dashboardContent.innerHTML = `
      <h2>🌍 CEO Platform Overview</h2>
      <div class="dashboard-card">
        <p>Unable to load platform statistics.</p>
        <p>${escapeHTML(error?.message || "An unexpected error occurred.")}</p>
        <button class="btn btn-primary"
          onclick="loadAdminPlatformOverview()">
          🔄 Try Again
        </button>
        <button class="btn btn-primary"
          onclick="showSection('admin')">
          ← Back to Admin Panel
        </button>
      </div>
    `;
  }
}

async function loadAdminGrowthAnalytics() {
  if (!isProofnearAdmin) {
    dashboardContent.innerHTML = `
      <h2>Access Denied</h2>
      <p>Administrator access required.</p>
    `;
    return;
  }

  dashboardContent.innerHTML = `
    <h2>📈 CEO Growth Analytics</h2>
    <p>Loading PROOFNEAR growth data...</p>
  `;

  try {
    const { data, error } = await supabaseClient.rpc(
      "get_proofnear_admin_growth"
    );

    if (error) throw error;

    const report = data || {};

    const growthText = value =>
      value === null || value === undefined
        ? "No previous-period baseline"
        : `${value > 0 ? "+" : ""}${value}%`;

    const daily = Array.isArray(report.daily) ? report.daily : [];

    const maxValue = Math.max(
      1,
      ...daily.map(day =>
        Math.max(
          Number(day.users || 0),
          Number(day.opportunities || 0)
        )
      )
    );

    const chart = daily.map(day => {
      const users = Number(day.users || 0);
      const opportunities = Number(day.opportunities || 0);
      const dateLabel = String(day.date || "").slice(5);

      return `
        <div style="min-width:42px;text-align:center;">
          <div style="
            height:120px;
            display:flex;
            align-items:flex-end;
            justify-content:center;
            gap:4px;
          ">
            <div title="Users: ${users}"
              style="
                width:15px;
                height:${Math.max(3, users / maxValue * 110)}px;
                background:#087f5b;
                border-radius:4px 4px 0 0;
              ">
            </div>

            <div title="Opportunities: ${opportunities}"
              style="
                width:15px;
                height:${Math.max(3, opportunities / maxValue * 110)}px;
                background:#2878c8;
                border-radius:4px 4px 0 0;
              ">
            </div>
          </div>
          <small>${escapeHTML(dateLabel || "—")}</small>
        </div>
      `;
    }).join("");

    dashboardContent.innerHTML = `
      <h2>📈 CEO Growth Analytics</h2>
      <p>PROOFNEAR growth over the last 30 days</p>

      <button class="btn btn-primary"
        onclick="loadAdminGrowthAnalytics()">
        🔄 Refresh Growth
      </button>

      <div class="dashboard-card">
        <h3>👥 New Registered Users</h3>
        <h2>${Number(report.users_30_days || 0).toLocaleString()}</h2>
        <p>Growth: ${growthText(report.users_growth)}</p>
        <small>
          Previous 30 days:
          ${Number(report.users_previous_30_days || 0).toLocaleString()}
        </small>
      </div>

      <div class="dashboard-card">
        <h3>💼 New Opportunities</h3>
        <h2>${Number(report.jobs_30_days || 0).toLocaleString()}</h2>
        <p>Growth: ${growthText(report.jobs_growth)}</p>
        <small>
          Previous 30 days:
          ${Number(report.jobs_previous_30_days || 0).toLocaleString()}
        </small>
      </div>

      <div class="dashboard-card">
        <h3>📊 Daily Activity — Last 30 Days</h3>
        <p>
          <span style="color:#087f5b;">■ Users</span>
          &nbsp;
          <span style="color:#2878c8;">■ Opportunities</span>
        </p>

        <div style="
          display:flex;
          align-items:flex-end;
          gap:8px;
          overflow-x:auto;
          padding:12px 4px;
        ">
          ${chart || "<p>No daily activity data available yet.</p>"}
        </div>
      </div>

      <button class="btn btn-primary"
        onclick="showSection('admin')">
        ← Back to Admin Panel
      </button>
    `;
  } catch (error) {
    console.error("Growth analytics error:", error);

    dashboardContent.innerHTML = `
      <h2>📈 CEO Growth Analytics</h2>
      <div class="dashboard-card">
        <p>Unable to load growth analytics.</p>
        <p>${escapeHTML(error?.message || "An unexpected error occurred.")}</p>
        <button class="btn btn-primary"
          onclick="loadAdminGrowthAnalytics()">
          🔄 Try Again
        </button>
        <button class="btn btn-primary"
          onclick="showSection('admin')">
          ← Back to Admin Panel
        </button>
      </div>
    `;
  }
}

async function loadAdminEarnings() {
  if (!isProofnearAdmin) {
    dashboardContent.innerHTML = `
      <h2>Access Denied</h2>
      <p>Administrator access required.</p>
    `;
    return;
  }

  dashboardContent.innerHTML = `
    <h2>📊 CEO Earnings & Analytics</h2>
    <p>Loading your financial report...</p>
  `;

  const { data, error } = await supabaseClient.rpc(
    "get_proofnear_admin_earnings"
  );

  if (error) {
    console.error("CEO earnings error:", error);
    dashboardContent.innerHTML = `
      <h2>📊 CEO Earnings & Analytics</h2>
      <div class="dashboard-card">
        <p>Unable to load financial data.</p>
        <p>${escapeHTML(error.message)}</p>
        <button class="btn btn-primary"
          onclick="loadAdminEarnings()">Try Again</button>
      </div>
    `;
    return;
  }


  const revenue = data.revenue || {};
  const sources = data.sources || {};
  const statuses = data.statuses || {};
  const growth = data.growth || {};
  const hourly = data.hourly || [];

  const money = value =>
    "UGX " + Number(value || 0).toLocaleString("en-UG");

  const growthText = value => {
    if (value === null || value === undefined) {
      return "No previous-period baseline";
    }
    return `${value > 0 ? "+" : ""}${value}%`;
  };

  const { data: trends, error: trendsError } =
    await supabaseClient.rpc(
      "get_proofnear_admin_earnings_trends"
    );

  if (trendsError) {
    console.error("Earnings trends error:", trendsError);
  }

  const dailyTrends = trends?.daily || [];
  const monthlyTrends = trends?.monthly || [];
  const methodTrends = trends?.methods || [];

  const maxDaily = Math.max(
    1,
    ...dailyTrends.map(item => Number(item.amount || 0))
  );

  const maxMonthly = Math.max(
    1,
    ...monthlyTrends.map(item => Number(item.amount || 0))
  );

  const dailyChart = dailyTrends.map(item => `
    <div style="flex:1;min-width:30px;text-align:center;">
      <div style="
        height:${Math.max(5, Number(item.amount || 0) / maxDaily * 110)}px;
        background:#087f5b;
        border-radius:5px 5px 0 0;
      " title="${money(item.amount)}"></div>
      <small>${item.date.slice(5)}</small>
    </div>
  `).join("");

  const monthlyChart = monthlyTrends.map(item => `
    <div style="flex:1;min-width:35px;text-align:center;">
      <div style="
        height:${Math.max(5, Number(item.amount || 0) / maxMonthly * 110)}px;
        background:#2878c8;
        border-radius:5px 5px 0 0;
      " title="${money(item.amount)}"></div>
      <small>${item.month}</small>
    </div>
  `).join("");

  const paymentMethods = methodTrends.map(item => `
    <div style="
      display:flex;
      justify-content:space-between;
      gap:12px;
      padding:10px 0;
      border-bottom:1px solid #ddd;
    ">
      <strong>${escapeHTML(item.method)}</strong>
      <span>${money(item.amount)} (${item.transactions} payments)</span>
    </div>
  `).join("");

  const maxHourly = Math.max(
    1,
    ...hourly.map(item => Number(item.amount || 0))
  );

  const hourlyBars = hourly.map(item => `
    <div style="
      flex:1;
      min-width:12px;
      text-align:center;
    ">
      <div title="${item.hour}:00 — ${money(item.amount)}"
        style="
          height:${Math.max(
            4,
            Number(item.amount || 0) / maxHourly * 120
          )}px;
          background:#087f5b;
          border-radius:5px 5px 0 0;
          margin-top:auto;
        ">
      </div>
      <small style="font-size:10px;">
        ${String(item.hour).padStart(2, "0")}
      </small>
    </div>
  `).join("");

  dashboardContent.innerHTML = `
    <h2>📊 CEO Earnings & Analytics</h2>
    <p>Private PROOFNEAR financial overview</p>

    <button class="btn btn-primary"
      onclick="loadAdminEarnings()">
      🔄 Refresh Analytics
    </button>

    <div style="
      display:grid;
      grid-template-columns:repeat(auto-fit,minmax(190px,1fr));
      gap:14px;
      margin:20px 0;
    ">
      <div class="dashboard-card" style="border-top:4px solid #087f5b;">
        <p>💰 Lifetime Earnings</p>
        <h2>${money(revenue.lifetime)}</h2>
      </div>

      <div class="dashboard-card" style="border-top:4px solid #269b65;">
        <p>📅 Today's Earnings</p>
        <h2>${money(revenue.today)}</h2>
        <small>Growth: ${growthText(growth.daily)}</small>
      </div>

      <div class="dashboard-card" style="border-top:4px solid #2878c8;">
        <p>📆 This Week</p>
        <h2>${money(revenue.this_week)}</h2>
        <small>Growth: ${growthText(growth.weekly)}</small>
      </div>

      <div class="dashboard-card" style="border-top:4px solid #8055b7;">
        <p>🗓️ This Month</p>
        <h2>${money(revenue.this_month)}</h2>
        <small>Growth: ${growthText(growth.monthly)}</small>
      </div>
    </div>

    <div class="dashboard-card">
      <h3>⏰ Today's Hourly Earnings</h3>
      <p>Revenue by Uganda local time (00:00–23:00).</p>
      <div style="
        display:flex;
        align-items:flex-end;
        gap:5px;
        height:155px;
        overflow-x:auto;
        padding:12px 4px;
      ">
        ${hourlyBars}
      </div>
    </div>

<div class="dashboard-card">
  <h3>📈 Last 7 Days Revenue</h3>
  <div style="display:flex;align-items:flex-end;gap:8px;height:145px;overflow-x:auto;padding:12px 4px;">
    ${dailyChart}
  </div>
</div>

<div class="dashboard-card">
  <h3>📊 Six-Month Revenue Trend</h3>
  <div style="display:flex;align-items:flex-end;gap:8px;height:145px;overflow-x:auto;padding:12px 4px;">
    ${monthlyChart}
  </div>
</div>

<div class="dashboard-card">
  <h3>📱 MTN & Airtel Revenue</h3>
  ${paymentMethods || "<p>No verified payments yet.</p>"}
</div>


    <div class="dashboard-card">
      <h3>💳 Revenue Sources</h3>
      <p>Opportunity Posting: <strong>${money(sources.posting)}</strong></p>
      <p>Contact Unlocks: <strong>${money(sources.contact_unlock)}</strong></p>
    </div>

    <div class="dashboard-card">
      <h3>📈 Payment Activity</h3>
      <p>Verified Payments: <strong>${statuses.verified || 0}</strong></p>
      <p>Pending Payments: <strong>${statuses.pending || 0}</strong></p>
      <p>Rejected Payments: <strong>${statuses.rejected || 0}</strong></p>
      <p>Paying Users: <strong>${data.paying_users || 0}</strong></p>
      <p>Total Verified Transactions:
        <strong>${data.verified_transactions || 0}</strong>
      </p>
    </div>

    <div class="dashboard-card">
      <h3>📊 Previous Period Comparison</h3>
      <p>Yesterday: <strong>${money(revenue.yesterday)}</strong></p>
      <p>Last Week: <strong>${money(revenue.last_week)}</strong></p>
      <p>Last Month: <strong>${money(revenue.last_month)}</strong></p>
    </div>

    <p style="font-size:12px;color:#71817d;">
      Report generated: ${
        data.generated_at
          ? new Date(data.generated_at).toLocaleString()
          : "Not available"
      }
    </p>

    <button class="btn btn-primary"
      onclick="showSection('admin')">
      ← Back to Admin Panel
    </button>
  `;
}

async function loadDashboardOverview() {
  if (!currentUser) return;

  const name =
    currentUser.user_metadata.full_name ||
    currentUser.email.split("@")[0];

  const { data: accountProfile, error: accountProfileError } =
    await supabaseClient
      .from("profiles")
      .select("account_type")
      .eq("id", currentUser.id)
      .maybeSingle();

  if (accountProfileError) {
    console.error("Account type loading error:", accountProfileError);
  }

  const accountType =
    accountProfile?.account_type ||
    currentUser.user_metadata.account_type ||
    "both";


dashboardContent.innerHTML = `
    <div class="dashboard-welcome">
      <span class="welcome-tag">YOUR PROOFNEAR DASHBOARD</span>

      <h2>
        Welcome back, ${escapeHTML(name)}! 👋
      </h2>

      <p>
        Your opportunities. Your progress. Your future.
        Everything you need to manage your PROOFNEAR account is here.
      </p>
