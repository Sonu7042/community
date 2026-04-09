function AdCard({ ad }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-stroke bg-panel shadow-panel">
      <div className="relative">
        <img src={ad.image} alt={ad.title} className="h-36 w-full object-cover" />
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-black">
          Ad
        </span>
      </div>
      <div className="space-y-3 p-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-textSoft">{ad.brand}</p>
          <h3 className="mt-1 text-sm font-semibold leading-5 text-white">{ad.title}</h3>
        </div>
        <button className="w-full rounded-full bg-[#2f2f2f] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#3b3b3b]">
          {ad.cta}
        </button>
        <p className="text-center text-[10px] uppercase tracking-[0.16em] text-textSoft">Advertisement</p>
      </div>
    </article>
  );
}

function RightSidebar({ ads }) {
  return (
    <aside className="space-y-4 xl:sticky xl:top-24">
      {ads.map((ad) => (
        <AdCard key={ad.id} ad={ad} />
      ))}
    </aside>
  );
}

export default RightSidebar;
