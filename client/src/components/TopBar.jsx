import {
  BellIcon,
  BriefcaseIcon,
  FireIcon,
  GridIcon,
  HomeIcon,
  SearchIcon,
  ShieldIcon,
} from './Icons';

const topIcons = [HomeIcon, FireIcon, GridIcon, BriefcaseIcon, ShieldIcon];

function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-stroke/80 bg-[#1c1c1c]/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-3 py-3 sm:px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex items-end gap-[2px]">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            <span className="h-2.5 w-1 rounded-full bg-sky-400" />
            <span className="h-4 w-1 rounded-full bg-orange-500" />
            <span className="h-3 w-1 rounded-full bg-sky-400" />
            <span className="h-5 w-1 rounded-full bg-orange-500" />
          </div>
          <div className="hidden items-center gap-2 text-textSoft md:flex">
            {topIcons.map((Icon, index) => (
              <button
                key={index}
                className="rounded-full border border-transparent p-2 transition hover:border-stroke hover:bg-panel"
              >
                <Icon />
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto hidden max-w-xl flex-1 items-center md:flex">
          <div className="flex w-full items-center gap-3 rounded-full border border-accent/60 bg-[#111111] px-4 py-2 text-sm text-textSoft">
            <SearchIcon className="h-4 w-4 shrink-0" />
            <input
              type="text"
              placeholder="Find anything..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-textSoft"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="hidden rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 sm:inline-flex">
            Post
          </button>
          <button className="rounded-full border border-stroke bg-panel p-2 text-textSoft transition hover:text-white">
            <BellIcon />
          </button>
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"
            alt="Profile"
            className="h-9 w-9 rounded-full border border-stroke object-cover"
          />
        </div>
      </div>
      <div className="border-t border-stroke/60 px-3 py-3 md:hidden">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 rounded-full border border-accent/60 bg-[#111111] px-4 py-2 text-sm text-textSoft">
          <SearchIcon className="h-4 w-4 shrink-0" />
          <input
            type="text"
            placeholder="Find anything..."
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-textSoft"
          />
        </div>
      </div>
    </header>
  );
}

export default TopBar;
