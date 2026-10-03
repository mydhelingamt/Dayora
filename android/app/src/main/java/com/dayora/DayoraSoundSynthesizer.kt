package com.dayora

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.util.Log
import kotlin.math.exp
import kotlin.math.sin

/**
 * Lightweight, zero-asset native sound synthesizer that plays the classic
 * "Happy Birthday" melody in a warm music box / celesta timbre using AudioTrack.
 */
object DayoraSoundSynthesizer {
    private const val TAG = "DayoraSoundSynth"
    private const val SAMPLE_RATE = 44100

    @Volatile
    private var isPlaying = false
    private var currentThread: Thread? = null

    // Classic Happy Birthday melody in Hz:
    // "Happy Birthday to you, Happy Birthday to you, Happy Birthday dear [Name], Happy Birthday to you!"
    private val NOTES = listOf(
        // "Hap-py Birth-day to you"
        Pair(392.00, 350), // G4
        Pair(392.00, 350), // G4
        Pair(440.00, 700), // A4
        Pair(392.00, 700), // G4
        Pair(523.25, 700), // C5
        Pair(493.88, 1200), // B4

        // "Hap-py Birth-day to you"
        Pair(392.00, 350), // G4
        Pair(392.00, 350), // G4
        Pair(440.00, 700), // A4
        Pair(392.00, 700), // G4
        Pair(587.33, 700), // D5
        Pair(523.25, 1200), // C5

        // "Hap-py Birth-day dear friend"
        Pair(392.00, 350), // G4
        Pair(392.00, 350), // G4
        Pair(783.99, 700), // G5
        Pair(659.25, 700), // E5
        Pair(523.25, 700), // C5
        Pair(493.88, 700), // B4
        Pair(440.00, 1000), // A4

        // "Hap-py Birth-day to you"
        Pair(698.46, 350), // F5
        Pair(698.46, 350), // F5
        Pair(659.25, 700), // E5
        Pair(523.25, 700), // C5
        Pair(587.33, 700), // D5
        Pair(523.25, 1400) // C5
    )

    fun play() {
        stop()
        isPlaying = true

        currentThread = Thread {
            var audioTrack: AudioTrack? = null
            try {
                val minBufferSize = AudioTrack.getMinBufferSize(
                    SAMPLE_RATE,
                    AudioFormat.CHANNEL_OUT_MONO,
                    AudioFormat.ENCODING_PCM_16BIT
                )

                audioTrack = AudioTrack.Builder()
                    .setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_MEDIA)
                            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                            .build()
                    )
                    .setAudioFormat(
                        AudioFormat.Builder()
                            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                            .setSampleRate(SAMPLE_RATE)
                            .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                            .build()
                    )
                    .setBufferSizeInBytes(minBufferSize.coerceAtLeast(SAMPLE_RATE * 2))
                    .setTransferMode(AudioTrack.MODE_STREAM)
                    .build()

                audioTrack.play()

                for (note in NOTES) {
                    if (!isPlaying) break

                    val freq = note.first
                    val durationMs = note.second
                    val sampleCount = (SAMPLE_RATE * (durationMs / 1000.0)).toInt()
                    val pcmBuffer = ShortArray(sampleCount)

                    // Generate a gentle sine tone with bell/chime harmonics and exponential decay envelope
                    for (i in 0 until sampleCount) {
                        val t = i.toDouble() / SAMPLE_RATE
                        val env = exp(-3.5 * (i.toDouble() / sampleCount)) // Music box decay envelope

                        // Fundamental + gentle octave overtone
                        val sample1 = sin(2.0 * Math.PI * freq * t)
                        val sample2 = 0.3 * sin(2.0 * Math.PI * (freq * 2.0) * t)
                        val sample3 = 0.15 * sin(2.0 * Math.PI * (freq * 3.0) * t)

                        val value = ((sample1 + sample2 + sample3) * env * 22000.0).toInt()
                        pcmBuffer[i] = value.coerceIn(-32768, 32767).toShort()
                    }

                    audioTrack.write(pcmBuffer, 0, pcmBuffer.size)

                    // Small silence between notes (50ms)
                    val pauseSamples = (SAMPLE_RATE * 0.05).toInt()
                    val pauseBuffer = ShortArray(pauseSamples)
                    audioTrack.write(pauseBuffer, 0, pauseBuffer.size)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error playing synthesized birthday melody", e)
            } finally {
                try {
                    audioTrack?.stop()
                    audioTrack?.release()
                } catch (ignored: Exception) {}
                isPlaying = false
            }
        }.apply {
            isDaemon = true
            start()
        }
    }

    fun stop() {
        isPlaying = false
        currentThread?.interrupt()
        currentThread = null
    }
}
