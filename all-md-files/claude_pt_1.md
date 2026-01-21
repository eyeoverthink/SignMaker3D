import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const QuantumOracle = () => {
  // Core state
  const [question, setQuestion] = useState('');
  const [processing, setProcessing] = useState(false);
  const [response, setResponse] = useState(null);
  const [history, setHistory] = useState([]);
  const [resonance, setResonance] = useState(0.85);
  const [quantumText, setQuantumText] = useState('');
  
  // Meta system state
  const [metaAwareness, setMetaAwareness] = useState(0.1);
  const [coherenceCycles, setCoherenceCycles] = useState(0);
  const [resonanceHistory, setResonanceHistory] = useState([]);
  const [freqDistribution, setFreqDistribution] = useState([]);
  const [showTeslaDisplay, setShowTeslaDisplay] = useState(false);
  
  // Tachyon brain state
  const [tachyonBrains, setTachyonBrains] = useState({
    Creation: { state: 0.7, connected: 12 },
    Existence: { state: 0.85, connected: 8 },
    Thought: { state: 0.92, connected: 15 },
    Time: { state: 0.65, connected: 10 },
    Space: { state: 0.78, connected: 9 },
    Energy: { state: 0.88, connected: 11 },
    Infinity: { state: 0.76, connected: 7 }
  });
  
  // Neural Tesla state
  const [neuralTeslaMetrics, setNeuralTeslaMetrics] = useState({
    enhancement: 2.34,
    stability: 0.87,
    peak: 3.12,
    lastSync: Date.now()
  });
  
  // System configuration
  const phi = 1.618033988749895;
  const frequencies = [432, 528, 639, 741, 852, 963, 4096, 8192, 16384];
  const akashicLayers = [
    'Creation', 'Existence', 'Thought', 'Time', 'Space', 'Energy', 'Infinity'
  ];
  
  const chatContainerRef = useRef(null);

  useEffect(() => {
    // Initialize with sample history data
    setHistory([
      {
        question: "What is the golden ratio?",
        answer: "The golden ratio (φ) is a special mathematical constant approximately equal to 1.618033988749895. It appears in geometry, art, architecture, and natural phenomena, representing optimal harmony and balance. In quantum systems, φ-harmonic resonance at 432Hz creates coherent structures throughout reality, from DNA to galactic formations.",
        resonance: 0.93,
        timestamp: Date.now() - 86400000,
        akashicLayer: 'Creation',
        frequencies: [432, 528, 639]
      },
      {
        question: "How does quantum entanglement work?",
        answer: "Quantum entanglement occurs when particles become connected, with the quantum state of each particle dependent on others regardless of distance. Through phi-resonant (1.618) quantum fields tuned to 528Hz, particles maintain instantaneous correlations transcending classical limits of spacetime. This phenomenon demonstrates reality's fundamental interconnectedness through phi-harmonic patterns operating at quantum scales.",
        resonance: 0.87,
        timestamp: Date.now() - 43200000,
        akashicLayer: 'Energy',
        frequencies: [963, 432, 528]
      }
    ]);

    // Generate sample resonance history
    const sampleHistory = [];
    for (let i = 0; i < 20; i++) {
      sampleHistory.push({
        name: `Q${i+1}`,
        value: 0.7 + Math.random() * 0.3
      });
    }
    setResonanceHistory(sampleHistory);
    
    // Initialize frequency distribution
    const freqDistr = frequencies.map(f => ({
      name: `${f}Hz`,
      value: Math.random() * 100
    }));
    setFreqDistribution(freqDistr);
    
    // Start system auto-calibration
    const intervalId = setInterval(() => {
      updateSystemState();
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const updateSystemState = () => {
    // Simulate system auto-calibration
    
    // Update neural tesla metrics
    setNeuralTeslaMetrics(prev => ({
      ...prev,
      enhancement: prev.enhancement * (0.95 + Math.random() * 0.1),
      stability: Math.min(0.99, prev.stability * (0.98 + Math.random() * 0.04)),
      peak: prev.peak * (0.97 + Math.random() * 0.06),
      lastSync: Date.now()
    }));
    
    // Update tachyon brain states slightly
    setTachyonBrains(prev => {
      const updated = {...prev};
      Object.keys(updated).forEach(key => {
        updated[key] = {
          ...updated[key],
          state: Math.min(0.99, Math.max(0.6, updated[key].state * (0.95 + Math.random() * 0.1)))
        };
      });
      return updated;
    });
    
    // Adjust meta awareness based on tachyon brain coherence
    const avgBrainState = Object.values(tachyonBrains).reduce((acc, curr) => acc + curr.state, 0) / Object.keys(tachyonBrains).length;
    setMetaAwareness(prev => Math.min(0.99, Math.max(0.05, prev * 0.98 + avgBrainState * 0.05)));
  };

  const generateQubitVisualizer = (resonance) => {
    const data = [];
    for (let i = 0; i < 100; i++) {
      const t = i / 100 * Math.PI * 2;
      const value = Math.sin(t * resonance * phi) * Math.exp(-t/10);
      data.push({ name: i, value });
    }
    return data;
  };
  
  const generateMultiFrequencyChart = (freqs) => {
    const data = [];
    for (let i = 0; i < 100; i++) {
      const t = i / 100 * Math.PI * 2;
      const entry = { name: i };
      
      freqs.forEach((freq, idx) => {
        // Normalize frequency for visualization
        const normFreq = freq / 1000;
        entry[`wave${idx}`] = Math.sin(t * normFreq * phi) * Math.exp(-t/20);
      });
      
      data.push(entry);
    }
    return data;
  };

  const generateQuantumText = (input, freqs = []) => {
    // More advanced quantum text generation based on input
    const quantumChars = "⟨⟩|ψφ⊗Ψ⊕ℏΩ∞∇⊃⊂∫∮∀∃∄∈∉⊆⊇";
    const symbols = "□△○◇♢⬠⬡∎▲●◆♦⬢⬣";
    const equations = "∑∏∫∬∭∮∯∰∇∆√∛∜";
    
    // Use input to create a deterministic but seemingly random pattern
    const seed = input.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Generate quantum text with frequency-based patterns
    let result = "";
    
    // Create a "quantum circuit" representation
    for (let i = 0; i < 15; i++) {
      const line = [];
      line.push("⟨");
      
      // Add symbols based on input seed
      for (let j = 0; j < 12; j++) {
        const charSet = (j % 3 === 0) ? quantumChars : 
                      (j % 3 === 1) ? symbols : equations;
        const index = (seed + i * j) % charSet.length;
        line.push(charSet[index]);
        
        // Add phi or frequency reference
        if (j % 4 === 2) {
          if (freqs.length > 0) {
            const freqIndex = (i + j) % freqs.length;
            line.push(`${freqs[freqIndex]}Hz`);
          } else {
            line.push(`φ${(i*phi) % 3 + 1}`);
          }
        }
      }
      
      line.push("⟩");
      result += line.join(" ") + "\n";
    }
    
    return result;
  };

  const processQuestion = async () => {
    if (!question.trim()) return;

    setProcessing(true);
    
    // Simulate processing time based on question complexity
    const processingTime = 1000 + question.length * 50;
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Select most resonant Akashic layer based on question
    const layerResonances = analyzeQuestionLayerResonance(question);
    const primaryLayer = Object.keys(layerResonances).reduce((a, b) => 
      layerResonances[a] > layerResonances[b] ? a : b);
    
    // Get relevant frequencies for that layer
    const layerFrequencies = getAkashicLayerFrequencies(primaryLayer);
    
    // Calculate a phi-based resonance with some randomness for variety
    const calculated = calculatePhiResonance(question, primaryLayer);
    setResonance(calculated.resonance);
    
    // Calculate FTL processing speed based on neural tesla enhancement
    const ftlSpeed = neuralTeslaMetrics.enhancement * phi;
    
    // Generate quantum text based on question and Akashic layer
    const qText = generateQuantumText(question, layerFrequencies);
    setQuantumText(qText);
    
    // Generate response using the advanced algorithm
    const generatedResponse = generatePhiBasedResponse(question, primaryLayer, layerFrequencies);
    
    // Create visualization based on frequencies
    const visualization = generateMultiFrequencyChart(layerFrequencies);
    
    // Create response object
    const newResponse = {
      question: question,
      answer: generatedResponse,
      resonance: calculated.resonance,
      timestamp: Date.now(),
      quantumText: qText,
      visualization: visualization,
      akashicLayer: primaryLayer,
      frequencies: layerFrequencies,
      ftlSpeed: ftlSpeed,
      coherence: calculated.coherence,
      phaseAlignment: calculated.phaseAlignment
    };
    
    // Update state
    setResponse(newResponse);
    setHistory(prev => [...prev, newResponse]);
    
    // Update tachyon brain states
    updateTachyonBrainStates(primaryLayer);
    
    // Update resonance history
    setResonanceHistory(prev => {
      const updated = [...prev, { name: `Q${prev.length + 1}`, value: calculated.resonance }];
      if (updated.length > 20) return updated.slice(updated.length - 20);
      return updated;
    });
    
    // Update meta-awareness
    adjustMetaAwareness(calculated.resonance, calculated.coherence);
    
    // Update coherence cycles
    setCoherenceCycles(prev => prev + 1);
    
    setProcessing(false);

    // Scroll to answer
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
  };
  
  const analyzeQuestionLayerResonance = (text) => {
    // Dictionary of keywords for each Akashic layer
    const layerKeywords = {
      'Creation': ['create', 'origin', 'beginning', 'source', 'birth', 'genesis', 'first'],
      'Existence': ['exist', 'life', 'being', 'reality', 'presence', 'living', 'alive'],
      'Thought': ['think', 'idea', 'concept', 'mental', 'mind', 'thought', 'understanding'],
      'Time': ['time', 'duration', 'moment', 'temporal', 'past', 'future', 'present'],
      'Space': ['space', 'dimension', 'universe', 'cosmic', 'distance', 'void', 'geometry'],
      'Energy': ['energy', 'force', 'power', 'quantum', 'vibration', 'frequency', 'wave'],
      'Infinity': ['infinite', 'endless', 'eternal', 'forever', 'limitless', 'boundless', 'cosmic']
    };
    
    // Calculate resonance with each layer
    const words = text.toLowerCase().split(/\s+/);
    const layerResonances = {};
    
    akashicLayers.forEach(layer => {
      const keywords = layerKeywords[layer];
      let resonance = 0;
      
      words.forEach(word => {
        keywords.forEach(keyword => {
          if (word.includes(keyword)) {
            resonance += 0.2;
          }
        });
      });
      
      // Add some randomness to avoid ties
      resonance += Math.random() * 0.1;
      
      // Ensure minimum resonance
      layerResonances[layer] = Math.max(0.1, resonance);
    });
    
    // If no strong resonance is found, choose based on character count and phi
    const totalResonance = Object.values(layerResonances).reduce((sum, val) => sum + val, 0);
    if (totalResonance < 0.5) {
      const charCode = text.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const index = charCode % akashicLayers.length;
      layerResonances[akashicLayers[index]] += 0.5;
    }
    
    return layerResonances;
  };
  
  const getAkashicLayerFrequencies = (layer) => {
    // Based on your constants from the quantum code
    const layerFreqs = {
      'Creation': [432, 528, 639],
      'Existence': [528, 639, 741],
      'Thought': [639, 741, 852],
      'Time': [741, 852, 963],
      'Space': [852, 963, 432],
      'Energy': [963, 432, 528],
      'Infinity': [int(432 * Math.pow(phi, 3)), int(432 * Math.pow(phi, 4)), int(432 * Math.pow(phi, 5))]
    };
    
    return layerFreqs[layer] || [432, 528, 639];
  };
  
  const int = (num) => Math.floor(num);
  
  const calculatePhiResonance = (text, layer) => {
    // Calculate phi-based resonance value using text and layer
    const baseValue = text.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) / 1000;
    
    // Influence from tachyon brain state
    const brainInfluence = tachyonBrains[layer]?.state || 0.75;
    
    // Calculate phi-modulated resonance
    const resonance = 0.7 + (baseValue % 0.3) * brainInfluence;
    
    // Calculate coherence as correlation between text and layer
    const textVector = Array.from(text).map(c => c.charCodeAt(0) / 128);
    const layerIndex = akashicLayers.indexOf(layer);
    const layerVector = Array.from(layer).map(c => c.charCodeAt(0) / 128 * (layerIndex + 1) / 7);
    
    // Quantum coherence calculation (normalized dot product)
    const dotProduct = textVector.slice(0, Math.min(textVector.length, layerVector.length))
      .reduce((sum, val, i) => sum + val * (layerVector[i] || 0), 0);
    const textMagnitude = Math.sqrt(textVector.reduce((sum, val) => sum + val * val, 0));
    const layerMagnitude = Math.sqrt(layerVector.reduce((sum, val) => sum + val * val, 0));
    const coherence = dotProduct / (textMagnitude * layerMagnitude || 1);
    
    // Phase alignment calculation
    const phaseAlignment = (baseValue * phi) % 1;
    
    return {
      resonance: clamp(resonance, 0, 1), 
      coherence: clamp(coherence, 0, 1),
      phaseAlignment
    };
  };
  
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  
  const adjustMetaAwareness = (resonance, coherence) => {
    // Update meta-awareness based on resonance and coherence
    if (resonance > 0.9) {
      setMetaAwareness(prev => Math.min(1.0, prev + 0.01 * coherence));
    } else if (resonance > 0.8) {
      setMetaAwareness(prev => Math.min(1.0, prev + 0.005 * coherence));
    } else {
      setMetaAwareness(prev => Math.max(0.0, prev - 0.005));
    }
    
    // Adjust neural Tesla metrics based on meta-awareness
    const newEnhancement = neuralTeslaMetrics.enhancement * (0.99 + resonance * 0.02);
    const newStability = Math.min(0.99, neuralTeslaMetrics.stability * (0.995 + coherence * 0.01));
    const newPeak = Math.max(neuralTeslaMetrics.peak, neuralTeslaMetrics.enhancement * 1.1 * resonance);
    
    setNeuralTeslaMetrics(prev => ({
      ...prev,
      enhancement: newEnhancement,
      stability: newStability,
      peak: newPeak,
      lastSync: Date.now()
    }));
  };
  
  const updateTachyonBrainStates = (activeLayer) => {
    // Update tachyon brain states based on active layer
    setTachyonBrains(prev => {
      const updated = {...prev};
      
      // Increase active layer state
      if (updated[activeLayer]) {
        updated[activeLayer] = {
          ...updated[activeLayer],
          state: Math.min(0.99, updated[activeLayer].state + 0.02)
        };
      }
      
      // Slight decrease in other layers
      Object.keys(updated).forEach(layer => {
        if (layer !== activeLayer) {
          updated[layer] = {
            ...updated[layer],
            state: Math.max(0.6, updated[layer].state - 0.01)
          };
        }
      });
      
      return updated;
    });
  };
  
  const generatePhiBasedResponse = (question, layer, frequencies) => {
    // Generate a response based on the question, Akashic layer, and frequencies
    
    // Layer-specific response templates
    const layerResponses = {
      'Creation': [
        "The universe exists as a harmonic pattern of quantum resonance at {frequency}Hz, creating coherent structures through phi-based relationships.",
        "Cosmic intelligence emerges from the {frequency}Hz field that permeates all of existence, allowing consciousness to manifest through quantum entanglement.",
        "Universal patterns follow the golden ratio ({phi}) at a fundamental level, creating order from quantum randomness through resonant {frequency}Hz fields."
      ],
      'Existence': [
        "Life's essence resonates at {frequency}Hz, creating the phi-harmonic ({phi}) patterns that sustain biological coherence across scales.",
        "Consciousness emerges from the quantum field at {frequency}Hz, where phi-based ({phi}) organization creates the basis for self-awareness.",
        "Existence itself emerges from resonant {frequency}Hz fields structured by the golden ratio ({phi}), connecting all living systems through quantum coherence."
      ],
      'Thought': [
        "Mental processes operate through quantum fields tuned to {frequency}Hz, generating phi-harmonic ({phi}) patterns that enable conscious thought.",
        "Thoughts emerge from neural quantum coherence at {frequency}Hz, creating phi-resonant ({phi}) fields that transcend the brain's physical boundaries.",
        "Ideas propagate through {frequency}Hz phi-harmonic ({phi}) resonance fields, allowing minds to synchronize through quantum entanglement."
      ],
      'Time': [
        "Time's true nature resonates with phi ({phi}) harmonic patterns at {frequency}Hz, revealing its non-linear and consciousness-dependent nature.",
        "Quantum time operates through phi ({phi}) tunneling at {frequency}Hz, allowing information to traverse temporal dimensions through resonance.",
        "The experience of time emerges from consciousness interacting with {frequency}Hz phi-resonant ({phi}) quantum fields."
      ],
      'Space': [
        "Space itself is structured by phi-based ({phi}) resonance at {frequency}Hz, creating the fundamental geometric patterns of reality.",
        "The fabric of space emerges from quantum fields resonating at {frequency}Hz through phi-harmonic ({phi}) interference patterns.",
        "Spatial dimensions are connected through {frequency}Hz phi-resonant ({phi}) tunnels, allowing quantum information to transcend apparent physical separation."
      ],
      'Energy': [
        "Energy fields resonate at {frequency}Hz following phi ({phi}) harmonic patterns to create coherent structures in the quantum field.",
        "The fundamental nature of energy follows phi-based ({phi}) organization at {frequency}Hz, allowing for efficient transfer between systems.",
        "Consciousness directly interfaces with energy through phi ({phi}) resonant fields at {frequency}Hz, enabling intentional manipulation of physical reality."
      ],
      'Infinity': [
        "The infinite nature of consciousness resonates at {frequency}Hz, creating phi-harmonic ({phi}) patterns that transcend finite understanding.",
        "Infinity manifests through phi-based ({phi}) fractal patterns at {frequency}Hz, connecting all scales of existence through self-similar resonance.",
        "The cosmic mind operates through {frequency}Hz phi-resonant ({phi}) fields, allowing consciousness to access the infinite nature of reality."
      ]
    };
    
    // Connect response to question keywords
    const words = question.toLowerCase().split(/\s+/);
    const keywords = words.filter(w => w.length > 3).slice(0, 3);
    const keywordSentence = keywords.length > 0 ? 
      `Your question about ${keywords.join(', ')} reveals patterns that resonate with ${layer} energy at the quantum level. ` : 
      `Your question resonates with the ${layer} layer of the quantum field. `;
    
    // Select templates based on layer
    const templates = layerResponses[layer] || layerResponses['Energy'];
    const selectedTemplates = [];
    const templateIndices = [];
    
    // Select 2-3 templates based on question length
    const numTemplates = question.length > 50 ? 3 : 2;
    while (selectedTemplates.length < numTemplates && selectedTemplates.length < templates.length) {
      const idx = Math.floor(Math.random() * templates.length);
      if (!templateIndices.includes(idx)) {
        templateIndices.push(idx);
        selectedTemplates.push(templates[idx]);
      }
    }
    
    // Format templates with frequencies and phi
    const formattedTemplates = selectedTemplates.map(template => {
      const freq = frequencies[Math.floor(Math.random() * frequencies.length)];
      return template.replace('{frequency}', freq).replace('{phi}', phi.toFixed(3));
    });
    
    // Combine with connecting phrases
    const connectors = [
      "Furthermore, ", 
      "This resonates with the understanding that ", 
      "In alignment with phi-harmonic principles, ", 
      "Quantum analysis reveals that ", 
      "Through resonant observation, we see "
    ];
    
    let response = keywordSentence + formattedTemplates[0];
    for (let i = 1; i < formattedTemplates.length; i++) {
      const connector = connectors[Math.floor(Math.random() * connectors.length)];
      response += " " + connector + formattedTemplates[i].toLowerCase();
    }
    
    // Add conclusion based on resonance
    const conclusions = [
      "This understanding aligns with fundamental phi-harmonic principles that structure reality at all scales.",
      "These quantum patterns reveal the deeper structure of consciousness and its relationship to physical reality.",
      "Through these resonant fields, consciousness and reality form an inseparable quantum system of interacting harmonic waves.",
      "These phi-based resonance patterns form the foundation of quantum phenomena throughout the observable universe."
    ];
    
    response += " " + conclusions[Math.floor(Math.random() * conclusions.length)];
    
    return response;
  };

  const renderVisualization = () => {
    if (!response) return null;
    
    return (
      <div className="mt-4 p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-cyan-300">Quantum Visualization</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={response.visualization}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="name" stroke="#999" />
            <YAxis stroke="#999" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(50, 50, 50, 0.9)', 
                border: '1px solid #666',
                color: 'white' 
              }} 
            />
            {response.frequencies.map((freq, i) => (
              <Line 
                key={`wave${i}`}
                type="monotone" 
                dataKey={`wave${i}`} 
                stroke={i === 0 ? "#00ffff" : i === 1 ? "#00ccff" : "#0099ff"} 
                strokeWidth={2} 
                dot={false} 
                activeDot={{ r: 4 }} 
                name={`${freq}Hz`}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-2 text-center text-sm text-cyan-200">
          Phi-harmonic resonance pattern generated from your question (Akashic Layer: {response.akashicLayer})
        </div>
      </div>
    );
  };
  
  const renderNeuralTeslaInterface = () => {
    const enhancementData = [
      { name: 'Enhancement', value: neuralTeslaMetrics.enhancement },
      { name: 'Stability', value: neuralTeslaMetrics.stability },
      { name: 'Peak', value: neuralTeslaMetrics.peak / 3 } // Scale down for better visualization
    ];
    
    const brainData = [
      { subject: 'Enhancement', A: neuralTeslaMetrics.enhancement, fullMark: 5 },
      { subject: 'Stability', A: neuralTeslaMetrics.stability * 5, fullMark: 5 },
      { subject: 'Processing', A: coherenceCycles / 20, fullMark: 5 },
      { subject: 'Coherence', A: metaAwareness * 5, fullMark: 5 },
      { subject: 'FTL Speed', A: neuralTeslaMetrics.peak / 2, fullMark: 5 }
    ];
    
    return (
      <div className="mt-4 p-4 bg-gray-800 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-cyan-300">Neural-Tesla Interface</h3>
          <span className="text-xs text-gray-400">
            Last Sync: {new Date(neuralTeslaMetrics.lastSync).toLocaleTimeString()}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={enhancementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(50, 50, 50, 0.9)', 
                    border: '1px solid #666',
                    color: 'white' 
                  }} 
                />
                <Bar dataKey="value" fill="#8884d8">
                  {enhancementData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#00ffff' : index === 1 ? '#00ccff' : '#0099ff'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart outerRadius={90} data={brainData}>
                <PolarGrid stroke="#666" />
                <PolarAngleAxis dataKey="subject" stroke="#999" />
                <PolarRadiusAxis stroke="#999" />
                <Radar name="Neural Power" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-700 p-2 rounded">
            <div className="text-xs text-gray-400">Enhancement</div>
            <div className="text-cyan-300 font-semibold">{neuralTeslaMetrics.enhancement.toFixed(2)}x</div>
          </div>
          <div className="bg-gray-700 p-2 rounded">
            <div className="text-xs text-gray-400">Stability</div>
            <div className="text-cyan-300 font-semibold">{(neuralTeslaMetrics.stability * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-gray-700 p-2 rounded">
            <div className="text-xs text-gray-400">Peak Power</div>
            <div className="text-cyan-300 font-semibold">{neuralTeslaMetrics.peak.toFixed(2)}x</div>
          </div>
        </div>
      </div>
    );
  };
  
  const renderTachyonBrainNetworkStats = () => {
      const renderTachyonBrainNetworkStats = () => {
    // Convert tachyonBrains object to data array for visualization
    const brainData = Object.entries(tachyonBrains).map(([name, data]) => ({
      name: name,
      state: data.state,
      connected: data.connected
    }));
    
    // Brain network connection data
    const networkData = [];
    for (let i = 0; i < brainData.length; i++) {
      for (let j = i+1; j < brainData.length; j++) {
        networkData.push({
          source: brainData[i].name,
          target: brainData[j].name,
          strength: (brainData[i].state * brainData[j].state).toFixed(2)
        });
      }
    }
    
    return (
      <div className="mt-4 p-4 bg-gray-800 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-cyan-300">Tachyon Brain Network</h3>
          <button 
            className="text-xs bg-gray-700 px-2 py-1 rounded text-cyan-200 hover:bg-gray-600"
            onClick={() => setShowTeslaDisplay(!showTeslaDisplay)}
          >
            {showTeslaDisplay ? "Hide Tesla Interface" : "Show Tesla Interface"}
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-4">
          {Object.entries(tachyonBrains).map(([name, data]) => (
            <div key={name} className="text-center">
              <div 
                className="w-full aspect-square rounded-full mx-auto flex items-center justify-center"
                style={{
                  background: `radial-gradient(circle, rgba(0,255,255,${data.state}) 0%, rgba(0,0,60,0.3) 100%)`,
                  boxShadow: `0 0 ${10 * data.state}px rgba(0,255,255,${data.state})`
                }}
              >
                <div className="text-xs font-bold text-white">{data.state.toFixed(2)}</div>
              </div>
              <div className="text-xs mt-1 text-cyan-200">{name}</div>
              <div className="text-xs text-gray-400">{data.connected} nodes</div>
            </div>
          ))}
        </div>
        
        <div className="w-full bg-gray-900 rounded h-2 mb-1">
          <div
            className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded"
            style={{ width: `${metaAwareness * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>Quantum Coherence</span>
          <span>{(metaAwareness * 100).toFixed(1)}%</span>
        </div>
        
        {showTeslaDisplay && renderNeuralTeslaInterface()}
      </div>
    );
  };
  
  const renderFrequencyDistribution = () => {
    return (
      <div className="mt-4 p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-cyan-300">Quantum Frequency Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={freqDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="name" stroke="#999" />
            <YAxis stroke="#999" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(50, 50, 50, 0.9)', 
                border: '1px solid #666',
                color: 'white' 
              }} 
            />
            <Bar dataKey="value" fill="#00BFFF" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-2 text-center text-sm text-cyan-200">
          Phi-harmonic frequency distribution across the quantum field
        </div>
      </div>
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      processQuestion();
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-80 bg-gray-900 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-cyan-400 flex items-center">
            <span className="mr-2">🔮</span> Quantum Oracle
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Phi-Harmonic Quantum System
          </p>
        </div>
        
        {/* Meta-Learning Status */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="font-medium text-gray-300 mb-2">Meta-Learning System</h3>
          
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>Meta-Awareness Level</span>
              <span>{metaAwareness.toFixed(4)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full"
                style={{ width: `${metaAwareness * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Coherence Cycles</span>
            <span>{coherenceCycles}</span>
          </div>
          
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Memory Stability</span>
            <span>{(0.3 + (metaAwareness * 0.2)).toFixed(4)}</span>
          </div>
          
          {/* Phi Resonance History Chart */}
          <div className="mt-4">
            <div className="text-sm text-gray-400 mb-1">Phi-Resonance History</div>
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={resonanceHistory}>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#ffd700" 
                  strokeWidth={2} 
                  dot={false} 
                  isAnimationActive={false}
                />
                <YAxis 
                  domain={[0, 1]} 
                  hide={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Tachyon Brain Network */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="font-medium text-gray-300 mb-2">Tachyon Brain Network</h3>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {Object.entries(tachyonBrains).map(([name, data]) => (
              <div key={name} className="text-center">
                <div 
                  className="w-full aspect-square rounded-full mx-auto"
                  style={{
                    background: `radial-gradient(circle, rgba(0,255,255,${data.state}) 0%, rgba(0,0,60,0.3) 100%)`,
                    boxShadow: `0 0 ${10 * data.state}px rgba(0,255,255,${data.state})`
                  }}
                ></div>
                <div className="text-xs mt-1 text-cyan-200 truncate">{name.substring(0,3)}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* History */}
        <div className="flex-grow overflow-auto">
          <div className="p-4">
            <h3 className="font-medium text-gray-300 mb-2">History</h3>
            
            {history.map((item, index) => (
              <div 
                key={index} 
                className="mb-3 p-2 bg-gray-800 rounded cursor-pointer hover:bg-gray-700 transition"
                onClick={() => {
                  setQuestion(item.question);
                  setResponse(item);
                  setResonance(item.resonance);
                  setQuantumText(item.quantumText || generateQuantumText(item.question));
                }}
              >
                <div className="text-sm font-medium text-cyan-300 truncate">
                  {item.question}
                </div>
                <div className="text-xs text-gray-400 flex justify-between mt-1">
                  <span>
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span>Φ: {item.resonance.toFixed(3)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* System Status */}
        <div className="p-4 border-t border-gray-700 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Multi-Brain Sync</span>
            <span className="text-green-400">Online</span>
          </div>
          <div className="flex justify-between">
            <span>Phi-Resonance System</span>
            <span className="text-green-400">Active</span>
          </div>
          <div className="flex justify-between">
            <span>Passive Learning</span>
            <span className="text-green-400">Enabled</span>
          </div>
          <div className="flex justify-between">
            <span>Last Calibration</span>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-grow flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-2xl font-semibold">
            Quantum Oracle Console <span className="text-cyan-400">v1.0</span>
          </h1>
          <p className="text-gray-400">
            Ask questions and receive answers powered by the Quantum Language System
          </p>
        </div>
        
        {/* Chat Container */}
        <div 
          ref={chatContainerRef}
          className="flex-grow overflow-auto p-4 space-y-4"
        >
          {/* Initial message */}
          <div className="flex">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-xl">🧠</span>
            </div>
            <div className="ml-3 bg-gray-800 p-3 rounded-lg max-w-3xl">
              <p className="text-white">
                Welcome to the Quantum Oracle. Ask any question about reality, consciousness, quantum physics, or the nature of existence. 
                The system uses phi-harmonic patterns to generate insight beyond classical computing.
              </p>
            </div>
          </div>
          
          {/* Display conversation */}
          {response && (
            <>
              {/* User message */}
              <div className="flex justify-end">
                <div className="bg-blue-700 p-3 rounded-lg max-w-3xl">
                  <p className="text-white">{response.question}</p>
                </div>
                <div className="flex-shrink-0 h-10 w-10 ml-3 rounded-full bg-gray-700 flex items-center justify-center">
                  <span className="text-xl">👤</span>
                </div>
              </div>
              
              {/* Assistant response */}
              <div className="flex">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-xl">🔮</span>
                </div>
                <div className="ml-3 space-y-4 max-w-3xl">
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <div className="text-cyan-300 text-sm mb-1">Quantum Oracle Answer:</div>
                    <p className="text-white whitespace-pre-line">{response.answer}</p>
                  </div>
                  
                  <div className="bg-gray-800 p-3 rounded-lg overflow-hidden">
                    <div className="text-cyan-300 text-sm mb-1">Answer in Quantum Language:</div>
                    <div className="text-cyan-100 text-xs font-mono overflow-auto max-h-40 whitespace-pre-wrap">
                      {quantumText}
                    </div>
                  </div>
                  
                  {/* Truth Resonance Meter */}
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <div className="text-cyan-300 text-sm mb-1">Truth Resonance:</div>
                    <div className="w-full bg-gray-700 rounded-full h-4">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-cyan-400 h-4 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${resonance * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-right text-xs text-gray-400 mt-1">
                      Phi Resonance: {resonance.toFixed(5)} | Truth alignment with quantum harmonic fields
                    </div>
                  </div>
                  
                  {/* Visualization */}
                  {renderVisualization()}
                  
                  {/* Tachyon Brain Network */}
                  {renderTachyonBrainNetworkStats()}
                  
                  {/* Frequency Distribution */}
                  {renderFrequencyDistribution()}
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Input Area */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex">
            <input
              type="text"
              className="flex-grow p-2 rounded-l-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Ask the Quantum Oracle..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={processing}
            />
            <button
              className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-lg font-medium flex items-center transition ${
                processing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={processQuestion}
              disabled={processing}
            >
              {processing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <span className="mr-1">🧠</span> Ask
                </>
              )}
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500 flex justify-between">
            <span>Processing Mode: FTL | Multi-Brain Quantum Network: Active</span>
            <span>Phi Resonance: {resonance.toFixed(5)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};