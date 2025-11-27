$(function () {
  const STORAGE_KEY = "contactSubmissions";

  function log(...args) {
    console.log("[SUBS]", ...args);
  }

  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  /* ----------------- Storage helpers ----------------- */
  function getSubmissions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      log("raw localStorage:", raw);
      return JSON.parse(raw) || [];
    } catch (e) {
      console.error("Invalid storage JSON", e);
      return [];
    }
  }

  function setSubmissions(arr) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
      log("saved submissions count:", arr.length);
    } catch (e) {
      console.error("Error saving to localStorage", e);
    }
  }

  function addSubmission(submission) {
    const arr = getSubmissions();
    arr.unshift(submission);
    setSubmissions(arr);
  }
  /* ----------------- Table rendering ----------------- */
  function renderTable() {
    const subs = getSubmissions();
    const $tbody = $("#submissions-table tbody");
    if (!$tbody.length) return;
    $tbody.empty();

    if (subs.length === 0) {
      $tbody.append(
        `<tr><td colspan="8" class="text-center text-muted py-3">No submissions yet.</td></tr>`
      );
      log("render: no submissions");
      return;
    }

    subs.forEach((s, idx) => {
      const row = `
        <tr data-index="${idx}">
          <td>${idx + 1}</td>
          <td>${escapeHtml(s.name)}</td>
          <td>${escapeHtml(s.email)}</td>
          <td>${escapeHtml(s.phone)}</td>
          <td>${escapeHtml(s.subject)}</td>
          <td style="max-width:220px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${escapeHtml(
            s.message
          )}">${escapeHtml(s.message)}</td>
          <td>${escapeHtml(s.date)}</td>
          <td><button class="btn btn-sm btn-outline-danger delete-row">Delete</button></td>
        </tr>`;
      $tbody.append(row);
    });
    log("render: injected rows:", subs.length);
  }

  /* ----------------- Form handling ----------------- */
  function validateFormData(formData) {
    if (!formData.name) {
      Swal.fire({ title: "Please enter your name", icon: "error" });
      return false;
    }
    if (!formData.email) {
      Swal.fire({ title: "Please enter your email", icon: "error" });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      Swal.fire({ title: "Please enter a valid email address", icon: "error" });
      return false;
    }

    if (!formData.phone) {
      Swal.fire({ title: "Please enter your phone number", icon: "error" });
      return false;
    }
    if (!/^[0-9]{10}$/.test(formData.phone)) {
      Swal.fire({ title: "Phone number must be 10 digits", icon: "error" });
      return false;
    }
    if (!formData.subject) {
      Swal.fire({ title: "Please enter a subject", icon: "error" });
      return false;
    }
    if (!formData.message) {
      Swal.fire({ title: "Please enter your message", icon: "error" });
      return false;
    }
    return true;
  }

  function handleContactFormSubmit(e) {
    e.preventDefault();

    const formData = {
      name: $("#name").val().trim(),
      email: $("#email").val().trim(),
      phone: $("#phone").val().trim(),
      subject: $("#subject").val().trim(),
      message: $("#message").val().trim(),
      date: new Date().toLocaleString(),
    };

    // Validate
    if (!validateFormData(formData)) return;

    // Save to localStorage
    addSubmission(formData);

    // Feedback & reset
    if (window.Swal) {
      Swal.fire({
        title: "Thank you!",
        text: "Your message has been saved locally. We will get back to you soon.",
        icon: "success",
      });
    } else {
      alert("Your message has been saved.");
    }

    // Reset and re-render table
    $("#contact-form")[0].reset();
    renderTable();
  }

  // Delete single row (delegated)
  $("#submissions-table").on("click", ".delete-row", function () {
    const $tr = $(this).closest("tr");
    const index = Number($tr.data("index"));
    if (Number.isNaN(index)) return;

    function doDelete() {
      const arr = getSubmissions();
      if (index >= 0 && index < arr.length) {
        arr.splice(index, 1);
        setSubmissions(arr);
        renderTable();
        if (window.Swal)
          Swal.fire({
            icon: "success",
            title: "Deleted",
            timer: 1100,
            showConfirmButton: false,
          });
      }
    }

    if (window.Swal) {
      Swal.fire({
        title: "Delete submission?",
        text: "This will remove the saved submission from your browser.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete",
      }).then((res) => {
        if (res.isConfirmed) doDelete();
      });
    } else {
      if (confirm("Delete this submission?")) doDelete();
    }
  });

  // Clear all
  $("#clearAllSubmissions").on("click", function () {
    function doClear() {
      localStorage.removeItem(STORAGE_KEY);
      renderTable();
      if (window.Swal)
        Swal.fire({
          icon: "success",
          title: "Cleared",
          text: "All submissions removed.",
          timer: 1200,
          showConfirmButton: false,
        });
    }

    if (window.Swal) {
      Swal.fire({
        title: "Clear all submissions?",
        text: "This cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, clear all",
      }).then((res) => {
        if (res.isConfirmed) doClear();
      });
    } else {
      if (confirm("Clear all submissions?")) doClear();
    }
  });
  // Form submit handler
  $("#contact-form").off("submit").on("submit", handleContactFormSubmit);

  // Initial render
  renderTable();
});
