/***** 1. Initialize Firebase *****/
const firebaseConfig = {
  apiKey: "AIzaSyDejHtCx3Lg4NfPjuT8fcrgG_3mif30jsI",
  authDomain: "volunteeringapp-9a1ea.firebaseapp.com",
  projectId: "volunteeringapp-9a1ea",
  storageBucket: "volunteeringapp-9a1ea.firebasestorage.app",
  messagingSenderId: "295158073263",
  appId: "1:295158073263:web:30f9013bd7a1877dad915a",
  measurementId: "G-FLW2S58XJZ"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

/**** Keep user logged in after refresh ****/
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(() => {
    console.log("Auth persistence set to LOCAL");
  })
  .catch((err) => {
    console.error("Error setting persistence:", err);
  });

/***** 2. Define Example Events *****/
const exampleEvents = [
  {
    name: "Beach Cleanup",
    organization: "Ocean Protectors",
    description: "Join us to clean up the local beaches and help preserve marine life.",
    location: "Sandy Shores Beach",
    date: "2025-06-15",
    time: "8AM - 12PM",
    type: "Environment",
    spots: 20,
    organizerName: "John Doe",
    organizerEmail: "johndoe@example.com",
    organizerPhone: "555-1234",
    flyerURL: "",
    userId: "organizerUID1" // Replace with actual organizer UID
  },
  {
    name: "Soup Kitchen Assistance",
    organization: "Helping Hands",
    description: "Assist in preparing and serving meals to those in need.",
    location: "Downtown Shelter",
    date: "2025-06-20",
    time: "11AM - 3PM",
    type: "Community",
    spots: 15,
    organizerName: "Jane Smith",
    organizerEmail: "janesmith@example.com",
    organizerPhone: "555-5678",
    flyerURL: "",
    userId: "organizerUID2" // Replace with actual organizer UID
  },
  {
    name: "Park Tree Planting",
    organization: "Green Earth Org",
    description: "Help plant trees in the central park to enhance green spaces.",
    location: "Central Park",
    date: "2025-07-05",
    time: "9AM - 1PM",
    type: "Environment",
    spots: 25,
    organizerName: "Emily Johnson",
    organizerEmail: "emilyj@example.com",
    organizerPhone: "555-9012",
    flyerURL: "",
    userId: "organizerUID3" // Replace with actual organizer UID
  },
  {
    name: "Senior Center Tutoring",
    organization: "TeachForAll",
    description: "Provide basic computer skills training to seniors.",
    location: "Evergreen Senior Center",
    date: "2025-07-10",
    time: "2PM - 5PM",
    type: "Education",
    spots: 10,
    organizerName: "Michael Brown",
    organizerEmail: "michaelb@example.com",
    organizerPhone: "555-3456",
    flyerURL: "",
    userId: "organizerUID4" // Replace with actual organizer UID
  },
  {
    name: "Animal Shelter Volunteer",
    organization: "Paws & Claws",
    description: "Assist in caring for animals and maintaining the shelter.",
    location: "Happy Tails Animal Shelter",
    date: "2025-07-15",
    time: "10AM - 2PM",
    type: "Animal Welfare",
    spots: 18,
    organizerName: "Sarah Davis",
    organizerEmail: "sarahd@example.com",
    organizerPhone: "555-7890",
    flyerURL: "",
    userId: "organizerUID5" // Replace with actual organizer UID
  }
];

/*****
 * 3. Populate Firebase with Example Events if Empty
 *****/
function populateExampleEvents() {
  database.ref('events').once('value')
    .then((snapshot) => {
      if (!snapshot.exists()) {
        // No events found, populate with example events
        const updates = {};
        exampleEvents.forEach(event => {
          const newEventRef = database.ref('events').push();
          updates[newEventRef.key] = event;
        });
        return database.ref('events').update(updates);
      }
    })
    .then(() => {
      console.log("Example events have been populated.");
      loadVolunteerOpportunities(); // Load events after populating
    })
    .catch((error) => {
      console.error("Error populating example events:", error);
    });
}

/*****
 * 4. LOAD & RENDER Volunteer Opportunities from DB
 *****/
let allEvents = [];

function loadVolunteerOpportunities() {
  allEvents = [];
  const eventsRef = database.ref('events');

  // Listen for real-time updates
  eventsRef.on('value', (snapshot) => {
    allEvents = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnap) => {
        const data = childSnap.val();
        data._key = childSnap.key;
        allEvents.push(data);
      });
    }
    renderVolunteerOpportunities();
  }, (error) => {
    console.error("Error loading events from DB:", error);
    renderVolunteerOpportunities();
  });
}

