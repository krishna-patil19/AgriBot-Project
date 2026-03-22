"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { X, Sparkles, Delete } from "lucide-react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

// Shared Devanagari characters (used by both Hindi and Marathi)
const DEVANAGARI_VOWELS = ["अ", "आ", "इ", "ई", "उ", "ऊ", "ए", "ऐ", "ओ", "औ", "अं", "अः"]
const DEVANAGARI_MATRAS = ["ा", "ि", "ी", "ु", "ू", "े", "ै", "ो", "ौ", "ं", "ः", "्"]

// Hindi consonants (standard set)
const HINDI_CONSONANTS = [
    "क", "ख", "ग", "घ", "ङ",
    "च", "छ", "ज", "झ", "ञ",
    "ट", "ठ", "ड", "ढ", "ण",
    "त", "थ", "द", "ध", "न",
    "प", "फ", "ब", "भ", "म",
    "य", "र", "ल", "व", "श",
    "ष", "स", "ह", "क्ष", "त्र", "ज्ञ"
]

// Marathi consonants (includes ळ which Hindi doesn't have)
const MARATHI_CONSONANTS = [
    "क", "ख", "ग", "घ", "ङ",
    "च", "छ", "ज", "झ", "ञ",
    "ट", "ठ", "ड", "ढ", "ण",
    "त", "थ", "द", "ध", "न",
    "प", "फ", "ब", "भ", "म",
    "य", "र", "ल", "व", "श",
    "ष", "स", "ह", "ळ", "क्ष", "ज्ञ"
]

// Language-specific suggestions
const HINDI_SUGGESTIONS = [
    "आज मंडी भाव",
    "मौसम की जानकारी",
    "गेहूं की खेती कैसे करें?",
    "फसल बीमा योजना",
    "खाद की कीमत",
    "कीट नियंत्रण उपाय",
    "सिंचाई का समय"
]

const MARATHI_SUGGESTIONS = [
    "कांदा बाजार भाव",
    "आजचे हवामान",
    "गव्हाची लागवड कशी करावी?",
    "पीक विमा योजना",
    "माझा सातबारा उतारा",
    "खतांची किंमत",
    "कीड नियंत्रण उपाय"
]

// ============================================================
// Suggestions Component (persistent bar above input)
// ============================================================
interface DevanagariSuggestionsProps {
    language: "hi" | "mr"
    onSuggestionClick: (suggestion: string) => void
    onClose?: () => void
}

export const DevanagariSuggestions: React.FC<DevanagariSuggestionsProps> = ({
    language,
    onSuggestionClick,
    onClose
}) => {
    const suggestions = language === "hi" ? HINDI_SUGGESTIONS : MARATHI_SUGGESTIONS
    const label = language === "hi" ? "सुझाव (Suggestions)" : "सूचना (Suggestions)"

    return (
        <div className="px-4 py-2 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 rounded-t-xl overflow-hidden">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mr-2 flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
            </div>

            <ScrollArea className="flex-1 whitespace-nowrap">
                <div className="flex items-center gap-2 pb-2">
                    {suggestions.map((suggestion, i) => (
                        <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="h-7 px-3 text-[11px] font-medium border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-full transition-all"
                            onClick={() => onSuggestionClick(suggestion)}
                        >
                            {suggestion}
                        </Button>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" className="h-1" />
            </ScrollArea>

            {onClose && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-2"
                >
                    <X className="w-4 h-4" />
                </Button>
            )}
        </div>
    )
}

// Keep old names as aliases for backward compatibility
export const MarathiSuggestions = DevanagariSuggestions

// ============================================================
// Keyboard Keys Component (toggleable virtual keyboard)
// ============================================================
interface DevanagariKeysProps {
    language: "hi" | "mr"
    onKeyClick: (char: string) => void
    onBackspace: () => void
}

export const DevanagariKeys: React.FC<DevanagariKeysProps> = ({
    language,
    onKeyClick,
    onBackspace
}) => {
    const consonants = language === "hi" ? HINDI_CONSONANTS : MARATHI_CONSONANTS

    return (
        <div className="p-4 flex flex-col gap-4 max-h-[300px] overflow-y-auto bg-white dark:bg-gray-900 border-t border-slate-200 dark:border-slate-800 shadow-xl rounded-b-xl">
            {/* Vowels */}
            <div className="flex flex-wrap gap-1.5">
                {DEVANAGARI_VOWELS.map((char) => (
                    <KeyButton key={char} char={char} onClick={onKeyClick} />
                ))}
            </div>

            {/* Matras */}
            <div className="flex flex-wrap gap-1.5">
                {DEVANAGARI_MATRAS.map((char) => (
                    <KeyButton key={char} char={char} onClick={onKeyClick} isMatra />
                ))}
                <Button
                    variant="outline"
                    size="sm"
                    className="h-10 w-16 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    onClick={() => onKeyClick(" ")}
                >
                    Space
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-10 w-16 text-xs bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 text-red-600"
                    onClick={onBackspace}
                >
                    <Delete className="w-4 h-4 mr-1" />
                    Del
                </Button>
            </div>

            {/* Consonants */}
            <div className="flex flex-wrap gap-1.5">
                {consonants.map((char) => (
                    <KeyButton key={char} char={char} onClick={onKeyClick} isConsonant />
                ))}
            </div>
        </div>
    )
}

// Keep old name as alias for backward compatibility
export const MarathiKeys = DevanagariKeys

// ============================================================
// Key Button Component
// ============================================================
const KeyButton = ({
    char,
    onClick,
    isMatra = false,
    isConsonant = false
}: {
    char: string,
    onClick: (char: string) => void,
    isMatra?: boolean,
    isConsonant?: boolean
}) => (
    <Button
        variant="outline"
        className={`
      h-10 min-w-[40px] px-2 text-lg font-medium transition-all transform active:scale-95
      ${isMatra ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 text-amber-700" : ""}
      ${isConsonant ? "hover:bg-slate-50 dark:hover:bg-slate-800" : ""}
      ${!isMatra && !isConsonant ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 text-blue-700" : ""}
    `}
        onClick={() => onClick(char)}
    >
        {char}
    </Button>
)
