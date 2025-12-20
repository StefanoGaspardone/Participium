import { MessageSquareText, ChevronRight, Loader2 } from "lucide-react";
import { FaUserCircle } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import "./chat.css";
import type { Chat, Message, Report } from "../models/models";
import { getChatMessages, getUserChats, sendMessage } from "../api/api";
import { Badge, Alert } from "react-bootstrap";
import { useAppContext } from "../contexts/AppContext";
import { AnimatePresence, motion } from "framer-motion";
import { REPORT_STATUS_COLORS } from "../constants/reportStatusColors";

/**
 * activeReport is used to open the chat related to that Report, it will need to change bc it will have
 * 2 chats for each report, maybe one button for each (one for citizen, one for external maintainer)
 */
interface Props {
  show: boolean;
  handleToggle: () => void;
  activeReport: Report | null;
  setActiveReport: React.Dispatch<React.SetStateAction<Report | null>>;
  targetUserId?: number | null;
}

const getOtherUser = (chat: Chat, currentUserId?: number) => {
  if (chat.tosm_user?.id === currentUserId) {
    return chat.second_user;
  }
  return chat.tosm_user;
};

const getSenderId = (
  rawSender: number | { id?: number } | undefined
): number | undefined => {
  if (typeof rawSender === "number") return rawSender;
  return rawSender?.id;
};

