from pathlib import Path

path = Path("src/App.jsx")
text = path.read_text()
old = '.player-scroll-container{--player-scroll-bottom-padding:calc(var(--bottom-nav-content-padding, 156px) + 40px + env(safe-area-inset-bottom, 0px));}'
new = '.player-scroll-container{--player-scroll-bottom-padding:calc(var(--bottom-nav-content-padding, 88px) + 24px + env(safe-area-inset-bottom, 0px));}'
if old in text:
    text = text.replace(old, new, 1)
elif text.count(new) < 2:
    raise SystemExit("narrow mobile navigation padding marker missing")
path.write_text(text)
print("narrow mobile navigation padding normalized")
