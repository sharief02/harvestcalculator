const DEFAULT_MAX_WEIGHTS = 40;
let countModified = false;

// DOM Elements
const tankNameInput = document.getElementById('tank-name');
const countInput = document.getElementById('count');
const warning = document.getElementById('warning');
const weightsContainer = document.getElementById('weights-container');
const addRowButton = document.getElementById('add-row');
const numberResult = document.getElementById('number-result');
const totalWeightResult = document.getElementById('total-weight');
const netWeightResult = document.getElementById('net-weight');
const finalWeightResult = document.getElementById('final-weight');
const printBtn = document.getElementById('print-btn');
const whatsappBtn = document.getElementById('whatsapp-btn');
const whatsappModal = document.getElementById('whatsapp-modal');
const closeModalBtn = document.getElementById('close-modal');
const modalContent = document.getElementById('modal-content');
const sendWhatsappBtn = document.getElementById('send-whatsapp');
const copyTextBtn = document.getElementById('copy-text');

// Print Options Modal Elements
const printOptionsModal = document.getElementById('print-options-modal');
const closePrintModalBtn = document.getElementById('close-print-modal');
const printBWBtn = document.getElementById('print-bw');
const printColorBtn = document.getElementById('print-color');

// Initialize default weight rows
function initializeWeights() {
  for (let i = 0; i < DEFAULT_MAX_WEIGHTS; i++) {
    addWeightRow();
  }
}

// Add a new weight row (with delete button)
function addWeightRow() {
  const row = document.createElement('div');
  row.className = 'weight-row';
  // Mark the row as not filled initially
  row.setAttribute('data-filled', 'false');
  row.innerHTML = `
    <span>${weightsContainer.children.length + 1}</span>
    <input type="number" class="weight-input" value="0" min="0" step="0.1">
    <select class="tray-type">
      <option value="2">Double Tray</option>
      <option value="1">Single Tray</option>
    </select>
    <button class="delete-btn">×</button>
  `;
  weightsContainer.appendChild(row);
  // Add listeners for dynamic updates
  row.querySelector('.weight-input').addEventListener('input', () => {
    updateCalculations();
    updateRowDataFilled(row);
  });
  row.querySelector('.tray-type').addEventListener('change', updateCalculations);
  row.querySelector('.delete-btn').addEventListener('click', () => {
    row.remove();
    updateRowNumbers();
    updateCalculations();
  });
}

// Update row numbers after deletion
function updateRowNumbers() {
  Array.from(weightsContainer.children).forEach((row, index) => {
    row.querySelector('span').textContent = index + 1;
  });
}

// Update data-filled attribute based on weight value
function updateRowDataFilled(row) {
  const weightInput = row.querySelector('.weight-input');
  const weight = parseFloat(weightInput.value);
  row.setAttribute('data-filled', (!isNaN(weight) && weight > 0) ? 'true' : 'false');
}

// Recalculate totals and update result fields
function updateCalculations() {
  const count = parseInt(countInput.value);
  const weightRows = weightsContainer.querySelectorAll('.weight-row');
  let totalWeight = 0;
  let totalTrays = 0;
  weightRows.forEach(row => {
    const weightInput = row.querySelector('.weight-input');
    const trayFactor = parseFloat(row.querySelector('.tray-type').value);
    const weight = parseFloat(weightInput.value);
    updateRowDataFilled(row);
    if (!isNaN(weight) && weight > 0) {
      totalWeight += weight;
      totalTrays += trayFactor;
      weightInput.classList.remove('invalid');
    } else {
      weightInput.classList.add('invalid');
    }
  });
  const netWeight = totalTrays * 1.8;
  const finalWeight = totalWeight - netWeight;
  const numberValue = (isNaN(count) || count <= 0) ? 0 : finalWeight * count;
  totalWeightResult.value = totalWeight.toFixed(2);
  netWeightResult.value = netWeight.toFixed(2);
  finalWeightResult.value = finalWeight.toFixed(2);
  numberResult.value = numberValue.toFixed(2);
  warning.style.display = (count <= 0 && !countModified) ? 'block' : 'none';
}

