import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Star } from "lucide-react";

const Review = ({ review }) => {
    return (
                <div key={review.id} className="flex items-start gap-4">
                    <Avatar>
                        <AvatarImage src={review.user_logo} />
                        <AvatarFallback>{review.user}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <p className="font-semibold text-foreground">{review.user}</p>
                                <div className="flex items-center gap-2">
                                    <div className="flex">
                                        {[...Array(review.rating)].map((_, i) => (
                                            <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                                        ))}
                                    </div>
                                    <span className="text-sm text-muted-foreground">{review.date}</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-muted-foreground">{review.comment}</p>
                    </div>
                </div>
    );
}

export default Review;


