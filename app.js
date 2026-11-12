const SUPABASE_URL = "https://rmprzvgxuwtkyfhrevki.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Z_6UK4b8hG3u3sGdV2BFKA_bjd0eYoD";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const sampleListings = [
  {
    id: 1,
    type: "job",
    title: "Part-time Sales Assistant",
    workType: "PART-TIME",
    category: "Sales",
    location: "Kampala",
    pay: "UGX 250,000 / month",
    description: "Assist customers, arrange products and support daily shop operations. Good communication skills are important.",
    posted: "Sample preview",
    isPreview: true
  },
  {
    id: 2,
    type: "job",
    title: "Remote Data Entry Assistant",
    workType: "REMOTE",
    category: "Online work",
    location: "Work from home",
    pay: "UGX 300,000 / month",
    description: "A sample remote opportunity involving data entry, organising information and basic computer tasks.",
    posted: "Sample preview",
    isPreview: true
  },
  {
    id: 3,
    type: "job",
    title: "Restaurant Service Assistant",
    workType: "PART-TIME",
    category: "Hospitality",
    location: "Entebbe",
    pay: "UGX 15,000 / day",
    description: "Support restaurant operations, serve customers and help maintain a clean working environment.",
    posted: "Sample preview",
    isPreview: true
  },
  {
    id: 4,
    type: "job",
    title: "Graduate Trainee",
    workType: "INTERNSHIP",
    category: "Career development",
    location: "Kampala",
    pay: "Allowance to be agreed",
    description: "A sample entry-level opportunity for someone interested in gaining workplace experience.",
    posted: "Sample preview",
    isPreview: true
  },
  {
    id: 5,
    type: "job",
    title: "Delivery Rider",
    workType: "FULL-TIME",
    category: "Transport",
    location: "Wakiso",
    pay: "UGX 500,000 / month",
    description: "Assist with local deliveries, handle packages carefully and communicate with customers.",
    posted: "Sample preview",
    isPreview: true
  },
  {
    id: 6,
    type: "service",
    title: "Home Cleaning Service",
    workType: "SERVICE REQUEST",
    category: "Home services",
    location: "Kampala",
    pay: "UGX 30,000 / visit",
    description: "A sample request for someone experienced in cleaning and maintaining a home.",
    posted: "Sample preview",
    isPreview: true
  }
];

let activeFilter = "all";

const grid = document.getElementById("listingGrid");
const empty = document.getElementById("emptyState");
const dialog = document.getElementById("actionDialog");
const modalContent = document.getElementById("modalContent");
const toast = document.getElementById("toast");

document.getElementById("year").textContent =
  new Date().getFullYear();



let approvedListings = [];
let currentListings = sampleListings;
let filteredListings = sampleListings;

const LISTINGS_PER_PAGE = 8;
let visibleListingsCount = 8;

async function loadApprovedOpportunities() {
  const { data: jobs, error } = await supabaseClient
    .from("jobs")
    .select("id, title, category, location, description, pay, created_at, status, availability_status")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Could not load opportunities:", error.message);
    approvedListings = [];
  } else {
    approvedListings = (jobs || []).map(job => ({
      id: job.id,
      type: "job",
      title: job.title,
      category: job.category || "General",
      workType: job.category || "OPPORTUNITY",
      location: job.location || "Location not specified",
      pay: job.pay ? "UGX " + job.pay : "Contact publisher for details",
      description: job.description || "",
      availability_status: job.availability_status || "OPEN",
      isPreview: false
    }));
  }

  currentListings = [
    ...approvedListings,
    ...sampleListings
  ];

  searchListings();
}

function renderListings(items = currentListings, reset = true) {
  if (reset) {
    visibleListingsCount = LISTINGS_PER_PAGE;
  }

  filteredListings = items;
  grid.innerHTML = "";

  const visibleItems = items.slice(0, visibleListingsCount);

  const countElement = document.getElementById("opportunityCount");

  if (countElement) {
    countElement.textContent =
      `Showing ${visibleItems.length} of ${items.length} displayed listings · ${approvedListings.length} approved opportunities`;
  }

  empty.hidden = items.length > 0;

  visibleItems.forEach(item => {
    const card = document.createElement("article");
    card.className = "listing-card";

    const typeLabel = item.type === "job"
      ? "JOB OPPORTUNITY"
      : "SERVICE REQUEST";

    card.innerHTML = `
      <div class="listing-top">
        <span class="listing-type ${item.type === "service" ? "service" : ""}">
          ${typeLabel}
        </span>
        ${item.workType ? `
          <span class="work-type-badge">
            ${escapeHTML(item.workType)}
          </span>
        ` : ""}
        ${!item.isPreview ? `
          <span class="availability-badge">
            ${escapeHTML(item.availability_status || "OPEN")}
          </span>
        ` : ""}
      </div>

      <h3>${escapeHTML(item.title)}</h3>

      <p>${escapeHTML(item.description)}</p>

      <div class="listing-meta">
        <span>⌖ ${escapeHTML(item.location)}</span>
      </div>

      <div class="listing-bottom">
        <strong>${escapeHTML(item.pay)}</strong>
        <button class="text-button" data-detail="${item.id}">
          View details →
        </button>
      </div>

      ${item.isPreview ? `
        <p class="preview-note">PROOFNEAR SAMPLE PREVIEW</p>
      ` : ""}
    `;

    grid.appendChild(card);
  });

  const loadMoreWrap = document.getElementById("loadMoreWrap");

  if (loadMoreWrap) {
    loadMoreWrap.hidden = visibleItems.length >= items.length;
  }
}

document.getElementById("loadMoreBtn").addEventListener("click", () => {
  visibleListingsCount += LISTINGS_PER_PAGE;
  renderListings(filteredListings, false);
});

loadApprovedOpportunities();
// PROOFNEAR ACCOUNT REGISTRATION

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

