import Navbar from "@/components/landing/navbar";
import Hero from "@/components/landing/hero";
import Marquee from "@/components/landing/marquee";
import HowItWorks from "@/components/landing/how-it-works";
import Features from "@/components/landing/features";
import Estimator from "@/components/landing/estimator";
import Pricing from "@/components/landing/pricing";
import Testimonials from "@/components/landing/testimonials";
import Faq from "@/components/landing/faq";
import Footer from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <main className="relative">
      <Navbar />
      <Hero />
      <Marquee />
      <HowItWorks />
      <Features />
      <Estimator />
      <Pricing />
      <Testimonials />
      <Faq />
      <Footer />
    </main>
  );
}
