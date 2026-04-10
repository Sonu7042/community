import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CommentThread from '../components/CommentThread';
import PdfPreview from '../components/PdfPreview';
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

const mapCommentTree = (comments = []) =>
  comments.map((comment) => ({
    id: comment._id,
    author: comment.author.username,
    avatar: comment.author.avatar,
    message: comment.message,
    time: formatTimeAgo(comment.createdAt),
    replies: mapCommentTree(comment.replies || []),
  }));

const mapPostToDiscussion = (post) => ({
  id: post._id,
  author: post.author.username,
  avatar: post.author.avatar,
  title: post.title,
  excerpt: post.description,
  image: post.image,
  pdf: post.pdf || '',
  pdfName: post.pdfName || '',
  time: formatTimeAgo(post.createdAt),
  commentsCount: Number(post.commentsCount || 0),
  comments: mapCommentTree(post.comments || []),
});

function DiscussionPage() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [commentMessage, setCommentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCommenting, setIsCommenting] = useState(false);
  const [replyingToCommentId, setReplyingToCommentId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoading(true);
        setError('');

        const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
        const parsedUser = savedUser ? JSON.parse(savedUser) : null;
        const queryString = parsedUser?.id ? `?userId=${parsedUser.id}` : '';

        const response = await fetch(`${POSTS_API_URL}/${postId}${queryString}`);
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.message || 'Failed to fetch discussion');
        }

        setPost(mapPostToDiscussion(data.post));
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const handleAddComment = async () => {
    const trimmedMessage = commentMessage.trim();

    if (!trimmedMessage) {
      return { success: false };
    }

    const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    const loggedInUser = savedUser ? JSON.parse(savedUser) : null;

    if (!loggedInUser?.id) {
      setError('Please login first to comment on a post.');
      return { success: false };
    }

    setIsCommenting(true);
    setError('');

    try {
      const response = await fetch(`${POSTS_API_URL}/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: loggedInUser.id,
          username: loggedInUser.username,
          avatar: loggedInUser.avatar,
          message: trimmedMessage,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.errors?.join(', ') || data?.message || 'Failed to add comment');
      }

      setPost(mapPostToDiscussion(data.post));
      setCommentMessage('');
      return { success: true };
    } catch (commentError) {
      setError(commentError.message);
      return { success: false };
    } finally {
      setIsCommenting(false);
    }
  };

  const handleAddReply = async (targetPostId, commentId, message) => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return { success: false };
    }

    const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    const loggedInUser = savedUser ? JSON.parse(savedUser) : null;

    if (!loggedInUser?.id) {
      setError('Please login first to reply to a comment.');
      return { success: false };
    }

    setReplyingToCommentId(commentId);
    setError('');

    try {
      const response = await fetch(`${POSTS_API_URL}/${targetPostId}/comments/${commentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: loggedInUser.id,
          username: loggedInUser.username,
          avatar: loggedInUser.avatar,
          message: trimmedMessage,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.errors?.join(', ') || data?.message || 'Failed to add reply');
      }

      setPost(mapPostToDiscussion(data.post));
      return { success: true };
    } catch (replyError) {
      setError(replyError.message);
      return { success: false };
    } finally {
      setReplyingToCommentId('');
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#262626] px-5 py-2 text-sm text-textSoft transition hover:text-white"
        >
          Back to feed
          <span className="text-xs">&larr;</span>
        </Link>

        {isLoading && (
          <div className="rounded-2xl border border-stroke bg-panel p-6 text-sm text-textSoft shadow-panel">
            Loading discussion...
          </div>
        )}

        {!isLoading && error && (
          <div className="mb-5 rounded-2xl border border-amber-500/40 bg-panel p-4 text-sm text-amber-200 shadow-panel">
            {error}
          </div>
        )}

        {!isLoading && post && (
          <div className="space-y-5">
            <article className="overflow-hidden rounded-2xl border border-stroke bg-panel shadow-panel">
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <img
                    src={post.avatar}
                    alt={post.author}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                  <div>
                    <h1 className="text-base font-semibold text-white">{post.author}</h1>
                    <p className="text-xs text-textSoft">{post.time}</p>
                  </div>
                </div>

                <h2 className="mt-4 text-xl font-semibold text-white">{post.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[#c9c9c9]">{post.excerpt}</p>
              </div>

              {post.image ? (
                <img src={post.image} alt={post.title} className="max-h-[520px] w-full object-cover" />
              ) : null}

              {!post.image && post.pdf ? (
                <div className="border-t border-stroke/70 px-5 py-5">
                  <PdfPreview
                    pdfUrl={post.pdf}
                    pdfName={post.pdfName}
                    downloadUrl={`${POSTS_API_URL}/${post.id}/download`}
                  />
                </div>
              ) : null}
            </article>

            <section className="rounded-2xl border border-stroke bg-panel p-5 shadow-panel">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">Discussion</h3>
                  <p className="text-sm text-textSoft">{post.commentsCount} total messages</p>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <textarea
                  value={commentMessage}
                  onChange={(event) => setCommentMessage(event.target.value)}
                  placeholder="Join the discussion..."
                  className="min-h-[72px] flex-1 resize-none rounded-2xl border border-stroke bg-[#171717] px-4 py-3 text-sm text-white outline-none placeholder:text-textSoft focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  disabled={isCommenting}
                  className="self-end rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isCommenting ? 'Sending...' : 'Comment'}
                </button>
              </div>

              <div className="mt-6">
                {post.comments.length === 0 ? (
                  <div className="rounded-2xl border border-stroke bg-[#181818] px-4 py-3 text-sm text-textSoft">
                    No discussion yet. Start the first thread.
                  </div>
                ) : (
                  <CommentThread
                    comments={post.comments}
                    postId={post.id}
                    onReply={handleAddReply}
                    activeReplyCommentId={replyingToCommentId}
                  />
                )}
              </div>
            </section>
          </div>
        )}
    </div>
  );
}

export default DiscussionPage;
