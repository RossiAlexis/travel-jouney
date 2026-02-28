import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { MapPin, BookOpen, DollarSign, Share2 } from "lucide-react";
import React from "react";
export function meta() {
  return [
    { title: "Travel Journal - Document Your Adventures" },
    {
      name: "description",
      content:
        "A digital travel journal to document your travels, organize experiences, track expenses, and share your journeys.",
    },
  ];
}

export default function Home() {
  return (
    <div className="from-background to-muted min-h-screen bg-gradient-to-b">
      {/* Header */}
      <header className="container mx-auto flex items-center justify-between px-4 py-6">
        <div className="flex items-center gap-2">
          <MapPin className="text-primary h-8 w-8" />
          <span className="text-2xl font-bold">Travel Journal</span>
        </div>
        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link to="/register">Get Started</Link>
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20 text-center">
        <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-6xl">
          Document Your
          <span className="text-primary"> Adventures</span>
        </h1>
        <p className="text-muted-foreground mx-auto mb-10 max-w-2xl text-xl">
          A private digital journal to capture your travels, organize
          experiences, track expenses, and relive your journeys whenever you
          want.
        </p>
        <div className="flex justify-center gap-4">
          <Button size="lg" asChild>
            <Link to="/register">Start Your Journal</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </main>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold">
          Everything you need to document your travels
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<BookOpen className="text-primary h-10 w-10" />}
            title="Rich Travel Memories"
            description="Write detailed memories with photos, locations, and ratings for each experience."
          />
          <FeatureCard
            icon={<MapPin className="text-primary h-10 w-10" />}
            title="Visual Maps"
            description="See all your visited locations on an interactive map with your travel routes."
          />
          <FeatureCard
            icon={<DollarSign className="text-primary h-10 w-10" />}
            title="Expense Tracking"
            description="Keep track of your spending by category and stay within your travel budget."
          />
          <FeatureCard
            icon={<Share2 className="text-primary h-10 w-10" />}
            title="Selective Sharing"
            description="Choose what to share publicly when you're ready, or keep everything private."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-6 text-3xl font-bold">
            Start documenting your journey today
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-lg opacity-90">
            Join thousands of travelers who use Travel Journal to preserve their
            memories and organize their adventures.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/register">Create Free Account</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="text-muted-foreground container mx-auto px-4 text-center text-sm">
          <p>
            Travel Journal &copy; {new Date().getFullYear()}. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card rounded-lg border p-6 text-center shadow-sm">
      <div className="mb-4 flex justify-center">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
