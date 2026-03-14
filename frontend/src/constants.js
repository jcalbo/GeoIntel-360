import { ShieldAlert, Globe, TrendingUp, Wifi, MapPin } from 'lucide-react';

export const CATEGORIES = [
    { id: 'Geopolitics', icon: Globe, color: 'text-accent-blue' },
    { id: 'Cybersecurity', icon: ShieldAlert, color: 'text-accent-purple' },
    { id: 'Economics', icon: TrendingUp, color: 'text-accent-emerald' },
    { id: 'Internet Radar', icon: Wifi, color: 'text-[#f38020]' },
    { id: 'Campaign Origins', icon: MapPin, color: 'text-red-400' },
];

export const SOURCES = [
    // Military & Defense
    { id: "https://warontherocks.com/feed/", label: "War on the Rocks" },
    { id: "https://www.longwarjournal.org/feed", label: "The Long War Journal" },
    { id: "https://news.usni.org/feed", label: "USNI News" },

    // Cybersecurity
    { id: "https://feeds.feedburner.com/TheHackersNews", label: "The Hacker News" },
    { id: "https://www.bleepingcomputer.com/feed/", label: "BleepingComputer" },
    { id: "https://www.cisa.gov/cybersecurity-advisories/all.xml", label: "CISA Cyber Alerts" },

    // Economics
    { id: "https://www.cfr.org/rss/all", label: "Council on Foreign Relations" },
    { id: "https://www.bruegel.org/rss.xml", label: "Bruegel" },

    // API Aggregators
    { id: "NewsData.io", label: "NewsData.io Network" },
    { id: "GNews", label: "GNews Network" }
];
