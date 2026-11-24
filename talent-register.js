
/* =========================================
   PROOFNEAR TALENT ARENA
   Creator Registration + Profile Photo Upload
========================================= */

const SUPABASE_URL =
  "https://hzxaamykvnvfillpkfom.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_G2EnYQpTGlkQkGVWn6yqlQ_2gaKnvbH";

const PROFILE_PHOTO_BUCKET = "profile-photos";
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

const talentSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

document.addEventListener("DOMContentLoaded", async function () {
  const form = document.getElementById("creatorRegistrationForm");
  const authNotice = document.getElementById("authNotice");
  const message = document.getElementById("registrationMessage");
  const submitButton = document.getElementById("creatorSubmitButton");
  const photoInput = document.getElementById("profilePhoto");
  const photoPreviewContainer = document.getElementById("photoPreviewContainer");
  const photoPreview = document.getElementById("photoPreview");
  const removePhotoButton = document.getElementById("removePhotoButton");

  if (
    !form ||
    !authNotice ||
    !message ||
    !submitButton ||
    !photoInput ||
    !photoPreviewContainer ||
    !photoPreview ||
    !removePhotoButton
  ) {
    console.error("Creator registration form elements are missing.");
    return;
  }

  let currentUser = null;
  let previewObjectUrl = null;

  function showMessage(text, isError = false) {
    message.textContent = text;
    message.style.color = isError ? "#b42318" : "#176b50";
  }

  function setFormEnabled(enabled) {
    Array.from(form.elements).forEach(element => {
      element.disabled = !enabled;
    });
  }

  function clearPhotoPreview() {
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      previewObjectUrl = null;
    }

    photoPreview.removeAttribute("src");
    photoPreviewContainer.hidden = true;
  }

  function validatePhoto(file) {
    if (!file) return null;

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      return "Please choose a JPG, PNG or WebP image.";
    }

    if (file.size > MAX_PHOTO_SIZE) {
      return "Your profile photo must be 5 MB or smaller.";
    }

    return null;
  }

  photoInput.addEventListener("change", function () {
    const file = photoInput.files && photoInput.files[0];

    if (!file) {
      clearPhotoPreview();
      return;
    }

    const validationError = validatePhoto(file);

    if (validationError) {
      photoInput.value = "";
      clearPhotoPreview();
      showMessage(validationError, true);
      return;
    }

    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
    }

    previewObjectUrl = URL.createObjectURL(file);
    photoPreview.src = previewObjectUrl;
    photoPreviewContainer.hidden = false;
    showMessage("Photo selected. Preview it below before submitting.");
  });

  removePhotoButton.addEventListener("click", function () {
    photoInput.value = "";
    clearPhotoPreview();
    showMessage("Selected photo removed.");
  });

  async function checkLogin() {
    const { data, error } = await talentSupabase.auth.getUser();

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
    showMessage("Sign in to your PROOFNEAR account first.", true);
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!currentUser) {
      showMessage(
        "Please sign in before submitting your registration.",
        true
      );
      return;
    }

    const stageName = document.getElementById("stageName").value.trim();
    const talentCategory = document.getElementById("talentCategory").value;
    const bio = document.getElementById("creatorBio").value.trim();
    const district = document.getElementById("creatorDistrict").value.trim();
    const portfolioUrl = document.getElementById("portfolioUrl").value.trim();
    const selectedPhoto = photoInput.files && photoInput.files[0];

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
      showMessage("Your biography cannot exceed 500 characters.", true);
      return;
    }

    if (portfolioUrl) {
      try {
        const url = new URL(portfolioUrl);
        if (url.protocol !== "https:" && url.protocol !== "http:") {
          throw new Error("Invalid protocol");
        }
      } catch {
        showMessage("Please enter a valid portfolio or social media link.", true);
        return;
      }
    }

    const photoValidationError = validatePhoto(selectedPhoto);
    if (photoValidationError) {
      showMessage(photoValidationError, true);
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    let uploadedPhotoPath = null;

    try {
      showMessage("Checking your account...");

      const { data: authData, error: authError } =
        await talentSupabase.auth.getUser();

      if (authError || !authData.user) {
        throw new Error(
          "Your login session has expired. Please sign in again."
        );
      }

      const userId = authData.user.id;

      const { data: existingProfile, error: lookupError } =
        await talentSupabase
          .from("creator_profiles")
          .select("user_id, profile_photo_url")
          .eq("user_id", userId)
          .maybeSingle();

      if (lookupError) {
        throw lookupError;
      }

      let photoUrl = existingProfile?.profile_photo_url || null;

      if (selectedPhoto) {
        showMessage("Uploading your profile photo...");

        const safeFileName = selectedPhoto.name
          .toLowerCase()
          .replace(/[^a-z0-9._-]/g, "-")
          .replace(/-+/g, "-");

        const uniqueFileName =
          Date.now() + "-" + crypto.randomUUID() + "-" + safeFileName;

        uploadedPhotoPath = userId + "/" + uniqueFileName;

        const { error: uploadError } = await talentSupabase.storage
          .from(PROFILE_PHOTO_BUCKET)
          .upload(uploadedPhotoPath, selectedPhoto, {
            cacheControl: "3600",
            contentType: selectedPhoto.type,
            upsert: false
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = talentSupabase.storage
          .from(PROFILE_PHOTO_BUCKET)
          .getPublicUrl(uploadedPhotoPath);

        photoUrl = publicUrlData.publicUrl;
      }

      const profileData = {
        stage_name: stageName,
        talent_category: talentCategory,
        bio: bio || null,
        district: district || null,
        profile_photo_url: photoUrl,
        portfolio_url: portfolioUrl || null
      };

      showMessage("Saving your creator profile...");

      let saveResult;

      if (existingProfile) {
        saveResult = await talentSupabase
          .from("creator_profiles")
          .update(profileData)
          .eq("user_id", userId);
      } else {
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

      clearPhotoPreview();
      photoInput.value = "";

      showMessage(
        "Success! Your creator profile has been submitted. It is awaiting administrator review."
      );

      submitButton.textContent = "Registration Submitted";

    } catch (error) {
      console.error("Creator registration error:", error);

      if (uploadedPhotoPath) {
        const { error: cleanupError } = await talentSupabase.storage
          .from(PROFILE_PHOTO_BUCKET)
          .remove([uploadedPhotoPath]);

        if (cleanupError) {
          console.error("Could not remove unused uploaded photo:", cleanupError);
        }
      }

      showMessage(
        error.message || "Registration failed. Please try again.",
        true
      );

      submitButton.disabled = false;
      submitButton.textContent = "Submit Creator Registration";
    }
  });

  talentSupabase.auth.onAuthStateChange(async function () {
    await checkLogin();
  });
});
