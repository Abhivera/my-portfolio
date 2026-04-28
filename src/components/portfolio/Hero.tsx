import { FileText, Eye, Download } from "lucide-react";
import resumeUrl from "../../../media/Abhijit_Verma_Resume.docx?url";
import resumePdfUrl from "../../../media/Abhijit_Verma_Resume.pdf?url";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex items-center pt-32 pb-20 sm:pt-36 sm:pb-28 overflow-hidden grain"
    >
      {/* Decorative blobs */}
      <div
        className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--gradient-sunset)" }}
      />
      <div
        className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--gradient-ai)" }}
      />

      <div className="relative max-w-6xl mx-auto px-6 lg:px-8 w-full">
        <div className="flex items-center gap-3 mb-8">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[color:var(--accent)] opacity-60 animate-ping" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[color:var(--accent)]" />
          </span>
          <span className="text-sm font-mono text-muted-foreground tracking-wide uppercase">
            Available for opportunities
          </span>
        </div>

        <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl leading-[0.95] tracking-tight">
          Building <em className="text-gradient-sunset not-italic">scalable</em>
          <br />
          backends &amp;
          <br />
          <span
            className="inline-block px-3 py-1 rounded-2xl"
            style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
          >
            GenAI
          </span>{" "}
          systems.
        </h1>

        <p className="mt-10 max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
          Hi, I'm <strong className="text-foreground font-semibold">Abhijit Verma</strong> a
          software engineer with 3+ years building event-driven microservices, high-performance
          APIs, and production-grade RAG &amp; AI agent systems.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href="#projects"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium shadow-warm hover:shadow-glow hover:-translate-y-0.5 transition-all"
          >
            View My Projects
            <span aria-hidden>↓</span>
          </a>
          
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-foreground/15 hover:border-foreground/40 font-medium transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                Resume
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-w-[95vw] h-[85vh] flex flex-col bg-background/90 backdrop-blur-md border-border/40 shadow-warm p-6 gap-4 rounded-xl">
              <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
                <div className="flex flex-col text-left">
                  <DialogTitle className="font-display text-2xl text-gradient-sunset">
                    Resume Preview
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground text-sm mt-1">
                    Preview or download my technical resume
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-3 mr-10">
                  <a
                    href={resumeUrl}
                    download="Abhijit_Verma_Resume.docx"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-xs sm:text-sm font-medium hover:bg-secondary/80 transition-colors shadow-sm"
                  >
                    <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                    DOCX
                  </a>
                  <a
                    href={resumePdfUrl}
                    download="Abhijit_Verma_Resume.pdf"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:shadow-glow transition-all shadow-warm"
                  >
                    <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                    PDF
                  </a>
                </div>
              </DialogHeader>
              <div className="flex-1 relative rounded-lg overflow-hidden border bg-black/5">
                <iframe
                  src={`${resumePdfUrl}#toolbar=0`}
                  title="Resume Preview"
                  className="w-full h-full border-0 rounded-lg"
                />
              </div>
            </DialogContent>
          </Dialog>
          <a
            href="https://www.linkedin.com/in/abhijit-verma-532996165/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-foreground/15 hover:border-foreground/40 font-medium transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
            </svg>
            LinkedIn
          </a>
          <a
            href="https://github.com/Abhivera"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-foreground/15 hover:border-foreground/40 font-medium transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.3-3.2-.1-.4-.6-1.6.1-3.3 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.3.8.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
