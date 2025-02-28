let draggedElement = null;
const { saveData, loadData } = window.electronAPI;

// Save time to localStorage
function saveTime(input) {
    const timeId = input.dataset.id;
    const timeValue = input.value;
    localStorage.setItem(`time_${timeId}`, timeValue);
}

// Load saved times from localStorage
function loadTimes() {
    document.querySelectorAll('.time').forEach(input => {
        const timeId = input.dataset.id;
        const savedTime = localStorage.getItem(`time_${timeId}`);
        if (savedTime) {
            input.value = savedTime;
        }
    });
}
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".time").forEach(input => {
        flatpickr(input, {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
            time_24hr: true,
            appendTo: input.closest(".cell"), // Forces the dropdown inside the cell
            onOpen: function (selectedDates, dateStr, instance) {
                    // Align to the right of the input
                    calendar.style.left = "auto";
                    calendar.style.right = "auto";  
                    setTimeout(() => {
                        let hourInput = instance.calendarContainer.querySelector(".flatpickr-hour");
                        let minuteInput = instance.calendarContainer.querySelector(".flatpickr-minute");
    
                        if (hourInput) hourInput.blur(); // Remove focus from hours
                        if (minuteInput) minuteInput.blur(); // Remove focus from minutes
                    }, 10); // Delay to ensure Flatpickr renders first
            }
        });
    });
});




document.addEventListener('DOMContentLoaded', loadTimes);

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".time").forEach(input => {
        input.style.position = "absolute"; // Ensure it stays on top
        input.style.zIndex = "999"; // Keeps it above everything
            
    });
});

function allowDrop(event) {
    event.preventDefault();
}

function drag(event) {
  if (event.target.id === "OriginalCell") {
      // ✅ Clone the original element instead of moving it
      draggedElement = event.target.cloneNode(true);
      draggedElement.id = "cell-" + Date.now(); // Assign a unique ID to the cloned element
      draggedElement.ondragstart = drag; // Ensure the new element is draggable
  } else {
      draggedElement = event.target;
  }

  // ✅ Store the previous position (only for non-clones)
  if (draggedElement.id !== "OriginalCell") {
      draggedElement.dataset.previousCell = draggedElement.parentElement.dataset.id;
  }

  event.dataTransfer.setData("text", "");
  setTimeout(() => draggedElement.classList.add("dragging"), 0);
}

function drop(event) {
    event.preventDefault();
    if (!draggedElement) return;

    let targetCell = event.target.closest(".cell");
    if (!targetCell) return;

    let oldCellId = draggedElement.dataset.previousCell; // Previous position
    let newCellId = targetCell.dataset.id; // New position

    if (!newCellId) {
        console.error("Cell ID is missing! Ensure each cell has a 'data-id'.");
        return;
    }

    // ✅ Check if the target cell is already occupied
    let existingA = targetCell.querySelector(".draggable.semaine-a");
    let existingB = targetCell.querySelector(".draggable.semaine-b");
    let isFull = existingA && existingB; // ✅ Check if both slots are occupied

    if (isFull) {
        alert("Cette periode est déjà occupée!");
        const fixWindow = window.open(
            "about:blank",  // Empty page
            "_blank",
            "width=1,height=1,top=-1000,left=-1000"
        );

        if (fixWindow) {
            setTimeout(() => fixWindow.close(), 50); // Close after 50ms
        }
        return;
        
    }

    let existingFull = targetCell.querySelector(".draggable:not(.semaine-a):not(.semaine-b)");
    if (existingFull) {
        alert("Cette periode est déjà occupée!");
        const fixWindow = window.open(
            "about:blank",  // Empty page
            "_blank",
            "width=1,height=1,top=-1000,left=-1000"
        );

        if (fixWindow) {
            setTimeout(() => fixWindow.close(), 50); // Close after 50ms
        }
        return;
    }

    // ✅ Handle week-based placement
    if (existingA && draggedElement.classList.contains("semaine-a")) {
        alert("Semaine A est déjà occupée!");
        const fixWindow = window.open(
            "about:blank",  // Empty page
            "_blank",
            "width=1,height=1,top=-1000,left=-1000"
        );

        if (fixWindow) {
            setTimeout(() => fixWindow.close(), 50); // Close after 50ms
        }
        return;
    }

    if (existingB && draggedElement.classList.contains("semaine-b")) {
        alert("Semaine B est déjà occupée!");
        const fixWindow = window.open(
            "about:blank",  // Empty page
            "_blank",
            "width=1,height=1,top=-1000,left=-1000"
        );

        if (fixWindow) {
            setTimeout(() => fixWindow.close(), 50); // Close after 50ms
        }
        return;
    }

    // ✅ Assign the correct position based on availability
    if (existingA && !existingB) {
        draggedElement.classList.add("semaine-b");
        draggedElement.style.width = "100px";
        draggedElement.style.right = "0";
    } else if (existingB && !existingA) {
        draggedElement.classList.add("semaine-a");
        draggedElement.style.width = "100px";
        draggedElement.style.left = "0";
    } else {
        // ✅ If the cell is empty, take full space
        draggedElement.classList.remove("semaine-a", "semaine-b");
        draggedElement.style.width = "230px";
        draggedElement.style.left = "";
        draggedElement.style.right = "";
    }

    // ✅ Remove from previous position before saving to new position
    if (oldCellId && oldCellId !== newCellId) {
        removeCellFromStorage(oldCellId, draggedElement.id);
    }

    // ✅ Move the cell and update its last known position
    targetCell.appendChild(draggedElement);
    draggedElement.dataset.previousCell = newCellId; // Update last known position

    updateCellStorage(newCellId, draggedElement.id); // ✅ Save only the new position
}

