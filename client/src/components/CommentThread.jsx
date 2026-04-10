import { useState } from 'react';

function CommentThread({
  comments,
  postId,
  onReply,
  activeReplyCommentId,
  depth = 0,
}) {
  const [replyDrafts, setReplyDrafts] = useState({});
  const [openReplyBoxes, setOpenReplyBoxes] = useState({});

  const handleSubmitReply = async (commentId) => {
    const trimmedMessage = (replyDrafts[commentId] || '').trim();

    if (!trimmedMessage) {
      return;
    }

    const result = await onReply?.(postId, commentId, trimmedMessage);

    if (result?.success) {
      setReplyDrafts((currentDrafts) => ({
        ...currentDrafts,
        [commentId]: '',
      }));
      setOpenReplyBoxes((currentBoxes) => ({
        ...currentBoxes,
        [commentId]: false,
      }));
    }
  };

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const isReplying = activeReplyCommentId === comment.id;
        const replyBoxOpen = Boolean(openReplyBoxes[comment.id]);

        return (
          <div
            key={comment.id}
            className="rounded-2xl border border-stroke bg-[#181818] p-4"
            style={{ marginLeft: depth > 0 ? `${Math.min(depth, 5) * 18}px` : 0 }}
          >
            <div className="flex items-start gap-3">
              <img
                src={comment.avatar}
                alt={comment.author}
                className="h-9 w-9 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-white">{comment.author}</p>
                  <span className="text-xs text-textSoft">{comment.time}</span>
                </div>
                <p className="mt-1 text-sm leading-6 text-[#d0d0d0]">{comment.message}</p>

                <button
                  type="button"
                  onClick={() =>
                    setOpenReplyBoxes((currentBoxes) => ({
                      ...currentBoxes,
                      [comment.id]: !currentBoxes[comment.id],
                    }))
                  }
                  className="mt-3 text-sm font-medium text-sky-300 transition hover:text-sky-200"
                >
                  {replyBoxOpen ? 'Cancel reply' : 'Reply'}
                </button>

                {replyBoxOpen && (
                  <div className="mt-3 flex gap-3">
                    <input
                      type="text"
                      value={replyDrafts[comment.id] || ''}
                      onChange={(event) =>
                        setReplyDrafts((currentDrafts) => ({
                          ...currentDrafts,
                          [comment.id]: event.target.value,
                        }))
                      }
                      placeholder={`Reply to ${comment.author}...`}
                      className="flex-1 rounded-full border border-stroke bg-[#111111] px-4 py-2 text-sm text-white outline-none placeholder:text-textSoft focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleSubmitReply(comment.id)}
                      disabled={isReplying}
                      className="rounded-full border border-stroke px-4 py-2 text-sm font-medium text-white transition hover:border-sky-500 hover:text-sky-300 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isReplying ? 'Replying...' : 'Reply'}
                    </button>
                  </div>
                )}

                {comment.replies.length > 0 ? (
                  <div className="mt-4">
                    <CommentThread
                      comments={comment.replies}
                      postId={postId}
                      onReply={onReply}
                      activeReplyCommentId={activeReplyCommentId}
                      depth={depth + 1}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CommentThread;
