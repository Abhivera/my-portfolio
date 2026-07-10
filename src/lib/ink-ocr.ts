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
      const { createWorker } = await import("tesseract.js");
      return createWorker("eng", 1, {
        logger: (message) => {
          if (
            message.status === "recognizing text" ||
            message.status === "loading language traineddata"
          ) {
            progressCallback?.({
              status: message.status,
              progress: message.progress,
            });
          }
        },
      });
    })().catch((error) => {
      workerPromise = null;
      throw error;
    });
  }
  return workerPromise;
}

function cleanOcrText(raw: string): string {
  return raw
    .replace(/[|]/g, "I")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Try several page-segmentation modes — handwriting is unreliable with a single PSM. */
export async function recognizeHandwriting(
  imageDataUrl: string,
  onProgress?: (progress: OcrProgress) => void,
): Promise<string> {
  progressCallback = onProgress;
  try {
    const { PSM } = await import("tesseract.js");
    const worker = await getOcrWorker();

    const modes = [
      PSM.AUTO,
      PSM.SINGLE_BLOCK,
      PSM.SPARSE_TEXT,
      PSM.SINGLE_LINE,
      PSM.SINGLE_WORD,
    ] as const;

    let best = "";

    for (let i = 0; i < modes.length; i++) {
      const mode = modes[i];
      await worker.setParameters({
        tessedit_pageseg_mode: mode,
        preserve_interword_spaces: "1",
        user_defined_dpi: "300",
      });

      const result = await worker.recognize(imageDataUrl);
      const text = cleanOcrText(result.data.text);
      if (text.length > best.length) {
        best = text;
      }
      // Good enough — stop early.
      if (best.length >= 2) break;

      onProgress?.({
        status: "recognizing text",
        progress: (i + 1) / modes.length,
      });
    }

    return best;
  } finally {
    progressCallback = undefined;
  }
}

export async function terminateOcrWorker(): Promise<void> {
  if (!workerPromise) return;
  try {
    const worker = await workerPromise;
    await worker.terminate();
  } finally {
    workerPromise = null;
  }
}
