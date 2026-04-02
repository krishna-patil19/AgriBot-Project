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
    getWavAudioFile: (filename?: string) => Promise<File | null>
    hasPermission: boolean
    requestPermission: () => Promise<boolean>
}

// Client-side WebM to WAV Transcoding Utilities
function createWaveFileData(audioBuffer: AudioBuffer): ArrayBuffer {
    const numOfChan = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let offset = 0, pos = 0;

    // write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16);         // length = 16
    setUint16(1);          // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(sampleRate);
    setUint32(sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16);         // 16-bit
    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length
    
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        channels.push(audioBuffer.getChannelData(i));
    }
    
    // write interleaved PCM data
    while (pos < length) {
        for (let i = 0; i < numOfChan; i++) {
             let sample = Math.max(-1, Math.min(1, channels[i][offset])); 
             sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
             view.setInt16(pos, sample, true); 
             pos += 2;
        }
        offset++; 
    }
    
    function setUint16(data: number) { view.setUint16(pos, data, true); pos += 2; }
    function setUint32(data: number) { view.setUint32(pos, data, true); pos += 4; }
    
    return buffer;
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

    // Convert deeply incompatible browser `.webm` into uncompressed `.wav` for APIs like Sarvam
    const getWavAudioFile = useCallback(async (filename = "recording.wav") => {
        const originalBlob = getAudioBlob()
        if (!originalBlob) return null

        try {
            const arrayBuffer = await originalBlob.arrayBuffer();
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            const wavBuffer = createWaveFileData(audioBuffer);
            const wavBlob = new Blob([wavBuffer], { type: "audio/wav" });
            return new File([wavBlob], filename, { type: "audio/wav" })
        } catch(e) {
            console.error("Transcoding to WAV failed, returning fallback WebM", e)
            return new File([originalBlob], "recording.webm", { type: originalBlob.type })
        }
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
        getWavAudioFile,
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
        getWavAudioFile,
        hasPermission,
        requestPermission
    ])
}
