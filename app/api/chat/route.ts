export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || "";

    console.log("🎯 Received message:", lastMessage);

    // Try Hugging Face API with a reliable text generation model
    if (process.env.HUGGINGFACE_API_KEY) {
      try {
        console.log("🤖 Calling Hugging Face API...");

        // Create a conversational prompt
        const conversationPrompt = `You are a friendly English conversation tutor. Have a natural conversation with the student.

Student: ${lastMessage}
Tutor:`;

        const hfResponse = await fetch(
          "https://api-inference.huggingface.co/models/google/flan-t5-base",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inputs: conversationPrompt,
              parameters: {
                max_new_tokens: 100,
                temperature: 0.7,
                do_sample: true,
                top_p: 0.9,
                repetition_penalty: 1.1,
              },
              options: {
                wait_for_model: true,
                use_cache: false,
              },
            }),
          }
        );

        console.log("📡 HF Response status:", hfResponse.status);

        if (hfResponse.ok) {
          const data = await hfResponse.json();
          console.log("📦 HF Response data:", data);

          let aiResponse = "";

          // Handle response format
          if (Array.isArray(data) && data[0]?.generated_text) {
            aiResponse = data[0].generated_text.trim();
          } else if (data.generated_text) {
            aiResponse = data.generated_text.trim();
          }

          // Clean the response
          if (aiResponse && aiResponse.length > 5) {
            // Remove the prompt from the response if it's included
            aiResponse = aiResponse.replace(conversationPrompt, "").trim();

            if (aiResponse.length > 10) {
              console.log("✅ Using HF response:", aiResponse);
              return new Response(
                `0:${JSON.stringify({ content: aiResponse })}\n`,
                {
                  headers: {
                    "Content-Type": "text/plain",
                    "Cache-Control": "no-cache",
                  },
                }
              );
            }
          }
        } else {
          const errorText = await hfResponse.text();
          console.log("❌ HF API error:", hfResponse.status, errorText);

          // Try a different model if the first fails
          console.log("🔄 Trying GPT-2 model...");

          const gpt2Response = await fetch(
            "https://api-inference.huggingface.co/models/gpt2",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                inputs: `English Teacher: Hello! I'm here to help you practice English conversation.
Student: ${lastMessage}
English Teacher:`,
                parameters: {
                  max_new_tokens: 80,
                  temperature: 0.8,
                  do_sample: true,
                  top_p: 0.9,
                  stop: ["Student:", "English Teacher:", "\n\n"],
                },
                options: {
                  wait_for_model: true,
                },
              }),
            }
          );

          if (gpt2Response.ok) {
            const gpt2Data = await gpt2Response.json();
            console.log("📦 GPT-2 Response:", gpt2Data);

            let gpt2AiResponse = "";
            if (Array.isArray(gpt2Data) && gpt2Data[0]?.generated_text) {
              const fullText = gpt2Data[0].generated_text;
              // Extract only the teacher's response
              const teacherResponse = fullText
                .split("English Teacher:")
                .pop()
                ?.trim();
              if (teacherResponse) {
                gpt2AiResponse = teacherResponse.split("Student:")[0].trim();
              }
            }

            if (gpt2AiResponse && gpt2AiResponse.length > 10) {
              console.log("✅ Using GPT-2 response:", gpt2AiResponse);
              return new Response(
                `0:${JSON.stringify({ content: gpt2AiResponse })}\n`,
                {
                  headers: {
                    "Content-Type": "text/plain",
                    "Cache-Control": "no-cache",
                  },
                }
              );
            }
          }
        }
      } catch (hfError) {
        console.log("🔄 Hugging Face API failed:", hfError);
      }
    }

    // Enhanced fallback responses
    console.log("🏠 Using enhanced local response fallback");
    const localResponse = generateSmartResponse(lastMessage, messages);

    return new Response(`0:${JSON.stringify({ content: localResponse })}\n`, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("💥 Chat API error:", error);

    const fallbackResponse =
      "I'm here to help you practice English! What would you like to talk about?";

    return new Response(
      `0:${JSON.stringify({ content: fallbackResponse })}\n`,
      {
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "no-cache",
        },
      }
    );
  }
}

