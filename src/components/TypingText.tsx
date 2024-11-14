
import { useEffect, useState } from "react";

const TypingText = () => {
  const [text, setText] = useState<string>("");
  const typingText = ".AI";
  const typingSpeed = 150;
  const deletingSpeed = 100;
  const pauseDuration = 600;
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    const updateText = () => {
      if (isDeleting) {
        setText((prev) => prev.slice(0, -1));
        if (text.length === 0) {
          setIsDeleting(false);
        }
      } else {
        setText((prev) => typingText.slice(0, prev.length + 1));
        if (text.length === typingText.length) {
          setTimeout(() => setIsDeleting(true), pauseDuration);
        }
      }
    };

    const typingInterval = setInterval(updateText, isDeleting ? deletingSpeed : typingSpeed);

    return () => clearInterval(typingInterval);
  }, [text, isDeleting]);

  return <span className="text-zinc-600">{text}</span>;
};

export default TypingText;
