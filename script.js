document.addEventListener("DOMContentLoaded", function () {
    let sampleFile = null;
    let handwritingFile = null;

    function navigateTo(page) {
        window.location.href = page;
    }

    // Detect Current Page
    const currentPage = window.location.pathname.split("/").pop();

    // Splash Screen Transitions
    if (currentPage === "first.html") {
        setTimeout(() => navigateTo("second.html"), 3000);
    } else if (currentPage === "second.html") {
        setTimeout(() => navigateTo("home.html"), 3000);
    }

    // "Let's Start" Button Click - Moves to Upload Page
    document.querySelector(".small")?.addEventListener("click", function () {
        navigateTo("upload.html");
    });

    function previewImage(file, containerSelector) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = document.createElement("img");
            img.src = e.target.result;
            img.classList.add("preview-image");
            document.querySelector(containerSelector).innerHTML = ""; // Clear previous image
            document.querySelector(containerSelector).appendChild(img);
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
                if (fileType === "sample") {
                    sampleFile = event.target.files[0];
                } else {
                    handwritingFile = event.target.files[0];
                }
                previewImage(event.target.files[0], containerSelector);
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

        fetch("http://127.0.0.1:5000/process-handwriting", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log("Backend Response:", data); // Debugging line added
            alert("Match Percentage: " + data.match + "%");
        })
        .catch(error => console.error("Error:", error));
    });

    // Second JavaScript part (form submission)
    document.getElementById("upload-form").addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent default form submission

        let formData = new FormData();
        let sampleFile = document.getElementById("sample").files[0];
        let handwritingFile = document.getElementById("handwriting").files[0];

        if (!sampleFile || !handwritingFile) {
            alert("Please upload both sample and handwriting images.");
            return;
        }

        formData.append("sample", sampleFile);
        formData.append("handwriting", handwritingFile);

        try {
            // Send data to backend
            let response = await fetch("http://127.0.0.1:5000/process-handwriting", {
                method: "POST",
                body: formData,
            });

            let result = await response.json();
            if (result.match !== undefined) {
                // Display result on frontend
                document.getElementById("result").innerText = `Match Percentage: ${result.match}%`;
            } else {
                document.getElementById("result").innerText = "Error processing handwriting!";
            }
        } catch (error) {
            console.error("Error:", error);
            document.getElementById("result").innerText = "Server error!";
        }
    });
});