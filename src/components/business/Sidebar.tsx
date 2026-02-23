import {Card, CardContent } from "../ui/card"; 
import ContactInfo from "./ContactInfo";
import { Separator } from "@/components/ui/separator";
import { Button } from "../ui/button";
import { MapPin, Flag } from "lucide-react";

const Sidebar = ({business}) => {
    return(
        <div className="space-y-4">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Contact Business</h3>
                <ContactInfo contacts={business.contact_info} />
                <Separator className="my-4" />

                <div className="space-y-3">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <MapPin className="h-4 w-4" />
                    Get Directions
                  </Button>
                  <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive">
                    <Flag className="h-4 w-4" />
                    Report Business
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
    );
}

export default Sidebar;