import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PostCard from '../components/PostCard';
import { API_BASE_URL } from '../../domain';

const AUTH_STORAGE_KEY = 'mycommunityUser';
const POSTS_API_URL = `${API_BASE_URL}/posts`;

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

const formatCompactCount = (value) => {
  if (!Number.isFinite(value)) {
    return '0';
  }

  if (value < 1000) {
    return String(value);
  }

  if (value < 1000000) {
    const compactValue = (value / 1000).toFixed(value % 1000 === 0 ? 0 : 1);
    return `${compactValue.replace(/\.0$/, '')}k`;
  }

  const compactValue = (value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1);
  return `${compactValue.replace(/\.0$/, '')}M`;
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
  pdf: post.pdf || '',
  pdfName: post.pdfName || '',
  likesCount: Number(post.likesCount || 0),
  likesLabel: formatCompactCount(Number(post.likesCount || 0)),
  commentsCount: Number(post.commentsCount || 0),
  commentsLabel: formatCompactCount(Number(post.commentsCount || 0)),
  sharesCount: Number(post.sharesCount || 0),
  sharesLabel: formatCompactCount(Number(post.sharesCount || 0)),
  isLiked: Boolean(post.isLiked),
  isLiking: false,
  isSharing: false,
});

function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [likeError, setLikeError] = useState('');
  const [shareError, setShareError] = useState('');

  const redirectToLogin = () => {
    const redirect = `${location.pathname}${location.search}`;
    navigate(`/auth?mode=login&redirect=${encodeURIComponent(redirect)}`);
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        setError('');
        setLikeError('');
        setShareError('');

        const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
        const parsedUser = savedUser ? JSON.parse(savedUser) : null;
        const queryString = parsedUser?.id ? `?userId=${parsedUser.id}` : '';

        const response = await fetch(`${POSTS_API_URL}${queryString}`);
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

  const handleToggleLike = async (postId) => {
    const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    const loggedInUser = savedUser ? JSON.parse(savedUser) : null;

    if (!loggedInUser?.id) {
      redirectToLogin();
      return;
    }

    const targetPost = posts.find((post) => post.id === postId);

    if (!targetPost || targetPost.isLiking) {
      return;
    }

    setLikeError('');

    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiking: true,
              isLiked: !post.isLiked,
              likesCount: post.isLiked ? Math.max(0, post.likesCount - 1) : post.likesCount + 1,
              likesLabel: formatCompactCount(
                post.isLiked ? Math.max(0, post.likesCount - 1) : post.likesCount + 1
              ),
            }
          : post
      )
    );

    try {
      const response = await fetch(`${POSTS_API_URL}/${postId}/like`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: loggedInUser.id,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to update like');
      }

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                ...mapApiPostToCardPost(data.post),
                isLiking: false,
              }
            : post
        )
      );
    } catch (likeRequestError) {
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId ? { ...targetPost, isLiking: false } : post
        )
      );
      setLikeError(likeRequestError.message);
    }
  };

  const handleShare = async (post) => {
    const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    const loggedInUser = savedUser ? JSON.parse(savedUser) : null;

    if (!loggedInUser?.id) {
      redirectToLogin();
      return;
    }

    const shareUrl = `${window.location.origin}/posts/${post.id}/discussion`;
    const shareData = {
      title: post.title,
      text: post.excerpt,
      url: shareUrl,
    };

    setShareError('');

    setPosts((currentPosts) =>
      currentPosts.map((currentPost) =>
        currentPost.id === post.id ? { ...currentPost, isSharing: true } : currentPost
      )
    );

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        throw new Error('Sharing is not supported in this browser');
      }

      const response = await fetch(`${POSTS_API_URL}/${post.id}/share`, {
        method: 'PATCH',
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to update share count');
      }

      setPosts((currentPosts) =>
        currentPosts.map((currentPost) =>
          currentPost.id === post.id
            ? {
                ...currentPost,
                ...mapApiPostToCardPost(data.post),
                isSharing: false,
              }
            : currentPost
        )
      );
    } catch (shareRequestError) {
      setPosts((currentPosts) =>
        currentPosts.map((currentPost) =>
          currentPost.id === post.id ? { ...currentPost, isSharing: false } : currentPost
        )
      );

      if (shareRequestError.name !== 'AbortError') {
        setShareError(shareRequestError.message);
      }
    }
  };

  return (
    <section className="space-y-5">
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

      {!isLoading && !error && likeError && (
        <div className="rounded-2xl border border-amber-500/40 bg-panel p-4 text-sm text-amber-200 shadow-panel">
          {likeError}
        </div>
      )}

      {!isLoading && !error && shareError && (
        <div className="rounded-2xl border border-amber-500/40 bg-panel p-4 text-sm text-amber-200 shadow-panel">
          {shareError}
        </div>
      )}

      {!isLoading &&
        !error &&
        posts.map((post, index) => (
          <PostCard
            key={post.id}
            post={post}
            featured={index === 1}
            onToggleLike={handleToggleLike}
            onShare={handleShare}
            onRequireAuth={redirectToLogin}
          />
        ))}
    </section>
  );
}

export default HomePage;