function renderVolunteerOpportunities() {
  const container = document.getElementById('volunteerOpportunitiesContainer');
  if (!container) return;

  container.innerHTML = "";

  // Read filter values
  const text = document.getElementById('volunteerSearch').value.toLowerCase();
  const type = document.getElementById('volTypeFilter').value;
  const locationFilter = document.getElementById('volLocationFilter').value.toLowerCase();
  const dateFilter = document.getElementById('volDateFilter').value; // "yyyy-mm-dd"
  const timeFilter = document.getElementById('volTimeFilter').value.toLowerCase();

  // Get current user ID
  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  const filtered = allEvents.filter((op) => {
    const name = (op.name || "").toLowerCase();
    const org = (op.organization || "").toLowerCase();
    const loc = (op.location || "").toLowerCase();
    const tm = (op.time || "").toLowerCase();

    const textMatch = (
      name.includes(text) ||
      org.includes(text) ||
      loc.includes(text) ||
      tm.includes(text)
    );

    const typeMatch = (type === "All") ? true : (op.type === type);

    const locMatch = !locationFilter ? true : loc.includes(locationFilter);

    let dateMatch = true;
    if (dateFilter) {
      dateMatch = (op.date === dateFilter);
    }

    let tMatch = true;
    if (timeFilter) {
      tMatch = tm.includes(timeFilter);
    }

    return textMatch && typeMatch && locMatch && dateMatch && tMatch;
  });

  if (filtered.length === 0) {
    container.innerHTML = "<p>No volunteer opportunities found.</p>";
    return;
  }

  // Render each event
  filtered.forEach((ev) => {
    const box = document.createElement('div');
    box.classList.add('volunteer-opportunity-box');

    // Check if the user has already joined this event
    let hasJoined = false;
    if (userId && ev.participants && ev.participants[userId]) {
      hasJoined = true;
    }

    // Determine button state
    let joinButtonHTML = '';
    if (hasJoined) {
      // Only show the "Already Joined" badge
      joinButtonHTML = `<span class="already-joined-badge">Already Joined</span>`;
    } else if (ev.spots > 0) {
      joinButtonHTML = `<button class="join-event-btn" onclick="openJoinEventModal('${ev._key}')">Join Event</button>`;
    } else {
      joinButtonHTML = `<button class="join-event-btn disabled" disabled>Full</button>`;
    }

    box.innerHTML = `
      <h3>${ev.name || "Untitled Event"}</h3>
      <p>Organization: ${ev.organization || "N/A"}</p>
      <p>Location: ${ev.location || "N/A"}</p>
      <p>Date: ${ev.date || "N/A"}</p>
      <p>Time: ${ev.time || "N/A"}</p>
      <p>Spots Left: ${ev.spots || 0}</p>
      ${joinButtonHTML}
      <button class="view-details-btn" onclick="openEventDetails('${ev._key}')">View Details</button>
    `;

    container.appendChild(box);
  });
}

// Filter button & user typing triggers re-render
function applyVolFilter() {
  renderVolunteerOpportunities();
}

/*****
 * 5. ORGANIZE: Create a new event
 *****/
function postNewEvent() {
  // Make sure user is logged in
  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in to create events!");

    // Set a flag in localStorage to remember that the user intended to post an event
    localStorage.setItem('redirectAfterLogin', 'organize');

    // Redirect to the Login form
    showLogin();
    return;
  }

  const nameField = document.getElementById('orgEventName');
  const orgField = document.getElementById('orgEventOrg');
  const descField = document.getElementById('orgEventDesc');
  const locField = document.getElementById('orgEventLocation');
  const dateField = document.getElementById('orgEventDate');
  const timeField = document.getElementById('orgEventTime');
  const typeField = document.getElementById('orgEventType');
  const spotsField = document.getElementById('orgEventSpots');
  const organizerNameField = document.getElementById('orgEventOrganizerName');
  const organizerEmailField = document.getElementById('orgEventOrganizerEmail');
  const organizerPhoneField = document.getElementById('orgEventOrganizerPhone');
  const flyerField = document.getElementById('orgEventFlyer');

  // Gather values
  const eventObj = {
    name: nameField.value.trim(),
    organization: orgField.value.trim(),
    description: descField.value.trim(),
    location: locField.value.trim(),
    date: dateField.value,
    time: timeField.value.trim(),
    type: typeField.value,
    spots: spotsField.value ? parseInt(spotsField.value) : 0,
    organizerName: organizerNameField.value.trim(),
    organizerEmail: organizerEmailField.value.trim(),
    organizerPhone: organizerPhoneField.value.trim(),
    flyerURL: "", // Will be updated after flyer upload
    userId: user.uid, // Associate event with user
    createdAt: firebase.database.ServerValue.TIMESTAMP // Optional: Timestamp
  };

  if (!eventObj.name || !eventObj.date || !eventObj.time || !eventObj.location) {
    alert("Please fill in at least the Event Name, Date, Time, and Location!");
    return;
  }

  // Handle flyer upload if a file is selected
  if (flyerField.files && flyerField.files[0]) {
    const flyerFile = flyerField.files[0];
    const storageRef = storage.ref('event_flyers/' + user.uid + '/' + flyerFile.name);
    const uploadTask = storageRef.put(flyerFile);

    uploadTask.on('state_changed', 
      (snapshot) => {
        // Optional: You can implement a progress indicator here
      }, 
      (error) => {
        console.error("Error uploading flyer:", error);
        alert("Error uploading flyer. Please try again.");
      }, 
      () => {
        // Upload completed successfully, get the download URL
        uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
          eventObj.flyerURL = downloadURL;

          // Now push the event with flyerURL
          database.ref('events').push(eventObj)
            .then(() => {
              alert("Your event has been posted successfully!");

              // Clear the form
              nameField.value = "";
              orgField.value = "";
              descField.value = "";
              locField.value = "";
              dateField.value = "";
              timeField.value = "";
              typeField.value = "Environment";
              spotsField.value = "";
              organizerNameField.value = "";
              organizerEmailField.value = "";
              organizerPhoneField.value = "";
              flyerField.value = "";

              // Optionally, add the new event to "My Plans" if it's open
              loadMyPlans(); // Reload My Plans to include the new event
              loadVolunteerOpportunities(); // Reload Volunteer to include the new event
            })
            .catch((err) => {
              console.error("Error creating new event:", err);
              alert(err.message);
            });
        });
      }
    );
  } else {
    // No flyer uploaded, proceed to push the event
    database.ref('events').push(eventObj)
      .then(() => {
        alert("Your event has been posted successfully!");

        // Clear the form
        nameField.value = "";
        orgField.value = "";
        descField.value = "";
        locField.value = "";
        dateField.value = "";
        timeField.value = "";
        typeField.value = "Environment";
        spotsField.value = "";
        organizerNameField.value = "";
        organizerEmailField.value = "";
        organizerPhoneField.value = "";
        flyerField.value = "";

        // Optionally, add the new event to "My Plans" if it's open
        loadMyPlans(); // Reload My Plans to include the new event
        loadVolunteerOpportunities(); // Reload Volunteer to include the new event
      })
      .catch((err) => {
        console.error("Error creating new event:", err);
        alert(err.message);
      });
  }
}

