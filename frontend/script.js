document.addEventListener("DOMContentLoaded", function () {
    let sampleFile = null;
    let handwritingFile = null;

    const backendURL = "https://writeid.onrender.com";  // Change to your actual backend URL

    function navigateTo(page) {
        window.location.href = page;
    }

    // Detect Current Page
    const currentPage = window.location.pathname.split("/").pop();

    // Splash Screen Transitions
    if (currentPage === "index.html") {
        setTimeout(() => navigateTo("second.html"), 3000);
    } else if (currentPage === "second.html") {
        setTimeout(() => navigateTo("home.html"), 3000);
    }

    // "Let's Start" Button Click - Moves to Upload Page
    document.querySelector(".small")?.addEventListener("click", function () {
        navigateTo("upload.html");
    });

    function previewImage(file, containerSelector) {
        if (!file) return;

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
                const file = event.target.files[0];
                if (!file) return;

                if (fileType === "sample") {
                    sampleFile = file;
                } else {
                    handwritingFile = file;
                }

                previewImage(file, containerSelector);
                document.body.removeChild(fileInput);
            });
        });
    }

    handleFileUpload(".first button", ".first .preview-box", "sample");
    handleFileUpload(".second button", ".second .preview-box", "handwriting");

    document.querySelector(".final")?.addEventListener("click", function () {
        if (!sampleFile || !handwritingFile) {
            alert("Please upload both images.");
            return;
        }

        const formData = new FormData();
        formData.append("sample", sampleFile);
        formData.append("handwriting", handwritingFile);

        fetch(`${backendURL}/process-handwriting`, {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log("Backend Response:", data);
            if (data.match !== undefined) {
                alert(`Match Percentage: ${data.match}%`);
            } else {
                alert("Error processing handwriting!");
            }
        })
        .catch(error => {
            console.error("Fetch Error:", error);
            alert("Failed to connect to server.");
        });
    });

    // Form Submission (Second Upload Form)
    document.getElementById("upload-form")?.addEventListener("submit", async function (event) {
        event.preventDefault();

        let formData = new FormData();
        let sampleFile = document.getElementById("sample")?.files[0];
        let handwritingFile = document.getElementById("handwriting")?.files[0];

        if (!sampleFile || !handwritingFile) {
            alert("Please upload both sample and handwriting images.");
            return;
        }

        formData.append("sample", sampleFile);
        formData.append("handwriting", handwritingFile);

        try {
            let response = await fetch(`${backendURL}/process-handwriting`, {
                method: "POST",
                body: formData,
            });

            let result = await response.json();
            const resultElement = document.getElementById("result");
            if (result.match !== undefined) {
                resultElement.innerText = `Match Percentage: ${result.match}%`;
            } else {
                resultElement.innerText = "Error processing handwriting!";
            }
        } catch (error) {
            console.error("Error:", error);
            document.getElementById("result").innerText = "Server error!";
        }
    });
});
