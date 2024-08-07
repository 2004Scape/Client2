let waveGain;

export async function playWave(data, vol) {
    setWaveVolume(vol);

    try {
        const audioBuffer = await window.audioContext.decodeAudioData(Uint8Array.from(data).buffer);
        let bufferSource = window.audioContext.createBufferSource();
        bufferSource.buffer = audioBuffer;
        bufferSource.connect(waveGain);
        bufferSource.start();
    } catch (err) {
        console.log(err);
    }
}

export function setWaveVolume(vol) {
    if (!waveGain) {
        waveGain = window.audioContext.createGain();
        waveGain.connect(window.audioContext.destination);
    }

    waveGain.gain.value = vol / 256;
}

export function playMidi(data, vol, fade) {
    if (window._tinyMidiPlay) {
        window._tinyMidiPlay(data, vol / 256, fade);
    }
}

export function setMidiVolume(vol) {
    if (window._tinyMidiVolume) {
        window._tinyMidiVolume(vol / 256);
    }
}

export function stopMidi(fade) {
    if (window._tinyMidiStop) {
        window._tinyMidiStop(fade);
    }
}