function searchListings() {
  const keyword = document.getElementById("keyword").value.trim().toLowerCase();
const location = document.getElementById("location").value.trim().toLowerCase();
  const type = document.getElementById("type").value || activeFilter;

  const results = currentListings.filter(item => {
    const text = `${item.title} ${item.category} ${item.description} ${item.location}`.toLowerCase();

    return (
      (!keyword || text.includes(keyword)) &&
      (!location || String(item.location || "").trim().toLowerCase().includes(location)) &&
      (type === "all" || !type || item.type === type)
    );
  });

  renderListings(results);
}

document.getElementById("searchForm").addEventListener("submit", e => { e.preventDefault(); searchListings(); document.getElementById("jobs").scrollIntoView({behavior:"smooth"}); });
document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  tab.classList.add("active"); activeFilter = tab.dataset.filter; searchListings();
}));
document.querySelectorAll(".category-card").forEach(card => card.addEventListener("click", () => {
  document.getElementById("keyword").value = card.dataset.category;
  document.getElementById("type").value = "";
  activeFilter = "all"; document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.filter === "all"));
  searchListings(); document.getElementById("jobs").scrollIntoView({behavior:"smooth"});
}));
function showToast(message) {
  toast.textContent = message; toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}
function openModal(kind) {
  const forms = {
    post: `<h2>Post an opportunity</h2><p>Submit your opportunity for review. It will appear publicly after approval.</p><form class="form-stack" id="postForm">
      <label>What are you posting?
  <select name="type" id="postType">
    <option value="job">A job vacancy</option>
    <option value="service">A request for a service provider</option>
  </select>
</label>
      <label>Title<input name="title" required placeholder="e.g. Need an electrician"></label>
      <label>Location
  <input name="location" type="text" required
  placeholder="Enter your district, town or area"
  list="ugandaLocations">
  <datalist id="ugandaLocations">
    <option value="Kampala">
    <option value="Wakiso">
    <option value="Entebbe">
    <option value="Jinja">
    <option value="Mbarara">
    <option value="Gulu">
    <option value="Mbale">
  </datalist>
</label>
      <p style="font-size:20px; color:#16a34a;">
  <strong>Amount to pay: UGX 1,000</strong>
</p>

  <p id="postAirtelDetails">
  <strong>Airtel Money</strong><br>
  Merchant Code: 7292108<br>
  Merchant Name: PROOFNEAR
</p>

  <p id="postMtnDetails">
  <strong>MTN Mobile Money</strong><br>
  Number: 0760299148<br>
  Recipient: Malinzi John
</p>

  <p><strong>Need help?</strong><br>
  WhatsApp Support: 0749383502</p>

  <p>After paying, enter your transaction reference below.</p>
</div>

<label>Payment method
  <select name="payment_method" id="postPaymentMethod" required>
    <option value="">Choose payment method</option>
    <option value="MTN">MTN Mobile Money</option>
    <option value="AIRTEL">Airtel Money</option>
  </select>
</label>

<label>Transaction reference
  <input
    name="transaction_reference"
    required
    placeholder="Enter payment transaction ID">
</label>
      <label>Description<textarea name="description" required placeholder="Describe the work, skills needed and timing"></textarea></label>
      <label>Contact phone<input name="phone" required type="tel" placeholder="e.g. 07..."></label>
      <button class="btn btn-primary" type="submit">Post my advert</button></form>`,
    worker: `<h2>Create a worker profile</h2><p>Introduce your skills so people can discover the work you offer.</p><form class="form-stack" id="workerForm">
      <label>Your name<input required name="name" placeholder="Your name"></label><label>Main skill<input required name="skill" placeholder="e.g. Electrician"></label>
      <label>Location
  <input name="location" type="text" required
  placeholder="Enter your district, town or area"
  list="workerLocations">
  <datalist id="workerLocations">
    <option value="Kampala">
    <option value="Wakiso">
    <option value="Entebbe">
    <option value="Jinja">
    <option value="Mbarara">
    <option value="Gulu">
    <option value="Mbale">
  </datalist>
</label>
      <label>Phone number<input required name="phone" type="tel" placeholder="Your contact number"></label>
      <button class="btn btn-primary" type="submit">Preview my profile</button></form>`,
    signin: `
<h2>Welcome to PROOFNEAR</h2>

<div class="form-stack">
  <label>Full name
    <input id="authName" placeholder="Your full name">
  </label>

  <label>Email address
    <input id="authEmail" type="email"
      placeholder="Enter your email" required>
  </label>

  <label>Password
    <input id="authPassword" type="password"
      placeholder="At least 6 characters" required>
  </label>

  <label>Account type
    <select id="authType">
      <option value="seeker">Seeker</option>
      <option value="provider">Provider</option>
      <option value="both">Both</option>
    </select>
  </label>

  <button class="btn btn-primary" id="registerBtn" type="button">
    Create account
  </button>

  <button class="btn" id="loginBtn" type="button">
    Already registered? Log in
  </button>

  <p id="authMessage" class="form-hint"></p>
</div>`
  };
  modalContent.innerHTML = forms[kind] || forms.post;
  const postTypeSelect = document.getElementById("postType");
const postingFee = document.getElementById("postingFee");

if (postTypeSelect && postingFee) {
  postTypeSelect.addEventListener("change", () => {
    postingFee.textContent =
      postTypeSelect.value === "job"
        ? "Posting fee: UGX 1,000"
        : "Posting fee: UGX 5,000";
  });
}
  if (postTypeSelect && postingFee) {
  postTypeSelect.addEventListener("change", () => {
    postingFee.textContent =
      postTypeSelect.value === "job"
        ? "Posting fee: UGX 1,000"
        : "Posting fee: UGX 5,000";
  });
}
  const postPaymentMethod = document.getElementById("postPaymentMethod");
const postAirtelDetails = document.getElementById("postAirtelDetails");
const postMtnDetails = document.getElementById("postMtnDetails");

if (postPaymentMethod && postAirtelDetails && postMtnDetails) {
  function updatePostPaymentDisplay() {
    postAirtelDetails.style.border =
      postPaymentMethod.value === "AIRTEL"
        ? "2px solid #16a34a"
        : "1px solid #ddd";

    postMtnDetails.style.border =
      postPaymentMethod.value === "MTN"
        ? "2px solid #16a34a"
        : "1px solid #ddd";

    postAirtelDetails.style.padding = "10px";
    postMtnDetails.style.padding = "10px";
  }

  postPaymentMethod.addEventListener("change", updatePostPaymentDisplay);
  updatePostPaymentDisplay();
}
  dialog.showModal();
  const registerBtn = document.getElementById("registerBtn");
if (registerBtn) registerBtn.onclick = registerUser;

const loginBtn = document.getElementById("loginBtn");
if (loginBtn) loginBtn.onclick = loginUser;
  const postForm = document.getElementById("postForm");
  if (postForm) postForm.addEventListener("submit", async e => {
  e.preventDefault();

  const data = Object.fromEntries(
    new FormData(postForm).entries()
  );

  const { data: sessionData, error: sessionError } =
    await supabaseClient.auth.getSession();

  if (sessionError || !sessionData.session) {
    showToast("Please sign in before posting.");
    dialog.close();
    openModal("signin");
    return;
  }

  const category = data.type === "job"
    ? "Employment"
    : "Home services";

  const { data: newJobId, error } = await supabaseClient.rpc(
    "submit_proofnear_job",
    {
      target_title: data.title,
      target_location: data.location,
      target_description: data.description,
      target_category: category,
      target_phone: data.phone,
      target_pay: data.pay || "Pay to be agreed"
    }
  );

  if (error) {
    console.error("Posting failed:", error.message);
    showToast("Submission failed: " + error.message);
    return;
  }
    const { data: paymentId, error: paymentError } =
  await supabaseClient.rpc(
    "submit_proofnear_payment",
    {
      target_job_id: newJobId,
      target_payment_method: data.payment_method,
      target_transaction_reference: data.transaction_reference
    }
  );

if (paymentError) {
  console.error("Payment submission failed:", paymentError.message);

  showToast(
    "Opportunity saved, but payment details failed: " +
    paymentError.message
  );
  return;
}

console.log("Payment submitted:", paymentId);

  postForm.reset();
  dialog.close();

  showToast("Submitted successfully! Awaiting admin approval.");

  console.log("Submitted opportunity:", newJobId);
});

    /* OPEN TALENT CHALLENGE ENTRY FORM */

  const workerForm = document.getElementById("workerForm");
  if (workerForm) workerForm.addEventListener("submit", e => {
    e.preventDefault(); const data = Object.fromEntries(new FormData(workerForm).entries());
    modalContent.innerHTML = `<h2>Profile preview</h2><p><b>${escapeHTML(data.name)}</b> · ${escapeHTML(data.skill)}</p><p>${escapeHTML(data.location)} · ${escapeHTML(data.phone)}</p><button class="btn btn-primary" id="done">Close preview</button>`;
    document.getElementById("done").onclick = () => dialog.close();
  });
  const closeInfo = document.getElementById("closeInfo");
  if (closeInfo) closeInfo.onclick = () => dialog.close();
}

