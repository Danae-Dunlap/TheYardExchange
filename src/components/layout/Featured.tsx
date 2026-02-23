import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import { BusinessCard } from "../business/BusinessCard";

const FeaturedSection =  ({featuredBusinesses}) => {
    return(
        <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-foreground">Featured Businesses</h3>
            <Link to="/discover">
              <Button variant="ghost">View All</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredBusinesses.map((business) => (
              <BusinessCard business={business} key={business.id} />
            ))}
          </div>
        </div>
      </section>
    );
};

export default FeaturedSection;