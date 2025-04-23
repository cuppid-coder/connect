import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimesCircle,
  faSearch,
  faUsers,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import { useTeam } from "../hooks/useTeam";
import "../styles/components/NewChatModal.css";

const NewChatModal = ({ onClose, onCreateChat }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [chatType, setChatType] = useState("direct"); // direct or group
  const { teamMembers } = useTeam();

  const filteredMembers = teamMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedMembers.find((selected) => selected._id === member._id)
  );

  const handleAddMember = (member) => {
    if (chatType === "direct" && selectedMembers.length >= 1) {
      return;
    }
    setSelectedMembers([...selectedMembers, member]);
  };

  const handleRemoveMember = (memberId) => {
    setSelectedMembers(
      selectedMembers.filter((member) => member._id !== memberId)
    );
  };

  const handleCreateChat = () => {
    if (selectedMembers.length === 0) return;

    onCreateChat({
      type: chatType,
      members: selectedMembers,
    });
    onClose();
  };

  return (
    <div className="modal d-block" tabIndex="-1">
      <div className="modal-dialog new-chat-modal">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">New Chat</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <div className="chat-type-selector">
              <div
                className={`chat-type-option ${
                  chatType === "direct" ? "active" : ""
                }`}
                onClick={() => setChatType("direct")}
              >
                <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                Direct Message
              </div>
              <div
                className={`chat-type-option ${
                  chatType === "group" ? "active" : ""
                }`}
                onClick={() => setChatType("group")}
              >
                <FontAwesomeIcon icon={faUsers} className="me-2" />
                Group Chat
              </div>
            </div>

            <div className="search-members">
              <div className="selected-members">
                {selectedMembers.map((member) => (
                  <div key={member._id} className="member-tag">
                    {member.name}
                    <button
                      className="remove-button"
                      onClick={() => handleRemoveMember(member._id)}
                    >
                      <FontAwesomeIcon icon={faTimesCircle} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="search-input-container">
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search team members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="members-list">
                {filteredMembers.map((member) => (
                  <div
                    key={member._id}
                    className="member-item"
                    onClick={() => handleAddMember(member)}
                  >
                    <div className="member-avatar">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} />
                      ) : (
                        member.name.charAt(0)
                      )}
                    </div>
                    <div className="member-info">
                      <div className="member-name">{member.name}</div>
                      <div className="member-email">{member.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreateChat}
              disabled={selectedMembers.length === 0}
            >
              Create Chat
            </button>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </div>
  );
};

export default NewChatModal;
