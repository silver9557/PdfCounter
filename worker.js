// Укажи путь к worker для pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

self.importScripts('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.min.js');

self.onmessage = async (e) => {
    const { pdfData } = e.data;
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    const totalPages = pdf.numPages;

    let bwCount = 0;
    let colorCount = 0;

    for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 });

        const canvas = new OffscreenCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');

        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        if (isGrayscale(imageData)) {
            bwCount++;
        } else {
            colorCount++;
        }

        const progress = (i / totalPages) * 100;
        self.postMessage({ progress, bwCount, colorCount, totalPages, done: false });

        page.cleanup();
        if (i % 50 === 0) await new Promise(resolve => setTimeout(resolve, 10));
    }

    self.postMessage({ progress: 100, bwCount, colorCount, totalPages, done: true });
};

function isGrayscale(imageData) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (Math.abs(r - g) > 10 || Math.abs(g - b) > 10 || Math.abs(b - r) > 10) {
            return false;
        }
    }
    return true;
}
​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​
