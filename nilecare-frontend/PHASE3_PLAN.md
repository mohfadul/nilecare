# 🏥 Phase 3: Clinical Data & Monitoring

**Duration:** Weeks 6-9  
**Status:** 🚀 **STARTING NOW**  
**Backend Services:** Lab Service (4005), Medication Service (4003), Device Service (7009)

---

## 🎯 Phase 3 Objectives

From `NILECARE_5_PHASE_FRONTEND_PLAN.md`:

- ✅ Lab order creation and result viewing
- ✅ Medication prescriptions
- ✅ Device monitoring dashboard  
- ✅ Real-time vital signs display
- ✅ WebSocket integration (if time permits)

---

## 📋 Deliverables

### 1. Lab Management

**Backend:** Lab Service (Port 4005)

**API Endpoints:**
- `GET /api/v1/labs` - List lab orders
- `POST /api/v1/labs` - Create lab order
- `GET /api/v1/labs/:id` - Get lab order details
- `GET /api/v1/labs/:id/results` - Get lab results
- `PUT /api/v1/labs/:id/results` - Submit results (lab tech)
- `GET /api/v1/labs/pending` - Pending lab orders
- `GET /api/v1/labs/patient/:patientId` - Patient's lab history

**Pages to Create:**
- `LabOrderListPage.tsx` - View all lab orders
- `LabOrderFormPage.tsx` - Order new labs
- `LabResultsPage.tsx` - View lab results

### 2. Medication Management

**Backend:** Medication Service (Port 4003)

**API Endpoints:**
- `GET /api/v1/medications` - List medications
- `POST /api/v1/medications` - Prescribe medication
- `GET /api/v1/medications/:id` - Get medication details
- `PUT /api/v1/medications/:id` - Update prescription
- `DELETE /api/v1/medications/:id` - Discontinue medication
- `GET /api/v1/medications/patient/:patientId` - Patient's medications
- `GET /api/v1/medications/active` - Active prescriptions

**Pages to Create:**
- `MedicationListPage.tsx` - View all medications
- `PrescriptionFormPage.tsx` - Prescribe new medication
- `MedicationHistoryPage.tsx` - Patient medication history

### 3. Vital Signs & Device Monitoring

**Backend:** Device Integration Service (Port 7009)

**API Endpoints:**
- `POST /api/v1/vital-signs` - Record vital signs
- `GET /api/v1/vital-signs/patient/:patientId` - Patient vital signs
- `GET /api/v1/vital-signs/patient/:patientId/trends` - Trends over time
- `GET /api/v1/devices` - List devices
- `GET /api/v1/devices/:id` - Device details

**Components to Create:**
- `VitalSignsCard.tsx` - Display vital signs
- `VitalSignsForm.tsx` - Record vital signs
- `VitalSignsChart.tsx` - Trends visualization
- `DeviceMonitorDashboard.tsx` - Real-time device monitoring

### 4. Integration Points

**Pages to Update:**
- `PatientDetailsPage.tsx` - Add tabs for labs, medications, vitals
- `DoctorDashboard.tsx` - Integrate pending labs, medication reviews
- `NurseDashboard.tsx` - Add vital signs recording
- `LabTechnicianDashboard.tsx` - Connect to real lab API
- `PharmacistDashboard.tsx` - Connect to real medication API

---

## 🗂️ File Structure (Phase 3)

