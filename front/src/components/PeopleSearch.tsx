import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchIcon, Users, FileText, Sparkles, Zap, TrendingUp, RefreshCw, ArrowRight, Send, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";

interface PersonProfile {
  fullName: string;
  description: string;
  avatar?: string;
  score?: number;
}

interface SessionStatus {
  has_search_data: boolean;
  search_query: string | null;
  results_count: number;
}

interface SearchResponse {
  message: string;
  query: string;
  summary: string;
  results_count: number;
}

interface InstructResponse {
  instruction: string;
  chat_response: string;
  filtered_results: any[];
  results_modified: boolean;
  results_count: number;
  original_query: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type AppPhase = 'search' | 'instruct';

const PeopleSearch = () => {
  const [phase, setPhase] = useState<AppPhase>('search'); // Always start with search
  const [query, setQuery] = useState("");
  const [instruction, setInstruction] = useState("");
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [searchResults, setSearchResults] = useState<PersonProfile[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Clear session on page load/reload
  useEffect(() => {
    const clearSessionOnLoad = async () => {
      try {
        await fetch('http://localhost:8001/session/clear', {
          method: 'POST',
        });
        console.log('Session cleared on page load');
      } catch (error) {
        console.error('Error clearing session on load:', error);
      }
    };
    
    clearSessionOnLoad();
  }, []); // Empty dependency array means this runs only once when component mounts

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: "Query Required",
        description: "Please enter who you're looking for.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    console.log('🔍 Starting search for:', query.trim());
    
    try {
      // Clear any existing session data first
      console.log('🧹 Clearing session...');
      await fetch('http://localhost:8001/session/clear', {
        method: 'POST',
      });
      console.log('✅ Session cleared');

      console.log('🚀 Making search request...');
      const response = await fetch('http://localhost:8001/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim()
        }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('📥 Parsing response...');
      const data: SearchResponse = await response.json();
      console.log('📊 Received data:', data);
      
      // Parse profiles from the summary
      console.log('🔄 Parsing profiles...');
      const profiles = parseProfilesFromSummary(data.summary);
      console.log('👥 Parsed profiles:', profiles);
      setSearchResults(profiles);
      
      // Update session status
      setSessionStatus({
        has_search_data: true,
        search_query: data.query,
        results_count: data.results_count
      });
      
      // Move to instruction phase and add welcome chat message
      setPhase('instruct');
      setChatMessages([{
        id: Date.now().toString(),
        type: 'assistant',
        content: `Perfect! I found ${data.results_count} people matching "${data.query}". You can see them in the table on the left. What would you like me to do with these results? 

For example, you could ask me to:
- Filter by specific roles (CEO, CTO, etc.)
- Format as a report or bullet points
- Rank by experience or company size
- Extract contact information
- Compare their backgrounds

Just type your instructions below!`,
        timestamp: new Date()
      }]);
      
      toast({
        title: "🎉 Search Complete",
        description: `Found ${data.results_count} result(s). Chat with AI to process them!`,
      });
      
    } catch (error) {
      console.error('❌ Search error:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : "Failed to connect to search API.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
      console.log('🏁 Search process completed');
    }
  };

  const handleInstruction = async () => {
    if (!instruction.trim()) {
      return;
    }

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: instruction.trim(),
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);

    const currentInstruction = instruction.trim();
    setInstruction(""); // Clear input immediately
    setIsProcessing(true);
    
    try {
      const response = await fetch('http://localhost:8001/instruct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instruction: currentInstruction
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data: InstructResponse = await response.json();
      console.log('🤖 Instruction response:', data);
      
      // Add assistant response to chat
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.chat_response,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, assistantMessage]);
      
      // Update search results if modified
      if (data.results_modified && data.filtered_results) {
        console.log('🔄 Updating search results with filtered data');
        // Convert filtered results to PersonProfile format
        const updatedProfiles = data.filtered_results.map((item: any, index: number) => ({
          fullName: item.full_name || `Person ${index + 1}`,
          description: item.description || "No description available",
          score: 85 + Math.floor(Math.random() * 15)
        }));
        
        setSearchResults(updatedProfiles);
        setSessionStatus({
          has_search_data: true,
          search_query: data.original_query,
          results_count: data.results_count
        });
        
        toast({
          title: "✨ Results Filtered",
          description: `Search results updated! Now showing ${data.results_count} of the original results.`,
        });
      }
      
    } catch (error) {
      console.error('Instruction error:', error);
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Sorry, I encountered an error processing your request: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInstruction();
    }
  };

  const handleNewSearch = () => {
    // Reset everything to start fresh
    setPhase('search');
    setQuery("");
    setInstruction("");
    setSessionStatus(null);
    setSearchResults([]);
    setChatMessages([]);
    
    // Clear session on server as well
    fetch('http://localhost:8001/session/clear', {
      method: 'POST',
    }).catch(console.error);
  };

