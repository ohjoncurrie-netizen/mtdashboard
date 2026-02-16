# Montana Explorer: User Authentication & Awards System Guide

## Overview

The Montana Explorer has been enhanced with a complete user authentication system, profile management, and a comprehensive 18-award system with a TOP 20 leaderboard.

## Features

### 1. User Authentication 🔐

#### Registration
- Click **"Register"** button in the header
- Fill in: Display Name, Email, Password, Avatar (10 emoji options)
- Account created in Firebase
- Automatic sign-in on successful registration

#### Sign In
- Click **"Sign In"** button in the header
- Enter email and password
- Redirects to profile on successful login

#### Forgot Password
- Click **"Forgot your password?"** link in Sign In tab
- Enter email address
- Receive password reset link via Firebase email
- Reset password and sign in with new credentials

#### Sign Out
- Click user profile button (avatar + name) in header
- Select **"Sign Out"**
- Session ends, sign in buttons reappear

### 2. User Profiles ⚙️

Once signed in, click your **avatar + name** button in the header to access your profile:

#### Profile Information
- **Avatar**: 10 emoji choices (👤 🤠 🦌 🐻 🏔️ 🌲 🦅 🐺 🎣 ⛷️)
- **Display Name**: Your public name in discussions and leaderboards
- **Bio**: Tell community about your Montana experience (200 char max)
- **Points**: Total earned from posts, helpful replies, and awards
- **Posts**: Number of discussion posts made
- **Awards**: Count and display of earned badges

#### Profile Settings
- **Update Name & Bio**: Edit profile text form
- **Change Avatar**: Click any emoji in the avatar picker
- **Show on Leaderboard**: Toggle whether you appear in public TOP 20
- **Public Profile**: Toggle whether others can see your profile
- **Save Settings**: Button to commit all changes

#### Your Awards Display
All earned awards are shown with:
- Award icon (emoji)
- Award name and description
- Points value for that award

### 3. Awards System 🏆

#### 18 Total Awards Across 5 Categories

**Knowledge Awards** (Learn Montana facts):
- 🏆 **Montana Expert** (100 pts) - Shared 10+ high-quality Montana facts
- 📜 **History Buff** (75 pts) - Shared Montana historical knowledge
- 🦌 **Wildlife Whisperer** (75 pts) - Shared valuable wildlife insights
- 🥾 **Trail Advocate** (50 pts) - Shared hiking and outdoor knowledge

**Quiz Awards** (Complete knowledge quizzes):
- 🧠 **Quiz Master** (125 pts) - Aced Montana knowledge quizzes
- 🌍 **Geography Genius** (100 pts) - Perfect score on Montana geography quiz
- 📚 **History Scholar** (100 pts) - Mastered Montana history quiz
- 🐻 **Wildlife Expert** (100 pts) - Identified all Montana wildlife species

**Exploration Awards** (Explore map and routes):
- 🛣️ **Route Explorer** (75 pts) - Explored 5+ scenic routes on the map
- 📍 **County Collector** (125 pts) - Visited and reviewed 10+ county pages
- ⛰️ **Peak Bagger** (100 pts) - Explored all mountain peak layers
- 🗺️ **Regional Master** (100 pts) - Expert knowledge in multiple regions

**Community Awards** (Help others):
- 🤝 **Helpful Contributor** (50 pts) - 5+ helpful replies
- 🏅 **First Responder** (50 pts) - First helpful reply on 5+ discussions
- 📖 **Storyteller** (75 pts) - Shared 5+ detailed local stories
- 🔥 **Trailblazer** (150 pts) - First to contribute in 3+ categories

**Prestige Awards** (High achievement):
- ⭐ **Community Champion** (150 pts) - 50+ helpful community contributions
- 👑 **Local Legend** (200 pts) - Top contributor with 500+ total points
- 🌟 **Founding Member** (50 pts) - Among the first 10 registered members

#### How to Earn Awards
1. **Discussion Posts**: Create posts in different categories (Wildlife, History, Hiking, etc.)
   - Posts earn 5-15 points based on category expertise
   - Marked as helpful by others = +5 points

2. **Complete Quizzes**: Admin can designate quiz completions (admin feature)

3. **Explore the Map**: Visit county pages, view events, explore layers

4. **Contribute Stories**: Share your Montana knowledge and experiences

5. **Admin Grants**: Admins can manually grant awards via Community Awards tab

### 4. TOP 20 Leaderboard 🎖️

Click **"🏆 Top 20"** button in the header to view the leaderboard:

