// Movie/Event Ticket Booking Application

$(document).ready(function () {
  // Initialize the application
  initializeApp();
});

// Global variables
let events = [];
let selectedSeats = [];
let currentEvent = null;
let totalPrice = 0;

// Initialize application
function initializeApp() {
  loadEvents();
  setupEventListeners();
  updateBookingCount();
  // Page-specific initialization
  const currentPage = getCurrentPage();
  switch (currentPage) {
    case "events":
      displayEvents();
      break;
    case "event-details":
      initializeEventDetails();
      break;
    case "my-bookings":
      displayMyBookings();
      break;
  }
}

// Get current page based on URL or body class
function getCurrentPage() {
  const path = window.location.pathname;
  if (path.includes("events.html")) return "events";
  if (path.includes("event-details.html")) return "event-details";
  if (path.includes("my-bookings.html")) return "my-bookings";
  if (path.includes("contact.html")) return "contact";
  return "home";
}

// Load events from JSON file using AJAX
function loadEvents() {
  $.ajax({
    url: "./data/events.json",
    method: "GET",
    dataType: "json",
    success: function (data) {
      events = data.events;
      console.log("Events loaded successfully:", events.length);
      if (getCurrentPage() === "events") {
        displayEvents();
      }
    },
    error: function (xhr, status, error) {
      console.error("Error loading events:", error);
      showAlert("Error loading events. Please try again later.", "danger");
    },
  });
}

// Display events on events page
function displayEvents() {
  const eventsContainer = $("#events-container");
  if (!eventsContainer.length || events.length === 0) return;

  eventsContainer.empty();

  events.forEach((event) => {
    const eventCard = createEventCard(event);
    eventsContainer.append(eventCard);
  });

  // Add fade-in animation
  $(".event-card").addClass("fade-in");
}

