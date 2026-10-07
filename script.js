// Mock analysis engine for the hackathon prototype.
// Replace this logic with a REST API call to POST /api/analyze when backend integration is ready.

const state = {
  activeTab: "screenshot",
  uploadedFile: null,
  uploadedName: "",
  lastResult: null,
};

const app = {
  nav: document.querySelector(".main-nav"),
  navToggle: document.querySelector(".nav-toggle"),
  tabs: document.querySelectorAll(".tab-btn"),
  panels: document.querySelectorAll(".tab-panel"),
  uploadArea: document.getElementById("uploadArea"),
  imageInput: document.getElementById("imageInput"),
  fileMeta: document.getElementById("fileMeta"),
  previewWrap: document.getElementById("previewWrap"),
  previewImage: document.getElementById("previewImage"),
  removeImageBtn: document.getElementById("removeImageBtn"),
  demoScanBtn: document.getElementById("demoScanBtn"),
  resetScanBtn: document.getElementById("resetScanBtn"),
  scanImageBtn: document.getElementById("scanImageBtn"),
  screenshotForm: document.getElementById("screenshotForm"),
  upiForm: document.getElementById("upiForm"),
  urlForm: document.getElementById("urlForm"),
  upiInput: document.getElementById("upiInput"),
  urlInput: document.getElementById("urlInput"),
  loadingState: document.getElementById("loadingState"),
  resultPanel: document.getElementById("resultPanel"),
  message: document.getElementById("message"),
  riskScoreValue: document.getElementById("riskScoreValue"),
  resultStatus: document.getElementById("resultStatus"),
  resultReasons: document.getElementById("resultReasons"),
  resultRecommendation: document.getElementById("resultRecommendation"),
  analysisUpi: document.getElementById("analysisUpi"),
  analysisPage: document.getElementById("analysisPage"),
  analysisQr: document.getElementById("analysisQr"),
  analysisScam: document.getElementById("analysisScam"),
};

function setMessage(text, type = "") {
  app.message.textContent = text;
  app.message.className = "status-message";
  if (type) {
    app.message.classList.add(type);
  }
}

function showLoading() {
  app.loadingState.classList.remove("hidden");
  app.resultPanel.classList.add("hidden");
  setMessage("");
}

function hideLoading() {
  app.loadingState.classList.add("hidden");
}

function getRiskLabel(score) {
  if (score <= 30) return { text: "Low Risk", className: "status-badge--low" };
  if (score <= 70) return { text: "Suspicious", className: "status-badge--suspicious" };
  return { text: "High Risk", className: "status-badge--high" };
}

function renderResult(result) {
  const { risk_score, status, checks, reasons, recommendation } = result;
  const label = getRiskLabel(risk_score);

  app.riskScoreValue.textContent = risk_score;
  app.resultStatus.textContent = status;
  app.resultStatus.className = `status-badge ${label.className}`;

  app.analysisUpi.textContent = checks.upi;
  app.analysisPage.textContent = checks.payment_page;
  app.analysisQr.textContent = checks.qr;
  app.analysisScam.textContent = checks.scam_patterns;

  app.resultReasons.innerHTML = "";
  reasons.forEach((reason) => {
    const item = document.createElement("li");
    item.textContent = reason;
    app.resultReasons.appendChild(item);
  });

  app.resultRecommendation.textContent = recommendation;

  app.resultPanel.classList.remove("hidden");
  state.lastResult = result;
}

function resetFormState() {
  app.previewWrap.classList.add("hidden");
  app.removeImageBtn.classList.add("hidden");
  app.imageInput.value = "";
  app.fileMeta.textContent = "No image selected";
  app.previewImage.removeAttribute("src");
  state.uploadedFile = null;
  state.uploadedName = "";
  app.upiInput.value = "";
  app.urlInput.value = "";
  app.resultPanel.classList.add("hidden");
  hideLoading();
  setMessage("");
}

function validateFile(file) {
  if (!file) return "Please select an image file.";

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxSize = 5 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    return "Only JPG, PNG, and WEBP images are supported.";
  }

  if (file.size > maxSize) {
    return "Image size exceeds 5MB limit.";
  }

  return "";
}

function handleFileSelection(file) {
  const error = validateFile(file);
  if (error) {
    setMessage(error, "error");
    return;
  }

  state.uploadedFile = file;
  state.uploadedName = file.name;
  app.fileMeta.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
  app.removeImageBtn.classList.remove("hidden");

  const reader = new FileReader();
  reader.onload = (event) => {
    app.previewImage.src = event.target.result;
    app.previewWrap.classList.remove("hidden");
  };
  reader.readAsDataURL(file);

  setMessage("Image ready for analysis.", "success");
}

function setActiveTab(tabName) {
  state.activeTab = tabName;
  app.tabs.forEach((tab) => {
    const active = tab.dataset.tab === tabName;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  app.panels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === `panel-${tabName}`);
  });
}

