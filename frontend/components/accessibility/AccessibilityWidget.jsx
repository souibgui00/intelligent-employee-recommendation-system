// Accessibility System v1.1 - Optimized for Focus Mode and Screen Reading
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import {
    PersonStanding,
    X,
    Type,
    Contrast,
    Eye,
    AlignLeft,
    Move,
    ZapOff,
    ScanLine,
    Space,
    RotateCcw,
    Volume2,
    MousePointer2,
    Link as LinkIcon,
    Baseline,
    Target,
} from "lucide-react"
import {
    applyAccessibilitySettings,
    saveAccessibilitySettings,
    hasAnyAccessibilitySetting,
    loadAccessibilitySettings,
    defaultAccessibilitySettings,
    FONT_LABELS,
} from "@/components/accessibility/accessibility-settings"

export function AccessibilityWidget() {
    const [open, setOpen] = useState(false)
    const [settings, setSettings] = useState(() => loadAccessibilitySettings())
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
    const panelRef = useRef(null)
    const toggleRef = useRef(null)
    const restoreFocusRef = useRef(null)
    const speechRef = useRef(null)

    useEffect(() => {
        applyAccessibilitySettings(settings)
        saveAccessibilitySettings(settings)
    }, [settings])

    useEffect(() => {
        const onStorage = (event) => {
            if (event.key === "skillmatch_a11y") {
                setSettings(loadAccessibilitySettings())
            }
        }
        window.addEventListener("storage", onStorage)
        return () => window.removeEventListener("storage", onStorage)
    }, [])

    // Global Mouse Tracking for Reading Guide and Focus Mask
    useEffect(() => {
        if (!settings.readingGuide && !settings.focusMask) return
        const handler = (e) => {
            requestAnimationFrame(() => {
                setMousePos({ x: e.clientX, y: e.clientY })
            })
        }
        window.addEventListener("mousemove", handler)
        return () => window.removeEventListener("mousemove", handler)
    }, [settings.readingGuide, settings.focusMask])

    // Screen Reader (Hover Read) Logic
    useEffect(() => {
        if (!settings.hoverRead) {
            window.speechSynthesis?.cancel()
            return
        }

        const handleHover = (e) => {
            const target = e.target
            let text = target.innerText || target.getAttribute("aria-label") || target.alt
            
            if (text && text.length > 0) {
                // Clean text: strip special characters and symbols for smoother reading
                const cleanedText = text.replace(/[:/?;!@#$%^&*()_+={}\[\]|\\<>,.~`]/g, " ").trim()
                
                if (cleanedText && cleanedText !== speechRef.current) {
                    window.speechSynthesis?.cancel()
                    const utterance = new SpeechSynthesisUtterance(cleanedText)
                    utterance.lang = "en-US"
                    utterance.rate = 1.0
                    utterance.pitch = 1.0
                    window.speechSynthesis?.speak(utterance)
                    speechRef.current = cleanedText
                }
            }
        }

        const handleLeave = () => {
            window.speechSynthesis?.cancel()
            speechRef.current = null
        }

        document.addEventListener("mouseover", handleHover)
        document.addEventListener("mouseleave", handleLeave)
        return () => {
            document.removeEventListener("mouseover", handleHover)
            document.removeEventListener("mouseleave", handleLeave)
            window.speechSynthesis?.cancel()
        }
    }, [settings.hoverRead])

    useEffect(() => {
        if (!open) return
        restoreFocusRef.current = document.activeElement

        const focusPanel = window.requestAnimationFrame(() => {
            panelRef.current?.focus()
        })

        const handler = (event) => {
            if (event.key === "Escape") {
                event.preventDefault()
                setOpen(false)
            }
        }

        const handlePointerDown = (event) => {
            const target = event.target
            if (
                panelRef.current?.contains(target) ||
                toggleRef.current?.contains(target)
            ) {
                return
            }
            setOpen(false)
        }

        document.addEventListener("keydown", handler)
        document.addEventListener("pointerdown", handlePointerDown)
        return () => {
            window.cancelAnimationFrame(focusPanel)
            document.removeEventListener("keydown", handler)
            document.removeEventListener("pointerdown", handlePointerDown)
        }
    }, [open])

    useEffect(() => {
        if (open) return
        restoreFocusRef.current?.focus?.()
    }, [open])

    const update = (key, value) => setSettings((current) => ({ ...current, [key]: value }))
    const toggle = (key) => update(key, !settings[key])
    const reset = () => setSettings(defaultAccessibilitySettings)

    const hasAnyActive = hasAnyAccessibilitySetting(settings)

    return (
        <>
            {/* Focus Mask (Cognitive Accessibility) */}
            {settings.focusMask && (
                <div 
                    className="a11y-focus-mask-overlay" 
                    style={{ 
                        clipPath: `circle(150px at ${mousePos.x}px ${mousePos.y}px)`
                    }}
                />
            )}

            {settings.readingGuide && (
                <div
                    className="a11y-reading-guide-line"
                    style={{ top: mousePos.y - 15 }}
                />
            )}

            <button
                ref={toggleRef}
                onClick={() => setOpen((current) => !current)}
                aria-label={open ? "Close accessibility settings" : "Open accessibility settings"}
                aria-controls="accessibility-panel"
                aria-expanded={open}
                className={cn(
                    "a11y-widget-fixed-btn group transition-all duration-500",
                    open
                        ? "bg-[#F28C1B] rotate-180 shadow-[0_0_30px_rgba(242,140,27,0.5)]"
                        : "bg-[#222222] hover:bg-[#F28C1B] shadow-[0_10px_30px_rgba(34,34,34,0.3)] hover:shadow-[0_10px_30px_rgba(242,140,27,0.4)]"
                )}
            >
                {open
                    ? <X className="w-6 h-6 text-white" />
                    : <PersonStanding className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                }
                {hasAnyActive && !open && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#F28C1B] rounded-full border-[3px] border-white animate-bounce shadow-md" />
                )}
            </button>

            <div
                ref={panelRef}
                id="accessibility-panel"
                role="dialog"
                aria-modal="true"
                aria-label="Accessibility settings"
                tabIndex={-1}
                className={cn(
                    "a11y-widget-panel fixed right-8 z-[9997] w-96 bg-white/95 backdrop-blur-xl border border-[#EEEEEE] rounded-3xl shadow-[0_30px_100px_rgba(0,0,0,0.15)] overflow-hidden transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1)",
                    open
                        ? "opacity-100 translate-y-0 pointer-events-auto scale-100"
                        : "opacity-0 translate-y-12 pointer-events-none scale-95"
                )}
                style={{ bottom: "7rem" }}
            >
                {/* Header */}
                <div className="bg-[#222222] px-8 py-8 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#F28C1B]/10 rounded-full blur-3xl -mr-16 -mt-16" />
                    <div className="relative z-10">
                        <p className="text-[10px] font-bold text-[#F28C1B] uppercase tracking-[0.3em] mb-1">Assistive Interface</p>
                        <h2 className="text-2xl font-black font-display text-white tracking-tight">
                            Accessibility
                        </h2>
                    </div>
                    <button
                        onClick={reset}
                        title="Reset all settings"
                        className="relative z-10 flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-gray-300 tracking-widest hover:bg-[#F28C1B] hover:text-white transition-all"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        RESET
                    </button>
                </div>

                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar bg-gray-50/30">
                    {/* Text Size Control */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#F28C1B]/10 flex items-center justify-center">
                                    <Type className="w-4 h-4 text-[#F28C1B]" />
                                </div>
                                <span className="text-xs font-bold text-[#222222] tracking-wide">
                                    Text Size
                                </span>
                            </div>
                            <span className="text-[10px] font-black text-[#F28C1B] px-2 py-1 bg-[#F28C1B]/10 rounded-md">
                                {FONT_LABELS[settings.fontSize + 1]}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => update("fontSize", Math.max(-1, settings.fontSize - 1))}
                                disabled={settings.fontSize <= -1}
                                className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 text-[#222222] font-black text-lg flex items-center justify-center hover:bg-white hover:border-[#F28C1B] hover:text-[#F28C1B] transition-all disabled:opacity-20"
                                aria-label="Decrease text size"
                            >−</button>
                            
                            <div className="flex-1 flex gap-1.5 h-3">
                                {FONT_LABELS.map((label, i) => (
                                    <button
                                        key={i}
                                        onClick={() => update("fontSize", i - 1)}
                                        className={cn(
                                            "flex-1 rounded-full transition-all duration-300",
                                            i <= settings.fontSize + 1
                                                ? "bg-[#F28C1B] shadow-[0_0_10px_rgba(242,140,27,0.3)]"
                                                : "bg-gray-200 hover:bg-gray-300"
                                        )}
                                        aria-label={`Set text size to ${label}`}
                                    />
                                ))}
                            </div>
                            
                            <button
                                onClick={() => update("fontSize", Math.min(3, settings.fontSize + 1))}
                                disabled={settings.fontSize >= 3}
                                className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 text-[#222222] font-black text-lg flex items-center justify-center hover:bg-white hover:border-[#F28C1B] hover:text-[#F28C1B] transition-all disabled:opacity-20"
                                aria-label="Increase text size"
                            >+</button>
                        </div>
                    </div>

                    {/* Feature Toggles */}
                    <div className="grid gap-3">
                        {[
                            {
                                key: "highContrast",
                                icon: Contrast,
                                label: "High Contrast",
                                desc: "Sharp visibility for low vision",
                            },
                            {
                                key: "focusMask",
                                icon: Target,
                                label: "Focus Mode",
                                desc: "Highlight area around cursor",
                            },
                            {
                                key: "hoverRead",
                                icon: Volume2,
                                label: "Screen Reader",
                                desc: "Read text aloud on hover",
                            },
                            {
                                key: "highlightLinks",
                                icon: LinkIcon,
                                label: "Highlight Links",
                                desc: "Emphasize all clickable items",
                            },
                            {
                                key: "largeCursor",
                                icon: MousePointer2,
                                label: "Large Cursor",
                                desc: "High visibility mouse pointer",
                            },
                            {
                                key: "lineHeight",
                                icon: Baseline,
                                label: "Line Spacing",
                                desc: "Expand vertical text rhythm",
                            },
                            {
                                key: "dyslexicFont",
                                icon: AlignLeft,
                                label: "Dyslexia Font",
                                desc: "Easier reading typeface",
                            },
                            {
                                key: "readingGuide",
                                icon: ScanLine,
                                label: "Reading Guide",
                                desc: "Visual line focus tracker",
                            },
                            {
                                key: "grayscale",
                                icon: Eye,
                                label: "Grayscale",
                                desc: "Remove all color saturation",
                            },
                            {
                                key: "reduceMotion",
                                icon: ZapOff,
                                label: "Reduce Motion",
                                desc: "Stop all UI animations",
                            },
                            {
                                key: "focusHighlight",
                                icon: Move,
                                label: "Focus Rings",
                                desc: "Emphasize active elements",
                            },
                            {
                                key: "letterSpacing",
                                icon: Space,
                                label: "Text Spacing",
                                desc: "Expand word separation",
                            },
                        ].map(({ key, icon: Icon, label, desc }) => {
                            const active = settings[key]
                            return (
                                <button
                                    key={key}
                                    onClick={() => toggle(key)}
                                    className={cn(
                                        "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 group",
                                        active
                                            ? "bg-[#222222] border-[#222222] shadow-md scale-[1.02]"
                                            : "bg-white border-gray-100 hover:border-[#F28C1B]/30 hover:shadow-sm"
                                    )}
                                    aria-pressed={active}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
                                        active 
                                            ? "bg-[#F28C1B] rotate-6" 
                                            : "bg-gray-50 group-hover:bg-[#F28C1B]/10"
                                    )}>
                                        <Icon className={cn("w-5 h-5", active ? "text-white" : "text-[#222222]")} />
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <p className={cn(
                                            "text-xs font-black font-display tracking-tight mb-0.5",
                                            active ? "text-white" : "text-[#222222]"
                                        )}>
                                            {label}
                                        </p>
                                        <p className="text-[10px] font-medium text-gray-400">
                                            {desc}
                                        </p>
                                    </div>
                                    
                                    {/* Premium Switch UI */}
                                    <div className={cn(
                                        "w-10 h-5 rounded-full relative transition-all duration-500",
                                        active ? "bg-[#F28C1B]" : "bg-gray-200"
                                    )}>
                                        <div className={cn(
                                            "absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-500 shadow-sm",
                                            active ? "left-6" : "left-1"
                                        )} />
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-gray-100 bg-white/50">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            WCAG 2.1 AAA Ready
                        </p>
                    </div>
                    <p className="text-[9px] text-gray-400 text-center">
                        Auto-applied to your current session
                    </p>
                </div>
            </div>
        </>
    )
}


