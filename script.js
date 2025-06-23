let embedImageData = null;
let extractImageData = null;
let encryptedImageBlob = null;

document.addEventListener("DOMContentLoaded", function () {
  initializeTabs();
  initializeForms();
  checkBackendConnection();
});

async function checkBackendConnection() {
  try {
    const response = await fetch("http://localhost:5000/health");
    if (response.ok) {
      const data = await response.json();
      console.log("Backend connected:", data.service);
      showConnectionStatus(true);
    } else {
      throw new Error("Backend not responding");
    }
  } catch (error) {
    console.error("Backend connection failed:", error);
    showConnectionStatus(false);
  }
}

function showConnectionStatus(connected) {
  const existingStatus = document.getElementById("connection-status");
  if (existingStatus) {
    existingStatus.remove();
  }

  const statusDiv = document.createElement("div");
  statusDiv.id = "connection-status";
  statusDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 1000;
    color: white;
    ${
      connected
        ? "background: #10b981; border: 1px solid #059669;"
        : "background: #ef4444; border: 1px solid #dc2626;"
    }
  `;

  statusDiv.innerHTML = connected
    ? "Backend Connected"
    : "Backend Offline - Please start Python server";

  document.body.appendChild(statusDiv);

  if (connected) {
    setTimeout(() => {
      statusDiv.style.transition = "opacity 0.5s";
      statusDiv.style.opacity = "0";
      setTimeout(() => statusDiv.remove(), 500);
    }, 3000);
  }
}

function scrollToForm() {
  document.getElementById("form-section").scrollIntoView({
    behavior: "smooth",
  });
}

function initializeTabs() {
  const tabTriggers = document.querySelectorAll(".tab-trigger");
  const tabContents = document.querySelectorAll(".tab-content");

  tabTriggers.forEach((trigger) => {
    trigger.addEventListener("click", function () {
      const targetTab = this.getAttribute("data-tab");

      tabTriggers.forEach((t) => t.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));

      this.classList.add("active");
      document.getElementById(targetTab + "-tab").classList.add("active");

      resetTabContent(targetTab);
    });
  });
}

function resetTabContent(tabType) {
  if (tabType === "embed") {
    document.getElementById("embed-form").reset();
    document.getElementById("embed-result").style.display = "none";
    embedImageData = null;
    encryptedImageBlob = null;
  } else if (tabType === "extract") {
    document.getElementById("extract-form").reset();
    document.getElementById("extract-result").style.display = "none";
    extractImageData = null;
  }
}

function initializeForms() {
  document
    .getElementById("embed-form")
    .addEventListener("submit", handleEmbedSubmit);

  document
    .getElementById("extract-form")
    .addEventListener("submit", handleExtractSubmit);

  document
    .getElementById("embed-image")
    .addEventListener("change", handleEmbedImageUpload);
  document
    .getElementById("extract-image")
    .addEventListener("change", handleExtractImageUpload);
}

function handleEmbedImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    if (validateImageFile(file)) {
      const reader = new FileReader();
      reader.onload = function (e) {
        embedImageData = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please select a valid PNG or JPEG image file.");
      event.target.value = "";
    }
  }
}

function handleExtractImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    if (validateImageFile(file)) {
      const reader = new FileReader();
      reader.onload = function (e) {
        extractImageData = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please select a valid PNG or JPEG image file.");
      event.target.value = "";
    }
  }
}

function validateImageFile(file) {
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
  return allowedTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; 
}

async function handleEmbedSubmit(event) {
  event.preventDefault();

  const submitButton = event.target.querySelector(".submit-button");
  const originalText = submitButton.innerHTML;

  const formData = {
    image: embedImageData,
    text: document.getElementById("embed-text").value,
    cipherKey: document.getElementById("embed-cipher-key").value,
    stegoKey: document.getElementById("embed-stego-key").value,
  };

  if (!validateEmbedForm(formData)) {
    return;
  }

  try {
    submitButton.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/></svg> Processing...';
    submitButton.disabled = true;

    await simulateEncryptionProcess(formData);

    showEmbedResult(formData.image);
  } catch (error) {
    console.error("Encryption error:", error);
    alert("An error occurred during encryption. Please try again.");
  } finally {
    submitButton.innerHTML = originalText;
    submitButton.disabled = false;
  }
}

async function handleExtractSubmit(event) {
  event.preventDefault();

  const submitButton = event.target.querySelector(".submit-button");
  const originalText = submitButton.innerHTML;

  const formData = {
    image: extractImageData,
    cipherKey: document.getElementById("extract-cipher-key").value,
    stegoKey: document.getElementById("extract-stego-key").value,
  };

  if (!validateExtractForm(formData)) {
    return;
  }

  try {
    submitButton.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/></svg> Processing...';
    submitButton.disabled = true;

    const extractedData = await simulateExtractionProcess(formData);

    showExtractResult(extractedData);
  } catch (error) {
    console.error("Extraction error:", error);
    alert(
      "An error occurred during extraction. Please check your keys and try again.",
    );
  } finally {
    submitButton.innerHTML = originalText;
    submitButton.disabled = false;
  }
}

function validateEmbedForm(formData) {
  if (!formData.image) {
    alert("Please upload a medical image.");
    return false;
  }

  if (!formData.text.trim()) {
    alert("Please enter text to embed.");
    return false;
  }

  if (!formData.cipherKey.trim()) {
    alert("Please enter a cipher key.");
    return false;
  }

  if (!formData.stegoKey.trim()) {
    alert("Please enter a stego key.");
    return false;
  }

  if (formData.cipherKey.length < 8) {
    alert("Cipher key must be at least 8 characters long.");
    return false;
  }

  if (formData.stegoKey.length < 8) {
    alert("Stego key must be at least 8 characters long.");
    return false;
  }

  return true;
}

function validateExtractForm(formData) {
  if (!formData.image) {
    alert("Please upload a stego image.");
    return false;
  }

  if (!formData.cipherKey.trim()) {
    alert("Please enter the cipher key.");
    return false;
  }

  if (!formData.stegoKey.trim()) {
    alert("Please enter the stego key.");
    return false;
  }

  return true;
}

async function simulateEncryptionProcess(formData) {
  try {
    const apiFormData = new FormData();

    const response = await fetch(formData.image);
    const blob = await response.blob();
    apiFormData.append("image", blob, "medical_image.png");
    apiFormData.append("text", formData.text);
    apiFormData.append("cipher_key", formData.cipherKey);
    apiFormData.append("stego_key", formData.stegoKey);

    const apiResponse = await fetch("http://localhost:5000/embed", {
      method: "POST",
      body: apiFormData,
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(errorData.error || "Embedding failed");
    }

    const result = await apiResponse.json();

    encryptedImageBlob = result.preview_data;
    window.downloadFilename = result.filename;

    console.log("Encryption successful:", {
      originalText: formData.text.substring(0, 50) + "...",
      cipherKey: formData.cipherKey.replace(/./g, "*"),
      stegoKey: formData.stegoKey.replace(/./g, "*"),
      imageProcessed: true,
      filename: result.filename,
    });
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

async function simulateExtractionProcess(formData) {
  try {
    const apiFormData = new FormData();

    const response = await fetch(formData.image);
    const blob = await response.blob();
    apiFormData.append("image", blob, "stego_image.png");
    apiFormData.append("cipher_key", formData.cipherKey);
    apiFormData.append("stego_key", formData.stegoKey);

    const apiResponse = await fetch("http://localhost:5000/extract", {
      method: "POST",
      body: apiFormData,
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(errorData.error || "Extraction failed");
    }

    const result = await apiResponse.json();

    console.log("Extraction successful:", {
      cipherKey: formData.cipherKey.replace(/./g, "*"),
      stegoKey: formData.stegoKey.replace(/./g, "*"),
      extractedLength: result.extracted_text.length,
    });

    return result.extracted_text;
  } catch (error) {
    console.error("Extraction error:", error);
    throw new Error(`Extraction failed: ${error.message}`);
  }
}

function showEmbedResult(imageData) {
  const resultSection = document.getElementById("embed-result");
  const previewImage = document.getElementById("encrypted-preview");

  previewImage.src = imageData;
  resultSection.style.display = "block";

  resultSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function showExtractResult(extractedText) {
  const resultSection = document.getElementById("extract-result");
  const textElement = document.getElementById("extracted-text");

  textElement.textContent = extractedText;
  resultSection.style.display = "block";

  resultSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function downloadEncryptedImage() {
  if (!window.downloadFilename) {
    alert("No encrypted image available for download.");
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:5000/download/${window.downloadFilename}`,
    );

    if (!response.ok) {
      throw new Error("Download failed");
    }

    const blob = await response.blob();

    const link = document.createElement("a");
    link.download = `encrypted_medical_image_${Date.now()}.png`;
    link.href = URL.createObjectURL(blob);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error("Download error:", error);
    alert("Download failed. Please try again.");
  }
}

