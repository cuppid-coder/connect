import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserPlus,
  faUsers,
  faSearch,
  faComments,
  faCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useMessage } from "../hooks/useMessage";
import { useAuth } from "../hooks/useAuth";
import { usePresence } from "../hooks/usePresence";
import ChatBox from "../components/ChatBox";
import NewChatModal from "../components/NewChatModal";
import "../styles/pages/Chat.css";

const Chat = () => {
  const { user } = useAuth();
  const { isOnline } = usePresence();
  const {
    chats,
    users,
    loading,
    joinChat,
    leaveChat,
    fetchMessages,
    fetchUserChats,
    sendMessage,
    createChat,
  } = useMessage();

  const [selectedChat, setSelectedChat] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [modalType, setModalType] = useState(null);

  useEffect(() => {
    fetchUserChats();
  }, [fetchUserChats]);

  useEffect(() => {
    if (selectedChat) {
      joinChat(selectedChat);
      fetchMessages(selectedChat);

      return () => {
        leaveChat(selectedChat);
      };
    }
  }, [selectedChat, joinChat, leaveChat, fetchMessages]);

  const handleSendMessage = async (messageData) => {
    await sendMessage(messageData);
  };

  const handleCreateChat = async (chatData) => {
    try {
      const newChatId = await createChat(chatData);
      setSelectedChat(newChatId);
      setModalType(null);
    } catch (err) {
      console.error("Failed to create chat:", err);
    }
  };

  const filteredChats = Object.entries(chats).filter(([, chat]) => {
    const participant =
      chat.lastMessage.sender._id === user._id
        ? chat.lastMessage.receiver
        : chat.lastMessage.sender;
    return participant.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="page-container">
      <button
        className="mobile-sidebar-toggle"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <FontAwesomeIcon icon={faComments} />
      </button>

      <div className={`chat-sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="search-bar">
          <div className="input-group">
            <span className="input-group-text">
              <FontAwesomeIcon icon={faSearch} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="p-2">
          <button
            className="btn btn-primary w-100 mb-2"
            onClick={() => setModalType("private")}
          >
            <FontAwesomeIcon icon={faUserPlus} className="me-2" />
            New Chat
          </button>
          <button
            className="btn btn-outline-primary w-100"
            onClick={() => setModalType("group")}
          >
            <FontAwesomeIcon icon={faUsers} className="me-2" />
            New Group
          </button>
        </div>

        <div className="chat-list">
          {filteredChats.map(([chatId, chat]) => {
            const participant =
              chat.lastMessage.sender._id === user._id
                ? chat.lastMessage.receiver
                : chat.lastMessage.sender;

            return (
              <div
                key={chatId}
                className={`chat-item ${
                  selectedChat === chatId ? "active" : ""
                }`}
                onClick={() => {
                  setSelectedChat(chatId);
                  if (window.innerWidth <= 768) {
                    setIsSidebarOpen(false);
                  }
                }}
              >
                <h6>
                  <FontAwesomeIcon
                    icon={faCircle}
                    className={`status-indicator ${
                      isOnline(participant._id) ? "online" : ""
                    }`}
                  />
                  {chat.lastMessage.chatType === "group"
                    ? chat.name
                    : participant.name}
                </h6>
                <p>{chat.lastMessage.content}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="main-chat">
        {selectedChat ? (
          <>
            <div className="chat-header">
              <h5>
                <FontAwesomeIcon
                  icon={faCircle}
                  className={`status-indicator ${
                    chats[selectedChat]?.lastMessage?.chatType === "private" &&
                    isOnline(
                      chats[selectedChat]?.lastMessage?.sender._id === user._id
                        ? chats[selectedChat]?.lastMessage?.receiver._id
                        : chats[selectedChat]?.lastMessage?.sender._id
                    )
                      ? "online"
                      : ""
                  }`}
                />
                {chats[selectedChat]?.lastMessage?.chatType === "group"
                  ? chats[selectedChat]?.name
                  : chats[selectedChat]?.lastMessage?.sender._id === user._id
                  ? chats[selectedChat]?.lastMessage?.receiver?.name
                  : chats[selectedChat]?.lastMessage?.sender?.name}
              </h5>
            </div>
            <div className="chat-content">
              <ChatBox
                chatId={selectedChat}
                messages={chats[selectedChat]?.messages || []}
                currentUserId={user._id}
                onSendMessage={handleSendMessage}
                loading={loading}
                chatType={chats[selectedChat]?.lastMessage?.chatType}
              />
            </div>
          </>
        ) : (
          <div className="empty-state">
            <FontAwesomeIcon icon={faComments} className="icon" />
            <h4>Welcome to Messages</h4>
            <p>Select a chat to start messaging or create a new one</p>
          </div>
        )}
      </div>

      <NewChatModal
        isOpen={!!modalType}
        onClose={() => setModalType(null)}
        users={users}
        onCreateChat={handleCreateChat}
        type={modalType}
      />
    </div>
  );
};

export default Chat;
