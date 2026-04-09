import { ArrowRightIcon } from './Icons';

function LeftSidebar({ navItems, resourceItems }) {
  return (
    <aside className="space-y-4 xl:sticky xl:top-24">
      <section className="rounded-2xl border border-stroke bg-panel p-4 shadow-panel">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Domains</h2>
          <button className="rounded-full border border-stroke bg-[#262626] px-3 py-1 text-xs text-textSoft">
            New
          </button>
        </div>
        <div className="space-y-3">
          {navItems.map((item, index) => (
            <button
              key={item}
              className={`block w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                index === 0
                  ? 'bg-[#2b2b2b] text-white'
                  : 'text-textSoft hover:bg-[#272727] hover:text-white'
              }`}
            >
              {index + 1}. {item}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-stroke bg-panel p-4 shadow-panel">
        <h2 className="mb-4 text-sm font-semibold text-white">Resources</h2>
        <div className="space-y-3">
          {resourceItems.map((item) => (
            <button
              key={item.title}
              className="flex w-full items-center justify-between rounded-xl bg-[#262626] px-3 py-3 text-sm text-white transition hover:bg-[#2d2d2d]"
            >
              <span className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-sm ${item.color}`} />
                {item.title}
              </span>
              <ArrowRightIcon className="h-4 w-4 text-textSoft" />
            </button>
          ))}
        </div>
      </section>

      <p className="px-1 text-xs leading-5 text-textSoft">
        About us, Terms, Privacy, Ad choices, Talent, discussion.
      </p>
    </aside>
  );
}

export default LeftSidebar;
