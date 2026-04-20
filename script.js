// State management
let selectedSubjects = [];
let validFaculties = [];
let validSubjects = [];

// Initialize jsPDF
const { jsPDF } = window.jspdf;

// DOM Elements
const addSubjectBtn = document.getElementById('addSubjectBtn');
const addCustomSubjectBtn = document.getElementById('addCustomSubjectBtn');
const addAllDefaultBtn = document.getElementById('addAllDefaultBtn');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const previewBody = document.getElementById('previewBody');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const deptInput = document.getElementById('departmentInput');
const deptDropdown = document.getElementById('departmentDropdown');
const semInput = document.getElementById('semesterInput');
const semDropdown = document.getElementById('semesterDropdown');
const semGroup = document.getElementById('semGroup');
const dynamicDropdowns = document.getElementById('dynamicDropdowns');
const subjectInput = document.getElementById('subjectInput');
const subjectDropdown = document.getElementById('subjectDropdown');
const facultyInput = document.getElementById('facultyInput');
const facultyDropdown = document.getElementById('facultyDropdown');

let masterDepartmentData = {}; 
let globalSubjectsData = {};
let globalFacultyData = null;
let draggedRowIndex = null;
let electiveData = { professional_electives: [], open_electives: [] };

// Safely Initialize Mobile Drag-and-Drop polyfill
try {
    if (typeof MobileDragDrop !== 'undefined') {
        MobileDragDrop.polyfill({
            holdToDrag: 300 // requires a 300ms hold before drag initiates
        });
    }
} catch (e) {
    console.warn("Mobile Drag-Drop Polyfill skipped:", e);
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadSearchableDropdownFaculty('database/faculty.json', 'facultyInput', 'facultyDropdown', validFaculties);
        await loadAllConfigurations();
        initParticles();
    } catch (error) {
        console.error("Error loading JSON data:", error);
    }
});

async function loadSearchableDropdownFaculty(url, inputId, dropdownId, validListArray) {
    const response = await fetch(url);
    const data = await response.json();
    globalFacultyData = data;
    populateSearchableSelect(data, inputId, dropdownId, validListArray);
}

function populateSearchableSelect(dataGroups, inputId, dropdownId, validListArray) {
    const inputEl = document.getElementById(inputId);
    const dropdownEl = document.getElementById(dropdownId);
    
    dropdownEl.innerHTML = ''; // Clear existing
    validListArray.length = 0; // Clear array
    
    for (const groupName in dataGroups) {
        const groupContainer = document.createElement('div');
        groupContainer.className = 'group-container';
        
        if (groupName) {
            const groupHeader = document.createElement('div');
            groupHeader.className = 'dropdown-group';
            groupHeader.textContent = groupName;
            groupContainer.appendChild(groupHeader);
        }
        
        dataGroups[groupName].forEach(item => {
            validListArray.push(item);
            const itemDiv = document.createElement('div');
            itemDiv.className = 'dropdown-item';
            itemDiv.textContent = item;
            groupContainer.appendChild(itemDiv);
        });
        
        dropdownEl.appendChild(groupContainer);
    }
    
    if (!inputEl.dataset.initialized) {
        inputEl.addEventListener('focus', () => {
            closeAllDropdowns();
            dropdownEl.classList.add('show');
        });
        
        inputEl.addEventListener('click', (e) => e.stopPropagation());
        
        inputEl.addEventListener('input', function() {
            dropdownEl.classList.add('show');
            const filter = this.value.toLowerCase();
            const groups = dropdownEl.querySelectorAll('.group-container');
            
            groups.forEach(group => {
                let hasVisibleItem = false;
                const items = group.querySelectorAll('.dropdown-item');
                
                items.forEach(item => {
                    if (item.textContent.toLowerCase().includes(filter)) {
                        item.style.display = 'block';
                        hasVisibleItem = true;
                    } else {
                        item.style.display = 'none';
                    }
                });
                
                group.style.display = hasVisibleItem ? 'block' : 'none';
            });
        });
        inputEl.dataset.initialized = "true";
    }
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('dropdown-item')) {
        const dropdownContent = e.target.closest('.dropdown-content');
        if (dropdownContent) {
            const inputId = dropdownContent.id.replace('Dropdown', 'Input');
            const inputEl = document.getElementById(inputId);
            if(inputEl) {
                inputEl.value = e.target.textContent;
                dropdownContent.classList.remove('show');
                // Trigger change event programmatically!
                inputEl.dispatchEvent(new Event('change'));
            }
        }
    }
    closeAllDropdowns();
});

