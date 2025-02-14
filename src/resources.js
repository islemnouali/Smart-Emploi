let matiereKey = ""; // ✅ Unique key for each cell's resources
let imageIndex = 0;
let imageList = [];

document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const matiereName = params.get("matiere"); // ✅ Get from URL

    const title = document.getElementById("matiere-title");
    if (matiereName && matiereName.trim() !== "") {
        title.textContent = matiereName; // ✅ Show "Matière" if available
        matiereKey = `resources_${matiereName}`; // ✅ Unique key based on Matière
    } else {
        title.style.display = "none"; // ✅ Hide title if empty
        matiereKey = "resources_default";
    }

    loadResources();
    loadImages(); // ✅ Load saved images
});

// ✅ Add a resource with name + link
function addResource() {
    const nameInput = document.getElementById("resource-name");
    const urlInput = document.getElementById("resource-link");

    const name = nameInput.value.trim();
    const url = urlInput.value.trim();

    if (name === "" || url === "") return;

    const li = document.createElement("li");
    li.innerHTML = `
        <a href="${url}" target="_blank">${name}</a>
        <button class="delete-btn" onclick="removeResource(this)">X</button>
    `;

    document.getElementById("resource-list").appendChild(li);
    saveResources();

    // ✅ Clear input fields after adding
    nameInput.value = "";
    urlInput.value = "";
}

// ✅ Remove a resource
function removeResource(button) {
    button.parentElement.remove();
    saveResources();
}

// ✅ Save resources to localStorage with unique key
function saveResources() {
    const resources = [];
    document.querySelectorAll("#resource-list li a").forEach(link => {
        resources.push({
            name: link.textContent,
            url: link.href
        });
    });

    localStorage.setItem(matiereKey, JSON.stringify(resources));
    localStorage.setItem(`info_${matiereKey}`, document.getElementById("info").value);
}

// ✅ Load saved resources on page load
function loadResources() {
    const savedResources = JSON.parse(localStorage.getItem(matiereKey)) || [];
    const resourceList = document.getElementById("resource-list");

    savedResources.forEach(item => {
        const li = document.createElement("li");
        li.innerHTML = `
            <a href="${item.url}" target="_blank">${item.name}</a>
            <button class="delete-btn" onclick="removeResource(this)">X</button>
        `;
        resourceList.appendChild(li);
    });

    // ✅ Load "Info" text
    document.getElementById("info").value = localStorage.getItem(`info_${matiereKey}`) || "";

    // ✅ Auto-save changes in the info box
    document.getElementById("info").addEventListener("input", saveResources);
}

/* ------------------- ✅ IMAGE UPLOAD FUNCTIONALITY ------------------- */

// ✅ Handle multiple image uploads
document.getElementById("image-upload").addEventListener("change", function (event) {
    const files = event.target.files; // ✅ Get all selected files
    if (!files.length) return;

    Array.from(files).forEach(file => { // ✅ Loop through all files
        const reader = new FileReader();
        reader.onload = function (e) {
            const imageData = e.target.result; // ✅ Convert image to base64
            addImage(imageData, file.name); // ✅ Add each image
            saveImages();
        };
        reader.readAsDataURL(file); // ✅ Read each file as Data URL
    });

    // ✅ Reset file input so you can select the same files again
    event.target.value = "";
});

// ✅ Add image to gallery
function addImage(imageData, imageName) {
    const gallery = document.getElementById("image-gallery");

    // ✅ Create image container
    const imgContainer = document.createElement("div");
    imgContainer.classList.add("image-container");

    // ✅ Create the image element
    const img = document.createElement("img");
    img.src = imageData;
    img.classList.add("uploaded-image");
    img.alt = imageName;
    img.onclick = function () {
        openImage(imageData);
    };

    // ✅ Image name (below the image)
    const nameTag = document.createElement("p");
    nameTag.textContent = imageName;
    nameTag.classList.add("image-name");

    // ✅ Delete button (appears on hover)
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "X";
    deleteBtn.classList.add("delete-img-btn");
    deleteBtn.onclick = function () {
        imgContainer.remove();
        saveImages();
    };

    imgContainer.appendChild(img);
    imgContainer.appendChild(deleteBtn);
    imgContainer.appendChild(nameTag);
    gallery.appendChild(imgContainer);
}

// ✅ Save images to localStorage
function saveImages() {
    const images = [];
    document.querySelectorAll(".image-container").forEach(container => {
        const img = container.querySelector(".uploaded-image");
        const name = container.querySelector(".image-name").textContent;
        images.push({ src: img.src, name: name });
    });

    localStorage.setItem(`images_${matiereKey}`, JSON.stringify(images));
}

// ✅ Load saved images from localStorage
function loadImages() {
    const savedImages = JSON.parse(localStorage.getItem(`images_${matiereKey}`)) || [];
    savedImages.forEach(image => addImage(image.src, image.name));
}

