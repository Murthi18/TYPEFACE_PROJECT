// ============================================================================
// signup.js — Handles user signup flow for TypeFace Personal Finance
// ============================================================================

// ----------------- Config -----------------
const API_BASE = (window.VITE_API_BASE || "http://localhost:5001");

// Utility: shortcut for querySelector
function $(sel){ return document.querySelector(sel); }

// ----------------- Signup form wiring -----------------
/**
 * Attaches a submit handler to the signup form.
 * 
 * Flow:
 *  1. Validate inputs via HTML5 constraints (required, minlength, etc).
 *  2. Build payload { name, email, password }.
 *  3. Send POST /api/auth/signup to Flask backend with credentials (cookies).
 *  4. Handle errors (backend validation or network).
 *  5. On success → redirect user to dashboard.
 */
function wireSignup(){
  // Only run on signup.html
  if (document.body?.dataset?.page !== "signup") return;

  const form = $("#signupForm");
  if(!form) return;

  form.addEventListener("submit", async (e) => {
    // Let browser run built-in validation first
    if (!form.checkValidity()) { 
      e.preventDefault(); 
      form.reportValidity(); 
      return; 
    }
    e.preventDefault(); // block default GET submission

    // Build payload
    const payload = {
      name:  $("#name").value.trim(),
      email: $("#email").value.trim().toLowerCase(),
      password: $("#pwd").value
    };

    try{
      // Send signup request to backend
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",   // send/receive session cookie
        body: JSON.stringify(payload)
      });

      // Parse JSON response safely
      const data = await res.json().catch(() => ({}));

      // Handle server errors (e.g., email already exists)
      if(!res.ok){
        alert(data.error || "Sign up failed");
        return;
      }

      // Success → server already created session
      // Redirect user to dashboard
      window.location.href = "dashboard.html";
    }catch(err){
      console.error("Signup error", err);
      alert("Network error — please try again.");
    }
  });
}

// ----------------- Boot -----------------
document.addEventListener("DOMContentLoaded", wireSignup);
