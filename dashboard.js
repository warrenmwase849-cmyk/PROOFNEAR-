
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

updateNotificationBadge();
startNotificationListener();

const { data: isAdmin, error: adminError } =
  await supabaseClient.rpc("is_proofnear_admin");

if (adminError) {
  console.error("Admin check failed:", adminError.message);
} else {
  isProofnearAdmin = isAdmin === true;

  console.log("PROOFNEAR administrator:", isProofnearAdmin);

  if (isProofnearAdmin) {
    const sidebar = document.querySelector(".dashboard-sidebar");

    const adminButton = document.createElement("button");
    adminButton.textContent = "🔐 Admin Panel";
    adminButton.onclick = () => showSection("admin");

    sidebar.insertBefore(
      adminButton,
      sidebar.querySelector("button")
    );
  }
}

showSection("overview");
}

function showSection(section) {
  if (!currentUser) return;

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
    else if (section === "payments") {
  loadMyPayments();
    }

  else if (section === "post") {
    dashboardContent.innerHTML = `
      <h2>Post an Opportunity</h2>
      <p>Use the homepage to access the existing posting form.</p>
      <a href="index.html">Go to Homepage</a>
    `;
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
  <button
    class="btn btn-primary"
    onclick="loadApprovedJobs()">
    View Approved Opportunities
  </button>
</div>

      <div class="dashboard-card">
        <h3>💰 Payment Verification</h3>
<p>Review MTN and Airtel payments before approving opportunities.</p>
<button
  class="btn btn-primary"
  onclick="loadPendingPayments()">
  Manage Payments
</button>
      </div>
    `;
  }
}
async function loadDashboardOverview() {
  if (!currentUser) return;

  const name =
    currentUser.user_metadata.full_name ||
    currentUser.email.split("@")[0];

  dashboardContent.innerHTML = `
    <h2>Welcome, ${escapeHTML(name)}! 👋</h2>
    <p>Here's an overview of your PROOFNEAR account.</p>

    <div class="dashboard-card">
      <h3>👤 Account Information</h3>
      <p><strong>Email:</strong> ${escapeHTML(currentUser.email)}</p>
      <p><strong>Account type:</strong> ${
        escapeHTML(currentUser.user_metadata.account_type || "both")
      }</p>
    </div>

    <h3>📊 Your Activity</h3>

    <div class="dashboard-card">
      <h3>💼 Total Opportunities</h3>
      <h2 id="totalOpportunities">Loading...</h2>
    </div>

    <div class="dashboard-card">
      <h3>⏳ Pending Opportunities</h3>
      <h2 id="pendingOpportunities">Loading...</h2>
    </div>

    <div class="dashboard-card">
      <h3>✅ Approved Opportunities</h3>
      <h2 id="approvedOpportunities">Loading...</h2>
    </div>

    <div class="dashboard-card">
      <h3>🚀 Quick Actions</h3>
      <button class="btn btn-primary"
        onclick="showSection('post')">
        ➕ Post Opportunity
      </button>

      <button class="btn btn-primary"
        onclick="showSection('opportunities')">
        💼 My Opportunities
      </button>

      <button class="btn btn-primary"
        onclick="showSection('profile')">
        👤 Edit Profile
      </button>
    </div>
  `;

  const { count: total, error: totalError } =
    await supabaseClient
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", currentUser.id);

  const { count: pending, error: pendingError } =
    await supabaseClient
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", currentUser.id)
      .eq("status", "pending");

  const { count: approved, error: approvedError } =
    await supabaseClient
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", currentUser.id)
      .eq("status", "approved");

  if (totalError || pendingError || approvedError) {
    console.error(
      "Dashboard statistics error:",
      totalError || pendingError || approvedError
    );
    return;
  }

  document.getElementById("totalOpportunities").textContent =
    total ?? 0;

  document.getElementById("pendingOpportunities").textContent =
    pending ?? 0;

  document.getElementById("approvedOpportunities").textContent =
    approved ?? 0;
}

async function loadMyPayments() {
  if (!currentUser) return;

  dashboardContent.innerHTML = `
    <h2>💰 My Payments</h2>
    <p>Loading your payment history...</p>
  `;

  const { data: payments, error } = await supabaseClient.rpc(
    "get_my_proofnear_payments"
  );

  if (error) {
    dashboardContent.innerHTML = `
      <h2>💰 My Payments</h2>
      <p>Could not load payments: ${escapeHTML(error.message)}</p>
    `;
    return;
  }

  if (!payments || payments.length === 0) {
    dashboardContent.innerHTML = `
      <h2>💰 My Payments</h2>
      <div class="dashboard-card">
        <p>You have not submitted any payments yet.</p>
      </div>
    `;
    return;
  }

  dashboardContent.innerHTML = `
    <h2>💰 My Payments</h2>

    ${payments.map(payment => `
      <div class="dashboard-card">
        <h3>${escapeHTML(payment.opportunity_title)}</h3>

        <p><strong>Type:</strong>
          ${payment.payment_type === "posting"
            ? "Opportunity Posting"
            : payment.payment_type === "contact_unlock"
            ? "Contact Unlock"
            : "Other"}
        </p>

        <p><strong>Amount:</strong>
          UGX ${escapeHTML(payment.amount)}
        </p>

        <p><strong>Method:</strong>
          ${escapeHTML(payment.payment_method)}
        </p>

        <p><strong>Transaction reference:</strong>
          ${escapeHTML(payment.transaction_reference)}
        </p>

        <p><strong>Status:</strong>
          ${escapeHTML(payment.status.toUpperCase())}
        </p>

        <p><strong>Submitted:</strong>
          ${new Date(payment.created_at).toLocaleString()}
        </p>

        ${payment.verified_at ? `
          <p><strong>Verified:</strong>
            ${new Date(payment.verified_at).toLocaleString()}
          </p>
        ` : ""}
      </div>
    `).join("")}
  `;
}
async function loadDashboardOverview() {
  if (!currentUser) return;

  const name =
    currentUser.user_metadata.full_name ||
    currentUser.email.split("@")[0];

  dashboardContent.innerHTML = `
    <h2>Welcome, ${escapeHTML(name)}! 👋</h2>
    <p>Here's an overview of your PROOFNEAR account.</p>

    <div class="dashboard-card">
      <h3>👤 Account Information</h3>
      <p><strong>Email:</strong> ${escapeHTML(currentUser.email)}</p>
      <p><strong>Account type:</strong> ${
        escapeHTML(currentUser.user_metadata.account_type || "both")
      }</p>
    </div>

    <h3>📊 Your Activity</h3>

    <div class="dashboard-card">
      <h3>💼 Total Opportunities</h3>
      <h2 id="totalOpportunities">Loading...</h2>
    </div>

    <div class="dashboard-card">
      <h3>⏳ Pending Opportunities</h3>
      <h2 id="pendingOpportunities">Loading...</h2>
    </div>

    <div class="dashboard-card">
      <h3>✅ Approved Opportunities</h3>
      <h2 id="approvedOpportunities">Loading...</h2>
    </div>

    <div class="dashboard-card">
      <h3>🚀 Quick Actions</h3>

      <button class="btn btn-primary"
        onclick="showSection('post')">
        ➕ Post Opportunity
      </button>

      <button class="btn btn-primary"
        onclick="showSection('opportunities')">
        💼 My Opportunities
      </button>

      <button class="btn btn-primary"
        onclick="showSection('profile')">
        👤 Edit Profile
      </button>
    </div>
  `;

  const { count: total, error: totalError } =
    await supabaseClient
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", currentUser.id);

  const { count: pending, error: pendingError } =
    await supabaseClient
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", currentUser.id)
      .eq("status", "pending");

  const { count: approved, error: approvedError } =
    await supabaseClient
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", currentUser.id)
      .eq("status", "approved");

  if (totalError || pendingError || approvedError) {
    console.error(
      "Dashboard statistics error:",
      totalError || pendingError || approvedError
    );
    return;
  }

  document.getElementById("totalOpportunities").textContent =
    total ?? 0;

  document.getElementById("pendingOpportunities").textContent =
    pending ?? 0;

  document.getElementById("approvedOpportunities").textContent =
    approved ?? 0;
}


async function loadMyOpportunities() {
  if (!currentUser) return;

  dashboardContent.innerHTML = `
    <h2>💼 My Opportunities</h2>
    <p>Loading your opportunities...</p>
  `;

  const { data: jobs, error } = await supabaseClient
    .from("jobs")
    .select(`
      id,
      title,
      description,
      location,
      category,
      pay,
      status,
      availability_status,
      created_at
    `)
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    dashboardContent.innerHTML = `
      <h2>💼 My Opportunities</h2>
      <p>Could not load opportunities:
        ${escapeHTML(error.message)}
      </p>
    `;
    return;
  }

  if (!jobs || jobs.length === 0) {
    dashboardContent.innerHTML = `
      <h2>💼 My Opportunities</h2>
      <div class="dashboard-card">
        <p>You have not posted any opportunities yet.</p>
      </div>
    `;
    return;
  }

  dashboardContent.innerHTML = `
    <h2>💼 My Opportunities</h2>

    ${jobs.map(job => `
      <div class="dashboard-card" data-job-id="${escapeHTML(job.id)}">

        <div class="job-details">
          <h3>${escapeHTML(job.title)}</h3>

          <p><strong>Category:</strong>
            ${escapeHTML(job.category || "Not specified")}
          </p>

          <p><strong>Location:</strong>
            ${escapeHTML(job.location || "Not specified")}
          </p>

          <p><strong>Payment:</strong>
            ${escapeHTML(job.pay ?? "Not specified")}
          </p>

          <p><strong>Approval:</strong>
            ${escapeHTML(job.status || "Pending").toUpperCase()}
          </p>

          <p><strong>Availability:</strong>
            ${escapeHTML(job.availability_status || "OPEN").toUpperCase()}
          </p>

          <p>${escapeHTML(job.description || "")}</p>

          <p><strong>Posted:</strong>
            ${new Date(job.created_at).toLocaleDateString()}
          </p>

          <button class="btn btn-primary edit-job-btn">
            ✏️ Edit
          </button>

          <button class="btn btn-primary delete-job-btn">
            🗑️ Delete
          </button>
        </div>

      </div>
    `).join("")}
  `;

  // EDIT OPPORTUNITY
  dashboardContent.querySelectorAll(".edit-job-btn").forEach(button => {
    button.addEventListener("click", () => {
      const card = button.closest("[data-job-id]");
      const job = jobs.find(item => item.id === card.dataset.jobId);

      card.innerHTML = `
        <h3>✏️ Edit Opportunity</h3>

        <form class="edit-job-form">
          <label>Title</label>
          <input name="title" value="${escapeHTML(job.title || "")}" required>

          <label>Category</label>
          <input name="category" value="${escapeHTML(job.category || "")}">

          <label>Location</label>
          <input name="location" value="${escapeHTML(job.location || "")}">

          <label>Payment</label>
          <input name="pay" value="${escapeHTML(job.pay ?? "")}">

          <label>Description</label>
          <textarea name="description" required>${escapeHTML(job.description || "")}</textarea>

          <label>Availability</label>
<select name="availability_status">
  <option value="OPEN" ${job.availability_status === "OPEN" ? "selected" : ""}>Open</option>
  <option value="FILLED" ${job.availability_status === "FILLED" ? "selected" : ""}>Filled</option>
  <option value="ON HOLD" ${job.availability_status === "ON HOLD" ? "selected" : ""}>On Hold</option>
</select>
          <button class="btn btn-primary" type="submit">
            💾 Save Changes
          </button>

          <button class="btn btn-primary cancel-edit-btn" type="button">
            Cancel
          </button>
        </form>
      `;

      card.querySelector(".cancel-edit-btn").addEventListener("click", () => {
        loadMyOpportunities();
      });

      card.querySelector(".edit-job-form").addEventListener("submit", async event => {
        event.preventDefault();

        const form = event.currentTarget;
        const formData = new FormData(form);

        const updates = {
          title: formData.get("title").trim(),
          category: formData.get("category").trim(),
          location: formData.get("location").trim(),
          pay: formData.get("pay").trim(),
          description: formData.get("description").trim(),
          availability_status: formData.get("availability_status")
        };

        const saveButton = form.querySelector('button[type="submit"]');
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";

        const { error } = await supabaseClient
          .from("jobs")
          .update(updates)
          .eq("id", job.id)
          .eq("user_id", currentUser.id);

        if (error) {
          alert("Could not save changes: " + error.message);
          saveButton.disabled = false;
          saveButton.textContent = "💾 Save Changes";
          return;
        }

        alert("Opportunity updated successfully!");
        loadMyOpportunities();
      });
    });
  });

  // DELETE OPPORTUNITY
  dashboardContent.querySelectorAll(".delete-job-btn").forEach(button => {
    button.addEventListener("click", async () => {
      const card = button.closest("[data-job-id]");
      const jobId = card.dataset.jobId;

      const confirmed = confirm(
        "Are you sure you want to permanently delete this opportunity?"
      );

      if (!confirmed) return;

      button.disabled = true;
      button.textContent = "Deleting...";

      const { error } = await supabaseClient
        .from("jobs")
        .delete()
        .eq("id", jobId)
        .eq("user_id", currentUser.id);

      if (error) {
        alert("Could not delete opportunity: " + error.message);
        button.disabled = false;
        button.textContent = "🗑️ Delete";
        return;
      }

      alert("Opportunity deleted successfully!");
      loadMyOpportunities();
    });
  });
}


async function openNotificationOpportunity(jobId) {
  if (!currentUser || !jobId) return;

  dashboardContent.innerHTML = `
    <h2>💼 Opportunity Details</h2>
    <p>Loading opportunity...</p>
  `;

  const { data: job, error } = await supabaseClient
    .from("jobs")
    .select(`
      id,
      title,
      description,
      location,
      category,
      pay,
      status,
      availability_status,
      created_at
    `)
    .eq("id", jobId)
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (error || !job) {
    dashboardContent.innerHTML = `
      <h2>💼 Opportunity Details</h2>
      <p>Could not find this opportunity.</p>
      <button class="btn btn-primary"
        onclick="loadMyNotifications()">
        Back to Notifications
      </button>
    `;
    return;
  }

  dashboardContent.innerHTML = `
    <h2>💼 Opportunity Details</h2>

    <div class="dashboard-card">
      <h3>${escapeHTML(job.title)}</h3>

      <p><strong>Category:</strong>
        ${escapeHTML(job.category || "Not specified")}
      </p>

      <p><strong>Location:</strong>
        ${escapeHTML(job.location || "Not specified")}
      </p>

      <p><strong>Payment:</strong>
        ${escapeHTML(job.pay || "Not specified")}
      </p>

      <p><strong>Approval:</strong>
        ${escapeHTML(job.status || "Pending").toUpperCase()}
      </p>

      <p><strong>Availability:</strong>
        ${escapeHTML(job.availability_status || "OPEN").toUpperCase()}
      </p>

      <p>${escapeHTML(job.description || "")}</p>

      <p><strong>Posted:</strong>
        ${new Date(job.created_at).toLocaleDateString()}
      </p>
    </div>

    <button class="btn btn-primary"
      onclick="loadMyOpportunities()">
      Back to My Opportunities
    </button>

    <button class="btn btn-primary"
      onclick="loadMyNotifications()">
      Back to Notifications
    </button>
  `;
}


async function openNotificationPayment(paymentId) {
  if (!currentUser || !paymentId) return;

  dashboardContent.innerHTML = `
    <h2>💳 Payment Details</h2>
    <p>Loading payment...</p>
  `;

  const { data: payments, error } = await supabaseClient
    .rpc("get_my_proofnear_payments");

  if (error) {
    dashboardContent.innerHTML = `
      <h2>💳 Payment Details</h2>
      <p>Could not load payment:
        ${escapeHTML(error.message)}
      </p>
      <button class="btn btn-primary"
        onclick="loadMyNotifications()">
        Back to Notifications
      </button>
    `;
    return;
  }

  const payment = (payments || []).find(
    item => String(item.payment_id) === String(paymentId)
  );

  if (!payment) {
    dashboardContent.innerHTML = `
      <h2>💳 Payment Details</h2>
      <p>Payment not found in your payment history.</p>
      <button class="btn btn-primary"
        onclick="loadMyPayments()">
        View My Payments
      </button>
    `;
    return;
  }

  dashboardContent.innerHTML = `
    <h2>💳 Payment Details</h2>

    <div class="dashboard-card">
      <h3>${escapeHTML(payment.opportunity_title || "PROOFNEAR Payment")}</h3>

      <p><strong>Amount:</strong>
        UGX ${Number(payment.amount).toLocaleString()}
      </p>

      <p><strong>Payment Type:</strong>
        ${escapeHTML(payment.payment_type || "Not specified")}
      </p>

      <p><strong>Status:</strong>
        ${escapeHTML(payment.status || "Unknown").toUpperCase()}
      </p>

      <p><strong>Payment Method:</strong>
        ${escapeHTML(payment.payment_method || "Not specified")}
      </p>

      <p><strong>Transaction Reference:</strong>
        ${escapeHTML(payment.transaction_reference || "Not specified")}
      </p>

      <p><strong>Date:</strong>
        ${payment.created_at
          ? new Date(payment.created_at).toLocaleString()
          : "Not specified"}
      </p>

      <p><strong>Verified At:</strong>
        ${payment.verified_at
          ? new Date(payment.verified_at).toLocaleString()
          : "Not yet verified"}
      </p>
    </div>

    <button class="btn btn-primary"
      onclick="loadMyPayments()">
      Back to My Payments
    </button>

    <button class="btn btn-primary"
      onclick="loadMyNotifications()">
      Back to Notifications
    </button>
  `;
}



async function loadMyProfile() {
  if (!currentUser) return;

  dashboardContent.innerHTML = `
    <h2>👤 My Profile</h2>
    <p>Loading your profile...</p>
  `;

  const { data: profile, error } = await supabaseClient
    .from("profiles")
    .select("full_name, district, bio, account_type, verification_status")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (error) {
    dashboardContent.innerHTML = `
      <h2>My Profile</h2>
      <p>Could not load profile: ${escapeHTML(error.message)}</p>
    `;
    return;
  }

  const savedProfile = profile || {};

  dashboardContent.innerHTML = `
    <h2>👤 My Profile</h2>

    <div class="dashboard-card">
      <label>Full name</label>
      <input
        type="text"
        id="profileFullName"
        value="${escapeHTML(savedProfile.full_name || currentUser.user_metadata.full_name || "")}"
      >

      <label>Email address</label>
      <input
        type="email"
        value="${escapeHTML(currentUser.email || "")}"
        disabled
      >

      <label>District</label>
      <input
        type="text"
        id="profileDistrict"
        value="${escapeHTML(savedProfile.district || "")}"
        placeholder="Enter your district"
      >

      <label>About me</label>
      <textarea
        id="profileBio"
        placeholder="Tell people a little about yourself"
      >${escapeHTML(savedProfile.bio || "")}</textarea>

      <label>Account type</label>
      <select id="profileAccountType">
        <option value="seeker" ${savedProfile.account_type === "seeker" ? "selected" : ""}>Seeker</option>
        <option value="provider" ${savedProfile.account_type === "provider" ? "selected" : ""}>Provider</option>
        <option value="both" ${(!savedProfile.account_type || savedProfile.account_type === "both") ? "selected" : ""}>Both</option>
      </select>

      <p><strong>Verification:</strong>
        ${escapeHTML(savedProfile.verification_status || "Not verified")}
      </p>

      <button class="btn btn-primary" onclick="saveMyProfile()">
        Save Profile
      </button>

      <p id="profileMessage"></p>
    </div>
  `;
}

async function saveMyProfile() {
  if (!currentUser) return;

  const fullName = document.getElementById("profileFullName").value.trim();
  const district = document.getElementById("profileDistrict").value.trim();
  const bio = document.getElementById("profileBio").value.trim();
  const accountType = document.getElementById("profileAccountType").value;

  const message = document.getElementById("profileMessage");

  if (!fullName) {
    message.textContent = "Please enter your full name.";
    return;
  }

  message.textContent = "Saving your profile...";

  const { error } = await supabaseClient
    .from("profiles")
    .update({
      full_name: fullName,
      district: district,
      bio: bio,
      account_type: accountType
    })
    .eq("id", currentUser.id);

  if (error) {
    message.textContent = "Could not save: " + error.message;
    return;
  }

  message.textContent = "Profile updated successfully! ❤️";
}


function loadAccountSettings() {
  if (!currentUser) return;

  dashboardContent.innerHTML = `
    <h2>⚙️ Account Settings</h2>

    <div class="dashboard-card">
      <h3>🔐 Change Password</h3>
      <p>Update your PROOFNEAR account password.</p>

      <label>New Password</label>
      <input
        type="password"
        id="newAccountPassword"
        placeholder="Enter new password"
      >

      <label>Confirm New Password</label>
      <input
        type="password"
        id="confirmAccountPassword"
        placeholder="Confirm new password"
      >

      <button class="btn btn-primary" onclick="changeAccountPassword()">
        Update Password
      </button>

      <p id="passwordMessage"></p>
    </div>

    <div class="dashboard-card">
      <h3>📧 Email Address</h3>
      <p>${escapeHTML(currentUser.email || "")}</p>
      <p>Email changes can be requested through account security settings.</p>
    </div>

    <div class="dashboard-card">
      <h3>🛡️ Account Security</h3>
      <p>Your account is protected by Supabase authentication.</p>
      <p>Never share your password or secret API keys.</p>
    </div>

    <div class="dashboard-card">
      <h3>🔑 PROOFNEAR Configuration</h3>
      <p>Frontend configuration uses your Supabase publishable key.</p>
      <p>Secret keys must remain private and server-side.</p>
    </div>
  `;
}

async function changeAccountPassword() {
  if (!currentUser) return;

  const password = document.getElementById("newAccountPassword").value;
  const confirmPassword = document.getElementById("confirmAccountPassword").value;
  const message = document.getElementById("passwordMessage");

  if (password.length < 8) {
    message.textContent = "Password must contain at least 8 characters.";
    return;
  }

  if (password !== confirmPassword) {
    message.textContent = "Passwords do not match.";
    return;
  }

  message.textContent = "Updating password...";

  const { error } = await supabaseClient.auth.updateUser({
    password: password
  });

  if (error) {
    message.textContent = "Password update failed: " + error.message;
    return;
  }

  document.getElementById("newAccountPassword").value = "";
  document.getElementById("confirmAccountPassword").value = "";

  message.textContent = "Password updated successfully! ❤️";
}


async function loadMyNotifications() {
  if (!currentUser) return;

  dashboardContent.innerHTML = `
    <h2>🔔 My Notifications</h2>
    <p>Loading notifications...</p>
  `;

  const { data: notifications, error } = await supabaseClient
    .from("notifications")
    .select(`
      id,
      title,
      message,
      notification_type,
      is_read,
      created_at,
      related_job_id,
      related_payment_id
    `)
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    dashboardContent.innerHTML = `
      <h2>🔔 My Notifications</h2>
      <p>Could not load notifications:
        ${escapeHTML(error.message)}
      </p>
    `;
    return;
  }

  if (!notifications || notifications.length === 0) {
  if (!notifications || notifications.length === 0) {
  dashboardContent.innerHTML = `
    <h2>🔔 My Notifications</h2>
    <div class="dashboard-card">
      <p>You have no notifications yet.</p>
    </div>
  `;
  return;
}

const hasUnread = notifications.some(
  notification => !notification.is_read
);

dashboardContent.innerHTML = `
  <h2>🔔 My Notifications</h2>

  ${hasUnread ? `
    <button
      class="btn btn-primary"
      onclick="markAllNotificationsRead()">
      ✓ Mark All as Read
    </button>
  ` : ""}

  ${notifications.map(notification => `
    <div class="dashboard-card">
      <h3>${escapeHTML(notification.title)}</h3>

      <p>${escapeHTML(notification.message)}</p>

      <p><strong>Type:</strong>
        ${escapeHTML(notification.notification_type)}
      </p>

      <p><strong>Status:</strong>
        ${notification.is_read ? "Read" : "Unread"}
      </p>

      <p><strong>Date:</strong>
        ${new Date(notification.created_at).toLocaleString()}
      </p>

      ${notification.related_job_id ? `
        <button
          class="btn btn-primary"
          onclick="openNotificationOpportunity('${notification.related_job_id}')">
          View Opportunity
        </button>
      ` : ""}

      ${notification.related_payment_id ? `
        <button
          class="btn btn-primary"
          onclick="openNotificationPayment('${notification.related_payment_id}')">
          View Payment
        </button>
      ` : ""}

      ${!notification.is_read ? `
        <button
          class="btn btn-primary"
          onclick="markNotificationRead('${notification.id}')">
          Mark as Read
        </button>
      ` : ""}
    </div>
  `).join("")}
`;
}


async function markAllNotificationsRead() {
  if (!currentUser) return;

  const confirmed = confirm(
    "Mark all your notifications as read?"
  );

  if (!confirmed) return;

  const { error } = await supabaseClient
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", currentUser.id)
    .eq("is_read", false);

  if (error) {
    alert("Could not mark notifications as read: " + error.message);
    return;
  }

  await loadMyNotifications();
  await updateNotificationBadge();

  alert("All notifications marked as read!");
}


async function updateNotificationBadge() {
  if (!currentUser) return;

  const badge = document.getElementById("notificationBadge");

  if (!badge) return;

  const { count, error } = await supabaseClient
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", currentUser.id)
    .eq("is_read", false);

  if (error) {
    console.error("Notification count error:", error);
    return;
  }

  badge.textContent = count > 99 ? "99+" : count;
  badge.style.display = count > 0 ? "inline-flex" : "none";
}
function startNotificationListener() {
  if (!currentUser) return;

  if (notificationChannel) {
    supabaseClient.removeChannel(notificationChannel);
  }

  notificationChannel = supabaseClient
    .channel("proofnear-notifications-" + currentUser.id)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: "user_id=eq." + currentUser.id
      },
      () => {
        updateNotificationBadge();
      }
    )
    .subscribe();
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

async function logoutUser() {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    alert(error.message);
    return;
  }

  window.location.href = "index.html";
}
async function loadPendingJobs() {
  if (!isProofnearAdmin) {
    alert("Administrator access required.");
    return;
  }

  const { data: jobs, error } = await supabaseClient
    .from("jobs")
    .select("id, title, category, location, description, pay, created_at, status, availability_status")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Pending jobs error:", error);
    alert("Could not load pending opportunities.");
    return;
  }

  if (!jobs.length) {
    dashboardContent.innerHTML = `
      <h2>Pending Opportunities</h2>
      <p>There are currently no pending submissions.</p>
      <button onclick="showSection('admin')">Back to Admin Panel</button>
    `;
    return;
  }

  dashboardContent.innerHTML = `
    <h2>⏳ Pending Opportunities</h2>
    ${jobs.map(job => `
      <div class="dashboard-card">
        <h3>${escapeHTML(job.title)}</h3>
        <p><strong>Category:</strong> ${escapeHTML(job.category || "Not specified")}</p>
        <p><strong>Location:</strong> ${escapeHTML(job.location || "Not specified")}</p>
        <p><strong>Pay / Budget:</strong> ${job.pay ? "UGX " + escapeHTML(job.pay) : "Not specified"}</p>
        <p>${escapeHTML(job.description || "")}</p>
        <p><strong>Status:</strong> ${escapeHTML(job.status)}</p>
        <button
  class="btn btn-primary"
  onclick="approveJob('${job.id}')">
  Approve Opportunity
</button>
<button
  class="btn btn-danger"
  onclick="rejectJob('${job.id}')">
  Reject Opportunity
</button>
      </div>
    `).join("")}
    <button onclick="showSection('admin')">Back to Admin Panel</button>
  `;
}

async function approveJob(jobId) {
  if (!isProofnearAdmin) {
    alert("Administrator access required.");
    return;
  }

  const confirmed = confirm(
    "Are you sure you want to approve this opportunity?"
  );

  if (!confirmed) return;

  const { data, error } = await supabaseClient.rpc(
    "approve_proofnear_job",
    { target_job_id: jobId }
  );

  if (error) {
    alert("Approval failed: " + error.message);
    return;
  }

  if (data === true) {
    alert("Opportunity approved successfully! 🎉");
    await loadPendingJobs();
  } else {
    alert("This opportunity was not pending or has already been processed.");
  }
}
async function rejectJob(jobId) {
  if (!isProofnearAdmin) {
    alert("Administrator access required.");
    return;
  }

  const confirmed = confirm(
    "Are you sure you want to reject this opportunity?"
  );

  if (!confirmed) return;

  const { data, error } = await supabaseClient.rpc(
    "reject_proofnear_job",
    { target_job_id: jobId }
  );

  if (error) {
    alert("Rejection failed: " + error.message);
    return;
  }

  if (data === true) {
    alert("Opportunity rejected successfully.");
    await loadPendingJobs();
  } else {
    alert("This opportunity was already processed.");
  }
}
async function loadApprovedJobs() {
  if (!isProofnearAdmin) {
    alert("Administrator access required.");
    return;
  }

  const { data: jobs, error } = await supabaseClient
    .from("jobs")
    .select("id, title, category, location, description, pay, created_at, status, availability_status")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Approved jobs error:", error);
    alert("Could not load approved opportunities.");
    return;
  }

  if (!jobs.length) {
    dashboardContent.innerHTML = `
      <h2>Approved Opportunities</h2>
      <p>There are currently no approved opportunities.</p>
      <button onclick="showSection('admin')">
        Back to Admin Panel
      </button>
    `;
    return;
  }

  dashboardContent.innerHTML = `
    <h2>✅ Approved Opportunities</h2>

    ${jobs.map(job => `
      <div class="dashboard-card">
        <h3>${escapeHTML(job.title)}</h3>
        <p><strong>Category:</strong>
          ${escapeHTML(job.category || "Not specified")}
        </p>
        <p><strong>Location:</strong>
          ${escapeHTML(job.location || "Not specified")}
        </p>
        <p>${escapeHTML(job.description || "")}</p>
        <p><strong>Approval:</strong> APPROVED</p>
<p><strong>Availability:</strong> ${escapeHTML(job.availability_status || "OPEN")}</p>
<div>
  <button onclick="setJobAvailability('${job.id}', 'OPEN')">
    Mark OPEN
  </button>

  <button onclick="setJobAvailability('${job.id}', 'FILLED')">
    Mark FILLED
  </button>

  <button onclick="setJobAvailability('${job.id}', 'ON HOLD')">
    Mark ON HOLD
  </button>
</div>
        <p><strong>Published:</strong>
          ${new Date(job.created_at).toLocaleDateString()}
        </p>
      </div>
    `).join("")}

    <button onclick="showSection('admin')">
      Back to Admin Panel
    </button>
  `;
}
async function setJobAvailability(jobId, newStatus) {
  if (!isProofnearAdmin) {
    alert("Administrator access required.");
    return;
  }

  const confirmed = confirm(
    "Change this opportunity's availability to " + newStatus + "?"
  );

  if (!confirmed) return;

  const { data, error } = await supabaseClient.rpc(
    "set_proofnear_job_availability",
    {
      target_job_id: jobId,
      new_availability: newStatus
    }
  );

  if (error) {
    alert("Update failed: " + error.message);
    return;
  }

  if (data === true) {
    alert("Availability updated to " + newStatus + "! 🎉");
    await loadApprovedJobs();
  } else {
    alert("Opportunity could not be updated.");
  }
}
initializeDashboard();

async function loadPendingPayments() {
  if (!isProofnearAdmin) {
    alert("Administrator access required.");
    return;
  }

  dashboardContent.innerHTML = `
    <h2>💰 Pending Payments</h2>
    <p>Loading payment records...</p>
  `;

  const { data: payments, error } = await supabaseClient
    .rpc("get_proofnear_pending_payments_v2");

  if (error) {
    console.error("Payment loading error:", error);
    dashboardContent.innerHTML = `
      <h2>Payment Verification</h2>
      <p>Could not load payments: ${escapeHTML(error.message)}</p>
      <button onclick="showSection('admin')">
        Back to Admin Panel
      </button>
    `;
    return;
  }

  if (!payments || payments.length === 0) {
    dashboardContent.innerHTML = `
      <h2>💰 Pending Payments</h2>
      <p>No pending payments currently.</p>
      <button onclick="showSection('admin')">
        Back to Admin Panel
      </button>
    `;
    return;
  }

  dashboardContent.innerHTML = `
    <h2>💰 Pending Payments</h2>

    ${payments.map(payment => `
      <div class="dashboard-card">
        <h3>${escapeHTML(payment.opportunity_title)}</h3>

        <p><strong>Payment Type:</strong>
          ${payment.payment_type === "posting"
            ? "Opportunity Posting"
            : payment.payment_type === "contact_unlock"
              ? "Contact Unlock"
              : "Unknown"}
        </p>

        <p><strong>Payment Date:</strong>
          ${new Date(payment.created_at).toLocaleString()}
        </p>

        <p><strong>Amount:</strong>
          UGX ${escapeHTML(payment.amount)}
        </p>

        <p><strong>Method:</strong>
          ${escapeHTML(payment.payment_method)}
        </p>

        <p><strong>Transaction Reference:</strong>
          ${escapeHTML(payment.transaction_reference)}
        </p>

        <button
          class="btn btn-primary"
          onclick="verifyProofnearPayment('${payment.payment_id}')">
          ✅ Verify Payment
        </button>

        <button
          class="btn btn-danger"
          onclick="rejectProofnearPayment('${payment.payment_id}')">
          ❌ Reject Payment
        </button>
      </div>
    `).join("")}

    <button onclick="showSection('admin')">
      Back to Admin Panel
    </button>
  `;
}

async function verifyProofnearPayment(paymentId) {
  if (!isProofnearAdmin) {
    alert("Administrator access required.");
    return;
  }

  const confirmed = confirm(
    "Have you checked and confirmed this payment in your MTN or Airtel account?"
  );

  if (!confirmed) return;

  const { data, error } = await supabaseClient.rpc(
    "verify_proofnear_payment",
    {
      target_payment_id: paymentId
    }
  );

  if (error) {
    alert("Verification failed: " + error.message);
    return;
  }

  if (data === true) {
    alert("Payment verified successfully!");
    loadPendingPayments();
  } else {
    alert("Payment was not verified. Please refresh and check its status.");
  }
}

async function rejectProofnearPayment(paymentId) {
  if (!isProofnearAdmin) {
    alert("Administrator access required.");
    return;
  }

  const confirmed = confirm(
    "Are you sure you want to reject this payment?"
  );

  if (!confirmed) return;

  const { data, error } = await supabaseClient.rpc(
    "reject_proofnear_payment",
    {
      target_payment_id: paymentId
    }
  );

  if (error) {
    alert("Payment rejection failed: " + error.message);
    return;
  }

  if (data === true) {
    alert("Payment rejected successfully!");
    loadPendingPayments();
  } else {
    alert("Payment was not rejected. Please refresh and check its status.");
  }
}


function toggleSidebar() {
  const sidebar = document.getElementById("dashboardSidebar");

  if (!sidebar) {
    alert("Sidebar not found!");
    return;
  }

  sidebar.classList.toggle("expanded");

  console.log(
    "Sidebar expanded:",
    sidebar.classList.contains("expanded")
  );
}


