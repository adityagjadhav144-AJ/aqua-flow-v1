# AquaFlow Pune: Role-Based Registration & Secure Authentication Portal

AquaFlow Pune requires a dedicated authentication and onboarding portal to prevent unauthorized access, order tampering, and preserve public civic trust across Pune Municipal Corporation (PMC) water delivery operations. This plan details the implementation of a strict authentication wall, a role-specific onboarding wizard covering all six system roles, simulated 6-digit mobile OTP verification, instant municipal trust badge issuance, and quick-access credentials for evaluators.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The three core operational decisions for this registration & login system have been confirmed in Phase 1:

- **Confirmed Decision 1 (Verification Standard)**: Interactive **Mobile OTP simulation with instant 6-digit verification** is enforced across all registrations to authenticate Pune contact numbers before issuance of role credentials.
- **Confirmed Decision 2 (Entry Gate Posture)**: A **strict login wall** will be enforced on initial app load. Unauthenticated users cannot view or manipulate active resident bookings, driver dispatches, or municipal oversight dashboards without logging in or completing registration.
- **Confirmed Decision 3 (Role Activation & Vetting)**: All roles—including sensitive municipal officers and fleet vendors—undergo **immediate activation with instant role badge verification** upon successful OTP validation and credential entry, ensuring evaluators and users can immediately access active role dashboards without waiting for external offline queues.

---

## 1. Overview & Core Concept

### What It Does
Provides an authentic Pune civic gateway for **AquaFlow Pune** that greets visitors with a secure portal offering two distinct pathways:
1. **Role-Specific Registration Wizard**: A multi-step onboarding journey where users select their operational role (Resident, Society Admin, Commercial Tanker Driver, Vendor Fleet Operator, PMC Municipal Officer, or Platform Ops), fill in authenticated credentials and statutory IDs (e.g. PMC Vendor License, RERA Society Reg, Commercial Driving License, PMC Employee ID), verify via a live 6-digit SMS OTP modal, and receive an instant role badge.
2. **Secure Login & Quick-Fill Directory**: Secure phone/email credential login with saved Pune demo profiles for all 6 roles (`neha.resident`, `santosh.driver`, `rajesh.society`, `meena.vendor`, `pmc.officer`, `admin.ops`), enabling evaluators to test each role's dashboard effortlessly.
3. **Session Lifecycle & Role Isolation**: Once logged in, the active session is locked to the authenticated user's permissions, with a dedicated top-bar profile popover displaying the user's verified PMC badge, phone number, ward, and an instant "Sign Out / Switch Role" action.

### Target Audience & Personas
- **Pune Residents**: Homeowners and tenants in water-stressed zones (Baner, Wakad, Hinjewadi, Hadapsar, Kharadi) requiring secure tanker deliveries and verified OTP dispatch.
- **Society Admins**: Housing society chairpersons managing collective 10,000L–20,000L sumps and society escrow billing.
- **Water Tanker Drivers**: Licensed commercial heavy-vehicle drivers servicing Pune routes and updating real-time GPS telemetry.
- **Vendor Fleet Owners**: Water suppliers operating multi-tanker fleets certified by PMC.
- **Municipal Water Officers (PMC)**: City engineers monitoring ward quotas, potable water safety, and emergency rationing.
- **Platform Operations**: Grid dispatchers managing grievance queues and system telemetry.

### Key Value Delivered
- **Eliminates Order Tampering**: Guarantees that only authorized residents create orders and only registered drivers accept and fulfill them.
- **Restores Civic Trust**: Drivers and vendors display certified PMC QR and badge numbers, eliminating counterfeit or uncertified private water cartels.
- **Seamless Localized UX**: Complete bilingual support (English and Marathi - मराठी) with authentic PMC water department styling and high-density legibility.

---

## 2. User Experience & Visual Design

### Key User Flows

#### A. Zero-State: The Strict Civic Login Wall
When the user visits AquaFlow Pune without an active session:
- The screen renders the **AquaFlow Pune Civic Gateway** (`AuthPortal.tsx`) featuring official PMC civic branding, live water grid status ticker (non-invasive), and a two-tab selector: **"Sign In"** (`लॉग इन`) and **"Register Account"** (`नवीन नोंदणी`).
- The previous unrestricted role dropdown in the header is disabled until a user logs in.

