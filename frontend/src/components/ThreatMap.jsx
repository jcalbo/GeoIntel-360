import React from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { Globe2 } from 'lucide-react';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Approximate center longitude/latitude for common state actors
const countryCoordinates = {
    'RUS': [105, 61],
    'CHN': [104, 35],
    'IRN': [53, 32],
    'PRK': [127, 40],
    'USA': [-95, 37],
    'SDN': [30, 15]
};

export default function ThreatMap({ actors }) {
    // Collect unique origin countries
    const activeOrigins = [...new Set(actors?.map(a => a.origin_country).filter(Boolean) || [])];
    
    return (
        <div className="bg-bg-surface/60 backdrop-blur-sm border border-accent-blue/20 rounded-2xl p-6 h-full flex flex-col gap-4 shadow-sm h-full">
             <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-accent-blue/10 text-accent-blue">
                    <Globe2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm tracking-wide uppercase text-text-muted flex-1">Campaign Origins Map</h3>
            </div>
            
            <div className="flex-1 bg-bg-element/20 rounded-xl overflow-hidden relative flex items-center justify-center min-h-[min(300px,30vh)]">
                {activeOrigins.length === 0 ? (
                    <p className="text-sm text-center text-text-muted opacity-60">No geographical origin data correlated.</p>
                ) : (
                    <ComposableMap
                        projection="geoMercator"
                        projectionConfig={{ scale: 120 }}
                        width={800}
                        height={400}
                        className="w-full h-full opacity-80 mix-blend-screen"
                    >
                        <Geographies geography={geoUrl}>
                            {({ geographies }) =>
                                geographies.map((geo) => {
                                    const isTarget = activeOrigins.includes(geo.id || geo.properties.adm0_a3);
                                    return (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            fill={isTarget ? "rgba(239, 68, 68, 0.4)" : "rgba(100, 116, 139, 0.15)"}
                                            stroke="rgba(255, 255, 255, 0.05)"
                                            strokeWidth={0.5}
                                            style={{
                                                default: { outline: "none" },
                                                hover: { fill: "rgba(239, 68, 68, 0.6)", outline: "none" },
                                                pressed: { outline: "none" }
                                            }}
                                        />
                                    );
                                })
                            }
                        </Geographies>
                        {activeOrigins.map((countryCode) => {
                            const coordinates = countryCoordinates[countryCode];
                            if (!coordinates) return null;
                            return (
                                <Marker key={countryCode} coordinates={coordinates}>
                                    <circle r={6} fill="#ef4444" className="animate-pulse" />
                                    <circle r={2} fill="#ffffff" />
                                </Marker>
                            );
                        })}
                    </ComposableMap>
                )}
            </div>
        </div>
    );
}
