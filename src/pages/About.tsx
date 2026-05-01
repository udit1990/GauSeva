import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Heart, Shield, Leaf, GraduationCap, Users, Flame, ChevronRight, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReferralLeaderboard from "@/components/ReferralLeaderboard";

import gurujiPortrait from "@/assets/guruji-portrait.avif";
import karmaBinding from "@/assets/karma-binding.avif";
import bsfRescue1 from "@/assets/bsf-rescue-1.avif";

const teachings = [
  "Sanatan Kriya & Ashtang Yog",
  "Science of Dhyan & Meditation",
  "Mantra Chanting & Science of Yagyas",
  "Clairvoyance & Spiritual Healing",
  "Divya Chikitsa Mantras",
  "Art of the Mace (Gada) & Vedic Martial Arts",
  "Ayurved, Tandav & Stotras",
];

const serviceHighlights = [
  { icon: Heart, title: "Animal Welfare", desc: "Taking care of 70,000+ sick, injured, abandoned and rescued animals through 45+ shelters and gaushalas." },
  { icon: Users, title: "Free Food Distribution", desc: "Thousands fed daily through country-wide free food distribution camps." },
  { icon: GraduationCap, title: "Anand Vidyalayas", desc: "Free education to underprivileged children and vocational training for women." },
  { icon: Leaf, title: "Rural Development", desc: "Employment for 10,000+ rural and tribal people through sustainable initiatives." },
  { icon: Shield, title: "BSF Partnership", desc: "ONLY organization working with BSF to rehabilitate gauvansh rescued from smugglers at borders." },
  { icon: Flame, title: "Organic & Eco-friendly", desc: "Promoting organic farming and eco-friendly products from gaumutra and govar." },
];

const gauParivarStats = [
  { value: "70,000+", label: "Animals Cared For" },
  { value: "45+", label: "Shelters & Gaushalas" },
  { value: "9", label: "States Active" },
  { value: "10,000+", label: "Rural Jobs Created" },
  { value: "20+", label: "Cities with Food Camps" },
  { value: "50,000+", label: "Border Rescues" },
];

const About = () => {
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
        <h1 className="text-lg font-bold text-foreground">About Dhyan Foundation</h1>
      </header>

      <div className="space-y-6">
        {/* Hero */}
        <div className="px-5">
          <div className="rounded-xl overflow-hidden relative">
            <img src={gurujiPortrait} alt="Ashwini Guru Ji" className="w-full h-52 object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-[10px] uppercase tracking-widest text-primary-foreground/60 font-medium">Est. by Ashwini Guru Ji</p>
              <h2 className="text-base font-bold text-primary-foreground leading-snug mt-0.5">Dhyan Foundation</h2>
              <p className="text-xs text-primary-foreground/70 mt-1">A vedic way of life based on principles of balance and prakriti</p>
            </div>
          </div>
        </div>

        {/* Gau Parivar Stats */}
        <div className="px-5">
          <div className="flex items-center gap-2 mb-3">
            <PawPrint className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Meet Our Gau Parivar</h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {gauParivarStats.map((s, i) => (
              <div key={i} className="rounded-lg bg-primary/5 border border-primary/10 p-3 text-center">
                <p className="text-base font-bold text-primary">{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* BSF Rescues Card */}
        <div className="px-5">
          <button
            onClick={() => navigate("/bsf-rescues")}
            className="w-full rounded-xl overflow-hidden relative active:scale-[0.98] transition-transform"
          >
            <img src={bsfRescue1} alt="BSF Rescue Operations" className="w-full h-40 object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-widest text-primary-foreground/60 font-medium">BSF × Dhyan Foundation</p>
                <h3 className="text-sm font-bold text-primary-foreground mt-0.5">50,000+ Animals Saved at Borders</h3>
                <p className="text-xs text-primary-foreground/70 mt-0.5">Standing shoulder to shoulder with BSF</p>
              </div>
              <ChevronRight className="h-5 w-5 text-primary-foreground/70 shrink-0" />
            </div>
          </button>
        </div>

        {/* Service & Charity Card */}
        <div className="px-5">
          <button
            onClick={() => navigate("/service-charity")}
            className="w-full rounded-xl overflow-hidden relative active:scale-[0.98] transition-transform"
          >
            <img src={karmaBinding} alt="Service & Charity" className="w-full h-40 object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-widest text-primary-foreground/60 font-medium">Karma</p>
                <h3 className="text-sm font-bold text-primary-foreground mt-0.5">Service & Charity Initiatives</h3>
                <p className="text-xs text-primary-foreground/70 mt-0.5">The ancient art of selfless giving</p>
              </div>
              <ChevronRight className="h-5 w-5 text-primary-foreground/70 shrink-0" />
            </div>
          </button>
        </div>

        {/* Referral Leaderboard (feature-flagged) */}
        <div className="px-5">
          <ReferralLeaderboard />
        </div>
        <div className="px-5">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Teachings</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            Dhyan Foundation teaches advanced yogic techniques, mantras and meditation — conducted free of cost, in line with the ancient Guru Shishya Parampara.
          </p>
          <div className="grid grid-cols-1 gap-2">
            {teachings.map((item, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-card p-3 shadow-sm">
                <span className="text-primary text-xs">•</span>
                <p className="text-xs font-medium text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Service Highlights */}
        <div className="px-5">
          <h2 className="text-base font-bold text-foreground mb-3">Our Service Initiatives</h2>
          <div className="space-y-3">
            {serviceHighlights.map((item, i) => (
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

        {/* Vedic Disclaimer */}
        <div className="px-5">
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-center">
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              Dhyan Foundation does not promise any miracle cures, but advocates a vedic way of life based on principles of balance and prakriti (in tune with nature).
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="px-5 space-y-3">
          <Button onClick={() => navigate("/")} className="w-full h-12 rounded-lg text-base font-semibold shadow-lg" size="lg">
            Start Your Seva
          </Button>
          <Button variant="outline" asChild className="w-full h-12 rounded-lg text-base font-semibold" size="lg">
            <a href="https://www.dhyanfoundation.com" target="_blank" rel="noopener noreferrer">
              Visit Website
            </a>
          </Button>
        </div>

        {/* Contact */}
        <div className="px-5 pb-4">
          <div className="rounded-xl bg-card p-4 shadow-sm space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Contact</h3>
            <p className="text-xs text-muted-foreground">Animal Helpline: <span className="text-foreground font-medium">+91-9999099423</span></p>
            <p className="text-xs text-muted-foreground">Email: <span className="text-foreground font-medium">info@dhyanfoundation.com</span></p>
            <p className="text-xs text-muted-foreground">Website: <span className="text-foreground font-medium">dhyanfoundation.com</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;