import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchRadarData, fetchRadarThreats } from '../api/client';
import {
    Wifi, AlertCircle, RefreshCw, Activity, ShieldX, Radio,
    TrendingDown, Globe2, Zap, Skull, Building2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from './Navigation';

// ── Skeleton ────────────────────────────────────────────────────────────────
function PanelSkeleton() {
    return (
        <div className="bg-bg-surface/60 border border-border-subtle rounded-2xl p-6 flex flex-col gap-4 animate-pulse">
            <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-bg-element rounded-xl" />
                <div className="h-4 w-1/3 bg-bg-element rounded-md" />
            </div>
            <div className="space-y-3 pt-2">
                <div className="h-3 bg-bg-element rounded w-full" />
                <div className="h-3 bg-bg-element rounded w-5/6" />
                <div className="h-3 bg-bg-element rounded w-4/6" />
            </div>
        </div>
    );
}

// ── Threat Panels ────────────────────────────────────────────────────────────

function ThreatActorPanel({ actors, isLoading }) {
    if (isLoading) return <PanelSkeleton />;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-bg-surface/60 backdrop-blur-sm border border-red-500/20 rounded-2xl p-6 flex flex-col gap-4 shadow-sm"
        >
            <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                    <Skull className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm tracking-wide uppercase text-text-muted">Active Threat Actor Campaigns</h3>
            </div>

            {actors && actors.length > 0 ? (
                <div className="space-y-4 flex-1">
                    {actors.map((actor, i) => (
                        <div key={i} className="flex flex-col gap-1 border-l-2 border-red-500/30 pl-3">
                            <div className="flex items-baseline justify-between">
                                <span className="font-bold text-red-400 text-sm">{actor.name}</span>
                                <span className="text-xs text-text-muted px-2 py-0.5 bg-bg-element rounded-md font-mono">{actor.type}</span>
                            </div>
                            <p className="text-xs text-text-base opacity-80 leading-relaxed">{actor.description}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-text-muted gap-3">
                    <ShieldX className="w-8 h-8 opacity-30" />
                    <p className="text-sm text-center opacity-60">No active actor campaigns correlated.</p>
                </div>
            )}
        </motion.div>
    );
}

function VictimsPanel({ victims, isLoading }) {
    if (isLoading) return <PanelSkeleton />;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-bg-surface/60 backdrop-blur-sm border border-orange-500/20 rounded-2xl p-6 flex flex-col gap-4 shadow-sm"
        >
            <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                    <Building2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm tracking-wide uppercase text-text-muted">Targeted Enterprises & Victims</h3>
            </div>

            {victims && victims.length > 0 ? (
                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-text-muted uppercase bg-bg-element/50 border-b border-border-subtle">
                            <tr>
                                <th className="px-3 py-2 rounded-tl-lg">Target</th>
                                <th className="px-3 py-2">Industry</th>
                                <th className="px-3 py-2 rounded-tr-lg">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle/50">
                            {victims.map((v, i) => (
                                <tr key={i} className="hover:bg-bg-element/30 transition-colors">
                                    <td className="px-3 py-2.5 font-medium text-text-base">{v.name}</td>
                                    <td className="px-3 py-2.5 text-text-muted">{v.industry}</td>
                                    <td className="px-3 py-2.5">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-500/10 text-orange-400">
                                            {v.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-text-muted gap-3">
                    <Building2 className="w-8 h-8 opacity-30" />
                    <p className="text-sm text-center opacity-60">No targeted enterprises correlated.</p>
                </div>
            )}
        </motion.div>
    );
}

// ── Single data panel ────────────────────────────────────────────────────────
function RadarPanel({ title, icon: Icon, iconColor, borderColor, glowColor, content, emptyLabel }) {
    const lines = content?.split('\n').filter(Boolean) || [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={cn(
                "bg-bg-surface/60 backdrop-blur-sm border rounded-2xl p-6 flex flex-col gap-4 shadow-sm",
                "hover:shadow-xl transition-shadow duration-300",
                borderColor
            )}
            style={{ boxShadow: content ? `0 0 30px -8px ${glowColor}` : undefined }}
        >
            {/* Header */}
            <div className="flex items-center gap-2.5">
                <div className={cn("p-2 rounded-xl bg-bg-element/60", iconColor.replace('text-', 'bg-').replace('#', '') + '/10')}>
                    <Icon className={cn("w-4 h-4", iconColor)} />
                </div>
                <h3 className="font-bold text-sm tracking-wide uppercase text-text-muted">{title}</h3>
            </div>

            {/* Content */}
            {lines.length > 0 ? (
                <div className="flex-1 space-y-2 text-sm leading-relaxed text-text-base font-mono">
                    {lines.map((line, i) => {
                        const segments = line.split('**');
                        return (
                            <p key={i} className={cn("border-l-2 pl-3 py-1", borderColor)}>
                                {segments.map((seg, j) => (
                                    j % 2 === 1
                                        ? <strong key={j} className="text-text-base brightness-125">{seg}</strong>
                                        : <span key={j} className="text-text-muted">{seg}</span>
                                ))}
                            </p>
                        );
                    })}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-text-muted gap-3">
                    <Globe2 className="w-8 h-8 opacity-30" />
                    <p className="text-sm text-center opacity-60">{emptyLabel}</p>
                </div>
            )}
        </motion.div>
    );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function RadarDashboard() {
    const queryClient = useQueryClient();

    const { data: radarData, isLoading: radarLoading, isError: radarError, error: radarErrorMsg, isFetching: radarFetching, dataUpdatedAt: radarUpdated } = useQuery({
        queryKey: ['radar', 'telemetry'],
        queryFn: fetchRadarData,
        staleTime: 5 * 60 * 1000,
        refetchInterval: 5 * 60 * 1000,
    });

    const { data: threatData, isLoading: threatLoading, isFetching: threatFetching } = useQuery({
        queryKey: ['radar', 'threats'],
        queryFn: fetchRadarThreats,
        staleTime: 5 * 60 * 1000,
        refetchInterval: 5 * 60 * 1000,
    });

    const lastUpdated = radarUpdated
        ? new Date(radarUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : null;

    if (radarError) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-red-400 bg-red-950/10 border border-red-900/30 rounded-2xl">
                <AlertCircle className="w-10 h-10 opacity-80" />
                <h3 className="text-lg font-bold font-mono">RADAR_FEED_OFFLINE</h3>
                <p className="text-sm opacity-70 max-w-sm text-center">
                    Could not reach the Cloudflare Radar intelligence pipeline.
                    Ensure the backend is running and your API token is valid.
                </p>
                <span className="text-xs font-mono opacity-40 mt-1">{radarErrorMsg?.message}</span>
            </div>
        );
    }

    const isFetchingAny = radarFetching || threatFetching;

    const panels = [
        {
            key: 'traffic',
            title: 'Global Traffic',
            icon: Activity,
            iconColor: 'text-[#f38020]',
            borderColor: 'border-[#f38020]/30',
            glowColor: 'rgba(243,128,32,0.25)',
            content: radarData?.traffic,
            emptyLabel: 'No global traffic anomalies detected.',
        },
        {
            key: 'outages',
            title: 'Active Outages',
            icon: ShieldX,
            iconColor: 'text-red-400',
            borderColor: 'border-red-500/30',
            glowColor: 'rgba(239,68,68,0.2)',
            content: radarData?.outages,
            emptyLabel: 'No active internet outages reported.',
        },
        {
            key: 'attacks',
            title: 'Attack Trends',
            icon: Zap,
            iconColor: 'text-yellow-400',
            borderColor: 'border-yellow-500/30',
            glowColor: 'rgba(234,179,8,0.15)',
            content: radarData?.attacks,
            emptyLabel: 'No significant attack trends in the last 24h.',
        },
    ];

    return (
        <div className="flex flex-col gap-6">

            {/* Tab header bar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#f38020]/40 bg-[#f38020]/10 text-[#f38020] text-xs font-bold tracking-wider">
                        <span className="relative flex h-2 w-2">
                            <span className={cn(
                                "absolute inline-flex h-full w-full rounded-full opacity-75",
                                isFetchingAny ? "animate-ping bg-[#f38020]" : "bg-[#f38020]/0"
                            )} />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#f38020]" />
                        </span>
                        LIVE
                    </div>
                    <span className="text-text-muted text-sm">
                        Cloudflare Radar — real-time global internet intelligence
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {lastUpdated && (
                        <span className="text-xs text-text-muted font-mono">
                            Updated {lastUpdated}
                        </span>
                    )}
                    <button
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['radar'] })}
                        disabled={isFetchingAny}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                            "bg-bg-element hover:bg-bg-element-hover border-border-element",
                            "text-text-muted hover:text-text-base",
                            isFetchingAny && "opacity-50 cursor-not-allowed"
                        )}
                        title="Refresh Cloudflare Radar data"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", isFetchingAny && "animate-spin")} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Top 3-column panels (Telemetry) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {radarLoading
                    ? [1, 2, 3].map(k => <PanelSkeleton key={k} />)
                    : panels.map(p => <RadarPanel key={p.key} {...p} />)
                }
            </div>

            {/* Bottom 2-column panels (Threat Intel) */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
                <div className="md:col-span-2">
                    <ThreatActorPanel actors={threatData?.threat_actors} isLoading={threatLoading} />
                </div>
                <div className="md:col-span-3">
                    <VictimsPanel victims={threatData?.victims} isLoading={threatLoading} />
                </div>
            </div>

            {/* Footer attribution */}
            <div className="flex items-center gap-2 justify-end text-xs text-text-muted pt-2 opacity-50">
                <Radio className="w-3 h-3" />
                <span>Data sourced from Cloudflare Radar MCP · Last 24 hours</span>
            </div>
        </div>
    );
}
