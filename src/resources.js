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
    console.log("Adding file:", fileName, "with path:", filePath); // Debugging

    const gallery = document.getElementById("text-gallery");

    // ✅ Create file container
    const fileContainer = document.createElement("div");
    fileContainer.classList.add("file-container");

    const fileExtension = fileName.split('.').pop().toLowerCase();
    const fileIconSymbol = icons[fileExtension] || icons["default"];

    // ✅ Create file icon
    const fileIcon = document.createElement("span");
    fileIcon.textContent = fileIconSymbol;
    fileIcon.classList.add("file-icon");

    // ✅ Create file name link
    const fileLink = document.createElement("a");
    fileLink.href = "#"; 
    fileLink.textContent = fileName;
    fileLink.classList.add("file-link");
    
    // 🔹 Store the file path inside a dataset attribute (important for saving/loading)
    fileLink.dataset.path = filePath; 

    fileContainer.onclick = function (e) {
        e.preventDefault();
        const storedFilePath = fileLink.dataset.path;
        console.log("Opening file:", storedFilePath);

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
        fileContainer.remove();
        saveFiles();
    };

    fileContainer.appendChild(fileIcon);
    fileContainer.appendChild(fileLink);
    fileContainer.appendChild(deleteBtn);
    gallery.appendChild(fileContainer);
}

// ✅ Save files to localStorage
function saveFiles() {
    const files = [];
    document.querySelectorAll(".file-container").forEach(container => {
        const fileLink = container.querySelector("a");
        files.push({ path: fileLink.dataset.path, name: fileLink.textContent });
    });

    localStorage.setItem(`files_${matiereKey}`, JSON.stringify(files));
}

// ✅ Load saved files from localStorage
function loadFiles() {
    const savedFiles = JSON.parse(localStorage.getItem(`files_${matiereKey}`)) || [];
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

// ✅ Load files on page refresh
document.addEventListener("DOMContentLoaded", loadFiles);

document.getElementById("text-upload").addEventListener("click", function (event) {
    event.preventDefault(); // ❌ Prevents opening default file picker
    event.stopPropagation();
});