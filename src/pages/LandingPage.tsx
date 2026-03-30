import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-16 lg:py-24">
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-wider text-primary">Built by Howard students, for Howard students</p>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              The Yard Exchange
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              A mobile/web marketplace and networking hub where Howard University students discover, promote,
              and support student-run businesses across campus. Grow your brand, connect with customers, and
              build community with every listing.
            </p>
          </div>
          <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
            <p className="text-sm font-semibold text-primary mb-3">How it works</p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>• Discover local student businesses in categories like food, creativity, and services.</li>
              <li>• Promote your own student venture with a business profile and product listings.</li>
              <li>• Connect through Community and In-App Messaging.</li>
            </ul>
          </div>
        </section>

        <section id="landing-features" className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Search & Discover", description: "Find products, services, and events from your peers across Howard.", icon: "🔍" },
            { title: "Build Your Brand", description: "Launch listings, highlight promotions, and grow customer relationships.", icon: "✨" },
            { title: "Community-First", description: "Support entrepreneurship and keep spending on campus.", icon: "🤝" },
            { title: "Verified Students", description: "Sign up with @bison.howard.edu and join a trusted network.", icon: "🎓" },
          ].map((feature) => (
            <article key={feature.title} className="rounded-2xl border border-border bg-background p-5 shadow-sm">
              <div className="text-2xl mb-2">{feature.icon}</div>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
            </article>
          ))}
        </section>

        <section className="mt-16 rounded-2xl border border-border bg-primary/5 p-8 text-center">
          <h2 className="text-2xl font-bold">Join The Yard Exchange</h2>
          <p className="mt-2 text-muted-foreground">
            Create your profile today and start connecting with the Howard community.
          </p>
          <Button className="mt-4" onClick={() => navigate("/auth")}>Create a Free Account</Button>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
