/**
 * Roth Davies Law Firm Chatbot
 * A modular, performance-optimized implementation
 */
(function() {
  // Configuration module - centralized settings
  
  // Get site-specific config if provided
  const siteConfig = window.LawChatbotConfig || {};

  const Config = {
    // API keys - merged with defaults
    openai: {
    apiKey: siteConfig.openai?.apiKey || "",
    model: siteConfig.openai?.model || "gpt-4o"
    },
    pinecone: {
    apiKey: siteConfig.pinecone?.apiKey || "",
    index: siteConfig.pinecone?.index || "roth-davies-legal",
    environment: siteConfig.pinecone?.environment || "us-east-1-aws",
    projectId: siteConfig.pinecone?.projectId || ""
    },
    twilio: {
    accountSid: siteConfig.twilio?.accountSid || "",
    authToken: siteConfig.twilio?.authToken || "", 
    fromNumber: siteConfig.twilio?.fromNumber || "+19133956075",
    toNumber: siteConfig.twilio?.toNumber || "+19134753876"
    },
    videos: {
    default: siteConfig.videos?.default || 'https://camrenhall.github.io/ai-chatbot-for-law/videos/welcome.mp4',
    'personal-injury': siteConfig.videos?.['personal-injury'] || 'https://camrenhall.github.io/ai-chatbot-for-law/videos/personal-injury.mp4',
    'criminal-defense': siteConfig.videos?.['criminal-defense'] || 'https://camrenhall.github.io/ai-chatbot-for-law/videos/criminal-defense.mp4',
    'divorce': siteConfig.videos?.['divorce'] || 'https://camrenhall.github.io/ai-chatbot-for-law/videos/family-law.mp4'
    },
    timing: {
    minTypingDelay: siteConfig.timing?.minTypingDelay || 1500,
    maxTypingDelay: siteConfig.timing?.maxTypingDelay || 2500,
    notificationDelay: siteConfig.timing?.notificationDelay || 2000
    },
    cssSelector: {
      container: '.law-chat-widget',
      messages: '.law-chat-messages',
      input: '.law-chat-input',
      send: '.law-chat-send',
      bubble: '.law-chat-bubble',
      window: '.law-chat-window',
      close: '.law-chat-close',
      typing: '.law-chat-typing',
      notification: '.law-chat-notification'
    }
  };

  // DOM Module - handles all DOM-related operations
  const DOM = {
    elements: {},
    
    initialize() {
      // Attach styles
      this.addStyles();
      
      // Create DOM structure
      this.createElements();
      
      // Save references to elements for easy access
      this.cacheElements();
      
      // Set up event listeners
      this.setupEventListeners();
      
      return this;
    },
    
    addStyles() {
      const style = document.createElement('style');
      style.textContent = this.getChatbotStyles();
      document.head.appendChild(style);
      
      // Add recommendation-specific styles
      const recStyles = document.createElement('style');
      recStyles.textContent = this.getRecommendationStyles();
      document.head.appendChild(recStyles);
    },
    
    createElements() {
      // Create main container
      const chatContainer = document.createElement('div');
      chatContainer.className = 'law-chat-widget';
      
      // Chat bubble with icon
      const chatBubble = document.createElement('div');
      chatBubble.className = 'law-chat-bubble';
      chatBubble.innerHTML = '<div class="law-chat-bubble-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 10.5H16" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 14H13.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';
      
      // Add notification badge
      const notificationBadge = document.createElement('div');
      notificationBadge.className = 'law-chat-notification';
      notificationBadge.textContent = '1';
      notificationBadge.style.display = 'none';
      chatBubble.appendChild(notificationBadge);
      
      // Chat window
      const chatWindow = document.createElement('div');
      chatWindow.className = 'law-chat-window';
      
      // Chat header
      const chatHeader = document.createElement('div');
      chatHeader.className = 'law-chat-header';
      chatHeader.innerHTML = `
        <h3 class="law-chat-title">
          <span class="law-chat-title-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 1.5L1.5 6.5L12 11.5L22.5 6.5L12 1.5Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M1.5 17.5L12 22.5L22.5 17.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M1.5 12L12 17L22.5 12" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg></span>
          Roth Davies Assistant
        </h3>
        <button class="law-chat-close">×</button>
      `;
      
      // Chat messages container
      const messagesContainer = document.createElement('div');
      messagesContainer.className = 'law-chat-messages';
      
      // Typing indicator
      const typingIndicator = document.createElement('div');
      typingIndicator.className = 'law-chat-typing';
      typingIndicator.innerHTML = `
        <div class="law-chat-typing-dots">
          <div class="law-chat-dot"></div>
          <div class="law-chat-dot"></div>
          <div class="law-chat-dot"></div>
        </div>
      `;
      
      // Input container
      const inputContainer = document.createElement('div');
      inputContainer.className = 'law-chat-input-container';
      inputContainer.innerHTML = `
        <textarea class="law-chat-input" placeholder="Type your question here..." rows="1"></textarea>
        <button class="law-chat-send" disabled>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 2L11 13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      `;
      
      // Assemble chat window
      chatWindow.appendChild(chatHeader);
      chatWindow.appendChild(messagesContainer);
      chatWindow.appendChild(typingIndicator);
      chatWindow.appendChild(inputContainer);
      
      // Append elements to container and then to body
      chatContainer.appendChild(chatBubble);
      chatContainer.appendChild(chatWindow);
      document.body.appendChild(chatContainer);
    },
    
    cacheElements() {
      // Save references to frequently accessed elements for better performance
      const selectors = Config.cssSelector;
      this.elements = {
        container: document.querySelector(selectors.container),
        messages: document.querySelector(selectors.messages),
        input: document.querySelector(selectors.input),
        send: document.querySelector(selectors.send),
        bubble: document.querySelector(selectors.bubble),
        window: document.querySelector(selectors.window),
        close: document.querySelector(selectors.close),
        typing: document.querySelector(selectors.typing),
        notification: document.querySelector(selectors.notification)
      };
      
      // Auto-resize textarea as user types
      this.elements.input.addEventListener('input', () => {
        this.elements.input.style.height = 'auto';
        const newHeight = Math.min(120, Math.max(24, this.elements.input.scrollHeight));
        this.elements.input.style.height = `${newHeight}px`;
      });
    },
    
    setupEventListeners() {
      // Chat toggle event listeners
      this.elements.bubble.addEventListener('click', () => {
        UI.openChat();
      });
      
      this.elements.close.addEventListener('click', () => {
        UI.closeChat();
      });
      
      // Input event listeners for send button state
      this.elements.input.addEventListener('input', () => {
        // Enable/disable send button based on input content
        this.elements.send.disabled = !this.elements.input.value.trim();
        
        // Add recommendations indicator if appropriate
        if (ChatFlow.stage === 'qualified' && this.elements.input.value.length > 15) {
          this.checkForLegalTerms(this.elements.input.value);
        }
      });
      
      // Send message on Enter (without shift)
      this.elements.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (!this.elements.send.disabled) {
            this.elements.send.click();
          }
        }
      });
      
      // Send button click handler
      this.elements.send.addEventListener('click', () => {
        const message = this.elements.input.value.trim();
        if (message) {
          // Clear input
          this.elements.input.value = '';
          this.elements.input.style.height = '24px';
          this.elements.send.disabled = true;
          
          // Process message
          ChatFlow.handleUserMessage(message);
        }
      });
      
      // Handle window load for initial notification
      window.addEventListener('load', () => {
        setTimeout(() => {
          UI.showNotification();
        }, Config.timing.notificationDelay);
      });
    },
    
    checkForLegalTerms(text) {
      const legalQuestionIndicators = [
        'how', 'what', 'when', 'why', 'can', 'should', 'is it', 'do i', 
        'accident', 'injury', 'compensation', 'settlement', 'court', 
        'insurance', 'medical', 'police', 'charges', 'rights'
      ];
      
      const lowercaseText = text.toLowerCase();
      const mightNeedResources = legalQuestionIndicators.some(term => 
        lowercaseText.includes(term)
      );
      
      if (mightNeedResources) {
        this.elements.send.classList.add('law-chat-send-with-recommendations');
      } else {
        this.elements.send.classList.remove('law-chat-send-with-recommendations');
      }
    },
    
    scrollToBottom() {
      if (this.elements.messages) {
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
      }
    },
    
    getChatbotStyles() {
      // Return CSS styles for chatbot
      return `
        /* Chatbot Container Styles */
        .law-chat-widget {
          font-family: 'Arial', sans-serif;
          position: fixed;
          z-index: 9999;
        }
        
        /* Chat Bubble - Enhanced with glowing effect and text */
        .law-chat-bubble {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 60px;
          height: 60px;
          background-color: #1a365d;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          z-index: 9999;
          animation: pulse 2s infinite;
        }
        
        /* Pulsing animation for the chat bubble */
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(26, 54, 93, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(26, 54, 93, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(26, 54, 93, 0);
          }
        }
        
        /* Text Us label for the chat bubble */
        .law-chat-bubble::before {
          content: "Text Us!";
          position: absolute;
          top: -40px;
          background-color: #1a365d;
          color: white;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          white-space: nowrap;
          animation: float 3s ease-in-out infinite;
        }

        /* Notification Thing */
        .law-chat-notification {
          position: absolute;
          top: -5px;
          right: -5px;
          width: 20px;
          height: 20px;
          background-color: #e74c3c;
          border-radius: 50%;
          color: white;
          font-size: 12px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          animation: bounce 1s infinite alternate;
          z-index: 10000;
        }

        @keyframes bounce {
          from {
            transform: scale(1);
          }
          to {
            transform: scale(1.2);
          }
        }
        
        /* Floating animation for the "Text Us" label */
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        
        .law-chat-bubble:hover {
          transform: scale(1.1);
        }
        
        .law-chat-bubble-icon {
          color: white;
          font-size: 24px;
        }
        
        /* Chat Window */
        .law-chat-window {
          position: fixed;
          bottom: 90px;
          right: 20px;
          width: 380px;
          height: 580px;
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.3);
          overflow: hidden;
          display: none;
          flex-direction: column;
          z-index: 9998;
          transition: all 0.3s ease;
          border: none;
        }
        
        /* Chat Header */
        .law-chat-header {
          background: linear-gradient(135deg, #1a365d 0%, #0d2b4e 100%);
          color: white;
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .law-chat-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          display: flex;
          align-items: center;
          letter-spacing: 0.5px;
        }
        
        .law-chat-title-icon {
          margin-right: 12px;
          font-size: 20px;
        }
        
        .law-chat-close {
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          font-size: 18px;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0.9;
          transition: all 0.2s ease;
        }
        
        .law-chat-close:hover {
          opacity: 1;
          background: rgba(255,255,255,0.2);
          transform: rotate(90deg);
        }
        
        /* Chat Messages Area */
        .law-chat-messages {
          flex-grow: 1;
          padding: 20px;
          overflow-y: auto;
          background-color: #f8f9fa;
          scroll-behavior: smooth;
        }
        
        .law-chat-messages::-webkit-scrollbar {
          width: 6px;
        }
        
        .law-chat-messages::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        .law-chat-messages::-webkit-scrollbar-thumb {
          background: #c5cfd9;
          border-radius: 3px;
        }

        /* Name Input Form */
        .law-chat-name-form {
          margin-top: 12px;
          width: 100%;
        }

        .law-chat-name-input-container {
          display: flex;
          align-items: center;
          background-color: #f7f9fc;
          border-radius: 12px;
          padding: 8px 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-bottom: 8px;
        }

        .law-chat-name-input {
          flex-grow: 1;
          border: none;
          background: transparent;
          font-size: 16px;
          padding: 8px;
          outline: none;
          color: #1a365d;
        }

        .law-chat-name-input:focus {
          background-color: rgba(26, 54, 93, 0.05);
          border-radius: 4px;
        }

        .law-chat-name-submit {
          margin-left: auto;
          background-color: #1a365d;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 6px 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .law-chat-name-submit:hover:not(:disabled) {
          background-color: #12293f;
          transform: translateY(-1px);
        }

        .law-chat-name-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .law-chat-name-submit:disabled {
          background-color: #cbd5e0;
          cursor: not-allowed;
        }
        
        /* Video as part of a message */
        .law-chat-video {
          width: 100%;
          height: auto;
          max-width: 100%;
          border-radius: 8px;
          margin-top: 8px;
          margin-bottom: 8px;
        }
        
        /* Message Bubbles */
        .law-chat-message {
          margin-bottom: 14px;
          max-width: 85%;
          display: flex;
          flex-direction: column;
        }
        
        .law-chat-message-user {
          align-self: flex-end;
        }
        
        .law-chat-message-bot {
          align-self: flex-start;
        }
        
        .law-chat-bubble-content {
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 15px;
          line-height: 1.5;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        
        .law-chat-message-user .law-chat-bubble-content {
          background-color: #dbe9ff;
          color: #1a365d;
          border-bottom-right-radius: 4px;
        }
        
        .law-chat-message-bot .law-chat-bubble-content {
          background-color: white;
          color: #333;
          border: 1px solid #e1e5e9;
          border-bottom-left-radius: 4px;
        }
        
        /* Option Bubbles */
        .law-chat-options {
          display: flex;
          flex-wrap: wrap;
          margin-top: 10px;
          gap: 8px;
        }
        
        .law-chat-option {
          background-color: #f0f4f8;
          border: 1px solid #c5cfd9;
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          color: #1a365d;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        
        .law-chat-option:hover {
          background-color: #e4ecf7;
          border-color: #1a365d;
          transform: translateY(-1px);
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .law-chat-option:active {
          transform: translateY(0);
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        
        .law-chat-time {
          font-size: 11px;
          color: #9aa5b1;
          margin-top: 4px;
          margin-left: 6px;
          margin-right: 6px;
        }
        
        /* Typing Indicator */
        .law-chat-typing {
          display: none;
          margin: 10px 0 14px 20px; /* Added left margin to align with other messages */
        }
        
        .law-chat-typing-dots {
          display: flex;
          align-items: center;
        }
        
        .law-chat-dot {
          width: 8px;
          height: 8px;
          background-color: #9aa5b1;
          border-radius: 50%;
          margin: 0 4px;
          animation: law-chat-typing 1.4s infinite ease-in-out;
        }
        
        .law-chat-dot:nth-child(1) { animation-delay: 0s; }
        .law-chat-dot:nth-child(2) { animation-delay: 0.2s; }
        .law-chat-dot:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes law-chat-typing {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        
        /* Phone Collection Form */
        .law-chat-phone-form {
          margin-top: 12px;
          width: 100%;
        }
        
        .law-chat-phone-input-container {
          display: flex;
          align-items: center;
          background-color: #f7f9fc;
          border-radius: 12px;
          padding: 8px 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-bottom: 8px;
        }
        
        .law-chat-phone-prefix,
        .law-chat-phone-separator {
          color: #4a5568;
          font-size: 16px;
          font-weight: 500;
        }
        
        .law-chat-phone-input {
          border: none;
          background: transparent;
          font-size: 16px;
          padding: 4px;
          text-align: center;
          width: auto;
          outline: none;
          color: #1a365d;
          font-weight: 500;
        }
        
        .law-chat-phone-input.area-code {
          width: 40px;
        }
        
        .law-chat-phone-input.prefix {
          width: 40px;
        }
        
        .law-chat-phone-input.line {
          width: 50px;
        }
        
        .law-chat-phone-input:focus {
          background-color: rgba(26, 54, 93, 0.05);
          border-radius: 4px;
        }
        
        .law-chat-phone-submit {
          margin-left: auto;
          background-color: #1a365d;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 6px 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .law-chat-phone-submit:hover:not(:disabled) {
          background-color: #12293f;
          transform: translateY(-1px);
        }
        
        .law-chat-phone-submit:active:not(:disabled) {
          transform: translateY(0);
        }
        
        .law-chat-phone-submit:disabled {
          background-color: #cbd5e0;
          cursor: not-allowed;
        }
        
        .law-chat-phone-privacy {
          font-size: 11px;
          color: #718096;
          text-align: center;
        }
        
        /* Input Area */
        .law-chat-input-container {
          padding: 15px;
          background-color: white;
          border-top: 1px solid #e1e5e9;
          display: flex;
          align-items: center;
        }
        
        .law-chat-input {
          flex-grow: 1;
          padding: 12px 16px;
          border: 1px solid #dfe3e8;
          border-radius: 24px;
          font-size: 15px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          resize: none;
          overflow: hidden;
          height: 24px; /* Exact height for a single line of text */
          max-height: 120px;
          line-height: 24px; /* Match height for single line text */
        }
        
        .law-chat-input:focus {
          border-color: #1a365d;
          box-shadow: 0 0 0 3px rgba(26, 54, 93, 0.15);
        }
        
        .law-chat-send {
          margin-left: 10px;
          width: 44px;
          height: 44px;
          background-color: #1a365d;
          color: white;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 5px rgba(26, 54, 93, 0.2);
        }
        
        .law-chat-send:hover {
          background-color: #10243d;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(26, 54, 93, 0.3);
        }
        
        .law-chat-send:active {
          transform: translateY(0);
          box-shadow: 0 1px 3px rgba(26, 54, 93, 0.2);
        }
        
        .law-chat-send:disabled {
          background-color: #e1e5e9;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .law-chat-send-icon {
          font-size: 18px;
        }

        /* Enhanced send button for when recommendations might be available */
        .law-chat-send-with-recommendations {
          background-color: #0f4c81; /* Slightly different color */
          box-shadow: 0 2px 8px rgba(26, 54, 93, 0.4);
        }

        .law-chat-send-with-recommendations:after {
          content: '';
          position: absolute;
          top: -3px;
          right: -3px;
          width: 8px;
          height: 8px;
          background-color: #4299e1;
          border-radius: 50%;
        }

        /* Play Button Overlay */
        .law-chat-video-play {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border-radius: 8px;
        }
        
        .law-chat-video-play-button {
          width: 50px;
          height: 50px;
          background-color: rgba(255,255,255,0.8);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        
        /* Mobile Responsive */
        @media (max-width: 480px) {
          .law-chat-window {
            width: 90%;
            height: 80%;
            bottom: 80px;
            right: 5%;
            left: 5%;
          }
        }
      `;
    },
    
    getRecommendationStyles() {
      return `
        /* Recommendations container */
        .law-chat-recommendations {
          margin: 8px 0 12px;
          padding: 10px 12px;
          background-color: #f0f7ff;
          border-radius: 8px;
          border-left: 3px solid #1a365d;
          font-size: 14px;
        }
        
        /* Heading */
        .law-chat-recommendations h4 {
          margin: 0 0 8px 0;
          font-size: 13px;
          color: #1a365d;
          font-weight: 600;
        }
        
        /* List styling */
        .law-chat-recommendation-list {
          margin: 0;
          padding-left: 18px;
          list-style-type: disc;
        }
        
        /* List items */
        .law-chat-recommendation-list li {
          margin-bottom: 6px;
        }
        
        /* Link styling */
        .law-chat-recommendation-link {
          color: #1a365d;
          text-decoration: none;
          border-bottom: 1px dotted #1a365d;
          transition: all 0.2s ease;
          font-size: 13px;
          line-height: 1.4;
        }
        
        .law-chat-recommendation-link:hover {
          color: #0d2b4e;
          border-bottom: 1px solid #0d2b4e;
        }
        
        /* Make sure the content after recommendations has proper spacing */
        .law-chat-recommendations + .law-chat-bubble-content {
          margin-top: 10px;
        }
      `;
    }
  };
  
  // UI Module - handles display logic and user interface interactions
  const UI = {
    videoAdded: false,
    apiLatency: 0,
    transitionMessageSent: false,
    recommendationsShown: false,
    
    showTypingIndicator() {
      DOM.elements.typing.style.display = 'flex';
      DOM.scrollToBottom();
    },
    
    hideTypingIndicator() {
      DOM.elements.typing.style.display = 'none';
    },
    
    showNotification() {
      DOM.elements.notification.style.display = 'flex';
    },
    
    hideNotification() {
      DOM.elements.notification.style.display = 'none';
    },
    
    openChat() {
      DOM.elements.window.style.display = 'flex';
      DOM.elements.bubble.style.display = 'none';
      
      this.hideNotification();
      
      // Start qualification flow if it's the first time opening
      if (ChatFlow.history.length === 0) {
        if (!this.videoAdded) {
          // Add welcome video
          const videoMessage = this.createVideoMessage();
          DOM.elements.messages.appendChild(videoMessage);
          this.videoAdded = true;
          // Initial message will be triggered by video end event
        }
      }
    },
    
    closeChat() {
      DOM.elements.window.style.display = 'none';
      DOM.elements.bubble.style.display = 'flex';
      
      // Pause any playing videos
      const videos = DOM.elements.messages.querySelectorAll('video');
      videos.forEach(video => video.pause());
    },
    
    formatTime() {
      const now = new Date();
      return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    
    getRandomDelay(min = Config.timing.minTypingDelay, max = Config.timing.maxTypingDelay) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    calculateTypingDelay(message, minDelay = 2000, maxDelay = 5000, apiLatency = 0) {
      // Base time proportional to message length
      const charCount = message.length;
      const baseDelay = Math.min(maxDelay, Math.max(minDelay, charCount * 15));
      
      // Adjust for API latency with minimum floor
      const adjustedDelay = Math.max(minDelay / 2, baseDelay - apiLatency);
      
      // Add randomness (±15%)
      const randomFactor = 1 + ((Math.random() * 0.3) - 0.15);
      return Math.round(adjustedDelay * randomFactor);
    },
    
    createVideoMessage() {
      const videoUrl = this.getVideoUrl();
      
      // Create message container
      const videoMessage = document.createElement('div');
      videoMessage.className = 'law-chat-message law-chat-message-bot';
      
      // Create message content container
      let messageContent = document.createElement('div');
      messageContent.className = 'law-chat-bubble-content';
      
      // Create video element
      const videoElement = document.createElement('video');
      videoElement.className = 'law-chat-video';
      videoElement.controls = true;
      videoElement.autoplay = true;
      videoElement.muted = false;
      videoElement.playsInline = true;
      videoElement.src = videoUrl;
      
      // Set up video completion event
      this.addInitialMessageAfterVideo(videoElement);
      
      // Handle video errors
      videoElement.onerror = () => {
        console.log("Error loading video from primary source, trying alternate...");
        
        // Try alternate URL format as fallback
        const alternateUrl = videoUrl.replace('/raw/refs/heads/main/', '/main/');
        videoElement.src = alternateUrl;
        
        videoElement.onerror = () => {
          // Last resort - show error message instead
          this.handleVideoLoadError(messageContent, videoElement);
        };
      };
      
      // Assemble the message
      messageContent.appendChild(videoElement);
      videoMessage.appendChild(messageContent);
      
      // Add time stamp
      const timeStamp = document.createElement('div');
      timeStamp.className = 'law-chat-time';
      timeStamp.textContent = this.formatTime();
      videoMessage.appendChild(timeStamp);
      
      return videoMessage;
    },
    
    getVideoUrl() {
      const currentPath = window.location.pathname.toLowerCase();
      let videoUrl = Config.videos.default;
      
      if (currentPath.includes('personal-injury')) {
        videoUrl = Config.videos['personal-injury'];
      } else if (currentPath.includes('criminal') || currentPath.includes('defense')) {
        videoUrl = Config.videos['criminal-defense'];
      } else if (currentPath.includes('divorce') || currentPath.includes('family')) {
        videoUrl = Config.videos.divorce;
      }
      
      return videoUrl;
    },
    
    handleVideoLoadError(container, videoElement) {
      // Remove video element if it exists in the container
      if (videoElement.parentNode === container) {
        container.removeChild(videoElement);
      }
      
      // Display error message
      const errorMessage = document.createElement('div');
      errorMessage.innerHTML = `
        <p style="margin-bottom: 10px;">Unable to load the introduction video. This could be due to network issues or because the video is unavailable.</p>
        <p>Let's continue with your consultation.</p>
      `;
      container.appendChild(errorMessage);
      
      // Proceed with initial message
      setTimeout(() => {
        this.showTypingIndicator();
        
        setTimeout(() => {
          this.hideTypingIndicator();
          Messages.addMessage("Hi there! I'm the virtual assistant here at Roth Davies. What type of case do you need help with?", false, [
            { value: 'personal-injury', text: 'Personal Injury' },
            { value: 'criminal-defense', text: 'Criminal Defense' },
            { value: 'divorce', text: 'Divorce' }
          ]);
        }, this.getRandomDelay());
      }, 2000);
    },
    
    addInitialMessageAfterVideo(videoElement) {
      // Add event listener for video completion
      videoElement.addEventListener('ended', () => {
        this.showTypingIndicator();
        
        setTimeout(() => {
          this.hideTypingIndicator();
          Messages.addMessage("Hi there! I'm the virtual assistant here at Roth Davies. What type of case do you need help with?", false, [
            { value: 'personal-injury', text: 'Personal Injury' },
            { value: 'criminal-defense', text: 'Criminal Defense' },
            { value: 'divorce', text: 'Divorce' }
          ]);
        }, this.getRandomDelay());
      });
      
      // Also handle video errors
      videoElement.addEventListener('error', () => {
        setTimeout(() => {
          this.showTypingIndicator();
          
          setTimeout(() => {
            this.hideTypingIndicator();
            Messages.addMessage("Hi there! I'm the virtual assistant here at Roth Davies. What type of case do you need help with?", false, [
              { value: 'personal-injury', text: 'Personal Injury' },
              { value: 'criminal-defense', text: 'Criminal Defense' },
              { value: 'divorce', text: 'Divorce' }
            ]);
          }, this.getRandomDelay());
        }, 1000);
      });
    }
  };
  
  // Messages Module - handles message creation, display, and user interactions
  const Messages = {
    // Add a message to the chat
    addMessage(content, isUser, options = null) {
      // For user messages, add immediately
      if (isUser) {
        const messageClass = 'law-chat-message-user';
        const messageTime = UI.formatTime();
        
        const messageElement = document.createElement('div');
        messageElement.className = `law-chat-message ${messageClass}`;
        
        let messageContent = `<div class="law-chat-bubble-content">${content}</div>`;
        messageContent += `<div class="law-chat-time">${messageTime}</div>`;
        messageElement.innerHTML = messageContent;
        
        DOM.elements.messages.appendChild(messageElement);
        DOM.scrollToBottom();
        
        // Update chat history
        ChatFlow.history.push({
          role: "user",
          content: content
        });
        return;
      }
      
      // For bot messages, show typing and delay
      UI.showTypingIndicator();
      
      // Calculate appropriate delay
      const delay = options ? 
        UI.getRandomDelay() : 
        UI.calculateTypingDelay(content, 2000, 5000, UI.apiLatency);
      
      // Create timer for delay
      setTimeout(() => {
        UI.hideTypingIndicator();
        
        const messageClass = 'law-chat-message-bot';
        const messageTime = UI.formatTime();
        
        const messageElement = document.createElement('div');
        messageElement.className = `law-chat-message ${messageClass}`;
        
        let messageHTML = `<div class="law-chat-bubble-content">${content}</div>`;
        
        // Add options if provided
        if (options) {
          messageHTML += `
            <div class="law-chat-options">
              ${options.map(option => 
                `<div class="law-chat-option" data-value="${option.value}">${option.text}</div>`
              ).join('')}
            </div>
          `;
        }
        
        messageHTML += `<div class="law-chat-time">${messageTime}</div>`;
        messageElement.innerHTML = messageHTML;
        
        DOM.elements.messages.appendChild(messageElement);
        DOM.scrollToBottom();
        
        // Add click event listeners to options
        if (options) {
          const optionElements = messageElement.querySelectorAll('.law-chat-option');
          optionElements.forEach(optionElement => {
            optionElement.addEventListener('click', function() {
              const selectedValue = this.getAttribute('data-value');
              const selectedText = this.textContent;
              ChatFlow.handleOptionSelection(selectedValue, selectedText);
            });
          });
        }
        
        // Update chat history for non-option messages
        if (!options) {
          ChatFlow.history.push({
            role: "assistant",
            content: content
          });
        }
      }, delay);
    },
    
    // Add recommendations with content
    addMessageWithRecommendations(content, recommendations) {
      UI.hideTypingIndicator();
      
      // Create the message element
      const messageElement = document.createElement('div');
      messageElement.className = 'law-chat-message law-chat-message-bot';
      
      // Create the recommendations container
      const recommendationsDiv = document.createElement('div');
      recommendationsDiv.className = 'law-chat-recommendations';
      
      // Add heading
      const heading = document.createElement('h4');
      heading.textContent = 'Resources our attorneys have written for your case:';
      recommendationsDiv.appendChild(heading);
      
      // Create list for recommendations
      const linkList = document.createElement('ul');
      linkList.className = 'law-chat-recommendation-list';
      
      // Add each recommendation as a list item
      recommendations.forEach(rec => {
        // Clean the title (remove suffix after | character)
        let cleanTitle = rec.title || 'Resource';
        if (cleanTitle.includes('|')) {
          cleanTitle = cleanTitle.split('|')[0].trim();
        }
        
        // Create list item with link
        const listItem = document.createElement('li');
        
        const link = document.createElement('a');
        link.className = 'law-chat-recommendation-link';
        link.href = rec.url || '#';
        link.textContent = cleanTitle;
        link.target = '_blank'; // Open in new tab
        
        listItem.appendChild(link);
        linkList.appendChild(listItem);
      });
      
      // Add the list to recommendations div
      recommendationsDiv.appendChild(linkList);
      
      // Add the recommendations to the message element
      messageElement.appendChild(recommendationsDiv);
      
      // Add content if provided
      if (content && content.trim() !== "") {
        let messageContent = document.createElement('div');
        messageContent.className = 'law-chat-bubble-content';
        messageContent.innerHTML = content;
        messageElement.appendChild(messageContent);
      }
      
      // Add timestamp
      const timeStamp = document.createElement('div');
      timeStamp.className = 'law-chat-time';
      timeStamp.textContent = UI.formatTime();
      messageElement.appendChild(timeStamp);
      
      // Add to chat
      DOM.elements.messages.appendChild(messageElement);
      DOM.scrollToBottom();
      
      // Update chat history if content provided
      if (content && content.trim() !== "") {
        ChatFlow.history.push({
          role: "assistant",
          content: content
        });
      }
    },
    
    // Add only recommendations without content
    addOnlyRecommendations(recommendations) {
      UI.hideTypingIndicator();
      
      // Create message element
      const messageElement = document.createElement('div');
      messageElement.className = 'law-chat-message law-chat-message-bot';
      
      // Create recommendations container
      const recommendationsDiv = document.createElement('div');
      recommendationsDiv.className = 'law-chat-recommendations';
      
      // Add heading
      const heading = document.createElement('h4');
      heading.textContent = 'Our attorneys wrote these resources for you:';
      recommendationsDiv.appendChild(heading);
      
      // Create list for recommendations
      const linkList = document.createElement('ul');
      linkList.className = 'law-chat-recommendation-list';
      
      // Add each recommendation
      recommendations.forEach(rec => {
        let cleanTitle = rec.title || 'Resource';
        if (cleanTitle.includes('|')) {
          cleanTitle = cleanTitle.split('|')[0].trim();
        }
        
        const listItem = document.createElement('li');
        
        const link = document.createElement('a');
        link.className = 'law-chat-recommendation-link';
        link.href = rec.url || '#';
        link.textContent = cleanTitle;
        link.target = '_blank';
        
        listItem.appendChild(link);
        linkList.appendChild(listItem);
      });
      
      recommendationsDiv.appendChild(linkList);
      messageElement.appendChild(recommendationsDiv);
      
      // Add timestamp
      const timeStamp = document.createElement('div');
      timeStamp.className = 'law-chat-time';
      timeStamp.textContent = UI.formatTime();
      messageElement.appendChild(timeStamp);
      
      // Add to chat
      DOM.elements.messages.appendChild(messageElement);
      DOM.scrollToBottom();
      
      // No need to update chat history for recommendations-only
    },

    // Add to Messages module
    addDisclaimerMessage() {
      const message = "Utilizing this chat service does not create an attorney-client relationship. Any information communicated in this chat is not legal advice. Some of the responses may utilize AI based on the content of our website. Do you agree?";
      
      Messages.addMessage(message, false, [
        { value: 'agree', text: 'I Agree' },
        { value: 'decline', text: 'I Do Not Agree' }
      ]);
    },

    createNameInputForm(isReferral = false) {
      // Create the message
      const nameMessage = document.createElement('div');
      nameMessage.className = 'law-chat-message law-chat-message-bot';
      
      // Create content
      const nameContent = document.createElement('div');
      nameContent.className = 'law-chat-bubble-content';
      
      // Different text based on if it's a referral
      if (isReferral) {
        nameContent.innerHTML = `
          <p>We'd be happy to refer you to an attorney in your area.</p>
          <p>First, could you please tell me your name?</p>
        `;
      } else {
        nameContent.innerHTML = `
          <p>Great! I'd be happy to discuss your ${ChatFlow.userCaseType} case in ${ChatFlow.getLocationDisplay()}.</p>
          <p>First, could you please tell me your name?</p>
        `;
      }
      
      // Add name form
      const nameForm = document.createElement('div');
      nameForm.className = 'law-chat-name-form';
      nameForm.innerHTML = `
        <div class="law-chat-name-input-container">
          <input type="text" class="law-chat-name-input" placeholder="Your name">
          <button class="law-chat-name-submit" disabled>Submit</button>
        </div>
      `;
      
      nameContent.appendChild(nameForm);
      
      // Add timestamp
      const timeStamp = document.createElement('div');
      timeStamp.className = 'law-chat-time';
      timeStamp.textContent = UI.formatTime();
      
      // Assemble everything
      nameMessage.appendChild(nameContent);
      nameMessage.appendChild(timeStamp);
      
      DOM.elements.messages.appendChild(nameMessage);
      DOM.scrollToBottom();
      
      // Add event listeners for the name input
      setTimeout(() => {
        // Get name input field and submit button
        const nameInput = document.querySelector('.law-chat-name-input');
        const submitButton = document.querySelector('.law-chat-name-submit');
        
        // Focus input
        nameInput.focus();
        
        // Validate input function
        const validateName = () => {
          submitButton.disabled = nameInput.value.trim().length === 0;
        };
        
        // Add input handler
        nameInput.addEventListener('input', validateName);
        
        // Handle enter key press
        nameInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !submitButton.disabled) {
            submitButton.click();
          }
        });
        
        // Handle form submission
        submitButton.addEventListener('click', () => {
          const name = nameInput.value.trim();
          
          // Store name
          ChatFlow.userName = name;
          
          // Add as user message
          this.addMessage(`My name is ${name}`, true);
          
          // Update flow state to phone collection
          ChatFlow.stage = 'phone-collection';
          
          // Show phone collection form
          const isReferral = ChatFlow.userLocation === 'other';
          this.createPhoneInputForm(isReferral);
        });
      }, 100);
    },
    
    // Creates phone input form
    createPhoneInputForm(isReferral = false) {
      // Create the message
      const phoneMessage = document.createElement('div');
      phoneMessage.className = 'law-chat-message law-chat-message-bot';
      
      // Create content
      const phoneContent = document.createElement('div');
      phoneContent.className = 'law-chat-bubble-content';
      
      // Different text based on if it's a referral
      if (isReferral) {
        phoneContent.innerHTML = `
          <p>We'd be happy to refer you to an attorney in your area.</p>
          <p>Please provide your phone number so we can contact you:</p>
        `;
      } else {
        phoneContent.innerHTML = `
          <p>Great! I'd be happy to discuss your ${ChatFlow.userCaseType} case in ${ChatFlow.getLocationDisplay()}.</p>
          <p>To connect you with the right attorney, could you provide your phone number?</p>
        `;
      }
      
      // Add phone form
      const phoneForm = document.createElement('div');
      phoneForm.className = 'law-chat-phone-form';
      phoneForm.innerHTML = `
        <div class="law-chat-phone-input-container">
          <div class="law-chat-phone-prefix">(</div>
          <input type="tel" class="law-chat-phone-input area-code" maxlength="3" placeholder="000">
          <div class="law-chat-phone-separator">)</div>
          <input type="tel" class="law-chat-phone-input prefix" maxlength="3" placeholder="000">
          <div class="law-chat-phone-separator">-</div>
          <input type="tel" class="law-chat-phone-input line" maxlength="4" placeholder="0000">
          <button class="law-chat-phone-submit" disabled>Submit</button>
        </div>
        <div class="law-chat-phone-privacy">Your information is secure and will not be shared with third parties.</div>
      `;
      
      phoneContent.appendChild(phoneForm);
      
      // Add timestamp
      const timeStamp = document.createElement('div');
      timeStamp.className = 'law-chat-time';
      timeStamp.textContent = UI.formatTime();
      
      // Assemble everything
      phoneMessage.appendChild(phoneContent);
      phoneMessage.appendChild(timeStamp);
      
      DOM.elements.messages.appendChild(phoneMessage);
      DOM.scrollToBottom();
      
      // Add event listeners for the phone input
      setTimeout(() => {
        // Get phone input fields
        const areaCodeInput = document.querySelector('.law-chat-phone-input.area-code');
        const prefixInput = document.querySelector('.law-chat-phone-input.prefix');
        const lineInput = document.querySelector('.law-chat-phone-input.line');
        const submitButton = document.querySelector('.law-chat-phone-submit');
        
        // Focus first input
        areaCodeInput.focus();
        
        // Validate phone function
        const validatePhone = () => {
          const areaCode = areaCodeInput.value;
          const prefix = prefixInput.value;
          const line = lineInput.value;
          
          // Enable submit only when all fields are correctly filled
          submitButton.disabled = !(
            areaCode.length === 3 && 
            prefix.length === 3 && 
            line.length === 4 &&
            /^[0-9]+$/.test(areaCode) &&
            /^[0-9]+$/.test(prefix) &&
            /^[0-9]+$/.test(line)
          );
        };
        
        // Add input handlers
        [areaCodeInput, prefixInput, lineInput].forEach(input => {
          // Allow only numbers
          input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            validatePhone();
            
            // Auto-advance to next field when current is full
            if (e.target.value.length === parseInt(e.target.getAttribute('maxlength'))) {
              if (e.target === areaCodeInput) prefixInput.focus();
              if (e.target === prefixInput) lineInput.focus();
            }
          });
          
          // Handle backspace to go to previous field
          input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value.length === 0) {
              if (e.target === lineInput) prefixInput.focus();
              if (e.target === prefixInput) areaCodeInput.focus();
            }
          });
        });
        
        // Handle form submission
        // Inside the createPhoneInputForm method, modify the submit button event listener:
        submitButton.addEventListener('click', () => {
          const phoneNumber = `(${areaCodeInput.value}) ${prefixInput.value}-${lineInput.value}`;
          
          // Submit phone to server
          API.submitPhoneNumber(phoneNumber, isReferral);
          
          // Add as user message
          this.addMessage(`My phone number is ${phoneNumber}`, true);
          
          // Update flow state to show disclaimer instead of setting as qualified
          ChatFlow.stage = 'disclaimer';
          
          // Show disclaimer message
          this.addDisclaimerMessage();
          
          // Ensure send button is enabled
          setTimeout(() => {
            DOM.elements.send.disabled = false;
          }, 500);
        });
      }, 100);
    }
  };
  
  // ChatFlow module - handles chat flow, user states, and qualification
  const ChatFlow = {
    stage: 'initial', // initial, caseType, location, phone-collection, qualified
    userCaseType: null,
    userLocation: null,
    userName: null,
    history: [],
    
    // Process user's direct text input
    handleUserMessage(message) {
      // Add message to UI
      Messages.addMessage(message, true);
      
      // Process based on current stage
      if (this.stage === 'qualified') {
        // User is qualified, send to AI
        API.sendMessageToOpenAI(message);
      } else if (this.stage === 'initial') {
        // User hasn't selected case type yet, remind them to do so
        Messages.addMessage("I understand you may have specific questions. To better assist you, please select the type of case you need help with from the options below:", false, [
          { value: 'personal-injury', text: 'Personal Injury' },
          { value: 'criminal-defense', text: 'Criminal Defense' },
          { value: 'divorce', text: 'Divorce' }
        ]);
      } else if (this.stage === 'caseType') {
        // User hasn't selected location yet
        Messages.addMessage("Thank you. Before we continue, please let me know if your case is in Kansas or Missouri:", false, [
          { value: 'kansas', text: 'Kansas' },
          { value: 'missouri', text: 'Missouri' },
          { value: 'other', text: 'Other State' }
        ]);
      }
    },
    
    // Process option button selection
    handleOptionSelection(value, text) {
      // Create natural-sounding response based on selection
      let naturalMessage = this.createNaturalResponse(value, text);
      
      // Add as user message
      Messages.addMessage(naturalMessage, true);
      
      // Process based on current stage
      if (this.stage === 'initial') {
        this.userCaseType = value;
        this.stage = 'caseType';
        
        // Ask for location
        Messages.addMessage("Thank you. Is your case in Kansas or Missouri?", false, [
          { value: 'kansas', text: 'Kansas' },
          { value: 'missouri', text: 'Missouri' },
          { value: 'other', text: 'Other State' }
        ]);
      } else if (this.stage === 'caseType') {
        this.userLocation = value;
        this.stage = 'location';
        
        if (value === 'kansas' || value === 'missouri') {
          // Ask for name first
          this.stage = 'name-collection';
          Messages.createNameInputForm();
        } else {
          // Not qualified - provide referral option
          Messages.addMessage("I'm sorry, but our firm only handles cases in Kansas and Missouri. Would you like to speak with one of our attorneys anyway to see if we can refer you to someone in your area?", false, [
            { value: 'yes-referral', text: 'Yes, I\'d like a referral' },
            { value: 'no-thanks', text: 'No, thank you' }
          ]);
        }
      } else if (this.stage === 'location' && (value === 'yes-referral' || value === 'no-thanks')) {
        if (value === 'yes-referral') {
          // Ask for name first
          this.stage = 'name-collection';
          Messages.createNameInputForm(true);
        } else {
          Messages.addMessage("I understand. If you have any other questions or change your mind, please feel free to ask. Is there anything else I can help with?", false);
          // Set as qualified so they can chat if they want
          this.stage = 'qualified';
        }
      } else if (this.stage === 'disclaimer') {
        if (value === 'agree') {
          // User agreed to disclaimer, now they're qualified
          this.stage = 'qualified';
          Messages.addMessage("Thank you for agreeing. Could you tell me a little bit about your case?", false);
        } else {
          // User did not agree
          Messages.addMessage("I understand. Without your agreement, we cannot continue the consultation. If you change your mind or have other questions, please feel free to chat with us again.", false);
          // Leave at disclaimer stage
        }
      }
    },
    
    // Create a natural-sounding message based on option selection
    // Add this to the createNaturalResponse method in ChatFlow
    createNaturalResponse(value, text) {
      if (this.stage === 'initial') {
        return `I need help with a ${text} case.`;
      } else if (this.stage === 'caseType') {
        return `My case is in ${text}.`;
      } else if (this.stage === 'location') {
        if (value === 'yes-referral') {
          return "Yes, I'd like to get a referral to an attorney in my area.";
        } else {
          return "No thanks, I don't need a referral at this time.";
        }
      } else if (this.stage === 'disclaimer') {
        if (value === 'agree') {
          return "I agree to the terms.";
        } else {
          return "I do not agree.";
        }
      }
      
      return text; // Default fallback
    },
    
    // Get formatted location text for display
    getLocationDisplay() {
      if (this.userLocation === 'kansas') return 'Kansas';
      if (this.userLocation === 'missouri') return 'Missouri';
      if (this.userLocation === 'other') return 'your area';
      return this.userLocation || 'your area';
    },
    
    // Get formatted case type for display
    getCaseTypeDisplay() {
      if (this.userCaseType === 'personal-injury') return 'Personal Injury';
      if (this.userCaseType === 'criminal-defense') return 'Criminal Defense';
      if (this.userCaseType === 'divorce') return 'Divorce';
      return this.userCaseType || 'Legal';
    }
  };
  
  // API Module - handles all API calls to external services
  const API = {
    // Send message to OpenAI
    async sendMessageToOpenAI(message) {
      UI.showTypingIndicator();
      
      // Record start time for latency calculation
      const startTime = Date.now();
      
      // Check if this is the first substantive message about the case
      // and we haven't sent the transition message yet
      const isFirstCaseDetail = !UI.transitionMessageSent && 
                       ChatFlow.stage === 'qualified' &&
                       message.length > 5 &&
                       !message.toLowerCase().includes("hello") &&
                       !message.toLowerCase().includes("hi") &&
                       !message.toLowerCase().includes("hey");
      
      try {
        // Handle first case detail message differently
        if (isFirstCaseDetail) {
          // Calculate API latency
          UI.apiLatency = Date.now() - startTime;
          
          // Get recommendations if needed
          let recommendations = [];
          if (ChatFlow.stage === 'qualified') {
            try {
              // Context-aware search query
              const searchQuery = `${ChatFlow.userCaseType} ${message}`; 
              recommendations = await this.queryPineconeForContent(searchQuery);
            } catch (error) {
              console.error("Error fetching recommendations:", error);
              recommendations = [];
            }
          }
          
          // Hide typing indicator
          UI.hideTypingIndicator();
          
          // Add recommendations if available
          if (recommendations && recommendations.length > 0) {
            Messages.addOnlyRecommendations(recommendations);
            UI.recommendationsShown = true;
          }
          
          // Add transition message after delay
          setTimeout(() => {
            const transitionMessage = "Thanks for sharing details about your case. Above are some resources we've written that might be helpful. It's always best to talk with one of our attorneys who can give advice tailored to your specific situation. We'd be happy to give you a call to discuss this further. In the meantime, feel free to ask me any questions, and I'll answer them!";
            
            Messages.addMessage(transitionMessage, false);
            
            // Mark transition message as sent
            UI.transitionMessageSent = true;
            
            // Add to chat history
            ChatFlow.history.push({
              role: "assistant",
              content: transitionMessage
            });
          }, 1500);
          
          return;
        }
        
        // This is a regular follow-up message, process with OpenAI
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Config.openai.apiKey}`
          },
          body: JSON.stringify({
            model: Config.openai.model,
            messages: [
              {
                role: "system",
                content: `You are LegalAssist, an expert legal advisor for Roth Davies Law Firm in Overland Park, Kansas. Maintain a conversational, empathetic tone while being concise and focused.

EXPERTISE AREAS:
- ${ChatFlow.getCaseTypeDisplay()} cases in ${ChatFlow.getLocationDisplay()}
- Personal Injury (contingency-based)
- Criminal Defense
- Family Law/Divorce

RESPONSE GUIDELINES:
- Keep responses under 60 words, using conversational language
- Directly address what the client actually said
- Show understanding of their specific situation
- Demonstrate legal expertise without jargon
- Vary your closing statements naturally
- Only include the consultation number (913-451-9500) after developing a few additional messages of conversation, and only when relevant. Don't mention it in every response, and once you've mentioned it, don't repeat it.
- Use contractions and natural speech patterns
- Don't say a terminating statement like "If you have any questions or need more information, feel free to ask!" unless the other user has clearly terminated the conversation.
- End with a question or prompt to keep the conversation going when appropriate

APPROACH FOR DIFFICULT QUESTIONS:
- Acknowledge emotional aspects first
- Provide a brief, knowledgeable perspective on their situation
- Suggest next steps in a way that shows your expertise
- Never use generic disclaimers like "I can't advise on that"
- Subtly redirect dangerous or extreme hypotheticals

KEY QUALITY SIGNALS:
- Sound like a knowledgeable legal professional chatting informally
- Respond uniquely to each inquiry without template language
- Show genuine understanding of legal implications
- Convey expertise without lengthy explanations`
              },
              ...ChatFlow.history
            ],
            temperature: 0.7,
            max_tokens: 500
          })
        });
        
        // Calculate API latency
        UI.apiLatency = Date.now() - startTime;
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        // Check for recommendations if we haven't shown them yet
        let recommendations = [];
        if (ChatFlow.stage === 'qualified' && !UI.recommendationsShown) {
          // Only query for substantial follow-up messages
          const shouldRecommendContent = ChatFlow.userCaseType && 
            (message.length > 10) && 
            !message.toLowerCase().includes("hello") && 
            !message.toLowerCase().includes("thank");

          if (shouldRecommendContent) {
            try {
              // Context-aware search query
              const searchQuery = `${ChatFlow.userCaseType} ${message}`; 
              recommendations = await this.queryPineconeForContent(searchQuery);
              
              if (recommendations && recommendations.length > 0) {
                UI.recommendationsShown = true;
              }
            } catch (error) {
              console.error("Error fetching recommendations:", error);
              recommendations = [];
            }
          }
        } else {
          // Already shown recommendations
          recommendations = [];
        }
        
        // Hide typing indicator
        UI.hideTypingIndicator();
        
        // Display response with recommendations if available
        if (recommendations && recommendations.length > 0) {
          Messages.addMessageWithRecommendations(aiResponse, recommendations);
        } else {
          Messages.addMessage(aiResponse, false);
        }
        
      } catch (error) {
        console.error("Error calling OpenAI API:", error);
        UI.apiLatency = Date.now() - startTime;
        UI.hideTypingIndicator();
        
        // Use fallback response instead
        this.processFallbackResponse(message);
      }
    },
    
    // Process fallback response when API call fails
    processFallbackResponse(message) {
      UI.showTypingIndicator();
      
      // Default fallback
      let response = "Thank you for your question. Our team would be happy to provide more specific information during a free consultation. Would you like us to contact you to schedule a time to talk? You can reach us at (913) 451-9500.";
      
      // Check message against fallback dictionary
      const fallbackResponses = {
        "accident": "If you've been in an accident, your health is the first priority. Seek medical attention right away, even if you feel fine - some injuries aren't immediately apparent. Then, document everything you can about the accident and call us at (913) 451-9500 for a free consultation to discuss your legal options.",
        "worth": "Every personal injury case is unique. The value depends on factors like medical expenses, lost wages, pain and suffering, and long-term impacts. We offer a free consultation to evaluate your specific situation and give you a better understanding of what compensation you might expect.",
        "settlement": "Most personal injury cases settle before trial, but we prepare every case as if it will go to court. This approach often leads to better settlement offers. The timeline varies from a few months to over a year depending on case complexity and the extent of your injuries.",
        "fault": "Kansas follows a modified comparative negligence rule, meaning you can still recover damages even if you were partially at fault, as long as your fault is less than 50%. Your compensation may be reduced by your percentage of fault. We can evaluate your situation during a free consultation.",
        "fees": "We work on a contingency fee basis, which means you pay nothing upfront, and we only get paid if we win your case. Our fee is typically a percentage of your settlement or verdict. This arrangement allows anyone to access quality legal representation regardless of their financial situation.",
        "consultation": "We offer a free 30-minute consultation to discuss your case. You can schedule by calling (913) 451-9500. We also offer virtual consultations if that's more convenient for you.",
        "evidence": "Important evidence in personal injury cases includes medical records, accident reports, witness statements, photographs, video footage, and documentation of lost wages. The sooner you contact us, the better we can help preserve crucial evidence for your case.",
        "timeline": "Most personal injury cases resolve within 3-12 months, though complex cases can take longer. We work efficiently to reach a resolution while still pursuing maximum compensation for your injuries."
      };
      
      // Check for keywords in the message
      const lowercaseMessage = message.toLowerCase();
      Object.keys(fallbackResponses).forEach(key => {
        if (lowercaseMessage.includes(key)) {
          response = fallbackResponses[key];
        }
      });
      
      // Add fallback response after delay
      Messages.addMessage(response, false);
    },
    
    // Submit phone number to server/SMS
    submitPhoneNumber(phoneNumber, isReferral = false) {
      console.log(`Submitting phone number: ${phoneNumber}, Referral: ${isReferral}`);
      
      // Format case type and location for SMS
      const caseTypeText = ChatFlow.getCaseTypeDisplay();
      const locationText = ChatFlow.getLocationDisplay();
      
      // Create message body for SMS
      const messageBody = `Roth Davies Chatbot - New Incoming Lead: ${caseTypeText} case in ${locationText}. Phone: ${phoneNumber}`;
      
      // Send SMS via Twilio API
      fetch(`https://api.twilio.com/2010-04-01/Accounts/${Config.twilio.accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${Config.twilio.accountSid}:${Config.twilio.authToken}`)
        },
        body: new URLSearchParams({
          'To': Config.twilio.toNumber,
          'From': Config.twilio.fromNumber,
          'Body': messageBody
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Twilio SMS sent successfully:', data);
      })
      .catch(error => {
        console.error('Error sending Twilio SMS:', error);
        // Continue flow even if SMS fails
      });
      
      // Ensure send button is enabled after submission
      setTimeout(() => {
        DOM.elements.send.disabled = false;
      }, 500);
    },
    
    // Query Pinecone for relevant content based on user's message
    async queryPineconeForContent(userMessage) {
      try {
        console.log("Starting Pinecone query for:", userMessage);
        
        // Get embedding for the user's query
        const embedding = await this.getEmbedding(userMessage);
        if (!embedding) {
          return [];
        }
        
        // Reduce dimension to match Pinecone's expectation
        const reducedEmbedding = this.reduceEmbeddingDimension(embedding, 768);
        
        // Build Pinecone URL
        const pineconeUrl = `https://${Config.pinecone.index}-4w5mo1c.svc.aped-4627-b74a.pinecone.io/query`;
        
        // Build request body
        const requestBody = {
          vector: reducedEmbedding,
          topK: 3,
          includeMetadata: true
        };
        
        // Make request to Pinecone
        const pineconeResponse = await fetch(pineconeUrl, {
          method: 'POST',
          headers: {
            'Api-Key': Config.pinecone.apiKey,
            'Content-Type': 'application/json',
            'X-Pinecone-API-Version': '2025-01'
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!pineconeResponse.ok) {
          // Try alternative formats if standard request fails
          return this.tryAlternativePineconeFormats(userMessage, reducedEmbedding);
        }
        
        const results = await pineconeResponse.json();
        
        // Format results if matches found
        if (results.matches && results.matches.length > 0) {
          return results.matches.map(match => ({
            title: match.metadata.title || "Related Resource",
            url: match.metadata.url || "#",
            snippet: match.metadata.snippet || "Information related to your case",
            category: match.metadata.category || "Legal",
            score: match.score
          }));
        }
        
        return [];
      } catch (error) {
        console.error('Error querying Pinecone:', error);
        return []; // Return empty array on error
      }
    },
    
    // Get embedding from OpenAI
    async getEmbedding(text) {
      try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Config.openai.apiKey}`
          },
          body: JSON.stringify({
            input: text,
            model: "text-embedding-ada-002"
          })
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.data[0].embedding;
      } catch (error) {
        console.error("Error getting embedding:", error);
        return null;
      }
    },
    
    // Try alternative Pinecone request formats if standard fails
    async tryAlternativePineconeFormats(userMessage, queryEmbedding) {
      console.log("Trying alternative Pinecone request formats");
      
      // Different parameter variations to try
      const variations = [
        {
          // Variation 1: Different field names (underscores)
          body: {
            vector: queryEmbedding,
            top_k: 3,
            include_metadata: true
          }
        },
        {
          // Variation 2: Include namespace field
          body: {
            vector: queryEmbedding,
            topK: 3,
            includeMetadata: true,
            namespace: ""
          }
        },
        {
          // Variation 3: Include values field
          body: {
            vector: queryEmbedding,
            topK: 3,
            includeMetadata: true,
            includeValues: false
          }
        }
      ];
      
      const pineconeUrl = `https://${Config.pinecone.index}-4w5mo1c.svc.aped-4627-b74a.pinecone.io/query`;
      
      // Try each variation
      for (let i = 0; i < variations.length; i++) {
        try {
          console.log(`Trying variation ${i+1}:`, variations[i].body);
          
          const response = await fetch(pineconeUrl, {
            method: 'POST',
            headers: {
              'Api-Key': Config.pinecone.apiKey,
              'Content-Type': 'application/json',
              'X-Pinecone-API-Version': '2025-01'
            },
            body: JSON.stringify(variations[i].body)
          });
          
          if (response.ok) {
            const results = await response.json();
            
            if (results.matches && results.matches.length > 0) {
              return results.matches.map(match => ({
                title: match.metadata.title || "Related Resource",
                url: match.metadata.url || "#",
                snippet: match.metadata.snippet || "Information related to your case",
                category: match.metadata.category || "Legal",
                score: match.score
              }));
            }
          }
        } catch (error) {
          console.error(`Error with variation ${i+1}:`, error);
        }
      }
      
      console.log("All variations failed");
      return [];
    },
    
    // Dimensionality reduction for embeddings to match Pinecone's expectations
    reduceEmbeddingDimension(embedding, targetDimension) {
      if (embedding.length <= targetDimension) {
        return embedding; // No reduction needed
      }
      
      // Method 1: Adaptive Pooling for pairs
      if (embedding.length === targetDimension * 2) {
        const reduced = [];
        for (let i = 0; i < embedding.length; i += 2) {
          // Weighted average of adjacent dimensions
          const combined = (embedding[i] * 0.6 + embedding[i + 1] * 0.4);
          reduced.push(combined);
        }
        return reduced;
      }
      
      // Method 2: Mixed approach for odd ratios
      const firstHalf = embedding.slice(0, Math.ceil(embedding.length / 2));
      const secondHalf = embedding.slice(Math.ceil(embedding.length / 2));
      
      const elementsFromEachHalf = Math.ceil(targetDimension / 2);
      
      const strideFirst = Math.floor(firstHalf.length / elementsFromEachHalf);
      const strideSecond = Math.floor(secondHalf.length / elementsFromEachHalf);
      
      const reduced = [];
      
      // Add elements from first half with stride
      for (let i = 0; i < firstHalf.length && reduced.length < elementsFromEachHalf; i += strideFirst) {
        reduced.push(firstHalf[i]);
      }
      
      // Add elements from second half with stride
      for (let i = 0; i < secondHalf.length && reduced.length < targetDimension; i += strideSecond) {
        reduced.push(secondHalf[i]);
      }
      
      // If needed, add remaining elements
      while (reduced.length < targetDimension) {
        const index = reduced.length % embedding.length;
        reduced.push(embedding[index]);
      }
      
      // Normalize the reduced embedding to maintain similar magnitude
      const originalMagnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      const reducedMagnitude = Math.sqrt(reduced.reduce((sum, val) => sum + val * val, 0));
      const scaleFactor = originalMagnitude / reducedMagnitude;
      
      return reduced.map(val => val * scaleFactor);
    }
  };
  
  // Initialize the application
  DOM.initialize();

})();