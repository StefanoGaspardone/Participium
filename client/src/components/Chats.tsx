import { MessageSquareText, ChevronRight, Loader2 } from 'lucide-react';
import { FaUserCircle } from 'react-icons/fa';
import { useEffect, useRef, useState } from 'react';
import './chat.css';
import type { Chat, Message, User, Report } from '../models/models';
import { getChats, getMessages, sendMessage, type SendMessage } from '../api/api';
import { Badge, Alert } from 'react-bootstrap';
import { useAppContext } from '../contexts/AppContext';

interface Props {
    show: boolean,
    handleToggle: () => void;
    activeReport: Report | null;
    setActiveReport: React.Dispatch<React.SetStateAction<Report | null>>
}

const Chats = ({ show, handleToggle, activeReport, setActiveReport }: Props) => {
    const popoverRef = useRef<HTMLDivElement | null>(null);
    const toggleRef = useRef<HTMLButtonElement | null>(null);

    const [chats, setChats] = useState<Chat[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState<string>('');
    const [messagesLoading, setMessagesLoading] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [existing, setExisting] = useState<boolean>(true);

    const { user } = useAppContext();
    
    const fetchChats = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await getChats();
            setChats(res);
        } catch(error) {
            setError(error instanceof Error ? error.message : 'Failed to load assigned reports');
        } finally {
            setLoading(false);
        }
    }

    const deriveOther = (r: Report): User => {
        const partial = (r.createdBy ?? r.assignedTo) as Partial<User> | undefined;
        const defaults = { id: -1, firstName: 'Utente', lastName: '', email: '', username: 'unknown', userType: 'CITIZEN', emailNotificationsEnabled: false, createdAt: new Date() };
        return { ...(defaults), ...(partial ?? {}) } as User;
    };

    useEffect(() => {
        if(show) fetchChats();
        else if(!show && !existing) {
            setActiveReport(null);
            setMessages([]);
            setChats([]);
        }
    }, [show]);
    
    useEffect(() => {
        if(!show) return;

        const onPointerDown = (ev: PointerEvent) => {
            const target = ev.target as Node | null;
            
            if(popoverRef.current?.contains(target)) return;
            if(toggleRef.current?.contains(target)) return;
            
            handleToggle();
        };

        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [show, handleToggle]);

    const fetchMessages = async () => {
        setMessagesLoading(true);
        setError(null);

        try {
            const res = await getMessages(activeReport!.id);
            setMessages(res);
        } catch(error) {
            setError(error instanceof Error ? error.message : 'Failed to load messages');
        } finally {
            setMessagesLoading(false);
        }
    }

    useEffect(() => {
        if(!activeReport || messages.length > 0) {
            setExisting(true);
            return;
        }

        const exists = chats.some(c => c.report.id === activeReport.id);
        if(exists) return;

        const otherUser = deriveOther(activeReport);
        const chat: Chat = {
            report: activeReport,
            users: [user ?? { id: -1, firstName: 'Utente', lastName: '', email: '', username: 'unknown', userType: 'CITIZEN', emailNotificationsEnabled: false, createdAt: new Date() }, otherUser],
            messages: []
        };

        setExisting(false);
        setChats(prev => [chat, ...prev]);
    }, [messages, activeReport, chats, user]);

    useEffect(() => {
        if(!activeReport) {
            setMessages([]);
            setMessagesLoading(false);
            
            return;
        }

        fetchMessages();
    }, [activeReport]);

    const handleSend = async () => {
        if(!text || !activeReport) return;

        let selected = chats.find(c => c.report.id === activeReport.id);

        if(!selected) {
            const otherUser = deriveOther(activeReport);
            const placeholder: Chat = { report: activeReport, users: [user!, otherUser], messages: [] };
            
            setChats(prev => [placeholder, ...prev]);
            selected = placeholder;
            
            setExisting(false);
        }
        
        const other = selected.users.find(u => u.id !== user?.id) as User | undefined;
        let receiverId: number | undefined = other?.id;

        if(!receiverId || receiverId === -1) receiverId = activeReport.createdBy?.id ?? activeReport.assignedTo?.id;
        if(!receiverId) {
            console.warn('No receiver id for report', activeReport.id);
            return;
        }

        const payload: SendMessage = {
            reportId: activeReport.id,
            receiverId,
            text: text.trim(),
        };

        try {
            await sendMessage(payload);
            
            setExisting(true);
            
            await fetchChats();
            await fetchMessages();
        } catch (error) {
            console.error('Failed to send message', error);
        } finally {
            setText('');
        }
    }

    return ( 
        <div className = 'chat-wrapper'>
            {show && (
                <div ref = { popoverRef } className = 'chats-popover p-0 overflow-hidden'>
                    <div className = 'row h-100 m-0'>
                        {loading && chats.length === 0 ? (
                            <div className = 'col-12 h-100 d-flex align-items-center justify-content-center'>
                                {error ? (
                                    <Alert variant = 'danger' className = 'text-center mb-0'>{error}</Alert>
                                ) : (
                                    <Loader2 className = 'chat-loader' size = { 48 }/>
                                )}
                            </div>
                        ): !loading && chats.length === 0 ?  (
                            <div className = 'col-12 h-100 d-flex flex-column align-items-center justify-content-center'>
                                <p>No chats available.</p>
                                <p>Click on <span className = 'fw-semibold'>'Send message'</span> in a report to start a chat.</p>
                            </div>
                        ) : (
                            <>
                                <div className = 'col-4 h-100 border-end p-0'>
                                    <div className = 'h-100 overflow-auto list-group list-group-flush'>
                                        {chats.map(c => (
                                            <button key = { c.report.id } type = 'button' className = { `list-group-item list-group-item-action d-flex flex-column ${activeReport?.id === c.report.id ? 'active' : ''}` } onClick = { () => setActiveReport(c.report) }>
                                                <div className = 'd-flex align-items-center w-100'>
                                                    <div className = 'me-2 flex-grow-1 text-truncate fw-semibold'>{c.report.title}</div>
                                                    <small className = 'text-muted'>#{c.report.id}</small>
                                                </div>
                                                <div className = 'mt-2 d-flex gap-2'>
                                                    <Badge bg = { c.report.status === 'Assigned' ? 'primary' : c.report.status === 'Resolved' ? 'success' : 'warning' }>
                                                        {c.report.status}
                                                    </Badge>
                                                    <Badge bg = 'secondary'>{c.report.category?.name}</Badge>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className = 'col-8 d-flex flex-column p-0 chat-messages-container'>
                                    {(chats.length > 0 && !activeReport) ? (
                                        <div className = 'h-100 d-flex align-items-center justify-content-center'>
                                            <div className = 'text-muted'>Select a chat to send messages</div>
                                        </div>
                                    ) : messagesLoading ? (
                                        <div className = 'h-100 d-flex align-items-center justify-content-center'>
                                            {error ? (
                                                <Alert variant = 'danger' className = 'text-center mb-0'>{error}</Alert>
                                            ) : (
                                                <Loader2 className = 'chat-loader' size = { 48 }/>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            {(() => {
                                                const selected = chats.find(c => c.report.id === activeReport?.id);
                                                const otherUserDerived = selected ? selected.users.find(u => u.id !== user?.id) : null;
                                        
                                                return (
                                                    <div className = 'chat-right-header d-flex align-items-center gap-2 p-2 border-bottom'>
                                                        <button
                                                            type='button'
                                                            className='btn btn-sm btn-light d-md-none'
                                                            onClick={() => setActiveReport(null)}
                                                            style={{ minWidth: '2.5rem' }}
                                                        >
                                                            ←
                                                        </button>
                                                        {otherUserDerived?.image ? (
                                                            <img src = { otherUserDerived.image } alt = 'user' width = { 40 } height = { 40 } className = 'rounded-circle'/>
                                                        ) : (
                                                            <span className = 'd-inline-flex align-items-center justify-content-center'>
                                                                <FaUserCircle size = { 40 } className = 'text-muted' />
                                                            </span>
                                                        )}
                                                        <div className = 'flex-grow-1 min-width-0'>
                                                            <div className = 'fw-semibold text-truncate'>{otherUserDerived ? `${otherUserDerived.firstName} ${otherUserDerived.lastName}` : 'Selected a chat'}</div>
                                                            <div className = 'small text-muted text-truncate'>{otherUserDerived ? otherUserDerived.username : ''}</div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                            <div className = 'chat-messages flex-grow-1 overflow-auto p-3'>
                                                {messages.length > 0 ? (
                                                    messages.map(m => (
                                                        <div key = { m.id } className = { `mb-2 d-flex ${m.sender.id === user?.id ? 'justify-content-end' : 'justify-content-start'}` }>
                                                            <div className = { `message-bubble ${m.sender.id === user?.id ? 'mine' : 'other'}` }>
                                                                <div>{m.text}</div>
                                                                <div className = 'small text-muted mt-1 text-end'>{new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className = 'h-100 d-flex align-items-center justify-content-center text-muted p-3'>No messages yet.</div>
                                                )}
                                            </div>
                                            <div className = 'chat-input d-flex gap-2 p-2 border-top'>
                                                <input className = 'form-control' placeholder = 'Write a message...' value = { text } onChange = { e => setText(e.target.value) } onKeyDown = { e => { if(e.key === 'Enter') { e.preventDefault(); handleSend(); } } }/>
                                                <button type = 'button' className = "btn btn-primary d-flex align-items-center justify-content-center" onClick = { () => handleSend() } disabled = { !text.trim() } aria-disabled = { !text.trim() }>
                                                    <ChevronRight size = { 20 }/>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            <button ref = { toggleRef } type = 'button' onClick = { handleToggle } className = 'chat-toggle' aria-label = 'Open chat' title = 'Open chat'>
                <MessageSquareText size = { 32 }/>
            </button>
        </div>
    );
}

export default Chats;