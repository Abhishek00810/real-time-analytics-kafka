# Frontend Plan - Real-Time Analytics Demo

## 🎯 Goal

Create a **simple, beautiful Next.js frontend** that demonstrates the real-time analytics platform in action. This should be recruiter/CTO friendly - showing the system working, not just code.

---

## 📱 Pages & Features

### **Page 1: Dashboard (Home Page)**

**Route**: `/` (home page)

**What it shows**:
- **Hero Section**:
  - Title: "Real-Time Analytics Platform"
  - Brief description: "Microservices-based event processing with Kafka, PostgreSQL, Redis"
  - System status indicator (if services are up/down)

- **Key Metrics Cards** (4 cards):
  1. **Total Events Processed** (from ingestion service)
  2. **Active Users** (unique user_ids in last hour)
  3. **Top Page** (page_url with most clicks)
  4. **Cache Hit Rate** (if we expose this metric)

- **Main Chart: Events Per Page Over Time**
  - Line chart showing click counts per page_url over last 1 hour
  - X-axis: Time (last 60 minutes)
  - Y-axis: Click count
  - Multiple lines (one per page_url)
  - Updates every 5-10 seconds (near real-time)

- **Secondary Chart: Top Pages (Bar Chart)**
  - Horizontal bar chart
  - Shows top 10 pages by click count
  - Updates periodically

**Data Source**:
- Calls API Gateway: `GET /analytics/events` (but we need to aggregate by page_url)
- Or we might need to add a new endpoint: `GET /analytics/pages` or `GET /analytics/summary`

---

### **Page 2: Event Ingestion (Demo Page)**

**Route**: `/ingest` or `/demo`

**What it shows**:
- **Form to send test events**:
  - User ID input (or random user generator)
  - Page URL input (or dropdown with common pages)
  - "Send Event" button

- **Live Event Feed**:
  - Shows last 10-20 events sent
  - Updates in real-time as events are ingested
  - Shows: timestamp, user_id, page_url, event_id

- **Visual Feedback**:
  - Success/error messages
  - Counter: "Events sent: X"
  - Maybe a simple animation when event is sent

**Data Source**:
- Calls Ingestion Service: `POST /ingest`
- Could also show events from a "recent events" endpoint (if we add one)

---

### **Page 3: Analytics Query (Search Page)**

**Route**: `/analytics` or `/query`

**What it shows**:
- **Search Form**:
  - User ID input
  - Page URL input
  - "Query" button

- **Results Display**:
  - Shows click count for that user + page combination
  - Maybe a small chart showing historical trend (if we have time-series data)

**Data Source**:
- Calls API Gateway: `GET /analytics/events` with user_id and page_url

---

## 🎨 Design Approach

### **Simple & Clean**
- **Color Scheme**: 
  - Primary: Blue/Purple (tech/professional)
  - Accent: Green (success), Red (errors)
  - Background: Light gray/white

- **Typography**: 
  - Clean, readable fonts (system fonts or Inter)
  - Clear hierarchy (H1, H2, body text)

- **Layout**:
  - Responsive (works on desktop, tablet, mobile)
  - Card-based design for metrics
  - Clean spacing, not cluttered

### **Charts Library**
- **Chart.js** (as specified in requirements)
  - Simple, lightweight
  - Good documentation
  - Easy to customize

---

## 🔌 Backend Integration

### **API Endpoints We'll Use**

1. **Ingestion**:
   - `POST http://localhost:8080/ingest` (local)
   - `POST http://localhost:30080/ingest` (K8s NodePort)

2. **Analytics**:
   - `GET http://localhost:8081/analytics/events` (local)
   - `GET http://localhost:30081/analytics/events` (K8s NodePort)

### **API Client Setup**

Create a simple API client utility:
- `frontend/src/lib/api.ts`
- Functions: `sendEvent()`, `getAnalytics()`, `getPageStats()`
- Handles base URL (different for local vs deployed)
- Error handling

### **Real-Time Updates**

- **Polling**: Simple `setInterval` to refresh data every 5-10 seconds
- **Future**: Could use WebSockets if we add that to backend (not needed for MVP)

---

## 📦 Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules (or simple CSS, no Tailwind for now)
- **Charts**: Chart.js + react-chartjs-2
- **HTTP Client**: Native `fetch` (or axios if needed)

---