function triggerScan(payload) {
  const fields = Object.values(payload).filter(Boolean);
  if (!fields.length) {
    setMessage("Please upload an image, enter a UPI ID, or paste a payment URL before scanning.", "error");
    return;
  }

  showLoading();

  window.setTimeout(async () => {
    try {
      const result = await analyzePayment(payload);
      hideLoading();
      renderResult(result);
      setMessage("Scan complete. Review the risk assessment below.", "success");
    } catch (error) {
      hideLoading();
      setMessage("Analysis failed. Please try again.", "error");
    }
  }, 2200);
}

// Mock API layer and backend-ready contract.
async function analyzePayment(payload = {}) {
  // Replace this entire mock with a real fetch('/api/analyze', { ... }) call in production.
  const demo = Boolean(payload.demo);
  const cleanedUpi = (payload.upi_id || "").trim();
  const cleanedUrl = (payload.payment_url || "").trim();
  const suspiciousTerms = ["verify", "urgent", "offer", "bonus", "win", "secure", "upi", "support", "update"];
  const lowerUrl = cleanedUrl.toLowerCase();
  const containsSuspiciousTerm = suspiciousTerms.some((term) => lowerUrl.includes(term));

  if (demo || containsSuspiciousTerm || /\b[a-z0-9]+@\w+\b/i.test(cleanedUpi) === false) {
    return {
      risk_score: 87,
      status: "HIGH RISK",
      confidence: 0.92,
      checks: {
        upi: "Suspicious",
        payment_page: "Suspicious",
        qr: "Unknown",
        scam_patterns: "Detected",
      },
      reasons: [
        "Suspicious payment request",
        "Urgent or threatening language detected",
        "Unusual payment instructions",
        "Possible impersonation",
        "Suspicious UPI identifier pattern",
      ],
      recommendation: "Do not complete the payment. Verify the recipient through an official source.",
    };
  }

  return {
    risk_score: 18,
    status: "LOW RISK",
    confidence: 0.81,
    checks: {
      upi: "Looks Legitimate",
      payment_page: "No Major Indicators",
      qr: "No Suspicious Pattern Detected",
      scam_patterns: "Not Detected",
    },
    reasons: [
      "UPI identifier format appears valid",
      "No suspicious payment language detected",
      "No obvious impersonation indicators",
      "No unusual payment instructions detected",
    ],
    recommendation: "Verify the receiver name before confirming the payment. Never share your UPI PIN or OTP.",
  };
}

function handleDemoScan() {
  setMessage("Simulated hackathon demo: high-risk payment pattern detected.", "success");
  triggerScan({
    demo: true,
    upi_id: "merchant@upi",
    payment_url: "https://urgent-payment-verify-upi.com/confirm",
  });
}

function initNavigation() {
  app.navToggle.addEventListener("click", () => {
    const isOpen = app.nav.classList.toggle("is-open");
    app.navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  app.nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      app.nav.classList.remove("is-open");
      app.navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

function initTabs() {
  app.tabs.forEach((tab) => {
    tab.addEventListener("click", () => setActiveTab(tab.dataset.tab));
  });
}

function initUpload() {
  app.uploadArea.addEventListener("click", () => app.imageInput.click());
  app.imageInput.addEventListener("change", (event) => {
    const [file] = event.target.files;
    if (file) handleFileSelection(file);
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    app.uploadArea.addEventListener(eventName, (event) => {
      event.preventDefault();
      app.uploadArea.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    app.uploadArea.addEventListener(eventName, (event) => {
      event.preventDefault();
      app.uploadArea.classList.remove("dragover");
    });
  });

  app.uploadArea.addEventListener("drop", (event) => {
    const file = event.dataTransfer.files[0];
    if (file) handleFileSelection(file);
  });

  app.uploadArea.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      app.imageInput.click();
    }
  });

  app.removeImageBtn.addEventListener("click", () => {
    app.imageInput.value = "";
    state.uploadedFile = null;
    state.uploadedName = "";
    app.fileMeta.textContent = "No image selected";
    app.previewWrap.classList.add("hidden");
    app.previewImage.removeAttribute("src");
    app.removeImageBtn.classList.add("hidden");
    setMessage("Image removed.", "success");
  });
}

function initForms() {
  app.scanImageBtn.addEventListener("click", () => {
    triggerScan({ image: state.uploadedFile, upi_id: app.upiInput.value, payment_url: app.urlInput.value });
  });

  app.upiForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const upi = app.upiInput.value.trim();

    if (!upi) {
      setMessage("Please enter a UPI ID to analyze.", "error");
      return;
    }

    triggerScan({ upi_id: upi });
  });

  app.urlForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const url = app.urlInput.value.trim();

    if (!url) {
      setMessage("Please paste a payment page URL to analyze.", "error");
      return;
    }

    triggerScan({ payment_url: url });
  });

  app.demoScanBtn.addEventListener("click", handleDemoScan);
  app.resetScanBtn.addEventListener("click", resetFormState);
}

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initTabs();
  initUpload();
  initForms();
  resetFormState();
});
