import { MessageSquareText, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import './chat.css';
import type { Chat, Message, User, Report } from '../models/models';
import { getChats } from '../api/api';
import { Badge } from 'react-bootstrap';
import { useAppContext } from '../contexts/AppContext';

// current user (mock)
const MY_USER: User = {
    id: 4,
    firstName: 'Io',
    lastName: 'Utente',
    email: 'me@example.com',
    username: 'me',
    userType: 'TECHNICAL_STAFF_MEMBER',
    emailNotificationsEnabled: false,
    createdAt: new Date()
};

// Mock chats conforming to models
const MOCK_CHATS: Chat[] = [
    {
        report: { id: 101, title: 'Pothole', description: '', category: { id: 1, name: 'Road' }, images: [], lat: 0, long: 0, status: 'Assigned', createdAt: new Date() },
        users: [MY_USER, { id: 11, firstName: 'Mario', lastName: 'Rossi', email: 'mario@example.com', username: 'mario', userType: 'CITIZEN', emailNotificationsEnabled: false, createdAt: new Date() }],
        messages: []
    },
    {
        report: { id: 102, title: 'Streetlight', description: '', category: { id: 2, name: 'Lighting' }, images: [], lat: 0, long: 0, status: 'InProgress', createdAt: new Date() },
        users: [MY_USER, { id: 12, firstName: 'Luca', lastName: 'Bianchi', email: 'luca@example.com', username: 'luca', userType: 'CITIZEN', emailNotificationsEnabled: false, createdAt: new Date() }],
        messages: []
    },
    {
        report: { id: 103, title: 'Garbage', description: '', category: { id: 3, name: 'Waste' }, images: [], lat: 0, long: 0, status: 'Resolved', createdAt: new Date() },
        users: [MY_USER, { id: 13, firstName: 'Giulia', lastName: 'Verdi', email: 'giulia@example.com', username: 'giulia', userType: 'CITIZEN', emailNotificationsEnabled: false, createdAt: new Date() }],
        messages: []
    }
];

const MOCK_MESSAGES: Record<number, Message[]> = {
    101: [
        { id: 1, text: 'Ciao, sto verificando il report.', sentAt: new Date(), sender: { id: 11, firstName: 'Mario', lastName: 'Rossi', email: 'mario@example.com', username: 'mario', userType: 'CITIZEN', emailNotificationsEnabled: false, createdAt: new Date() }, receiver: MY_USER, report: MOCK_CHATS[0].report },
        { id: 2, text: 'Perfetto, grazie.', sentAt: new Date(), sender: MY_USER, receiver: { id: 11, firstName: 'Mario', lastName: 'Rossi', email: 'mario@example.com', username: 'mario', userType: 'CITIZEN', emailNotificationsEnabled: false, createdAt: new Date() }, report: MOCK_CHATS[0].report }
    ],
    102: [
        { id: 3, text: 'Sto lavorando sulla segnalazione.', sentAt: new Date(), sender: { id: 12, firstName: 'Luca', lastName: 'Bianchi', email: 'luca@example.com', username: 'luca', userType: 'CITIZEN', emailNotificationsEnabled: false, createdAt: new Date() }, receiver: MY_USER, report: MOCK_CHATS[1].report }
    ],
    103: [
        { id: 4, text: 'Risolvibile, chiuso.', sentAt: new Date(), sender: { id: 13, firstName: 'Giulia', lastName: 'Verdi', email: 'giulia@example.com', username: 'giulia', userType: 'CITIZEN', emailNotificationsEnabled: false, createdAt: new Date() }, receiver: MY_USER, report: MOCK_CHATS[2].report }
    ]
};

interface Props {
    show: boolean,
    handleToggle: () => void;
    activeReport: number | null;
    setActiveReport: React.Dispatch<React.SetStateAction<number | null>>
}

const Chats = ({ show, handleToggle, activeReport, setActiveReport }: Props) => {
    const popoverRef = useRef<HTMLDivElement | null>(null);
    const toggleRef = useRef<HTMLButtonElement | null>(null);

    const [chats, setChats] = useState<Chat[] | null>(null);
    const [messages, setMessages] = useState<Message[] | null>(null);
    const [inputValue, setInputValue] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const { user } = useAppContext();

    useEffect(() => {
        const fetchChats = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await getChats();
                setChats(res);
                setChats(MOCK_CHATS);
            } catch(error) {
                setError(error instanceof Error ? error.message : 'Failed to load assigned reports');
            } finally {
                setLoading(false);
            }
        }

        if(show) fetchChats();
    }, [show]);

    // use MOCK_MESSAGES defined above

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

    function handleSend() {
        if (!inputValue || !messages) return;
        if (!activeReport) return;

        const selected = (chats || MOCK_CHATS).find(c => c.report.id === activeReport);
        const other = selected?.users.find(u => u.id !== myId) as User | undefined;
        const sender = user ?? MY_USER;
        if (!other) return;

        const newMsg: Message = {
            id: Date.now(),
            text: inputValue,
            sentAt: new Date(),
            sender,
            receiver: other,
            report: selected!.report
        } as Message;

        setMessages(prev => prev ? [...prev, newMsg] : [newMsg]);
        // also update chats state so subsequent opens show the message
        setChats(prev => prev ? prev.map(c => c.report.id === activeReport ? { ...c, messages: [...(c.messages || []), newMsg] } : c) : prev);
        setInputValue('');
    }

    return ( 
        <div className = 'chat-wrapper'>
            {show && (
                <div ref={popoverRef} className='chats-popover p-0 overflow-hidden'>
                    <div className="row h-100 m-0">
                        <div className="col-4 h-100 border-end p-0">
                            <div className="h-100 overflow-auto list-group list-group-flush">
                                {(chats || MOCK_CHATS).map((c) => (
                                    <button
                                        key={c.report.id}
                                        type="button"
                                        className={`list-group-item list-group-item-action d-flex flex-column ${activeReport === c.report.id ? 'active' : ''}`}
                                        onClick={() => {
                                            setActiveReport(c.report.id);
                                            const msgs = (c.messages && c.messages.length > 0) ? c.messages : (MOCK_MESSAGES[c.report.id] || []);
                                            setMessages(msgs);
                                        }}
                                    >
                                        <div className="d-flex justify-content-between w-100">
                                            <div className="fw-semibold">Report #{c.report.id}</div>
                                            <small className="text-muted">{c.report.title}</small>
                                        </div>
                                        <div className="mt-2 d-flex gap-2">
                                            <Badge bg={c.report.status === 'Assigned' ? 'primary' : c.report.status === 'Resolved' ? 'success' : 'warning'}>
                                                {c.report.status}
                                            </Badge>
                                            <Badge bg="secondary">{c.report.category?.name}</Badge>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="col-8 d-flex flex-column p-0">
                            {(() => {
                                const selected = (chats || MOCK_CHATS).find(c => c.report.id === activeReport);
                                const otherUserDerived = selected?.users.find(u => u.id !== user?.id) || null;
                                return (
                                    <div className="chat-right-header d-flex align-items-center gap-2 p-2 border-bottom">
                                        <img src={otherUserDerived?.image || `https://i.pravatar.cc/48?u=${otherUserDerived?.id || 'anon'}`} alt="user" width={40} height={40} className="rounded-circle" />
                                        <div>
                                            <div className="fw-semibold">{otherUserDerived ? `${otherUserDerived.firstName} ${otherUserDerived.lastName}` : 'Seleziona una chat'}</div>
                                            <div className="small text-muted">{otherUserDerived ? 'Online' : ''}</div>
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="chat-messages flex-grow-1 overflow-auto p-3">
                                {messages && messages.length > 0 ? (
                                    messages.map(m => (
                                        <div key={m.id} className={`mb-2 d-flex ${m.sender.id === user?.id ? 'justify-content-end' : 'justify-content-start'}`}>
                                            <div className={`message-bubble ${m.sender.id === user?.id ? 'mine' : 'other'}`}>
                                                <div className="small text-muted mb-1">{new Date(m.sentAt).toLocaleTimeString()}</div>
                                                <div>{m.text}</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-muted p-3">Seleziona una chat per vedere i messaggi</div>
                                )}
                            </div>

                            <div className="chat-input d-flex gap-2 p-2 border-top">
                                <input
                                    className="form-control"
                                    placeholder="Scrivi un messaggio..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } }}
                                />
                                <button className="btn btn-primary d-flex align-items-center justify-content-center" onClick={() => handleSend()}>
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
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