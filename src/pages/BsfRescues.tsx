import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Award, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef, useState, useEffect, useCallback } from "react";

import bsfRescue1 from "@/assets/bsf-rescue-1.avif";
import bsfRescue2 from "@/assets/bsf-rescue-2.avif";
import bsfRescue3 from "@/assets/bsf-rescue-3.avif";
import bsfCert1 from "@/assets/bsf-certificate-1.png";
import bsfCert2 from "@/assets/bsf-certificate-2.png";
import bsfCert3 from "@/assets/bsf-certificate-3.png";
import bsfMarquee6 from "@/assets/bsf-marquee-6.avif";
import bsfMarquee7 from "@/assets/bsf-marquee-7.avif";
import bsfMarquee8 from "@/assets/bsf-marquee-8.avif";
import bsfMarquee9 from "@/assets/bsf-marquee-9.avif";
import bsfMarquee10 from "@/assets/bsf-marquee-10.avif";
import bsfMarquee11 from "@/assets/bsf-marquee-11.avif";
import bsfMarquee12 from "@/assets/bsf-marquee-12.avif";

const carouselImages = [
  { src: bsfMarquee6, alt: "BSF cattle rescue with public carrier" },
  { src: bsfMarquee7, alt: "BSF seizure operation at border outpost" },
  { src: bsfMarquee8, alt: "BSF jawans with rescued cattle" },
  { src: bsfMarquee9, alt: "Rescued animals at border" },
  { src: bsfMarquee10, alt: "BSF rescue mission" },
  { src: bsfMarquee11, alt: "Cattle packed in truck for smuggling" },
  { src: bsfMarquee12, alt: "Rescued cattle in transport vehicle" },
];

const testimonials = [
  {
    quote: "Dhyan Foundation is the only organization standing shoulder to shoulder with BSF at the Indo Bangladesh border and helping us stop the illegal trafficking and smuggling of animals.",
    author: "DIG Guleria, BSF",
  },
  {
    quote: "BSF requests all citizens and other philanthropic bodies to assist Dhyan Foundation wholeheartedly.",
    author: "BSF Official Communication",
  },
  {
    quote: "Cattle smuggling has come down to nearly zero and attacks on jawans have come down drastically.",
    author: "BSF Report",
  },
];


const stats = [
  { value: "50,000+", label: "Animals Saved" },
  { value: "9", label: "Gaushalas" },
  { value: "7", label: "States Covered" },
  { value: "Near Zero", label: "Smuggling Rate" },
];

const CarouselWithDots = ({ images }: { images: { src: string; alt: string }[] }) => {
  const [api, setApi] = useState<any>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    onSelect();
    return () => { api.off("select", onSelect); };
  }, [api]);

  return (
    <div>
      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: true }}
        plugins={[Autoplay({ delay: 3000, stopOnInteraction: false })]}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          {images.map((img, i) => (
            <CarouselItem key={i} className="pl-2 basis-4/5">
              <img
                src={img.src}
                alt={img.alt}
                className="h-44 w-full rounded-lg object-cover"
                loading="lazy"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="flex justify-center gap-1.5 mt-3">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => api?.scrollTo(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === current ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"
            )}
          />
        ))}
      </div>
    </div>
  );
};

const BsfRescues = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-sm"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">BSF Rescues</h1>
      </header>

      <div className="space-y-6">
        {/* Hero */}
        <div className="px-5">
          <div className="rounded-xl overflow-hidden relative">
            <img src={bsfRescue1} alt="BSF Rescue Operations" className="w-full h-52 object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-[10px] uppercase tracking-widest text-primary-foreground/60 font-medium">BSF × Dhyan Foundation</p>
              <h2 className="text-lg font-bold text-primary-foreground leading-snug mt-0.5">Standing Shoulder to Shoulder</h2>
              <p className="text-xs text-primary-foreground/70 mt-1">With the Border Security Force of India</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-5">
          <div className="grid grid-cols-2 gap-2">
            {stats.map((s, i) => (
              <div key={i} className="rounded-lg bg-primary/5 border border-primary/10 p-3 text-center">
                <p className="text-lg font-bold text-primary">{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="px-5">
          <h2 className="text-base font-bold text-foreground mb-2">The Historic Cause</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Dhyan Foundation has greatly assisted the Border Security Force at the Indo-Bangladesh border by rehabilitating rescued cattle seized by the troops, at their own cost. Over 50,000 animals have been saved from meeting a bitter end at the hands of cattle mafia.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">
            The smuggling has been brought from lakhs everyday to near zero. The battle however continues to nurse and nourish these 30,000+ animals and to take in thousands more that keep pouring in from borders of Assam, Tripura, Meghalaya & Bihar.
          </p>
        </div>

        {/* Gallery */}
        <div className="px-5">
          <h2 className="text-base font-bold text-foreground mb-3">From the Ground</h2>
          <div className="grid grid-cols-2 gap-2">
            <img src={bsfRescue2} alt="BSF rescue operation" className="rounded-lg w-full h-32 object-cover" loading="lazy" />
            <img src={bsfRescue3} alt="Rescued cattle" className="rounded-lg w-full h-32 object-cover" loading="lazy" />
          </div>
        </div>


        {/* BSF Testimonials */}
        <div className="px-5">
          <h2 className="text-base font-bold text-foreground mb-3">BSF Testimonials</h2>
          <div className="space-y-3">
            {testimonials.map((t, i) => (
              <div key={i} className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm italic text-foreground leading-relaxed">"{t.quote}"</p>
                    <p className="text-xs font-semibold text-primary mt-2">— {t.author}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certificates */}
        <div className="px-5">
          <h2 className="text-base font-bold text-foreground mb-1">Certificates & Awards</h2>
          <p className="text-xs text-muted-foreground mb-3">Monumental certificates awarded by the Border Security Force of India</p>
          <div className="space-y-3">
            {[bsfCert1, bsfCert2, bsfCert3].map((cert, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-card shadow-sm">
                <img src={cert} alt={`BSF Certificate ${i + 1}`} className="w-full object-contain max-h-72" loading="lazy" />
              </div>
            ))}
          </div>
        </div>

        {/* Crisis Info */}
        <div className="px-5">
          <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-foreground">The Crisis Continues</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Participation would mean standing for the BSF & the voiceless animals & against the cattle mafia whose crores worth illegal business is funding terrorist movement, fake currency trade & arms smuggling.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-semibold text-foreground">Cost of upkeep:</span> ₹2,500/cow/month
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="px-5 space-y-3">
          <Button onClick={() => navigate("/")} className="w-full h-12 rounded-lg text-base font-semibold shadow-lg" size="lg">
            Start Your Seva
          </Button>
          <Button variant="outline" onClick={() => navigate("/gaushalas")} className="w-full h-12 rounded-lg text-base font-semibold" size="lg">
            Explore Gaushalas
          </Button>
        </div>

        {/* Contact */}
        <div className="px-5 pb-4">
          <div className="rounded-xl bg-card p-4 shadow-sm space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Get in Touch</h3>
            <p className="text-xs text-muted-foreground">Animal Helpline: <span className="text-foreground font-medium">+91-9999099423</span></p>
            <p className="text-xs text-muted-foreground">Email: <span className="text-foreground font-medium">info@dhyanfoundation.com</span></p>
          </div>
        </div>

        {/* Image Carousel */}
        <div className="px-5">
          <h2 className="text-base font-bold text-foreground mb-3">From the Frontlines</h2>
          <CarouselWithDots images={carouselImages} />
        </div>
      </div>
    </div>
  );
};

export default BsfRescues;
