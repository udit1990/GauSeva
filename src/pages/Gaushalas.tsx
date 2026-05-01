import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Heart, Stethoscope, HandHeart, Leaf, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import gaushalaHero from "@/assets/gaushala-hero.avif";
import gaushalaRescue from "@/assets/gaushala-rescue.avif";
import gaushalaCare from "@/assets/gaushala-care.avif";
import { useGaushalas } from "@/hooks/useGaushalas";

const howWeGetThem = [
  "Rescued from cross-border smuggling by BSF",
  "Rescued from cattle smugglers and illegal slaughter houses by Police",
  "Stray, injured, sick and orphaned gauvansh rescued by our ambulances",
  "Old, unproductive gauvansh abandoned by villagers and farmers",
  "Male calves abandoned by dairy owners",
];

const careItems = [
  { icon: Heart, title: "Nourishing Diet", desc: "Dry fodder, greens, wheat & rice bran, silage, oil-cakes, mustard oil, dalia and supplements." },
  { icon: Stethoscope, title: "Medical Care", desc: "In-house vets and paravets provide round-the-clock care." },
  { icon: HandHeart, title: "Love & Warmth", desc: "Personal care from volunteers, massages and physiotherapy for the weak." },
  { icon: Building2, title: "Prosthetics & Surgery", desc: "Plastic removal surgeries, prosthetic surgery and lifting machines." },
  { icon: Leaf, title: "Rural Development", desc: "Organic farming, women empowerment, eco-friendly products from cow dung and manure." },
];

const getInvolved = [
  "Adopt a Cow or Bull (remotely)",
  "Sponsor their Feed",
  "Build a Shed",
  "Visit them for Seva",
  "Perform Gaupuja",
  "Celebrate Special Occasions with Gauvansh",
];

const Gaushalas = () => {
  const navigate = useNavigate();
  const { data: gaushalas } = useGaushalas();

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-sm"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Our Gaushalas</h1>
      </header>

      <div className="space-y-6">
        {/* Hero */}
        <div className="px-5">
          <div className="rounded-xl overflow-hidden relative">
            <img src={gaushalaHero} alt="Dhyan Foundation Gaushalas" className="w-full h-52 object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-[10px] uppercase tracking-widest text-primary-foreground/60 font-medium">Dhyan Foundation</p>
              <h2 className="text-base font-bold text-primary-foreground leading-snug mt-0.5">Our Gaushalas</h2>
              <p className="text-xs text-primary-foreground/70 mt-1">Come and experience the magic of this wondrous being</p>
            </div>
          </div>
        </div>

        {/* Highlight Statement */}
        <div className="px-5">
          <div className="rounded-xl bg-card border border-border p-4">
            <p className="text-sm leading-relaxed text-foreground font-bold">
              We are the <span className="text-destructive">"ONLY"</span> organization in the world with 90% non-milking, old cows and nandis, 100% of these rescued from traffickers and illegal slaughter houses. We have the <span className="text-destructive">biggest population of Nandis</span> for nurturing only, across the world.
            </p>
          </div>
        </div>

        {/* Gaushala List from DB */}
        {gaushalas && gaushalas.length > 0 && (
          <div className="px-5">
            <h2 className="text-base font-bold text-foreground mb-3">Our Locations</h2>
            <div className="space-y-2">
              {gaushalas.map((g) => (
                <div key={g.id} className="flex items-center gap-3 rounded-lg bg-card p-3 shadow-sm">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{g.name}</p>
                    <p className="text-xs text-muted-foreground">{g.city}, {g.state}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Historical context */}
        <div className="px-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            There's a reason why Pandav's risked their exile to protect cows and bulls in Viratnagar war or why Chola King Needhi Cholan did not shy away from killing his own son when found guilty of gauhatya. Our shastras tell us Nandi is the favorite of Bhagwan Shiv and Mata Lakshmi resides in the cow.
          </p>
        </div>

        {/* How we get them */}
        <div className="px-5">
          <h2 className="text-base font-bold text-foreground mb-2">How We Get Them</h2>
          <div className="rounded-xl overflow-hidden bg-card shadow-sm">
            <img src={gaushalaRescue} alt="Rescue conditions" className="w-full h-40 object-cover" loading="lazy" />
            <div className="p-3 space-y-2">
              {howWeGetThem.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-primary text-xs mt-0.5">•</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Conditions */}
        <div className="px-5">
          <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4">
            <h3 className="text-sm font-bold text-foreground mb-2">Conditions in Which They Come</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Horns & limbs broken • Chillies and toxins in eyes • Stuffed like potatoes • Kept without food and water for days • Wounded and injured • Diseased
            </p>
          </div>
        </div>

        {/* Care at Gaushala */}
        <div className="px-5">
          <h2 className="text-base font-bold text-foreground mb-3">Gauseva at Our Gaushalas</h2>
          <div className="rounded-xl overflow-hidden bg-card shadow-sm mb-3">
            <img src={gaushalaCare} alt="Gaushala care" className="w-full h-40 object-cover" loading="lazy" />
          </div>
          <div className="space-y-3">
            {careItems.map((item, i) => (
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

        {/* Get Involved */}
        <div className="px-5">
          <h2 className="text-base font-bold text-foreground mb-3">Get Involved</h2>
          <div className="grid grid-cols-2 gap-2">
            {getInvolved.map((item, i) => (
              <div key={i} className="rounded-lg bg-card p-3 shadow-sm text-center">
                <p className="text-xs font-medium text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="px-5 space-y-3">
          <Button onClick={() => navigate("/")} className="w-full h-12 rounded-lg text-base font-semibold shadow-lg" size="lg">
            Start Your Daan
          </Button>
          <Button variant="outline" onClick={() => navigate("/visit")} className="w-full h-12 rounded-lg text-base font-semibold" size="lg">
            Plan a Visit
          </Button>
        </div>

        {/* Contact */}
        <div className="px-5 pb-4">
          <div className="rounded-xl bg-card p-4 shadow-sm space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Contact</h3>
            <p className="text-xs text-muted-foreground">Animal Helpline: <span className="text-foreground font-medium">+91-9999099423</span></p>
            <p className="text-xs text-muted-foreground">Email: <span className="text-foreground font-medium">info@dhyanfoundation.com</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gaushalas;