async function openChallengeEntry(challengeId) {
  const { data: sessionData, error: sessionError } =
    await supabaseClient.auth.getSession();

  if (sessionError || !sessionData.session) {
    showToast("Please sign in to join this challenge.");
    openModal("signin");
    return;
  }

  const { data: challenge, error } = await supabaseClient
    .from("talent_challenges")
    .select("id, title, description, rules, ends_at, status")
    .eq("id", challengeId)
    .eq("status", "published")
    .single();

  if (error || !challenge) {
    showToast("This challenge is unavailable.");
    return;
  }

  modalContent.innerHTML = `
    <h2>Join Challenge</h2>
    <h3>${escapeHTML(challenge.title)}</h3>
    <p>${escapeHTML(challenge.description || "")}</p>
    <p><strong>Rules:</strong>
      ${escapeHTML(challenge.rules || "Follow the challenge instructions.")}
    </p>

    <form id="challengeEntryForm" class="form-stack">
      <label>Entry title
        <input name="title" required
          placeholder="Give your entry a title">
      </label>

      <label>Describe your entry
        <textarea name="description" required
          placeholder="Tell us about your entry"></textarea>
      </label>

      <label>Upload your entry
        <input name="media" type="file" required
          accept="image/jpeg,image/png,image/webp,audio/mpeg,audio/mp4,audio/wav,audio/ogg,video/mp4,video/webm,video/quicktime">
      </label>

      <button class="btn btn-primary" type="submit">
        Submit Entry
      </button>

      <p id="challengeEntryMessage" class="form-hint"></p>
    </form>
  `;

  dialog.showModal();

  const entryForm = document.getElementById("challengeEntryForm");

  entryForm.addEventListener("submit", async function(e) {
    e.preventDefault();

    const submitButton = entryForm.querySelector(
      'button[type="submit"]'
    );

    const message = document.getElementById(
      "challengeEntryMessage"
    );

    const user = sessionData.session.user;
    const formData = new FormData(entryForm);

    const title = formData.get("title").trim();
    const description = formData.get("description").trim();
    const file = formData.get("media");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "audio/mpeg",
      "audio/mp4",
      "audio/wav",
      "audio/ogg",
      "video/mp4",
      "video/webm",
      "video/quicktime"
    ];

    if (!file || !allowedTypes.includes(file.type)) {
      message.textContent =
        "Please select a supported photo, audio or video file.";
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      message.textContent = "Your file must not exceed 50 MB.";
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Uploading entry...";

    try {
      const extension = file.name
        .split(".")
        .pop()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

      const filePath =
        `${user.id}/challenge-entries/${Date.now()}.${extension}`;

      const { error: uploadError } = await supabaseClient
        .storage
        .from("talent-media")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabaseClient
        .storage
        .from("talent-media")
        .getPublicUrl(filePath);

      const { error: insertError } = await supabaseClient
        .from("challenge_entries")
        .insert({
          challenge_id: challengeId,
          creator_id: user.id,
          title: title,
          description: description,
          media_url: publicData.publicUrl,
          status: "pending"
        });

      if (insertError) throw insertError;

      message.textContent =
        "Your challenge entry was submitted successfully!";

      entryForm.reset();
      submitButton.textContent = "Submitted successfully";

      showToast("Your entry is awaiting approval.");

    } catch (error) {
      console.error("Challenge entry submission:", error);

      message.textContent =
        "Submission failed: " + error.message;

      submitButton.disabled = false;
      submitButton.textContent = "Submit Entry";
    }
  });
}

