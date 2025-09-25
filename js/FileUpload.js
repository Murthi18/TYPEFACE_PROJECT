// js/fileUpload.js
// Needs Tesseract.js and pdf.js if you want actual parsing
// For now: adds a dummy expense when a file is uploaded

const fileInput = document.getElementById("fileInput");
const fileStatus = document.getElementById("fileStatus");

if (fileInput) {
  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    fileStatus.textContent = `Uploaded: ${file.name}`;

    // Dummy OCR/parse simulation
    if (file.type.startsWith("image/")) {
      // Later: use Tesseract.js here
      console.log("Image uploaded. Would run OCR here.");
    } else if (file.type === "application/pdf") {
      // Later: use pdf.js here
      console.log("PDF uploaded. Would parse PDF here.");
    }

    // For now: just insert a dummy expense
    transactions.push({
      id: transactions.length + 1,
      type: "expense",
      amount: 500,
      category: "Receipt Import",
      date: new Date().toISOString().split("T")[0],
      description: "Imported from " + file.name
    });

    // Re-render
    renderList();
  });
}
