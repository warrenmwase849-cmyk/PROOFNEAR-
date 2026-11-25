
const SUPABASE_URL = "https://hzxaamykvnvfillpkfom.supabase.co";
const SUPABASE_KEY = "sb_publishable_G2EnYQpTGlkQkGVWn6yqlQ_2gaKnvbH";
const PHOTO_BUCKET = "profile-photos";

const talentSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let currentUser = null;
let existingProfile = null;
let selectedPhoto = null;
let previewObjectUrl = null;

const $ = (id) => document.getElementById(id);

function showMessage(message, type = "info") {
  const box = $("message");
  if (!box) return;

  box.textContent = message;
  box.style.display = "block";
  box.style.padding = "12px";
  box.style.margin = "12px 0";
  box.style.borderRadius = "8px";
  box.style.background =
    type === "error" ? "#fee2e2" :
    type === "success" ? "#dcfce7" : "#e0f2fe";
  box.style.color =
    type === "error" ? "#991b1b" :
    type === "success" ? "#166534" : "#075985";
}

function setFormEnabled(enabled) {
  const form = $("editProfileForm");
  if (!form) return;

  form.querySelectorAll("input, select, textarea, button")
    .forEach((element) => {
      element.disabled = !enabled;
    });
}

function showAuthNotice(message) {
  const notice = $("authNotice");
  if (notice) {
    notice.textContent = message;
    notice.style.display = "block";
  }
}

function displayPhoto(url) {
  const preview = $("photoPreview");
  if (!preview) return;

  if (url) {
    preview.src = url;
    preview.style.display = "block";
  } else {
    preview.removeAttribute("src");
    preview.style.display = "none";
  }
}

async function loadCreatorProfile() {
  setFormEnabled(false);
  showMessage("Loading your creator profile...");

  const { data: authData, error: authError } =
    await talentSupabase.auth.getUser();

  if (authError || !authData.user) {
    showAuthNotice(
      "Please sign in to edit your creator profile."
    );
    showMessage("You are not signed in.", "error");
    return;
  }

  currentUser = authData.user;

  const { data: profile, error } = await talentSupabase
    .from("creator_profiles")
    .select(
      "user_id, stage_name, talent_category, bio, district, profile_photo_url, portfolio_url, approval_status"
    )
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (error) {
    showMessage(
      "Could not load your profile: " + error.message,
      "error"
    );
    return;
  }

  if (!profile) {
    showMessage(
      "You do not have a creator profile yet. Please register first.",
      "error"
    );
    showAuthNotice(
      "Go to talent-register.html to create your creator profile."
    );
    return;
  }

  existingProfile = profile;

  $("stageName").value = profile.stage_name || "";
  $("talentCategory").value = profile.talent_category || "";
  $("creatorBio").value = profile.bio || "";
  $("creatorDistrict").value = profile.district || "";
  $("portfolioUrl").value = profile.portfolio_url || "";

  displayPhoto(profile.profile_photo_url);

  showMessage(
    "Your profile is ready. Make your changes and save.",
    "success"
  );

  setFormEnabled(true);
}

function validatePhoto(file) {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "Choose a JPEG, PNG or WebP profile photo."
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Your photo must be 5 MB or smaller.");
  }
}

async function uploadProfilePhoto(file) {
  validatePhoto(file);

  const originalName = file.name || "profile-photo";
  const safeFileName = originalName.replace(
    /[^a-zA-Z0-9._-]/g,
    "-"
  );

  const path =
    `${currentUser.id}/${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;

  const { error: uploadError } = await talentSupabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false
    });

  if (uploadError) {
    throw new Error(
      "Photo upload failed: " + uploadError.message
    );
  }

  const { data } = talentSupabase.storage
    .from(PHOTO_BUCKET)
    .getPublicUrl(path);

  return {
    url: data.publicUrl,
    path
  };
}

async function saveCreatorProfile(event) {
  event.preventDefault();

  if (!currentUser || !existingProfile) {
    showMessage(
      "Your creator profile is not ready to update.",
      "error"
    );
    return;
  }

  const stageName = $("stageName").value.trim();
  const category = $("talentCategory").value;
  const bio = $("creatorBio").value.trim();
  const district = $("creatorDistrict").value.trim();
  const portfolioInput = $("portfolioUrl").value.trim();

  if (stageName.length < 2 || stageName.length > 60) {
    showMessage(
      "Stage name must be between 2 and 60 characters.",
      "error"
    );
    return;
  }

  const allowedCategories = [
    "Singer & Vocalist",
    "Musician",
    "Performer & Creator",
    "Creative Artist",
    "Other"
  ];

  if (!allowedCategories.includes(category)) {
    showMessage("Please select a valid talent category.", "error");
    return;
  }

  if (bio.length > 500) {
    showMessage("Your bio cannot exceed 500 characters.", "error");
    return;
  }

  let portfolioUrl = null;

  if (portfolioInput) {
    try {
      const parsedUrl = new URL(portfolioInput);

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }

      portfolioUrl = parsedUrl.href;
    } catch {
      showMessage(
        "Enter a valid portfolio link starting with https:// or http://.",
        "error"
      );
      return;
    }
  }

  const saveButton = $("saveButton");
  const originalButtonText = saveButton
    ? saveButton.textContent
    : "";

  if (saveButton) {
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";
  }

  let uploadedPhotoPath = null;

  try {
    let photoUrl = existingProfile.profile_photo_url || null;

    if (selectedPhoto) {
      const uploaded = await uploadProfilePhoto(selectedPhoto);
      photoUrl = uploaded.url;
      uploadedPhotoPath = uploaded.path;
    }

    const profileUpdates = {
      stage_name: stageName,
      talent_category: category,
      bio: bio,
      district: district || null,
      profile_photo_url: photoUrl,
      portfolio_url: portfolioUrl
    };

    const { error: updateError } = await talentSupabase
      .from("creator_profiles")
      .update(profileUpdates)
      .eq("user_id", currentUser.id);

    if (updateError) {
      throw updateError;
    }

    existingProfile = {
      ...existingProfile,
      ...profileUpdates
    };

    displayPhoto(photoUrl);

    selectedPhoto = null;
    $("profilePhoto").value = "";

    showMessage(
      "Your creator profile has been updated successfully!",
      "success"
    );
  } catch (error) {
    if (uploadedPhotoPath) {
      await talentSupabase.storage
        .from(PHOTO_BUCKET)
        .remove([uploadedPhotoPath]);
    }

    showMessage(
      "Could not save your profile: " + error.message,
      "error"
    );
  } finally {
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent =
        originalButtonText || "Save Changes";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const photoInput = $("profilePhoto");

  if (photoInput) {
    photoInput.addEventListener("change", () => {
      const file = photoInput.files[0];

      selectedPhoto = null;

      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = null;
      }

      if (!file) {
        displayPhoto(existingProfile?.profile_photo_url);
        return;
      }

      try {
        validatePhoto(file);
        selectedPhoto = file;
        previewObjectUrl = URL.createObjectURL(file);
        displayPhoto(previewObjectUrl);
      } catch (error) {
        photoInput.value = "";
        displayPhoto(existingProfile?.profile_photo_url);
        showMessage(error.message, "error");
      }
    });
  }

  const form = $("editProfileForm");

  if (form) {
    form.addEventListener("submit", saveCreatorProfile);
  }

  loadCreatorProfile();
});

