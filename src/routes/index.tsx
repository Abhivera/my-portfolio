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

export const Route = createFileRoute("/")({
  loader: async () => await getServerStatus(),
  component: Index,
  head: () => ({
    meta: [
      { title: "Abhijit Verma " },
      {
        name: "description",
        content:
          "Software Engineer with 3+ years building scalable event-driven backends, microservices, and production-grade Generative AI systems (RAG, AI agents).",
      },
      { property: "og:title", content: "Abhijit Verma : Software Engineer" },
      {
        property: "og:description",
        content:
          "Backend & Generative AI engineer. Kafka, microservices, RAG, AI agents, and the boring-but-critical infra that ships them.",
      },
      { name: "twitter:card", content: "summary_large_image" },
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
      <Skills />
      <Projects />
      <Education />
      <Contact />
    </main>
  );
}
