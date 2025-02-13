let draggedElement = null;
const { saveData, loadData } = window.electronAPI;

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
        return;
    }

    let existingFull = targetCell.querySelector(".draggable:not(.semaine-a):not(.semaine-b)");
    if (existingFull) {
        alert("Cette periode est déjà occupée!");
        return;
    }

    // ✅ Handle week-based placement
    if (existingA && draggedElement.classList.contains("semaine-a")) {
        alert("Semaine A est déjà occupée!");
        return;
    }

    if (existingB && draggedElement.classList.contains("semaine-b")) {
        alert("Semaine B est déjà occupée!");
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

        parentCell.innerHTML = `<span class="time">${parentCell.querySelector('.time')?.innerText || ""}</span>`;

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

document.addEventListener("input", (event) => {
    let cell = event.target.closest(".draggable");
    if (cell) {
        let parentCell = cell.parentElement;
        if (parentCell.classList.contains("cell")) {
            updateCellStorage(parentCell.dataset.id, parentCell.dataset.id);
        }
    }
});

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

        let popupWidth = Math.floor(window.innerWidth * 0.95);
        let popupHeight = Math.floor(window.innerHeight * 0.95);
        let left = (screen.width - popupWidth) / 2;
        let top = (screen.height - popupHeight) / 2;

        window.open(
            `resources.html?matiere=${encodeURIComponent(matiereName)}&dark=${darkModeEnabled}`,
            "Resources",
            `width=${popupWidth},height=${popupHeight},top=${top},left=${left},resizable=true,autoHideMenuBar=true`
        );
    } else if (option === 'delete') {
        if (cell.id === 'OriginalCell') {
            alert("Vous ne pouvez pas supprimer la cellule d'origine !");
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
            return;
        }
        if (week === "semaine-b" && existingA) {
            alert("Revenez à la leçon fixe avant de passer à la semaine B.");
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


function clearAllCells() {
  // ✅ Remove all placed cells but keep the original ones
  document.querySelectorAll(".cell .draggable").forEach(cell => {
      if (cell.id !== "OriginalCell") {
          cell.remove();
      }
  });

  // ✅ Clear saved data so deleted cells don’t reappear
  saveData({});
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