## 🗂️ File Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx             # Dashboard (home)
│   │   ├── ingest/
│   │   │   └── page.tsx         # Event ingestion demo
│   │   └── analytics/
│   │       └── page.tsx         # Analytics query page
│   ├── components/
│   │   ├── MetricCard.tsx       # Reusable metric card
│   │   ├── EventChart.tsx       # Chart.js wrapper for events
│   │   ├── TopPagesChart.tsx    # Bar chart component
│   │   └── EventForm.tsx        # Form to send events
│   ├── lib/
│   │   └── api.ts               # API client functions
│   └── types/
│       └── analytics.ts         # TypeScript types
├── public/                      # Static assets
└── package.json
```

---

## 🚀 Implementation Phases

### **Phase 1: Basic Setup** (Day 1)
- [x] Next.js scaffold
- [ ] Clean up default files
- [ ] Basic layout with navigation
- [ ] Simple home page with placeholder text

### **Phase 2: API Integration** (Day 1-2)
- [ ] Create API client (`lib/api.ts`)
- [ ] Test API calls to backend
- [ ] Handle errors gracefully
- [ ] Add loading states

### **Phase 3: Dashboard Page** (Day 2-3)
- [ ] Metric cards (with real data)
- [ ] Events per page chart (Chart.js)
- [ ] Top pages bar chart
- [ ] Auto-refresh every 10 seconds

### **Phase 4: Ingestion Demo** (Day 3-4)
- [ ] Event form
- [ ] Send events to backend
- [ ] Live event feed
- [ ] Visual feedback

### **Phase 5: Analytics Query** (Day 4)
- [ ] Search form
- [ ] Display results
- [ ] Error handling

### **Phase 6: Polish** (Day 5)
- [ ] Styling improvements
- [ ] Responsive design
- [ ] Error states
- [ ] Loading skeletons
- [ ] Final testing

---

## 🎯 MVP Scope (What We'll Build)

**Must Have**:
1. ✅ Dashboard with 1-2 charts showing real data
2. ✅ Event ingestion form (send test events)
3. ✅ Basic analytics query page
4. ✅ Clean, professional design
5. ✅ Works with local backend

**Nice to Have** (if time permits):
- Real-time WebSocket updates
- More chart types
- Historical data visualization
- User activity timeline

**Out of Scope** (for now):
- Authentication
- User management
- Advanced filtering
- Export functionality

---

## 🔄 Data Flow

```
User Action (Frontend)
    ↓
Next.js API Route (optional) or Direct API Call
    ↓
API Gateway (Port 8081)
    ↓
Analytics Service (gRPC)
    ↓
Redis Cache / PostgreSQL
    ↓
Response back to Frontend
    ↓
Update UI / Charts
```

---

## 📊 Chart Examples

### **Events Per Page Over Time**
- Type: Line Chart
- Data: Array of { timestamp, page_url, count }
- Updates: Every 10 seconds
- Shows: Last 60 minutes

### **Top Pages**
- Type: Horizontal Bar Chart
- Data: Array of { page_url, count }
- Updates: Every 30 seconds
- Shows: Top 10 pages

---

## 🎨 UI Mockup (Text Description)

**Dashboard Page**:
```
┌─────────────────────────────────────────┐
│  Real-Time Analytics Platform          │
│  [Status: All Systems Operational]     │
├─────────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │
│  │ 1.2K│ │  45 │ │ /home│ │ 85% │    │
│  │Events│ │Users│ │  Top │ │Cache│    │
│  └─────┘ └─────┘ └─────┘ └─────┘    │
├─────────────────────────────────────────┤
│  Events Per Page (Last Hour)            │
│  ┌───────────────────────────────────┐  │
│  │     Line Chart Here              │  │
│  │     (Multiple lines per page)   │  │
│  └───────────────────────────────────┘  │
├─────────────────────────────────────────┤
│  Top Pages by Click Count               │
│  ┌───────────────────────────────────┐  │
│  │     Bar Chart Here                │  │
│  │     (Horizontal bars)             │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## ✅ Success Criteria

1. **Functional**:
   - Can send events and see them reflected in charts
   - Charts update automatically
   - All API calls work correctly

2. **Visual**:
   - Clean, professional design
   - Responsive (works on mobile)
   - Charts are readable and informative

3. **Demo-Ready**:
   - Easy to understand what's happening
   - Shows the system working end-to-end
   - Impressive enough for portfolio

---

## 🚧 Potential Challenges & Solutions

### **Challenge 1: Backend API Limitations**
- **Problem**: Current API only returns count for specific user+page, not aggregated stats
- **Solution**: 
  - Option A: Add new endpoints to backend (e.g., `/analytics/pages`, `/analytics/summary`)
  - Option B: Frontend makes multiple calls and aggregates (less efficient but works)

### **Challenge 2: Real-Time Updates**
- **Problem**: How to show "near real-time" updates
- **Solution**: Polling every 5-10 seconds (simple, works for demo)

### **Challenge 3: CORS Issues**
- **Problem**: Frontend on different port than backend
- **Solution**: Configure CORS in API Gateway, or use Next.js API routes as proxy

---

## 📝 Notes

- **Keep it simple**: This is a demo, not a full product
- **Focus on visuals**: Charts and real-time updates are the wow factor
- **Make it work**: Functionality > perfect design
- **Document as we go**: Update this plan if we change direction

---

**Last Updated**: 2025-12-08  
**Status**: Planning Phase ✅

