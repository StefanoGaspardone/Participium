import { MessageSquareText, ChevronRight, Loader2 } from "lucide-react";
import { FaUserCircle } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import "./chat.css";
import type { Chat, Message, Report } from "../models/models";
import {
    createChat,
    getChatMessages,
    getUserChats,
    sendMessage,
} from "../api/api";
import { Badge, Alert } from "react-bootstrap";
import { useAppContext } from "../contexts/AppContext";

/**
 * activeReport is used to open the chat related to that Report, it will need to change bc it will have 
 * 2 chats for each report, maybe one button for each (one for citizen, one for external maintainer)
 */
interface Props {
    show: boolean;
    handleToggle: () => void;
    activeReport: Report | null;
    setActiveReport: React.Dispatch<React.SetStateAction<Report | null>>;
}

const Chats = ({ show, handleToggle, activeReport, setActiveReport, }: Props) => {
    const popoverRef = useRef<HTMLDivElement | null>(null);
    const toggleRef = useRef<HTMLButtonElement | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

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
            setError(error instanceof Error ? error.message : "Failed to load messages");
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
            console.log("PROVO A RICHIEDERE PER CHAT #" + selectedChat)
            // ERROR HERE !!! in getChatMessages
            const retrievedMessages = await getChatMessages(selectedChat);
            setShowedMessages(retrievedMessages);
            showedRef.current = retrievedMessages;
            console.log("SHOWED MESSAGES : \n" + JSON.stringify(showedRef.current));
        } catch (error) {
            setError(error instanceof Error ? error.message : "Failed to load messages");
        } finally {
            setMessagesLoading(false);
        }
    };

    useEffect(() => {
        console.log("showed messages update:", showedMessages);
    }, [showedMessages])

    // Fetch all chats when popover opens
    useEffect(() => {
        if (!show) return;
        displayChats();
    }, [show]);

    // When activeReport changes externally (user clicks "Send message" on a report)
    useEffect(() => {
        if (!activeReport || !show || !chats) return;

        // Find if a chat already exists for this report
        const existingChat = chats.find(c => c.report.id === activeReport.id);
        if (existingChat) {
            setSelectedChat(existingChat.id);
        } else {
            // No chat exists yet — will create when user sends first message
            setSelectedChat(undefined);
            setShowedMessages(undefined);
        }
    }, [activeReport, chats, show]);

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
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [show, handleToggle]);

    const handleChatSelect = (chat: Chat) => {
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
                return
            }

            // Get current chat to find receiver
            const currentChat = chats?.find(c => c.id === chatIdToUse);
            if (!currentChat)
                throw new Error('Chat not found');

            const receiverUser = currentChat.tosm_user.id === user.id
                ? currentChat.second_user
                : currentChat.tosm_user;
            
            // if no receiver, something went wrong
            if(receiverUser === null || receiverUser === undefined) 
                return;

            await sendMessage(chatIdToUse, {
                receiverId: receiverUser.id!,
                text: text.trim(),
            });

            // Refresh messages
            await displayChatMessages();
            setText('');
        } catch (err) {
            console.error('Failed to send message:', err);
            setError(err instanceof Error ? err.message : 'Failed to send message');
        } finally {
            setSendingMessage(false);
        }
    };

    return (
        <div className="chat-wrapper">
            {show && (
                <div ref={popoverRef} className="chats-popover p-0 overflow-hidden">
                    <div className="row h-100 m-0">
                        {/* Left column: list of chats */}
                        <div className="col-4 h-100 border-end p-0 d-flex flex-column">
                            <div className="p-2 border-bottom bg-light">
                                <h6 className="mb-0">Chats</h6>
                            </div>
                            <div className="flex-grow-1 overflow-auto">
                                {chatsLoading ? (
                                    <div className="d-flex align-items-center justify-content-center h-100">
                                        <Loader2 className="chat-loader" size={32} />
                                    </div>
                                ) : !chats || chats.length === 0 ? (
                                    <div className="p-3 text-center text-muted">
                                        <p className="mb-1">No chats yet.</p>
                                        <small>Click "Send message" on a report to start.</small>
                                    </div>
                                ) : (
                                    <div className="list-group list-group-flush">
                                        {chats.map((chat) => {
                                            const otherUser = chat.tosm_user.id === user?.id
                                                ? chat.second_user
                                                : chat.tosm_user;
                                            const isActive = selectedChat === chat.id;

                                            return (
                                                <button
                                                    key={chat.id}
                                                    type="button"
                                                    className={`list-group-item list-group-item-action d-flex flex-column ${isActive ? "active" : ""}`}
                                                    onClick={() => handleChatSelect(chat)}
                                                >
                                                    <div className="d-flex align-items-center w-100 mb-1">
                                                        <div className="me-2 flex-grow-1 text-truncate fw-semibold">
                                                            {chat.report.title}
                                                        </div>
                                                        <small className="text-muted">
                                                            #{chat.report.id}
                                                        </small>
                                                    </div>
                                                    <div className="small text-truncate mb-2">
                                                        {otherUser
                                                            ? `${otherUser.firstName} ${otherUser.lastName}`
                                                            : "Unknown"}
                                                    </div>
                                                    <div className="d-flex gap-2">
                                                        <Badge
                                                            bg={
                                                                chat.report.status === "Assigned"
                                                                    ? "primary"
                                                                    : chat.report.status === "Resolved"
                                                                        ? "success"
                                                                        : "warning"
                                                            }
                                                        >
                                                            {chat.report.status}
                                                        </Badge>
                                                        <Badge bg="secondary">
                                                            {chat.report.category?.name}
                                                        </Badge>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right column: selected chat messages */}
                        <div className="col-8 d-flex flex-column p-0 chat-messages-container">
                            {selectedChat === undefined && !activeReport ? (
                                <div className="h-100 d-flex align-items-center justify-content-center">
                                    <div className="text-muted">
                                        Select a chat to view messages
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Chat header */}
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
                                        {(() => {
                                            const currentChat = chats?.find(c => c.id === selectedChat);
                                            const otherUser = currentChat
                                                ? (currentChat.tosm_user.id === user?.id
                                                    ? currentChat.second_user
                                                    : currentChat.tosm_user)
                                                : null;
                                            return (
                                                <>
                                                    {otherUser?.image ? (
                                                        <img
                                                            src={otherUser.image}
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
                                                            {activeReport?.title ?? "Chat"}
                                                        </div>
                                                        <div className="small text-muted text-truncate">
                                                            {otherUser
                                                                ? `${otherUser.firstName} ${otherUser.lastName}`
                                                                : "Loading..."}
                                                        </div>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>

                                    {/* Messages area */}
                                    <div className="chat-messages flex-grow-1 overflow-auto p-3">
                                        {messagesLoading ? (
                                            <div className="h-100 d-flex align-items-center justify-content-center">
                                                <Loader2 className="chat-loader" size={32} />
                                            </div>
                                        ) : error ? (
                                            <Alert variant="danger" className="text-center mb-0">
                                                {error}
                                            </Alert>
                                        ) : !showedMessages || showedMessages.length === 0 ? (
                                            <div className="h-100 d-flex align-items-center justify-content-center text-muted">
                                                No messages yet. Start the conversation!
                                            </div>
                                        ) : (
                                            <>
                                                {showedMessages.map((msg) => {
                                                    const isMine = msg.sender.id === user?.id;
                                                    return (
                                                        <div
                                                            key={msg.id}
                                                            className={`mb-2 d-flex ${isMine
                                                                ? "justify-content-end"
                                                                : "justify-content-start"
                                                                }`}
                                                        >
                                                            <div
                                                                className={`message-bubble ${isMine ? "mine" : "other"}`}
                                                            >
                                                                <div>{msg.text}</div>
                                                                <div className="small text-muted mt-1 text-end">
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
                                        )}
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
                                            {sendingMessage ? (
                                                <Loader2 className="chat-loader" size={20} />
                                            ) : (
                                                <ChevronRight size={20} />
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
        </div>
    );
};

export default Chats;