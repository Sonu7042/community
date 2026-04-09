import { useEffect, useState } from 'react';
import LeftSidebar from '../components/LeftSidebar';
import PostCard from '../components/PostCard';
import RightSidebar from '../components/RightSidebar';
import { ads, navItems, resourceItems } from '../data/mockData';

const POSTS_API_URL = 'http://localhost:3000/api/posts';

const formatTimeAgo = (dateString) => {
  const createdAt = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.max(1, Math.floor((now - createdAt) / 60000));

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);

  if (diffInHours < 24) {
    return `${diffInHours}h`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d`;
};

const mapApiPostToCardPost = (post) => ({
  id: post._id,
  author: post.author.username,
  role: 'Community Member',
  time: formatTimeAgo(post.createdAt),
  avatar: post.author.avatar,
  title: post.title,
  excerpt: post.description,
  image: post.image,
  stats: [
    { label: String(post.likesCount || 0), tone: 'info', type: 'like' },
    { label: String(post.commentsCount || 0), tone: 'neutral', type: 'comment' },
    { label: String(post.sharesCount || 0), tone: 'neutral', type: 'share' },
  ],
});

function HomePage() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        setError('');

        const response = await fetch(POSTS_API_URL);
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.message || 'Failed to fetch posts');
        }

        setPosts((data?.posts || []).map(mapApiPostToCardPost));
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <main className="mx-auto grid max-w-[1400px] grid-cols-1 gap-5 px-3 py-5 sm:px-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-6 xl:grid-cols-[260px_minmax(0,1fr)_260px]">
      <div className="order-2 xl:order-1">
        <LeftSidebar navItems={navItems} resourceItems={resourceItems} />
      </div>

      <section className="order-1 min-w-0 space-y-5 xl:order-2">
        {isLoading && (
          <div className="rounded-2xl border border-stroke bg-panel p-6 text-sm text-textSoft shadow-panel">
            Loading posts...
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-2xl border border-red-500/40 bg-panel p-6 text-sm text-red-300 shadow-panel">
            {error}
          </div>
        )}

        {!isLoading && !error && posts.length === 0 && (
          <div className="rounded-2xl border border-stroke bg-panel p-6 text-sm text-textSoft shadow-panel">
            No posts yet. Create the first post from the top bar.
          </div>
        )}

        {!isLoading &&
          !error &&
          posts.map((post, index) => (
            <PostCard key={post.id} post={post} featured={index === 1} />
          ))}
      </section>

      <div className="order-3">
        <RightSidebar ads={ads} />
      </div>
    </main>
  );
}

export default HomePage;