/*****
 * 6. Modal for Event Details (joinEvent)
 *****/
function openJoinEventModal(eventKey) {
  const event = allEvents.find(ev => ev._key === eventKey);
  if (!event) {
    alert("Event not found.");
    return;
  }

  // Populate the confirmation modal with event details
  document.getElementById('confirmEventName').textContent = event.name || "Untitled Event";
  document.getElementById('confirmEventOrg').textContent = event.organization || "N/A";
  document.getElementById('confirmEventLocation').textContent = event.location || "N/A";
  document.getElementById('confirmEventDate').textContent = event.date || "N/A";
  document.getElementById('confirmEventTime').textContent = event.time || "N/A";
  document.getElementById('confirmEventType').textContent = event.type || "N/A";
  document.getElementById('confirmEventSpots').textContent = event.spots || 0;
  document.getElementById('confirmEventOrganizerName').textContent = event.organizerName || "N/A";
  document.getElementById('confirmEventOrganizerEmail').textContent = event.organizerEmail || "N/A";
  document.getElementById('confirmEventOrganizerPhone').textContent = event.organizerPhone || "N/A";

  // Show the confirmation modal
  const joinModal = document.getElementById('joinEventModal');
  joinModal.setAttribute('data-event-key', eventKey); // Store event key for confirmation
  joinModal.classList.remove('hidden');
}

function closeJoinEventModal() {
  const joinModal = document.getElementById('joinEventModal');
  joinModal.classList.add('hidden');
  joinModal.removeAttribute('data-event-key'); // Remove stored event key
}

/*****
 * 7. Confirm Join Event Function
 *****/
function confirmJoinEvent() {
  const joinModal = document.getElementById('joinEventModal');
  const eventKey = joinModal.getAttribute('data-event-key');

  if (!eventKey) {
    alert("Event key not found.");
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in to join an event!");
    // Redirect to login
    localStorage.setItem('redirectAfterLogin', 'joinEvent');
    showLogin();
    return;
  }

  const eventRef = database.ref(`events/${eventKey}`);
  const participantRef = database.ref(`events/${eventKey}/participants/${user.uid}`);
  const userRef = database.ref(`users/${user.uid}`);

  // Start a transaction to ensure atomicity
  eventRef.transaction((currentEvent) => {
    if (currentEvent) {
      // Check if user already joined
      if (currentEvent.participants && currentEvent.participants[user.uid]) {
        throw "AlreadyJoined";
      }

      // Check if spots are available
      if (currentEvent.spots <= 0) {
        throw "NoSpotsLeft";
      }

      // Decrement spots
      currentEvent.spots -= 1;

      // Initialize participants if not present
      if (!currentEvent.participants) {
        currentEvent.participants = {};
      }

      return currentEvent;
    }
    return; // Abort transaction if event doesn't exist
  }, (error, committed, snapshot) => {
    if (error) {
      if (error === "AlreadyJoined") {
        alert("You have already joined this event.");
      } else if (error === "NoSpotsLeft") {
        alert("Sorry, no spots left for this event.");
      } else {
        console.error("Transaction failed abnormally:", error);
        alert("An error occurred. Please try again.");
      }
      closeJoinEventModal();
    } else if (!committed) {
      alert("Event does not exist.");
      closeJoinEventModal();
    } else {
      // Fetch user details
      userRef.once('value').then((userSnapshot) => {
        const userData = userSnapshot.val();
        if (!userData) throw "User data not found.";

        // Add participant details
        participantRef.set({
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          email: userData.email || "",
          joinedAt: firebase.database.ServerValue.TIMESTAMP
        });

        alert("You have successfully joined the event!");
        closeJoinEventModal();
        loadVolunteerOpportunities();
        loadMyPlans(); // Update "My Plans" to include the joined event
      }).catch((err) => {
        console.error("Error adding participant:", err);
        alert("An error occurred while joining the event.");
        closeJoinEventModal();
      });
    }
  });
}

/*****
 * 8. Auth Logic
 *****/
// Sign Up
const signUpBtn = document.getElementById('signUpBtn');
if (signUpBtn) {
  signUpBtn.addEventListener('click', (e) => {
    e.preventDefault();

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    const remember = document.getElementById('register-check').checked;

    if (!firstName || !lastName || !email || !password) {
      alert("Please fill out all fields!");
      return;
    }

    auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        return database.ref('users/' + user.uid).set({
          firstName: firstName,
          lastName: lastName,
          email: user.email,
          photoURL: "",
          description: "",
          organization: ""
        }).then(() => {
          return user.sendEmailVerification();
        });
      })
      .then(() => {
        if (remember) {
          localStorage.setItem('volunteenRememberEmail', email);
        }
        return auth.signOut();
      })
      .then(() => {
        alert("Registration successful! A verification link has been sent to your email. Please verify and then log in.");
      })
      .catch((error) => {
        console.error("Error creating user:", error);
        alert(error.message);
      });
  });
}

