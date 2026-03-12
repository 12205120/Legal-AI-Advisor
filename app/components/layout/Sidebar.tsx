"use client";

export default function Sidebar({
  active,
  setActive
}: {
  active: string;
  setActive: (tab: string) => void;
}) {
  const items = [
    "Trainer",
    "Mapper",
    "Bail",
    "Profile",
  ];

  return (
    <div className="w-64 bg-black/60 backdrop-blur-xl border-r border-cyan-500/20 p-6">
      <h1 className="text-2xl font-bold text-cyan-400 mb-10 tracking-widest">
        NYAYA AI
      </h1>

      {items.map((item) => (
        <div
          key={item}
          onClick={() => setActive(item.toLowerCase())}
          className={`p-3 mb-3 rounded-xl cursor-pointer transition-all duration-300 ${
            active === item.toLowerCase()
              ? "bg-cyan-500/20 border border-cyan-400 shadow-lg shadow-cyan-500/20"
              : "hover:bg-white/5"
          }`}
        >
          {item}
        </div>
      ))}
    </div>
  );
}