async function updateCellStorage(targetCellId, movedCellId = null) {
    let savedCells = await loadData() || {};

    let targetCell = document.querySelector(`.cell[data-id="${targetCellId}"]`);
    if (!targetCell) return;

    let allCells = Array.from(targetCell.querySelectorAll(".draggable"));

    if (allCells.length === 0) {
        delete savedCells[targetCellId]; // ✅ Remove empty cells from storage
    } else {
        savedCells[targetCellId] = allCells.map(cell => ({
            cellId: cell.id,
            classes: [...cell.classList],
            inputs: { 
                matiere: cell.querySelector(".input-field1")?.value || "",
                prof: cell.querySelector(".input-field2")?.value || "",
                salle: cell.querySelector(".input-field3")?.value || ""
            },
            imgSrc: cell.querySelector("img")?.getAttribute("src") || "./Assets/Cour.png"
        }));
    }

    // ✅ If the cell was moved, remove it from all old positions
    if (movedCellId) {
        Object.keys(savedCells).forEach(cellId => {
            if (cellId !== targetCellId) {
                savedCells[cellId] = savedCells[cellId].filter(cell => cell.cellId !== movedCellId);

                if (savedCells[cellId].length === 0) {
                    delete savedCells[cellId]; // ✅ Remove empty arrays
                }
            }
        });
    }

    await saveData(savedCells);
}

async function loadSavedCells() {
    const savedCells = (await loadData()) || {};

    Object.keys(savedCells).forEach((cellDataId) => {
        const parentCell = document.querySelector(`.cell[data-id="${cellDataId}"]`);
        if (!parentCell) return;

        // ✅ Preserve the time input instead of overwriting it
        let timeInput = parentCell.querySelector(".time");
        if (!timeInput) {
            timeInput = document.createElement("input");
            timeInput.type = "time";
            timeInput.classList.add("time");
            timeInput.dataset.id = cellDataId;
            timeInput.onchange = function () { saveTime(this); };
            parentCell.appendChild(timeInput);
        }

        // ✅ Restore saved time
        const savedTime = localStorage.getItem(`time_${cellDataId}`);
        if (savedTime) {
            timeInput.value = savedTime;
        }

        // ✅ Ensure time input stays visible on top
        timeInput.style.position = "absolute";
        timeInput.style.zIndex = "10";

        // ✅ Now load other saved data
        savedCells[cellDataId].forEach(data => {
            const newCell = document.createElement("div");
            newCell.id = data.cellId;
            newCell.className = data.classes.join(" ");
            newCell.draggable = true;
            newCell.ondragstart = drag;

            newCell.innerHTML = `
                <input type="text" class="input-field1" placeholder="Nom de matière" autocomplete="off" value="${data.inputs?.matiere || ""}">
                <input type="text" class="input-field2" placeholder="Prof" autocomplete="off" value="${data.inputs?.prof || ""}">
                <input type="text" class="input-field3" placeholder="Salle" autocomplete="off" value="${data.inputs?.salle || ""}">
                <img src="${data.imgSrc}" alt="Cour" class="cour-icon">
                <button class="three-dot-btn" onclick="togglePopup(event)">&#x2022;&#x2022;&#x2022;</button>
                <div class="popup">
                    <button class="popup-option" onclick="handleOption(event,'resources')">Resources</button>
                    <button class="popup-option" onclick="handleOption(event,'delete')">Supprimer</button>
                    <button class="popup-option" onclick="toggleWeek('semaine-a', event)">Semaine A</button>
                    <button class="popup-option" onclick="toggleWeek('semaine-b', event)">Semaine B</button>
                </div>
            `;

            // ✅ Update storage when inputs change
            newCell.querySelectorAll("input").forEach(input => {
                input.addEventListener("input", () => updateCellStorage(cellDataId));
            });

            parentCell.appendChild(newCell);
        });
    });
}

