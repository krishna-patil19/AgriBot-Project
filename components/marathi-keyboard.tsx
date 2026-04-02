"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { X, Sparkles, Delete, CornerDownLeft } from "lucide-react"

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
    "सिंचाई का समय",
    "मिट्टी की जांच",
    "धान की बुवाई",
    "सरकारी योजना",
    "बारिश",
    "खाद"
]

const MARATHI_SUGGESTIONS = [
    "कांदा बाजार भाव",
    "आजचे हवामान",
    "गव्हाची लागवड कशी करावी?",
    "पीक विमा योजना",
    "माझा सातबारा उतारा",
    "खतांची किंमत",
    "कीड नियंत्रण उपाय",
    "माती परीक्षण",
    "धानाची पेरणी",
    "सरकारी योजना",
    "पाऊस",
    "खत"
]

const ENGLISH_SUGGESTIONS = [
    "Mandi prices today",
    "Weather forecast",
    "How to grow wheat?",
    "Crop insurance scheme",
    "Fertilizer cost",
    "Pest control measures",
    "When to irrigate",
    "Soil testing",
    "Rice sowing",
    "Government schemes",
    "raining",
    "rainfall",
    "pesticide",
    "fertilizer"
]

// ============================================================
// Suggestions Component (persistent scrollable bar + input auto-complete)
// ============================================================
interface DevanagariSuggestionsProps {
    language: "en" | "hi" | "mr" | string
    onSuggestionClick: (suggestion: string) => void
    onClose?: () => void
    inputValue?: string
}

export const DevanagariSuggestions: React.FC<DevanagariSuggestionsProps> = ({
    language,
    onSuggestionClick,
    onClose,
    inputValue = ""
}) => {
    const allSuggestions = language === "hi" ? HINDI_SUGGESTIONS : language === "mr" ? MARATHI_SUGGESTIONS : ENGLISH_SUGGESTIONS
    const label = language === "hi" ? "सुझाव" : language === "mr" ? "सूचना" : "Suggestions"

    // Filter suggestions based on what user has typed (show all if empty)
    const filtered = inputValue.trim().length > 0
        ? allSuggestions.filter(s =>
            s.toLowerCase().includes(inputValue.trim().toLowerCase())
        )
        : allSuggestions

    const displaySuggestions = filtered.length > 0 ? filtered : allSuggestions

    return (
        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border-b border-slate-100 dark:border-slate-800 rounded-t-xl">
            {/* Typing auto-complete dropdown: show only when user is typing and matches exist */}
            {inputValue.trim().length > 0 && filtered.length > 0 && (
                <div className="px-4 pt-2 pb-1 flex items-center gap-2">
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider flex-shrink-0">
                        ↳ {language === "hi" ? "मिलते-जुलते" : language === "mr" ? "जुळणारे" : "Matches"}
                    </span>
                    <div
                        className="flex items-center gap-1.5 overflow-x-auto"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                        {filtered.map((suggestion, i) => (
                            <button
                                key={i}
                                onClick={() => onSuggestionClick(suggestion)}
                                className="flex-shrink-0 inline-flex items-center gap-1 h-6 px-2.5 text-[11px] font-semibold rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-sm"
                            >
                                <CornerDownLeft className="w-2.5 h-2.5" />
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Main scrollable suggestions row */}
            <div className="px-4 py-2 flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mr-1 flex-shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
                </div>

                {/* Scrollable pill row — uses native scroll + hidden scrollbar */}
                <div
                    className="flex-1 flex items-center gap-2 overflow-x-auto py-1 cursor-grab active:cursor-grabbing"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    onMouseDown={(e) => {
                        const el = e.currentTarget
                        const startX = e.pageX - el.offsetLeft
                        const scrollLeft = el.scrollLeft
                        const onMove = (ev: MouseEvent) => {
                            el.scrollLeft = scrollLeft - (ev.pageX - el.offsetLeft - startX)
                        }
                        const onUp = () => {
                            window.removeEventListener("mousemove", onMove)
                            window.removeEventListener("mouseup", onUp)
                        }
                        window.addEventListener("mousemove", onMove)
                        window.addEventListener("mouseup", onUp)
                    }}
                >
                    {displaySuggestions.map((suggestion, i) => (
                        <button
                            key={i}
                            onClick={() => onSuggestionClick(suggestion)}
                            className="flex-shrink-0 h-7 px-3 text-[11px] font-medium border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-full transition-all select-none"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>

                {onClose && (
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-1"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
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
                    {language === "hi" ? "स्पेस" : "स्पेस"}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-10 w-16 text-xs bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 text-red-600"
                    onClick={onBackspace}
                >
                    <Delete className="w-4 h-4 mr-1" />
                    {language === "hi" ? "मिटाएं" : "काढा"}
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