// Sign In
const signInBtn = document.getElementById('signInBtn');
if (signInBtn) {
  signInBtn.addEventListener('click', (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const remember = document.getElementById('login-check').checked;

    if (!email || !password) {
      alert("Please enter your email and password!");
      return;
    }

    auth.signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;

        if (!user.emailVerified) {
          alert("Please verify your email before logging in.");
          return auth.signOut();
        }

        if (remember) {
          localStorage.setItem('volunteenRememberEmail', email);
        } else {
          localStorage.removeItem('volunteenRememberEmail');
        }

        document.getElementById("signInNav").style.display = "none";
        document.getElementById("signUpNav").style.display = "none";
        document.getElementById("profileNav").style.display = "inline-block";
        document.getElementById("logoutNav").style.display = "inline-block";
        document.getElementById("myPlansNav").style.display = "inline-block"; // Show "My Plans"

        alert("Login successful! Your email is verified.");

        // Check if user was redirected to login for event creation
        const redirectAfterLogin = localStorage.getItem('redirectAfterLogin');
        if (redirectAfterLogin === 'organize') {
          localStorage.removeItem('redirectAfterLogin');
          showOrganize();
          alert("You can now proceed to create your event.");
        } else {
          showProfile();
        }
      })
      .catch((error) => {
        console.error("Error signing in:", error);
        alert(error.message);
      });
  });
}

// Keep user logged in after refresh
auth.onAuthStateChanged((user) => {
  if (user && user.emailVerified) {
    document.getElementById("signInNav").style.display = "none";
    document.getElementById("signUpNav").style.display = "none";
    document.getElementById("profileNav").style.display = "inline-block";
    document.getElementById("logoutNav").style.display = "inline-block";
    document.getElementById("myPlansNav").style.display = "inline-block"; // Show "My Plans"

    // Optionally, load My Plans if currently in that view
    if (!document.getElementById('myPlansSection').classList.contains('hidden')) {
      loadMyPlans();
    }
  } else {
    document.getElementById("signInNav").style.display = "inline-block";
    document.getElementById("signUpNav").style.display = "inline-block";
    document.getElementById("profileNav").style.display = "none";
    document.getElementById("logoutNav").style.display = "none";
    document.getElementById("myPlansNav").style.display = "none"; // Hide "My Plans"

    // If the user is viewing My Plans, redirect them to Home
    if (!document.getElementById('myPlansSection').classList.contains('hidden')) {
      showHome();
      alert("Please sign in to view your plans.");
    }
  }
});

// Logout
function logout() {
  auth.signOut()
    .then(() => {
      document.getElementById("signInNav").style.display = "inline-block";
      document.getElementById("signUpNav").style.display = "inline-block";
      document.getElementById("profileNav").style.display = "none";
      document.getElementById("logoutNav").style.display = "none";
      document.getElementById("myPlansNav").style.display = "none"; // Hide "My Plans"
      showHome();
      alert("You have been logged out successfully.");
    })
    .catch((error) => {
      console.error("Error logging out:", error);
      alert(error.message);
    });
}

/*****
 * 9. Profile Logic
 *****/
function loadUserProfile() {
  const user = auth.currentUser;
  if (!user) {
    console.log("No user is logged in.");
    return;
  }
  const uid = user.uid;
  database.ref('users/' + uid).once('value')
    .then((snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.val();

      document.getElementById('profileEmail').textContent = data.email || user.email;
      document.getElementById('profileName').textContent =
        (data.firstName || "") + " " + (data.lastName || "");
      if (data.photoURL) {
        document.getElementById('profilePhoto').src = data.photoURL;
      } else {
        document.getElementById('profilePhoto').src = "images/default-profile.png";
      }
      document.getElementById('profileDescription').value = data.description || "";
      document.getElementById('profileOrg').value = data.organization || "";
    })
    .catch((error) => {
      console.error("Error fetching profile data:", error);
    });
}

function updateUserProfile() {
  const user = auth.currentUser;
  if (!user) {
    alert("No user logged in. Cannot update profile.");
    return;
  }
  const uid = user.uid;

  const description = document.getElementById('profileDescription').value.trim();
  const organization = document.getElementById('profileOrg').value.trim();
  const photoFile = document.getElementById('profilePhotoInput') ? document.getElementById('profilePhotoInput').files[0] : null;

  if (!photoFile) {
    database.ref('users/' + uid).update({
      description: description,
      organization: organization
    })
      .then(() => {
        alert("Profile updated successfully (no new photo).");
        loadUserProfile();
      })
      .catch((error) => {
        console.error("Error updating profile:", error);
        alert(error.message);
      });
  } else {
    const storageRef = storage.ref('profile_photos/' + uid + '/' + photoFile.name);
    storageRef.put(photoFile)
      .then((snapshot) => snapshot.ref.getDownloadURL())
      .then((downloadURL) => {
        return database.ref('users/' + uid).update({
          photoURL: downloadURL,
          description: description,
          organization: organization
        });
      })
      .then(() => {
        alert("Profile updated successfully with new photo.");
        loadUserProfile();
      })
      .catch((error) => {
        console.error("Error uploading photo or updating profile:", error);
        alert(error.message);
      });
  }
}

/*****
 * 10. Forgot Password
 *****/
