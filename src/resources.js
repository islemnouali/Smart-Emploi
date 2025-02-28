let matiereKey = ""; // ✅ Unique key for each cell's resources
let imageIndex = 0;

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
    loadFiles(); // ✅ Ensure files are loaded on page load
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
        <button class="delete-btn" onclick="confirmRemove(this)">X</button>
    `;

    document.getElementById("resource-list").appendChild(li);
    saveResources();

    // ✅ Clear input fields after adding
    nameInput.value = "";
    urlInput.value = "";
}

function confirmRemove(button) {
    if (confirm("Are you sure you want to delete this resource?")) {
        removeResource(button);
    }
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
    resourceList.innerHTML = ""; // ✅ Clear existing resources to prevent duplication

    savedResources.forEach(item => {
        const li = document.createElement("li");
        li.innerHTML = `
            <a href="${item.url}" target="_blank">${item.name}</a>
            <button class="delete-btn" onclick="confirmRemove(this)">X</button>
        `;
        resourceList.appendChild(li);
    });

    // ✅ Load "Info" text
    document.getElementById("info").value = localStorage.getItem(`info_${matiereKey}`) || "";

    // ✅ Auto-save changes in the info box
    document.getElementById("info").addEventListener("input", saveResources);
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

/* ------------------- ✅ Files UPLOAD FUNCTIONALITY ------------------- */
const icons = {
    "txt": "📄",
    "pdf": "📕",
    "doc": "📘",
    "docx": "📘",
    "xls": "📗",
    "xlsx": "📗",
    "ppt": "📙",
    "pptx": "📙",
    "zip": "📦",
    "rar": "📦",
    "mp3": "🎵",
    "mp4": "🎬",
    "jpg": "🖼️",
    "png": "🖼️",
    "gif": "🖼️",
    "exe": "⚙️",
    "default": "📁" // Default icon for unknown file types
};

function addFile(filePath, fileName) {
    console.log("Adding:", fileName, "Path:", filePath);

    const gallery = document.getElementById("text-gallery");

    // ✅ Create file container
    const fileContainer = document.createElement("div");
    fileContainer.classList.add("file-container");

    // ✅ Detect if the file is an image
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];
    const fileExtension = fileName.split('.').pop().toLowerCase();
    const isImage = imageExtensions.includes(fileExtension);

    let fileElement;
    
    if (isImage) {
        // ✅ If it's an image, show a preview thumbnail
        fileElement = document.createElement("img");
        fileElement.src = filePath; // Directly set the image path
        fileElement.classList.add("file-thumbnail"); // Apply styles for thumbnails
    } else {
        // ✅ If it's not an image, show an icon with a link
        const fileIconSymbol = icons[fileExtension] || icons["default"];

        fileElement = document.createElement("span");
        fileElement.textContent = fileIconSymbol;
        fileElement.classList.add("file-icon");
    }

    // ✅ Create file name label
    const fileLabel = document.createElement("span");
    fileLabel.textContent = fileName;
    fileLabel.classList.add("file-label");

    // ✅ Store file path in dataset for opening
    fileLabel.dataset.path = filePath;

    // ✅ Click event to open files
    fileContainer.onclick = function (e) {
        e.preventDefault();
        const storedFilePath = fileLabel.dataset.path;
        console.log("Opening:", storedFilePath);

        if (!storedFilePath) {
            console.error("Error: filePath is undefined!");
            return;
        }

        window.electronAPI.openFile(storedFilePath);
    };

    // ✅ Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "X";
    deleteBtn.classList.add("delete-file-btn");
    deleteBtn.onclick = function (event) {
        event.stopPropagation(); // Prevents opening file on delete click
        if (confirm("Are you sure you want to delete this file?")){
            fileContainer.remove();
            saveFiles(); // ✅ Ensure deletion is saved
        }
    };

    fileContainer.appendChild(fileElement);
    fileContainer.appendChild(fileLabel);
    fileContainer.appendChild(deleteBtn);
    gallery.appendChild(fileContainer);
}

// ✅ Save files to localStorage
function saveFiles() {
    const files = [];

    document.querySelectorAll(".file-container").forEach(container => {
        const fileLink = container.querySelector(".file-label"); // Ensure correct selector
        if (fileLink) {
            files.push({ path: fileLink.dataset.path, name: fileLink.textContent });
        }
    });

    console.log("Saving files:", files); // Debugging

    localStorage.setItem(`files_${matiereKey}`, JSON.stringify(files)); // ✅ Save updated list
}

// ✅ Load saved files from localStorage
function loadFiles() {
    const savedFiles = JSON.parse(localStorage.getItem(`files_${matiereKey}`)) || [];
    const gallery = document.getElementById("text-gallery");
    gallery.innerHTML = ""; // ✅ Clear existing files to prevent duplication

    savedFiles.forEach(file => addFile(file.path, file.name));
}

document.getElementById("text-upload").addEventListener("click", async function () {
    console.log("Opening file dialog...");

    // ✅ Call getFilePath once to open the dialog and get all selected files
    const filePaths = await window.electronAPI.getFilePath();
    
    if (!filePaths || filePaths.length === 0) {
        console.log("❌ No file selected.");
        return;
    }

    console.log("✅ Files selected:", filePaths);

    // ✅ Loop through files and add them to UI
    for (let filePath of filePaths) {
        const fileName = filePath.split(/[/\\]/).pop(); // Extract filename
        addFile(filePath, fileName);
    }

    saveFiles();
});

document.getElementById("folder-upload").addEventListener("click", async function () {
    console.log("Opening folder dialog...");

    // ✅ Call getFolderPath once to open the dialog and get all selected folders
    const folderPaths = await window.electronAPI.getFolderPath();
    
    if (!folderPaths || folderPaths.length === 0) {
        console.log("❌ No folder selected.");
        return;
    }

    console.log("✅ Folders selected:", folderPaths);

    // ✅ Loop through folders and add them to UI
    for (let folderPath of folderPaths) {
        const folderName = folderPath.split(/[/\\]/).pop(); // Extract folder name
        addFile(folderPath, folderName);
    }

    saveFiles();
});

document.getElementById("folder-upload").addEventListener("change", async function (event) {
    console.log("Opening folder dialog...");

    // ✅ Call getFolderPath once to open the dialog and get all selected folders
    const folderPaths = await window.electronAPI.getFolderPath();
    
    if (!folderPaths || folderPaths.length === 0) {
        console.log("❌ No folder selected.");
        return;
    }

    console.log("✅ Folders selected:", folderPaths);

    // ✅ Loop through folders and add them to UI
    for (let folderPath of folderPaths) {
        const folderName = folderPath.split(/[/\\]/).pop(); // Extract folder name
        addFile(folderPath, folderName);
    }

    saveFiles();
});

// ✅ Load files on page refresh
document.addEventListener("DOMContentLoaded", function () {
    loadResources();
    loadFiles(); // ✅ Ensure files are loaded on page load
});

document.getElementById("text-upload").addEventListener("click", function (event) {
    event.preventDefault(); // ❌ Prevents opening default file picker
    event.stopPropagation();
});
document.getElementById("folder-upload").addEventListener("click", function (event) {
    event.preventDefault(); // ❌ Prevents opening default file picker
    event.stopPropagation();
});