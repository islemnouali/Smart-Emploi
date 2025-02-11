let matiereKey = ""; // ✅ Unique key for each cell's resources

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

// ✅ Handle image upload
document.getElementById("image-upload").addEventListener("change", function (event) {
    const file = event.target.files[0]; // Get selected file
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const imageData = e.target.result; // Convert image to base64
        addImage(imageData, file.name); // Pass image data and file name
        saveImages();
    };

    reader.readAsDataURL(file); // Read file as Data URL
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
    const popup = document.createElement("div");
    popup.classList.add("image-popup");

    const img = document.createElement("img");
    img.src = imageSrc;
    img.classList.add("full-image");

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "X";
    closeBtn.classList.add("close-popup");
    closeBtn.onclick = function () {
        popup.remove();
    };

    popup.appendChild(img);
    popup.appendChild(closeBtn);
    document.body.appendChild(popup);

    enableZoom(img); // ✅ Enable zooming on the image
}

// ✅ Add zoom and drag functionality
function enableZoom(img) {
    let scale = 1;
    let isDragging = false;
    let startX, startY, originX, originY;

    // ✅ Scroll to zoom in/out
    img.addEventListener("wheel", (event) => {
        event.preventDefault();
        const zoomFactor = 0.1;
        scale += event.deltaY > 0 ? -zoomFactor : zoomFactor;
        scale = Math.max(1, Math.min(5, scale)); // ✅ Limit zoom level
        img.style.transform = `scale(${scale})`;
    });

    // ✅ Dragging (Pan Image)
    img.addEventListener("mousedown", (event) => {
        event.preventDefault();
        isDragging = true;
        startX = event.clientX;
        startY = event.clientY;
        originX = img.offsetLeft;
        originY = img.offsetTop;
        img.style.cursor = "grabbing";
    });

    document.addEventListener("mousemove", (event) => {
        if (!isDragging) return;
        const moveX = event.clientX - startX;
        const moveY = event.clientY - startY;
        img.style.transform = `translate(${moveX}px, ${moveY}px) scale(${scale})`;
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
        img.style.cursor = "grab";
    });

    // ✅ Reset zoom when clicking "X" button
    document.querySelector(".close-popup").addEventListener("click", () => {
        scale = 1;
        img.style.transform = "scale(1)";
    });
}

