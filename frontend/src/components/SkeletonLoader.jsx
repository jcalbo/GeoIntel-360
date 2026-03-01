import React from 'react';

export default function SkeletonLoader() {
    return (
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 flex flex-col h-full animate-pulse shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <div className="w-24 h-6 bg-zinc-800 rounded-md"></div>
                <div className="w-20 h-4 bg-zinc-800 rounded-md"></div>
            </div>
            <div className="w-full h-6 bg-zinc-800 rounded-md mb-3"></div>
            <div className="w-4/5 h-6 bg-zinc-800 rounded-md mb-6"></div>

            <div className="flex-1 min-h-[4rem]">
                <div className="w-full h-3 bg-zinc-800/50 rounded mt-1"></div>
                <div className="w-11/12 h-3 bg-zinc-800/50 rounded mt-2"></div>
                <div className="w-4/5 h-3 bg-zinc-800/50 rounded mt-2"></div>
            </div>

            <div className="flex justify-between items-center pt-4 mt-6 border-t border-zinc-800/30">
                <div className="w-24 h-4 bg-zinc-800 rounded-md"></div>
                <div className="flex gap-2">
                    <div className="w-8 h-8 bg-zinc-800 rounded-lg"></div>
                    <div className="w-28 h-8 bg-zinc-800 rounded-lg"></div>
                </div>
            </div>
        </div>
    );
}
