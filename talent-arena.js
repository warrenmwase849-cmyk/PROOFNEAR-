
/* =====================================
   PROOFNEAR TALENT ARENA
   Main JavaScript
===================================== */

document.addEventListener("DOMContentLoaded", function () {

  // Smooth navigation between page sections
  const navigationLinks = document.querySelectorAll(
    'a[href^="#"]'
  );

  navigationLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {

      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") {
        return;
      }

      const target = document.querySelector(targetId);

      if (target) {
        event.preventDefault();

        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

        history.replaceState(null, "", targetId);
      }

    });
  });

  // Current year in the footer
  const footer = document.querySelector(".arena-footer");

  if (footer) {
    const footerText = footer.querySelector("p");

    if (footerText) {
      footerText.textContent =
        "© " + new Date().getFullYear() +
        " PROOFNEAR. All rights reserved.";
    }
  }

  // Confirm the page has loaded
  console.log("PROOFNEAR Talent Arena is loading successfully.");

});

