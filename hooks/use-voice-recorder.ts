"use client"

import { useState, useRef, useCallback, useMemo } from "react"

export interface VoiceRecorderHook {
    isRecording: boolean
    isPaused: boolean
    recordingTime: number
    startRecording: () => Promise<void>
    stopRecording: () => void
    pauseRecording: () => void
    resumeRecording: () => void
    getAudioBlob: () => Blob | null
    getAudioFile: (filename?: string) => File | null
    hasPermission: boolean
    requestPermission: () => Promise<boolean>
}

export function useVoiceRecorder(): VoiceRecorderHook {
    const [isRecording, setIsRecording] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [hasPermission, setHasPermission] = useState(false)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const requestPermission = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            setHasPermission(true)
            stream.getTracks().forEach(track => track.stop())
            return true
        } catch (error) {
            console.error("Microphone permission denied:", error)
            setHasPermission(false)
            return false
        }
    }, [])

    const startRecording = useCallback(async () => {
        if (!hasPermission) {
            const granted = await requestPermission()
            if (!granted) return
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

            // Use standard webm if available, or whatever the browser supports
            const options = { mimeType: "audio/webm;codecs=opus" }
            const mimeType = MediaRecorder.isTypeSupported(options.mimeType)
                ? options.mimeType
                : "audio/ogg;codecs=opus"

            const mediaRecorder = new MediaRecorder(stream, { mimeType })
            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorder.onstop = () => {
                setIsRecording(false)
                setIsPaused(false)
                if (timerRef.current) {
                    clearInterval(timerRef.current)
                    timerRef.current = null
                }
            }

            mediaRecorder.start()
            setIsRecording(true)
            setIsPaused(false)
            setRecordingTime(0)

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)
        } catch (error) {
            console.error("Failed to start recording:", error)
        }
    }, [hasPermission, requestPermission])

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop()
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
        }
    }, [])

    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.pause()
            setIsPaused(true)
            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }
        }
    }, [])

    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
            mediaRecorderRef.current.resume()
            setIsPaused(false)
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)
        }
    }, [])

    const getAudioBlob = useCallback(() => {
        if (audioChunksRef.current.length === 0) return null
        return new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType || "audio/webm" })
    }, [])

    const getAudioFile = useCallback((filename = "recording.webm") => {
        const blob = getAudioBlob()
        if (!blob) return null
        return new File([blob], filename, { type: blob.type })
    }, [getAudioBlob])

    return useMemo(() => ({
        isRecording,
        isPaused,
        recordingTime,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        getAudioBlob,
        getAudioFile,
        hasPermission,
        requestPermission
    }), [
        isRecording,
        isPaused,
        recordingTime,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        getAudioBlob,
        getAudioFile,
        hasPermission,
        requestPermission
    ])
}
