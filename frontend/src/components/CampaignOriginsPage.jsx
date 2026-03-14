import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRadarThreats } from '../api/client';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { motion } from 'framer-motion';
import { MapPin, Skull, Globe2, ExternalLink, RefreshCw, ShieldAlert } from 'lucide-react';
import { cn } from './Navigation';
import McpDossierModal from './McpDossierModal';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Country metadata: ISO-3166 Alpha-3 → display info
const COUNTRY_META = {
    'RUS': { name: 'Russia', coordinates: [105, 61] },
    'CHN': { name: 'China', coordinates: [104, 35] },
    'IRN': { name: 'Iran', coordinates: [53, 32] },
    'PRK': { name: 'North Korea', coordinates: [127, 40] },
    'USA': { name: 'United States', coordinates: [-95, 37] },
    'SDN': { name: 'Sudan', coordinates: [30, 15] },
    'BLR': { name: 'Belarus', coordinates: [28, 53] },
    'PAK': { name: 'Pakistan', coordinates: [69, 30] },
    'IND': { name: 'India', coordinates: [78, 22] },
    'BRA': { name: 'Brazil', coordinates: [-51, -14] },
    'UKR': { name: 'Ukraine', coordinates: [32, 49] },
    'TUR': { name: 'Türkiye', coordinates: [35, 39] },
    'GBR': { name: 'United Kingdom', coordinates: [-2, 54] },
    'VNM': { name: 'Vietnam', coordinates: [108, 16] },
    'LBN': { name: 'Lebanon', coordinates: [35, 34] },
    'SYR': { name: 'Syria', coordinates: [38, 35] },
    'ISR': { name: 'Israel', coordinates: [35, 31] },
    'NGA': { name: 'Nigeria', coordinates: [8, 10] },
    'ROM': { name: 'Romania', coordinates: [25, 45] },
};

// Type badge colors
function TypeBadge({ type }) {
    const map = {
        'Ransomware': 'bg-red-500/15 text-red-400 border-red-500/30',
        'Hacktivist': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
        'APT': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
        'Financially Motivated': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
        'Unknown': 'bg-gray-500/15 text-gray-400 border-gray-500/30',
    };
    const cls = map[type] || map['Unknown'];
    return (
        <span className={cn('inline-flex px-2 py-0.5 rounded text-xs font-mono border', cls)}>{type}</span>
    );
}

