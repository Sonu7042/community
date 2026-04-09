import { CommentIcon, ShareIcon, UpIcon } from './Icons';

const iconMap = {
  like: UpIcon,
  comment: CommentIcon,
  share: ShareIcon,
};

function StatPill({ label, tone, type = 'like' }) {
  const Icon = iconMap[type] || UpIcon;
  const isLike = tone === 'info';

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-[#31363b] px-4 py-2 text-base font-medium text-[#eef2f7]">
      <span className={isLike ? 'text-[#61c2ff]' : 'text-[#d6dbe1]'}>
        <Icon className="h-4 w-4" />
      </span>
      <span>{label}</span>
    </div>
  );
}

export default StatPill;
