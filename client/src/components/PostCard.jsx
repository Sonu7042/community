import { DotsIcon, PlusIcon } from './Icons';
import StatPill from './StatPill';

function PostCard({ post, featured = false }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-stroke bg-panel shadow-panel">
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={post.avatar}
              alt={post.author}
              className="h-10 w-10 rounded-full border border-stroke object-cover"
            />
            <div>
              <h3 className="text-sm font-semibold text-white">{post.author}</h3>
              <p className="text-xs text-textSoft">{`${post.role} | ${post.time}`}</p>
            </div>
          </div>
          <button className="rounded-full p-1 text-textSoft transition hover:bg-[#2d2d2d] hover:text-white">
            <DotsIcon />
          </button>
        </div>

        <div className="mt-3">
          <h4 className="text-[1.02rem] font-medium leading-6 text-white">{post.title}</h4>
          <p className="mt-2 text-sm leading-6 text-[#bbbbbb]">
            {post.excerpt} <span className="text-sky-400">Show more.</span>
          </p>
        </div>
      </div>

      {post.image ? (
        <div className="relative">
          <img
            src={post.image}
            alt={post.title}
            className={`w-full object-cover ${featured ? 'max-h-[270px]' : 'max-h-[620px]'}`}
          />
          {featured ? (
            <button className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/15 text-white backdrop-blur">
              <PlusIcon className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 p-4 pt-3">
        {post.stats.map((stat) => (
          <StatPill
            key={`${stat.type}-${stat.label}`}
            label={stat.label}
            tone={stat.tone}
            type={stat.type}
          />
        ))}
      </div>
    </article>
  );
}

export default PostCard;
