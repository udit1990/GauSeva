import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Shield, HandHeart, Leaf, GraduationCap, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import karmaBinding from "@/assets/karma-binding.avif";
import pillarProtect from "@/assets/pillar-protect.avif";
import pillarJustice from "@/assets/pillar-justice.avif";
import pillarFeed from "@/assets/pillar-feed.avif";

const pillars = [
  {
    image: pillarProtect,
    title: "Protecting the Weak",
    desc: "Protecting the weak and helpless, be it a human, an animal or even the environment.",
  },
  {
    image: pillarJustice,
    title: "Stand Against Injustice",
    desc: "Raising your voice and standing up against the wrongs, injustice, and exploitation of any animal, human or environment.",
  },
  {
    image: pillarFeed,
    title: "No Empty Stomachs",
    desc: "No living being in the range of your naked eye should go to sleep on an empty stomach. This includes providing medicines for those who are ill.",
  },
];

const initiatives = [
  {
    icon: UtensilsCrossed,
    title: "Feed the Voiceless",
    desc: "We provide daily nourishment to over 70,000 voiceless beings across India — dogs, cats, monkeys, camels, horses, cows, birds and more.",
  },
  {
    icon: Heart,
    title: "Women Empowerment",
    desc: "Health awareness, employment creation, support for the visually impaired, holistic Yog sessions, and financial literacy programs empowering countless women.",
  },
  {
    icon: GraduationCap,
    title: "Anand Vidyalaya",
    desc: "Free primary education, mid-day meals, and essential care to underprivileged children — shaping responsible, confident citizens.",
  },
  {
    icon: HandHeart,
    title: "Food Distribution",
    desc: "Daily Food Distribution Camps in 20+ cities. Over 450 special camps for construction workers, slum dwellers, and children across 40+ cities globally.",
  },
  {
    icon: Leaf,
    title: "Environmental Sustainability",
    desc: "Empowering 10,000+ individuals through eco-friendly products, organic farming, clean energy, and training local communities.",
  },
  {
    icon: Shield,
    title: "Health & Wellness",
    desc: "Cultivating sensitivity and responsibility towards health, environment and fellow beings. Disseminating the gyan of vedas and ancient sciences, free of cost.",
  },
];

const ServiceCharity = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-sm"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Service & Charity</h1>
      </header>

      <div className="space-y-6">
        {/* Hero Quote */}
        <div className="px-5">
          <div className="rounded-xl overflow-hidden relative">
            <img src={karmaBinding} alt="Service & Charity" className="w-full h-48 object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-[10px] uppercase tracking-widest text-primary-foreground/60 font-medium">Karma</p>
              <h2 className="text-base font-bold text-primary-foreground leading-snug mt-0.5">
                The Ancient Art of Selfless Giving
              </h2>
              <p className="text-xs text-primary-foreground/70 mt-1">
                Every act of charity is a seed of positive karma
              </p>
            </div>
          </div>
        </div>

        {/* The Real Binding Thread */}
        <div className="px-5">
          <h2 className="text-base font-bold text-foreground mb-2">The Real Binding Thread</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The real binding thread is what has been expounded in the Vedic texts as 'Dharma'. The Rishis were great scientists — they gave us ready markers to measure our evolution.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">
            What you sow, so shall you reap. The answer is not to collect more, but to give more. For in giving, you break the cycle of pain and accumulate grace.
          </p>
        </div>

        {/* Three Pillars */}
        <div className="px-5">
          <h2 className="text-base font-bold text-foreground mb-1">The Three Pillars of Dharma</h2>
          <p className="text-xs text-muted-foreground mb-4">Three fundamental principles that constitute Dharma</p>
          <div className="space-y-3">
            {pillars.map((pillar, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-card shadow-sm">
                <img src={pillar.image} alt={pillar.title} className="w-full h-36 object-cover" loading="lazy" />
                <div className="p-3">
                  <h3 className="text-sm font-bold text-foreground">{pillar.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{pillar.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quote */}
        <div className="px-5">
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-center">
            <p className="text-sm italic text-foreground leading-relaxed">
              "It is the dharma of every human being to protect those weaker than them."
            </p>
            <p className="text-xs font-semibold text-primary mt-2">— Ashwini Guru Ji</p>
          </div>
        </div>

        {/* Initiatives */}
        <div className="px-5">
          <h2 className="text-base font-bold text-foreground mb-1">Our Initiatives</h2>
          <p className="text-xs text-muted-foreground mb-4">Find Your Cause. Ignite Your Karma.</p>
          <div className="space-y-3">
            {initiatives.map((item, i) => (
              <div key={i} className="flex gap-3 rounded-xl bg-card p-3 shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="px-5 space-y-3">
          <Button
            onClick={() => navigate("/")}
            className="w-full h-12 rounded-lg text-base font-semibold shadow-lg"
            size="lg"
          >
            Start Your Seva
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open("https://www.instagram.com/dhyanfoundation/", "_blank")}
            className="w-full h-12 rounded-lg text-base font-semibold"
            size="lg"
          >
            Spread the Word
          </Button>
        </div>

        {/* Contact */}
        <div className="px-5 pb-4">
          <div className="rounded-xl bg-card p-4 shadow-sm space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Get in Touch</h3>
            <p className="text-xs text-muted-foreground">Animal Helpline: <span className="text-foreground font-medium">+91-9999099423</span></p>
            <p className="text-xs text-muted-foreground">Email: <span className="text-foreground font-medium">info@dhyanfoundation.com</span></p>
            <p className="text-xs text-muted-foreground">Address: A-80, South Extension Part II, New Delhi-49</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCharity;