// ✅ Load saved cells and times on page load
document.addEventListener("DOMContentLoaded", loadSavedCells);



document.addEventListener('click', function(event) {
    if (!event.target.closest('.popup') && !event.target.closest('.three-dot-btn')) {
        document.querySelectorAll('.popup').forEach(popup => {
            popup.style.display = 'none';
        });
    }
});

function togglePopup(event) {
    event.stopPropagation();
    const popup = event.target.closest('.draggable').querySelector('.popup');
    document.querySelectorAll('.popup').forEach(p => {
        if (p !== popup) p.style.display = 'none';
    });
    popup.style.display = (popup.style.display === 'block') ? 'none' : 'block';
}

function handleOption(event, option) {
    event.stopPropagation();
    const cell = event.target.closest('.draggable');
    if (!cell) return;

    if (option === 'resources') {
        let matiereName = cell.querySelector(".input-field1")?.value.trim() || "";
        let darkModeEnabled = localStorage.getItem("darkMode") === "enabled"; // ✅ Check Dark Mode
    
        window.electronAPI.openResources(matiereName, darkModeEnabled);
    } else if (option === 'delete') {
        if (cell.id === 'OriginalCell') {
            alert("Vous ne pouvez pas supprimer la cellule d'origine !");
            const fixWindow = window.open(
                "about:blank",  // Empty page
                "_blank",
                "width=1,height=1,top=-1000,left=-1000"
            );

            if (fixWindow) {
                setTimeout(() => fixWindow.close(), 50); // Close after 50ms
            }
            return;
        }
        if (confirm('Etes-vous sûr de vouloir supprimer cette cellule ?')) {
            let parentCell = cell.parentElement;
            cell.remove();
            updateCellStorage(parentCell.dataset.id, parentCell.dataset.id);

            const fixWindow = window.open(
                "about:blank",  // Empty page
                "_blank",
                "width=1,height=1,top=-1000,left=-1000"
            );

            if (fixWindow) {
                setTimeout(() => fixWindow.close(), 50); // Close after 50ms
            }
        }
    }

    document.querySelectorAll('.popup').forEach(popup => {
        popup.style.display = 'none';
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const darkModeToggle = document.getElementById("dark-mode-toggle");

    // ✅ Load Dark Mode state from localStorage
    if (localStorage.getItem("darkMode") === "enabled") {
        document.body.classList.add("dark-mode");
        darkModeToggle.textContent = "🌞";
    }

    // ✅ Toggle Dark Mode on Button Click
    darkModeToggle.addEventListener("click", function () {
        document.body.classList.toggle("dark-mode");

        const isEnabled = document.body.classList.contains("dark-mode");
        localStorage.setItem("darkMode", isEnabled ? "enabled" : "disabled");
        darkModeToggle.textContent = isEnabled ? "🌞" : "🌚";
    });
});


async function removeCellFromStorage(previousCellId, cellId) {
    let savedCells = await loadData() || {};

    if (savedCells[previousCellId]) {
        // ✅ Remove only the specific cell that was moved
        savedCells[previousCellId] = savedCells[previousCellId].filter(cell => cell.cellId !== cellId);

        // ✅ If no more cells are left in this position, delete the entry
        if (savedCells[previousCellId].length === 0) {
            delete savedCells[previousCellId];
        }

        await saveData(savedCells); // ✅ Update localStorage
    }
}

function toggleWeek(week, event) {
    const cell = event.target.closest('.draggable');
    if (!cell) return;
    const parentCell = cell.parentElement;
    if (!parentCell.classList.contains("cell")) return;

    let existingA = parentCell.querySelector(".draggable.semaine-a");
    let existingB = parentCell.querySelector(".draggable.semaine-b");

    if (week === "semaine-a" && existingB) {
        alert("Revenez à la leçon fixe avant de passer à la semaine A.");
        const fixWindow = window.open(
            "about:blank",  // Empty page
            "_blank",
            "width=1,height=1,top=-1000,left=-1000"
        );

        if (fixWindow) {
            setTimeout(() => fixWindow.close(), 50); // Close after 50ms
        }
        return;
    }
    if (week === "semaine-b" && existingA) {
        alert("Revenez à la leçon fixe avant de passer à la semaine B.");
        const fixWindow = window.open(
            "about:blank",  // Empty page
            "_blank",
            "width=1,height=1,top=-1000,left=-1000"
        );

        if (fixWindow) {
            setTimeout(() => fixWindow.close(), 50); // Close after 50ms
        }
        return;
    }

    if (cell.classList.contains(week)) {
        cell.classList.remove("semaine-a", "semaine-b");
        cell.style.width = "230px";
        cell.style.left = "";
        cell.style.right = "";
    } else {
        cell.classList.remove("semaine-a", "semaine-b");
        if (week === "semaine-a") {
            cell.classList.add("semaine-a");
            cell.style.width = "115px";
            cell.style.left = "0";
        } else if (week === "semaine-b") {
            cell.classList.add("semaine-b");
            cell.style.width = "115px";
            cell.style.right = "0";
        }        
    }
    updateCellStorage(parentCell.dataset.id, parentCell.dataset.id); // ✅ Save changes
}    

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("faculte").value = localStorage.getItem("faculte") || "";
    document.getElementById("semestre").value = localStorage.getItem("semestre") || "";
    document.getElementById("specialite").value = localStorage.getItem("specialite") || "";
});

