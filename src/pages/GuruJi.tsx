import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Mic, Award, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import gurujiPortrait from "@/assets/guruji-portrait.avif";
import gurujiGada from "@/assets/guruji-gada.avif";
import gurujiVedic from "@/assets/guruji-vedic.avif";
import gurujiImpact from "@/assets/guruji-impact.avif";

const testimonials = [
  {
    title: "Weather Changing at Will",
    desc: "Dr. Vedprakash Mishra recounts the unexpected change in the weather due to a mere signal from Guruji.",
  },
  {
    title: "Shri Shripad Naik's Testimony",
    desc: "Former AYUSH Secretary divulges that the level of mantra chanting he witnessed among Sadhaks at Dhyan Foundation under the guidance of Guru Ji is unparalleled.",
  },
];

const impactStats = [
  { value: "45+", label: "Shelters Set Up" },
  { value: "2000+", label: "Women Empowered" },
  { value: "70,000+", label: "Voiceless Beings Rescued" },
];

const GuruJi = () => {
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
        <h1 className="text-lg font-bold text-foreground">Ashwini Guru Ji</h1>
      </header>

      <div className="space-y-6">
        {/* Hero */}
        <div className="px-5">
          <div className="rounded-xl overflow-hidden relative">
            <img src={gurujiPortrait} alt="Ashwini Guru Ji" className="w-full h-56 object-cover object-top" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-[10px] uppercase tracking-widest text-primary-foreground/60 font-medium">Dhyan Ashram</p>
              <h2 className="text-lg font-bold text-primary-foreground leading-snug mt-0.5">
                Ashwini Guru Ji
              </h2>
              <p className="text-xs text-primary-foreground/70 mt-1">
                A rare phenomenon, inspiring action and transforming lives across the globe.
              </p>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="px-5">
          <h2 className="text-base font-bold text-foreground mb-2">About Ashwini Guru Ji</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ashwini Guru ji of Dhyan Ashram is a rare phenomenon in present times. He is the energy and inspiration behind the various initiatives of Dhyan Foundation. He believes in action and practical experience, and has put thousands across the globe on the path of helping others, leading by his own example.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">
            Holding a bachelors degree in Economics and Masters in Management and having spent decades in the company of Himalayan Rishis to imbibe the ancient Vedic sciences and esoteric healing arts, he is a perfect amalgamation of the ancient and the modern.
          </p>
        </div>

        {/* Yoga & Selfless Service */}
        <div className="px-5">
          <h2 className="text-base font-bold text-foreground mb-2">On Yoga and Selfless Service</h2>
          <div className="rounded-xl overflow-hidden bg-card shadow-sm">
            <img src={gurujiGada} alt="The Art of Gada" className="w-full h-52 object-cover" loading="lazy" />
            <div className="p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">The Art of Gada</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mt-3">
            Guru ji has completely sanitised the subject of yoga from commerce and does not even accept a glass of water in exchange for teachings. He emphasises that cleansing one's karmas is a prerequisite for progressing on the path of yoga.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">
            He has devoted his life and assets to the cause of reducing pain in the Creation. He personally looks after the rescued animals rehabilitated at different Dhyan Foundation gaushalas, can be seen working on ground zero in remote areas to serve those in pain.
          </p>
        </div>

        {/* Testimonials */}
        <div className="px-5">
          <h2 className="text-base font-bold text-foreground mb-3">Testimonials</h2>
          <div className="space-y-3">
            {testimonials.map((t, i) => (
              <div key={i} className="flex gap-3 rounded-xl bg-card p-3 shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Mic className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground">{t.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vedic Sciences */}
        <div className="px-5">
          <h2 className="text-base font-bold text-foreground mb-2">Master of Vedic Culture & Sciences</h2>
          <div className="rounded-xl overflow-hidden bg-card shadow-sm">
            <img src={gurujiVedic} alt="Vedic Sciences" className="w-full h-40 object-cover" loading="lazy" />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mt-3">
            He is an avid researcher on the ancient Vedic sciences and has authored several masterpieces on yoga and esoteric healing sciences. He has been invited as a speaker at prestigious institutions like IIM Bangalore and Oxford University London.
          </p>
        </div>

        {/* Quote */}
        <div className="px-5">
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-center">
            <p className="text-sm italic text-foreground leading-relaxed">
              "It is the Dharma of every human being to protect and provide for those weaker than them"
            </p>
            <p className="text-xs font-semibold text-primary mt-2">— Ashwini Guru Ji</p>
          </div>
        </div>

        {/* Impact */}
        <div className="px-5">
          <h2 className="text-base font-bold text-foreground mb-2">His Impact</h2>
          <div className="rounded-xl overflow-hidden bg-card shadow-sm">
            <img src={gurujiImpact} alt="Guru Ji's Impact" className="w-full h-44 object-cover" loading="lazy" />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mt-3">
            It is this thought and inspiration of Ashwini Guru Ji that has manifested the set up of 45+ shelters, empowered 2000+ women, enabled education in free schools for underprivileged children, encouraged various rural development and sustainability practices, enabled the rescue and care of 70,000+ voiceless beings and ensured free food distribution campaigns across the world for the hungry.
          </p>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {impactStats.map((stat, i) => (
              <div key={i} className="rounded-lg bg-primary/5 border border-primary/10 p-3 text-center">
                <p className="text-lg font-bold text-primary">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
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
            onClick={() => window.open("https://www.dhyanfoundation.com/ashwini-guru-ji", "_blank")}
            className="w-full h-12 rounded-lg text-base font-semibold"
            size="lg"
          >
            Visit Full Profile
          </Button>
        </div>

        {/* Contact */}
        <div className="px-5 pb-4">
          <div className="rounded-xl bg-card p-4 shadow-sm space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Interact with Guru Ji</h3>
            <p className="text-xs text-muted-foreground">Animal Helpline: <span className="text-foreground font-medium">+91-9999099423</span></p>
            <p className="text-xs text-muted-foreground">Email: <span className="text-foreground font-medium">info@dhyanfoundation.com</span></p>
            <p className="text-xs text-muted-foreground">Address: A-80, South Extension Part II, New Delhi-49</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuruJi;
