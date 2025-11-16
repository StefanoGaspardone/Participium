# Participium

## Table of Contents

- [Overview](#overview)
  - [System General Goal](#system-general-goal)
  - [Reports](#reports)
  - [Report Lifecycle](#report-lifecycle)
  - [Citizen Updates](#citizen-updates)
  - [Statistics](#statistics)
  - [Interaction with Telegram Bot](#interaction-with-telegram-bot)
- [How To Run](#how-to-run)
  - [Dependencies](#dependencies)
  - [Clone The Repository](#clone-the-repository)
  - [Run The Backend](#run-the-backend)
  - [Run The Frontend](#run-the-frontend)
- [Telegram Bot](#telegram-bot)
  - [Setup](#setup)
  - [Commands](#commands)

## Overview

### System General Goal

The Municipality of Turin is developing Participium, a web application for citizen participation in the
management of urban environments. It allows citizens to interact with the public administration by reporting
inconveniences and malfunctions present in the area (e.g., potholes in the asphalt, sidewalks with
architectural barriers, trash on the streets, non-functioning streetlights, etc.). A real example of such an
application is the [Iris platform in Venice](https://iris.sad.ve.it/?id_ente=c_l736).

### Reports

Citizens can submit reports only if they have registered in the system with email , username, first name, and
last name. Once registered, the citizen can make reports by selecting a point on the Turin map (based on
OpenStreetMap, standard layer) and filling out a form with the following required fields: title, textual
description, and category (chosen from a list). It is also mandatory to attach one or more photos (up to 3
per report).

The possible problem categories, at the moment of system design, are:

- Water Supply – Drinking Water
- Architectural Barriers
- Sewer System
- Public Lighting
- Waste
- Road Signs and Traffic Lights
- Roads and Urban Furnishings
- Public Green Areas and Playgrounds
- Other

After entering all the required information and any pictures, the system asks the citizen if he/she wants the
report to be anonymous (name not visible in the public list of reports).

### Report Lifecycle

Once submitted, the report is in the _Pending Approval_ state until the Organization Office of the Municipality
of Turin performs a preliminary verification, marking the report as either accepted or rejected.
The possible report statuses are: _Pending Approval_, _Assigned_, _In Progress_, _Suspended_, _Rejected_, _Resolved_

- After approval, accepted reports move to the _Assigned_ state, and they are sent to the competent
  technical office depending on the problem category.
- Once the intervention is scheduled, the status changes to _In Progress_, indicating resolution has
  started.
- In some cases, for organizational or technical reasons, the report may be set to _Suspended_, awaiting
  further evaluation or resources.
- When the problem is resolved, the specific technical office updates the status to _Resolved_ and closes
  the report. The technicall office staff member can add comments
- In case of rejection, an explanation from the Municipality Organization Office is mandatory (see next
  section).

### Citizen Updates

To strengthen trust between citizens and institutions, citizens can be updated about their reports through
various channels:

- At each status change, the citizen receives notification in the platform with the corresponding
  update.
- Municipal operators working on reports can also send messages to the citizens in the platform, to
  which the citizen can reply.
- Each time a citizen receives a platform notification, he/she also receives an email (unless disabled in
  their configuration panel, where citizens can also upload a personal photo and their Telegram
  username).

After approval, accepted reports immediately become visible on the Participium portal. They appear both:

- On an interactive map of Turin, geolocated at the point indicated by the citizen.
- In a summary table, which allows filtering and sorting by category, status, or period of time. The data
  from the table (in case, filtered) can be downloaded as a csv file.

In both views, the reporterʼs name is shown (“anonymous” if that option was chosen), along with the report
title. Clicking the title opens the full description (with pictures).

### Statistics

The system allows the display of both public and private statistics.

- _Public statistics_ (visible on the site) include the number of reports by category and trends by day,
  week, or month. They are visible also to unregistered users.
- _Private statistics_ (for administrators only), in addition to public ones, also include charts and tables
  about:
  - number of reports by status
  - number of reports by type
  - number of reports by type and status
  - number of reports by reporter
  - number of reports by reporter and type
  - number of reports by reporter, type and status
  - number of reports by the top 1% of reporters, by type
  - number of reports by the top 5% of reporters, by type

### Interaction with Telegram Bot

Finally, any citizen who has provided their Telegram username can communicate with a Telegram bot to:

- Create a new report, following a guided process
- Check the status of their own reports, receiving an updated list with any changes.
- Receive real-time push notifications when their report changes status.
- Get quick assistance through commands that provide system usage info and useful contacts.

## How To Run

### Dependencies

- Docker Desktop
- Node
- npm
- Git

### Clone The Repository

```bash
git clone https://github.com/StefanoGaspardone/Participium.git
```

### Run The Backend

- Navigate to the server folder

  ```bash
  cd server
  ```

- Install dependencies

  ```bash
  npm install
  ```

- Run the docker database container

  ```bash
  cd docker/postgres
  docker-compose up -d
  ```

  Make sure to have Docker Desktop installed and running before executing the command.

- Run the server

  ```bash
  npm run dev
  ```

  The server will be running at <http://localhost:3000>.

  A swagger documentation is available at <http://localhost:3000/api/docs>.

  Moreover, the [telegram bot](#telegram-bot) is initialized and running at <https://t.me/ParticipiumSE05Bot>.

### Run The Frontend

- Navigate to the client folder

  ```bash
  cd client
  ```

- Install dependencies

  ```bash
  npm install
  ```

- Run the client

  ```bash
  npm run dev
  ```

  The client will be running at <http://localhost:5173>.

## Telegram Bot

The Participium Telegram bot helps citizens create reports directly from Telegram and receive updates.

### Setup

- Bot URL: <https://t.me/ParticipiumSE05Bot>
- The bot starts automatically when the backend starts.
- Make sure to set your Telegram username in Telegram settings (e.g., `@yourusername`).

### Commands

- `/start`: Shows a welcome message and basic instructions.

- `/connect`: Links your Participium account to your Telegram username.
  - Prerequisites: set your Telegram username in Telegram settings (e.g., `@yourusername`).
  - The bot matches your Telegram username to a registered user in Participium.
  - If not found, complete registration on the web app and set your username there.
  
- `/new_report`: Starts a guided, multi‑step flow to submit a new report.
  - Step 1 – Location: send your location (must be inside the Municipality of Turin).
  - Step 2 – Title: send a short title.
  - Step 3 – Description: send a detailed description of the issue.
  - Step 4 – Category: choose from the inline keyboard (categories are loaded from the server).
  - Step 5 – Images: send 1–3 photos. When done, send `/done`.
  - Step 6 – Anonymous: choose Yes/No for anonymous submission, then the bot submits the report.