#### B. The 6-Role Registration Wizard (`RegisterWizard.tsx`)
1. **Step 1: Role Selection**: Visual grid of the 6 roles with role descriptions, trust levels, and authority scope:
   - 🏠 **Resident** (`नागरिक`): Personal domestic water booking & escrow tracking.
   - 🏢 **Society Admin** (`सोसायटी प्रशासन`): Multi-family bulk sumps & quota allocations.
   - 🚛 **Tanker Driver** (`टँकर चालक`): Real-time delivery, GPS telemetry & water source check-in.
   - 🏗️ **Vendor Fleet** (`पाणी पुरवठादार`): Fleet capacity, certified water test logs & driver management.
   - 🏛️ **Municipal Officer (PMC)** (`पुणे महानगरपालिका अधिकारी`): Ward quotas, rationing controls & quality oversight.
   - ⚙️ **Platform Ops** (`प्रणाली नियंत्रक`): Emergency dispatch, dispute arbitration & server telemetry.
2. **Step 2: Role-Specific Credentials & Statutory Details**:
   - Dynamic form tailored strictly to the selected role:
     - *Resident*: Full Name, Mobile (+91), Pune Ward / Zone selector, Complete Address, Landmark.
     - *Driver*: Full Name, Mobile, Commercial Driving License No, Assigned Tanker Registration (e.g., `MH-12 RN 8842`), Fleet Vendor Affiliation.
     - *Society Admin*: Admin Name, Society Name, PMC Ward, Total Flats, Sump Capacity (Litres), RERA / Society Registration No.
     - *Vendor Fleet*: Agency/Company Name, Proprietor Name, PMC Water Extraction Permit No, Active Fleet Size, Base Depot Location.
     - *Municipal Officer*: Officer Name, PMC Employee Code (`PMC-WTR-xxxx`), Department / Ward Division (Bhavani Peth, Aundh, Kothrud, etc.), Official Designation.
     - *Platform Ops*: Operator Name, Employee ID, Security Clearance Passcode.
3. **Step 3: 6-Digit Mobile OTP Simulation**:
   - Simulated Indian SMS delivery interface displaying: `"OTP sent to +91 XXXXX XXXXX"`.
   - 6 individual auto-advancing digit input fields with automatic clipboard paste support.
   - Quick "One-Click Auto-Fill OTP" button for evaluator convenience, plus a 30-second resend timer.
4. **Step 4: Instant Role Badge & Dashboard Launch**:
   - High-fidelity PMC verification card displaying:
     - Verified Green Checkmark with Gold Civic Trim.
     - Official ID Badge (e.g., `PMC-RES-2026-8812` or `PMC-OFF-9901`).
     - Issued timestamp, Ward Jurisdiction, and Trust Score (100%).
   - "Enter Dashboard" primary CTA button immediately launching the user into their respective role view.

#### C. Sign-In & Saved Evaluator Credentials (`LoginView.tsx`)
- Standard Sign-In tab allowing login via registered Mobile Number / Email and Password.
- **Saved Credentials Directory**: A collapsible quick-fill panel displaying 6 pre-configured verified personas:
  - `Neha Deshpande` (Resident · Baner Ward)
  - `Santosh Shinde` (Driver · MH-12 RN 8842)
  - `Rajesh Kulkarni` (Society Admin · Megapolis Sump)
  - `Meena Patil` (Vendor Fleet · Shivneri Water Carriers)
  - `Anil Gokhale` (Municipal Officer · PMC Water Dept)
  - `AquaFlow Ops Team` (Platform Ops · Grid Master)
- Clicking any persona instantly loads credentials, authenticates the session, and transitions into the corresponding dashboard.

#### D. Top Bar Session Management & Sign Out
- When authenticated, the top header replaces the public role switcher with an authenticated **User Identity Capsule**:
  - Displays avatar, user name, role label, and verified PMC badge.
  - Clicking opens an account drawer showing account details, current zone, wallet balance, and a clear **"Sign Out"** button.
  - Signing out clears the active session and returns safely to the login wall.

### Visual Identity & Theme
- **Color Discipline**: Strict 60-30-10 distribution using clean off-white/cyan neutral canvas (`#F4FAFB`), structural deep slate (`#0F172A`), rich PMC navy (`#0284C7`), and high-intent emerald green (`#059669`) for verified badges.
- **Typography**: Clean display sans (`Plus Jakarta Sans`) paired with tabular figures (`font-mono tabular-nums`) for phone numbers, vehicle numbers, and OTP digit boxes.
- **Zero-Pill Discipline**: Unboxed metadata with typographic dot separators (`·`). Interactive role selectors styled as tactile segmented cards with subtle 1px border highlights, avoiding garish candy capsules.
- **Bilingual Nuance**: All labels, placeholders, errors, and success states provided in authentic Marathi (मराठी) and English.

---

