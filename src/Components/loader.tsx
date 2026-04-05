import React from "react";

type SkeletonProps = {
    width?: number | string;
    height?: number | string;
    radius?: number;
};

export const Skeleton: React.FC<SkeletonProps> = ({
    width = "100%",
    height = 14,
    radius = 10,
}) => {
    return (
        <div
            style={{
                width,
                height,
                borderRadius: radius,
                background:
                    "linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.12) 37%, rgba(0,0,0,0.06) 63%)",
                backgroundSize: "400% 100%",
                animation: "rtShimmer 1.2s ease-in-out infinite",
            }}
            aria-busy="true"
        >
            <style>
                {`
          @keyframes rtShimmer {
            0% { background-position: 100% 0; }
            100% { background-position: 0 0; }
          }
        `}
            </style>
        </div>
    );
};
