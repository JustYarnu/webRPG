To generate sprites: composite individual transparent image layers dynamically using the HTML5 <canvas> API.
Instead of pre-rendering combinations, store only the raw layer components
Save only the "recipe" or seed of the generated sprite in localStorage. A character is just an array of IDs: [bodyId, eyesId, hairId].
If a user explicitly wants to download their avatar, call canvas.toDataURL("image/png") at the exact moment they click a "Download" button. (Scope creep much????)