function generateSmartResponse(userMessage: string, messages: any[]): string {
  const message = userMessage.toLowerCase();
  const conversationLength = messages.length;

  // First message - warm welcome
  if (conversationLength <= 1) {
    return "Hello! I'm excited to help you practice English today. How are you feeling? What would you like to talk about?";
  }

  // Greeting responses
  if (
    message.includes("hello") ||
    message.includes("hi") ||
    message.includes("hey")
  ) {
    const greetings = [
      "Hello! It's wonderful to meet you. How has your day been so far?",
      "Hi there! I'm so glad you're here to practice English. What's on your mind today?",
      "Hey! Welcome! I love helping people improve their English. What interests you most?",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // How are you responses
  if (message.includes("how are you") || message.includes("how do you do")) {
    const responses = [
      "I'm doing fantastic, thank you for asking! I really enjoy our conversations. How about you? What's been the highlight of your day?",
      "I'm wonderful! I love helping people practice English - it's so rewarding. How are you feeling about your English progress?",
      "I'm great, thanks! Every conversation teaches me something new too. What brings you here to practice today?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Weather responses
  if (
    message.includes("weather") ||
    message.includes("sunny") ||
    message.includes("rain") ||
    message.includes("cold") ||
    message.includes("hot")
  ) {
    const responses = [
      "Weather is such a universal topic! What's the weather like where you are right now? Do you have a favorite type of weather?",
      "I love talking about weather - it's perfect for English practice! What's your favorite season and what do you like to do during that time?",
      "Weather affects our mood so much, doesn't it? How does different weather make you feel? Do you prefer staying indoors or going outside?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Food responses
  if (
    message.includes("food") ||
    message.includes("eat") ||
    message.includes("hungry") ||
    message.includes("cook") ||
    message.includes("restaurant")
  ) {
    const responses = [
      "Food is one of my absolute favorite topics! What's your favorite dish to cook at home? Do you enjoy trying recipes from different countries?",
      "That sounds delicious! What kind of cuisine do you enjoy most? Have you ever tried cooking something completely new?",
      "Food brings people together in such beautiful ways! What's a traditional dish from your culture? I'd love to learn about it!",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Work/Study responses
  if (
    message.includes("work") ||
    message.includes("job") ||
    message.includes("study") ||
    message.includes("school") ||
    message.includes("university")
  ) {
    const responses = [
      "Work and study are such important parts of our lives! What do you do for work, or what are you studying? What do you find most interesting about it?",
      "That sounds really interesting! How long have you been doing that? What's the most challenging part, and what do you enjoy most?",
      "Career and education shape us so much! What are your goals for the future? Is there something new you'd like to learn or try?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Family responses
  if (
    message.includes("family") ||
    message.includes("mother") ||
    message.includes("father") ||
    message.includes("sister") ||
    message.includes("brother") ||
    message.includes("parents")
  ) {
    const responses = [
      "Family is so precious! Tell me about your family. Do you have siblings? What's your favorite thing to do together?",
      "That's wonderful! Family relationships are so special. What's your happiest memory with your family?",
      "Family conversations are perfect for English practice! How often do you spend time with your family? Do you have any family traditions?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Hobbies responses
  if (
    message.includes("hobby") ||
    message.includes("music") ||
    message.includes("movie") ||
    message.includes("book") ||
    message.includes("sport") ||
    message.includes("game")
  ) {
    const responses = [
      "Hobbies make life so much more interesting! What do you love doing in your free time? How did you first get interested in that?",
      "That sounds like such a fun hobby! How often do you get to do it? Have you met other people who share the same passion?",
      "Hobbies are wonderful for relaxation and growth! What's something new you'd like to try? Do you prefer activities that are more active or more peaceful?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Travel responses
  if (
    message.includes("travel") ||
    message.includes("trip") ||
    message.includes("vacation") ||
    message.includes("country") ||
    message.includes("visit")
  ) {
    const responses = [
      "Travel is so exciting and educational! Where would you most like to visit someday? What attracts you to that place?",
      "That sounds like an amazing experience! What's the most interesting place you've ever been to? What made it so special for you?",
      "I love hearing travel stories! Do you prefer relaxing beach vacations or adventurous city explorations? What's your dream destination?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // English learning responses
  if (
    message.includes("english") ||
    message.includes("learn") ||
    message.includes("practice") ||
    message.includes("language") ||
    message.includes("improve")
  ) {
    const responses = [
      "English learning is such a wonderful journey! How long have you been studying English? What's your favorite way to practice?",
      "That's fantastic that you're working on your English! What part do you find most challenging - grammar, vocabulary, pronunciation, or conversation?",
      "Keep up the excellent work with English! What motivates you to learn English? Do you have specific goals you're working toward?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Feelings/emotions responses
  if (
    message.includes("happy") ||
    message.includes("sad") ||
    message.includes("excited") ||
    message.includes("tired") ||
    message.includes("stressed")
  ) {
    const responses = [
      "Thank you for sharing how you're feeling with me. It's important to talk about our emotions. What's been affecting your mood lately?",
      "I appreciate you being open about your feelings. That takes courage! What usually helps you when you're feeling this way?",
      "Emotions are such a big part of being human. What do you like to do to take care of yourself when you're feeling like this?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Default engaging responses
  const defaultResponses = [
    "That's really fascinating! I'd love to hear more about your thoughts on this. What's your personal experience with this topic?",
    "How interesting! You've got me curious now. What's the most important thing you think people should know about this?",
    "That's such a great point! I hadn't thought about it that way before. What led you to this perspective?",
    "Thank you for sharing that with me! What questions do you have about this topic? I'm here to help you explore it.",
    "That's wonderful insight! How do you think this might change or develop in the future? What are your predictions?",
    "I really appreciate you telling me about this! What advice would you give to someone who's completely new to this topic?",
    "That's absolutely fascinating! What's your favorite aspect of this? What keeps you most interested in it?",
    "What a thoughtful perspective! How do you see this connecting to other parts of your life? Does it influence other things you do?",
  ];

  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}