function forgotPasswordSubmit() {
  const email = document.getElementById('forgotEmail').value.trim();
  if (!email) {
    alert("Please enter your email.");
    return;
  }
  auth.sendPasswordResetEmail(email)
    .then(() => {
      alert("A password reset link has been sent to your email.");
      login(); // go back to login
    })
    .catch((error) => {
      console.error("Error sending reset email:", error);
      alert(error.message);
    });
}

/*****
 * 11. Show/Hide Password
 *****/
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  if (input.type === "password") {
    input.type = "text";
  } else {
    input.type = "password";
  }
}

/*****
 * 12. Chatbot Logic
 *****/
function checkEnter(event) {
  // If user presses Enter (and not Shift+Enter), send
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendChatMessage();
  }
}

function sendChatMessage() {
  const input = document.getElementById("chatInput");
  const msg = input.value.trim();
  if (!msg) return;

  appendMessage("user", msg);
  input.value = "";

  // Simulate a chatbot response (replace with your actual AI logic)
  setTimeout(() => {
    const response = generateChatbotResponse(msg);
    appendMessage("bot", response);
  }, 600);
}

function generateChatbotResponse(userText) {
  // Placeholder logic
  return "This is a placeholder response from the chatbot. You asked: " + userText;
}

function appendMessage(sender, text) {
  const chatMessages = document.getElementById("chatMessages");
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", sender);
  messageDiv.textContent = text;
  chatMessages.appendChild(messageDiv);
  // Auto-scroll
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/*****
 * 13. Initial Load: Populate Example Events and Show Home
 *****/
window.onload = () => {
  populateExampleEvents();
  showHome();

  // Attach submit event listener to editEventForm
  const editEventForm = document.getElementById('editEventForm');
  if (editEventForm) {
    editEventForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const eventKey = this.getAttribute('data-event-key');
      if (eventKey) {
        saveEditedEvent(eventKey);
      } else {
        alert("Error: Event key not found.");
      }
    });
  }
};

/*****
 * 14. Utility Functions for Navigation
 *****/
function myMenuFunction() {
  const nav = document.getElementById("navMenu");
  if (nav.className === "nav-menu") {
    nav.className += " responsive";
  } else {
    nav.className = "nav-menu";
  }
}

function hideAllSections() {
  const sections = [
    'homeSection',
    'chatSection',
    'impactSection',
    'profileSection',
    'volunteerSection',
    'organizeSection',
    'myPlansSection',
    'login',
    'register',
    'forgotPasswordForm',
    'eventModal',
    'participantsModal',
    'editEventModal',
    'joinEventModal' // Added new modal
  ];
  sections.forEach(id => {
    const section = document.getElementById(id);
    if (section) {
      section.classList.add('hidden');
    }
  });
}

function showHome() {
  hideAllSections();
  const home = document.getElementById('homeSection');
  if (home) {
    home.classList.remove('hidden');
  }
  removeActiveLink();
  const homeLink = document.getElementById('homeLink');
  if (homeLink) {
    homeLink.classList.add('active');
  }
}

function showChat() {
  hideAllSections();
  const chat = document.getElementById('chatSection');
  if (chat) {
    chat.classList.remove('hidden');
  }
  removeActiveLink();
  const chatLink = document.querySelector('#navMenu .nav-link[onclick="showChat()"]');
  if (chatLink) {
    chatLink.classList.add('active');
  }
}

function showImpact() {
  hideAllSections();
  const impact = document.getElementById('impactSection');
  if (impact) {
    impact.classList.remove('hidden');
  }
  removeActiveLink();
  const impactLink = document.querySelector('#navMenu .nav-link[onclick="showImpact()"]');
  if (impactLink) {
    impactLink.classList.add('active');
  }
}

function showVolunteer() {
  hideAllSections();
  const volunteer = document.getElementById('volunteerSection');
  if (volunteer) {
    volunteer.classList.remove('hidden');
  }
  removeActiveLink();
  const volunteerLink = document.querySelector('#navMenu .nav-link[onclick="showVolunteer()"]');
  if (volunteerLink) {
    volunteerLink.classList.add('active');
  }
  loadVolunteerOpportunities(); // Load events from DB
}

function showOrganize() {
  hideAllSections();
  const organize = document.getElementById('organizeSection');
  if (organize) {
    organize.classList.remove('hidden');
  }
  removeActiveLink();
  const organizeLink = document.querySelector('#navMenu .nav-link[onclick="showOrganize()"]');
  if (organizeLink) {
    organizeLink.classList.add('active');
  }
}

function showMyPlans() {
  hideAllSections();
  const myPlans = document.getElementById('myPlansSection');
  if (myPlans) {
    myPlans.classList.remove('hidden');
  }
  removeActiveLink();
  const myPlansLink = document.querySelector('#myPlansNav .nav-link');
  if (myPlansLink) {
    myPlansLink.classList.add('active');
  }
  loadMyPlans(); // Load user's events
}

function showProfile() {
  hideAllSections();
  const profile = document.getElementById('profileSection');
  if (profile) {
    profile.classList.remove('hidden');
  }
  removeActiveLink();
  const profileLink = document.querySelector('#navMenu .nav-link[onclick="showProfile()"]');
  if (profileLink) {
    profileLink.classList.add('active');
  }
  loadUserProfile();
}

function login() {
  hideAllSections();
  const loginForm = document.getElementById('login');
  if (loginForm) {
    loginForm.classList.remove('hidden');
  }
  removeActiveLink();
}

function register() {
  hideAllSections();
  const registerForm = document.getElementById('register');
  if (registerForm) {
    registerForm.classList.remove('hidden');
  }
  removeActiveLink();
}