export default function CampaignOriginsPage() {
    const [dossierActor, setDossierActor] = useState(null);
    const [hoveredCountry, setHoveredCountry] = useState(null);

    const { data: threatData, isLoading, isFetching, refetch } = useQuery({
        queryKey: ['radar', 'threats'],
        queryFn: fetchRadarThreats,
        staleTime: 5 * 60 * 1000,
        refetchInterval: 5 * 60 * 1000,
    });

    const actors = threatData?.threat_actors || [];

    // Group actors by origin country
    const byCountry = actors.reduce((acc, actor) => {
        const code = actor.origin_country || 'UNK';
        if (!acc[code]) acc[code] = [];
        acc[code].push(actor);
        return acc;
    }, {});

    const activeCountryCodes = Object.keys(byCountry).filter(c => c !== 'UNK');
    const unknownActors = byCountry['UNK'] || [];

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">Campaign Origins Map</h2>
                        <p className="text-sm text-text-muted">Geographic attribution of active APT campaigns (AI-correlated)</p>
                    </div>
                </div>
                <button
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                        "bg-bg-element hover:bg-bg-element-hover border-border-element text-text-muted hover:text-text-base",
                        isFetching && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
                    Refresh
                </button>
            </div>

            {/* Main Map Panel */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-bg-surface/60 backdrop-blur-sm border border-red-500/20 rounded-2xl overflow-hidden shadow-sm"
            >
                {/* Map */}
                <div className="relative w-full bg-bg-element/30 border-b border-border-subtle" style={{ height: '420px' }}>
                    {activeCountryCodes.length === 0 && !isLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-text-muted">
                            <Globe2 className="w-12 h-12 opacity-20" />
                            <p className="text-sm opacity-60 max-w-xs text-center">
                                No geographical origin data has been correlated yet.<br />
                                The AI uses Cloudflare telemetry + OSINT to identify campaign origins.
                            </p>
                        </div>
                    ) : null}

                    <ComposableMap
                        projection="geoMercator"
                        projectionConfig={{ scale: 140, center: [10, 20] }}
                        width={1000}
                        height={420}
                        className="w-full h-full"
                    >
                        <Geographies geography={geoUrl}>
                            {({ geographies }) =>
                                geographies.map((geo) => {
                                    const geoCode = geo.id || geo.properties?.adm0_a3;
                                    const isActive = activeCountryCodes.includes(geoCode);
                                    const isHovered = hoveredCountry === geoCode;
                                    return (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            fill={
                                                isHovered ? "rgba(239,68,68,0.65)" :
                                                isActive ? "rgba(239,68,68,0.35)" :
                                                "rgba(100,116,139,0.12)"
                                            }
                                            stroke="rgba(255,255,255,0.04)"
                                            strokeWidth={0.5}
                                            style={{
                                                default: { outline: "none", transition: "fill 0.2s" },
                                                hover: { fill: "rgba(239,68,68,0.55)", outline: "none", cursor: isActive ? 'pointer' : 'default' },
                                                pressed: { outline: "none" }
                                            }}
                                            onMouseEnter={() => isActive && setHoveredCountry(geoCode)}
                                            onMouseLeave={() => setHoveredCountry(null)}
                                        />
                                    );
                                })
                            }
                        </Geographies>

                        {/* Pulsing Markers for each active country */}
                        {activeCountryCodes.map((code) => {
                            const meta = COUNTRY_META[code];
                            if (!meta) return null;
                            return (
                                <Marker key={code} coordinates={meta.coordinates}>
                                    <circle r={8} fill="rgba(239,68,68,0.25)" />
                                    <circle r={5} fill="#ef4444" className="animate-pulse" />
                                    <circle r={2.5} fill="#ffffff" />
                                </Marker>
                            );
                        })}
                    </ComposableMap>

                    {/* Legend */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-bg-surface/80 backdrop-blur px-3 py-1.5 rounded-lg border border-border-subtle text-xs text-text-muted">
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-red-500/40 border border-red-500/60 inline-block" />
                            Active origin
                        </span>
                        <span className="flex items-center gap-1.5 ml-2">
                            <span className="w-3 h-3 rounded-full bg-slate-500/20 border border-slate-500/20 inline-block" />
                            No activity
                        </span>
                    </div>
                </div>

                {/* Country breakdown beneath the map */}
                {activeCountryCodes.length > 0 && (
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeCountryCodes.map((code) => {
                            const meta = COUNTRY_META[code] || { name: code };
                            const countryActors = byCountry[code] || [];
                            return (
                                <div
                                    key={code}
                                    className="bg-bg-element/40 border border-border-subtle rounded-xl p-4 flex flex-col gap-3"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs bg-red-500/15 text-red-400 px-2 py-0.5 rounded border border-red-500/20">{code}</span>
                                        <span className="font-semibold text-sm">{meta.name}</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {countryActors.map((actor, i) => (
                                            <div key={i} className="border-l-2 border-red-500/30 pl-3 flex flex-col gap-1">
                                                <button
                                                    onClick={() => setDossierActor(actor.name)}
                                                    className="font-bold text-sm text-red-400 hover:text-red-300 hover:underline text-left flex items-center gap-1 group"
                                                >
                                                    <Skull className="w-3 h-3 shrink-0" />
                                                    {actor.name}
                                                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>
                                                <TypeBadge type={actor.type || 'Unknown'} />
                                                {actor.description && (
                                                    <p className="text-xs text-text-muted leading-relaxed opacity-80">{actor.description}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </motion.div>

            {/* Actors with unknown origin */}
            {unknownActors.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-bg-surface/60 border border-border-subtle rounded-2xl p-5"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <ShieldAlert className="w-4 h-4 text-text-muted" />
                        <h3 className="text-sm font-bold uppercase tracking-wide text-text-muted">Origin Unattributed</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {unknownActors.map((actor, i) => (
                            <div key={i} className="border-l-2 border-border-subtle pl-3 flex flex-col gap-1">
                                <button
                                    onClick={() => setDossierActor(actor.name)}
                                    className="font-bold text-sm text-text-base hover:text-red-400 text-left flex items-center gap-1 group"
                                >
                                    {actor.name}
                                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                                <TypeBadge type={actor.type || 'Unknown'} />
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            <McpDossierModal
                isOpen={!!dossierActor}
                actorName={dossierActor}
                onClose={() => setDossierActor(null)}
            />
        </div>
    );
}
