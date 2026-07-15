const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
const year = document.querySelector("#year");
const API_BASE_URL = "https://api.hasanbuttar.com/api";
const UPDATE_PROFILE_ENDPOINT = `${API_BASE_URL}/updateprofile`;

if (year) {
  year.textContent = new Date().getFullYear().toString();
}

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", isOpen.toString());
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

const allowTelemetry = document.querySelector("#allow-lab-telemetry");
const declineTelemetry = document.querySelector("#decline-lab-telemetry");
const telemetryStatus = document.querySelector("#lab-telemetry-status");
const labConsentSection = document.querySelector(".lab-consent");

function getStoredConsent() {
  try {
    return localStorage.getItem("labTelemetryConsent");
  } catch {
    return null;
  }
}

function setStoredConsent(value) {
  try {
    localStorage.setItem("labTelemetryConsent", value);
  } catch {
    // Some private browsers block storage; the location flow still works without it.
  }
}

function setTelemetryStatus(message) {
  if (telemetryStatus) {
    telemetryStatus.textContent = message;
  }
}

function getBaseTelemetryRecord(consentStatus, geolocationStatus) {
  return {
    consentStatus,
    geolocationStatus,
    capturedAt: new Date().toISOString(),
    ip: "",
    city: "",
    region: "",
    country: "",
    latitude: null,
    longitude: null,
    accuracy: null,
    isp: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    userAgent: navigator.userAgent,
    referrer: document.referrer || window.location.href,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height
  };
}

async function postUserRecord(record) {
  const response = await fetch(UPDATE_PROFILE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(record)
  });

  if (!response.ok) {
    throw new Error(`Backend returned ${response.status}`);
  }
}

function requestCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    });
  });
}

async function capturePreciseLocation() {
  if (!("geolocation" in navigator)) {
    const record = getBaseTelemetryRecord("granted", "unsupported");
    await postUserRecord(record);
    setTelemetryStatus("This browser does not support location sharing.");
    return;
  }

  const position = await requestCurrentPosition();
  const record = {
    ...getBaseTelemetryRecord("granted", "granted"),
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy
  };

  await postUserRecord(record);
  setStoredConsent("granted");
  setTelemetryStatus("Location recorded successfully.");
}

async function recordDeniedLocation(error) {
  const denied = error && error.code === 1;
  const record = getBaseTelemetryRecord("denied", denied ? "denied" : "unavailable");

  try {
    await postUserRecord(record);
  } catch {
    // Keep the browser permission message as the primary feedback.
  }

  setTelemetryStatus(
    denied
      ? "Location permission was denied by the browser."
      : "Location was unavailable. Please check location services and try again."
  );
}

if (allowTelemetry) {
  allowTelemetry.addEventListener("click", async () => {
    allowTelemetry.setAttribute("disabled", "disabled");
    setTelemetryStatus("Waiting for browser location permission...");

    try {
      await capturePreciseLocation();
    } catch (error) {
      await recordDeniedLocation(error);
    } finally {
      allowTelemetry.removeAttribute("disabled");
    }
  });
}

if (declineTelemetry) {
  declineTelemetry.addEventListener("click", () => {
    setStoredConsent("declined");
    if (labConsentSection) {
      labConsentSection.hidden = true;
    }
  });
}

if (getStoredConsent() === "granted") {
  capturePreciseLocation().catch(() => {
    setTelemetryStatus("Tap Share Location to refresh your location permission.");
  });
}
