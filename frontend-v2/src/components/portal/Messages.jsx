import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { messageService } from '@/services/messageService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, MessageSquare } from 'lucide-react';

export default function Messages({ clientId: propClientId }) {
  const { user } = useAuth();
  const clientId = propClientId || user?.clientId;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!clientId) return;
    fetchMessages();
    messageService.markRead(clientId).catch(() => {});

    // Poll every 15 seconds
    pollRef.current = setInterval(() => {
      fetchMessages(true);
    }, 15000);

    return () => clearInterval(pollRef.current);
  }, [clientId]);

  const fetchMessages = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await messageService.getMessages(clientId);
      setMessages(data);
      if (!silent) {
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await messageService.sendMessage(clientId, text.trim());
      setText('');
      await fetchMessages();
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  if (!clientId) {
    return <p className="text-muted-foreground">No client linked.</p>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {!propClientId && <h1 className="text-2xl font-bold text-white mb-4">Messages</h1>}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto bg-card rounded-lg p-4 space-y-3 min-h-0">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-muted-foreground" size={24} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <MessageSquare size={40} className="mb-3" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender === user?.userId || msg.sender === user?.id;
            return (
              <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-lg px-3 py-2 ${isOwn ? 'bg-primary/20 text-white' : 'bg-muted text-white'}`}>
                  {!isOwn && (
                    <p className="text-[10px] text-primary font-medium mb-0.5">
                      {msg.senderName || 'CA Firm'}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 text-right">
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSend} className="flex gap-2 mt-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="bg-secondary border-0 text-sm flex-1"
          disabled={sending}
        />
        <Button type="submit" size="icon" disabled={!text.trim() || sending} className="shrink-0">
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </Button>
      </form>
    </div>
  );
}

function formatTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString();
}
