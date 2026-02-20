# Community Platform - Complete App

## 🚀 5-Step Setup (5 Minutes Total)

### Step 1: Install Dependencies (2 min)
```bash
npm install
```

### Step 2: Setup Database & Seed Data (1 min)
```bash
npm run setup
```

This will:
- Generate Prisma client
- Create SQLite database
- Seed with test data

### Step 3: Start Development Server (10 sec)
```bash
npm run dev
```

### Step 4: Open Browser
Go to: **http://localhost:3000**

### Step 5: Explore! 🎉

You now have a fully working app with:
- ✅ Homepage with upcoming events
- ✅ Event discovery page
- ✅ Event detail pages with RSVP and discussion
- ✅ Organiser dashboard
- ✅ Courses page (Eclectic House)
- ✅ Counselling page (Eclectic House)
- ✅ Warm, organic UI design
- ✅ SQLite database with test data

---

## 📧 Test Accounts

All passwords: `password123`

- **Admin**: admin@platform.com
- **Masjid Admin**: victoria@masjid.com
- **Counsellor**: counsellor@eclectic.com
- **Member**: member@test.com

---

## 🗂️ What's Included

### Pages
- `/` - Homepage with hero, upcoming events, features
- `/discover` - Browse all events
- `/events/[slug]` - Event detail with RSVP & comments
- `/dashboard` - Organiser panel with stats & event table
- `/courses` - Therapeutic courses (Eclectic House)
- `/counselling` - Counselling booking (Eclectic House)

### Database
- Users (with roles: admin, masjid_admin, organiser, counsellor, member)
- Organisations (Masjids + Therapy Centres)
- Events (with RSVPs, comments, categories)
- Courses (with sessions, enrollments)
- Counsellor Profiles & Bookings
- Rooms (for counselling sessions)

### Design System
- Sage green primary color
- Terracotta accent color
- Crimson Pro + DM Sans fonts
- Fully responsive mobile-first design
- Warm, organic aesthetic

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (via Prisma)
- **Styling**: Tailwind CSS
- **Auth**: NextAuth.js (ready to configure)

---

## 📝 Common Tasks

### View Database
```bash
npx prisma studio
```
Opens visual database editor at http://localhost:5555

### Reset Database
```bash
npx prisma db push --force-reset
npx tsx prisma/seed.ts
```

### Add New Event
1. Go to http://localhost:5555
2. Click "Event" model
3. Click "Add record"
4. Fill in details
5. Set status to "APPROVED"

---

## 🎨 Customization

### Change Platform Name
Edit `app/page.tsx` and replace "Community Platform" with your name

### Change Colors
Edit `tailwind.config.ts` - change the sage/terracotta values

### Add Your Logo
Replace navigation text with `<Image>` component

---

## 🚢 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Other Platforms
1. Run `npm run build`
2. Deploy `.next` folder
3. Set environment variables
4. Use PostgreSQL for production (not SQLite)

---

## 📚 Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 🐛 Troubleshooting

### Port 3000 Already in Use
```bash
npm run dev -- -p 3001
```

### Database Issues
```bash
rm prisma/dev.db
npm run setup
```

### TypeScript Errors
```bash
npx prisma generate
rm -rf .next
npm run dev
```

---

## ✨ What's Next?

### Phase 1 Additions
- [ ] User authentication (login/register)
- [ ] RSVP functionality (currently UI only)
- [ ] Comment posting (currently UI only)
- [ ] Event creation form
- [ ] Image uploads
- [ ] Email notifications

### Eclectic House Features
- [ ] Counsellor booking calendar
- [ ] Course enrollment system
- [ ] Room booking calendar
- [ ] Payment integration (Stripe)
- [ ] Client feedback forms

### Nice to Have
- [ ] Search & filters
- [ ] Map view
- [ ] Push notifications
- [ ] Mobile app (React Native)

---

**Built with ❤️ for community connection**

Questions? Check the code comments or Prisma schema for guidance!
