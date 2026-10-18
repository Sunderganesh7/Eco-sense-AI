const fs = require('fs');
let file = 'frontend/src/pages/LandIntelligence.tsx';
let content = fs.readFileSync(file, 'utf8');
content = `import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnvironmentalData } from '../context/EnvironmentalContext';
import { 
  ArrowLeft, RefreshCw, Map as MapIcon, ShieldCheck, ChevronDown, ChevronUp, Link as LinkIcon, BookOpen, Tractor, Layers
} from 'lucide-react';

const safeVal = (v: any): string => {
  if (v === null || v === undefined) return 'Unknown';
  if (typeof v === 'object' && 'value' in v) {` + "\n" + content;
fs.writeFileSync(file, content);
