import React from "react";

const PATHS = {
  target: ["M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z","M12 6a6 6 0 1 0 6 6 6 6 0 0 0-6-6Z","M12 10a2 2 0 1 0 2 2 2 2 0 0 0-2-2Z","M5.7 5.7 8.5 8.5M15.5 15.5l2.8 2.8"],
  coach: ["M6 3h12a2 2 0 0 1 2 2v16H4V5a2 2 0 0 1 2-2Z","M9 3.5V2h6v1.5","M7.5 9h9M7.5 13h4","M14 13h2.5v4H14z"],
  training: ["M4 18c3.5-7.5 8-11 16-12","m15 1 1-4 4 1","M5 20h14","M8 15.5a4 4 0 0 0 8 0"],
  momentum: ["M4 17 9 12l3 3 8-9","M16 6h4v4"],
  streak: ["M12.5 2.5c1.2 4.2-1.8 5.2-.3 8.1 1.2 2.2 4.8 1.9 4.8 5.7A5 5 0 0 1 7 16c0-2.7 1.6-4.5 3.8-6.5-.3 2.4 1.7 3.3 2.9 1.9 1.3-1.5.1-4.9-1.2-8.9Z"],
  team: ["M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM15.5 10a2.5 2.5 0 1 0 0-5","M3 21v-2a5.5 5.5 0 0 1 11 0v2M14 15.5a4.5 4.5 0 0 1 7 3.7V21"],
  calendar: ["M4 5h16v15H4z","M8 3v4M16 3v4M4 10h16","M8 14h3M13 14h3M8 17h3"],
  trophy: ["M8 3h8v5a4 4 0 0 1-8 0Z","M12 12v5M8 21h8M9 17h6","M8 5H5v2a4 4 0 0 0 4 4M16 5h3v2a4 4 0 0 1-4 4"],
  profile: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z","M4 21a8 8 0 0 1 16 0"],
  store: ["M5 8h14l-1 13H6Z","M9 8a3 3 0 0 1 6 0"],
  chart: ["M4 20V11M10 20V7M16 20V4M22 20H2"],
  check: ["m5 12 4 4L19 6"],
  alert: ["M12 3 2.8 20h18.4Z","M12 9v4M12 17h.01"],
  plus: ["M12 5v14M5 12h14"],
  arrow: ["M5 12h14m-6-6 6 6-6 6"],
  spark: ["m12 2 1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7L12 2Z","m18 15 .9 2.6 2.6.9-2.6.9L18 22l-.9-2.6-2.6-.9 2.6-.9Z"],
};

export default function ShotLabIcon({ name = "target", size = 22, title, className = "" }) {
  const paths = PATHS[name] || PATHS.target;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" role={title ? "img" : undefined} aria-hidden={title ? undefined : "true"}>
      {title ? <title>{title}</title> : null}
      {paths.map((path, index) => <path key={`${name}-${index}`} d={path} />)}
    </svg>
  );
}