function saveLogin(){ var n=document.getElementById("authName").value; var p=document.getElementById("authPhone").value; if(!n||!p){alert("Type name and phone dear");return;} localStorage.setItem("user",n); document.getElementById("authBtn").innerText="My Account: "+n; document.getElementById("signin").close(); showToast("Welcome "+n+"! Account saved."); }

async function openListingDetails(item) {
  const isRealJob = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(item.id));

  modalContent.innerHTML = `
    <h2>${escapeHTML(item.title)}</h2>
    <p>${escapeHTML(item.description || "")}</p>
    <p>
      <b>Location:</b> ${escapeHTML(item.location || "")}<br>
      <b>Pay:</b> ${escapeHTML(item.pay || "To be agreed")}
    </p>
    <div id="contactUnlockArea">
      <p>Checking contact access...</p>
    </div>
    <button class="btn btn-primary" id="detailClose">Close</button>
  `;

  if (!dialog.open) dialog.showModal();

  document.getElementById("detailClose").onclick = () => dialog.close();

  const area = document.getElementById("contactUnlockArea");

  if (!isRealJob) {
  area.innerHTML = `
    <div class="sample-details">
      <p><strong>PROOFNEAR SAMPLE PREVIEW</strong></p>

      <p><strong>Work type:</strong> ${escapeHTML(item.workType || "Not specified")}</p>

      <p><strong>Category:</strong> ${escapeHTML(item.category || "General")}</p>

      <p><strong>Availability:</strong> ${escapeHTML(item.posted || "Sample opportunity")}</p>

      <p>These are example opportunities demonstrating what you can discover on PROOFNEAR. They are not confirmed vacancies.</p>

      <button class="btn btn-primary" id="sampleSignIn">
        Sign in to PROOFNEAR
      </button>
    </div>
  `;

  document.getElementById("sampleSignIn").onclick = () => {
    dialog.close();
    openModal("signin");
  };

  return;
}

  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) {
    area.innerHTML = `
      <p>Sign in to unlock this opportunity's contact.</p>
      <button class="btn btn-primary" id="unlockSignIn">Sign in</button>
    `;
    document.getElementById("unlockSignIn").onclick = () => {
      dialog.close();
      openModal("signin");
    };
    return;
  }

  if (item.user_id === user.id) {
    area.innerHTML = `<p>This is your own opportunity.</p>`;
    return;
  }

  const { data: status, error } = await supabaseClient.rpc(
    "get_proofnear_contact_unlock_status",
    { target_job_id: item.id }
  );

  if (error) {
    area.innerHTML = `<p>Could not check payment: ${escapeHTML(error.message)}</p>`;
    return;
  }

  if (status === "verified") {
    const { data: phone, error: phoneError } = await supabaseClient.rpc(
      "get_proofnear_unlocked_contact",
      { target_job_id: item.id }
    );

    if (phoneError) {
      area.innerHTML = `<p>${escapeHTML(phoneError.message)}</p>`;
      return;
    }

    const cleanPhone = String(phone || "").replace(/\D/g, "");
    const whatsappNumber = cleanPhone.startsWith("0")
      ? "256" + cleanPhone.slice(1)
      : cleanPhone;

    area.innerHTML = `
      <p>Payment verified. Contact unlocked!</p>
      <a class="btn btn-primary"
         href="https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hello, I saw your opportunity: " + item.title + " on PROOFNEAR. I am interested.")}"
         target="_blank" rel="noopener"
         style="display:block;text-align:center;text-decoration:none;">
         Contact on WhatsApp
      </a>
    `;
    return;
  }

  if (status === "pending") {
  area.innerHTML = `<p>Your UGX 500 payment is awaiting administrator verification.</p>`;
  return;
}

  showContactUnlockForm(item, status === "rejected"
    ? "Your previous payment was rejected. You may submit a new payment."
    : "");
}

function showContactUnlockForm(item, message = "") {
  const area = document.getElementById("contactUnlockArea");

  area.innerHTML = `
    <h3>Unlock Contact – UGX 500</h3>
    <p>${escapeHTML(message)}</p>
    <div class="payment-instructions">
  <h4>Payment Instructions</h4>

  <p><strong>Amount to pay: UGX 500</strong></p>

  <p id="unlockAirtelDetails">
  <strong>Airtel Money:</strong><br>
  Merchant Code: 7292108<br>
  Merchant Name: PROOFNEAR
</p>

  <p id="unlockMtnDetails">
  <strong>MTN Mobile Money:</strong><br>
  Number: 0760299148<br>
  Recipient: Malinzi John
</p>

  <p>After payment, enter your transaction reference below.</p>

  <p><strong>Need help?</strong><br>
  WhatsApp Support: 0749383502</p>
</div>

    <label>Payment method</label>
    <select id="unlockPaymentMethod" required>
      <option value="MTN">MTN Mobile Money</option>
      <option value="AIRTEL">Airtel Money</option>
    </select>

    <label>Transaction reference</label>
    <input id="unlockTransactionReference"
      type="text" placeholder="Enter transaction reference" required>

    <button class="btn btn-primary" id="submitUnlockPayment">
      Submit Payment Details
    </button>
  `;

  const unlockMethod = document.getElementById("unlockPaymentMethod");
const airtelDetails = document.getElementById("unlockAirtelDetails");
const mtnDetails = document.getElementById("unlockMtnDetails");

function updateUnlockPaymentDisplay() {
  airtelDetails.style.border =
    unlockMethod.value === "AIRTEL" ? "2px solid #16a34a" : "1px solid #ddd";

  mtnDetails.style.border =
    unlockMethod.value === "MTN" ? "2px solid #16a34a" : "1px solid #ddd";

  airtelDetails.style.padding = "10px";
  mtnDetails.style.padding = "10px";
}

unlockMethod.addEventListener("change", updateUnlockPaymentDisplay);
updateUnlockPaymentDisplay();
  document.getElementById("submitUnlockPayment").onclick = async () => {
    const method = document.getElementById("unlockPaymentMethod").value;
    const reference = document.getElementById("unlockTransactionReference").value.trim();
    const button = document.getElementById("submitUnlockPayment");

    if (!reference) {
      alert("Please enter your transaction reference.");
      return;
    }

    button.disabled = true;
    button.textContent = "Submitting...";

    const { data, error } = await supabaseClient.rpc(
      "submit_proofnear_contact_unlock",
      {
        target_job_id: item.id,
        target_payment_method: method,
        target_transaction_reference: reference
      }
    );

    if (error) {
      alert("Payment submission failed: " + error.message);
      button.disabled = false;
      button.textContent = "Submit Payment Details";
      return;
    }

    area.innerHTML = `
      <p>Payment details submitted successfully.</p>
      <p>Your contact will unlock after administrator verification.</p>
    `;
  };
}

