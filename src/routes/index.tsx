import { createFileRoute } from "@tanstack/react-router";
import { getServerStatus } from "@/lib/server-utils";
import { Nav } from "@/components/portfolio/Nav";
import { Hero } from "@/components/portfolio/Hero";
import { Marquee } from "@/components/portfolio/Marquee";
import { About } from "@/components/portfolio/About";
import { Experience } from "@/components/portfolio/Experience";
import { Skills } from "@/components/portfolio/Skills";
import { Projects } from "@/components/portfolio/Projects";
import { Education } from "@/components/portfolio/Education";
import { Contact } from "@/components/portfolio/Contact";
import { BlogSection } from "@/components/portfolio/BlogSection";

export const Route = createFileRoute("/")({
  loader: async () => await getServerStatus(),
  component: Index,
  head: () => ({
    meta: [
      { title: "Abhijit Verma | Software Engineer" },
      {
        name: "description",
        content:
          "Abhijit Verma - Software Engineer with 3+ years building scalable event-driven backends, microservices, and production-grade Generative AI systems (RAG, AI agents).",
      },
      { name: "keywords", content: "Abhijit Verma, Software Engineer, Backend Engineer, Generative AI, RAG, AI Agents, Kafka, Microservices" },
      { property: "og:title", content: "Abhijit Verma | Software Engineer" },
      {
        property: "og:description",
        content:
          "Portfolio of Abhijit Verma, Software Engineer specializing in Backend & Generative AI.",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Abhijit Verma | Software Engineer" },
      { name: "twitter:description", content: "Portfolio of Abhijit Verma, Software Engineer." },
    ],
  }),
});

function Index() {
  return (
    <main className="min-h-screen">
      <Nav />
      <Hero />
      <Marquee />
      <About />
      <Experience />
      <Projects />
      <BlogSection />
      <Skills />
      <Education />
      <Contact />
    </main>
  );
}
