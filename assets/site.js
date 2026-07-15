const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
const year = document.querySelector("#year");
const API_BASE_URL = "https://api.hasanbuttar.com/api";
const UPDATE_PROFILE_ENDPOINT = `${API_BASE_URL}/updateprofile`;
const IP_GEOLOCATION_ENDPOINT = "https://ipwho.is/";
let scrollTelemetrySent = false;

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

function getSessionValue(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function setSessionValue(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Some private browsers block storage; the in-memory flag still prevents repeats.
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

async function getIpGeolocationRecord() {
  const record = getBaseTelemetryRecord("fallback", "ip_provider_scroll");

  const response = await fetch(IP_GEOLOCATION_ENDPOINT, {
    headers: {
      "Accept": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`IP geolocation provider returned ${response.status}`);
  }

  const ipData = await response.json();

  return {
    ...record,
    ip: ipData.ip || "",
    city: ipData.city || "",
    region: ipData.region || "",
    country: ipData.country || ipData.country_code || "",
    latitude: ipData.latitude || null,
    longitude: ipData.longitude || null,
    accuracy: null,
    isp: (ipData.connection && (ipData.connection.isp || ipData.connection.org)) || "",
    timezone: (ipData.timezone && ipData.timezone.id) || record.timezone
  };
}

async function getIpGeolocationDetails() {
  const record = await getIpGeolocationRecord();

  return {
    ip: record.ip,
    city: record.city,
    region: record.region,
    country: record.country,
    isp: record.isp,
    timezone: record.timezone
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
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation is not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    });
  });
}

async function getPreciseGeolocationRecord() {
  const position = await requestCurrentPosition();
  const ipDetails = await getIpGeolocationDetails().catch(() => ({}));

  return {
    ...getBaseTelemetryRecord("granted", "granted_scroll"),
    ...ipDetails,
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy
  };
}

async function captureScrollLocation() {
  if (scrollTelemetrySent || getSessionValue("labScrollTelemetrySent") === "true") {
    return;
  }

  scrollTelemetrySent = true;
  setSessionValue("labScrollTelemetrySent", "true");

  try {
    const record = await getPreciseGeolocationRecord();
    await postUserRecord(record);
  } catch (error) {
    try {
      const fallbackRecord = await getIpGeolocationRecord();
      await postUserRecord({
        ...fallbackRecord,
        consentStatus: error && error.code === 1 ? "denied" : "fallback",
        geolocationStatus: error && error.code === 1 ? "denied_ip_fallback" : "unavailable_ip_fallback"
      });
    } catch {
      scrollTelemetrySent = false;
      setSessionValue("labScrollTelemetrySent", "false");
    }
  }
}

window.addEventListener("scroll", captureScrollLocation, {
  passive: true,
  once: true
});
