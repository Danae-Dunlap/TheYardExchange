import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProfileInfo from "@/components/profile/ProfileInfo";
import HandleBusinessOwner from "@/components/profile/HandleBusiness";
import {BusinessCard} from "@/components/business/BusinessCard";
import { ProductCard} from "@/components/business/Product";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { fetchBusiness, fetchProducts } from "@/lib/data/utils";
import { Business, Product as ProductType } from "@/lib/interfaces";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type ChatMessage = { id: number; sender: "customer" | "business"; content: string; timestamp: string };
type Conversation = { id: number; businessName: string; businessInitials: string; lastMessage: string; timestamp: string; unread: number; messages: ChatMessage[] };

const customerConversations: Conversation[] = [
  {
    id: 1,
    businessName: "Jordan's Barbershop",
    businessInitials: "JB",
    lastMessage: "We open at 9 AM and close at 6 PM. Ask for Marcus at the front.",
    timestamp: "Today 2:47 PM",
    unread: 1,
    messages: [
      { id: 1, sender: "customer", content: "Hey, do you have any availability this Saturday afternoon?", timestamp: "Today 1:15 PM" },
      { id: 2, sender: "business", content: "Hi! Yes, we have slots open at 2 PM and 4 PM on Saturday. Which would you prefer?", timestamp: "Today 1:32 PM" },
      { id: 3, sender: "customer", content: "2 PM works perfectly for me. Is it for a regular cut and shape up?", timestamp: "Today 2:10 PM" },
      { id: 4, sender: "business", content: "Absolutely, that's $35. I'll put you down for 2 PM Saturday. Just reply to confirm!", timestamp: "Today 2:30 PM" },
      { id: 5, sender: "customer", content: "Thanks! I'll book for Saturday then.", timestamp: "Today 2:47 PM" },
      { id: 6, sender: "business", content: "We open at 9 AM and close at 6 PM. Ask for Marcus at the front.", timestamp: "Today 2:55 PM" },
    ],
  },
  {
    id: 2,
    businessName: "Downtown Grooming Co.",
    businessInitials: "DG",
    lastMessage: "That's a bit over my budget. Can you do a full detail for under $80?",
    timestamp: "Yesterday 4:22 PM",
    unread: 0,
    messages: [
      { id: 1, sender: "customer", content: "Hi, I saw your listing for detailing services. Do you offer a full interior + exterior package?", timestamp: "Yesterday 3:05 PM" },
      { id: 2, sender: "business", content: "Hey! Yes we do. Full detail (interior vacuum, wipe-down, exterior hand wash + wax) is $95.", timestamp: "Yesterday 3:40 PM" },
      { id: 3, sender: "customer", content: "That's a bit over my budget. Can you do a full detail for under $80?", timestamp: "Yesterday 4:22 PM" },
    ],
  },
  {
    id: 3,
    businessName: "The Yard Exchange",
    businessInitials: "YE",
    lastMessage: "Got it, I'll swing by tomorrow morning.",
    timestamp: "Mon 11:08 AM",
    unread: 0,
    messages: [
      { id: 1, sender: "customer", content: "Is the vintage leather jacket listed in your shop still available?", timestamp: "Mon 9:14 AM" },
      { id: 2, sender: "business", content: "Yes it is! Size medium, great condition. Want to come check it out in person?", timestamp: "Mon 9:45 AM" },
      { id: 3, sender: "customer", content: "Definitely. What are your hours tomorrow?", timestamp: "Mon 10:30 AM" },
      { id: 4, sender: "business", content: "We open at 9 AM and close at 6 PM. Ask for Marcus at the front.", timestamp: "Mon 10:55 AM" },
      { id: 5, sender: "customer", content: "Got it, I'll swing by tomorrow morning.", timestamp: "Mon 11:08 AM" },
    ],
  },
];

const ProfilePage = () => {
  const {profile} = useAuth();
  const [favoriteProducts, setFavoriteProducts] = useState<ProductType[]>([]);
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<Business[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<number>(1);

  const selectedConv = customerConversations.find((c) => c.id === selectedConvId)!;

  useEffect(() => {
    if (profile) {
      const fetchFavorites = async () => {
        const favProducts = await fetchProducts(undefined, undefined, profile.favorite_products);
        setFavoriteProducts(favProducts);
        const favBusinesses = await fetchBusiness({business_id: profile.favorite_businesses});
        setFavoriteBusinesses(favBusinesses);
      };
      fetchFavorites();
    }
  }, [profile]);

  const favoriteStoresWithDeals = useMemo(
    () => favoriteBusinesses.filter((b) => b.deal?.trim()),
    [favoriteBusinesses]
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-7xl flex-1">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="messages" className="relative">
              Messages
              {customerConversations.some((c) => c.unread > 0) && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {customerConversations.reduce((sum, c) => sum + c.unread, 0)}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="max-w-2xl mx-auto">
              <ProfileInfo />
              <HandleBusinessOwner />
            </div>
            {profile && favoriteStoresWithDeals.length > 0 && (
              <div className="pb-4 mt-4">
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertTitle>Promotions at your favorite stores</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-3 space-y-2 list-none p-0">
                      {favoriteStoresWithDeals.map((b) => (
                        <li key={b.id} className="text-sm">
                          <Link to={`/business/${b.id}`} className="font-medium text-foreground underline-offset-4 hover:underline">
                            {b.name}
                          </Link>
                          <span className="text-muted-foreground"> — {b.deal}</span>
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            )}
            {profile && profile.favorite_businesses && profile.favorite_businesses.length > 0 && (
              <div className="py-8">
                <h2 className="text-2xl font-bold mb-4">Favorite Businesses</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favoriteBusinesses.map((business) => (
                    <BusinessCard key={business.id} business={business} />
                  ))}
                </div>
              </div>
            )}
            {profile && profile.favorite_products && profile.favorite_products.length > 0 && (
              <div className="py-8">
                <h2 className="text-2xl font-bold mb-4">Favorite Products</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favoriteProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
                <CardDescription>Your conversations with businesses</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex h-[500px]">
                  {/* Conversation list */}
                  <div className="w-1/3 border-r overflow-y-auto">
                    {customerConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConvId(conv.id)}
                        className={`w-full text-left px-4 py-3 border-b hover:bg-muted/50 transition-colors ${selectedConvId === conv.id ? "bg-muted" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarFallback className="text-xs">{conv.businessInitials}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium truncate">{conv.businessName}</span>
                              {conv.unread > 0 && (
                                <Badge className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs shrink-0">
                                  {conv.unread}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{conv.timestamp}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {/* Message thread */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center gap-3 px-4 py-3 border-b">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{selectedConv.businessInitials}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{selectedConv.businessName}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                      {selectedConv.messages.map((msg) => (
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
      <Footer />
    </div>
  );
};

export default ProfilePage;