function showForgotPassword() {
  hideAllSections();
  const forgotForm = document.getElementById('forgotPasswordForm');
  if (forgotForm) {
    forgotForm.classList.remove('hidden');
  }
}

function removeActiveLink() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => link.classList.remove('active'));
}

/*****
 * 15. My Plans Related Functions
 *****/

// Load My Plans Events
function loadMyPlans() {
  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in to view your plans.");
    showHome();
    return;
  }

  const organizedEventsContainer = document.getElementById('organizedEventsContainer');
  const joinedEventsContainer = document.getElementById('joinedEventsContainer');
  organizedEventsContainer.innerHTML = "Loading your organized events...";
  joinedEventsContainer.innerHTML = "Loading your joined events...";

  // Fetch Organized Events
  database.ref('events').orderByChild('userId').equalTo(user.uid).once('value')
    .then((snapshot) => {
      organizedEventsContainer.innerHTML = ""; // Clear loading text
      if (!snapshot.exists()) {
        organizedEventsContainer.innerHTML = "<p>You have not organized any events yet.</p>";
        return;
      }

      snapshot.forEach((childSnap) => {
        const event = childSnap.val();
        event._key = childSnap.key; // Store event key for reference
        organizedEventsContainer.appendChild(createMyPlanEventElement(event, true));
      });
    })
    .catch((error) => {
      console.error("Error loading organized events:", error);
      organizedEventsContainer.innerHTML = "<p>Error loading your organized events. Please try again later.</p>";
    });

  // Fetch Joined Events
  // To get joined events, we need to query events where participants include the user's UID
  database.ref('events').orderByChild(`participants/${user.uid}/joinedAt`).startAt(0).once('value')
    .then((snapshot) => {
      joinedEventsContainer.innerHTML = ""; // Clear loading text
      if (!snapshot.exists()) {
        joinedEventsContainer.innerHTML = "<p>You have not joined any events yet.</p>";
        return;
      }

      snapshot.forEach((childSnap) => {
        const event = childSnap.val();
        event._key = childSnap.key; // Store event key for reference
        joinedEventsContainer.appendChild(createMyPlanEventElement(event, false));
      });
    })
    .catch((error) => {
      console.error("Error loading joined events:", error);
      joinedEventsContainer.innerHTML = "<p>Error loading your joined events. Please try again later.</p>";
    });
}

// Create Event Element for My Plans
// isOrganized: true if the event is organized by the user, false if joined
function createMyPlanEventElement(event, isOrganized) {
  const eventDiv = document.createElement('div');
  eventDiv.classList.add('my-plan-event-box');

  // Determine buttons based on event type
  let buttonsHTML = `
    <button class="view-participants-btn" onclick="viewParticipants('${event._key}')">View Participants</button>
  `;

  if (isOrganized) {
    buttonsHTML += `
      <button class="edit-event-btn" onclick="editMyPlanEvent('${event._key}')">Edit</button>
      <button class="delete-event-btn" onclick="deleteMyPlanEvent('${event._key}')">Delete</button>
    `;
  } else {
    buttonsHTML += `
      <button class="cancel-participation-btn" onclick="promptCancelParticipation('${event._key}')">Cancel Participation</button>
    `;
  }

  // Add "View Details" button with improved appearance
  eventDiv.innerHTML = `
    <h3>${event.name || "Untitled Event"}</h3>
    <p><strong>Organization:</strong> ${event.organization || "N/A"}</p>
    <p><strong>Location:</strong> ${event.location || "N/A"}</p>
    <p><strong>Date:</strong> ${event.date || "N/A"}</p>
    <p><strong>Time:</strong> ${event.time || "N/A"}</p>
    <p><strong>Type:</strong> ${event.type || "N/A"}</p>
    <p><strong>Spots Left:</strong> ${event.spots || 0}</p>
    ${buttonsHTML}
    <!-- Event Flyer (if available) -->
    ${event.flyerURL ? `<img src="${event.flyerURL}" alt="Event Flyer" style="max-width: 100%; height: auto; border-radius: 5px; margin-top: 10px;">` : ""}
    <button class="view-details-btn" onclick="openEventDetails('${event._key}')">View Details</button>
  `;

  return eventDiv;
}

// View Event Details in a Modal
function openEventDetails(eventKey) {
  const event = allEvents.find(ev => ev._key === eventKey);
  if (!event) {
    alert("Event not found.");
    return;
  }

  // Populate the event details modal
  document.getElementById('detailEventName').textContent = event.name || "Untitled Event";
  document.getElementById('detailEventOrg').textContent = event.organization || "N/A";
  document.getElementById('detailEventLocation').textContent = event.location || "N/A";
  document.getElementById('detailEventDate').textContent = event.date || "N/A";
  document.getElementById('detailEventTime').textContent = event.time || "N/A";
  document.getElementById('detailEventSpots').textContent = event.spots || 0;
  document.getElementById('detailEventOrganizerName').textContent = event.organizerName || "N/A";
  document.getElementById('detailEventOrganizerEmail').textContent = event.organizerEmail || "N/A";
  document.getElementById('detailEventOrganizerPhone').textContent = event.organizerPhone || "N/A";
  document.getElementById('detailEventDescription').textContent = event.description || "N/A";

  if (event.flyerURL) {
    const flyerImg = document.getElementById('detailEventFlyer');
    flyerImg.src = event.flyerURL;
    flyerImg.style.display = "block";
  } else {
    document.getElementById('detailEventFlyer').style.display = "none";
  }

  // Show the event details modal
  const eventModal = document.getElementById('eventModal');
  eventModal.classList.remove('hidden');
}

