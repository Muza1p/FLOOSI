export type FeedbackSound = 'success' | 'halfway' | 'empty'

let audioContext: AudioContext | null = null

function getAudioContext() {
  const AudioContextClass = window.AudioContext
  if (!AudioContextClass) return null

  if (!audioContext) audioContext = new AudioContextClass()
  if (audioContext.state === 'suspended') void audioContext.resume()

  return audioContext
}

export function playFeedbackSound(type: FeedbackSound) {
  try {
    const context = getAudioContext()
    if (!context) return

    const patterns: Record<FeedbackSound, number[]> = {
      success: [523.25, 659.25, 783.99],
      halfway: [659.25, 783.99, 987.77],
      empty: [392, 329.63, 261.63],
    }

    const notes = patterns[type]
    const start = context.currentTime

    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const noteStart = start + index * 0.13

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency, noteStart)

      gain.gain.setValueAtTime(0.0001, noteStart)
      gain.gain.exponentialRampToValueAtTime(0.12, noteStart + 0.025)
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.19)

      oscillator.connect(gain)
      gain.connect(context.destination)

      oscillator.start(noteStart)
      oscillator.stop(noteStart + 0.2)
    })

    if (type !== 'success' && 'vibrate' in navigator) {
      navigator.vibrate(type === 'halfway' ? [45, 35, 45] : [100])
    }
  } catch {
    // Audio is optional; the app continues normally if unavailable.
  }
}
