
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
