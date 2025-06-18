"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  Languages,
  MessageCircle,
  Wifi,
  WifiOff,
  Edit3,
  Check,
  X,
  Clock,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface VocabularyWord {
  word: string;
  vietnamese: string;
  pronunciation: string;
}

export default function EnglishConversationApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [isAIResponding, setIsAIResponding] = useState(false);
  const [apiStatus, setApiStatus] = useState<
    "ready" | "connected" | "local" | "error"
  >("ready");
  const [isClient, setIsClient] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editMessage, setEditMessage] = useState("");
  const [editTimer, setEditTimer] = useState<NodeJS.Timeout | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [isAutoSendActive, setIsAutoSendActive] = useState(true);
  const [hasUserTyped, setHasUserTyped] = useState(false);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fix hydration by ensuring client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Essential vocabulary for English learners
  const vocabularyDict: Record<string, VocabularyWord> = {
    hello: { word: "hello", vietnamese: "xin chào", pronunciation: "/həˈloʊ/" },
    good: { word: "good", vietnamese: "tốt", pronunciation: "/ɡʊd/" },
    morning: {
      word: "morning",
      vietnamese: "buổi sáng",
      pronunciation: "/ˈmɔːrnɪŋ/",
    },
    how: { word: "how", vietnamese: "như thế nào", pronunciation: "/haʊ/" },
    are: { word: "are", vietnamese: "là", pronunciation: "/ɑːr/" },
    you: { word: "you", vietnamese: "bạn", pronunciation: "/juː/" },
    today: { word: "today", vietnamese: "hôm nay", pronunciation: "/təˈdeɪ/" },
    weather: {
      word: "weather",
      vietnamese: "thời tiết",
      pronunciation: "/ˈweðər/",
    },
    beautiful: {
      word: "beautiful",
      vietnamese: "đẹp",
      pronunciation: "/ˈbjuːtɪfəl/",
    },
    nice: { word: "nice", vietnamese: "đẹp, tốt", pronunciation: "/naɪs/" },
    thank: { word: "thank", vietnamese: "cảm ơn", pronunciation: "/θæŋk/" },
    thanks: { word: "thanks", vietnamese: "cảm ơn", pronunciation: "/θæŋks/" },
    please: {
      word: "please",
      vietnamese: "xin vui lòng",
      pronunciation: "/pliːz/",
    },
    help: { word: "help", vietnamese: "giúp đỡ", pronunciation: "/help/" },
    understand: {
      word: "understand",
      vietnamese: "hiểu",
      pronunciation: "/ˌʌndərˈstænd/",
    },
    speak: { word: "speak", vietnamese: "nói", pronunciation: "/spiːk/" },
    learn: { word: "learn", vietnamese: "học", pronunciation: "/lɜːrn/" },
    practice: {
      word: "practice",
      vietnamese: "luyện tập",
      pronunciation: "/ˈpræktɪs/",
    },
    english: {
      word: "english",
      vietnamese: "tiếng Anh",
      pronunciation: "/ˈɪŋɡlɪʃ/",
    },
    language: {
      word: "language",
      vietnamese: "ngôn ngữ",
      pronunciation: "/ˈlæŋɡwɪdʒ/",
    },
    conversation: {
      word: "conversation",
      vietnamese: "cuộc trò chuyện",
      pronunciation: "/ˌkɑːnvərˈseɪʃən/",
    },
    work: { word: "work", vietnamese: "công việc", pronunciation: "/wɜːrk/" },
    study: { word: "study", vietnamese: "học tập", pronunciation: "/ˈstʌdi/" },
    family: {
      word: "family",
      vietnamese: "gia đình",
      pronunciation: "/ˈfæməli/",
    },
    friend: { word: "friend", vietnamese: "bạn bè", pronunciation: "/frend/" },
    like: { word: "like", vietnamese: "thích", pronunciation: "/laɪk/" },
    love: { word: "love", vietnamese: "yêu", pronunciation: "/lʌv/" },
    food: { word: "food", vietnamese: "thức ăn", pronunciation: "/fuːd/" },
    time: { word: "time", vietnamese: "thời gian", pronunciation: "/taɪm/" },
    what: { word: "what", vietnamese: "cái gì", pronunciation: "/wʌt/" },
    where: { word: "where", vietnamese: "ở đâu", pronunciation: "/wer/" },
    when: { word: "when", vietnamese: "khi nào", pronunciation: "/wen/" },
    why: { word: "why", vietnamese: "tại sao", pronunciation: "/waɪ/" },
    can: { word: "can", vietnamese: "có thể", pronunciation: "/kæn/" },
    want: { word: "want", vietnamese: "muốn", pronunciation: "/wɑːnt/" },
    need: { word: "need", vietnamese: "cần", pronunciation: "/niːd/" },
    know: { word: "know", vietnamese: "biết", pronunciation: "/noʊ/" },
    think: { word: "think", vietnamese: "nghĩ", pronunciation: "/θɪŋk/" },
    feel: { word: "feel", vietnamese: "cảm thấy", pronunciation: "/fiːl/" },
    yes: { word: "yes", vietnamese: "có", pronunciation: "/jes/" },
    no: { word: "no", vietnamese: "không", pronunciation: "/noʊ/" },
    sorry: { word: "sorry", vietnamese: "xin lỗi", pronunciation: "/ˈsɑːri/" },
    welcome: {
      word: "welcome",
      vietnamese: "chào mừng",
      pronunciation: "/ˈwelkəm/",
    },
    goodbye: {
      word: "goodbye",
      vietnamese: "tạm biệt",
      pronunciation: "/ɡʊdˈbaɪ/",
    },
  };

  // Initialize speech recognition only on client
  useEffect(() => {
    if (!isClient) return;

    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCurrentTranscript(transcript);
        startEditMode(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isClient]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (editTimer) clearTimeout(editTimer);
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
    };
  }, [editTimer]);

  const clearAllTimers = () => {
    if (editTimer) {
      clearTimeout(editTimer);
      setEditTimer(null);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const startEditMode = useCallback(
    (message: string) => {
      setEditMessage(message);
      setIsEditing(true);
      setCountdown(3);
      setIsAutoSendActive(true);
      setHasUserTyped(false);

      // Clear any existing timers
      clearAllTimers();

      // Start countdown
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      countdownIntervalRef.current = countdownInterval;

      // Auto-send after 3 seconds
      const timer = setTimeout(() => {
        clearInterval(countdownInterval);
        if (isAutoSendActive) {
          sendMessage(message);
          setIsEditing(false);
          setEditMessage("");
          setHasUserTyped(false);
        }
      }, 3000);

      setEditTimer(timer);
    },
    [isAutoSendActive]
  );

  const handleEditMessageChange = (value: string) => {
    setEditMessage(value);

    // If user starts typing, stop auto-send
    if (!hasUserTyped) {
      setHasUserTyped(true);
      setIsAutoSendActive(false);
      clearAllTimers();
      setCountdown(0);
    }
  };

  const cancelEdit = () => {
    clearAllTimers();
    setIsEditing(false);
    setEditMessage("");
    setCountdown(3);
    setIsAutoSendActive(true);
    setHasUserTyped(false);
  };

  const confirmEdit = () => {
    clearAllTimers();
    sendMessage(editMessage);
    setIsEditing(false);
    setEditMessage("");
    setCountdown(3);
    setIsAutoSendActive(true);
    setHasUserTyped(false);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsAIResponding(true);
    setCurrentTranscript("");
    setTextInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponse = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("0:")) {
              try {
                const data = JSON.parse(line.slice(2));
                if (data.content) {
                  aiResponse += data.content;
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        }
      }

      if (!aiResponse) {
        aiResponse =
          "I'm here to help you practice English! What would you like to talk about?";
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Determine if response came from API or local
      if (
        aiResponse.includes("fascinating") ||
        aiResponse.includes("wonderful")
      ) {
        setApiStatus("local");
      } else {
        setApiStatus("connected");
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      setApiStatus("error");

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I'm having some connection issues, but I'm still here to help! What would you like to practice?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsAIResponding(false);
    }
  };

  const startListening = () => {
    if (!isClient || !recognitionRef.current || isListening) return;

    try {
      setIsListening(true);
      recognitionRef.current.start();
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (!isClient || !recognitionRef.current || !isListening) return;

    try {
      recognitionRef.current.stop();
      setIsListening(false);
    } catch (error) {
      console.error("Error stopping speech recognition:", error);
    }
  };

  const handleWordClick = (word: string) => {
    if (!isClient) return;

    const cleanWord = word.toLowerCase().replace(/[.,!?;:"'()]/g, "");
    const vocabWord = vocabularyDict[cleanWord];

    if (vocabWord && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(vocabWord.word);
      utterance.lang = "en-US";
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const renderMessageWithClickableWords = (content: string) => {
    const words = content.split(" ");
    return words.map((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[.,!?;:"'()]/g, "");
      const isVocabWord = vocabularyDict[cleanWord];

      return (
        <span key={index}>
          {isVocabWord ? (
            <Popover>
              <PopoverTrigger asChild>
                <span
                  className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline font-medium"
                  onClick={() => handleWordClick(word)}
                >
                  {word}
                </span>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-lg">
                      {isVocabWord.word}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleWordClick(word)}
                      className="p-1 h-auto"
                    >
                      <Volume2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600">
                    {isVocabWord.pronunciation}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Languages className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{isVocabWord.vietnamese}</span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <span>{word}</span>
          )}
          {index < words.length - 1 && " "}
        </span>
      );
    });
  };

  const getStatusColor = () => {
    switch (apiStatus) {
      case "connected":
        return "text-green-600";
      case "local":
        return "text-blue-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusText = () => {
    switch (apiStatus) {
      case "connected":
        return (
          <div className="flex items-center gap-1">
            <Wifi className="w-4 h-4" />
            AI Connected
          </div>
        );
      case "local":
        return (
          <div className="flex items-center gap-1">
            <WifiOff className="w-4 h-4" />
            Local Mode
          </div>
        );
      case "error":
        return "⚠️ Connection Error";
      default:
        return "🚀 Ready to Chat";
    }
  };

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading English Practice App...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 pb-32">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🗣️ English Conversation Practice
          </h1>
          <p className="text-gray-600 mb-2">
            Practice English with AI • Click blue words for vocabulary help
          </p>
          <div
            className={`text-sm font-medium ${getStatusColor()} flex items-center justify-center gap-1`}
          >
            {getStatusText()}
          </div>
        </div>

        {/* Edit Message Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Edit3 className="w-5 h-5" />
                  Edit Your Message
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Timer Display */}
                {isAutoSendActive && countdown > 0 ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-2">
                      <Clock className="w-4 h-4" />
                      Auto-sending in{" "}
                      <span className="font-bold text-blue-600">
                        {countdown}
                      </span>{" "}
                      seconds
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4">
                      <Edit3 className="w-4 h-4" />
                      {hasUserTyped
                        ? "Auto-send stopped - Click Send to continue"
                        : "Ready to send"}
                    </div>
                  </div>
                )}

                <Input
                  ref={editInputRef}
                  value={editMessage}
                  onChange={(e) => handleEditMessageChange(e.target.value)}
                  placeholder="Edit your message..."
                  className="w-full"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      confirmEdit();
                    } else if (e.key === "Escape") {
                      cancelEdit();
                    }
                  }}
                />

                <div className="flex gap-2">
                  <Button
                    onClick={confirmEdit}
                    className="flex-1"
                    size="sm"
                    disabled={!editMessage.trim()}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                  <Button
                    onClick={cancelEdit}
                    variant="outline"
                    className="flex-1"
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>

                <div className="text-xs text-gray-500 text-center">
                  💡 Tip: Start typing to stop auto-send timer
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Chat Interface */}
        <Card className="h-[600px] flex flex-col shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="w-5 h-5" />
              Conversation
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-4 pb-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 py-12">
                    <div className="mb-4">
                      <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        Start Your English Practice!
                      </h3>
                      <p className="text-sm mb-4">
                        Use the microphone to speak or type your message below
                      </p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg text-left max-w-md mx-auto">
                      <h4 className="font-semibold text-blue-800 mb-2">
                        💡 Try saying:
                      </h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• "Hello, how are you today?"</li>
                        <li>• "What's the weather like?"</li>
                        <li>• "I want to practice English"</li>
                        <li>• "Tell me about yourself"</li>
                      </ul>
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                        message.role === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-800 border shadow-sm"
                      }`}
                    >
                      {message.role === "user" ? (
                        <p className="text-sm">{message.content}</p>
                      ) : (
                        <div className="text-sm leading-relaxed">
                          {renderMessageWithClickableWords(message.content)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isAIResponding && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-800 px-4 py-3 rounded-2xl border shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t p-4 space-y-4">
              {/* Text Input */}
              <div className="flex space-x-2">
                <Input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type your message here..."
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(textInput);
                    }
                  }}
                  disabled={isAIResponding || isEditing}
                />
                <Button
                  onClick={() => sendMessage(textInput)}
                  disabled={!textInput.trim() || isAIResponding || isEditing}
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Voice Input */}
              <div className="flex justify-center">
                <Button
                  onClick={isListening ? stopListening : startListening}
                  variant={isListening ? "destructive" : "default"}
                  size="lg"
                  className="rounded-full px-8 py-3"
                  disabled={isAIResponding || isEditing}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-5 h-5 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 mr-2" />
                      Start Speaking
                    </>
                  )}
                </Button>
              </div>

              {/* Status */}
              <div className="text-center">
                <div className="text-sm text-gray-600">
                  {isListening && (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span>🎤 Listening... Speak now!</span>
                    </div>
                  )}
                  {isAIResponding && (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span>🤖 AI is thinking...</span>
                    </div>
                  )}
                  {isEditing && (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span>✏️ Edit your message above</span>
                    </div>
                  )}
                  {!isListening && !isAIResponding && !isEditing && (
                    <span>💬 Ready for conversation - Type or speak!</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-blue-50 to-transparent p-4 pointer-events-none">
        <div className="max-w-4xl mx-auto text-center text-sm text-gray-500">
          <p>
            🎯 Click on blue words to hear pronunciation and see Vietnamese
            translation
          </p>
          <p className="mt-1">
            {apiStatus === "local" &&
              "🏠 Running in local mode - great for practice!"}
            {apiStatus === "connected" &&
              "🌐 Connected to AI - enhanced responses!"}
            {apiStatus === "error" &&
              "⚠️ Connection issues - using backup responses"}
          </p>
        </div>
      </div>
    </div>
  );
}
