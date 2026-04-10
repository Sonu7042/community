import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CommentIcon, DotsIcon, DownIcon, PlusIcon, ShareIcon, UpIcon } from './Icons';
import PdfPreview from './PdfPreview';
import { API_BASE_URL } from '../../domain';

const statIconMap = {
  comment: CommentIcon,
  share: ShareIcon,
};

const getExcerptPreview = (excerpt = '', wordLimit = 10) => {
  const words = excerpt.trim().split(/\s+/).filter(Boolean);

  if (words.length <= wordLimit) {
    return {
      text: excerpt,
      hasMore: false,
    };
  }

  return {
    text: `${words.slice(0, wordLimit).join(' ')}...`,
    hasMore: true,
  };
};

function PostCard({ post, featured = false, onToggleLike, onShare, onRequireAuth }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const excerptPreview = getExcerptPreview(post.excerpt, 10);
  const secondaryStats = [
    {
      type: 'comment',
      label: post.commentsLabel,
      to: `/posts/${post.id}/discussion`,
    },
    {
      type: 'share',
      label: post.sharesLabel,
    },
  ];

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
            {isExpanded ? post.excerpt : excerptPreview.text}{' '}
            {excerptPreview.hasMore && !isExpanded ? (
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="text-sky-400 transition hover:text-sky-300"
              >
                Show more.
              </button>
            ) : null}
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

      {!post.image && post.pdf ? (
        <div className="px-4 pb-1">
          <PdfPreview
            pdfUrl={post.pdf}
            pdfName={post.pdfName}
            downloadUrl={`${API_BASE_URL}/posts/${post.id}/download`}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 p-4 pt-3">
        <button
          type="button"
          onClick={() => onToggleLike?.(post.id)}
          disabled={post.isLiking}
          className={`inline-flex items-center gap-3 rounded-full px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-70 ${
            post.isLiked
              ? 'bg-[#1f3a4d] text-[#f5fbff] hover:bg-[#27485f]'
              : 'bg-[#313131] text-[#f5f5f5] hover:bg-[#3a3a3a]'
          }`}
        >
          <span className={post.isLiked ? 'text-[#56b7ff]' : 'text-[#8bcfff]'}>
            <UpIcon className="h-4 w-4" />
          </span>
          <span>{post.likesLabel}</span>
          <span className={post.isLiked ? 'text-[#9ec7de]' : 'text-[#d1d1d1]'}>
            <DownIcon className="h-4 w-4" />
          </span>
        </button>

        {secondaryStats.map((stat) => {
          const Icon = statIconMap[stat.type] || CommentIcon;
          const className =
            'inline-flex items-center gap-2 rounded-full bg-[#313131] px-4 py-2 text-sm font-medium text-[#f5f5f5] transition hover:bg-[#3a3a3a]';

          if (stat.to) {
            return (
              <Link key={`${stat.type}-${stat.label}`} to={stat.to} className={className}>
                <span className="text-[#e1e1e1]">
                  <Icon className="h-4 w-4" />
                </span>
                <span>{stat.label}</span>
              </Link>
            );
          }

          return (
            <button
              key={`${stat.type}-${stat.label}`}
              type="button"
              onClick={
                stat.type === 'share'
                  ? () => onShare?.(post)
                  : () => onRequireAuth?.()
              }
              disabled={stat.type === 'share' ? post.isSharing : false}
              className={`${className} disabled:cursor-not-allowed disabled:opacity-70`}
            >
              <span className="text-[#e1e1e1]">
                <Icon className="h-4 w-4" />
              </span>
              <span>{stat.label}</span>
            </button>
          );
        })}
      </div>
    </article>
  );
}

export default PostCard;