```
src/
├── api/
│   ├── labs.api.ts              ✨ NEW
│   ├── medications.api.ts       ✨ NEW
│   ├── vitals.api.ts            ✨ NEW
│   └── devices.api.ts           ✨ NEW
├── hooks/
│   ├── useLabs.ts               ✨ NEW
│   ├── useMedications.ts        ✨ NEW
│   ├── useVitals.ts             ✨ NEW
│   └── useDevices.ts            ✨ NEW
├── pages/
│   ├── clinical/                ✨ NEW FOLDER
│   │   ├── labs/
│   │   │   ├── LabOrderListPage.tsx
│   │   │   ├── LabOrderFormPage.tsx
│   │   │   └── LabResultsPage.tsx
│   │   ├── medications/
│   │   │   ├── MedicationListPage.tsx
│   │   │   ├── PrescriptionFormPage.tsx
│   │   │   └── MedicationHistoryPage.tsx
│   │   └── vitals/
│   │       ├── VitalSignsPage.tsx
│   │       └── DeviceMonitorPage.tsx
│   └── patients/
│       └── PatientDetailsPage.tsx  🔄 UPDATED (add tabs)
├── components/
│   └── clinical/                ✨ NEW FOLDER
│       ├── VitalSignsCard.tsx
│       ├── VitalSignsForm.tsx
│       ├── VitalSignsChart.tsx
│       ├── LabOrderCard.tsx
│       └── MedicationCard.tsx
└── App.tsx                      🔄 UPDATED (add routes)
```

---

## 🔌 Backend Services Integration

### Lab Service (Port 4005)
- **Database:** PostgreSQL
- **Features:** Lab orders, test catalog, results entry, QC
- **Real-time:** Pending tests queue

### Medication Service (Port 4003)
- **Database:** PostgreSQL
- **Features:** Prescriptions, formulary, drug interactions
- **Integration:** CDS Service for safety checks

### Device Integration Service (Port 7009)
- **Database:** PostgreSQL + TimescaleDB
- **Features:** Device connectivity, vital signs, alerts
- **Real-time:** WebSocket for live monitoring

---

## 🎨 UI Components to Build

### Material-UI Components
- Charts (Recharts) for vital trends
- Tables for lab results
- Forms for prescriptions
- Cards for device status
- Tabs for patient details
- Badges for critical values

### Custom Components
- Lab result table with normal/abnormal highlighting
- Medication timeline
- Vital signs trend graph
- Device status indicator
- Alert notification system

---

## 📊 Data Flow (Phase 3)

```
User Action (e.g., Order Lab)
    ↓
React Component (LabOrderFormPage)
    ↓
React Hook (useCreateLabOrder)
    ↓
API Client (labs.api.ts)
    ↓
Axios Request → Lab Service (4005)
    ↓
PostgreSQL Database
    ↓
Response back through chain
    ↓
React Query cache update
    ↓
UI re-renders with new data
```

---

## ✅ Acceptance Criteria (Phase 3)

### Lab Management
- [ ] Can view list of lab orders
- [ ] Can create new lab order
- [ ] Can view lab results
- [ ] Lab tech can enter results
- [ ] Results show normal/abnormal ranges
- [ ] Can filter by status (pending, completed)

### Medication Management
- [ ] Can view patient medications
- [ ] Can prescribe new medication
- [ ] Can discontinue medication
- [ ] Shows active vs discontinued
- [ ] Form validates dosage and frequency
- [ ] Integrates with CDS for drug interactions

### Vital Signs
- [ ] Can record vital signs manually
- [ ] Can view vital signs history
- [ ] Can see trends over time (charts)
- [ ] Shows critical values in red
- [ ] Devices show online/offline status

### Integration
- [ ] Patient details page has tabs
- [ ] Dashboards show real data
- [ ] All loading states work
- [ ] Error handling in place

---

## 🚀 Implementation Order

1. **Lab Orders** (Core functionality)
   - API client
   - React Query hooks
   - List page
   - Form page
   - Results view

2. **Medications** (Core functionality)
   - API client
   - React Query hooks
   - List page
   - Prescription form
   - History view

3. **Vital Signs** (Recording & display)
   - API client
   - React Query hooks
   - Recording form
   - Display card
   - Trend chart

4. **Patient Details Enhancement**
   - Add tabs (Overview, Labs, Meds, Vitals)
   - Integrate all clinical data

5. **Dashboard Integration**
   - Update dashboards with real data
   - Add quick actions

---

**Ready to start building Phase 3!** 🚀

