import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CustomNavbar from './CustomNavbar';
import { Container, Form, Button, Card, Row, Col } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { validateUser, resendCode } from '../api/api';
import toast from 'react-hot-toast';

const ConfirmCodePage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const [username, setUsername] = useState('');
    const [codeDigits, setCodeDigits] = useState<string[]>(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    // Start with 60s cooldown on first arrival; user cannot resend immediately
    const [cooldown, setCooldown] = useState<number>(60);
    const [canResend, setCanResend] = useState<boolean>(false);

    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

    const isFormValid = username.trim() !== '' && codeDigits.every(d => d.trim().length === 1);

    useEffect(() => {
        const state = location.state as { username?: string } | null;
        setUsername(state?.username || '');
    }, [location.state]);
    
    useEffect(() => {
        if(cooldown > 0) {
            setCanResend(false);

            const t = setInterval(() => {
                setCooldown(prev => {
                    const next = prev > 0 ? prev - 1 : 0;
                    if(next === 0) setCanResend(true);
                    
                    return next;
                });
            }, 1000);

            return () => clearInterval(t);
        } else {
            setCanResend(true);
        }
    }, [cooldown]);
    
    const handleDigitChange = (index: number, value: string) => {
        if(!/^[0-9]?$/.test(value)) return;
        
        const next = [...codeDigits];
        next[index] = value;
        setCodeDigits(next);
        
        if(value && index < 5) inputsRef.current[index + 1]?.focus();
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        const key = e.key;
        if(key === 'Backspace') {
            if(codeDigits[index]) {
                const next = [...codeDigits];
                next[index] = '';
                
                setCodeDigits(next);
            } else if(index > 0) {
                inputsRef.current[index - 1]?.focus();
                const next = [...codeDigits];
                next[index - 1] = '';
                
                setCodeDigits(next);
            }
        } else if(key === 'ArrowLeft' && index > 0) inputsRef.current[index - 1]?.focus();
        else if(key === 'ArrowRight' && index < 5) inputsRef.current[index + 1]?.focus();
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();

        const pasted = e.clipboardData.getData('Text').trim();
        const digits = pasted.replace(/\D/g, '').slice(0, 6).split('');
        
        if(digits.length === 0) return;
        
        const next = [...codeDigits];
        for(let i = 0; i < 6; i++) next[i] = digits[i] || '';
        setCodeDigits(next);
        
        const lastIndex = Math.min(digits.length, 6) - 1;
        if(lastIndex >= 0) inputsRef.current[lastIndex]?.focus();
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if(!isFormValid) return;

        setLoading(true);

        const code = codeDigits.join('');
        try {
            await validateUser({ payload: { username: username.trim(), code: code.trim() } });

            toast.success('Account verified! You can log in.');
            navigate('/login');
        } catch(err) {
            console.error('Validate error', err);
            const msg = (err as Error)?.message || 'Validation failed';
            toast.error(msg);
            
            setCooldown(0);
            setCanResend(true);
        } finally {
            setLoading(false);
        }
    }

    const handleResend = async () => {

        console.log('here1');
        if(!username.trim()) {
            toast.error('Please enter username first');
            return;
        }

        console.log('here2');

        if(!canResend) return;

        console.log('here3');

        try {
            setCanResend(false);

            await resendCode({ username: username.trim() });
            
            toast.success('New code sent');
            setCooldown(60);
        } catch(err) {
            console.error('Resend error', err);
            toast.error((err as Error)?.message || 'Failed to resend');
            
            setCanResend(true);
        }
    }

    return (
        <>
            <CustomNavbar/>
            <Container className = 'my-5'>
                <Row className = 'justify-content-md-center'>
                    <Col md = { 6 } lg = { 5 }>
                        <motion.div initial = {{ opacity: 0, y: 18 }} animate = {{ opacity: 1, y: 0 }} transition = {{ duration: 0.55, ease: 'easeOut' }}>
                            <Card className = 'auth-card'>
                                <Card.Body>
                                    <motion.h2 className = 'text-center mb-4 auth-title' initial = {{ opacity: 0, y: -12 }} animate = {{ opacity: 1, y: 0 }} transition = {{ duration: 0.5 }}>Confirm Code</motion.h2>
                                    <Form onSubmit = { handleSubmit} className = 'd-flex flex-column auth-grid-gap'>
                                        <motion.div initial = {{ opacity: 0, y: 10 }} animate = {{ opacity: 1, y: 0 }} transition = {{ delay: 0.22, duration: 0.4 }}>
                                            <Form.Group className = 'mb-3 underline-anim' controlId = 'formUsername'>
                                                <Form.Label>Username</Form.Label>
                                                <Form.Control id = 'username' type = 'text' placeholder = 'mario.rossi' value = { username } onChange = { e => setUsername(e.target.value) } required className = 'auth-input'/>
                                            </Form.Group>
                                        </motion.div>
                                        <motion.div initial = {{ opacity: 0, y: 10 }} animate = {{ opacity: 1, y: 0 }} transition = {{ delay: 0.27, duration: 0.4 }}>
                                            <Form.Group className = 'mb-3' controlId = 'formCode'>
                                                <Form.Label>Code</Form.Label>
                                                <div className = 'd-flex justify-content-center' onPaste = { handlePaste }>
                                                    {Array.from({ length: 6 }).map((_, i) => (
                                                        <input key = { i } ref = { el => { inputsRef.current[i] = el } } className='text-center otp-input' inputMode = 'numeric' pattern = '[0-9]*' maxLength = { 1 } value = { codeDigits[i] } onChange = { e => handleDigitChange(i, e.target.value) } onKeyDown = { e => handleKeyDown(e, i) } aria-label = { `Digit ${i + 1}` }/>
                                                    ))}
                                                </div>
                                            </Form.Group>
                                        </motion.div>
                                        <motion.div initial = {{ opacity: 0, y: 12 }} animate = {{ opacity: 1, y: 0 }} transition = {{ delay: 0.55, duration: 0.45 }}>
                                            <Button id = 'submit-button' variant = 'primary' type = 'submit' className = 'w-100 mt-2 auth-button-primary' disabled = { loading || !isFormValid }>
                                                {loading ? 'Confirming...' : 'Confirm'}
                                            </Button>
                                        </motion.div>
                                    </Form>
                                    <motion.div className = 'mt-3 text-center' initial = {{ opacity: 0 }} animate = {{ opacity: 1 }} transition = {{ delay: 0.65, duration: 0.45 }}>
                                        {cooldown > 0 ? `Resend available in ${cooldown}s` : (
                                            <div>
                                                Click <span id = 'resend-code' onClick = { handleResend } className = 'auth-link-inline'>here</span> to resend the code
                                            </div>
                                        )}
                                    </motion.div>
                                </Card.Body>
                            </Card>
                        </motion.div>
                    </Col>
                </Row>
            </Container>
        </>
    )
}

export default ConfirmCodePage;