import { Card, CardContent } from "../ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { ProductCard } from "./Product";
import { Separator } from "../ui/separator";
import { Event } from "./Event";
import { Clock, MapPin, DollarSign } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatHours } from "./Hours";
import { ReviewList } from "@/components/layout/Reviews/review-list";
import { priceRange } from "@/lib/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { useState } from "react";


type ChatMessage = { id: number; sender: "customer" | "business"; content: string; timestamp: string };

const categoryMessages: Record<string, ChatMessage[]> = {
  Hair: [
    { id: 1, sender: "customer", content: "Hey! Do you have any openings for braids this week?", timestamp: "Mon 10:15 AM" },
    { id: 2, sender: "business", content: "Hey! Yes, I have Thursday at 2 PM and Friday at 4 PM available. Which works for you?", timestamp: "Mon 10:42 AM" },
    { id: 3, sender: "customer", content: "Friday at 4 PM is perfect. I'm looking for a fade with a line up.", timestamp: "Mon 11:05 AM" },
    { id: 4, sender: "business", content: "Got it! knotless is $600. I'll pencil you in for Friday at 4.", timestamp: "Mon 11:20 AM" },
    { id: 5, sender: "customer", content: "Awesome, see you then!", timestamp: "Mon 11:35 AM" },
  ],
  Beauty: [
    { id: 1, sender: "customer", content: "Hi! Do you offer lash extensions? I've been looking for someone new.", timestamp: "Tue 9:05 AM" },
    { id: 2, sender: "business", content: "Yes! I do classic, hybrid, and volume sets. Which are you interested in?", timestamp: "Tue 9:30 AM" },
    { id: 3, sender: "customer", content: "Probably hybrid. How long does it take and what's the price?", timestamp: "Tue 9:45 AM" },
    { id: 4, sender: "business", content: "Hybrid full set takes about 2 hours and is $80. Fills are $45 every 2–3 weeks.", timestamp: "Tue 10:00 AM" },
    { id: 5, sender: "customer", content: "That sounds great. Can I book for next Saturday?", timestamp: "Tue 10:15 AM" },
    { id: 6, sender: "business", content: "Next Saturday at 11 AM works! I'll send you a confirmation.", timestamp: "Tue 10:22 AM" },
  ],
  Clothing: [
    { id: 1, sender: "customer", content: "Do you still have the olive cargo pants in a size 32?", timestamp: "Wed 1:10 PM" },
    { id: 2, sender: "business", content: "Let me check... yes, I have one pair left in a 32! Want me to hold them?", timestamp: "Wed 1:35 PM" },
    { id: 3, sender: "customer", content: "Yes please! How long can you hold them?", timestamp: "Wed 1:50 PM" },
    { id: 4, sender: "business", content: "I can hold them until Friday. They're $55. You can pick up anytime after noon.", timestamp: "Wed 2:05 PM" },
    { id: 5, sender: "customer", content: "Perfect, I'll come by Thursday evening. Thanks!", timestamp: "Wed 2:20 PM" },
  ],
  Food: [
    { id: 1, sender: "customer", content: "Hey! Do you take custom orders for events? I have a birthday dinner coming up.", timestamp: "Thu 11:00 AM" },
    { id: 2, sender: "business", content: "Absolutely! What kind of food are you thinking and how many people?", timestamp: "Thu 11:25 AM" },
    { id: 3, sender: "customer", content: "Caribbean food, probably for 15–20 people. Mostly rice dishes and jerk chicken.", timestamp: "Thu 11:40 AM" },
    { id: 4, sender: "business", content: "I can definitely do that. Full catering for 20 people would run around $200–$250 depending on sides.", timestamp: "Thu 12:00 PM" },
    { id: 5, sender: "customer", content: "That's within budget. When do you need the order confirmed by?", timestamp: "Thu 12:15 PM" },
    { id: 6, sender: "business", content: "At least 5 days in advance so I can prep everything fresh. What's the event date?", timestamp: "Thu 12:30 PM" },
  ],
  Services: [
    { id: 1, sender: "customer", content: "Hi, I need help moving some furniture this weekend. Do you do that?", timestamp: "Fri 3:00 PM" },
    { id: 2, sender: "business", content: "Yes! What are we talking — a few pieces or a full move?", timestamp: "Fri 3:20 PM" },
    { id: 3, sender: "customer", content: "Just a few heavy items within the same building. Couch, dresser, bed frame.", timestamp: "Fri 3:35 PM" },
    { id: 4, sender: "business", content: "That should take under 2 hours. I charge $30/hr with a 2-hour minimum. Does Sunday work?", timestamp: "Fri 3:50 PM" },
    { id: 5, sender: "customer", content: "Sunday afternoon works perfectly. Around 2 PM?", timestamp: "Fri 4:05 PM" },
    { id: 6, sender: "business", content: "Sunday at 2 PM is locked in. I'll message you when I'm on the way!", timestamp: "Fri 4:15 PM" },
  ],
  Tutoring: [
    { id: 1, sender: "customer", content: "Hey, I have an exam in Calc 2 next week. Do you have any availability before then?", timestamp: "Sun 7:00 PM" },
    { id: 2, sender: "business", content: "Yes! I can do Tuesday and Wednesday evenings. What topics are giving you trouble?", timestamp: "Sun 7:30 PM" },
    { id: 3, sender: "customer", content: "Series and convergence tests mostly. I keep mixing up which test to use.", timestamp: "Sun 7:45 PM" },
    { id: 4, sender: "business", content: "That's super common. I have a flowchart I use with students that helps a lot. Tuesday at 7 PM work?", timestamp: "Sun 8:00 PM" },
    { id: 5, sender: "customer", content: "Tuesday at 7 works. How long are sessions and what do you charge?", timestamp: "Sun 8:10 PM" },
    { id: 6, sender: "business", content: "Sessions are 1–1.5 hours, $20/hr. See you Tuesday!", timestamp: "Sun 8:20 PM" },
  ],
  Creative: [
    { id: 1, sender: "customer", content: "Hi! I love your work. Do you do custom digital portraits?", timestamp: "Mon 2:00 PM" },
    { id: 2, sender: "business", content: "Thank you! Yes I do. Do you have a photo reference in mind?", timestamp: "Mon 2:30 PM" },
    { id: 3, sender: "customer", content: "I was thinking a portrait of me and my roommate in your illustration style.", timestamp: "Mon 2:45 PM" },
    { id: 4, sender: "business", content: "Love it! Two-person portraits start at $60. Turnaround is about 5–7 days. Want to go ahead?", timestamp: "Mon 3:05 PM" },
    { id: 5, sender: "customer", content: "Yes! How do I send the reference photos?", timestamp: "Mon 3:20 PM" },
    { id: 6, sender: "business", content: "Just DM them here or send to my email. I'll start once I receive them!", timestamp: "Mon 3:30 PM" },
  ],
  Tech: [
    { id: 1, sender: "customer", content: "My laptop keeps crashing randomly. Do you do diagnostics?", timestamp: "Tue 1:00 PM" },
    { id: 2, sender: "business", content: "Yes! Most likely a RAM or overheating issue. Diagnostic is free, repairs start at $25.", timestamp: "Tue 1:20 PM" },
    { id: 3, sender: "customer", content: "How long does the diagnostic usually take?", timestamp: "Tue 1:35 PM" },
    { id: 4, sender: "business", content: "Usually 30–45 minutes. Can you bring it by today or tomorrow?", timestamp: "Tue 1:50 PM" },
    { id: 5, sender: "customer", content: "Tomorrow works. What time are you available?", timestamp: "Tue 2:05 PM" },
    { id: 6, sender: "business", content: "I'm free anytime after 12 PM tomorrow. Just swing by!", timestamp: "Tue 2:15 PM" },
  ],
  "Consumer Goods": [
    { id: 1, sender: "customer", content: "Hey, do you have any more of those handmade candles? The ones from last week sold out fast.", timestamp: "Wed 10:00 AM" },
    { id: 2, sender: "business", content: "I just restocked! I have lavender, vanilla, and a new cedarwood scent.", timestamp: "Wed 10:25 AM" },
    { id: 3, sender: "customer", content: "Can I grab 2 lavender and 1 cedarwood? What's the price each?", timestamp: "Wed 10:40 AM" },
    { id: 4, sender: "business", content: "They're $12 each or 3 for $30. So 3 candles would be $30 total!", timestamp: "Wed 10:55 AM" },
    { id: 5, sender: "customer", content: "Perfect deal. Can I pick them up this afternoon?", timestamp: "Wed 11:05 AM" },
    { id: 6, sender: "business", content: "Yes! I'll have them ready. Just message me when you're heading over.", timestamp: "Wed 11:15 AM" },
  ],
  Entertainment: [
    { id: 1, sender: "customer", content: "Hey! Do you do private events? I'm planning a birthday party and want live music.", timestamp: "Thu 4:00 PM" },
    { id: 2, sender: "business", content: "Yes! I perform at private events. What kind of vibe are you going for?", timestamp: "Thu 4:30 PM" },
    { id: 3, sender: "customer", content: "Chill R&B/soul, maybe a 1.5–2 hour set. Party is for about 30 people.", timestamp: "Thu 4:45 PM" },
    { id: 4, sender: "business", content: "I can do that! A 2-hour set runs $150. Do you have a date in mind?", timestamp: "Thu 5:05 PM" },
    { id: 5, sender: "customer", content: "The 18th. Does that work?", timestamp: "Thu 5:20 PM" },
    { id: 6, sender: "business", content: "The 18th is open! Let's lock it in. I'll send over a simple agreement.", timestamp: "Thu 5:35 PM" },
  ],
};

