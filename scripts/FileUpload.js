// ============================================================================
// FileUploader.js — Handles drag & drop / file input uploads.
// ============================================================================

import { $, toast } from './utils.js';

// ----------------- Init uploader -----------------
/**
 * Wire up drag/drop + file input to show fake progress and preview extracted data.
 * 
 * Flow:
 *  1. User drops files or chooses from input.
 *  2. Simulated progress bar updates (fake delays).
 *  3. Demo "parsed transactions" are shown in a modal with Cancel / Confirm buttons.
 *  4. On Confirm → show toast "Imported!".
 */
export function initUploader(){
  const area = $('#uploadArea');  // drop zone element
  if(!area) return;               // exit if uploader not present on page

  const input = $('#fileInput');  // hidden <input type=file>
  const bar   = $('#uploadBar');  // progress bar element

  // Utility: set progress bar safely clamped 0–100
  const setProgress = (n) => {
    const pct = Math.max(0, Math.min(100, n));
    bar.style.width = pct + '%';
  };

  // ----------------- Handle selected files -----------------
  async function handleFiles(files){
    if(!files?.length) return;   // ignore empty selection

    try {
      // Fake staged progress
      setProgress(5);
      await new Promise(r => setTimeout(r, 600));
      setProgress(55);
      await new Promise(r => setTimeout(r, 600));
      setProgress(100);

      // In real version → send FormData to backend with fetch()

      toast('Upload complete. Parsed 3 transactions.');

      // Reset progress bar after 1.2s
      setTimeout(()=> setProgress(0), 1200);

      // Build a demo modal preview with hardcoded rows
      const html = `
        <h3>Extracted Transactions (Preview)</h3>
        <div class="bd">
          <table class="table">
            <thead><tr><th>Date</th><th>Desc</th><th>Category</th><th>Type</th><th>Amount</th></tr></thead>
            <tbody>
              <tr><td>2025-09-12</td><td>POS • BigBazaar</td><td>Groceries</td><td>expense</td><td>₹ 1,245.00</td></tr>
              <tr><td>2025-09-13</td><td>UPI • Auto</td><td>Travel</td><td>expense</td><td>₹ 180.00</td></tr>
              <tr><td>2025-09-13</td><td>Salary</td><td>Salary</td><td>income</td><td>₹ 25,000.00</td></tr>
            </tbody>
          </table>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;padding:10px">
          <button class="btn ghost" id="cancelImport">Cancel</button>
          <button class="btn" id="confirmImport">Add All</button>
        </div>`;

      // Show modal (assumes you have a `modal(html)` helper available globally)
      const { el, back } = modal(html);

      // Cancel closes modal
      el.querySelector('#cancelImport').onclick = () => back.remove();

      // Confirm closes modal + shows success toast
      el.querySelector('#confirmImport').onclick = () => { 
        back.remove(); 
        toast('Imported!');
      };
    } catch (err) {
      console.error("Upload error", err);
      toast("Upload failed — please try again.");
      setProgress(0);
    }
  }

  // ----------------- Wire events -----------------
  // Drag over highlight
  area.addEventListener('dragover', e => {
    e.preventDefault();
    area.style.transform = 'scale(1.01)';
  });

  // Drag leave reset
  area.addEventListener('dragleave', () => {
    area.style.transform = 'scale(1)';
  });

  // Drop files
  area.addEventListener('drop', e => {
    e.preventDefault();
    area.style.transform = 'scale(1)';
    handleFiles(e.dataTransfer.files);
  });

  // File input selection
  input.addEventListener('change', e => {
    handleFiles(e.target.files);
  });
}
