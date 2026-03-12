export default function FloatingParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl absolute top-10 left-10 animate-pulse" />
      <div className="w-96 h-96 bg-purple-500/10 rounded-full blur-3xl absolute bottom-10 right-10 animate-pulse" />
    </div>
  );
}