function getRandomDiagnosis() {
  const diagnoses = [
    "Mild fracture in left radius",
    "Pneumonia in lower right lobe",
    "Torn ACL in right knee",
    "Mild concussion",
    "Acute appendicitis",
    "Hypertension stage 1",
    "Type 2 diabetes mellitus",
    "Gastroesophageal reflux disease",
  ];
  return diagnoses[Math.floor(Math.random() * diagnoses.length)];
}

function getRandomDoctorName() {
  const firstNames = [
    "Sarah",
    "Michael",
    "Jennifer",
    "David",
    "Emily",
    "James",
    "Lisa",
    "Robert",
  ];
  const lastNames = [
    "Johnson",
    "Smith",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
  ];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  return `${firstName} ${lastName}`;
}

function getRandomNotes() {
  const notes = [
    "Patient responding well to treatment",
    "Follow-up required in 2 weeks",
    "Monitor symptoms closely",
    "Medication adjustment needed",
    "Patient education provided",
    "Referral to specialist recommended",
  ];
  return notes[Math.floor(Math.random() * notes.length)];
}

function getRandomTreatment() {
  const treatments = [
    "Rest and physical therapy",
    "Antibiotic course - 7 days",
    "Surgical intervention scheduled",
    "Pain management protocol",
    "Lifestyle modification counseling",
    "Prescription medication adjustment",
  ];
  return treatments[Math.floor(Math.random() * treatments.length)];
}

