import { Button } from "../ui/button";
import { Phone, Mail, PanelTop } from 'lucide-react';
import tiktokLogo from "@/assets/tiktok.png";
import instaLogo from "@/assets/instagram.png";
import facebookLogo from "@/assets/facebook.png"

const ContactInfo = ({ contacts }) => {
    return (<div>
            {contacts && contacts.email &&
                    <Button variant="outline" className="w-full gap-2 m-1">
                        <div className="flex gap-1 flex-row items-center justify-self-end">
                            <Mail className="h-4 w-4" /> Email: {contacts.email}
                        </div>
                    </Button>
            }{contacts && contacts.phone_number &&
                <Button variant="outline" className="w-full gap-2 m-1">
                    <div className="flex gap-1 flex-row items-center justify-self-end">
                        <Phone className="h-4 w-4" /> Call: {contacts.phone_number}
                    </div>
                </Button>
        }{contacts && contacts.website &&
            <Button variant="outline" className="w-full gap-2 m-1">
                <div className="flex gap-1 flex-row items-center justify-self-end">
                    <PanelTop className="h-4 w-4" /> Website: {contacts.website}
                </div>
            </Button>
        }{contacts && contacts.tiktok &&
            <Button variant="outline" className="w-full gap-2 m-1">
                <div className="flex gap-1 flex-row items-center justify-self-end">
                    <img src={tiktokLogo} className="h-4 w-4" /> Tiktok: {contacts.tiktok}
                </div>
            </Button>
        }{contacts && contacts.instagram &&
            <Button variant="outline" className="w-full gap-2 m-1">
                <div className="flex gap-1 flex-row items-center justify-self-end">
                    <img src={instaLogo} className="h-4 w-4" /> Instagram: {contacts.instagram}
                </div>
            </Button>
        }{contacts &&contacts.facebook &&
            <Button variant="outline" className="w-full gap-2 m-1">
                <div className="flex gap-1 flex-row items-center justify-self-end">
                    <img src={facebookLogo} className="h-4 w-4" /> Facebook: {contacts.facebook}
                </div>
            </Button>
        }
    </div>);
}

export default ContactInfo; 