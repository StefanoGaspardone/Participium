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
- [Test Users](#test-users)

## Overview

### System General Goal

The Municipality of Turin is developing Participium, a web application for citizen participation in the
management of urban environments. It allows citizens to interact with the public administration by reporting
inconveniences and malfunctions present in the area (e.g., potholes in the asphalt, sidewalks with
architectural barriers, trash on the streets, non-functioning streetlights, etc.). A real example of such an
application is the [Iris platform in Venice](https://iris.sad.ve.it/?id_ente=c_l736).

### Reports

Citizens can submit reports only if they have registered in the system with email , username, first name, and
last name. Once a registration is completed, the user gets and email with a confirmation code. The person can use the application only after confirming by eneting the valid for 30 minutes.  
Once registered, the citizen can make reports by selecting a point on the Turin map (based on
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

If the intervention has been done by maintainers of an external company (e.g. Enel X for category Public Lighting, or specific reports based on their content), two cases are possible:

- Case 1: the company has access to Participium. In that case, the specific technical office assigns the report corresponding company users. External maintainers can move the report, but this will not be visible to the reporter (and neither to citizens). Once the work is finished, the external maintainer can resolve the report.

N.B. Automatic assignment of all issues of a certain category (thus, without the initial review of the municipal public relations officer) is possible only if previously set by the municipak administrator.

- Case 2: the company has NOT access to Participium. In this case, the external company updates the technical office out of Participium, and when the issues are resolved, the thechnical officer staff member will move the report to status _Resolved_.

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

Unregistered users can also view reports on maps. Both registered and unregistered users can type an address into the search bar to zoom in on that area of the map and see all reports in that area.

When logged into Participium, citizens can follow reports of other citizens and receive notifications (following the same rules as for owned reports).

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
  To stop the container you can use `docker compose down` (`[-d]` if you want to remove and empty it).

- Populate the database
  
  ```bash
  npm run populate-db
  ```

  The script will populate the database with all the necessaries entities, such as predefined Categories e Technical Staff Member Roles, and some [test users](#test-users).

- Run the server

  ```bash
  npm run dev
  ```

  The server will be running at <http://localhost:3000>.

  An API documentation is available at <http://localhost:3000/api/docs>.

  Moreover, the [telegram bot](#telegram-bot) is initialized and will be running at <https://t.me/ParticipiumSE05Bot>.

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
  - Then, it will ask for the Participium account password.
  - If success, you are able to play with the bot; otherwise, specific error messages are shown.

- `/new_report`: Starts a guided, multi‑step flow to submit a new report.
  - Step 1 - Location: send your location (must be inside the Municipality of Turin).
  - Step 2 - Title: send a short title.
  - Step 3 - Description:  send a detailed description of the issue. 
  - Step 4 - Category: choose from the inline keyboard (categories are loaded from the server).
  - Step 5 - Images: send 1-3 photos. When done, send `/done`.
  - Step 6 - Anonymous: choose Yes/No for anonymous submission, then the bot submits the report, replying with the new created report ID.

- `/done`: Completes the photo submission step during report creation.  Use this command after uploading 1-3 photos in the `/new_report` flow.

- `/my_reports`: View a list of all reports you have submitted, along with their current status (e. g., Pending Approval, Assigned, In Progress, Suspended, Rejected, Resolved). You can click on a report to see more details.

- `/report_status [ID]`: Get detailed information about a specific report by providing its ID number (e.g., `/report_status 123`). This command shows the report's title, description, category, and current status. Works only for reports you have access to.

- `/help`: Display a comprehensive list of all available commands with usage instructions and information about how the bot works.

- `/contact`: Get official contact information for the City of Torino Public Works Department and Participium technical support team, including phone numbers, emails, and office hours.

- `/faq`: Read a list of Frequently Asked Questions covering topics like report types, anonymity, photo uploads, status meanings, resolution times, and more.

## Test Users

These accounts are created after executing `npm run populate-db`.

| Role | Username | Password | Email | First Name | Last Name |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Administrator | admin | admin | <admin@gmail.com> | Stefano | Lo Russo |
| Municipal Administrator | munadm | password | <munadm@part.se> | Giorgio | Turio |
| Public Relations Officer | pro | password | <pro@part.se> | Carlo | Ultimo |
| Techinal Staff Member (Organization office) | tsm1 | password | <tsm1@part.se> | Carmine | Conte |
| Techinal Staff Member (Public Services Division) | tsm2 | password | <tsm2@part.se> | Carmine | Conte |
| Techinal Staff Member (Environmental Quality Division) | tsm3 | password | <tsm3@part.se> | Carmine | Conte |
| Techinal Staff Member (Green Areas, Parks and Animal Welfare Division) | tsm4 | password | <tsm4@part.se> | Carmine | Conte |
| Techinal Staff Member (Infrastructure Division) | tsm5 | password | <tsm5@part.se> | Carmine | Conte |
| Techinal Staff Member (General Services Division) | tsm6 | password | <tsm6@part.se> | Carmine | Conte |
| Citizen | user | user | <user@gmail.com> | Francesco | Totti |
