
/* =========================================
   PROOFNEAR TALENT ARENA
   Creator Registration
========================================= */

const SUPABASE_URL =
  "https://hzxaamykvnvfillpkfom.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_G2EnYQpTGlkQkGVWn6yqlQ_2gaKnvbH";

const talentSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

document.addEventListener("DOMContentLoaded", async function () {

  const form = document.getElementById(
    "creatorRegistrationForm"
  );

  const authNotice = document.getElementById("authNotice");
  const message = document.getElementById("registrationMessage");
  const submitButton = document.getElementById("creatorSubmitButton");

  if (!form || !message || !submitButton) {
    console.error("Creator registration form elements are missing.");
    return;
  }

  let currentUser = null;

  function showMessage(text, isError = false) {
    message.textContent = text;
    message.style.color = isError ? "#b42318" : "#176b50";
  }

  function setFormEnabled(enabled) {
    Array.from(form.elements).forEach(element => {
      element.disabled = !enabled;
    });
  }

  // Check the existing PROOFNEAR login session.
  async function checkLogin() {
    const { data, error } =
      await talentSupabase.auth.getUser();

    if (error || !data.user) {
      currentUser = null;

      authNotice.textContent =
        "Please sign in to your PROOFNEAR account before registering.";

      authNotice.style.display = "block";
      setFormEnabled(false);

      return false;
    }

    currentUser = data.user;

    authNotice.textContent =
      "Signed in successfully. You can create your creator profile.";

    authNotice.style.background = "#e8f4ed";
    authNotice.style.color = "#176b50";

    setFormEnabled(true);

    return true;
  }

  const loggedIn = await checkLogin();

  if (!loggedIn) {
    showMessage(
      "Sign in to your PROOFNEAR account first.",
      true
    );
  }

  // Register or update the signed-in creator's profile.
  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!currentUser) {
      showMessage(
        "Please sign in before submitting your registration.",
        true
      );
      return;
    }

    const stageName =
      document.getElementById("stageName").value.trim();

    const talentCategory =
      document.getElementById("talentCategory").value;

    const bio =
      document.getElementById("creatorBio").value.trim();

    const district =
      document.getElementById("creatorDistrict").value.trim();

    const photoUrl =
      document.getElementById("profilePhoto").value.trim();

    const portfolioUrl =
      document.getElementById("portfolioUrl").value.trim();

    const allowedCategories = [
      "Singer & Vocalist",
      "Musician",
      "Performer & Creator",
      "Creative Artist",
      "Other"
    ];

    if (stageName.length < 2 || stageName.length > 60) {
      showMessage(
        "Your display name must contain 2 to 60 characters.",
        true
      );
      return;
    }

    if (!allowedCategories.includes(talentCategory)) {
      showMessage("Please select a valid talent category.", true);
      return;
    }

    if (bio.length > 500) {
      showMessage(
        "Your biography cannot exceed 500 characters.",
        true
      );
      return;
    }

    const validUrl = value => {
      if (!value) return true;

      try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
      } catch {
        return false;
      }
    };

    if (!validUrl(photoUrl) || !validUrl(portfolioUrl)) {
      showMessage(
        "Please enter valid photo and portfolio links.",
        true
      );
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    showMessage("Saving your creator profile...");

    try {

      // Confirm the authenticated user again.
      const { data: authData, error: authError } =
        await talentSupabase.auth.getUser();

      if (authError || !authData.user) {
        throw new Error(
          "Your login session has expired. Please sign in again."
        );
      }

      const userId = authData.user.id;

      const profileData = {
        stage_name: stageName,
        talent_category: talentCategory,
        bio: bio || null,
        district: district || null,
        profile_photo_url: photoUrl || null,
        portfolio_url: portfolioUrl || null,
        updated_at: new Date().toISOString()
      };

      // Check whether this user already has a creator profile.
      const { data: existingProfile, error: lookupError } =
        await talentSupabase
          .from("creator_profiles")
          .select("user_id")
          .eq("user_id", userId)
          .maybeSingle();

      if (lookupError) {
        throw lookupError;
      }

      let saveResult;

      if (existingProfile) {

        // Update profile details without changing approval status.
        saveResult = await talentSupabase
          .from("creator_profiles")
          .update(profileData)
          .eq("user_id", userId);

      } else {

        // Create a new creator profile.
        saveResult = await talentSupabase
          .from("creator_profiles")
          .insert({
            user_id: userId,
            ...profileData
          });

      }

      if (saveResult.error) {
        throw saveResult.error;
      }

      showMessage(
        "Success! Your creator profile has been submitted. It is awaiting administrator review."
      );

      submitButton.textContent = "Registration Submitted";

    } catch (error) {

      console.error("Creator registration error:", error);

      showMessage(
        error.message || "Registration failed. Please try again.",
        true
      );

      submitButton.disabled = false;
      submitButton.textContent = "Submit Creator Registration";
    }

  });

  // Keep the page aware of sign-in and sign-out changes.
  talentSupabase.auth.onAuthStateChange(async function () {
    await checkLogin();
  });

});
      