  const parseProfilesFromSummary = (summary: string): PersonProfile[] => {
    try {
      // Try to parse as JSON first
      const jsonMatch = summary.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonObjects = summary.match(/\{\s*"full_name"[\s\S]*?\}/g) || [];
        
        return jsonObjects.map((jsonStr: string, index: number) => {
          try {
            const parsed = JSON.parse(jsonStr);
            return {
              fullName: parsed.full_name || `Person ${index + 1}`,
              description: parsed.description || "No description available",
              score: 85 + Math.floor(Math.random() * 15)
            };
          } catch {
            return {
              fullName: `Person ${index + 1}`,
              description: jsonStr.replace(/[{}]/g, '').replace(/"/g, ''),
              score: 85 + Math.floor(Math.random() * 15)
            };
          }
        });
      }
      
      // Fallback parsing
      const lines = summary.split('\n').filter(line => line.trim());
      const profiles: PersonProfile[] = [];
      let currentPerson: any = {};
      
      lines.forEach(line => {
        if (line.includes('full_name') || line.includes('Full Name')) {
          if (currentPerson.fullName) {
            profiles.push({
              fullName: currentPerson.fullName,
              description: currentPerson.description || "No description available",
              score: 85 + Math.floor(Math.random() * 15)
            });
          }
          currentPerson = {
            fullName: line.replace(/.*[:"]/, '').replace(/[",].*/, '').trim()
          };
        } else if (line.includes('description') && currentPerson.fullName) {
          currentPerson.description = line.replace(/.*[:"]/, '').replace(/[",].*/, '').trim();
        }
      });
      
      if (currentPerson.fullName) {
        profiles.push({
          fullName: currentPerson.fullName,
          description: currentPerson.description || "No description available",
          score: 85 + Math.floor(Math.random() * 15)
        });
      }
      
      return profiles.length > 0 ? profiles : [{
        fullName: "Search Result",
        description: summary,
        score: 90
      }];
    } catch (error) {
      console.error('Error parsing profiles:', error);
      return [{
        fullName: "Search Result",
        description: summary,
        score: 90
      }];
    }
  };

  const isSearchPhase = phase === 'search';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Synaps
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isSearchPhase ? "Search for people" : `Results for: "${sessionStatus?.search_query}"`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Phase indicators */}
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-all ${
                  isSearchPhase ? 'bg-gradient-primary text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  <SearchIcon className="h-3 w-3" />
                  <span className="font-medium">Search</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-all ${
                  !isSearchPhase ? 'bg-gradient-primary text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  <MessageSquare className="h-3 w-3" />
                  <span className="font-medium">Chat</span>
                </div>
              </div>
              
              {!isSearchPhase && (
                <Button
                  onClick={handleNewSearch}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  New Search
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Phase */}
      {isSearchPhase && (
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="max-w-2xl w-full mx-auto px-4">
            <Card className="border-glass backdrop-blur-xl">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="p-4 bg-gradient-primary rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <SearchIcon className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">Who are you looking for?</h2>
                  <p className="text-muted-foreground">Search for people and then chat with AI to analyze the results</p>
                </div>
                
                <div className="space-y-4">
                  <Input
                    placeholder="e.g., OpenAI executive team, YC partners, Aghiles Djebara..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="text-lg h-14"
                    disabled={isSearching}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  
                  <Button
                    onClick={handleSearch}
                    disabled={isSearching || !query.trim()}
                    className="w-full h-14 text-lg font-bold bg-gradient-primary hover:scale-105 transition-all duration-300"
                  >
                    {isSearching ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <SearchIcon className="w-5 h-5 mr-3" />
                        Search People
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Results and Chat Phase */}
      {!isSearchPhase && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
            {/* Left Side - People Table */}
            <div className="col-span-7">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-primary rounded-lg">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">People Found</h3>
                        <p className="text-sm text-muted-foreground">
                          {searchResults.length} profiles • Click to see details
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Updated {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 h-full overflow-hidden">
                  <div className="overflow-auto h-full">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-sm">
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead className="w-16">Avatar</TableHead>
                          <TableHead className="w-48">Name</TableHead>
                          <TableHead className="w-20">Match</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchResults.map((profile, index) => (
                          <TableRow key={index} className="hover:bg-muted/20 cursor-pointer">
                            <TableCell className="font-medium text-muted-foreground">
                              {index + 1}
                            </TableCell>
                            <TableCell>
                              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {profile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold text-foreground">
                                {profile.fullName}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-sm font-medium text-green-600">
                                  {profile.score}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground line-clamp-2 max-w-md">
                                {profile.description}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Chat Interface */}
            <div className="col-span-5">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-3 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-accent rounded-lg">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">AI Assistant</h3>
                      <p className="text-sm text-muted-foreground">
                        Give instructions to process your search results
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                {/* Chat Messages */}
                <CardContent className="flex-1 flex flex-col p-0">
                  <div className="flex-1 overflow-auto p-4 space-y-4">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg p-3 ${
                            message.type === 'user'
                              ? 'bg-gradient-primary text-white'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          {message.type === 'assistant' ? (
                            <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-current prose-strong:text-current prose-ul:text-current prose-li:text-current">
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          )}
                          <div className={`text-xs mt-1 opacity-70 ${
                            message.type === 'user' ? 'text-white/70' : 'text-muted-foreground'
                          }`}>
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isProcessing && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg p-3 max-w-[85%]">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            <span className="text-sm text-muted-foreground">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Chat Input */}
                  <div className="border-t p-4 flex-shrink-0">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Ask me to format, filter, analyze, or do anything with the search results..."
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 min-h-[60px] max-h-32 resize-none"
                        disabled={isProcessing}
                      />
                      <Button
                        onClick={handleInstruction}
                        disabled={isProcessing || !instruction.trim()}
                        className="self-end"
                        size="icon"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Press Enter to send, Shift+Enter for new line
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeopleSearch;