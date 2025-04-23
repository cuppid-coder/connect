import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperPlane,
  faSmile,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { format } from "date-fns";
import socketService from "../services/socketService";
import MessageSearch from "./MessageSearch";
import "../styles/components/ChatBox.css";

const ChatBox = ({
  chatId,
  messages = [],
  currentUserId,
  onSendMessage,
  loading,
  chatType,
}) => {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    setupSocketListeners();
    return () => {
      socketService.off("new_message");
      socketService.off("user_typing");
      socketService.off("user_stop_typing");
    };
  }, [chatId, setupSocketListeners]);

  const setupSocketListeners = () => {
    socketService.on("new_message", handleNewMessage);
    socketService.on("user_typing", handleUserTyping);
    socketService.on("user_stop_typing", handleUserStopTyping);
  };

  const handleNewMessage = () => {
    scrollToBottom();
  };

  const handleUserTyping = ({ userId }) => {
    if (userId !== currentUserId) {
      setIsTyping(true);
    }
  };

  const handleUserStopTyping = ({ userId }) => {
    if (userId !== currentUserId) {
      setIsTyping(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleTyping = () => {
    socketService.emit("typing", { chatId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketService.emit("stop_typing", { chatId });
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await onSendMessage({
        content: message,
        chatId,
      });

      socketService.emit("stop_typing", { chatId });
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleSearchSelect = (selectedMessage) => {
    const messageElement = document.getElementById(
      `message-${selectedMessage._id}`
    );
    messageElement?.scrollIntoView({ behavior: "smooth", block: "center" });
    messageElement?.classList.add("highlight");
    setTimeout(() => messageElement?.classList.remove("highlight"), 2000);
    setShowSearch(false);
  };

  const renderMessage = (msg) => {
    const isOwnMessage = msg.sender._id === currentUserId;

    return (
      <div
        id={`message-${msg._id}`}
        key={msg._id}
        className={`message ${isOwnMessage ? "own" : ""}`}
      >
        {!isOwnMessage && (
          <div className="message-avatar">{msg.sender.name.charAt(0)}</div>
        )}
        <div className="message-content">
          {!isOwnMessage && (
            <div className="message-sender">{msg.sender.name}</div>
          )}
          <div className="message-bubble">{msg.content}</div>
          <div className="message-time">
            {format(new Date(msg.createdAt), "h:mm a")}
          </div>
        </div>
      </div>
    );
  };

  if (!chatId) {
    return (
      <div className="chat-box">
        <div className="d-flex justify-content-center align-items-center h-100">
          <p>Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-box">
      <div className="chat-box-header">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">
            {chatType === "group"
              ? messages[0]?.chat?.name
              : messages[0]?.sender?.name}
          </h6>
          <button
            className="btn btn-link"
            onClick={() => setShowSearch(!showSearch)}
          >
            <FontAwesomeIcon icon={faSmile} />
          </button>
        </div>
        {showSearch && (
          <div className="mt-2">
            <MessageSearch
              chatId={chatId}
              onMessageSelect={handleSearchSelect}
            />
          </div>
        )}
      </div>

      <div className="chat-box-content">
        {loading ? (
          <div className="d-flex justify-content-center align-items-center h-100">
            <FontAwesomeIcon icon={faSpinner} spin />
          </div>
        ) : (
          <div className="message-container">
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
            {isTyping && (
              <div className="typing-indicator">Someone is typing...</div>
            )}
          </div>
        )}
      </div>

      <div className="chat-input">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="form-control"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleTyping}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!message.trim()}
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;
