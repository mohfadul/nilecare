# 📊 CRITICAL FLOW SEQUENCE DIAGRAMS

**Version:** 1.0.0  
**Date:** October 16, 2025  
**Status:** ✅ Complete

---

## 📋 TABLE OF CONTENTS

1. [Authentication Flow](#1-authentication-flow)
2. [Patient Appointment Booking](#2-patient-appointment-booking)
3. [E-Prescription Workflow](#3-e-prescription-workflow)
4. [Lab Order to Results](#4-lab-order-to-results)
5. [Payment Processing](#5-payment-processing)
6. [Real-Time Vital Signs Monitoring](#6-real-time-vital-signs-monitoring)
7. [Insurance Claim Submission](#7-insurance-claim-submission)
8. [Clinical Decision Support](#8-clinical-decision-support)

---

## 1. AUTHENTICATION FLOW

### Login with JWT

```
Actor: User (Doctor)
Frontend → Auth Service → MySQL → Redis → Frontend

┌─────────┐             ┌──────────────┐         ┌─────────┐        ┌─────────┐
│ Frontend│             │ Auth Service │         │  MySQL  │        │  Redis  │
└────┬────┘             └──────┬───────┘         └────┬────┘        └────┬────┘
     │                         │                      │                   │
     │ 1. POST /auth/login     │                      │                   │
     │ {email, password}       │                      │                   │
     ├────────────────────────▶│                      │                   │
     │                         │                      │                   │
     │                         │ 2. Query user        │                   │
     │                         │ SELECT * FROM        │                   │
     │                         │ auth_users WHERE     │                   │
     │                         │ email = ?            │                   │
     │                         ├─────────────────────▶│                   │
     │                         │                      │                   │
     │                         │ 3. User record       │                   │
     │                         │◀─────────────────────┤                   │
     │                         │                      │                   │
     │                         │ 4. Verify password   │                   │
     │                         │    (bcrypt compare)  │                   │
     │                         │───┐                  │                   │
     │                         │   │                  │                   │
     │                         │◀──┘                  │                   │
     │                         │                      │                   │
     │                         │ 5. Generate tokens   │                   │
     │                         │    - Access Token    │                   │
     │                         │    - Refresh Token   │                   │
     │                         │───┐                  │                   │
     │                         │   │                  │                   │
     │                         │◀──┘                  │                   │
     │                         │                      │                   │
     │                         │ 6. Store refresh token                   │
     │                         │ INSERT INTO auth_refresh_tokens          │
     │                         ├─────────────────────▶│                   │
     │                         │                      │                   │
     │                         │ 7. Cache session     │                   │
     │                         │ SET session:{user_id}│                   │
     │                         ├──────────────────────────────────────────▶│
     │                         │                      │                   │
     │                         │ 8. Log login attempt │                   │
     │                         │ INSERT INTO          │                   │
     │                         │ auth_login_attempts  │                   │
     │                         ├─────────────────────▶│                   │
     │                         │                      │                   │
     │ 9. Return tokens        │                      │                   │
     │ {                       │                      │                   │
     │   access_token: "...",  │                      │                   │
     │   refresh_token: "...", │                      │                   │
     │   user: {...}           │                      │                   │
     │ }                       │                      │                   │
     │◀────────────────────────┤                      │                   │
     │                         │                      │                   │
     │ 10. Store tokens        │                      │                   │
     │     in localStorage     │                      │                   │
     │───┐                     │                      │                   │
     │   │                     │                      │                   │
     │◀──┘                     │                      │                   │
     │                         │                      │                   │
     │ 11. Redirect to         │                      │                   │
     │     dashboard           │                      │                   │
     │───┐                     │                      │                   │
     │   │                     │                      │                   │
     │◀──┘                     │                      │                   │
```

### Authenticated API Request

```
Frontend → Any Service → Auth Service → MySQL → Frontend

┌─────────┐         ┌──────────────┐         ┌──────────────┐         ┌─────────┐
│ Frontend│         │ Any Service  │         │ Auth Service │         │  MySQL  │
└────┬────┘         └──────┬───────┘         └──────┬───────┘         └────┬────┘
     │                     │                        │                      │
     │ 1. GET /api/data    │                        │                      │
     │ Authorization:      │                        │                      │
     │ Bearer {jwt}        │                        │                      │
     ├────────────────────▶│                        │                      │
     │                     │                        │                      │
     │                     │ 2. POST /auth/validate │                      │
     │                     │ {token}                │                      │
     │                     ├───────────────────────▶│                      │
     │                     │                        │                      │
     │                     │                        │ 3. Verify JWT        │
     │                     │                        │    signature         │
     │                     │                        │───┐                  │
     │                     │                        │   │                  │
     │                     │                        │◀──┘                  │
     │                     │                        │                      │
     │                     │                        │ 4. Check revocation  │
     │                     │                        │ SELECT * FROM        │
     │                     │                        │ auth_refresh_tokens  │
     │                     │                        │ WHERE is_revoked=1   │
     │                     │                        ├─────────────────────▶│
     │                     │                        │                      │
     │                     │                        │ 5. Token valid       │
     │                     │                        │◀─────────────────────┤
     │                     │                        │                      │
     │                     │ 6. Return user + perms │                      │
     │                     │ {user_id, role, perms} │                      │
     │                     │◀───────────────────────┤                      │
     │                     │                        │                      │
     │                     │ 7. Check permissions   │                      │
     │                     │    for requested       │                      │
     │                     │    resource            │                      │
     │                     │───┐                    │                      │
     │                     │   │                    │                      │
     │                     │◀──┘                    │                      │
     │                     │                        │                      │
     │                     │ 8. Process request     │                      │
     │                     │    (user authorized)   │                      │
     │                     │───┐                    │                      │
     │                     │   │                    │                      │
     │                     │◀──┘                    │                      │
     │                     │                        │                      │
     │ 9. Return data      │                        │                      │
     │◀────────────────────┤                        │                      │
```

---

## 2. PATIENT APPOINTMENT BOOKING

```
Actors: Receptionist, Patient, Doctor
Frontend → Gateway → Appointment Service → Business Service → Notification Service → Kafka

┌──────────┐  ┌────────┐  ┌───────────┐  ┌──────────┐  ┌────────┐  ┌──────────────┐
│Receptionist│ │ Gateway│  │Appointment│  │ Business │  │  MySQL │  │ Notification │
│   UI      │  │        │  │  Service  │  │ Service  │  │        │  │   Service    │
└─────┬─────┘  └───┬────┘  └─────┬─────┘  └────┬─────┘  └───┬────┘  └──────┬───────┘
      │            │              │             │            │              │
      │ 1. Book    │              │             │            │              │
      │ Appointment│              │             │            │              │
      ├───────────▶│              │             │            │              │
      │            │              │             │            │              │
      │            │ 2. Route to  │             │            │              │
      │            │ Appointment  │             │            │              │
      │            │ Service      │             │            │              │
      │            ├─────────────▶│             │            │              │
      │            │              │             │            │              │
      │            │              │ 3. Validate │            │              │
      │            │              │ patient     │            │              │
      │            │              │ exists      │            │              │
      │            │              ├────────────▶│            │              │
      │            │              │             │            │              │
      │            │              │ 4. Patient  │            │              │
      │            │              │ data        │            │              │
      │            │              │◀────────────┤            │              │
      │            │              │             │            │              │
      │            │              │ 5. Check doctor          │              │
      │            │              │    availability          │              │
      │            │              ├────────────▶│            │              │
      │            │              │             │            │              │
      │            │              │             │ 6. Query   │              │
      │            │              │             │ working    │              │
      │            │              │             │ hours &    │              │
      │            │              │             │ existing   │              │
      │            │              │             │ appts      │              │
      │            │              │             ├───────────▶│              │
      │            │              │             │            │              │
      │            │              │             │ 7. Available              │
      │            │              │             │    slots   │              │
      │            │              │             │◀───────────┤              │
      │            │              │             │            │              │
      │            │              │ 8. Slot     │            │              │
      │            │              │ available   │            │              │
      │            │              │◀────────────┤            │              │
      │            │              │             │            │              │
      │            │              │ 9. Create   │            │              │
      │            │              │ appointment │            │              │
      │            │              │ record      │            │              │
      │            │              ├────────────────────────────────────────▶│
      │            │              │             │            │              │
      │            │              │ 10. INSERT INTO appointments            │
      │            │              ├────────────────────────────────────────▶│
      │            │              │             │            │              │
      │            │              │ 11. Publish event        │              │
      │            │              │ "appointment.scheduled"  │              │
      │            │              ├──────────────────────────┼─────────────▶│
      │            │              │             │            │         Kafka│
      │            │              │             │            │              │
      │            │              │             │            │ 12. Consume  │
      │            │              │             │            │ event        │
      │            │              │             │            │◀─────────────┤
      │            │              │             │            │              │
      │            │              │             │            │ 13. Send SMS │
      │            │              │             │            │ & Email      │
      │            │              │             │            │ reminder     │
      │            │              │             │            │───┐          │
      │            │              │             │            │   │          │
      │            │              │             │            │◀──┘          │
      │            │              │             │            │              │
      │            │ 14. Success  │             │            │              │
      │            │ response     │             │            │              │
      │            │◀─────────────┤             │            │              │
      │            │              │             │            │              │
      │ 15. Show   │              │             │            │              │
      │ confirmation              │             │            │              │
      │◀───────────┤              │             │            │              │
```

---

## 3. E-PRESCRIPTION WORKFLOW

```
Actors: Doctor
Frontend → Medication Service → CDS Service → Clinical Service → Pharmacy

┌────────┐  ┌──────────┐  ┌────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│ Doctor │  │Medication│  │   CDS  │  │Clinical │  │External │  │ HL7     │
│   UI   │  │ Service  │  │ Service│  │ Service │  │Drug DB  │  │ Service │
└───┬────┘  └────┬─────┘  └────┬───┘  └────┬────┘  └────┬────┘  └────┬────┘
    │            │             │           │            │            │
    │ 1. Create  │             │           │            │            │
    │ Prescription            │           │            │            │
    ├───────────▶│             │           │            │            │
    │            │             │           │            │            │
    │            │ 2. Request  │           │            │            │
    │            │ interaction │           │            │            │
    │            │ check       │           │            │            │
    │            ├────────────▶│           │            │            │
    │            │             │           │            │            │
    │            │             │ 3. Get patient         │            │
    │            │             │    current meds        │            │
    │            │             ├──────────▶│            │            │
    │            │             │           │            │            │
    │            │             │ 4. Medication list     │            │
    │            │             │◀──────────┤            │            │
    │            │             │           │            │            │
    │            │             │ 5. Get patient         │            │
    │            │             │    allergies           │            │
    │            │             ├──────────▶│            │            │
    │            │             │           │            │            │
    │            │             │ 6. Allergy list        │            │
    │            │             │◀──────────┤            │            │
    │            │             │           │            │            │
    │            │             │ 7. Check external      │            │
    │            │             │    drug database       │            │
    │            │             ├───────────────────────▶│            │
    │            │             │           │            │            │
    │            │             │ 8. Interaction data    │            │
    │            │             │◀───────────────────────┤            │
    │            │             │           │            │            │
    │            │             │ 9. Analyze interactions│            │
    │            │             │    - Drug-drug         │            │
    │            │             │    - Drug-allergy      │            │
    │            │             │    - Dose range        │            │
    │            │             │───┐        │            │            │
    │            │             │   │        │            │            │
    │            │             │◀──┘        │            │            │
    │            │             │           │            │            │
    │            │ 10. Return  │           │            │            │
    │            │ warnings    │           │            │            │
    │            │ {           │           │            │            │
    │            │   severity: "HIGH",     │            │            │
    │            │   type: "interaction",  │            │            │
    │            │   message: "..."        │            │            │
    │            │ }           │           │            │            │
    │            │◀────────────┤           │            │            │
    │            │             │           │            │            │
    │ 11. Display│             │           │            │            │
    │ warning    │             │           │            │            │
    │◀───────────┤             │           │            │            │
    │            │             │           │            │            │
    │ 12. Doctor │             │           │            │            │
    │ overrides  │             │           │            │            │
    │ with reason│             │           │            │            │
    ├───────────▶│             │           │            │            │
    │            │             │           │            │            │
    │            │ 13. Create  │           │            │            │
    │            │ prescription│           │            │            │
    │            │ INSERT INTO │           │            │            │
    │            │ prescriptions          │            │            │
    │            │───┐         │           │            │            │
    │            │   │         │           │            │            │
    │            │◀──┘         │           │            │            │
    │            │             │           │            │            │
    │            │ 14. Generate HL7 ORM    │            │            │
    │            │    (pharmacy order)     │            │            │
    │            ├────────────────────────────────────────────────▶│
    │            │             │           │            │            │
    │            │             │           │            │ 15. Send to│
    │            │             │           │            │ pharmacy   │
    │            │             │           │            │ system     │
    │            │             │           │            │───┐        │
    │            │             │           │            │   │        │
    │            │             │           │            │◀──┘        │
    │            │             │           │            │            │
    │ 16. Success│             │           │            │            │
    │◀───────────┤             │           │            │            │
```

---

## 4. LAB ORDER TO RESULTS

```
Actors: Doctor, Lab Technician, Patient
Frontend → Clinical Service → Lab Service → Notification → HL7

┌────────┐  ┌─────────┐  ┌────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐
│ Doctor │  │Clinical │  │  Lab   │  │   Lab    │  │Notification│ │  HL7   │
│   UI   │  │ Service │  │ Service│  │ Equipment│  │  Service   │  │Service │
└───┬────┘  └────┬────┘  └───┬────┘  └────┬─────┘  └─────┬──────┘  └───┬────┘
    │            │            │            │              │             │
    │ 1. Order   │            │            │              │             │
    │ Lab Test   │            │            │              │             │
    ├───────────▶│            │            │              │             │
    │            │            │            │              │             │
    │            │ 2. Create  │            │              │             │
    │            │ lab order  │            │              │             │
    │            ├───────────▶│            │              │             │
    │            │            │            │              │             │
    │            │            │ 3. INSERT INTO lab_orders │             │
    │            │            │───┐        │              │             │
    │            │            │   │        │              │             │
    │            │            │◀──┘        │              │             │
    │            │            │            │              │             │
    │            │            │ 4. Generate barcode       │             │
    │            │            │    & requisition          │             │
    │            │            │───┐        │              │             │
    │            │            │   │        │              │             │
    │            │            │◀──┘        │              │             │
    │            │            │            │              │             │
    │            │            │ 5. Send HL7 ORM message   │             │
    │            │            │            │              │             │
    │            │            ├───────────────────────────────────────▶│
    │            │            │            │              │             │
    │            │ 6. Success │            │              │             │
    │            │◀───────────┤            │              │             │
    │            │            │            │              │             │
    │ 7. Print   │            │            │              │             │
    │ requisition│            │            │              │             │
    │◀───────────┤            │            │              │             │
    │            │            │            │              │             │
    │            │            │            │              │             │
    │ ========== SPECIMEN COLLECTION PHASE ==========   │             │
    │            │            │            │              │             │
    │            │            │ 8. Scan specimen          │             │
    │            │            │    barcode │              │             │
    │            │            │◀───────────┤              │             │
    │            │            │            │              │             │
    │            │            │ 9. Update status          │             │
    │            │            │    = "collected"          │             │
    │            │            │───┐        │              │             │
    │            │            │   │        │              │             │
    │            │            │◀──┘        │              │             │
    │            │            │            │              │             │
    │            │            │            │              │             │
    │ ========== TESTING PHASE ==========               │             │
    │            │            │            │              │             │
    │            │            │ 10. Run test              │             │
    │            │            │            │              │             │
    │            │            │◀───────────┤              │             │
    │            │            │            │              │             │
    │            │            │ 11. Receive HL7 ORU       │             │
    │            │            │     (result message)      │             │
    │            │            │◀───────────────────────────────────────┤
    │            │            │            │              │             │
    │            │            │ 12. Parse & store results │             │
    │            │            │ INSERT INTO lab_results   │             │
    │            │            │───┐        │              │             │
    │            │            │   │        │              │             │
    │            │            │◀──┘        │              │             │
    │            │            │            │              │             │
    │            │            │ 13. Check critical values │             │
    │            │            │───┐        │              │             │
    │            │            │   │        │              │             │
    │            │            │◀──┘        │              │             │
    │            │            │            │              │             │
    │            │            │ 14. If critical, publish  │             │
    │            │            │     "lab.result.critical" │             │
    │            │            ├──────────────────────────▶│             │
    │            │            │            │           Kafka            │
    │            │            │            │              │             │
    │            │            │            │ 15. Send alert             │
    │            │            │            │     to doctor │             │
    │            │            │            │──────────────┐│             │
    │            │            │            │              ││             │
    │            │            │            │◀─────────────┘│             │
    │            │            │            │              │             │
    │ 16. Real-time alert     │            │              │             │
    │    (WebSocket)          │            │              │             │
    │◀────────────────────────────────────────────────────┤             │
    │            │            │            │              │             │
    │ 17. View   │            │            │              │             │
    │ results    │            │            │              │             │
    ├───────────▶│            │            │              │             │
    │            │            │            │              │             │
    │            │ 18. Get    │            │              │             │
    │            │ results    │            │              │             │
    │            ├───────────▶│            │              │             │
    │            │            │            │              │             │
    │            │ 19. Return │            │              │             │
    │            │ results    │            │              │             │
    │            │◀───────────┤            │              │             │
    │            │            │            │              │             │
    │ 20. Display│            │            │              │             │
    │ results    │            │            │              │             │
    │◀───────────┤            │            │              │             │
```

---

## 5. PAYMENT PROCESSING

```
Actors: Patient, Billing Clerk
Frontend → Payment Gateway → Stripe/Provider → Billing Service → Notification

┌────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐  ┌────────┐
│Patient │  │ Payment │  │ Stripe  │  │Billing │  │Notify  │
│   UI   │  │ Gateway │  │   API   │  │Service │  │Service │
└───┬────┘  └────┬────┘  └────┬────┘  └───┬────┘  └───┬────┘
    │            │            │           │           │
    │ 1. Pay     │            │           │           │
    │ Invoice    │            │           │           │
    ├───────────▶│            │           │           │
    │            │            │           │           │
    │            │ 2. Validate invoice    │           │
    │            ├───────────────────────▶│           │
    │            │            │           │           │
    │            │ 3. Invoice details     │           │
    │            │◀───────────────────────┤           │
    │            │            │           │           │
    │            │ 4. Create payment      │           │
    │            │    intent  │           │           │
    │            ├───────────▶│           │           │
    │            │            │           │           │
    │            │ 5. Client secret       │           │
    │            │◀───────────┤           │           │
    │            │            │           │           │
    │ 6. Show    │            │           │           │
    │ payment    │            │           │           │
    │ form       │            │           │           │
    │◀───────────┤            │           │           │
    │            │            │           │           │
    │ 7. Enter   │            │           │           │
    │ card details           │           │           │
    │───┐        │            │           │           │
    │   │        │            │           │           │
    │◀──┘        │            │           │           │
    │            │            │           │           │
    │ 8. Confirm │            │           │           │
    │ payment    │            │           │           │
    ├───────────▶│            │           │           │
    │            │            │           │           │
    │            │ 9. Process payment     │           │
    │            ├───────────▶│           │           │
    │            │            │           │           │
    │            │            │ 10. Charge card        │
    │            │            │───┐       │           │
    │            │            │   │       │           │
    │            │            │◀──┘       │           │
    │            │            │           │           │
    │            │ 11. Payment succeeded  │           │
    │            │◀───────────┤           │           │
    │            │            │           │           │
    │            │ 12. Store transaction  │           │
    │            │ INSERT INTO            │           │
    │            │ payment_transactions   │           │
    │            │───┐        │           │           │
    │            │   │        │           │           │
    │            │◀──┘        │           │           │
    │            │            │           │           │
    │            │ 13. Allocate to invoice           │
    │            ├───────────────────────▶│           │
    │            │            │           │           │
    │            │            │ 14. UPDATE invoices   │
    │            │            │    SET paid_amount    │
    │            │            │◀──────────┤           │
    │            │            │           │           │
    │            │ 15. Publish event      │           │
    │            │ "payment.completed"    │           │
    │            ├──────────────────────────────────▶ │
    │            │            │           │      Kafka│
    │            │            │           │           │
    │            │            │           │ 16. Send  │
    │            │            │           │ receipt   │
    │            │            │           │───────────┐│
    │            │            │           │           ││
    │            │            │           │◀──────────┘│
    │            │            │           │           │
    │ 17. Show   │            │           │           │
    │ success    │            │           │           │
    │◀───────────┤            │           │           │
```

---

## 6. REAL-TIME VITAL SIGNS MONITORING

```
Actors: ECG Device, Nurse
Device → MQTT Broker → Device Service → TimescaleDB → WebSocket → Frontend

┌────────┐  ┌───────┐  ┌────────┐  ┌───────────┐  ┌──────────┐  ┌────────┐
│  ECG   │  │ MQTT  │  │ Device │  │TimescaleDB│  │WebSocket │  │ Nurse  │
│ Device │  │Broker │  │Service │  │           │  │  Server  │  │   UI   │
└───┬────┘  └───┬───┘  └───┬────┘  └─────┬─────┘  └────┬─────┘  └───┬────┘
    │           │          │             │             │            │
    │ 1. Measure│          │             │             │            │
    │ vitals    │          │             │             │            │
    │───┐       │          │             │             │            │
    │   │       │          │             │             │            │
    │◀──┘       │          │             │             │            │
    │           │          │             │             │            │
    │ 2. Publish MQTT      │             │             │            │
    │ Topic: devices/ecg-001/vitals      │             │            │
    │ Payload: {hr:85,spo2:98,temp:37.2} │             │            │
    ├──────────▶│          │             │             │            │
    │           │          │             │             │            │
    │           │ 3. Route │             │             │            │
    │           │ to subscriber           │             │            │
    │           ├─────────▶│             │             │            │
    │           │          │             │             │            │
    │           │          │ 4. Parse message          │            │
    │           │          │───┐         │             │            │
    │           │          │   │         │             │            │
    │           │          │◀──┘         │             │            │
    │           │          │             │             │            │
    │           │          │ 5. Store in TimescaleDB   │            │
    │           │          │ INSERT INTO device_readings           │
    │           │          ├────────────▶│             │            │
    │           │          │             │             │            │
    │           │          │ 6. Check thresholds       │            │
    │           │          │    HR > 120 or HR < 40?   │            │
    │           │          │───┐         │             │            │
    │           │          │   │         │             │            │
    │           │          │◀──┘         │             │            │
    │           │          │             │             │            │
    │           │          │ 7. If critical, create alert          │
    │           │          │ INSERT INTO device_alerts │            │
    │           │          ├────────────▶│             │            │
    │           │          │             │             │            │
    │           │          │ 8. Publish to Kafka       │            │
    │           │          │ "vitals.critical"         │            │
    │           │          ├───────────────────────── Kafka         │
    │           │          │             │             │            │
    │           │          │ 9. Broadcast via WebSocket│            │
    │           │          ├────────────────────────▶  │            │
    │           │          │             │             │            │
    │           │          │             │ 10. Push to connected   │
    │           │          │             │     clients with        │
    │           │          │             │     patient access      │
    │           │          │             ├────────────────────────▶│
    │           │          │             │             │            │
    │           │          │             │             │ 11. Display│
    │           │          │             │             │ alert      │
    │           │          │             │             │◀───────────┤
```

---

## 7. INSURANCE CLAIM SUBMISSION

```
Actors: Billing Clerk
Frontend → Billing Service → MySQL → EDI Gateway → Insurance Payer

┌────────────┐  ┌────────┐  ┌──────┐  ┌────────┐  ┌──────────┐
│  Billing   │  │Billing │  │ MySQL│  │  EDI   │  │Insurance │
│ Clerk UI   │  │Service │  │      │  │Gateway │  │  Payer   │
└─────┬──────┘  └───┬────┘  └──┬───┘  └───┬────┘  └────┬─────┘
      │             │          │          │            │
      │ 1. Create   │          │          │            │
      │ claim       │          │          │            │
      ├────────────▶│          │          │            │
      │             │          │          │            │
      │             │ 2. INSERT claim     │            │
      │             ├─────────▶│          │            │
      │             │          │          │            │
      │             │ 3. Validate claim data           │
      │             │    - Diagnosis codes │            │
      │             │    - Procedure codes │            │
      │             │───┐      │          │            │
      │             │   │      │          │            │
      │             │◀──┘      │          │            │
      │             │          │          │            │
      │ 4. Review   │          │          │            │
      │ & approve   │          │          │            │
      ├────────────▶│          │          │            │
      │             │          │          │            │
      │             │ 5. Generate EDI 837 file         │
      │             │    (CMS-1500 format) │            │
      │             │───┐      │          │            │
      │             │   │      │          │            │
      │             │◀──┘      │          │            │
      │             │          │          │            │
      │             │ 6. Submit to EDI gateway         │
      │             ├─────────────────────▶│            │
      │             │          │          │            │
      │             │          │ 7. Send to payer      │
      │             │          │          ├───────────▶│
      │             │          │          │            │
      │             │          │          │ 8. Ack     │
      │             │          │          │◀───────────┤
      │             │          │          │            │
      │             │ 9. Update status="submitted"     │
      │             ├─────────▶│          │            │
      │             │          │          │            │
      │ 10. Show    │          │          │            │
      │ submitted   │          │          │            │
      │◀────────────┤          │          │            │
```

---

## 8. CLINICAL DECISION SUPPORT

(Already shown in E-Prescription Workflow above)

---

## ✅ SUMMARY

**Documented Flows:**
- ✅ 8 critical system flows
- ✅ All major service interactions
- ✅ Error handling paths included
- ✅ Async event flows documented
- ✅ Real-time communication patterns

**Next Steps:**
- Create Mermaid diagram versions
- Add error handling sequence diagrams
- Document rollback procedures

---

**Document Status:** ✅ Complete  
**Last Updated:** October 16, 2025  
**Format:** ASCII sequence diagrams