function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-content').forEach(el => el.classList.remove('show'));
}

async function loadAllConfigurations() {
    try {
        const deptFiles = [
            { sem: 'database/cse_dept-semester-wise-subjects.json', elec: 'database/elective-cse.json' },
            { sem: 'database/ece_dept-semester-wise-subjects.json', elec: 'database/elective-ece.json' },
            { sem: 'database/eee_dept-semester-wise-subjects.json', elec: 'database/elective-eee.json' },
            { sem: 'database/it_dept-semester-wise-subjects.json', elec: 'database/elective-it.json' },
            { sem: 'database/me_dept-semester-wise-subjects.json', elec: 'database/elective-me.json' }
        ];

        let departmentsList = { "": [] };

        for (const filePair of deptFiles) {
            const semRes = await fetch(filePair.sem).catch(() => null);
            if (semRes && semRes.ok) {
                const semJson = await semRes.json();
                const deptName = semJson.department;
                
                let elecData = { professional_electives: [], open_electives: [] };
                const elecRes = await fetch(filePair.elec).catch(() => null);
                if (elecRes && elecRes.ok) {
                    elecData = await elecRes.json();
                }

                masterDepartmentData[deptName] = { 
                    semesters: semJson.semesters,
                    electives: elecData
                };

                departmentsList[""].push(deptName);
            }
        }
        
        // Add other departments that don't have semester splits
        for (const d in globalSubjectsData) {
            if (!masterDepartmentData[d] && !Object.keys(masterDepartmentData).some(k => k.includes(d) || d.includes(k))) {
                departmentsList[""].push(d);
                masterDepartmentData[d] = { rawSubjects: globalSubjectsData[d] };
            }
        }
        
        populateSearchableSelect(departmentsList, 'departmentInput', 'departmentDropdown', []);
        
    } catch(e) { console.error(e); }
}

deptInput.addEventListener('change', () => {
    const dept = deptInput.value;
    semInput.value = '';
    populateSearchableSelect({}, 'semesterInput', 'semesterDropdown', []);
    
    semGroup.style.display = 'none';
    dynamicDropdowns.style.display = 'none';
    
    if (dept) {
        const deptData = masterDepartmentData[dept];
        if (deptData && deptData.semesters) {
            semGroup.style.display = 'block';
            let semestersList = { "": Object.keys(deptData.semesters) };
            populateSearchableSelect(semestersList, 'semesterInput', 'semesterDropdown', []);
        } else if (deptData && deptData.rawSubjects) {
            dynamicDropdowns.style.display = 'block';
            let formattedGroups = {};
            formattedGroups[dept] = deptData.rawSubjects;
            populateSearchableSelect(formattedGroups, 'subjectInput', 'subjectDropdown', validSubjects);
            subjectInput.value = '';
            facultyInput.value = '';
        }
    }
});

semInput.addEventListener('change', () => {
    const sem = semInput.value;
    const dept = deptInput.value;
    dynamicDropdowns.style.display = 'none';
    
    if (sem && dept) {
        dynamicDropdowns.style.display = 'block';
        
        const deptData = masterDepartmentData[dept];
        const semestersData = deptData.semesters;
        const deptElectives = deptData.electives || { professional_electives: [], open_electives: [] };
        
        const rawSubjectsList = semestersData[sem] || [];
        
        let finalSubjects = {
            "Regular Subjects": [],
            "Professional Electives": [],
            "Open Electives": []
        };
        
        rawSubjectsList.forEach(sub => {
            if (sub.includes('Professional Elective')) {
                if(finalSubjects['Professional Electives'].length === 0)
                    finalSubjects['Professional Electives'] = deptElectives.professional_electives || [];
            } else if (sub.includes('Open Elective')) {
                if(finalSubjects['Open Electives'].length === 0)
                    finalSubjects['Open Electives'] = deptElectives.open_electives || [];
            } else {
                finalSubjects['Regular Subjects'].push(sub);
            }
        });
        
        if(finalSubjects['Professional Electives'].length === 0) delete finalSubjects['Professional Electives'];
        if(finalSubjects['Open Electives'].length === 0) delete finalSubjects['Open Electives'];
        if(finalSubjects['Regular Subjects'].length === 0) delete finalSubjects['Regular Subjects'];
        
        populateSearchableSelect(finalSubjects, 'subjectInput', 'subjectDropdown', validSubjects);
        subjectInput.value = '';
        facultyInput.value = '';
    }
});

addAllDefaultBtn.addEventListener('click', () => {
    const sem = semInput.value;
    const dept = deptInput.value;
    
    if (sem && dept) {
        const deptData = masterDepartmentData[dept];
        if (!deptData || !deptData.semesters) return;
        
        const rawSubjectsList = deptData.semesters[sem];
        if (!rawSubjectsList) return;
        
        let addedCount = 0;
        
        rawSubjectsList.forEach(sub => {
            if (!sub.includes('Professional Elective') && !sub.includes('Open Elective')) {
                const isDuplicate = selectedSubjects.some(item => item.subjectName === sub);
                if (!isDuplicate) {
                    selectedSubjects.push({ subjectName: sub, facultyName: "" });
                    addedCount++;
                }
            }
        });
        
        if (addedCount > 0) {
            updatePreviewTable();
        } else {
            alert("All default subjects for this semester have already been added.");
        }
    } else {
        alert("Please select a Department and Semester first.");
    }
});

if (deleteAllBtn) {
    deleteAllBtn.addEventListener('click', () => {
        if (selectedSubjects.length === 0) return;
        if (confirm("Are you sure you want to delete all subjects?")) {
            selectedSubjects = [];
            updatePreviewTable();
        }
    });
}

addSubjectBtn.addEventListener('click', () => {
    const facultyName = document.getElementById('facultyInput').value.trim();
    const subjectName = document.getElementById('subjectInput').value.trim();

    if (!subjectName) {
        alert("Please select a Subject before adding.");
        return;
    }

    if (!validSubjects.includes(subjectName)) {
        alert("Invalid entry. Please select an option from the dropdown list. Or use 'Add Custom Subject'.");
        return;
    }

    if (facultyName && !validFaculties.includes(facultyName)) {
        alert("Invalid faculty. Please select an option from the dropdown list.");
        return;
    }

    const isDuplicate = selectedSubjects.some(item => item.subjectName === subjectName);
    if (isDuplicate) {
        alert("This subject has already been added.");
        return;
    }

    selectedSubjects.push({ subjectName, facultyName });
    updatePreviewTable();
    
    document.getElementById('subjectInput').value = "";
    document.getElementById('subjectDropdown').querySelectorAll('.group-container, .dropdown-item')
        .forEach(el => el.style.display = 'block');
});

addCustomSubjectBtn.addEventListener('click', () => {
    const facultyName = document.getElementById('facultyInput').value.trim();
    const subjectName = document.getElementById('subjectInput').value.trim();

    if (!subjectName) {
        alert("Please type a Subject name before adding.");
        return;
    }

    if (facultyName && !validFaculties.includes(facultyName)) {
        alert("Invalid faculty. Please select an option from the dropdown list.");
        return;
    }

    const isDuplicate = selectedSubjects.some(item => item.subjectName === subjectName);
    if (isDuplicate) {
        alert("This subject has already been added.");
        return;
    }

    selectedSubjects.push({ subjectName, facultyName });
    updatePreviewTable();
    
    document.getElementById('subjectInput').value = "";
    document.getElementById('subjectDropdown').querySelectorAll('.group-container, .dropdown-item')
        .forEach(el => el.style.display = 'block');
});

window.updateFacultyName = function(index, value) {
    selectedSubjects[index].facultyName = value;
};

window.deleteSubject = function(index) {
    selectedSubjects.splice(index, 1);
    updatePreviewTable();
};

function updatePreviewTable() {
    previewBody.innerHTML = "";

    selectedSubjects.forEach((item, index) => {
        const row = document.createElement('tr');
        row.draggable = true;

        row.addEventListener('dragstart', (e) => {
            draggedRowIndex = index;
            row.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        row.addEventListener('dragend', () => {
            row.classList.remove('dragging');
            draggedRowIndex = null;
        });

        row.addEventListener('dragover', (e) => {
            e.preventDefault();
            const bounding = row.getBoundingClientRect();
            const offset = e.clientY - bounding.top;
            if (offset > bounding.height / 2) {
                row.style.borderBottom = "2px solid #007bff";
                row.style.borderTop = "";
            } else {
                row.style.borderTop = "2px solid #007bff";
                row.style.borderBottom = "";
            }
        });

        row.addEventListener('dragleave', () => {
            row.style.borderTop = "";
            row.style.borderBottom = "";
        });

        row.addEventListener('drop', (e) => {
            e.preventDefault();
            row.style.borderTop = "";
            row.style.borderBottom = "";
            
            if (draggedRowIndex === null || draggedRowIndex === index) return;
            
            const bounding = row.getBoundingClientRect();
            const offset = e.clientY - bounding.top;
            let targetIndex = index;
            
            if (offset > bounding.height / 2) {
                targetIndex++; 
            }
            
            const draggedItem = selectedSubjects.splice(draggedRowIndex, 1)[0];
            if (draggedRowIndex < targetIndex) {
                targetIndex--;
            }
            selectedSubjects.splice(targetIndex, 0, draggedItem);
            updatePreviewTable();
        });

        row.innerHTML = `
            <td style="cursor: grab;" title="Drag to reorder">${index + 1} ↕</td>
            <td>${item.subjectName}</td>
            <td>
                <div class="searchable-select" style="margin-bottom: 0;">
                    <input type="text" id="rowFacultyInput_${index}" placeholder="Choose Faculty" autocomplete="off" value="${item.facultyName}" style="width: 100%; padding: 6px; box-sizing: border-box;" onchange="updateFacultyName(${index}, this.value)">
                    <div id="rowFacultyDropdown_${index}" class="dropdown-content"></div>
                </div>
            </td>
            <td style="white-space: nowrap;">
                <button class="delete-btn" onclick="deleteSubject(${index})">Delete</button>
            </td>
        `;
        previewBody.appendChild(row);

        if (globalFacultyData) {
            let rowDummyArray = [];
            populateSearchableSelect(globalFacultyData, `rowFacultyInput_${index}`, `rowFacultyDropdown_${index}`, rowDummyArray);
        }
    });
}

// Handle "Download PDF" button click
downloadPdfBtn.addEventListener('click', async () => {
    if (selectedSubjects.length === 0) {
        alert("Please add at least one subject before generating the PDF.");
        return;
    }

    // Change the button text while processing so the user knows it's working
    const originalText = downloadPdfBtn.textContent;
    downloadPdfBtn.textContent = "Merging PDFs...";
    downloadPdfBtn.disabled = true;

    await mergeAndDownloadPDF();

    downloadPdfBtn.textContent = originalText;
    downloadPdfBtn.disabled = false;
});

// Function to generate the table PDF and merge it with the cover PDF
async function mergeAndDownloadPDF() {
    try {
        // 1. Generate the Table PDF as an ArrayBuffer using jsPDF
        const doc = new jsPDF();

        const tableHeaders = [
            ["S.No", "Subject Name", "Faculty Name", "Signature"]
        ];

        const tableBody = selectedSubjects.map((item, index) => [
            index + 1, item.subjectName, item.facultyName, ""                    
        ]);

        doc.autoTable({
            startY: 10, 
            head: tableHeaders,
            body: tableBody,
            theme: 'grid', 
            headStyles: { fillColor: [255, 255, 255], textColor: 20, fontStyle: 'bold', lineWidth: 0.1, lineColor: 200 },
            styles: { fontSize: 12, cellPadding: 5, textColor: 20, lineWidth: 0.1, lineColor: 200 },
            columnStyles: {
                0: { halign: 'center', cellWidth: 20 },
                1: { cellWidth: 70 },
                2: { cellWidth: 60 },
                3: { cellWidth: 35 } 
            }
        });

        // Get the jsPDF document as a byte array
        const dynamicPdfBytes = doc.output('arraybuffer');

        // 2. Fetch the Cover PDF from the project folder
        // IMPORTANT: Rename 'cover.pdf' below if your file is named something else!
        const coverPdfResponse = await fetch('supporting-docs/no-due-default.pdf'); 
        if (!coverPdfResponse.ok) {
            throw new Error("Could not find the cover PDF file.");
        }
        const coverPdfBytes = await coverPdfResponse.arrayBuffer();

        // 3. Use pdf-lib to merge them
        const { PDFDocument } = PDFLib;
        
        // Create a new blank PDF
        const mergedPdf = await PDFDocument.create();
        
        // Load both documents into pdf-lib
        const coverDoc = await PDFDocument.load(coverPdfBytes);
        const dynamicDoc = await PDFDocument.load(dynamicPdfBytes);

        // Copy all pages from the cover doc and add to merged pdf
        const coverPages = await mergedPdf.copyPages(coverDoc, coverDoc.getPageIndices());
        coverPages.forEach((page) => mergedPdf.addPage(page));

        // Copy all pages from our generated table doc and add to merged pdf
        const dynamicPages = await mergedPdf.copyPages(dynamicDoc, dynamicDoc.getPageIndices());
        dynamicPages.forEach((page) => mergedPdf.addPage(page));

        // 4. Save and trigger download
        const mergedPdfBytes = await mergedPdf.save();
        
        // Create a Blob and trigger the browser download
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'Complete_No_Due_Form.pdf';
        link.click();

    } catch (error) {
        console.error("Error during PDF merging:", error);
        alert("Failed to merge PDFs. Make sure 'cover.pdf' is in the exact same folder as your index.html and you are running via Local Server.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initParticles();
});

// ==========================================
// Animated Canvas Particle Background Engine
// ==========================================
const particleState = {
    max: 70,
    canvas: null,
    context: null,
    particles: [],
    // Using softer blues & grays to fit the current SEO/academic style vs harsh oranges
    colors: ['#007bff', '#17a2b8', '#cfd3d6', '#adb5bd', '#6c757d', '#dee2e6']
};

class Particle {
    constructor (id = 0) {
        this.id = id;
        this.type = this.randomizeType();
        this.inBounds = false;
        this.coords = {
            x: Math.round(Math.random() * particleState.canvas.width),
            y: Math.round(Math.random() * particleState.canvas.height)
        };

        this.velocity = {
            x: (Math.random() < 0.5 ? -1 : 1) * (Math.random() * 0.7),
            y: (Math.random() < 0.5 ? -1 : 1) * (Math.random() * 0.7)
        };
        
        this.alpha = 0.1;
        this.hex = this.randomFromArray(particleState.colors);
        this.color = this.hexToRGBA(this.hex, this.alpha);
        this.strokeWidth = Math.random() * (Math.random() > 0.5 ? 1.5 : 2.5);
        
        switch(this.type) {
            case 'bubble':
                this.diameter = this.getCircleDiameter();
                break;
            case 'line':
                this.angle = Math.atan2(this.coords.y, this.coords.x);
                this.length = this.randomFromArray([5, 7, 3, 10]);
                this.rotateSpeed = this.randomFromArray([10, 30, 60, 120]);
                this.rotateClockwise = Math.random() < 0.5;
                break;
        }
    }
    
    getCircleDiameter () {
        let diameter = 0;
        while(diameter < 2) {
            diameter = (Math.random() * 7) * 2;
        }
        return diameter;
    }
    
    update () {
        if (this.alpha < 1) {
            this.alpha += 0.01;
            this.color = this.hexToRGBA(this.hex, this.alpha);
        }

        this.coords.x += this.velocity.x;
        this.coords.y += this.velocity.y;

        if (this.type === 'line') {
            let angle = Math.PI / this.rotateSpeed;
            this.angle += this.rotateClockwise ? -Math.abs(angle) : Math.abs(angle);
        }

        return this.withinBounds();
    }
    
    draw () {
        particleState.context.lineWidth = this.strokeWidth;
        particleState.context.strokeStyle = this.color;
        particleState.context.save();

        switch (this.type) {
            case 'line':
                particleState.context.translate(this.coords.x / 2, this.coords.y / 2);
                particleState.context.rotate(this.angle);
                particleState.context.beginPath();
                particleState.context.moveTo(-this.length / 2, 0);
                particleState.context.lineTo(this.length / 2, 0);
                break;
            case 'bubble':
                particleState.context.beginPath();
                particleState.context.arc(this.coords.x, this.coords.y, this.diameter, 0, Math.PI * 2, false);
                break;
        }

        particleState.context.stroke();
        particleState.context.restore();
    }
    
    withinBounds () {
        let boundX = (particleState.canvas.width / 2 ) + 5;
        let boundY = (particleState.canvas.height / 2) + 5;
        let x = this.coords.x / 2;
        let y = this.coords.y / 2;
        
        this.inBounds = !((x > boundX || x < 0 - 5) || (y > boundY || y < 0 - 5));
        
        return this.inBounds;
    }
    
    hexToRGBA (hex, alpha) {
        let h = hex.replace('#', '');
        if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
        let red = parseInt(h.substring(0, 2), 16);
        let green = parseInt(h.substring(2, 4), 16);
        let blue = parseInt(h.substring(4, 6), 16);

        return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    }
    
    randomFromArray (arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }
    
    randomizeType () {
        let types = Array(4).fill('bubble');
        types.push('line');
        return this.randomFromArray(types);
    }
}

const updateCanvasSize = () => {
    if (!particleState.canvas) return;
    particleState.canvas.width = window.innerWidth * 2;
    particleState.canvas.height = window.innerHeight * 2;
    particleState.canvas.style.width = window.innerWidth + 'px';
    particleState.canvas.style.height = window.innerHeight + 'px';
};

let pids = 0;
const generateParticles = () => {
    if(particleState.particles.length < particleState.max) {
        for(let i = particleState.particles.length; i < particleState.max; i++) {
            particleState.particles.push(new Particle(pids++));
        }
    }
};

const updateParticles = () => {
    if(!particleState.context) return;
    if(particleState.particles.length < particleState.max - 5) generateParticles();
    
    particleState.particles = particleState.particles.filter(particle => particle.update());

    particleState.context.clearRect(0, 0, particleState.canvas.width, particleState.canvas.height);
    particleState.particles.forEach(particle => particle.draw());

    requestAnimationFrame(updateParticles);
};

const initParticles = () => {
    particleState.canvas = document.getElementById('canvas-particles');
    if (!particleState.canvas) return;
    particleState.context = particleState.canvas.getContext('2d');
    updateCanvasSize();
    generateParticles();
    updateParticles();
    
    window.addEventListener('resize', updateCanvasSize);
};

// ==========================================
// Fun Evasive TGNAS Chatbot Implementation
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const tgnasBot = document.getElementById('tgnas-bot');
    const tgnasLock = document.getElementById('tgnas-lock');

    if (tgnasBot && tgnasLock) {
        let isLocked = false;

        // Toggle strict lockdown via corner lock
        tgnasLock.addEventListener('click', () => {
            isLocked = !isLocked;
            tgnasLock.classList.toggle('locked', isLocked);
            tgnasLock.textContent = isLocked ? '🔒' : '🔓';
        });

        // Trigger evasive jumps entirely randomly across bounds unless explicitly locked 
        tgnasBot.addEventListener('mouseover', () => {
            if (isLocked) return;
            // Prevent teleportation if running on mobile sized bounds or touch screens
            if (window.innerWidth <= 768) return;

            // Safe bounded viewport limits mapping
            const maxX = window.innerWidth - tgnasBot.offsetWidth;
            const maxY = window.innerHeight - tgnasBot.offsetHeight;

            // Compute randomly mapped jumps
            const randomX = Math.floor(Math.random() * maxX);
            const randomY = Math.floor(Math.random() * maxY);

            // Nullify native CSS origins then bind absolute mapping overrides
            tgnasBot.style.bottom = 'auto'; 
            tgnasBot.style.right = 'auto';
            tgnasBot.style.left = randomX + 'px';
            tgnasBot.style.top = randomY + 'px';
        });
    }
});