// ✅ Open image in full screen with zooming
function openImage(imageSrc) {
    imageList = JSON.parse(localStorage.getItem(`images_${matiereKey}`)) || [];
    imageIndex = imageList.findIndex(img => img.src === imageSrc);

    const popup = document.createElement("div");
    popup.classList.add("image-popup");

    const img = document.createElement("img");
    img.src = imageSrc;
    img.classList.add("full-image");
    img.id = "opened-image";

    // Track transformation states
    img.rotationAngle = 0; 
    img.scale = 1; 
    img.translateX = 0; 
    img.translateY = 0; 

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "X";
    closeBtn.classList.add("close-popup");
    closeBtn.onclick = function () {
        popup.remove();
        document.removeEventListener("keydown", handleArrowKeys); // ✅ Remove event listener
    };

    const rotateBtn = document.createElement("button");
    rotateBtn.textContent = "⟳";
    rotateBtn.classList.add("rotate-btn");
    rotateBtn.onclick = function () {
        rotateImage(90, img);
    };

    // ✅ Left Arrow (Previous Image)
    const prevBtn = document.createElement("button");
    prevBtn.innerHTML = "&lsaquo;";
    prevBtn.classList.add("nav-btn", "left-btn");
    prevBtn.onclick = function () {
        prevImage();
    };

    // ✅ Right Arrow (Next Image)
    const nextBtn = document.createElement("button");
    nextBtn.innerHTML = "&rsaquo;";
    nextBtn.classList.add("nav-btn", "right-btn");
    nextBtn.onclick = function () {
        nextImage();
    };

    // ✅ Add elements to popup
    popup.appendChild(prevBtn);
    popup.appendChild(img);
    popup.appendChild(rotateBtn);
    popup.appendChild(nextBtn);
    popup.appendChild(closeBtn);

    document.body.appendChild(popup);

    enableZoomAndPan(img); // ✅ Enable zoom & panning
}

document.addEventListener("keydown", handleArrowKeys); // ✅ Listen for arrow keys

function handleArrowKeys(event) {
    if (document.querySelector(".image-popup")) { // ✅ Only if popup is open
        if (event.key === "ArrowRight") {
            nextImage();
        } else if (event.key === "ArrowLeft") {
            prevImage();
        } else if (event.key === "Escape") {
            document.querySelector(".image-popup")?.remove(); // ✅ Close popup on ESC
        }
    }
}

// ✅ Rotate image without affecting zoom or position
function rotateImage(angle, img) {
    img.rotationAngle += angle;
    applyTransform(img);
}

// ✅ Apply all transformations (rotation + zoom + panning)
function applyTransform(img) {
    img.style.transform = `translate(${img.translateX}px, ${img.translateY}px) rotate(${img.rotationAngle}deg) scale(${img.scale})`;
}

// ✅ Enable zoom & panning (dragging)
function enableZoomAndPan(img) {
    let isDragging = false;
    let startX, startY;

    // ✅ Scroll to zoom in/out
    img.addEventListener("wheel", (event) => {
        event.preventDefault();
        const zoomFactor = 0.1;
        let oldScale = img.scale;

        // Update scale
        img.scale += event.deltaY > 0 ? -zoomFactor : zoomFactor;
        img.scale = Math.max(1, Math.min(5, img.scale)); // ✅ Limit zoom level

        // Adjust translation to keep focus on cursor
        if (oldScale !== img.scale) {
            let rect = img.getBoundingClientRect();
            let offsetX = event.clientX - rect.left;
            let offsetY = event.clientY - rect.top;

            let scaleChange = img.scale / oldScale;
            img.translateX -= (offsetX - rect.width / 2) * (scaleChange - 1);
            img.translateY -= (offsetY - rect.height / 2) * (scaleChange - 1);
        }

        applyTransform(img);
    });

    // ✅ Mouse press to start dragging
    img.addEventListener("mousedown", (event) => {
        if (img.scale > 1) { // ✅ Only allow dragging when zoomed in
            event.preventDefault();
            isDragging = true;
            startX = event.clientX;
            startY = event.clientY;
            originX = img.offsetLeft;
            originY = img.offsetTop;
            img.style.cursor = "grabbing";
        }
    });

    // ✅ Move the image while dragging
    window.addEventListener("mousemove", (event) => {
        if (isDragging) {
            img.translateX = event.clientX - startX;
            img.translateY = event.clientY - startY;
            applyTransform(img);
        }
    });

    // ✅ Release the image on mouse up
    window.addEventListener("mouseup", () => {
        isDragging = false;
    });
}



function nextImage() {
    if (imageList.length < 2) return; // ✅ Don't navigate if only one image
    imageIndex = (imageIndex + 1) % imageList.length; // ✅ Loop back to start
    updateOpenedImage();
}

function prevImage() {
    if (imageList.length < 2) return; // ✅ Don't navigate if only one image
    imageIndex = (imageIndex - 1 + imageList.length) % imageList.length; // ✅ Loop back to end
    updateOpenedImage();
}

// ✅ Helper function to update the opened image
function updateOpenedImage() {
    const img = document.getElementById("opened-image");
    if (!img) return;

    const newImageSrc = imageList[imageIndex].src;
    img.src = newImageSrc;

    // ✅ Restore rotation for this image
    img.style.transform = `rotate(${imageRotation[newImageSrc] || 0}deg)`;
}

document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const matiereName = params.get("matiere");
    const darkMode = params.get("dark") === "true"; // ✅ Get Dark Mode status

    if (matiereName && matiereName.trim() !== "") {
        document.getElementById("matiere-title").textContent = matiereName;
    } else {
        document.getElementById("matiere-title").style.display = "none";
    }

    // ✅ Apply Dark Mode if enabled
    if (darkMode) {
        document.body.classList.add("dark-mode");
    }
});

document.querySelectorAll("input, textarea, [contenteditable]").forEach(el => {
    el.setAttribute("spellcheck", "false");
});