addRowButton.addEventListener('click', () => {
  addWeightRow();
  updateCalculations();
});
countInput.addEventListener('input', () => {
  countModified = true;
  updateCalculations();
});

/**
 * Generates the print content.
 * Both modes paginate filled weight entries (up to 80 per page, arranged in vertical columns of 15 entries).
 * In Black & White mode, pages are given the class "print-page".
 * In Color mode, pages are given the class "print-page colorful" so that your provided color CSS theme applies.
 * In Color mode, we also set document.title (temporarily) to include the Tank name.
 */
function generatePrintContent(colorful = false) {
  const printArea = document.getElementById('print-area');
  printArea.innerHTML = '';

  // Gather filled weight entries (only those with weight > 0)
  const filledWeights = [];
  const rows = weightsContainer.querySelectorAll('.weight-row');
  rows.forEach((row, idx) => {
    const weight = parseFloat(row.querySelector('.weight-input').value);
    if (!isNaN(weight) && weight > 0) {
      const trayType = row.querySelector('.tray-type').selectedOptions[0].text;
      filledWeights.push({ index: idx + 1, weight, trayType });
    }
  });
  
  // Header info and totals
  const title = "Ksheera Rama Aqua Harvest Report";
  const tankName = tankNameInput.value || "N/A";
  const harvestCount = countInput.value || "0";
  const totals = {
    totalWeight: totalWeightResult.value,
    netWeight: netWeightResult.value,
    finalWeight: finalWeightResult.value,
    totalNumber: numberResult.value
  };

  // If no filled weights, create a simple page with header and totals.
  if (filledWeights.length === 0) {
    const page = document.createElement('div');
    page.className = colorful ? 'print-page colorful' : 'print-page';
    const header = document.createElement('div');
    header.className = 'print-header';
    header.innerHTML = `
      <h1>${title}</h1>
      <div class="sub-info">Tank Name: <strong>${tankName}</strong> &nbsp;&nbsp;|&nbsp;&nbsp; Harvest Count: ${harvestCount}</div>
    `;
    page.appendChild(header);
    const totalsBox = document.createElement('div');
    totalsBox.className = 'totals-box';
    totalsBox.innerHTML = `
      <div>Total Weight: ${totals.totalWeight} kg</div>
      <div>Net Weight: ${totals.netWeight} kg</div>
      <div>Final Weight: ${totals.finalWeight} kg</div>
      <div>Total Number: ${totals.totalNumber}</div>
    `;
    page.appendChild(totalsBox);
    printArea.appendChild(page);
    page.style.pageBreakAfter = "auto";
    return;
  }
  
  // Pagination: allow up to 80 entries per page.
  const entriesPerPage = 80;
  const totalPages = Math.ceil(filledWeights.length / entriesPerPage);

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const chunk = filledWeights.slice(pageIndex * entriesPerPage, (pageIndex + 1) * entriesPerPage);
    if (chunk.length === 0) continue; // Only create a page if there's content.
    
    const page = document.createElement('div');
    page.className = colorful ? 'print-page colorful' : 'print-page';
    
    // Header
    const header = document.createElement('div');
    header.className = 'print-header';
    header.innerHTML = `
      <h1>${title}</h1>
      <div class="sub-info">Tank Name: <strong>${tankName}</strong> &nbsp;&nbsp;|&nbsp;&nbsp; Harvest Count: ${harvestCount}</div>
    `;
    page.appendChild(header);
    
    // Create vertical columns (15 entries per column)
    const entriesPerColumn = 15;
    const numColumns = Math.ceil(chunk.length / entriesPerColumn);
    const gridContainer = document.createElement('div');
    gridContainer.className = 'weights-grid';
    
    for (let col = 0; col < numColumns; col++) {
      const column = document.createElement('div');
      column.className = 'weights-column';
      for (let row = 0; row < entriesPerColumn; row++) {
        const index = col * entriesPerColumn + row;
        if (index >= chunk.length) break;
        const entry = chunk[index];
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.textContent = `${entry.index}. ${entry.weight} kg (${entry.trayType})`;
        column.appendChild(cell);
      }
      gridContainer.appendChild(column);
    }
    page.appendChild(gridContainer);
    
    // On the final page, add the totals box.
    if (pageIndex === totalPages - 1) {
      const divider = document.createElement('div');
      divider.className = 'divider';
      page.appendChild(divider);
      
      const totalsBox = document.createElement('div');
      totalsBox.className = 'totals-box';
      totalsBox.innerHTML = `
        <div>Total Weight: ${totals.totalWeight} kg</div>
        <div>Net Weight: ${totals.netWeight} kg</div>
        <div>Final Weight: ${totals.finalWeight} kg</div>
        <div>Total Number: ${totals.totalNumber}</div>
      `;
      page.appendChild(totalsBox);
    }
    
    printArea.appendChild(page);
  }
  
  // Remove forced page break on the last print page.
  if (printArea.lastChild) {
    printArea.lastChild.style.pageBreakAfter = "auto";
  }
}

