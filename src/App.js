import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Play, Pause, Volume2, MessageSquare, Brain, Loader2, Download } from 'lucide-react';

const ResearchPaperAnalyzer = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [paperContent, setPaperContent] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [currentDiscussion, setCurrentDiscussion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [discussionHistory, setDiscussionHistory] = useState([]);
  const [userQuestion, setUserQuestion] = useState('');
  const [conversationMemory, setConversationMemory] = useState({
    paperTitle: '',
    initialAnalysis: '',
    fullContext: '',
    sessionSummary: ''
  });
  
  const fileInputRef = useRef(null);
  const speechSynthesisRef = useRef(null);

  // Initialize speech synthesis
  useEffect(() => {
    if ('speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis;
    }
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    setUploadedFile(file);
    setIsProcessing(true);

    try {
      // Convert PDF to base64 for Claude API
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      // Extract text content using Claude API via CORS proxy
      const response = await fetch("https://cors-anywhere.herokuapp.com/https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "x-api-key": process.env.REACT_APP_ANTHROPIC_API_KEY || "your-api-key-here"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "document",
                  source: {
                    type: "base64",
                    media_type: "application/pdf",
                    data: base64Data,
                  },
                },
                {
                  type: "text",
                  text: "Please extract the full text content of this research paper. I need the complete text for analysis.",
                },
              ],
            },
          ],
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      const extractedText = data.content[0].text;
      setPaperContent(extractedText);
      
    } catch (error) {
      console.error('Error processing PDF:', error);
      alert('Error processing PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateInitialAnalysis = async () => {
    if (!paperContent) return;
    
    setIsAnalyzing(true);
    
    try {
      const response = await fetch("https://cors-anywhere.herokuapp.com/https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "x-api-key": process.env.REACT_APP_ANTHROPIC_API_KEY || "your-api-key-here"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 3000,
          messages: [
            {
              role: "user",
              content: `As a recommender system researcher, please provide a comprehensive analysis of this research paper. Focus on:

1. Main research question and objectives
2. Methodology and approach
3. Key findings and contributions
4. Relevance to recommender systems field
5. Strengths and limitations
6. Potential applications and future work
7. How this relates to current trends in recommendation algorithms

Paper content:
${paperContent}

Provide a detailed, technical analysis suitable for a researcher in this field.`
            }
          ]
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      const analysisText = data.content[0].text;
      setAnalysis(analysisText);
      
      // Store in conversation memory
      const paperTitle = uploadedFile ? uploadedFile.name.replace('.pdf', '') : 'Research Paper';
      setConversationMemory({
        paperTitle,
        initialAnalysis: analysisText,
        fullContext: `Paper: ${paperTitle}\n\nInitial Analysis:\n${analysisText}`,
        sessionSummary: 'Initial comprehensive analysis completed'
      });
      
      // Automatically start audio playback
      speakText(analysisText);
      
    } catch (error) {
      console.error('Error generating analysis:', error);
      alert('Error generating analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const askQuestion = async () => {
    if (!userQuestion.trim() || !paperContent) return;
    
    setIsAnalyzing(true);
    const question = userQuestion.trim();
    setUserQuestion('');
    
    try {
      // Build comprehensive context including all previous conversations
      const fullConversationHistory = discussionHistory.map(item => 
        `${item.type === 'question' ? 'Previous Question' : 'Previous Answer'}: ${item.content}`
      ).join('\n\n');

      const contextualPrompt = `You are a recommender system researcher AI assistant. You have access to the complete conversation history and context about this research paper.

PAPER CONTEXT:
Paper Title: ${conversationMemory.paperTitle}

INITIAL ANALYSIS:
${conversationMemory.initialAnalysis}

COMPLETE CONVERSATION HISTORY:
${fullConversationHistory}

CURRENT QUESTION: ${question}

Instructions:
- Reference previous discussions and analysis when relevant
- Build upon previous answers and maintain conversation continuity
- Provide detailed, technical responses appropriate for a recommender systems researcher
- If the question relates to something discussed earlier, acknowledge and expand on previous points
- Consider how this question fits into the broader context of our discussion about this paper

Please provide a comprehensive answer that takes into account all the context and previous discussion.`;

      const response = await fetch("https://cors-anywhere.herokuapp.com/https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "x-api-key": process.env.REACT_APP_ANTHROPIC_API_KEY || "your-api-key-here"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [
            {
              role: "user",
              content: contextualPrompt
            }
          ]
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      const answer = data.content[0].text;
      
      // Add to discussion history
      const newHistory = [
        ...discussionHistory,
        { type: 'question', content: question, timestamp: new Date().toISOString() },
        { type: 'answer', content: answer, timestamp: new Date().toISOString() }
      ];
      setDiscussionHistory(newHistory);
      setCurrentDiscussion(answer);
      
      // Update conversation memory with enriched context
      const updatedContext = `${conversationMemory.fullContext}\n\nQ: ${question}\nA: ${answer}`;
      setConversationMemory(prev => ({
        ...prev,
        fullContext: updatedContext,
        sessionSummary: `Discussion includes ${newHistory.filter(item => item.type === 'question').length} questions about ${prev.paperTitle}`
      }));
      
      // Speak the answer
      speakText(answer);
      
    } catch (error) {
      console.error('Error processing question:', error);
      alert('Error processing question. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const speakText = (text) => {
    if (!speechSynthesisRef.current) {
      alert('Speech synthesis not supported in your browser');
      return;
    }

    // Stop any current speech
    speechSynthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesisRef.current.speak(utterance);
  };

  const toggleSpeech = () => {
    if (!speechSynthesisRef.current) return;

    if (isSpeaking) {
      speechSynthesisRef.current.cancel();
      setIsSpeaking(false);
    } else {
      const textToSpeak = currentDiscussion || analysis;
      if (textToSpeak) {
        speakText(textToSpeak);
      }
    }
  };

  const resetSystem = () => {
    setUploadedFile(null);
    setPaperContent('');
    setAnalysis('');
    setCurrentDiscussion('');
    setDiscussionHistory([]);
    setUserQuestion('');
    setConversationMemory({
      paperTitle: '',
      initialAnalysis: '',
      fullContext: '',
      sessionSummary: ''
    });
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }
    setIsSpeaking(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
            <Brain className="text-indigo-600" />
            Research Paper Analyzer
          </h1>
          <p className="text-gray-600 text-lg">
            Upload, analyze, and discuss research papers with AI-powered insights
          </p>
        </div>

        {/* File Upload Section */}
        {!uploadedFile && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="border-2 border-dashed border-indigo-300 rounded-lg p-12 text-center">
              <Upload className="mx-auto h-16 w-16 text-indigo-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Upload Research Paper
              </h3>
              <p className="text-gray-500 mb-6">
                Upload a PDF research paper to begin analysis
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5" />
                    Choose PDF File
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Paper Info and Controls */}
        {uploadedFile && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <FileText className="h-8 w-8 text-indigo-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {uploadedFile.name}
                  </h3>
                  <p className="text-gray-500">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                {!analysis && paperContent && (
                  <button
                    onClick={generateInitialAnalysis}
                    disabled={isAnalyzing}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4" />
                        Start Analysis
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={toggleSpeech}
                  disabled={!analysis && !currentDiscussion}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                  title={!analysis && !currentDiscussion ? "Generate analysis first to enable audio" : ""}
                >
                  {isSpeaking ? (
                    <>
                      <Pause className="h-4 w-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Play Audio
                    </>
                  )}
                </button>
                <button
                  onClick={resetSystem}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
            
            {/* Status and Instructions */}
            <div className="border-t pt-4">
              {isProcessing && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Loader2 className="animate-spin h-4 w-4" />
                  <span>Processing PDF content...</span>
                </div>
              )}
              {!isProcessing && paperContent && !analysis && (
                <div className="flex items-center gap-2 text-green-600">
                  <FileText className="h-4 w-4" />
                  <span>PDF processed successfully! Click "Start Analysis" to begin.</span>
                </div>
              )}
              {!isProcessing && !paperContent && (
                <div className="flex items-center gap-2 text-orange-600">
                  <Loader2 className="animate-spin h-4 w-4" />
                  <span>Extracting text from PDF...</span>
                </div>
              )}
              {analysis && (
                <div className="flex items-center gap-2 text-green-600">
                  <Brain className="h-4 w-4" />
                  <span>Analysis complete! Use audio controls or ask questions below.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {paperContent && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Analysis Panel */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Brain className="h-6 w-6 text-indigo-600" />
                Paper Analysis
              </h2>
              <div className="space-y-4">
                {analysis && (
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {analysis}
                    </div>
                  </div>
                )}
                {isAnalyzing && !analysis && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
                    <span className="ml-3 text-gray-600">Analyzing paper...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Discussion Panel */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-green-600" />
                Discussion
                {conversationMemory.sessionSummary && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    Context Stored
                  </span>
                )}
              </h2>
              
              {/* Discussion History */}
              <div className="mb-4 max-h-64 overflow-y-auto space-y-3">
                {discussionHistory.map((item, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      item.type === 'question'
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : 'bg-green-50 border-l-4 border-green-500'
                    }`}
                  >
                    <div className="font-semibold text-sm mb-1 flex items-center justify-between">
                      <span>{item.type === 'question' ? 'Your Question:' : 'AI Response:'}</span>
                      {item.timestamp && (
                        <span className="text-xs text-gray-500">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <div className="text-gray-700 text-sm whitespace-pre-wrap">
                      {item.content}
                    </div>
                  </div>
                ))}
              </div>

              {/* Question Input */}
              <div className="space-y-3">
                <textarea
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  placeholder="Ask a question about the paper... (e.g., 'How does this approach compare to collaborative filtering?', 'What are the implications for cold start problems?')"
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={3}
                />
                <button
                  onClick={askQuestion}
                  disabled={!userQuestion.trim() || isAnalyzing}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4" />
                      Ask Question
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Conversation Memory Panel */}
        {conversationMemory.sessionSummary && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Conversation Memory
              <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                AI Context Active
              </span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Paper Title</h3>
                  <p className="text-gray-600 bg-gray-50 p-2 rounded">
                    {conversationMemory.paperTitle}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Session Summary</h3>
                  <p className="text-gray-600 bg-gray-50 p-2 rounded">
                    {conversationMemory.sessionSummary}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Stored Context</h3>
                <div className="bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                  <p className="text-xs text-gray-600">
                    ✅ Initial analysis stored ({conversationMemory.initialAnalysis.length} chars)
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    ✅ {discussionHistory.filter(item => item.type === 'question').length} Q&A pairs stored
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    ✅ Full context: {conversationMemory.fullContext.length} characters
                  </p>
                  <p className="text-xs text-green-600 mt-2 font-medium">
                    🧠 AI has access to complete conversation history
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audio Status */}
        {isSpeaking && (
          <div className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <Volume2 className="h-5 w-5 animate-pulse" />
            <span>Playing audio...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchPaperAnalyzer;