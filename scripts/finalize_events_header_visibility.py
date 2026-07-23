from pathlib import Path

path = Path("src/App.jsx")
source = path.read_text()
replacements = [
    ("  visible={showMiniHeader}\n", "  visible={isOverviewTab&&showMiniHeader}\n", "mini header visibility"),
    ('padding:`${showMiniHeader?"74px":"12px"} 16px 104px`', 'padding:`${isOverviewTab&&showMiniHeader?"74px":"12px"} 16px 104px`', "content spacing"),
]
for old, new, label in replacements:
    if new in source:
        print(f"{label}: already applied")
        continue
    count = source.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    source = source.replace(old, new, 1)
    print(f"{label}: applied")
path.write_text(source)
