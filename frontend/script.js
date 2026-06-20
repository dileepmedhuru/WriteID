document.addEventListener("DOMContentLoaded", function () {
    const API_BASE = window.location.protocol === "file:" ? "http://127.0.0.1:5000" : "";
    let sampleFile = null;
    let handwritingFile = null;

    function navigateTo(page) {
        window.location.href = page;
    }

    function isAuthenticated() {
        return localStorage.getItem("writeid_user_email") !== null;
    }

    function getEmail() {
        return localStorage.getItem("writeid_user_email");
    }

    function getUsername() {
        return localStorage.getItem("writeid_user_name");
    }

    // Detect Current Page
    const currentPage = window.location.pathname.split("/").pop();

    // Route Guards & Page Rules
    if (currentPage === "second.html") {
        setTimeout(() => navigateTo("index.html"), 1500);
    } else if (currentPage === "upload.html" || currentPage === "profile.html" || currentPage === "home.html" || currentPage === "signature.html") {
        // Strict page guard for authenticated pages
        if (!isAuthenticated()) {
            navigateTo("login.html");
            return;
        }
    }

    // Render Auth Nav Menu dynamically if navbar placeholder is present
    const navMenuEl = document.getElementById("nav-menu");
    if (navMenuEl) {
        const username = getUsername();
        if (isAuthenticated()) {
            const statusHtml = `
                <div class="user-status">
                    <span class="user-name">Hi, ${username}</span>
                    <button class="logout-btn" id="logout-btn">Logout</button>
                </div>
            `;
            let linksHtml = "";
            if (currentPage === "upload.html") {
                linksHtml = `<a href="home.html" class="nav-link">Home</a> <a href="signature.html" class="nav-link">Signature</a> <a href="profile.html" class="nav-link">Profile</a>`;
            } else if (currentPage === "signature.html") {
                linksHtml = `<a href="home.html" class="nav-link">Home</a> <a href="upload.html" class="nav-link">Handwriting</a> <a href="profile.html" class="nav-link">Profile</a>`;
            } else if (currentPage === "profile.html") {
                linksHtml = `<a href="home.html" class="nav-link">Home</a> <a href="upload.html" class="nav-link">Handwriting</a> <a href="signature.html" class="nav-link">Signature</a>`;
            } else if (currentPage === "home.html") {
                linksHtml = `<a href="upload.html" class="nav-link">Handwriting</a> <a href="signature.html" class="nav-link">Signature</a> <a href="profile.html" class="nav-link">Profile</a>`;
            }
            navMenuEl.innerHTML = linksHtml + statusHtml;
        } else {
            // Not authenticated (public landing/auth pages)
            if (currentPage === "login.html" || currentPage === "signup.html") {
                navMenuEl.innerHTML = `<a href="index.html" class="nav-link">Home</a>`;
            } else {
                navMenuEl.innerHTML = `
                    <a href="#about" class="nav-link">About</a>
                    <a href="#features" class="nav-link">Features</a>
                    <a href="#contact" class="nav-link">Contact</a>
                    <a href="login.html" class="nav-link login-nav-btn">Login</a>
                `;
            }
        }
    }

    // Toggle mobile menu for app-navbar
    const appNavHamburger = document.getElementById("appNavHamburger");
    if (appNavHamburger && navMenuEl) {
        appNavHamburger.addEventListener("click", function () {
            appNavHamburger.classList.toggle("open");
            navMenuEl.classList.toggle("active");
        });
        
        // Close menu when a link inside it is clicked
        navMenuEl.addEventListener("click", function (e) {
            if (e.target.classList.contains("nav-link") || e.target.id === "logout-btn") {
                appNavHamburger.classList.remove("open");
                navMenuEl.classList.remove("active");
            }
        });
    }

    // Scroll effect for app-navbar
    const appNavbar = document.getElementById("appNavbar");
    if (appNavbar) {
        window.addEventListener("scroll", function () {
            appNavbar.classList.toggle("scrolled", window.scrollY > 40);
        });
    }

    // Password visibility toggle helper
    document.querySelectorAll(".password-toggle-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            const wrapper = this.closest(".password-input-wrapper");
            const input = wrapper ? wrapper.querySelector("input") : null;
            if (input) {
                const icon = this.querySelector("i");
                if (input.type === "password") {
                    input.type = "text";
                    if (icon) {
                        icon.classList.remove("bi-eye-slash");
                        icon.classList.add("bi-eye");
                    }
                } else {
                    input.type = "password";
                    if (icon) {
                        icon.classList.remove("bi-eye");
                        icon.classList.add("bi-eye-slash");
                    }
                }
            }
        });
    });

    // Populate Profile Page details if on profile page
    if (currentPage === "profile.html") {
        const usernameEl = document.getElementById("profile-username");
        const emailEl = document.getElementById("profile-email");
        if (usernameEl && emailEl) {
            usernameEl.innerText = getUsername() || "-";
            emailEl.innerText = getEmail() || "-";
        }
    }

    // Handle Logout Action
    document.addEventListener("click", function (e) {
        if (e.target && e.target.id === "logout-btn") {
            localStorage.removeItem("writeid_user_email");
            localStorage.removeItem("writeid_user_name");
            navigateTo("login.html");
        }
    });

    // "Get Started" Button Click - Checks auth before moving to Upload Page
    document.querySelector(".small")?.addEventListener("click", function () {
        if (isAuthenticated()) {
            navigateTo("upload.html");
        } else {
            navigateTo("login.html");
        }
    });

    // Handle Login Form Submission
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            const emailInput = document.getElementById("email").value.trim();
            const passwordInput = document.getElementById("password").value.trim();
            const errorEl = document.getElementById("auth-error");
            
            if (errorEl) errorEl.innerText = "";

            try {
                const response = await fetch(`${API_BASE}/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: emailInput, password: passwordInput })
                });

                const data = await response.json();
                if (response.ok && data.success) {
                    localStorage.setItem("writeid_user_email", data.email);
                    localStorage.setItem("writeid_user_name", data.username);
                    navigateTo("home.html");
                } else {
                    if (errorEl) {
                        let msg = data.error || "Login failed.";
                        if (msg.includes("Invalid") || msg.includes("invalid")) {
                            msg += " (Note: If you recently deployed/restarted the server, the database may have reset. Please Register a new account first.)";
                        }
                        errorEl.innerText = msg;
                    }
                }
            } catch (error) {
                console.error("Login Error:", error);
                if (errorEl) errorEl.innerText = "Error connecting to server.";
            }
        });
    }

    // Handle Signup Form Submission
    const signupForm = document.getElementById("signup-form");
    if (signupForm) {
        signupForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            const usernameInput = document.getElementById("username").value.trim();
            const emailInput = document.getElementById("email").value.trim();
            const passwordInput = document.getElementById("password").value.trim();
            const confirmPasswordInput = document.getElementById("confirm-password").value.trim();
            
            const errorEl = document.getElementById("auth-error");
            const successEl = document.getElementById("auth-success");
            
            if (errorEl) errorEl.innerText = "";
            if (successEl) successEl.innerText = "";

            if (passwordInput !== confirmPasswordInput) {
                if (errorEl) errorEl.innerText = "Passwords do not match.";
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/signup`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username: usernameInput, email: emailInput, password: passwordInput })
                });

                const data = await response.json();
                if (response.ok && data.success) {
                    if (successEl) successEl.innerText = "Registered successfully! Redirecting to login...";
                    setTimeout(() => navigateTo("login.html"), 1500);
                } else {
                    if (errorEl) errorEl.innerText = data.error || "Registration failed.";
                }
            } catch (error) {
                console.error("Signup Error:", error);
                if (errorEl) errorEl.innerText = "Error connecting to server.";
            }
        });
    }

    // Upload Thumbnails and Previews
    function previewImage(file, containerSelector) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = document.createElement("img");
            img.src = e.target.result;
            img.classList.add("preview-image");
            const container = document.querySelector(containerSelector);
            if (container) {
                container.innerHTML = ""; // Clear previous image
                container.appendChild(img);
            }
        };
        reader.readAsDataURL(file);
    }

    function handleFileUpload(buttonSelector, containerSelector, fileType) {
        document.querySelector(buttonSelector)?.addEventListener("click", function () {
            let fileInput = document.createElement("input");
            fileInput.setAttribute("type", "file");
            fileInput.accept = "image/*";
            document.body.appendChild(fileInput);
            fileInput.click();

            fileInput.addEventListener("change", function (event) {
                if (event.target.files.length > 0) {
                    const file = event.target.files[0];
                    if (fileType === "sample") {
                        sampleFile = file;
                    } else {
                        handwritingFile = file;
                    }
                    previewImage(file, containerSelector);
                }
                document.body.removeChild(fileInput);
            });
        });
    }

    if (currentPage === "upload.html" || currentPage === "signature.html") {
        handleFileUpload(".first .upload-btn", ".first .preview-box", "sample");
        handleFileUpload(".second .upload-btn", ".second .preview-box", "handwriting");

        // --- MOBILE CAMERA SCANNER CONTROLLER ---
        const cameraModal = document.getElementById("camera-modal");
        const cameraVideo = document.getElementById("camera-video");
        const shutterBtn = document.getElementById("shutter-btn");
        const closeCameraBtn = document.getElementById("close-camera");
        let activeCameraStream = null;
        let activeSlot = null; // "sample" or "handwriting"

        // Open Camera on Button Click
        document.querySelectorAll(".camera-btn").forEach(btn => {
            btn.addEventListener("click", function () {
                activeSlot = this.getAttribute("data-slot");
                
                navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" }
                })
                .then(stream => {
                    activeCameraStream = stream;
                    cameraVideo.srcObject = stream;
                    cameraVideo.play();
                    if (cameraModal) cameraModal.style.display = "flex";
                })
                .catch(err => {
                    console.error("Camera Access Error:", err);
                    alert("Could not access camera. Please check camera permissions.");
                });
            });
        });

        // Close Camera Modal
        function stopCamera() {
            if (activeCameraStream) {
                activeCameraStream.getTracks().forEach(track => track.stop());
                activeCameraStream = null;
            }
            cameraVideo.srcObject = null;
            if (cameraModal) cameraModal.style.display = "none";
        }

        if (closeCameraBtn) {
            closeCameraBtn.addEventListener("click", stopCamera);
        }

        // Shutter snap & auto-crop to Scanner Guide
        if (shutterBtn) {
            shutterBtn.addEventListener("click", function () {
                if (!activeCameraStream) return;

                // Create offscreen canvas for drawing
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                // Get actual dimensions of the video stream feed
                const videoWidth = cameraVideo.videoWidth;
                const videoHeight = cameraVideo.videoHeight;
                canvas.width = videoWidth;
                canvas.height = videoHeight;

                // Draw full video frame to canvas
                ctx.drawImage(cameraVideo, 0, 0, videoWidth, videoHeight);

                // Auto-crop to the scanner-guide outline box boundaries
                // Our guide box is centered: top: 15%, left: 10%, width: 80%, height: 70%
                const cropX = Math.round(videoWidth * 0.10);
                const cropY = Math.round(videoHeight * 0.15);
                const cropW = Math.round(videoWidth * 0.80);
                const cropH = Math.round(videoHeight * 0.70);

                // Create a cropped canvas
                const croppedCanvas = document.createElement("canvas");
                const croppedCtx = croppedCanvas.getContext("2d");
                croppedCanvas.width = cropW;
                croppedCanvas.height = cropH;

                croppedCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

                // Convert canvas image to file blob & preview
                croppedCanvas.toBlob(function (blob) {
                    const filename = `camera_scan_${Date.now()}.png`;
                    const file = new File([blob], filename, { type: "image/png" });

                    if (activeSlot === "sample") {
                        sampleFile = file;
                        previewImage(file, ".first .preview-box");
                    } else if (activeSlot === "handwriting") {
                        handwritingFile = file;
                        previewImage(file, ".second .preview-box");
                    }

                    stopCamera();
                }, "image/png");
            });
        }

        // Dynamic result display handler
        const finalBtn = document.querySelector(".final");
        finalBtn?.addEventListener("click", function () {
            if (!sampleFile || !handwritingFile) {
                alert("Please upload both images.");
                return;
            }

            const mode = (currentPage === "signature.html") ? "signature" : "handwriting";
            const buttonText = (mode === "signature") ? "Verifying..." : "Checking...";
            const defaultText = (mode === "signature") ? "Verify" : "Check";

            // Show loading state
            finalBtn.innerText = buttonText;
            finalBtn.style.pointerEvents = "none";
            
            const resultEl = document.getElementById("result");
            if (resultEl) {
                resultEl.style.opacity = "0.5";
                resultEl.innerText = (mode === "signature") ? "Running advanced signature verification..." : "Processing writer identification...";
            }

            const formData = new FormData();
            formData.append("sample", sampleFile);
            formData.append("handwriting", handwritingFile);
            formData.append("mode", mode);

            fetch(`${API_BASE}/process-handwriting`, {
                method: "POST",
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error("API request failed");
                }
                return response.json();
            })
            .then(data => {
                console.log("Backend Response:", data);
                
                // Restore button state
                finalBtn.innerText = defaultText;
                finalBtn.style.pointerEvents = "auto";

                if (resultEl && data.match !== undefined) {
                    resultEl.style.opacity = "0";
                    resultEl.style.transition = "opacity 0.4s ease";

                    // Round all scores to whole integers
                    const match            = Math.round(data.match);
                    const forgeryConf      = Math.round(data.forgery_confidence);
                    const deepSim          = Math.round(data.deep_similarity);
                    const strokeSim        = Math.round(data.stroke_similarity);
                    const writingStyle     = Math.round(data.writing_style);
                    const charSpacing      = data.character_spacing !== null && data.character_spacing !== undefined
                                            ? Math.round(data.character_spacing) : null;

                    // Forgery badge styling
                    let badgeClass = "badge-genuine";
                    let badgeLabel = "Genuine Specimen";
                    let badgeIcon = "bi-patch-check-fill";
                    if (data.forgery_status === "Forged") {
                        badgeClass = "badge-forged";
                        badgeLabel = "Mismatched / Forged";
                        badgeIcon = "bi-x-octagon-fill";
                    } else if (data.forgery_status === "Traced") {
                        badgeClass = "badge-traced";
                        badgeLabel = "Suspicious / Traced";
                        badgeIcon = "bi-exclamation-triangle-fill";
                    }

                    // Progress bar colors based on rounded match
                    let color = "#ef4444"; // Red (low)
                    if (match >= 80) {
                        color = "#22c55e"; // Green (high)
                    } else if (match >= 50) {
                        color = "#eab308"; // Yellow (medium)
                    }

                    // Character spacing metric row (handwriting mode only)
                    let spacingHtml = "";
                    if (mode === "handwriting" && charSpacing !== null) {
                        spacingHtml = `
                            <div class="metric-row">
                                <div class="metric-info">
                                    <span class="metric-label">Character Spacing</span>
                                    <span class="metric-value">${charSpacing}%</span>
                                </div>
                                <div class="metric-bar-bg">
                                    <div class="metric-bar-fill" style="width: ${charSpacing}%; background: #60a5fa;"></div>
                                </div>
                            </div>
                        `;
                    }

                    // Store rounded result data globally for PDF generation
                    window._lastReportData = {
                        mode,
                        match:              match,
                        forgery_status:     data.forgery_status,
                        forgery_confidence: forgeryConf,
                        deep_similarity:    deepSim,
                        stroke_similarity:  strokeSim,
                        writing_style:      writingStyle,
                        character_spacing:  charSpacing,
                        badgeLabel,
                        timestamp: new Date().toLocaleString(),
                        username:  getUsername() || "Unknown"
                    };

                    const resetLabel = (mode === "signature") ? "Verify Another" : "Check Another";

                    resultEl.innerHTML = `
                        <div class="result-card detailed-report">
                            <h3 class="report-title">Analysis Similarity Report</h3>
                            
                            <div class="forgery-section">
                                <span class="badge ${badgeClass}">
                                    <i class="bi ${badgeIcon}"></i> ${badgeLabel}
                                </span>
                                <div class="confidence-text">
                                    Confidence Score: <strong>${forgeryConf}%</strong>
                                </div>
                            </div>

                            <div class="overall-section">
                                <div class="overall-circle-container">
                                    <div class="overall-score" style="color: ${color};">${match}%</div>
                                    <div class="overall-label">Overall Match</div>
                                </div>
                            </div>

                            <div class="metrics-grid">
                                <div class="metric-row">
                                    <div class="metric-info">
                                        <span class="metric-label">Deep Neural Embedding</span>
                                        <span class="metric-value">${deepSim}%</span>
                                    </div>
                                    <div class="metric-bar-bg">
                                        <div class="metric-bar-fill" style="width: ${deepSim}%; background: #a855f7;"></div>
                                    </div>
                                </div>

                                <div class="metric-row">
                                    <div class="metric-info">
                                        <span class="metric-label">Stroke &amp; Contour Style</span>
                                        <span class="metric-value">${strokeSim}%</span>
                                    </div>
                                    <div class="metric-bar-bg">
                                        <div class="metric-bar-fill" style="width: ${strokeSim}%; background: #22c55e;"></div>
                                    </div>
                                </div>

                                <div class="metric-row">
                                    <div class="metric-info">
                                        <span class="metric-label">Writing Slant &amp; Slopes</span>
                                        <span class="metric-value">${writingStyle}%</span>
                                    </div>
                                    <div class="metric-bar-bg">
                                        <div class="metric-bar-fill" style="width: ${writingStyle}%; background: #eab308;"></div>
                                    </div>
                                </div>

                                ${spacingHtml}
                            </div>

                            <div class="report-action-row">
                                <button class="pdf-download-btn" id="pdf-btn">
                                    <i class="bi bi-file-earmark-pdf-fill"></i> Download PDF Report
                                </button>
                                <button class="reset-btn" id="reset-btn">${resetLabel}</button>
                            </div>
                        </div>
                    `;
                    
                    setTimeout(() => {
                        resultEl.style.opacity = "1";
                    }, 50);
                }
            })
            .catch(error => {
                console.error("Error:", error);
                finalBtn.innerText = defaultText;
                finalBtn.style.pointerEvents = "auto";
                if (resultEl) {
                    resultEl.style.opacity = "1";
                    resultEl.innerHTML = `
                        <div class="result-card error">
                            Error communicating with verification server. Make sure the backend is running.
                            <button class="reset-btn" id="reset-btn" style="margin-top: 15px;">Try Again</button>
                        </div>
                    `;
                }
            });
        });
    }

    // Reset button event handler
    document.addEventListener("click", function (e) {
        if (e.target && e.target.id === "reset-btn") {
            sampleFile = null;
            handwritingFile = null;
            const p1 = document.querySelector(".first .preview-box");
            const p2 = document.querySelector(".second .preview-box");
            if (p1) p1.innerHTML = "";
            if (p2) p2.innerHTML = "";
            const resultEl = document.getElementById("result");
            if (resultEl) {
                resultEl.style.opacity = "0";
                resultEl.innerHTML = "";
            }
        }

        // PDF Download handler
        if (e.target && (e.target.id === "pdf-btn" || e.target.closest?.("#pdf-btn"))) {
            generatePDF();
        }
    });

    // ── PDF Report Generator ──────────────────────────────────────────────────
    function generatePDF() {
        const r = window._lastReportData;
        if (!r) return;

        function doGenerate() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            const W = doc.internal.pageSize.getWidth();
            const H = doc.internal.pageSize.getHeight();
            const ML = 14, MR = 14;
            const CW = W - ML - MR;
            const CX = ML;

            // Background
            doc.setFillColor(10, 15, 28);
            doc.rect(0, 0, W, H, 'F');

            // Header
            doc.setFillColor(22, 33, 55);
            doc.rect(CX, 10, CW, 30, 'F');
            doc.setFillColor(59, 130, 246);
            doc.rect(CX, 10, 3, 30, 'F');
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(96, 165, 250);
            doc.text('WriteID', CX + 10, 24);
            const modeLabel = r.mode === 'signature' ? 'Signature Verification Report' : 'Handwriting Identification Report';
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(148, 163, 184);
            doc.text(modeLabel, CX + 10, 33);
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text(r.timestamp, CX + CW, 22, { align: 'right' });
            doc.text('Analyst: ' + r.username, CX + CW, 30, { align: 'right' });

            // Verdict banner
            const vY = 46;
            const vClr = r.forgery_status === 'Forged' ? [185,28,28] : r.forgery_status === 'Traced' ? [161,98,7] : [21,128,61];
            const vBg  = r.forgery_status === 'Forged' ? [254,226,226] : r.forgery_status === 'Traced' ? [254,243,199] : [220,252,231];
            doc.setFillColor(...vBg);
            doc.rect(CX, vY, CW, 14, 'F');
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...vClr);
            doc.text('Verdict: ' + r.badgeLabel, CX + CW / 2, vY + 9.5, { align: 'center' });

            // Score box
            const sY = 66, sH = 50;
            doc.setFillColor(15, 23, 42);
            doc.rect(CX, sY, CW, sH, 'F');
            doc.setDrawColor(30, 41, 59);
            doc.setLineWidth(0.4);
            doc.rect(CX, sY, CW, sH, 'S');
            const sClr = r.match >= 80 ? [34,197,94] : r.match >= 50 ? [234,179,8] : [239,68,68];
            doc.setFontSize(36);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...sClr);
            doc.text(r.match + '%', CX + CW / 2, sY + 26, { align: 'center' });
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 116, 139);
            doc.text('OVERALL MATCH SCORE', CX + CW / 2, sY + 37, { align: 'center' });
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
            doc.text('Forensic Confidence: ' + r.forgery_confidence + '%', CX + CW / 2, sY + 45, { align: 'center' });

            // Metrics
            let yPos = sY + sH + 10;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(203, 213, 225);
            doc.text('Detailed Analysis Metrics', CX, yPos);
            yPos += 6;
            const metrics = [
                { label: 'Deep Neural Embedding',  value: r.deep_similarity,   color: [168,85,247] },
                { label: 'Stroke and Contour Style', value: r.stroke_similarity, color: [34,197,94] },
                { label: 'Writing Slant and Slopes', value: r.writing_style,    color: [234,179,8] },
            ];
            if (r.character_spacing !== null && r.character_spacing !== undefined) {
                metrics.push({ label: 'Character Spacing', value: r.character_spacing, color: [96,165,250] });
            }
            const ROW_H = 18;
            metrics.forEach(function(m) {
                doc.setFillColor(18, 27, 48);
                doc.setDrawColor(30, 41, 59);
                doc.setLineWidth(0.3);
                doc.rect(CX, yPos, CW, ROW_H, 'FD');
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(203, 213, 225);
                doc.text(m.label, CX + 5, yPos + 8);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...m.color);
                doc.text(m.value + '%', CX + CW - 5, yPos + 8, { align: 'right' });
                const bX = CX + 5, bW = CW - 10, bY = yPos + 12, bH = 3;
                doc.setFillColor(30, 41, 59);
                doc.rect(bX, bY, bW, bH, 'F');
                const fillW = Math.max(bH, bW * (m.value / 100));
                doc.setFillColor(...m.color);
                doc.rect(bX, bY, fillW, bH, 'F');
                yPos += ROW_H + 2;
            });

            // Info table
            yPos += 8;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(203, 213, 225);
            doc.text('Report Information', CX, yPos);
            yPos += 5;
            const infoRows = [
                ['Analysis Type', modeLabel],
                ['Verdict',       r.badgeLabel],
                ['Match Score',   r.match + '%'],
                ['Confidence',    r.forgery_confidence + '%'],
                ['Analyst',       r.username],
                ['Generated On',  r.timestamp],
            ];
            const IR_H = 9;
            infoRows.forEach(function([key, val], i) {
                const rY = yPos + i * IR_H;
                doc.setFillColor(i % 2 === 0 ? 15 : 20, i % 2 === 0 ? 23 : 30, i % 2 === 0 ? 42 : 52);
                doc.rect(CX, rY, CW, IR_H, 'F');
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(100, 116, 139);
                doc.text(key, CX + 5, rY + 6);
                doc.setTextColor(226, 232, 240);
                doc.text(String(val), CX + CW - 5, rY + 6, { align: 'right' });
            });

            // Footer
            doc.setFillColor(22, 33, 55);
            doc.rect(0, H - 18, W, 18, 'F');
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(71, 85, 105);
            doc.text('This report was generated by WriteID - AI Handwriting Intelligence Platform.', W / 2, H - 10, { align: 'center' });
            doc.text('For forensic use only. AI-assisted results should be reviewed by a qualified examiner.', W / 2, H - 5, { align: 'center' });
            doc.save('WriteID_Report_' + r.mode + '_' + Date.now() + '.pdf');
        }

        if (window.jspdf) { doGenerate(); }
        else {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            s.onload = doGenerate;
            s.onerror = function() { alert('Could not load PDF library. Check your internet connection.'); };
            document.head.appendChild(s);
        }
    }

    // 3D Interactive Card Tilt Effect
    const tiltCards = document.querySelectorAll(".feature-card, .about-app-card, .contact-card, .auth-card, .profile-card, .result-card");
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (!isTouchDevice) {
        tiltCards.forEach(card => {
            card.addEventListener("mousemove", (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left; 
                const y = e.clientY - rect.top;  
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = ((centerY - y) / centerY) * 10;
                const rotateY = ((x - centerX) / centerX) * 10;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
                card.style.transition = "transform 0.1s ease";
            });
            
            card.addEventListener("mouseleave", () => {
                card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)`;
                card.style.transition = "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)";
            });
        });
    }
});