#### Podium Display (Top 3)
- 🥇 **Gold Medal** (#1): Highest points
- 🥈 **Silver Medal** (#2): Second highest
- 🥉 **Bronze Medal** (#3): Third highest
- Shows avatar, name, and total points

#### Full Leaderboard (Ranks 4-20)
- Rank number
- Member avatar
- Member display name
- Number of awards earned 🎖️
- Total points (in gold)
- Sorted by highest points first

#### Awards Catalog
Browse all available awards with:
- Award icon
- Award name
- Description
- Point value
- Category badge (Knowledge, Quiz, Exploration, Community, Prestige)

**Note**: Only members with **"Show on Leaderboard"** enabled appear in the public TOP 20.

### 5. Admin: Community Awards Management 👨‍💼

**Admin Panel** > **Community Awards Tab**

#### Grant Award to Member
1. Select member from dropdown (shows avatar, points)
2. Select award type (shows icon, name, point value)
3. Preview card shows award details
4. Click **"Grant Award"** button
5. Member automatically receives points bonus
6. Notification confirms award granted

#### Member Profiles & Awards
- Search/filter members by name
- View each member's current awards (up to 5 shown, + more count)
- See total points
- Grant additional awards as needed

#### Why Grant Awards?
- **Quiz Completions**: User aces history or geography quiz → grant award
- **Achievement Recognition**: Special contribution or knowledge → grant award
- **Community Building**: Recognize helpful members → grant award
- **Milestone Celebrations**: 500+ points → grant "Local Legend" → grant award

## Workflow Examples

### Example 1: New User Journey
1. **Day 1**: User clicks "Register" → creates account with 🦌 avatar
2. **Day 2**: User reads county facts, registers for History Buff badge hunt
3. **Day 4**: User posts 10 history discussion posts → **Montana Expert** badge auto-awarded
4. **Day 7**: User appears in TOP 20 leaderboard at rank #18 with 2 badges
5. **Day 10**: Admin grants **History Scholar** badge for completing history quiz

### Example 2: Discussion & Awards
1. User posts about Montana wildlife (5 pts)
2. User posts about hiking trails (10 pts)
3. Other users mark posts helpful (5 pts each, 2 times = +10 pts)
4. User earns **Helpful Contributor** badge
5. User continues posting (more badges)
6. Within days, appears on leaderboard

### Example 3: Quiz-Based Learning
1. Admin creates Montana geography quiz (future quiz feature)
2. User takes quiz, gets 100%
3. Admin grants **Geography Genius** award
4. User gains 100 points immediately
5. Users can see quiz achievement on profile

## Points System

| Source | Points | Notes |
|--------|--------|-------|
| Discussion Post (General) | 5 | Any topic |
| Discussion Post (Hiking) | 10 | Outdoor knowledge |
| Discussion Post (Wildlife/History/Geology) | 15 | Specialized knowledge |
| Marked "Helpful" | 5 | Per helpful vote |
| Award Granted | 25-200 | Varies by award type |

## Technical Details

### Storage
- **Firebase**: Live user accounts, profiles, awards (requires Firebase auth)
- **LocalStorage**: Fallback storage, work offline
- **Both sync**: Changes save to both simultaneously

### Firebase Configuration
Already configured in `firebase-config.js`:
- Project: `simplemontana-7d1da`
- Auth enabled: Email/Password
- Firestore database: Ready for member profiles

### Member Profile Fields
```javascript
{
  name: "DisplayName",
  email: "user@example.com",
  avatarEmoji: "🦌",
  bio: "Love Montana hiking!",
  totalPoints: 250,
  postCount: 15,
  helpfulCount: 8,
  awards: ["montana_expert", "history_buff"],
  joinedAt: "2026-02-15T...",
  settings: {
    showOnLeaderboard: true,
    publicProfile: true,
    emailNotifications: true
  }
}
```

## Future Enhancements

Could add:
- **Quizzes**: Integrated HunterLab or custom quiz system
- **Achievements**: Level up with custom milestones
- **Badges**: Special seasonal or event-based awards
- **Leaderboard Filters**: By region, category, recent activity
- **Mentoring**: Award "Mentor" badges for helping new members
- **Events**: Host Montana knowledge contests
- **Badges History**: See when/how you earned each award

## Troubleshooting

### Can't Create Account?
- Check email has no typos
- Password must be 6+ characters
- Try different email if service issue

### Forgotten Password?
- Click "Forgot your password?" tab
- Check email (including spam folder)
- Follow reset link
- Set new password, sign in

### Not Appearing on Leaderboard?
- Check "Show on Leaderboard" toggle in profile settings
- Ensure profile privacy is **public**
- Need at least 1 point to appear

### Award Not Granted?
- Admin must manually grant award
- Check Community Awards tab > Member search
- Click grant award, verify confirmation

### Lost Award or Points?
- Awards/points stored in Firebase + localStorage
- Check browser localStorage: F12 > Application > Local Storage
- Contact admin to verify or restore

## Contact & Support

For issues or feature requests:
1. Check SETUP-GUIDE.md for general questions
2. Visit GitHub Issues: ohjoncurrie-netizen/mtdashboard
3. Admin panel > Settings for password help
4. Check browser console (F12) for error messages

---

**Happy exploring and earning badges!** 🏆🦌🗺️
