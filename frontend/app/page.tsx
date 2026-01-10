import Navbar from '@/components/landing/Navbar';
import FloatingHero from '@/components/landing/FloatingHero';
import FeaturesPath from '@/components/landing/FeaturesPath';
import Pricing from '@/components/landing/Pricing';
import FAQ from '@/components/landing/FAQ';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    
    <main className="min-h-screen">
      <Navbar />
      <FloatingHero />
      <FeaturesPath />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  );
}
