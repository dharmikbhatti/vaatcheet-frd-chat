import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Camera, Smile, Plus } from "lucide-react";
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

export default function TypingBox({
  onSendMessage,
  onTyping,
  loading,
  isSending,
}: TypingBoxProps) {
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
      className="w-full bg-white/80 backdrop-blur-sm border-t z-10 p-2 absolute bottom-0 left-0 right-0"
    >
      <form
        onSubmit={handleSubmit}
        className="flex items-center max-w-2xl mx-auto"
      >
        <div className="relative flex-1 flex items-center bg-white rounded-full shadow-md px-3 py-2 border border-gray-200">
          <button
            type="button"
            className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-purple-100 hover:text-purple-500 transition mr-1"
            onClick={() => setShowEmojiPicker((v) => !v)}
            aria-label="Open emoji picker"
            tabIndex={-1}
          >
            <Smile className="w-5 h-5" />
          </button>
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              onTyping();
            }}
            placeholder="Message..."
            disabled={loading || isSending}
            className="flex-1 bg-transparent border-none outline-none px-2 py-1 text-base focus:ring-0"
          />
          <button
            type="button"
            className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-purple-100 hover:text-purple-500 transition ml-1"
          >
            <Plus className="w-5 h-5" />
          </button>
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
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.96 }}
          type="submit"
          disabled={loading || isSending || !newMessage.trim()}
          className="ml-2 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full p-3 shadow-lg hover:scale-105 transition"
        >
          <Send className="h-5 w-5" />
        </motion.button>
      </form>
    </motion.div>
  );
}
