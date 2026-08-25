import { Hero } from "@/components/home/Hero";
import { AboutUs } from "@/components/home/AboutUs";
import { Courts } from "@/components/home/Courts";
import { Pricing } from "@/components/home/Pricing";
import { Events } from "@/components/home/Events";
import { Contact } from "@/components/home/Contact";

export default function Home() {
  return (
    <>
      <Hero />
      <AboutUs />
      <Pricing />
      <Events />
      <Courts />
      <Contact />
    </>
  );
}
