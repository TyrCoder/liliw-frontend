# Liliw Virtual Guide — System Flowcharts

*Visual process flows for the Liliw Virtual Guide platform. Diagrams are written in
Mermaid syntax and render automatically on GitHub and most Markdown viewers.*

---

## Table of Contents

1. [Overall System Flow](#1-overall-system-flow)
2. [Account Registration and Login](#2-account-registration-and-login)
3. [Content Publishing Workflow](#3-content-publishing-workflow)
4. [QR Check-In and Points Flow](#4-qr-check-in-and-points-flow)
5. [Business Owner (LBO) Application Flow](#5-business-owner-lbo-application-flow)
6. [AI Itinerary Planning Flow](#6-ai-itinerary-planning-flow)
7. [Itinerary Checklist Flow](#7-itinerary-checklist-flow)
8. [Content Change-Request Flow (LBO)](#8-content-change-request-flow-lbo)
9. [Role and Access Overview](#9-role-and-access-overview)

---

## 1. Overall System Flow

High-level view of how a visit to the system proceeds, from arrival to the major paths
available to each kind of user.

```mermaid
flowchart TD
    Start([Visitor opens the website]) --> Browse{Has an account?}

    Browse -- No --> Public[Browse attractions, stories, map, chatbot\nno account needed]
    Public --> WantAccount{Wants to check in,\nsave trips, or review?}
    WantAccount -- No --> End1([Continues browsing])
    WantAccount -- Yes --> Register[Create an account]
    Register --> Login

    Browse -- Yes --> Login[Sign in]
    Login --> RoleCheck{What role does\nthis account have?}

    RoleCheck -- Tourist/Visitor --> TouristFlow[Explore, plan trips,\ncheck in, earn points]
    RoleCheck -- LBO --> LBOFlow[LBO Dashboard]
    RoleCheck -- CHATO Editor --> EditorFlow[CMS: create/edit content]
    RoleCheck -- CHATO Officer --> OfficerFlow[CMS: review/approve content]
    RoleCheck -- Administrator --> AdminFlow[Admin Dashboard]

    TouristFlow --> End2([Continues using the site])
    LBOFlow --> End2
    EditorFlow --> End2
    OfficerFlow --> End2
    AdminFlow --> End2
```

---

## 2. Account Registration and Login

```mermaid
flowchart TD
    A([Start]) --> B{New or\nreturning user?}

    B -- New --> C[Fill in username, email, password]
    C --> D{Meets password\n& username rules?}
    D -- No --> C
    D -- Yes --> E[Account created\nrole: Tourist]
    E --> F[Redirect to homepage]

    B -- Returning --> G[Enter email & password]
    G --> H{Credentials valid?}
    H -- No --> I{Forgot password?}
    I -- Yes --> J[Enter email]
    J --> K[Receive one-time code by email]
    K --> L[Enter code & set new password]
    L --> G
    I -- No --> G

    H -- Yes --> M{Account role?}
    M -- Tourist --> F
    M -- LBO --> N[Redirect to /lbo dashboard]
    M -- CHATO Editor / Officer / Admin --> O[Redirect to /admin dashboard\nCMS reached from there]
```

---

## 3. Content Publishing Workflow

Applies uniformly to all nine content types (Attractions, Events, News, Art Forms,
Artisans, Stories, FAQs, Itineraries, Community Events). Authoring and publishing are
performed by different roles, and every state change is logged.

```mermaid
flowchart TD
    A([Editor opens the CMS]) --> B[Create new entry\nor edit existing one]
    B --> C[Fill required fields,\nupload photos]
    C --> D{Automatic validation\npasses?}
    D -- No --> C
    D -- Yes --> E[Save as Draft]

    E --> F{Editor ready\nto publish?}
    F -- Not yet --> E
    F -- Yes --> G[Submit for Review]
    G --> H[Status: Pending]

    H --> I([CHATO Officer opens\nContent Approvals])
    I --> J[View entry —\ncompared against last\napproved version if an edit]
    J --> K{Approve or Reject?}

    K -- Approve --> L[Status: Approved]
    L --> M[Published live on the\npublic site]
    M --> N[Snapshot saved for\nfuture comparison]

    K -- Reject --> O[Write rejection reason]
    O --> P[Status: Rejected]
    P --> Q([Editor sees the reason,\nrevises the entry])
    Q --> C

    M --> R{Editor edits the\npublished entry later?}
    R -- Yes --> S[Status reverts to Draft\nremoved from public site]
    S --> F
    R -- No --> End([Stays live])

    L --> T{Admin/Officer\narchives it?}
    T -- Yes --> U[Status: Archived\nremoved from public site,\nhistory preserved]
    U --> V{Restored later?}
    V -- Yes --> E
```

---

## 4. QR Check-In and Points Flow

```mermaid
flowchart TD
    A([Visitor arrives at a listed\nattraction or business]) --> B[Finds the printed\nQR poster at the entrance]
    B --> C[Opens Scan in the app\nand allows camera access]
    C --> D[Scans the QR code]
    D --> E{Signed in?}
    E -- No --> F[Prompted to sign in\nor create an account]
    F --> D

    E -- Yes --> G[System reads the visitor's\ncurrent location]
    G --> H{Within the required\ndistance of the attraction?}
    H -- No --> I[Check-in rejected:\n\"You must be at the location\"]
    H -- Yes --> J{Already checked in\nhere recently?}
    J -- Yes --> K[Duplicate check-in prevented]
    J -- No --> L[Visit recorded]

    L --> M[Points awarded]
    M --> N{Achievement\nthreshold reached?}
    N -- Yes --> O[Achievement unlocked\nand shown to the visitor]
    N -- No --> P[Continue]

    L --> Q{This place is on a\nsaved itinerary?}
    Q -- Yes --> R[Itinerary checklist\nitem automatically ticked]
    Q -- No --> P

    L --> S[Review form becomes\navailable for this place]
```

---

## 5. Business Owner (LBO) Application Flow

```mermaid
flowchart TD
    A([Prospective business owner]) --> D[Opens Apply as a Business\nno account required to apply]

    D --> E[Fill in business name, owner,\ncontact, address, type,\npermit number - optional]
    E --> F[Submit application]
    F --> G[Status: Pending]

    A2([Already a signed-in tourist]) --> A3[Applies from\nProfile → Apply as LBO]
    A3 --> E

    G --> H([CHATO Officer reviews\nthe application])
    H --> I{Approve?}
    I -- No --> J[Application rejected]
    I -- Yes --> K[Status: Approved\nAccount role upgraded to LBO]

    K --> L[Owner signs in →\nauto-redirected to\nLBO Dashboard]
    L --> M[Views business details,\npublic listing, QR poster]

    M --> N{Needs a correction?}
    N -- Yes --> O[Submit a Change Request]
    O --> P([CHATO reviews the request])
    P --> Q{Approved?}
    Q -- Yes --> R[Public listing updated]
    Q -- No --> M

    M --> S[Submits monthly\nvisitor records]
    M --> T{Wants a 360° tour?}
    T -- Yes --> U[Requests a virtual tour\nCHATO schedules a shoot]
```

---

## 6. AI Itinerary Planning Flow

```mermaid
flowchart TD
    A([Visitor opens Itinerary\nand chooses "Plan with AI"]) --> B[Specifies trip length\nand interests]
    B --> C[Request sent to the\nAI planning service]
    C --> D[AI selects only from real,\npublished attractions,\ndining, and activities]
    D --> E{AI response\nvalid & complete?}
    E -- No --> F[Automatic retry with\nadjusted parameters]
    F --> D
    E -- Yes --> G[Day-by-day itinerary\ngenerated]

    G --> H[Road distances calculated\nbetween consecutive stops]
    H --> I{Routing service\navailable?}
    I -- Yes --> J[Road-accurate route drawn\non the map, one-way\nstreets respected]
    I -- No --> K[Straight-line distance shown\nas a fallback estimate]

    J --> L([Itinerary displayed\nwith map and schedule])
    K --> L

    L --> M{Visitor saves it?}
    M -- Yes --> N[Saved to profile\nbecomes a checklist]
    M -- No --> O([Itinerary remains\nunsaved])
```

---

## 7. Itinerary Checklist Flow

How a saved itinerary — AI-generated or curated — becomes a progress tracker.

```mermaid
flowchart TD
    A([Visitor saves an itinerary]) --> B[Each stop listed as\na checklist item]
    B --> C{Visitor checks in\nvia QR at a stop?}
    C -- No --> D[Item remains unchecked]
    C -- Yes --> E[System matches the\ncheck-in to the itinerary stop]
    E --> F[Checklist item marked\nas visited]
    F --> G{All stops\nchecked off?}
    G -- No --> H([Visitor continues\nthe itinerary])
    G -- Yes --> I([Itinerary complete])
```

---

## 8. Content Change-Request Flow (LBO)

How a business owner's requested correction reaches their public listing, without
letting them edit it directly.

```mermaid
flowchart TD
    A([LBO notices incorrect\ninformation on their listing]) --> B[Opens Requests tab\nin the LBO Dashboard]
    B --> C[Selects the field to change\nname, hours, fee, photos, etc.]
    C --> D[Describes the correction]
    D --> E[Submits the change request]
    E --> F[Status: Pending]

    F --> G([CHATO reviews the request\nagainst the current listing])
    G --> H{Approve?}
    H -- Yes --> I[Public listing updated\nrequest marked Resolved]
    H -- No --> J[Request declined\nwith a reason]

    I --> K([LBO sees the update\nreflected on their dashboard])
    J --> K
```

---

## 9. Role and Access Overview

Summary of what each role can and cannot do across the content lifecycle — the
separation of duties that underlies §3 and §5.

```mermaid
flowchart LR
    subgraph Tourist["Tourist / Visitor"]
        T1[Browse & search]
        T2[Check in via QR]
        T3[Earn points & rewards]
        T4[Write reviews *after visiting*]
        T5[Apply for LBO status]
    end

    subgraph LBO["Local Business Owner"]
        L1[View own business record]
        L2[Request listing changes]
        L3[Submit visitor records]
        L4[Request a virtual tour]
    end

    subgraph Editor["CHATO Editor"]
        E1[Create content]
        E2[Edit content]
        E3[Submit for review]
        E4[Upload media & narration]
        E5[Cannot approve own work]
    end

    subgraph Officer["CHATO Officer"]
        O1[Review pending content]
        O2[Approve or reject]
        O3[Approve LBO applications]
        O4[Cannot create or edit content]
    end

    subgraph Admin["Administrator"]
        A1[All Editor powers]
        A2[All Officer powers]
        A3[Manage user accounts]
        A4[Create staff accounts]
        A5[View reports & audit log]
    end
```

---

*Liliw Virtual Guide — Culture, History, Arts and Tourism Office (CHATO), Municipality of Liliw, Laguna.*
