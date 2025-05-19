import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

interface TypingBoxProps {
  onSendMessage: (message: string) => void;
  onTyping: () => void;
  loading: boolean;
  isSending: boolean;
}

const emojiPickerVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

export default function TypingBox({ onSendMessage, onTyping, loading, isSending }: TypingBoxProps) {
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isSending || !newMessage.trim()) return;

    onSendMessage(newMessage.trim());
    setNewMessage("");
  };

  const handleEmojiSelect = (emoji: any) => {
    setNewMessage((prev) => prev + emoji.native);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-full bg-white/80 backdrop-blur-sm border-t shadow-lg z-10 p-2"
    >
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 max-w-2xl mx-auto items-center"
      >
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow text-xl focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={() => setShowEmojiPicker((v) => !v)}
            aria-label="Open emoji picker"
            tabIndex={-1}
          >
            <span role="img" aria-label="emoji">
              😀
            </span>
          </motion.button>
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                variants={emojiPickerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute bottom-12 left-0 z-50"
              >
                <Picker
                  data={data}
                  onEmojiSelect={handleEmojiSelect}
                  theme="light"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Input
          ref={inputRef}
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            onTyping();
          }}
          placeholder="Type a message..."
          disabled={loading || isSending}
          className="flex-1 rounded-full bg-white/90 px-4 py-3 text-base focus:bg-white focus:ring-2 focus:ring-primary transition-colors duration-200"
        />
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            type="submit"
            size="icon"
            disabled={loading || isSending || !newMessage.trim()}
            className="hover:scale-105 transition-transform duration-200 bg-primary text-white rounded-full p-3"
          >
            <Send className="h-5 w-5" />
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
} 