document.getElementById("faculte").addEventListener("input", function () {
    localStorage.setItem("faculte", this.value);
});

document.getElementById("semestre").addEventListener("input", function () {
    localStorage.setItem("semestre", this.value);
});

document.getElementById("specialite").addEventListener("input", function () {
    localStorage.setItem("specialite", this.value);
});

// ----------Into.js Tutorial-----------

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM Loaded, checking tutorial..."); // ✅ Debugging log

    // ✅ Check if it's the user's first time
    if (!localStorage.getItem("introCompleted")) {
        console.log("Starting tutorial for first-time user..."); // ✅ Debugging log
        startTutorial(); 
    }

    // ✅ Add event listener for the tutorial button
    const tutorialBtn = document.getElementById("tutorial-btn");
    if (tutorialBtn) {
        tutorialBtn.addEventListener("click", startTutorial);
        console.log("Tutorial button found & event added!"); // ✅ Debugging log
    } else {
        console.error("Tutorial button not found!");
    }
});

function startTutorial() {
    introJs()
        .setOptions({
            steps: [
                { 
                    intro: "Welcome To Smart Emploi🚀"
                },
                {
                    element: document.querySelector(".cells-container"), 
                    intro: "Pour organiser votre emploi, faites glisser ces cellules (Cour, TD, TP) dans la grille. (Drag & Drop)."
                },
                {
                    element: document.querySelector("#OriginalCell"), 
                    intro: "Pour chaque cellule, tu peux saisir le nom de la matière, le professeur et la salle."
                },
                {
                    element: document.querySelector(".three-dot-btn"), 
                    intro: "Dans les options tu peux Acceder aux ressources, Changer la semaine ou Supprimer la cellule."
                },
                {
                    element: document.querySelector("#dark-mode-toggle"), 
                    intro: "Tu peux activer le mode sombre en cliquant sur ce bouton."
                },
                {
                    element: document.querySelector(".time"), 
                    intro: "Tu peux changer le temps."
                },
                {
                    intro: "! Dans l'onglet Ressources, vous pouvez ajouter des Informations, des Liens et des Fichier liés au sujet à partir duquel vous avez accédé les ressources.<br><br>! Deux cellules portant le même nom contiendront les mêmes ressources."
                }
            ],
            showProgress: false,  // ✅ Show step progress bar
            showBullets: true,  // ❌ Hide bullet points
            exitOnOverlayClick: false, // ❌ Prevent closing by clicking outside
            showStepNumbers: true,  // ✅ Show step numbers
            disableInteraction: false, // ✅ Allow user interaction
            nextLabel: "Suivant",
            prevLabel: "Retour",
            doneLabel: "Terminer",
            skipLabel: "Skip" // ✅ Skip button text
        })
        .oncomplete(function () {
            localStorage.setItem("introCompleted", "true"); // ✅ Mark tutorial as completed
        })
        .onexit(function () {
            localStorage.setItem("introCompleted", "true"); // ✅ Skip also completes the tutorial
        })
        .start();
}