document.addEventListener("click", e => {
  const opener = e.target.closest("[data-open]");
  if (opener) openModal(opener.dataset.open);

  const detail = e.target.closest("[data-detail]");
  if (detail) {
    const item = currentListings.find(
      x => String(x.id) === String(detail.dataset.detail)
    );

    if (item) openListingDetails(item);
  }
});

const menuToggle = document.getElementById("menuToggle");

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    const nav = document.querySelector(".desktop-nav");
    if (!nav) return;

    const visible = nav.style.display === "flex";
    nav.style.display = visible ? "none" : "flex";
    nav.style.position = visible ? "" : "absolute";
    nav.style.top = "68px";
    nav.style.left = "0";
    nav.style.right = "0";
    nav.style.padding = "18px 24px";
    nav.style.background = "#fff";
    nav.style.flexDirection = "column";
  });
}

renderListings();
// PROOFNEAR ACCOUNT REGISTRATION

async function registerUser() {
  const name = document.getElementById("authName").value.trim();
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  const accountType = document.getElementById("authType").value;
  const message = document.getElementById("authMessage");

  if (!name || !email || password.length < 6) {
    message.textContent = "Enter your name, email and a password of at least 6 characters.";
    return;
  }

  message.textContent = "Creating your account...";

  const { data, error } = await supabaseClient.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        full_name: name,
        account_type: accountType
      }
    }
  });

  if (error) {
    message.textContent = error.message;
    return;
  }

  message.textContent = data.session
    ? "Account created successfully! Welcome to PROOFNEAR."
    : "Account created! Check your email to confirm your account.";
}


// PROOFNEAR LOGIN

async function loginUser() {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  const message = document.getElementById("authMessage");

  if (!email || !password) {
    message.textContent = "Enter your email and password.";
    return;
  }

  message.textContent = "Logging in...";

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    message.textContent = error.message;
    return;
  }

  const name =
    data.user.user_metadata.full_name || email.split("@")[0];

  const accountBtn = document.getElementById("accountBtn");
  const mobileBtn = document.getElementById("mobileAccountBtn");

  if (accountBtn) accountBtn.textContent = name;
  if (mobileBtn) mobileBtn.textContent = name;

  message.textContent = "Welcome back, " + name + "!";

  showToast("Welcome back, " + name + "!");
}
// RESTORE LOGGED-IN USER

async function restoreUserSession() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    console.error("Session error:", error.message);
    return;
  }

  const user = data.session?.user;

  const accountBtn = document.getElementById("accountBtn");
  const mobileBtn = document.getElementById("mobileAccountBtn");

  if (user) {
    const name =
      user.user_metadata.full_name || user.email.split("@")[0];

    if (accountBtn) accountBtn.textContent = name;
    if (mobileBtn) mobileBtn.textContent = name;
  }
}

restoreUserSession();
// PROOFNEAR MY ACCOUNT DASHBOARD



async function openAccount() {
  try {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
      console.error("Account error:", error);
      alert("Unable to check your account. Please try again.");
      return;
    }

    if (!data.session) {
      openModal("signin");
      return;
    }

    window.location.href = "dashboard.html";

  } catch (err) {
    console.error("Open account failed:", err);
    alert("Something went wrong. Please try again.");
  }
}

/* PROOFNEAR COMPANY SLIDER */

let companySlideIndex = 0;
let companySlideTimer;

function showCompanySlide(index) {
  const slides = document.querySelectorAll(".company-slide");
  const dotsContainer = document.getElementById("companyDots");

  if (!slides.length || !dotsContainer) return;

  companySlideIndex = (index + slides.length) % slides.length;

  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === companySlideIndex);
  });

  dotsContainer.innerHTML = "";

  slides.forEach((slide, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "company-dot" + (i === companySlideIndex ? " active" : "");
    dot.setAttribute("aria-label", "Show slide " + (i + 1));

    dot.addEventListener("click", () => {
      showCompanySlide(i);
      restartCompanySlideTimer();
    });

    dotsContainer.appendChild(dot);
  });
}

function changeCompanySlide(direction) {
  showCompanySlide(companySlideIndex + direction);
  restartCompanySlideTimer();
}

function restartCompanySlideTimer() {
  clearInterval(companySlideTimer);

  companySlideTimer = setInterval(() => {
    showCompanySlide(companySlideIndex + 1);
  }, 5000);
}

document.addEventListener("DOMContentLoaded", () => {
  showCompanySlide(0);
  restartCompanySlideTimer();
});
/* PROOFNEAR MOBILE MENU */

function toggleMobileMenu() {
  const menu = document.getElementById("mobileMenu");
  const button = document.getElementById("menuToggle");

  if (!menu || !button) return;

  menu.classList.toggle("open");

  button.textContent = menu.classList.contains("open") ? "✕" : "☰";
}


/* =================================
   PROOFNEAR WELCOME EXPERIENCE
================================= */

