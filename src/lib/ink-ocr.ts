type OcrProgress = {
  status: string;
  progress: number;
};

type OcrWorker = Awaited<ReturnType<typeof import("tesseract.js").createWorker>>;

let workerPromise: Promise<OcrWorker> | null = null;
let progressCallback: ((progress: OcrProgress) => void) | undefined;

async function getOcrWorker(): Promise<OcrWorker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker, PSM } = await import("tesseract.js");
      const worker = await createWorker("eng", undefined, {
        logger: (message) => {
          if (message.status === "recognizing text") {
            progressCallback?.({ status: message.status, progress: message.progress });
          }
        },
      });
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      });
      return worker;
    })();
  }
  return workerPromise;
}

export async function recognizeHandwriting(
  imageDataUrl: string,
  onProgress?: (progress: OcrProgress) => void,
): Promise<string> {
  progressCallback = onProgress;
  try {
    const worker = await getOcrWorker();
    const result = await worker.recognize(imageDataUrl);
    return result.data.text.replace(/\s+/g, " ").trim();
  } finally {
    progressCallback = undefined;
  }
}

export async function terminateOcrWorker(): Promise<void> {
  if (!workerPromise) return;
  const worker = await workerPromise;
  await worker.terminate();
  workerPromise = null;
}
