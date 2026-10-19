# Parallax Cam

**Turn flat images into a moving 3D-style camera shot, right in your browser.**

Parallax Cam is a free, lightweight video tool. You stack image layers at different depths (for example a background, a person and some flowers in front), place a virtual camera, add depth-of-field blur, set keyframes on a timeline, and export an MP4. It is the same idea as the 3D camera layer in Adobe After Effects, but simple enough to use on a phone.

Everything runs on the visitor's own device. There is no server, no account and no upload.

---

## What it does

- **Layers:** add as many images as you like. Each layer has its own depth, size, tilt and position. Reorder layers, rename them, and mark a layer as a background that fills the frame.
- **Camera:** move forward and back, left and right, up and down. Roll (lean sideways) and tilt (look up or down). Closer layers move more than distant ones, which creates the parallax effect.
- **Depth-of-field blur:** set a focus distance like a real lens. Layers away from the focus blur smoothly, and the blur changes as the camera moves. Blur amount can be keyframed or switched off.
- **Keyframes and easing:** key any camera or layer setting at any time. Choose Smooth, Linear, Ease in, Ease out, Overshoot, Hold, or draw your own custom curve. Add, remove, drag or nudge keyframes. Auto-key records your changes for you.
- **Background removal:** tap-to-remove for plain backgrounds, and an AI cut-out for people (needs internet the first time).
- **3D from one photo (AI):** splits a single photo into front, middle and back layers using an estimated depth map.
- **Camera view:** a top-down view that shows where the camera and each layer sit. Drag them directly.
- **Export:** MP4 video in 9:16, 1:1, 4:5 or 16:9 at 540p, 720p or 1080p.
- **Projects:** autosave in the browser, plus Save and Open as a file. Reset buttons for the camera, a layer, or everything.

---

## How to use it

1. **Add layers.** Open the *Scene* tab and tap **+ New layer**, then **Choose image**. Add your background first, then the layers in front of it. Tick **Fill the frame** on the background.
2. **Clean up images (optional).** Select a layer and tap **Remove background (tap)** to tap the area you want to remove, or **AI cut-out** for a person.
3. **Arrange the scene.**
   - Tap a layer in the preview to select it. Drag it to move it. Drag a white corner to resize it. Drag the round handle to rotate it. (Two-finger pinch and twist also work. On a laptop the mouse wheel resizes.)
   - In the *Camera view* (top-down), drag the camera, drag a layer's bar to change its depth, and drag the orange dot to set the focus distance.
4. **Set the camera.** Select *Camera* in the list and use the sliders. Move the focus distance to choose what is sharp.
5. **Animate.** Put the time slider at the start and tap **◆+** to keyframe everything. Move the slider to another time (set the length in the *Timeline* tab, up to 300 seconds), change the camera and layers, and tap **◆+** again. Everything glides between the two. Or switch on **● Auto** and just move things.
6. **Fine-tune.** In the *Timeline* tab, tap a ◆ to change its easing or time, or draw a custom curve. **◆−** removes the keys at the current time. **Remove all keyframes** clears everything.
7. **Choose the shape and clarity** in the *Setup* tab (frame ratio and 540p / 720p / 1080p).
8. **Export.** Tap **Export**, keep the tab open until it finishes, then tap **Save video**.

**Tips**
- Use PNG images with transparent backgrounds for the middle and front layers.
- Keep the camera movement small for a natural look, and give the background extra size so its edges never show.
- Save a project file before closing if you want to keep it on another device.

---

## What the tool uses on your device

Parallax Cam runs entirely in your browser. When someone opens the page, their own phone or computer does all the work. The server that hosts the files (for example GitHub Pages) only sends the page and does no processing.

| Resource | What uses it | Notes |
| --- | --- | --- |
| **Memory (RAM)** | Every image is held decoded in memory. | Roughly width x height x 4 bytes per image: a 12-megapixel photo is about 48 MB. Browsers without native canvas blur (notably Safari on iPhone) also keep a few small blurred copies per layer, a few MB each. A 60-second export is held in memory until you save it, roughly 30 to 70 MB depending on clarity. The AI features can use a few hundred MB while they run. |
| **CPU** | Blur preparation on some browsers, tap background removal, saving projects, and the AI models. | The AI models run on the processor, so they can take several seconds to a minute, longer on a phone. |
| **Graphics chip (GPU)** | Drawing the preview and, in most browsers, the blur. | Done by the browser automatically. |
| **Video encoder** | MP4 export. | Uses the device's built-in video encoder when available. Export renders frame by frame, so it does not depend on how fast you play it back. |
| **Storage** | Autosave and settings. | Your project (including images) is saved in the browser's IndexedDB so it survives a refresh. Panel sizes use localStorage. The AI models are cached by the browser after the first download. Clearing site data removes all of this. |
| **Network** | Loading the page, plus first-time AI downloads. | The MP4 library loads from a CDN when the page opens. The AI libraries and models (tens of megabytes) download the first time you use an AI feature, then are cached. Your images are never uploaded. |
| **Battery and heat** | Exporting and AI work. | Both are demanding. On a phone, plug in for long exports. |

### Laptop or desktop
- Has the most memory and processing power, so previews are smoother, exports are faster and Full HD (1080p) is practical.
- The layout switches to settings on the left, a large preview in the middle, the camera view on the right and the timeline along the bottom. You can drag the dividers to resize every panel.
- The video shape is whatever you pick in *Setup* (9:16 by default). It does not depend on the screen, so on a wide screen a tall video simply sits centred with empty space on each side.

### Phone or tablet
- Works well at Standard (540p) or HD (720p). Use Full HD only for short clips.
- Keep to about 10 layers and, ideally, videos under a minute.
- The layout is a pinned preview with tabs below. Drag the grey bar between the preview and the tabs to change the preview size.
- Keep the screen on and the tab open while exporting.

---

## Browser support

- **Best:** current Chrome and Edge (desktop and Android).
- **Good:** Safari 16.4 or later (Mac and iPhone), and recent Firefox.
- Fast MP4 export needs the browser's WebCodecs feature. If it is missing, the tool falls back to real-time recording, which can be choppy on slow devices and may produce WebM instead of MP4.


---

## Limits and notes

- This is a 2.5D effect: flat layers at different depths, not a real 3D scene. Moving the camera too far can reveal empty edges. Make the background larger or keep the move small.
- The tap background remover works best on plain backgrounds. Use the AI cut-out for busy photos of people.
- The AI features need internet access the first time and can be slow on phones.
- Blur is an approximation of a real lens, designed to look smooth rather than to be physically exact.
- Very large images use a lot of memory. Resize photos to about 2000 pixels on the long side if a phone struggles.

## Privacy

There are no accounts, analytics or uploads. Your images and projects stay in your browser. The only network requests are for the page itself, the MP4 library, and the AI libraries and models when you use those features.

## Third-party components

- [mp4-muxer](https://github.com/Vanilagy/mp4-muxer) for writing MP4 files.
- [Transformers.js](https://github.com/huggingface/transformers.js) to run the AI models in the browser, with the `Xenova/modnet` (person cut-out) and `Xenova/depth-anything-small-hf` (depth estimate) models from Hugging Face.

Check each component's licence before using this commercially, and add a `LICENSE` file of your choice for this project.