(function () {
  const welcomeScreen = document.getElementById("welcomeScreen");
  const welcomeVoiceBtn = document.getElementById("welcomeVoiceBtn");

  if (!welcomeScreen) {
    console.error("PROOFNEAR: Welcome screen not found.");
    return;
  }

  const welcomeMessage =
    "Welcome to PROOFNEAR. Your opportunities, your connections, your future.";

  if (welcomeVoiceBtn) {
    welcomeVoiceBtn.onclick = function () {
      if (!window.speechSynthesis) {
        alert("Voice is not supported by this browser.");
        return;
      }

      const speech = new SpeechSynthesisUtterance(welcomeMessage);
      speech.lang = "en-US";
      speechSynthesis.cancel();
      speechSynthesis.speak(speech);
    };
  }

  setTimeout(function () {
  welcomeScreen.classList.add("welcome-hide");
}, 6000);
})();
/* =================================
   PROOFNEAR SERVICE WORKER
================================= */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js")
      .then(registration => {
        console.log("PROOFNEAR Service Worker registered", registration);
      })
      .catch(error => {
        console.error("Service Worker error:", error);
      });
  });
}

/* =====================================
   PROOFNEAR AUTOMATIC HERO SLIDER
===================================== */
(function () {
  const slider = document.getElementById("homeSlider");
  if (!slider) return;

  const slides = slider.querySelectorAll(".hero-slide");
  const dots = slider.querySelectorAll(".slider-dot");
  const previous = slider.querySelector(".slider-prev");
  const next = slider.querySelector(".slider-next");

  if (!slides.length) return;

  let currentSlide = 0;
  let slideTimer;

  function showSlide(index) {
    currentSlide = (index + slides.length) % slides.length;

    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === currentSlide);
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === currentSlide);
    });
  }

  function startSlider() {
    clearInterval(slideTimer);

    slideTimer = setInterval(() => {
      showSlide(currentSlide + 1);
    }, 3000);
  }

  function restartSlider() {
    startSlider();
  }

  previous.addEventListener("click", () => {
    showSlide(currentSlide - 1);
    restartSlider();
  });

  next.addEventListener("click", () => {
    showSlide(currentSlide + 1);
    restartSlider();
  });

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      showSlide(index);
      restartSlider();
    });
  });

  showSlide(0);
  startSlider();
})();
// OPEN POSTING FORM WHEN COMING FROM DASHBOARD
const pageParams = new URLSearchParams(window.location.search);

if (pageParams.get("open") === "post") {
  openModal("post");
}

/* =========================================
   PROOFNEAR TALENT ARENA — SUPABASE
========================================= */

async function getTalentUser() {
  const { data, error } = await supabaseClient.auth.getUser();

  if (error || !data.user) {
    openModal("signin");
    return null;
  }

  return data.user;
}

function setTalentMessage(form, message, isError = false) {
  let output = form.querySelector(".talent-form-status");

  if (!output) {
    output = document.createElement("p");
    output.className = "talent-form-status";
    output.setAttribute("role", "status");
    form.appendChild(output);
  }

  output.textContent = message;
  output.style.color = isError ? "#dc2626" : "#126044";
}

function setTalentButton(button, busy, originalText) {
  button.disabled = busy;
  button.textContent = busy ? "Submitting..." : originalText;
}

