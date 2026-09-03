import { Fredoka, Plus_Jakarta_Sans } from "next/font/google";
import TripClient from "./TripClient";

const fredoka = Fredoka({
    subsets: ["latin"],
    variable: "--font-fredoka",
    display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    variable: "--font-jakarta",
    display: "swap",
});

export const metadata = {
    // absolute: supaya tidak ikut template "| Dazytech Solutions" dari root layout
    title: { absolute: "Vietnam North Trip 2027 🇻🇳 — Itinerary Rere" },
    description:
        "Itinerary lengkap 9 hari: Hanoi → Sapa → Ha Long Bay, 13–21 Februari 2027. Jadwal per hari, kuliner, budget, packing, dan plan B.",
    // Halaman pribadi: tetap bisa dibuka siapa saja lewat URL,
    // tapi tidak diindeks supaya tidak mengganggu SEO dazytech.web.id.
    robots: { index: false, follow: false },
    alternates: { canonical: "/vietnam_hanoi_itenary_2027_rere" },
    openGraph: {
        title: "Vietnam North Trip 2027 🇻🇳 by Rere",
        description:
            "Hanoi → Sapa 3D2N → Ha Long Bay · 13–21 Februari 2027. Itinerary per hari, kuliner, budget & plan B.",
        images: [{ url: "/vietnam-2027/halong.jpg", width: 1280, height: 854 }],
        type: "website",
        locale: "id_ID",
    },
};

export const viewport = {
    themeColor: "#FFF6EC",
};

export default function VietnamItineraryPage() {
    return (
        <div className={`${fredoka.variable} ${jakarta.variable}`}>
            <TripClient />
        </div>
    );
}
