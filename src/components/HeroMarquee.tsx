import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroDefault from "@/assets/hero-banner.png";
import { usePersona } from "@/hooks/usePersona";

const HeroMarquee = () => {
  const navigate = useNavigate();
  const { t, isHindi } = usePersona();

  return (
    <div className="relative overflow-hidden rounded-xl">
      <img
        src={heroDefault}
        alt={t("Feed a Cow Live", "गाय को खिलाएँ लाइव")}
        className="h-64 w-full object-cover"
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5" {...(isHindi ? { lang: "hi" } : {})}>
        {/* LIVE indicator */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-secondary" />
          </span>
          <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider">
            {t("Live Now", "लाइव")}
          </span>
        </div>

        <h2 className="text-xl font-bold text-primary-foreground leading-tight">
          {t("Feed a Cow — Live", "गाय को खिलाएँ — लाइव")}
        </h2>
        <p className="text-sm text-primary-foreground/70 mt-1">
          {t("Your daan reaches the gaushala within 24hrs", "आपका दान 24 घंटे में गौशाला पहुँचता है")}
        </p>

        <Button
          onClick={() => navigate("/seva/annapurna")}
          size="lg"
          className="mt-4 rounded-lg font-bold text-sm h-11 w-full shadow-lg"
        >
          {t("Perform Seva Now", "अभी सेवा करें")}
        </Button>
      </div>
    </div>
  );
};

export default HeroMarquee;
