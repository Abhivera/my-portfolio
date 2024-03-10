import { useEffect } from "react";
import { useTheme } from "next-themes";
import Head from "next/head";
import Image from "next/image";

import Contact from "@/components/Contact";
import Experience from "@/components/Experience";
import CategoryCard from "@/components/CategoryCard";
import { BsArrowUpRight } from "react-icons/bs";

import Avatar_Black from "@/public/Avatar-black.svg";
import Avatar_White from "@/public/Avatar-white.svg";
import BooBlack from "@/public/boo-black.svg";
import BooWhite from "@/public/boo-white.svg";
import Link from "next/link";

export default function Home() {
  const { systemTheme, theme, setTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    console.clear();
    console.log.apply(console, [
      "%c Designed and Developed by Pranjal Shikhar %c %c🚀 %c\n",
      "color: #fff; background: #8000ff; padding:5px 0;",
      "color: #fff; background: #242424; padding:5px 0 5px 5px;",
      "background: #242424; padding:5px 0",
      "background: #242424; padding:5px 5px 5px 0",
    ]);
    console.log.apply(console, [
      "%c Thanks for stopping by, I’m currently looking to a new team of creative designers and developers.\n",
      "color: #fff; background: #8000ff; padding:5px 0;",
    ]);
  }, []);

  return (
    <>
      <Head>
        <title>Abhijit✦Verma</title>
        <link rel="icon" href="/Avatar-white.svg" />
      </Head>
      <div className="lg:min-h-screen px-10 sm:px-20 md:px-32 lg:mb-12 lg:px-60 mx-auto max-w-[75rem]">
        <div className="mt-28 mx-auto">
          <Experience />
        </div>
        {/* <div className="mt-28 mx-auto ">
           <p className="text-gray-400 select-none font-semibold mb-1 dark:text-white/30 ">
          Contact
        </p>

        <p className="">
          I am readily available for connection on my social media platforms.{" "}
          <br />
          You can contact me on the{" "}
          <span className="text-red-700 font-bold">GMail</span>{" "}
          <a
            onClick={() =>
              navigator.clipboard.writeText("shikhar.pranjal3@gmail.com")
            }
            className=" underline underline-offset-4 decoration-2 decoration-purple-400 group select-all font-semibold dark:hover:text-purple-400 hover:text-purple-700 cursor-pointer select "
            href="mailto:shikhar.pranjal3@gmail.com"
          >
            {" "}
            abhijitakadeveloper@gmail.com
          </a>{" "}
          or <span className="text-blue-700 font-bold">LinkedIn</span>{" "}
          <a
            href="http://linkedin.com/in/"
            className=" underline underline-offset-4 decoration-2 decoration-purple-400 font-semibold dark:hover:text-purple-400 hover:text-purple-700 cursor-pointer select"
            rel="noopener noreferrer"
            target="blank"
          >
            Abhijit Verma
          </a>{" "}
          or you can DM me on{" "}
          <span className="text-green-500 font-bold">Whatsapp</span>{" "}
          <a
            href="https://web.whatsapp.com/"
            target="blank"
            rel="noopener noreferrer"
            className=" font-semibold underline underline-offset-4 decoration-2 decoration-purple-400 dark:hover:text-purple-400 hover:text-purple-700 cursor-pointer select "
          >
            8707795477
          </a>{" "}
        </p>
        </div> */}
      </div>
    </>
  );
}