// Close Event Details Modal
function closeEventModal() {
  const modal = document.getElementById('eventModal');
  modal.classList.add('hidden');
}

// PARTICIPANTS MODAL LOGIC

function viewParticipants(eventKey) {
  const event = allEvents.find(ev => ev._key === eventKey);
  if (!event) {
    alert("Event not found.");
    return;
  }

  // Fetch participants
  database.ref(`events/${eventKey}/participants`).once('value')
    .then((snapshot) => {
      const participants = snapshot.val();
      let participantsHTML = "";

      if (!participants) {
        participantsHTML = "<p>No participants have joined this event yet.</p>";
      } else {
        participantsHTML = "<ul>";
        Object.values(participants).forEach(participant => {
          participantsHTML += `<li>${participant.firstName} ${participant.lastName} - ${participant.email}</li>`;
        });
        participantsHTML += "</ul>";
      }

      // Populate and show the modal
      document.getElementById('participantsList').innerHTML = participantsHTML;
      const participantsModal = document.getElementById('participantsModal');
      participantsModal.classList.remove('hidden');
    })
    .catch((error) => {
      console.error("Error fetching participants:", error);
      alert("An error occurred while fetching participants.");
    });
}

// Close Participants Modal
function closeParticipantsModal() {
  const participantsModal = document.getElementById('participantsModal');
  participantsModal.classList.add('hidden');
}

/*****
 * 16. Cancel Participation Function with Confirmation Prompt
 *****/

// Function to prompt confirmation before canceling participation
function promptCancelParticipation(eventKey) {
  const confirmationModal = document.createElement('div');
  confirmationModal.classList.add('modal', 'confirmation-modal');

  confirmationModal.innerHTML = `
    <div class="modal-content">
      <span class="close-btn" onclick="closeConfirmationModal(this)">&times;</span>
      <h2>Confirm Cancellation</h2>
      <p>Are you sure you want to cancel your participation in this event?</p>
      <button class="confirm-btn" onclick="cancelParticipation('${eventKey}')">Yes, Cancel</button>
      <button class="cancel-btn" onclick="closeConfirmationModal(this)">No, Keep</button>
    </div>
  `;

  document.body.appendChild(confirmationModal);
  confirmationModal.classList.remove('hidden');
}

// Function to close the confirmation modal
function closeConfirmationModal(element) {
  const modal = element.closest('.modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.remove();
  }
}

// Cancel Participation
function cancelParticipation(eventKey) {
  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in to cancel your participation.");
    showLogin();
    return;
  }

  const eventRef = database.ref(`events/${eventKey}`);
  const participantRef = database.ref(`events/${eventKey}/participants/${user.uid}`);

  // Start a transaction to safely remove participant and increment spots
  eventRef.transaction((currentEvent) => {
    if (currentEvent) {
      // Check if user has joined
      if (!currentEvent.participants || !currentEvent.participants[user.uid]) {
        throw "NotJoined";
      }

      // Increment spots
      currentEvent.spots += 1;

      // Remove participant
      delete currentEvent.participants[user.uid];

      return currentEvent;
    }
    return; // Abort transaction if event doesn't exist
  }, (error, committed, snapshot) => {
    if (error) {
      if (error === "NotJoined") {
        alert("You are not a participant of this event.");
      } else {
        console.error("Transaction failed abnormally:", error);
        alert("An error occurred. Please try again.");
      }
    } else if (!committed) {
      alert("Event does not exist.");
    } else {
      alert("You have successfully canceled your participation in the event.");
      loadVolunteerOpportunities();
      loadMyPlans(); // Update "My Plans" to reflect the cancellation
    }
  });
}

/*****
 * 17. Edit Event Functions
 *****/
function editMyPlanEvent(eventKey) {
  // Fetch the event data
  database.ref(`events/${eventKey}`).once('value')
    .then((snapshot) => {
      if (!snapshot.exists()) {
        alert("Event not found.");
        return;
      }
      const event = snapshot.val();
      event._key = snapshot.key;
      populateEditEventModal(event);
    })
    .catch((error) => {
      console.error("Error fetching event for editing:", error);
      alert("Error fetching event details. Please try again.");
    });
}

// Populate Edit Event Modal
function populateEditEventModal(event) {
  // Populate the form with existing event data
  document.getElementById('editEventName').value = event.name || "";
  document.getElementById('editEventOrg').value = event.organization || "";
  document.getElementById('editEventDesc').value = event.description || "";
  document.getElementById('editEventLocation').value = event.location || "";
  document.getElementById('editEventDate').value = event.date || "";
  document.getElementById('editEventTime').value = event.time || "";
  document.getElementById('editEventType').value = event.type || "Environment";
  document.getElementById('editEventSpots').value = event.spots || 0;
  document.getElementById('editEventOrganizerName').value = event.organizerName || "";
  document.getElementById('editEventOrganizerEmail').value = event.organizerEmail || "";
  document.getElementById('editEventOrganizerPhone').value = event.organizerPhone || "";

  // Set the event key as a data attribute on the form
  const editEventForm = document.getElementById('editEventForm');
  editEventForm.setAttribute('data-event-key', event._key);

  // Show the modal
  const editModal = document.getElementById('editEventModal');
  editModal.classList.remove('hidden');
}

// Close Edit Event Modal
function closeEditEventModal() {
  const editModal = document.getElementById('editEventModal');
  editModal.classList.add('hidden');
}

