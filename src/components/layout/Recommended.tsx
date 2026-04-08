import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import { BusinessCard } from "../business/BusinessCard";
import { Business, Product as ProductType } from "@/lib/interfaces";
import { ProductCard } from "../business/Product";
import { useNavigate, useSearchParams } from "react-router-dom";

const RecommendedSection = ({ recommendedBusinesses }: { recommendedBusinesses: Business[] }) => {
    if (!recommendedBusinesses || recommendedBusinesses.length === 0) return null;

    return (
        <section className="py-12 px-4">
            <div className="container mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-foreground">Recommended for You Based on Your Activity</h3>
                    <Link to="/discover">
                        <Button variant="ghost">View All</Button>
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {recommendedBusinesses.map((business) => (
                        <BusinessCard business={business} key={business.id} />
                    ))}
                </div>
            </div>
        </section>
    );
};

const RecommendedProducts = ({ recommendedProducts, onSuccess }: { recommendedProducts: ProductType[]; onSuccess: () => void }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    if (!recommendedProducts || recommendedProducts.length === 0) return null;

    const handleClick = (e: React.MouseEvent<HTMLDivElement>, businessId?: string, productId?: string) => {
        e.stopPropagation();
        const params = new URLSearchParams(searchParams);
        params.set("tab", "services");

        navigate(`/business/${businessId}?${params.toString()}`);
        onSuccess();
    };

    return (
        <div className="mt-8 w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">
                    Similar Products
                </h3>
            </div>

            {/* Scroll Row Container */}
            <div className="container max-w-[850px] overflow-clip">
                <div className="flex flex-row gap-2 overflow-x-auto overflow-y-hidden">
                    {recommendedProducts.map((product) => (
                        <div
                            key={product.id}
                            onClick={(e: React.MouseEvent<HTMLDivElement>) => handleClick(e, product.business_id, product.id)}
                            className="w-[400px] min-h-[200px] max-h-[200px] flex-shrink-0"
                        >
                            <ProductCard
                                product={product}
                                disableButtons
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export { RecommendedSection, RecommendedProducts };