const sortMessages = (messages?: Message[]) =>
  messages
    ? [...messages].sort(
        (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      )
    : undefined;

const Chats = ({
  show,
  handleToggle,
  activeReport,
  setActiveReport,
  targetUserId,
}: Props) => {
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const ignoreActiveReportRef = useRef<boolean>(false);

  // the list of chat the user is involved into
  const [chats, setChats] = useState<Chat[] | undefined>(undefined);

  // the currently selected chat, for which the corresponding messages are shown
  const [selectedChat, setSelectedChat] = useState<number | undefined>(
    undefined
  );

  // the messages to be shown, they are the one related to the "selectedChat"
  const [showedMessages, setShowedMessages] = useState<Message[] | undefined>(
    undefined
  );
  const showedRef = useRef<Message[] | undefined>(showedMessages);

  const [text, setText] = useState<string>("");

  const [chatsLoading, setChatsLoading] = useState<boolean>(false);
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false);
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAppContext();

  /**
   * function to display the chat on the left part of the component
   */
  const displayChats = async () => {
    setChatsLoading(true);
    setError(null);
    try {
      const retrievedChats = await getUserChats();
      setChats(retrievedChats);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load messages"
      );
    } finally {
      setChatsLoading(false);
    }
  };

  /**
   * function to display the messages of the currently selected chat
   */
  const displayChatMessages = async () => {
    if (selectedChat === undefined) return;
    setMessagesLoading(true);
    setError(null);
    try {
      const retrievedMessages = await getChatMessages(selectedChat);
      setShowedMessages(retrievedMessages);
      showedRef.current = retrievedMessages;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load messages"
      );
    } finally {
      setMessagesLoading(false);
    }
  };

  const renderChatListContent = () => {
    if (chatsLoading) {
      return (
        <div className="d-flex align-items-center justify-content-center h-100">
          <Loader2 className="chat-loader" size={32} />
        </div>
      );
    }

    if (!chats || chats.length === 0) {
      return (
        <div className="p-3 text-center text-muted">
          <p className="mb-1">No chats yet.</p>
          <small>Click "Send message" on a report to start.</small>
        </div>
      );
    }

    return (
      <div className="list-group list-group-flush">
        {chats.map((chat) => {
          const otherUser = getOtherUser(chat, user?.id);
          const isActive = selectedChat === chat.id;

          const displayImage = otherUser?.image;
          let otherUserTypeLabel = null;
          if (otherUser?.userType === "EXTERNAL_MAINTAINER") {
            otherUserTypeLabel = "EXTERNAL MAINTAINER";
          } else if (otherUser?.userType === "CITIZEN") {
            otherUserTypeLabel = "CITIZEN";
          } else if (otherUser?.userType === "TECHNICAL_STAFF_MEMBER") {
            otherUserTypeLabel = "TECHNICAL STAFF MEMBER";
          }
          const otherUserDetails = otherUser
            ? `${otherUser.firstName} ${otherUser.lastName} - ${otherUserTypeLabel}`
            : "";

          return (
            <button
              key={chat.id}
              type="button"
              className={`list-group-item list-group-item-action d-flex align-items-center gap-2 ${
                isActive ? "active" : ""
              }`}
              onClick={() => handleChatSelect(chat)}
            >
              <div className="d-flex align-items-center me-2">
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt="avatar"
                    width={44}
                    height={44}
                    className="rounded-circle"
                  />
                ) : (
                  <FaUserCircle size={44} className="text-muted" />
                )}
              </div>

              <div className="flex-grow-1 min-width-0">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <div className="fw-semibold text-truncate">
                    {otherUserDetails}
                  </div>
                </div>

                <div className="small text-truncate mb-1 other-user-details">
                  Report <small className="text-muted">#{chat.report.id}</small>:{" "}
                  {chat.report.title}
                </div>

                <div className="d-flex gap-2 align-items-center">
                  <Badge
                    bg="none"
                    style={{
                      backgroundColor: REPORT_STATUS_COLORS[chat.report.status],
                    }}
                  >
                    {chat.report.status}
                  </Badge>
                  <Badge bg="secondary">{chat.report.category?.name}</Badge>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const chatListContent = renderChatListContent();

  const sortedShowedMessages = sortMessages(showedMessages);

  const renderMessageContent = () => {
    if (messagesLoading) {
      return (
        <div className="h-100 d-flex align-items-center justify-content-center">
          <Loader2 className="chat-loader" size={32} />
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="danger" className="text-center mb-0">
          {error}
        </Alert>
      );
    }

    if (!sortedShowedMessages || sortedShowedMessages.length === 0) {
      return (
        <div className="h-100 d-flex align-items-center justify-content-center text-muted">
          No messages yet. Start the conversation!
        </div>
      );
    }

    return (
      <>
        {sortedShowedMessages.map((msg) => {
          const senderId = getSenderId(msg.sender);
          const isMine = senderId === user?.id;
          const justifyClass = isMine
            ? "justify-content-end"
            : "justify-content-start";
          const timeClass = isMine ? "text-end" : "text-start";

          return (
            <div key={msg.id} className={`mb-2 d-flex ${justifyClass}`}>
              <div className={`message-bubble ${isMine ? "mine" : "other"}`}>
                <div>{msg.text}</div>
                <div className={`small mt-1 ${timeClass} text-muted`}>
                  {new Date(msg.sentAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </>
    );
  };

  const messageContent = renderMessageContent();

  // Fetch all chats when popover opens
  useEffect(() => {
    if (!show) return;
    displayChats();
  }, [show]);

  // When activeReport changes externally (user clicks "Send message" on a report)
  useEffect(() => {
    if (!activeReport || !show || !chats) return;

    // if the selection was just made by the user, do not override it
    if (ignoreActiveReportRef.current) return;

    // rest of the effect unchanged...
    const findChatForTarget = (targetId?: number | null) => {
      if (!targetId) return chats.find((c) => c.report.id === activeReport.id);
      return chats.find(
        (c) =>
          c.report.id === activeReport.id &&
          (c.tosm_user?.id === targetId || c.second_user?.id === targetId)
      );
    };

    const existingChat = findChatForTarget(targetUserId ?? undefined);
    if (existingChat) {
      setSelectedChat(existingChat.id);
    } else {
      setSelectedChat(undefined);
      setShowedMessages(undefined);
    }
  }, [activeReport, chats, show, targetUserId]);

  // Fetch messages when selectedChat changes
  useEffect(() => {
    if (selectedChat === undefined) {
      setShowedMessages(undefined);
      return;
    }
    displayChatMessages();
  }, [selectedChat]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [showedMessages]);

  // Close popover when clicking outside
  useEffect(() => {
    if (!show) return;

    const onPointerDown = (ev: PointerEvent) => {
      const target = ev.target as Node | null;
      if (popoverRef.current?.contains(target)) return;
      if (toggleRef.current?.contains(target)) return;
      handleToggle();
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [show, handleToggle]);

  const handleChatSelect = (chat: Chat) => {
    // prevent the 'activeReport' effect from overriding this user selection
    ignoreActiveReportRef.current = true;
    // small safety timeout to re-enable the effect after the user action settles
    globalThis.setTimeout(() => {
      ignoreActiveReportRef.current = false;
    }, 300);

    setSelectedChat(chat.id);
    setActiveReport(chat.report);
    setError(null);
  };

  const handleSendMessage = async () => {
    if (!text.trim() || !activeReport || !user) return;

    setSendingMessage(true);
    setError(null);

    try {
      const chatIdToUse = selectedChat;

      // If no chat exists, something went wrong
      if (chatIdToUse === undefined) {
        return;
      }

      // Get current chat to find receiver
      const currentChat = chats?.find((c) => c.id === chatIdToUse);
      if (!currentChat) throw new Error("Chat not found");

      let receiverUser = null;

      if (currentChat.tosm_user.id === user.id) {
        receiverUser = currentChat.second_user;
      } else {
        receiverUser = currentChat.tosm_user;
      }

      if (receiverUser === null || receiverUser === undefined) return;

      await sendMessage(chatIdToUse, {
        receiverId: receiverUser.id!,
        text: text.trim(),
      });

      // Refresh messages
      await displayChatMessages();
      setText("");
    } catch (err) {
      console.error("Failed to send message:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const currentSelectedChat = chats?.find((c) => c.id === selectedChat);
  const otherUserInHeader =
    currentSelectedChat && user
      ? getOtherUser(currentSelectedChat, user.id)
      : undefined;

  let userTypeLabel = null;
  if (otherUserInHeader?.userType === "EXTERNAL_MAINTAINER") {
    userTypeLabel = "EXTERNAL MAINTAINER";
  } else if (otherUserInHeader?.userType === "CITIZEN") {
    userTypeLabel = "CITIZEN";
  } else if (otherUserInHeader?.userType === "TECHNICAL_STAFF_MEMBER") {
    userTypeLabel = "TECHNICAL STAFF MEMBER";
  }
  const otherUserDetailsInHeader = otherUserInHeader
    ? `${otherUserInHeader.firstName} ${otherUserInHeader.lastName} - ${userTypeLabel}`
    : "Loading...";

  const otherUserImageInHeader = otherUserInHeader?.image;

  const sendMessageButtonIcon = sendingMessage ? (
    <Loader2 className="chat-loader" size={20} />
  ) : (
    <ChevronRight size={20} />
  );

  return (
    <div className="chat-wrapper">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div ref={popoverRef} className="chats-popover p-0 overflow-hidden">
              <div className="row h-100 m-0">
                {/* Left column: list of chats */}
                <div className="col-5 h-100 border-end p-0 d-flex flex-column">
                  <div className="p-2 border-bottom bg-light">
                    <h6 className="mb-0">Chats</h6>
                  </div>
                  <div className="flex-grow-1 overflow-auto">
                    {chatListContent}
                  </div>
                </div>

                {/* Right column: selected chat messages */}
                <div className="col-7 d-flex flex-column p-0 chat-messages-container">
                  {selectedChat === undefined && !activeReport ? (
                    <div className="h-100 d-flex align-items-center justify-content-center">
                      <div className="text-muted">
                        Select a chat to view messages
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="chat-right-header d-flex align-items-center gap-2 p-2 border-bottom bg-light">
                        <button
                          type="button"
                          className="btn btn-sm btn-light d-md-none"
                          onClick={() => {
                            setSelectedChat(undefined);
                            setActiveReport(null);
                          }}
                          style={{ minWidth: "2.5rem" }}
                        >
                          ←
                        </button>

                        {otherUserImageInHeader ? (
                          <img
                            src={otherUserImageInHeader}
                            alt="user"
                            width={40}
                            height={40}
                            className="rounded-circle"
                          />
                        ) : (
                          <FaUserCircle size={40} className="text-muted" />
                        )}
                        <div className="flex-grow-1 min-width-0">
                          <div className="fw-semibold text-truncate">
                            {otherUserDetailsInHeader}
                          </div>
                          <div className="small text-muted text-truncate">
                            {activeReport?.title ?? "Chat"}
                          </div>
                        </div>
                      </div>

                      {/* Messages area */}
                      <div className="chat-messages flex-grow-1 overflow-auto p-3">
                        {messageContent}
                      </div>

                      {/* Message input */}
                      <div className="chat-input d-flex gap-2 p-2 border-top">
                        <input
                          className="form-control"
                          placeholder="Write a message..."
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          disabled={sendingMessage}
                        />
                        <button
                          type="button"
                          className="btn btn-primary d-flex align-items-center justify-content-center"
                          onClick={handleSendMessage}
                          disabled={!text.trim() || sendingMessage}
                        >
                          {sendMessageButtonIcon}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.45 }}
      >
        <button
          ref={toggleRef}
          type="button"
          onClick={handleToggle}
          className="chat-toggle"
          aria-label="Open chat"
          title="Open chat"
        >
          <MessageSquareText size={32} />
        </button>
      </motion.div>
    </div>
  );
};
export default Chats;
