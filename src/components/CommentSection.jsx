import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faReply,
  faThumbsUp,
  faTrash,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import { format } from "date-fns";
import "../styles/components/CommentSection.css";

const CommentSection = ({ comments = [], onAddComment, onDeleteComment }) => {
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    onAddComment({
      content: newComment,
      parentId: null,
    });
    setNewComment("");
  };

  const handleReply = (commentId) => {
    if (!replyContent.trim()) return;

    onAddComment({
      content: replyContent,
      parentId: commentId,
    });
    setReplyContent("");
    setReplyTo(null);
  };

  const renderComment = (comment) => (
    <div key={comment._id} className="comment">
      <div className="comment-header">
        <div className="comment-author">
          <div className="author-avatar">
            {comment.author.avatar ? (
              <img src={comment.author.avatar} alt={comment.author.name} />
            ) : (
              comment.author.name.charAt(0)
            )}
          </div>
          <span className="author-name">{comment.author.name}</span>
        </div>
        <span className="comment-date">
          {format(new Date(comment.createdAt), "MMM d, h:mm a")}
        </span>
      </div>

      <div className="comment-content">{comment.content}</div>

      <div className="comment-actions">
        <button
          className="comment-action"
          onClick={() =>
            setReplyTo(replyTo === comment._id ? null : comment._id)
          }
        >
          <FontAwesomeIcon icon={faReply} />
          Reply
        </button>
        <button className="comment-action">
          <FontAwesomeIcon icon={faThumbsUp} />
          Like
        </button>
        {comment.author._id === "current-user-id" && (
          <button
            className="comment-action"
            onClick={() => onDeleteComment(comment._id)}
          >
            <FontAwesomeIcon icon={faTrash} />
            Delete
          </button>
        )}
      </div>

      {replyTo === comment._id && (
        <div className="reply-form">
          <div className="comment-input-container">
            <textarea
              className="comment-input"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              rows="2"
            />
            <button
              className="btn btn-primary"
              onClick={() => handleReply(comment._id)}
              disabled={!replyContent.trim()}
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </div>
        </div>
      )}

      {comment.replies?.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map((reply) => renderComment(reply))}
        </div>
      )}
    </div>
  );

  return (
    <div className="comments-section">
      <form onSubmit={handleSubmit} className="comment-form">
        <div className="comment-input-container">
          <textarea
            className="comment-input"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            rows="3"
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!newComment.trim()}
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </div>
      </form>

      <div className="comment-list">
        {comments.map((comment) => renderComment(comment))}
      </div>
    </div>
  );
};

export default CommentSection;