// --- PRINT BUTTON / SAVE AS PDF ---
printBtn.addEventListener('click', () => {
  printOptionsModal.style.display = 'flex';
});
closePrintModalBtn.addEventListener('click', () => {
  printOptionsModal.style.display = 'none';
});

// Print in Black & White mode (unchanged).
printBWBtn.addEventListener('click', () => {
  printOptionsModal.style.display = 'none';
  generatePrintContent(false);
  setTimeout(() => {
    window.print();
  }, 300);
});

// Print in Color mode: update document title to include Tank name, then generate content.
printColorBtn.addEventListener('click', () => {
  printOptionsModal.style.display = 'none';
  const originalTitle = document.title;
  const tankName = tankNameInput.value || "Untitled";
  document.title = `${tankName} - Aquaculture Harvest Report`;
  generatePrintContent(true);
  setTimeout(() => {
    window.print();
    // Restore original title after printing.
    document.title = originalTitle;
  }, 300);
});

// --- WHATSAPP SHARE & COPY TEXT FUNCTIONALITY ---
// Change fish emojis (🐟) to prawn emojis (🦐)
whatsappBtn.addEventListener('click', () => {
  const tankName = tankNameInput.value || 'N/A';
  const harvestCount = countInput.value || '0';
  const totalWeight = totalWeightResult.value;
  const netWeight = netWeightResult.value;
  const finalWeight = finalWeightResult.value;
  const totalNumber = numberResult.value;
  let report = "🦐 *Aquaculture Harvest Report* 🦐\n";
  report += `🏷️ Tank Name: ${tankName}\n`;
  report += `🔢 Harvest Count: ${harvestCount}\n`;
  report += `⚖️ Total Weight: ${totalWeight} kg\n`;
  report += `📏 Net Weight: ${netWeight} kg\n`;
  report += `📊 Final Weight: ${finalWeight} kg\n`;
  report += `🔢 Total Number: ${totalNumber}\n\n`;
  report += "📋 *Batch Details:*\n";
  const weightRows = weightsContainer.querySelectorAll('.weight-row');
  weightRows.forEach((row, index) => {
    const weight = parseFloat(row.querySelector('.weight-input').value);
    if (!isNaN(weight) && weight > 0) {
      const trayType = row.querySelector('.tray-type').selectedOptions[0].text;
      report += `${index + 1}. ${weight} kg (${trayType})\n`;
    }
  });
  modalContent.textContent = report;
  whatsappModal.style.display = 'flex';
});
closeModalBtn.addEventListener('click', () => {
  whatsappModal.style.display = 'none';
});
sendWhatsappBtn.addEventListener('click', () => {
  const report = modalContent.textContent;
  const whatsappUrl = "https://wa.me/?text=" + encodeURIComponent(report);
  window.open(whatsappUrl, '_blank');
});
copyTextBtn.addEventListener('click', () => {
  const report = modalContent.textContent;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(report).then(() => {
      alert('Report text copied to clipboard!');
    }).catch(err => {
      alert('Failed to copy text.');
    });
  } else {
    const textArea = document.createElement("textarea");
    textArea.value = report;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        alert('Report text copied to clipboard!');
      } else {
        alert('Failed to copy text.');
      }
    } catch (err) {
      alert('Failed to copy text.');
    }
    document.body.removeChild(textArea);
  }
});

// Initialize the calculator.
initializeWeights();
updateCalculations();
