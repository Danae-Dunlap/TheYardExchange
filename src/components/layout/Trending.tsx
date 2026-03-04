import { TrendingUp, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TrendingSection = () => (
  <section className="py-12 px-4 bg-muted/30">
    <div className="container mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="text-2xl font-bold text-foreground">Trending Now</h3>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {/* You could map through a 'trending' array here in the future */}
        <TrendingCard icon={<MapPin />} title="Founders Library" subtitle="5 businesses nearby" />
        <TrendingCard badge="50% OFF" title="Weekend Specials" subtitle="12 deals available" variant="secondary" />
      </div>
    </div>
  </section>
);

const TrendingCard = ({ icon, title, subtitle, badge, variant = "default" }: any) => (
  <Card className="min-w-[280px] hover:shadow-lg transition-shadow cursor-pointer">
    <CardContent className="p-4">
      {badge && <Badge className={`mb-2 bg-${variant}`}>{badge}</Badge>}
      <div className="flex items-center gap-3">
        {icon && <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">{icon}</div>}
        <div>
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default TrendingSection;