// Create event card HTML
function createEventCard(event) {
  return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card event-card h-100">
                <img src="${event.image}" class="card-img-top" alt="${event.title}">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${event.title}</h5>
                    <p class="card-text">${event.description}</p>
                    <div class="mt-auto">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="event-price text-danger">$${event.price}</span>
                            <small class="text-muted">${event.duration}</small>
                        </div>
                        <div class="mb-2">
                            <small class="text-muted">
                                <i class="fas fa-calendar"></i> ${event.date}<br>
                                <i class="fas fa-clock"></i> ${event.time}<br>
                                <i class="fas fa-map-marker-alt"></i> ${event.venue}
                            </small>
                        </div>
                        <button class="btn btn-warning btn-custom w-100" onclick="viewEventDetails(${event.id})">
                            Book Tickets
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// View event details
function viewEventDetails(eventId) {
  const event = events.find((e) => e.id === eventId);
  if (event) {
    localStorage.setItem("selectedEvent", JSON.stringify(event));
    window.location.href = "event-details.html";
  }
}

// Initialize event details page
function initializeEventDetails() {
  const eventData = localStorage.getItem("selectedEvent");
  if (!eventData) {
    window.location.href = "events.html";
    return;
  }

  currentEvent = JSON.parse(eventData);
  displayEventDetails();
  generateSeatMap();
}

// Display event details
function displayEventDetails() {
  if (!currentEvent) return;

  $("#event-title").text(currentEvent.title);
  $("#event-image")
    .attr("src", currentEvent.image)
    .attr("alt", currentEvent.title);
  $("#event-description").text(currentEvent.description);
  $("#event-date").text(currentEvent.date);
  $("#event-time").text(currentEvent.time);
  $("#event-venue").text(currentEvent.venue);
  $("#event-duration").text(currentEvent.duration);
  $("#event-price").text(`$${currentEvent.price}`);
}

// Generate seat map
function generateSeatMap() {
  const seatMap = $("#seat-map");
  if (!seatMap.length) return;

  seatMap.empty();

  // Add screen
  seatMap.append('<div class="screen">SCREEN</div>');

  // Get booked seats for this event
  const bookedSeats = getBookedSeats(currentEvent.id);

  // Generate seats (10 rows, 12 seats per row)
  for (let row = 1; row <= 10; row++) {
    const rowDiv = $('<div class="seat-row"></div>');
    const rowLabel = String.fromCharCode(64 + row); // A, B, C, etc.

    rowDiv.append(`<div class="row-label">${rowLabel}</div>`);

    for (let seat = 1; seat <= 12; seat++) {
      const seatId = `${rowLabel}${seat}`;
      const isBooked = bookedSeats.includes(seatId);
      const seatClass = isBooked ? "seat booked" : "seat available";

      const seatElement = $(
        `<div class="${seatClass}" data-seat="${seatId}">${seat}</div>`
      );

      if (!isBooked) {
        seatElement.click(function () {
          toggleSeat($(this));
        });
      }

      rowDiv.append(seatElement);
    }

    seatMap.append(rowDiv);
  }

  updateBookingSummary();
}

// Toggle seat selection
function toggleSeat(seatElement) {
  const seatId = seatElement.data("seat");

  if (seatElement.hasClass("selected")) {
    // Deselect seat
    seatElement.removeClass("selected").addClass("available");
    selectedSeats = selectedSeats.filter((seat) => seat !== seatId);
  } else {
    // Select seat (limit to 8 seats)
    if (selectedSeats.length >= 8) {
      showAlert("You can select maximum 8 seats at a time.", "warning");
      return;
    }
    seatElement.removeClass("available").addClass("selected");
    selectedSeats.push(seatId);
  }

  updateBookingSummary();

  // Add animation
  seatElement.addClass("bounce-in");
  setTimeout(() => seatElement.removeClass("bounce-in"), 600);
}

// Update booking summary
function updateBookingSummary() {
  const summaryContainer = $("#booking-summary");
  if (!summaryContainer.length || !currentEvent) return;

  const seatCount = selectedSeats.length;
  totalPrice = seatCount * currentEvent.price;

  summaryContainer.html(`
        <h5 class="mb-3">Booking Summary</h5>
        <div class="summary-item">
            <span>Event:</span>
            <span>${currentEvent.title}</span>
        </div>
        <div class="summary-item">
            <span>Date & Time:</span>
            <span>${currentEvent.date} ${currentEvent.time}</span>
        </div>
        <div class="summary-item">
            <span>Selected Seats:</span>
            <span>${selectedSeats.join(", ") || "None"}</span>
        </div>
        <div class="summary-item">
            <span>Seat Count:</span>
            <span>${seatCount}</span>
        </div>
        <div class="summary-item">
            <span>Price per Seat:</span>
            <span>$${currentEvent.price}</span>
        </div>
        <div class="summary-item">
            <span>Total Amount:</span>
            <span>$${totalPrice}</span>
        </div>
        <button class="btn btn-warning btn-custom w-100 mt-3" 
                onclick="confirmBooking()" 
                ${seatCount === 0 ? "disabled" : ""}>
            Confirm Booking
        </button>
    `);
}

// Confirm booking
function confirmBooking() {
  if (selectedSeats.length === 0) {
    showAlert("Please select at least one seat.", "warning");
    return;
  }

  const booking = {
    id: generateBookingId(),
    eventId: currentEvent.id,
    eventTitle: currentEvent.title,
    eventDate: currentEvent.date,
    eventTime: currentEvent.time,
    eventVenue: currentEvent.venue,
    seats: [...selectedSeats],
    totalAmount: totalPrice,
    bookingDate: new Date().toLocaleDateString(),
    status: "Confirmed",
  };

  // Save booking to localStorage
  saveBooking(booking);
  // SweetAlert2 popup for booking confirmation
  Swal.fire({
    title: "🎉 Booking Confirmed!",
    html: `
      <div style="text-align:left; font-size:15px; line-height:1.6;">
        <p><strong>Booking ID:</strong> ${booking.id}</p>
        <p><strong>Event:</strong> ${booking.eventTitle}</p>
        <p><strong>Date & Time:</strong> ${booking.eventDate} | ${
      booking.eventTime
    }</p>
        <p><strong>Seats:</strong> ${booking.seats.join(", ")}</p>
        <p><strong>Total Amount:</strong> $${booking.totalAmount}</p>
      </div>
    `,
    icon: "success",
    confirmButtonText: "View My Bookings",
    showCancelButton: true,
    cancelButtonText: "Book More Tickets",
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#007bff",
    width: 600,
  }).then((result) => {
    if (result.isConfirmed) {
      window.location.href = "my-bookings.html";
    } else {
      window.location.href = "events.html";
    }
  });

  // Show success animation
  showBookingSuccess(booking);
}

// Generate unique booking ID
function generateBookingId() {
  return (
    "BK" + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase()
  );
}

// Save booking to localStorage
function saveBooking(booking) {
  let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
  bookings.push(booking);
  localStorage.setItem("bookings", JSON.stringify(bookings));
  updateBookingCount();
}

// Get booked seats for an event
function getBookedSeats(eventId) {
  const bookings = JSON.parse(localStorage.getItem("bookings")) || [];
  const eventBookings = bookings.filter(
    (booking) => booking.eventId === eventId
  );

  let bookedSeats = [];
  eventBookings.forEach((booking) => {
    bookedSeats = bookedSeats.concat(booking.seats);
  });

  return bookedSeats;
}

// Show booking success animation
function showBookingSuccess(booking) {
  const successHtml = `
        <div class="success-animation">
            <div class="success-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h3 class="mt-3 mb-3">Booking Confirmed!</h3>
            <p class="mb-3">Your booking ID is: <strong>${booking.id}</strong></p>
            <p class="mb-4">You will receive a confirmation email shortly.</p>
            <button class="btn btn-primary btn-custom me-3" onclick="window.location.href='my-bookings.html'">
                View My Bookings
            </button>
            <button class="btn btn-outline-primary btn-custom" onclick="window.location.href='events.html'">
                Book More Tickets
            </button>
        </div>
    `;

  $("#event-details-container").html(successHtml);
  $(".success-animation").addClass("fade-in");
}

// Display my bookings
function displayMyBookings() {
  const bookingsContainer = $("#bookings-container");
  if (!bookingsContainer.length) return;

  const bookings = JSON.parse(localStorage.getItem("bookings")) || [];

  if (bookings.length === 0) {
    bookingsContainer.html(`
            <div class="text-center py-5">
                <i class="fas fa-ticket-alt fa-3x text-muted mb-3"></i>
                <h4>No Bookings Found</h4>
                <p class="text-muted">You haven't made any bookings yet.</p>
                <a href="events.html" class="btn btn-primary btn-custom">Browse Events</a>
            </div>
        `);
    return;
  }

  bookingsContainer.empty();

  bookings.reverse().forEach((booking) => {
    const bookingCard = createBookingCard(booking);
    bookingsContainer.append(bookingCard);
  });

  $(".booking-card").addClass("fade-in");
}

// Create booking card HTML
function createBookingCard(booking) {
  return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card booking-card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h5 class="card-title">${booking.eventTitle}</h5>
                        <span class="badge bg-success">${booking.status}</span>
                    </div>
                    <p class="card-text">
                        <small class="text-muted">
                            <i class="fas fa-calendar"></i> ${
                              booking.eventDate
                            }<br>
                            <i class="fas fa-clock"></i> ${
                              booking.eventTime
                            }<br>
                            <i class="fas fa-map-marker-alt"></i> ${
                              booking.eventVenue
                            }<br>
                            <i class="fas fa-chair"></i> Seats: ${booking.seats.join(
                              ", "
                            )}<br>
                            <i class="fas fa-dollar-sign"></i> Total: $${
                              booking.totalAmount
                            }
                        </small>
                    </p>
                    <div class="mt-auto">
                        <small class="text-muted">
                            Booking ID: ${booking.id}<br>
                            Booked on: ${booking.bookingDate}
                        </small>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Update booking count in navigation
function updateBookingCount() {
  const bookings = JSON.parse(localStorage.getItem("bookings")) || [];
  const count = bookings.length;

  $(".booking-count").text(count);

  if (count > 0) {
    $(".booking-count").show();
  } else {
    $(".booking-count").hide();
  }
}

// Setup event listeners
function setupEventListeners() {
  // Contact form submission
  $("#contact-form").on("submit", function (e) {
    e.preventDefault();
    handleContactForm();
  });

  // Search functionality
  $("#search-input").on("input", function () {
    const searchTerm = $(this).val().toLowerCase();
    filterEvents(searchTerm);
  });

  // Category filter
  $(".category-filter").on("click", function () {
    const category = $(this).data("category");
    filterEventsByCategory(category);

    // Update active state
    $(".category-filter").removeClass("active");
    $(this).addClass("active");
  });
}

// Filter events by search term
function filterEvents(searchTerm) {
  if (!searchTerm) {
    $(".event-card").parent().show();
    return;
  }

  $(".event-card").each(function () {
    const title = $(this).find(".card-title").text().toLowerCase();
    const description = $(this).find(".card-text").text().toLowerCase();

    if (title.includes(searchTerm) || description.includes(searchTerm)) {
      $(this).parent().show();
    } else {
      $(this).parent().hide();
    }
  });
}

// Filter events by category
function filterEventsByCategory(category) {
  if (category === "all") {
    $(".event-card").parent().show();
    return;
  }

  $(".event-card").each(function () {
    const eventCategory = $(this).data("category");
    if (eventCategory === category) {
      $(this).parent().show();
    } else {
      $(this).parent().hide();
    }
  });
}

// Show alert message
function showAlert(message, type = "info") {
  const alertHtml = `
        <div class="alert alert-${type} alert-custom alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

  // Remove existing alerts
  $(".alert").remove();

  // Add new alert to the top of the page
  $("main").prepend(alertHtml);

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    $(".alert").fadeOut();
  }, 5000);
}

// Smooth scrolling for anchor links
$(document).on("click", 'a[href^="#"]', function (e) {
  e.preventDefault();
  const target = $($(this).attr("href"));
  if (target.length) {
    $("html, body").animate(
      {
        scrollTop: target.offset().top - 70,
      },
      500
    );
  }
});

// Initialize tooltips and popovers
$(function () {
  $('[data-bs-toggle="tooltip"]').tooltip();
  $('[data-bs-toggle="popover"]').popover();
});

// Add loading animation for AJAX calls
$(document)
  .ajaxStart(function () {
    $(".loading-spinner").show();
  })
  .ajaxStop(function () {
    $(".loading-spinner").hide();
  });

// Handle contact form submission
function handleContactForm() {
  const formData = {
    name: $("#name").val().trim(),
    email: $("#email").val().trim(),
    phone: $("#phone").val().trim(),
    subject: $("#subject").val().trim(),
    message: $("#message").val().trim(),
  };

  // Validation
  if (!formData.name) {
    return Swal.fire({ title: "Please enter your name", icon: "error" });
  }
  if (!formData.email) {
    return Swal.fire({ title: "Please enter your email", icon: "error" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    return Swal.fire({
      title: "Please enter a valid email address",
      icon: "error",
    });
  }
  if (!formData.phone) {
    return Swal.fire({
      title: "Please enter your phone number",
      icon: "error",
    });
  }
  if (!/^[0-9]{10}$/.test(formData.phone)) {
    return Swal.fire({
      title: "Phone number must be 10 digits",
      icon: "error",
    });
  }
  if (!formData.subject) {
    return Swal.fire({ title: "Please enter a subject", icon: "error" });
  }
  if (!formData.message) {
    return Swal.fire({ title: "Please enter your message", icon: "error" });
  }

  // If all validations pass
  Swal.fire({
    title: "Thank you for your message!",
    text: "We will get back to you soon.",
    icon: "success",
  });
  $("#contact-form")[0].reset();
}

// Privacy Policy Confirmation
$("#privacyConfirm").click(function (e) {
  e.preventDefault();
  Swal.fire({
    title: "Privacy Policy",
    html: `
          <div style="text-align:left;max-height:300px;overflow-y:auto;font-size:14px;line-height:1.5;">
            <p><strong>1. Information We Collect:</strong><br>
            We collect personal details such as your <strong>name, email, and phone number</strong> when you book a ticket or contact us.</p>

            <p><strong>2. How We Use Your Information:</strong><br>
            Your information is used only for <strong>booking confirmations, event updates,</strong> and <strong>customer support.</strong>
            We never share your details with any third party without your permission.</p>

            <p><strong>3. Cookies:</strong><br>
            Our website may use cookies to enhance your experience and remember your preferences.
            You can disable cookies anytime in your browser settings.</p>

            <p><strong>4. Data Protection:</strong><br>
            We take necessary security measures to keep your personal information safe from unauthorized access or misuse.</p>

            <p><strong>5. Policy Updates:</strong><br>
            We may update our Privacy Policy from time to time.
            Please review this page periodically for any changes.</p>

            <p><strong>6. Contact Us:</strong><br>
            If you have any questions about our Privacy Policy, feel free to contact us at 
            <strong>info@tickethub.com</strong>.</p>
          </div>
        `,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "I Agree",
    cancelButtonText: "Decline",
    width: 600,
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire(
        "Thank you!",
        "You have accepted our Privacy Policy.",
        "success"
      );
    } else {
      Swal.fire("Declined", "You did not accept the Privacy Policy.", "error");
    }
  });
});

// Terms of Service Confirmation
$(function () {
  $("#termsConfirm").on("click", function (e) {
    e.preventDefault();
    Swal.fire({
      title: "Terms of Service",
      html: `
            <div style="text-align:left;max-height:320px;overflow-y:auto;font-size:14px;line-height:1.5;">
              <p><strong>1. Booking:</strong><br>
              All bookings are subject to availability. Provide correct contact details and pay at booking.</p>

              <p><strong>2. Ticket Delivery:</strong><br>
              E-tickets are sent via email/SMS after payment.</p>

              <p><strong>3. Cancellations & Refunds:</strong><br>
              Refunds follow organizer policy.</p>

              <p><strong>4. Transfers & Resale:</strong><br>
              Unauthorized resale prohibited.</p>

              <p><strong>5. Entry & Conduct:</strong><br>
              Follow venue rules; misconduct may lead to ejection without refund.</p>

              <p><strong>6. Liability:</strong><br>
              Liability limited to ticket amount paid.</p>

              <p><strong>7. Privacy:</strong><br>
              We collect data for booking and support (see Privacy Policy).</p>

              <p><strong>8. Updates:</strong><br>
              Terms may be updated; continued use implies acceptance.</p>
            </div>
          `,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "I Agree",
      cancelButtonText: "Decline",
      width: 640,
      confirmButtonColor: "#1769ff",
      cancelButtonColor: "#ff5252",
      focusConfirm: false,
    }).then((result) => {
      if (result.isConfirmed) {
        // store consent so we can check later
        try {
          localStorage.setItem("tos_accepted", "1");
        } catch (e) {}
        Swal.fire("Thanks!", "You accepted the Terms of Service.", "success");
      } else {
        Swal.fire(
          "Declined",
          "You did not accept the Terms of Service.",
          "error"
        );
      }
    });
  });
});
