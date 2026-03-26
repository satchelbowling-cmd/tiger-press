# Tiger Press Upgrade Specification

## Color Scheme: Garnet & Gold (HSC Hampden-Sydney College)
- Primary Garnet: #8A2432 (HSL: 352 58% 34%)
- Garnet Dark: #6E1D28 (HSL: 352 57% 27%)
- Garnet Light: #A2535F (HSL: 352 32% 48%)
- Gold accent: #C5962C (HSL: 40 63% 47%)
- Gold hover: #B38427 (HSL: 40 63% 42%)
- Gold muted: #D4AB50 (HSL: 40 60% 57%)

### Light Mode Surfaces
- Background: #F7F5F2 (warm cream) HSL: 36 20% 96%
- Card: #FDFCFA HSL: 40 30% 98%
- Border: #E2DDD6 HSL: 36 12% 86%
- Sidebar bg: garnet #8A2432 dark navy-garnet: #3B1520 HSL: 340 42% 16%
- Sidebar text: #F5E6D8 HSL: 28 55% 90%

### Dark Mode
- Background: #1A1412 HSL: 15 17% 8%
- Card: #221C19 HSL: 15 15% 12%
- Border: #3A3230 HSL: 10 6% 21%
- Primary garnet lighter in dark: #C45A68 HSL: 352 48% 56%

## Authentication System
- Login page at /login route
- User state stored in React context (not localStorage — sandboxed iframe)
- Editor-in-chief role gets admin badge and these exclusive privileges:
  - Can manage staff (add/remove/change roles)
  - Can delete articles
  - Can post announcements
  - Can change article status to "published"
  - Can see all section chats
  - Can pin messages
- Editors can: change article status (except publish), assign editors, proofread
- Writers can: submit articles, edit their own, view assignments
- All users can: use chat, view dashboard

## Article Upload Feature (Comprehensive)
New /upload route with:
- Drag-and-drop zone for .docx, .txt, .md files
- Or paste article text directly
- Rich metadata form:
  - Title (required)
  - Category selector (news, opinion, sports, arts, campus-life)
  - Priority (low, normal, high, urgent) — color-coded
  - Tags (comma-separated, stored as JSON)
  - Target issue (dropdown of upcoming issues)
  - Deadline picker
  - Author selector (for editors assigning on behalf of writers)
  - Notes field
- Word count auto-calculated
- Preview panel showing formatted content
- Submit creates the article with all metadata

## Communication System
New /messages route with:
### Section Group Chats
- One channel per section: News, Opinion, Sports, Arts, Campus Life
- Plus an "All Staff" channel
- Users see channels for their section + All Staff
- Editor-in-chief sees ALL channels
- Messages show sender name, avatar, timestamp
- Pin important messages (editors + EIC only)
- Auto-scroll to latest message

### Announcements
- Displayed at top of dashboard with priority badges
- Only editor-in-chief can create/delete announcements
- Priority levels: normal, important (yellow badge), urgent (red badge)
- Show on both dashboard and messages page

## Seed Data
Default login: editor-in-chief with email "eic@hsc.edu" password "tiger2026"
Create default channels for each section + all-staff
Sample announcements and messages
