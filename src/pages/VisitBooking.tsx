import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, PauseCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import { useVisitReadyGaushalas } from "@/hooks/useGaushalas";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const timeSlots = ["7:00 AM", "9:00 AM", "11:00 AM", "2:00 PM", "4:00 PM"];

const VisitBooking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: gaushalas, isLoading } = useVisitReadyGaushalas();
  const { data: bookingsEnabled, isLoading: flagLoading } = useQuery({
    queryKey: ["feature-flag-visit-booking"],
    queryFn: async () => {
      const { data } = await supabase
        .from("feature_flags")
        .select("enabled")
        .eq("id", "visit_booking_enabled")
        .single();
      return data?.enabled ?? true;
    },
  });
  const [selectedGaushala, setSelectedGaushala] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [numVisitors, setNumVisitors] = useState("1");
  const [submitting, setSubmitting] = useState(false);

  const handleBooking = async () => {
    if (!selectedGaushala || !date || !selectedSlot || !visitorName || !visitorPhone) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!user) {
      toast.error("Please sign in to book a visit");
      navigate("/auth");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("visit_bookings").insert({
        user_id: user.id,
        gaushala_id: selectedGaushala,
        visit_date: date.toISOString().split("T")[0],
        time_slot: selectedSlot,
        visitor_name: visitorName,
        visitor_phone: visitorPhone,
        visitor_email: visitorEmail || null,
        num_visitors: parseInt(numVisitors) || 1,
      });
      if (error) throw error;
      toast.success("Visit booked successfully! 🙏");
      navigate("/profile");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-sm"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Book a Visit</h1>
      </header>

      <div className="px-5 space-y-5">
        {bookingsEnabled === false && (
          <Alert className="border-primary/30 bg-primary/5">
            <PauseCircle className="h-4 w-4 text-primary" />
            <AlertTitle className="text-sm font-semibold">Bookings Paused</AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground">
              Visit bookings are temporarily paused. Please check back later.
            </AlertDescription>
          </Alert>
        )}
        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">Choose Gaushala</h3>
          {isLoading ? (
            <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>
          ) : gaushalas && gaushalas.length > 0 ? (
            <div className="space-y-2">
              {gaushalas.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGaushala(g.id)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg border-2 p-3 transition-all text-left",
                    selectedGaushala === g.id ? "border-primary bg-primary/5" : "border-border bg-card"
                  )}
                >
                  <MapPin className={cn("h-4 w-4 shrink-0", selectedGaushala === g.id ? "text-primary" : "text-muted-foreground")} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{g.name}</p>
                    <p className="text-xs text-muted-foreground">{g.city}, {g.state}</p>
                    {g.description && <p className="text-xs text-muted-foreground mt-0.5">{g.description}</p>}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No gaushalas currently available for visits</p>
          )}
        </div>

        {/* Visitor Details */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-foreground">Your Details</h3>
          <Input placeholder="Full Name *" value={visitorName} onChange={(e) => setVisitorName(e.target.value)} className="h-12 rounded-lg bg-card" />
          <Input placeholder="Phone Number *" type="tel" value={visitorPhone} onChange={(e) => setVisitorPhone(e.target.value)} className="h-12 rounded-lg bg-card" />
          <Input placeholder="Email (optional)" type="email" value={visitorEmail} onChange={(e) => setVisitorEmail(e.target.value)} className="h-12 rounded-lg bg-card" />
          <Input placeholder="Number of Visitors" type="number" min="1" value={numVisitors} onChange={(e) => setNumVisitors(e.target.value)} className="h-12 rounded-lg bg-card" />
        </div>

        {/* Calendar */}
        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">Select Date</h3>
          <div className="rounded-lg bg-card p-2 shadow-sm">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="pointer-events-auto"
              disabled={(d) => d < new Date()}
            />
          </div>
        </div>

        {/* Time Slots */}
        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">Select Time</h3>
          <div className="flex flex-wrap gap-2">
            {timeSlots.map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedSlot(slot)}
                className={cn(
                  "rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all",
                  selectedSlot === slot
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-card text-foreground"
                )}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={handleBooking}
          disabled={bookingsEnabled === false || !selectedGaushala || !date || !selectedSlot || !visitorName || !visitorPhone || submitting}
          className="w-full h-12 rounded-lg text-base font-semibold shadow-lg"
          size="lg"
        >
          {submitting ? "Booking..." : "Confirm Booking"}
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default VisitBooking;
