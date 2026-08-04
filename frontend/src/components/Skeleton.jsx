import React from 'react';

const Skeleton = ({ className = '', style }) => (
    <div
        className={`animate-pulse bg-gray-200/90 ${className}`}
        style={style}
        aria-hidden="true"
    />
);

export const SkeletonText = ({ lines = 4, className = '' }) => (
    <div className={`flex flex-col gap-3 ${className}`} aria-hidden="true">
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton key={i} className={`h-5 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
        ))}
    </div>
);

export const SkeletonBlogCard = () => (
    <div className="bg-white h-full flex flex-col border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" aria-hidden="true">
        <Skeleton className="h-48 border-b-[3px] border-black rounded-none" />
        <div className="p-6 flex flex-col flex-grow gap-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-4/5" />
            <Skeleton className="h-4 w-full mt-2" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex items-center justify-between pt-4 border-t-2 border-black/10 mt-auto">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
            </div>
        </div>
    </div>
);

export const SkeletonProjectCard = () => (
    <div className="bg-white p-6 md:p-10 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col mb-12 lg:mb-0" aria-hidden="true">
        <div className="flex flex-col md:flex-row gap-8">
            <Skeleton className="w-16 h-16 md:w-24 md:h-24 shrink-0 border-[3px] border-black rounded-none" />
            <div className="flex-grow flex flex-col gap-4">
                <Skeleton className="h-10 w-2/3" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-1/2" />
            </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-8">
            <Skeleton className="h-8 w-20 border-2 border-black rounded-none" />
            <Skeleton className="h-8 w-28 border-2 border-black rounded-none" />
            <Skeleton className="h-8 w-24 border-2 border-black rounded-none" />
        </div>
    </div>
);

export const SkeletonSkillPills = ({ count = 10 }) => (
    <div className="flex flex-wrap gap-4 md:gap-6 p-6" aria-hidden="true">
        {Array.from({ length: count }).map((_, i) => (
            <Skeleton
                key={i}
                className={`h-12 px-10 border-[3px] border-black rounded-none ${
                    i % 3 === 0 ? 'w-36' : i % 3 === 1 ? 'w-44' : 'w-32'
                }`}
            />
        ))}
    </div>
);

export { Skeleton };

export default Skeleton;