async function uploadTalentMedia(user, file, folder) {
  const allowedTypes = [
    "image/jpeg", "image/png", "image/webp",
    "audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg",
    "video/mp4", "video/webm", "video/quicktime"
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("This file type is not supported.");
  }

  if (file.size > 50 * 1024 * 1024) {
    throw new Error("Files must not exceed 50 MB.");
  }

  const extension = file.name.split(".").pop()
    .toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";

  const path =
    `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  const { error } = await supabaseClient.storage
    .from("talent-media")
    .upload(path, file, {
      contentType: file.type,
      upsert: false
    });

  if (error) throw error;

  const { data } = supabaseClient.storage
    .from("talent-media")
    .getPublicUrl(path);

  return data.publicUrl;
}

/* SHOW AND HIDE TALENT FORMS */

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-arena-action]");
  if (!button) return;

  const action = button.dataset.arenaAction;

  const forms = {
    profile: "talentProfileForm",
    post: "talentPostForm",
    challenge: "talentChallengeForm"
  };

  const formId = forms[action];
  if (!formId) return;

  const form = document.getElementById(formId);
  if (!form) return;

  const user = await getTalentUser();
  if (!user) return;

  form.hidden = !form.hidden;

  if (!form.hidden) {
    form.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
});

/* SAVE CREATOR PROFILE */

const talentProfileForm =
  document.getElementById("talentProfileForm");

if (talentProfileForm) {
  talentProfileForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const user = await getTalentUser();
    if (!user) return;

    const button = talentProfileForm.querySelector(
      'button[type="submit"]'
    );

    const originalText = "Save Talent Profile";
    setTalentButton(button, true, originalText);

    try {
      const username =
        talentProfileForm.elements.username.value.trim().replace(/^@/, "");

      if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
        throw new Error(
          "Username must be 3–30 characters using letters, numbers or underscores."
        );
      }

      const profile = {
        user_id: user.id,
        username,
        display_name:
          talentProfileForm.elements.display_name.value.trim(),
        talent_category:
          talentProfileForm.elements.talent_category.value,
        bio: talentProfileForm.elements.bio.value.trim()
      };

      const avatar =
        talentProfileForm.elements.avatar.files[0];

      if (avatar) {
        profile.avatar_url = await uploadTalentMedia(
          user,
          avatar,
          "avatars"
        );
      }

      const { error } = await supabaseClient
        .from("talent_profiles")
        .upsert(profile, { onConflict: "user_id" });

      if (error) throw error;

      setTalentMessage(
        talentProfileForm,
        "Your talent profile was saved successfully!"
      );

      await loadTalentProfiles();

    } catch (error) {
      setTalentMessage(
        talentProfileForm,
        error.message,
        true
      );
    } finally {
      setTalentButton(button, false, originalText);
    }
  });
}


/* LOAD PUBLIC CREATOR PROFILES */

async function loadTalentProfiles() {
  const container = document.getElementById("talentCreatorList");

  if (!container) return;

  container.innerHTML = "<p>Discovering creators...</p>";

  const { data, error } = await supabaseClient
    .from("talent_profiles")
    .select("user_id,username,display_name,bio,avatar_url,talent_category")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    container.textContent = "Could not load creator profiles.";
    console.error("Talent profiles:", error.message);
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = `
      <p>No creators yet. Be the first to join PROOFNEAR!</p>
    `;
    return;
  }

  container.innerHTML = data.map(profile => {
    const avatar = profile.avatar_url
      ? `<img class="talent-profile-photo"
          src="${escapeHTML(profile.avatar_url)}"
          alt="Creator profile">`
      : `<div class="talent-profile-photo talent-profile-placeholder">
          👤
        </div>`;

    return `
      <article class="talent-creator-card">
        ${avatar}

        <div class="talent-creator-info">
          <h4>${escapeHTML(profile.display_name || "Creator")}</h4>
          <p class="talent-username">
            @${escapeHTML(profile.username || "creator")}
          </p>
          <span class="talent-profile-category">
            ${escapeHTML(profile.talent_category || "Other")}
          </span>
          <p>${escapeHTML(profile.bio || "")}</p>
        </div>
      </article>
    `;
  }).join("");
}


/* PUBLISH TALENT CONTENT */

const talentPostForm =
  document.getElementById("talentPostForm");

if (talentPostForm) {
  talentPostForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const user = await getTalentUser();
    if (!user) return;

    const button = talentPostForm.querySelector(
      'button[type="submit"]'
    );

    const originalText = "Submit Content";
    setTalentButton(button, true, originalText);

    try {
      const file =
        talentPostForm.elements.media.files[0];

      if (!file) throw new Error("Please select a media file.");

      const mediaUrl = await uploadTalentMedia(
        user,
        file,
        "posts"
      );

      const { error } = await supabaseClient
        .from("talent_posts")
        .insert({
          creator_id: user.id,
          title: talentPostForm.elements.title.value.trim(),
          description:
            talentPostForm.elements.description.value.trim(),
          category: talentPostForm.elements.category.value,
          media_type: talentPostForm.elements.media_type.value,
          media_url: mediaUrl,
status: "pending"
        });

      if (error) throw error;

      setTalentMessage(
        talentPostForm,
        "Your content has been submitted. It will appear publicly after approval."
      );

      talentPostForm.reset();

    } catch (error) {
      setTalentMessage(talentPostForm, error.message, true);
    } finally {
      setTalentButton(button, false, originalText);
    }
  });
}

/* LOAD APPROVED TALENT CONTENT */

async function loadTalentPosts() {
  const container =
    document.getElementById("talentPostList");

  if (!container) return;

  const { data, error } = await supabaseClient
    .from("talent_posts")
    .select("id,title,description,category,media_type,media_url,created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    container.textContent = "Could not load talent posts.";
    console.error("Talent posts:", error.message);
    return;
  }

  if (!data.length) {
    container.textContent =
      "Creator content will appear here after approval.";
    return;
  }

  container.innerHTML = data.map(post => {
    const url = escapeHTML(post.media_url || "");
    let media = "";

    if (post.media_type === "image") {
      media = `<img src="${url}" alt="Creator content"
        style="width:100%;border-radius:12px;">`;
    } else if (post.media_type === "audio") {
      media = `<audio controls style="width:100%;">
        <source src="${url}">
      </audio>`;
    } else if (post.media_type === "video") {
      media = `<video controls playsinline
        style="width:100%;border-radius:12px;">
        <source src="${url}">
      </video>`;
    }

    return `
      <article class="talent-post-card">
        ${media}
        <h4>${escapeHTML(post.title)}</h4>
        <p>${escapeHTML(post.description || "")}</p>
        <span>${escapeHTML(post.category || "")}</span>
      </article>
    `;
  }).join("");
}

/* CREATE TALENT CHALLENGE */

const talentChallengeForm =
  document.getElementById("talentChallengeForm");

if (talentChallengeForm) {
  talentChallengeForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const user = await getTalentUser();
    if (!user) return;

    const button = talentChallengeForm.querySelector(
      'button[type="submit"]'
    );

    const originalText = "Submit Challenge";
    setTalentButton(button, true, originalText);

    try {
      const closingDate =
        talentChallengeForm.elements.ends_at.value;

      if (!closingDate ||
          new Date(closingDate).getTime() <= Date.now()) {
        throw new Error("Choose a future closing date.");
      }

      const { error } = await supabaseClient
        .from("talent_challenges")
        .insert({
          creator_id: user.id,
          title: talentChallengeForm.elements.title.value.trim(),
          description:
            talentChallengeForm.elements.description.value.trim(),
          category: talentChallengeForm.elements.category.value,
          rules: talentChallengeForm.elements.rules.value.trim(),
          starts_at: new Date().toISOString(),
          ends_at: new Date(closingDate).toISOString(),
status: "pending"
        });

      if (error) throw error;

      setTalentMessage(
        talentChallengeForm,
        "Your challenge has been submitted for approval."
      );

      talentChallengeForm.reset();

    } catch (error) {
      setTalentMessage(
        talentChallengeForm,
        error.message,
        true
      );
    } finally {
      setTalentButton(button, false, originalText);
    }
  });
}

/* LOAD APPROVED CHALLENGES */


async function loadTalentChallenges() {

async function loadTalentPosts() {
  const container = document.getElementById("talentPostList");

  if (!container) return;

  container.innerHTML = "<p>Loading creator content...</p>";

  const { data, error } = await supabaseClient
    .from("talent_posts")
    .select("id,creator_id,title,description,category,media_type,media_url,created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    container.textContent = "Could not load talent posts.";
    console.error("Talent posts:", error.message);
    return;
  }

  if (!data || data.length === 0) {
    container.textContent =
      "Creator content will appear here after approval.";
    return;
  }

  // LOAD CREATOR PROFILES

  const creatorIds = [
    ...new Set(data.map(post => post.creator_id).filter(Boolean))
  ];

  let creatorProfiles = {};

  if (creatorIds.length) {
    const { data: profiles, error: profileError } =
      await supabaseClient
        .from("talent_profiles")
        .select("user_id,username,display_name,avatar_url")
        .in("user_id", creatorIds);

    if (profileError) {
      console.error("Creator profiles:", profileError.message);
    } else if (profiles) {
      creatorProfiles = Object.fromEntries(
        profiles.map(profile => [profile.user_id, profile])
      );
    }
  }

  // BUILD THE FOR YOU FEED

  container.innerHTML = data.map(post => {
    const profile = creatorProfiles[post.creator_id] || {};

    const creatorName =
      profile.display_name || profile.username || "PROOFNEAR Creator";

    const username = profile.username
      ? "@" + profile.username
      : "@creator";

    const avatar = profile.avatar_url
      ? `<img class="talent-creator-avatar"
          src="${escapeHTML(profile.avatar_url)}"
          alt="Creator profile">`
      : `<div class="talent-creator-avatar-placeholder">👤</div>`;

    const url = escapeHTML(post.media_url || "");
    let media = "";

    if (post.media_type === "image") {
      media = `
        <img class="talent-feed-media"
          src="${url}"
          alt="${escapeHTML(post.title)}"
          loading="lazy">
      `;
    } else if (post.media_type === "video") {
      media = `
        <video class="talent-feed-media"
          controls
          playsinline
          preload="metadata">
          <source src="${url}">
          Your browser does not support video.
        </video>
      `;
    } else if (post.media_type === "audio") {
      media = `
        <div class="talent-audio-player">
          <span>🎵</span>
          <audio controls preload="none">
            <source src="${url}">
          </audio>
        </div>
      `;
    }

    return `
      <article class="talent-video-card">

        <div class="talent-feed-creator">
          ${avatar}
          <div>
            <strong>${escapeHTML(creatorName)}</strong>
            <small>${escapeHTML(username)}</small>
          </div>
        </div>

        <div class="talent-feed-content">
          ${media}
        </div>

        <div class="talent-feed-details">
          <h3>${escapeHTML(post.title)}</h3>

          <p>${escapeHTML(post.description || "")}</p>

          <span class="talent-feed-category">
            ${escapeHTML(post.category || "Talent")}
          </span>
        </div>

      </article>
    `;
  }).join("");
}


  // LOAD APPROVED ENTRIES FOR THESE CHALLENGES

  const challengeIds = data.map(challenge => challenge.id);

  const { data: entries, error: entriesError } =
    await supabaseClient
      .from("challenge_entries")
      .select("id,challenge_id,title,description,media_url,created_at")
      .in("challenge_id", challengeIds)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

  if (entriesError) {
    console.error("Challenge entries:", entriesError.message);
  }

  const entriesByChallenge = {};

  (entries || []).forEach(entry => {
    if (!entriesByChallenge[entry.challenge_id]) {
      entriesByChallenge[entry.challenge_id] = [];
    }

    entriesByChallenge[entry.challenge_id].push(entry);
  });

  // DISPLAY CHALLENGES AND APPROVED ENTRIES

  container.innerHTML = data.map(challenge => {

    const approvedEntries =
      entriesByChallenge[challenge.id] || [];

    return `
      <article class="talent-challenge-card">

        <h4>${escapeHTML(challenge.title)}</h4>

        <p>${escapeHTML(challenge.description)}</p>

        <p><strong>Category:</strong>
          ${escapeHTML(challenge.category || "")}
        </p>

        <p><strong>Rules:</strong>
          ${escapeHTML(challenge.rules || "See challenge description.")}
        </p>

        <p><strong>Closes:</strong>
          ${new Date(challenge.ends_at).toLocaleString()}
        </p>

        <button
          class="btn btn-primary"
          onclick="openChallengeEntry('${challenge.id}')">
          Join Challenge
        </button>

        <div class="approved-challenge-entries">

          <h4>🏆 Approved Entries (${approvedEntries.length})</h4>

          ${
            approvedEntries.length
              ? approvedEntries.map(entry => {

                  const mediaUrl = String(entry.media_url || "");
                  const mediaPath = mediaUrl.split("?")[0].toLowerCase();

                  let mediaDisplay = "";

                  if (/\.(jpg|jpeg|png|webp|gif)$/i.test(mediaPath)) {
                    mediaDisplay = `
                      <img
                        src="${escapeHTML(mediaUrl)}"
                        alt="${escapeHTML(entry.title)}"
                        loading="lazy"
                        style="max-width:100%;border-radius:12px;"
                      >
                    `;
                  } else if (/\.(mp3|wav|ogg|m4a)$/i.test(mediaPath)) {
                    mediaDisplay = `
                      <audio controls style="width:100%;">
                        <source src="${escapeHTML(mediaUrl)}">
                      </audio>
                    `;
                  } else if (/\.(mp4|webm|mov)$/i.test(mediaPath)) {
                    mediaDisplay = `
                      <video controls
                        style="width:100%;max-height:350px;border-radius:12px;">
                        <source src="${escapeHTML(mediaUrl)}">
                      </video>
                    `;
                  } else if (mediaUrl) {
                    mediaDisplay = `
                      <a href="${escapeHTML(mediaUrl)}"
                         target="_blank"
                         rel="noopener noreferrer">
                        View submitted entry
                      </a>
                    `;
                  }

                  return `
                    <div class="approved-entry-card">

                      <h5>${escapeHTML(entry.title)}</h5>

                      <p>${escapeHTML(entry.description || "")}</p>

                      ${mediaDisplay}

                    </div>
                  `;
                }).join("")
              : "<p>No approved entries yet. Be the first to participate!</p>"
          }

        </div>

      </article>
    `;
  }).join("");
}

/* INITIAL TALENT ARENA LOAD */

async function loadTalentArena() {
  await Promise.all([
    loadTalentProfiles(),
    loadTalentPosts(),
    loadTalentChallenges()
  ]);
}

loadTalentArena();                  