## 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Rationale | Alternatives Considered |
|---|---|---|---|
| **Authentication Enforcement** | Strict Login Wall (`isAuthenticated: boolean` in store) | Prevents unauthorized visitors from placing fake bookings or accessing municipal rationing panels, directly resolving the user's civic trust concern. | Soft banner warning (rejected: leaves routes vulnerable to unauthorized actions). |
| **Verification Method** | Interactive 6-Digit Mobile OTP Simulation with Auto-Fill | Matches standard Indian civic & logistics apps (mSeva, Cowin, Zomato, Rapido) while remaining zero-friction for evaluators without real SMS carrier costs. | Password-only (rejected: unrealistic for drivers & field operators). Real SMS gateway (rejected: requires external Twilio/Gupshup API keys). |
| **Vetting Turnaround** | Instant PMC Badge Verification Upon OTP Completion | Ensures immediate full-feature access for all roles during testing and evaluation while establishing the visual and procedural legitimacy of the verification workflow. | Manual admin review queue (rejected: would block user from testing municipal/vendor views). |
| **Evaluator Navigation** | Quick-Fill Demo Personas Panel | Balances strict security with instant evaluation velocity: testers can either register fresh accounts or click 1-click test personas for each role. | Forcing manual registration 6 times (rejected: tedious for reviewers testing all roles). |

---

## 4. Technical Architecture & Data Strategy

### System Component & State Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                                App.tsx                                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           │                                                 │
   [!isAuthenticated]                                [isAuthenticated]
           ▼                                                 ▼
┌─────────────────────────────────────┐           ┌──────────────────────┐
│       AuthPortal Component          │           │ Header (with Profile │
│                                     │           │  & Sign Out Drawer)  │
│ ┌─────────────────┬───────────────┐ │           └──────────┬───────────┘
│ │   LoginView     │ RegisterWizard│ │                      │
│ │                 │               │ │                      ▼
│ │ - Phone/Email   │ 1. Select Role│ │           ┌──────────────────────┐
│ │ - Password      │ 2. Details    │ │           │ Role-Specific View   │
│ │ - 6 Demo Profiles│ 3. 6-Digit OTP││           │ - ResidentView       │
│ │   (Quick Fill)  │ 4. Issued Badg│ │           │ - DriverView         │
│ └─────────────────┴───────────────┘ │           │ - SocietyView        │
└──────────────────┬──────────────────┘           │ - VendorView         │
                   │                              │ - MunicipalView      │
                   ▼                              │ - OpsView            │
┌─────────────────────────────────────┐           └──────────────────────┘
│       useAppStore & db.ts           │
│                                     │
│ - isAuthenticated: boolean          │
│ - currentUser: User                 │
│ - currentRole: Role                 │
│ - login(id, role)                   │
│ - registerUser(role, details)       │
│ - verifyOtp(code)                   │
│ - logout()                          │
└─────────────────────────────────────┘
```

### Data Model Enhancements (`src/types.ts`)
- Add verification metadata to `User`:
  ```typescript
  export interface UserVerification {
    isVerified: boolean;
    verificationBadgeId: string;
    verifiedAt: string;
    statutoryIdType: 'PMC_EMP_ID' | 'COMMERCIAL_DL' | 'RERA_SOCIETY' | 'PMC_VENDOR_PERMIT' | 'RESIDENT_AADHAAR_MASKED';
    statutoryIdValue: string;
    phoneOtpVerified: boolean;
  }
  ```
- Store authenticated session status in `useAppStore`:
  ```typescript
  isAuthenticated: boolean;
  login: (userId: string) => void;
  registerUser: (payload: RegistrationPayload) => Promise<User>;
  logout: () => void;
  ```

### Interactive State Transitions
1. **Registration Step 1 $\to$ 2**: Selecting role triggers form schema validation specific to that role.
2. **Registration Step 2 $\to$ 3**: Submitting details generates a simulated 6-digit verification code (`942 618`) stored in component state and initiates a simulated push toast.
3. **Registration Step 3 $\to$ 4**: Inputting the code validates against the generated code, generates a permanent `User` record in `db.ts`, and transitions to the celebration badge view.
4. **Completion**: "Enter AquaFlow" sets `currentUser` and `currentRole`, turns `isAuthenticated = true`, and mounts the active workspace.
5. **Sign Out**: Clicking "Sign Out" in the header popover resets `isAuthenticated = false`, unmounts the workspace, and displays the login portal.

---

## 5. Verification & Quality Plan

1. **Compilation & Type Safety**:
   - Run `compile_applet` to ensure TypeScript compiles with 0 errors across new auth components.
   - Run `lint_applet` to maintain 0 ESLint warnings.
2. **Interactive Flow Testing**:
   - Register a new **Municipal Officer** with employee ID and verify 6-digit OTP $\to$ verify immediate access to MunicipalView with verified officer badge.
   - Register a new **Driver** with vehicle registration and commercial DL $\to$ verify immediate access to DriverView.
   - Test **Quick-Fill Demo Credentials** for all 6 roles to confirm instant one-click switching.
   - Verify **Sign Out** returns securely to the login portal.
   - Verify bilingual English/Marathi toggling works seamlessly across all auth screens.