/*****
 * 18. Save Edited Event Function
 *****/
function saveEditedEvent(eventKey) {
  const user = auth.currentUser;
  if (!user) {
    alert("No user logged in. Cannot edit event.");
    return;
  }

  const eventRef = database.ref(`events/${eventKey}`);

  // Fetch current event data to verify ownership
  eventRef.once('value').then((snapshot) => {
    if (!snapshot.exists()) {
      throw "Event does not exist.";
    }
    const event = snapshot.val();
    if (event.userId !== user.uid) {
      throw "Unauthorized";
    }

    return;
  }).then(() => {
    const name = document.getElementById('editEventName').value.trim();
    const org = document.getElementById('editEventOrg').value.trim();
    const desc = document.getElementById('editEventDesc').value.trim();
    const loc = document.getElementById('editEventLocation').value.trim();
    const date = document.getElementById('editEventDate').value;
    const time = document.getElementById('editEventTime').value.trim();
    const type = document.getElementById('editEventType').value;
    const spots = document.getElementById('editEventSpots').value ? parseInt(document.getElementById('editEventSpots').value) : 0;
    const organizerName = document.getElementById('editEventOrganizerName').value.trim();
    const organizerEmail = document.getElementById('editEventOrganizerEmail').value.trim();
    const organizerPhone = document.getElementById('editEventOrganizerPhone').value.trim();
    const flyerField = document.getElementById('editEventFlyer');

    if (!name || !date || !time || !loc) {
      alert("Please fill in at least the Event Name, Date, Time, and Location!");
      return;
    }

    // Function to update the event after handling flyer upload (if any)
    const updateEvent = (flyerURL) => {
      const updatedEvent = {
        name,
        organization: org,
        description: desc,
        location: loc,
        date,
        time,
        type,
        spots,
        organizerName,
        organizerEmail,
        organizerPhone
      };
      if (flyerURL) {
        updatedEvent.flyerURL = flyerURL;
      }

      return eventRef.update(updatedEvent)
        .then(() => {
          alert("Event updated successfully!");
          closeEditEventModal();
          loadMyPlans(); // Reload My Plans to reflect changes
          loadVolunteerOpportunities(); // Reload Volunteer section to reflect changes
        });
    };

    // Handle flyer upload if a file is selected
    if (flyerField.files && flyerField.files[0]) {
      const flyerFile = flyerField.files[0];
      const storageRef = storage.ref('event_flyers/' + user.uid + '/' + flyerFile.name);
      const uploadTask = storageRef.put(flyerFile);

      uploadTask.on('state_changed', 
        (snapshot) => {
          // Optional: You can implement a progress indicator here
        }, 
        (error) => {
          console.error("Error uploading flyer:", error);
          alert("Error uploading flyer. Please try again.");
        }, 
        () => {
          // Upload completed successfully, get the download URL
          uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
            updateEvent(downloadURL);
          });
        }
      );
    } else {
      // No flyer uploaded, proceed to update the event
      updateEvent();
    }
  }).catch((error) => {
    if (error === "Event does not exist.") {
      alert("Event does not exist.");
    } else if (error === "Unauthorized") {
      alert("You are not authorized to edit this event.");
    } else {
      console.error("Error editing event:", error);
      alert("An error occurred while editing the event.");
    }
  });
}

/*****
 * 19. Delete Event Function
 *****/
function deleteMyPlanEvent(eventKey) {
  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in to delete an event.");
    showLogin();
    return;
  }

  const eventRef = database.ref(`events/${eventKey}`);

  // Fetch event data to verify ownership
  eventRef.once('value').then((snapshot) => {
    if (!snapshot.exists()) {
      throw "Event does not exist.";
    }
    const event = snapshot.val();
    if (event.userId !== user.uid) {
      throw "Unauthorized";
    }

    // Proceed to delete
    return eventRef.remove();
  }).then(() => {
    alert("Event deleted successfully.");
    loadMyPlans();
    loadVolunteerOpportunities();
  }).catch((error) => {
    if (error === "Event does not exist.") {
      alert("Event does not exist.");
    } else if (error === "Unauthorized") {
      alert("You are not authorized to delete this event.");
    } else {
      console.error("Error deleting event:", error);
      alert("An error occurred while deleting the event.");
    }
  });
}

/*****
 * 20. Modal Close Logic
 *****/
// Close modals when clicking outside of modal content
window.onclick = function(event) {
  const editModal = document.getElementById('editEventModal');
  const eventModal = document.getElementById('eventModal');
  const participantsModal = document.getElementById('participantsModal');
  const joinEventModal = document.getElementById('joinEventModal');
  const confirmationModal = document.querySelector('.confirmation-modal');

  if (event.target == editModal) {
    editModal.classList.add('hidden');
  }
  if (event.target == eventModal) {
    eventModal.classList.add('hidden');
  }
  if (event.target == participantsModal) {
    participantsModal.classList.add('hidden');
  }
  if (event.target == joinEventModal) {
    joinEventModal.classList.add('hidden');
    joinEventModal.removeAttribute('data-event-key');
  }
  if (event.target == confirmationModal) {
    confirmationModal.classList.add('hidden');
    confirmationModal.remove();
  }
};

// Close modals on Escape key press
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    closeEditEventModal();
    closeEventModal();
    closeParticipantsModal();
    closeJoinEventModal();
    // Also close any open confirmation modals
    const confirmationModal = document.querySelector('.confirmation-modal');
    if (confirmationModal) {
      confirmationModal.classList.add('hidden');
      confirmationModal.remove();
    }
  }
});