function validateSecurityRequirements(cipherKey, stegoKey) {
  const hasUpperCase = /[A-Z]/.test(cipherKey);
  const hasLowerCase = /[a-z]/.test(cipherKey);
  const hasNumbers = /\d/.test(cipherKey);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(cipherKey);

  if (!(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar)) {
    return {
      valid: false,
      message:
        "Cipher key should contain uppercase, lowercase, numbers, and special characters for maximum security.",
    };
  }

  if (cipherKey === stegoKey) {
    return {
      valid: false,
      message:
        "Cipher key and stego key should be different for enhanced security.",
    };
  }

  return { valid: true };
}

function enhancedFormValidation(formData) {
  const basicValidation =
    formData.type === "embed"
      ? validateEmbedForm(formData)
      : validateExtractForm(formData);

  if (!basicValidation) return false;

  if (formData.type === "embed") {
    const securityCheck = validateSecurityRequirements(
      formData.cipherKey,
      formData.stegoKey,
    );
    if (!securityCheck.valid) {
      const proceed = confirm(
        `Security Warning: ${securityCheck.message}\n\nDo you want to proceed anyway?`,
      );
      return proceed;
    }
  }

  return true;
}

function showError(message, type = "error") {
  console.error(`${type.toUpperCase()}: ${message}`);
  alert(message);
}

function showSuccess(message) {
  console.log(`SUCCESS: ${message}`);
}

window.addEventListener("beforeunload", function () {
  embedImageData = null;
  extractImageData = null;
  encryptedImageBlob = null;
});
