import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProfileInfo from "@/components/profile/ProfileInfo";
import HandleBusinessOwner from "@/components/profile/HandleBusiness";

const ProfilePage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-2xl flex-1">
        <ProfileInfo />
        <HandleBusinessOwner />
      </div>

      <Footer />
    </div>
  );
};

export default ProfilePage;
