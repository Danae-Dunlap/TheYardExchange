import {Link} from "react-router-dom"; 
import {Card, CardContent} from "@/components/ui/card";
import { Badge } from "../ui/badge";
import { DollarSign } from "lucide-react";
import { priceRange } from "./Detail";

export const BusinessCard = ({ business }) => {
    return(<div>
        <Link key={business.id} to={`/business/${business.id}`} state={{ business }}>
              <Card className="overflow-hidden hover:shadow-xl transition-all group cursor-pointer h-full">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={business.logo_url}
                    alt={business.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-4">
                  <div className="mb-3">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-foreground text-lg">{business.name}</h3>
                      {business.rating ? (
                        <span className="text-sm font-semibold text-foreground ml-2">⭐ {business.rating}</span>
                      ) : <p className="text-sm text-muted-foreground ml-2">No reviews yet</p>}
                    </div>
                    <Badge variant="outline" className="text-xs mb-2">{business.category}</Badge>
                    <p className="text-sm text-muted-foreground line-clamp-2">{business.description}</p>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div >
                      <span className="flex flex-row items-center"><DollarSign className="w-4 h-4" /> {priceRange(business.price_range)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
    </div>);
}