# UI Overhaul Plan — RAG Doc Q&A v2

## UX Assessment (applying ux-sensei framework)

### What Works Well
- Clear header explains the RAG pipeline flow
- Two-section card layout logically separates Upload and Ask
- Score color coding (green/amber/red) provides instant relevance feedback
- Fixed cost badge with hover tooltip is useful for transparency
- Empty state guides first-time users
- Loading spinner provides operation feedback

### Issues to Address
1. **Generic color palette**: Current indigo (#6366f1) is Tailwind default — no visual identity
2. **Flat visual hierarchy**: Cards lack depth, no background texture or gradient
3. **Basic file upload**: Dashed border button feels unfinished, no drag-and-drop
4. **Plain answer section**: Just a top-border separator, no visual distinction
5. **Cost badge is visually heavy**: Dark box in corner works but could be more elegant
6. **Missing micro-interactions**: No transitions on content appearing, no hover animations on cards
7. **Citations are flat**: Could use better visual distinction from chunks
8. **Score indicators**: Functional but could be more visually refined with background tints

### Color Palette: "Aurora Nebula" (Non-Generic)
A sophisticated dark theme with vibrant neon-aurora accents — fitting for an AI RAG tool.

| Role | Color | Hex |
|------|-------|-----|
| Background | Deep space navy | `#080c1a` |
| Card bg | Dark indigo | `#12162b` |
| Card border | Muted indigo | `#1e2345` |
| Card hover border | Aurora glow | `#4a3f78` |
| Primary accent gradient | Violet → Cyan | `#a78bfa` → `#67e8f9` |
| Button gradient | Deep violet → Blue | `#7c3aed` → `#3b82f6` |
| Button hover gradient | Darker violet → Blue | `#6d28d9` → `#2563eb` |
| Secondary accent | Teal | `#2dd4bf` |
| Warm accent | Rose/Pink | `#f472b6` |
| Text primary | Off-white | `#e2e8f0` |
| Text secondary | Muted lavender | `#9498c8` |
| Text muted | Dim lavender | `#5b5f85` |
| Input bg | Dark navy | `#0d1128` |
| Input border | Indigo | `#2a2d5a` |
| Input focus | Aurora cyan | `#67e8f9` |
| Score high | Emerald | `#34d399` |
| Score mid | Amber | `#fbbf24` |
| Score low | Rose | `#fb7185` |
| Shadow | Deep purple-black | `rgba(0,0,0,0.4)` |

### Design Direction
- **Dark immersive theme**: Space/navy background creates focus on content
- **Aurora glow accents**: Purple→Cyan gradient feels futuristic and AI-native
- **Glassmorphism cards**: Semi-transparent card backgrounds with backdrop blur
- **Gradient borders**: Buttons and active elements use animated gradients
- **Soft glow effects**: Box shadows with colored tint for depth
- **Refined typography**: Better hierarchy with subtle letter-spacing
- **Micro-interactions**: Smooth transitions on hover, fade-in on content load

## Implementation Tasks

### Task 1: Rewrite App.css with new theme
- Complete CSS overhaul with new color palette
- Glassmorphism card styles
- Gradient buttons with hover animations
- Refined file upload area (drop-zone style)
- Aurora score indicators with background tints
- Smooth transitions and keyframe animations
- Responsive refinements
- Better cost badge styling

### Task 2: Update App.js with UX improvements
- Add drag-and-drop file upload support
- Add fade-in animations for loaded content sections
- Improve empty state with visual icon
- Refine cost badge component layout
- Add clear visual states for sections
- No functionality changes — all existing API calls preserved