const fallbackMessages: ChatMessage[] = [
  { id: 1, sender: "customer", content: "Hi! I had a question about your services.", timestamp: "Mon 10:00 AM" },
  { id: 2, sender: "business", content: "Hey! Happy to help — what did you want to know?", timestamp: "Mon 10:20 AM" },
  { id: 3, sender: "customer", content: "Do you offer any kind of custom or bulk pricing?", timestamp: "Mon 10:35 AM" },
  { id: 4, sender: "business", content: "Yes, I can work something out depending on what you need. Send me the details!", timestamp: "Mon 10:50 AM" },
  { id: 5, sender: "customer", content: "Great, I'll send over more info soon. Thanks!", timestamp: "Mon 11:00 AM" },
];

const DetailSection = ({ business, favorites, services, events, onReviewChange }) => {
  const { user} = useAuth();

  const mockMessages: ChatMessage[] = categoryMessages[business?.category] ?? fallbackMessages;

  const [activeMsg, setActiveMsg] = useState<"thread" | "new">("thread");

  return (
    <div className="lg:col-span-2">
      <Tabs defaultValue="about" className="w-full"> 
        <TabsList className="w-full justify-start mb-6">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="message">Message</TabsTrigger>
        </TabsList>

        <TabsContent value="about">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">About</h3>
              <p className="text-muted-foreground mb-6">{business.description}</p>

              <Separator className="my-6" />

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Location</p>
                    <p className="text-sm text-muted-foreground">{business.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Hours</p>
                    <p className="text-base text-muted-foreground whitespace-pre-line">{formatHours(business.hours_of_operation)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Price Range</p>
                    <span className="text-base text-muted-foreground">{priceRange(business.price_range)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">Services</h3>
              {favorites.length > 0 &&
                <div>
                  <div className="space-y-4 mb-6">
                    <h4 className="font-medium text-foreground mb-4">Crowd Favorites</h4>
                    {favorites.map((favorite, index) => (
                      <ProductCard key={index} product={favorite} />
                    ))}
                  </div>
                  <hr />
                </div>
              }
              <div className="space-y-4">
                {favorites.length > 0 && <h4 className="font-medium text-foreground my-4">All Services</h4>}
                {services.map((service, index) => (
                  <ProductCard key={index} product={service} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">Reviews</h3>
              <ReviewList businessId={business.id} currentUserId={user?.id} onReviewChange={onReviewChange} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">Events</h3>
              {events.map((event, index) => (
                <Event key={index} event={event} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="message">
          <Card>
            <CardContent className="p-0">
              <div className="flex h-[420px]">
                {/* Sidebar: conversation list */}
                <div className="w-1/3 border-r flex flex-col">
                  <div className="px-4 py-3 border-b">
                    <p className="text-sm font-medium">Conversations</p>
                  </div>
                  <button
                    onClick={() => setActiveMsg("thread")}
                    className={`w-full text-left px-4 py-3 border-b hover:bg-muted/50 transition-colors ${activeMsg === "thread" ? "bg-muted" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-xs">{business?.name?.slice(0, 2).toUpperCase() ?? "BZ"}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">You & {business?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">See you Friday!</p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Thread */}
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center gap-3 px-4 py-3 border-b">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs">{business?.name?.slice(0, 2).toUpperCase() ?? "BZ"}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{business?.name}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                    {mockMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender === "customer" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${msg.sender === "customer" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${msg.sender === "customer" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{msg.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DetailSection;